import Animal from '../models/Animal.js';
import Transaction from '../models/Transaction.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { getMonthProfit, monthNow } from '../services/profitLoss.js';
import { transactionQuerySchema, reportQuerySchema } from '../validators/money.js';

const isObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

export const listTransactions = asyncHandler(async (req, res) => {
  const query = transactionQuerySchema.parse(req.query);
  const filter = { owner: req.user.id };
  if (query.month) filter.date = { $gte: `${query.month}-01`, $lte: `${query.month}-31` };
  if (query.animalId) filter.animal = query.animalId;
  const rows = await Transaction.find(filter).sort({ date: -1, createdAt: -1 }).limit(500);
  ok(res, rows);
});

export const createTransaction = asyncHandler(async (req, res) => {
  const { animalId, ...fields } = req.body;
  if (animalId) {
    const animal = await Animal.findOne({ _id: animalId, owner: req.user.id });
    if (!animal) throw new AppError(404, 'ANIMAL_NOT_FOUND', 'Animal not found');
  }
  const row = await Transaction.create({ ...fields, owner: req.user.id, animal: animalId || null });
  ok(res, row, 201);
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) throw new AppError(400, 'INVALID_ID', 'Invalid transaction id');
  const { animalId, ...fields } = req.body;
  if (animalId) {
    const animal = await Animal.findOne({ _id: animalId, owner: req.user.id });
    if (!animal) throw new AppError(404, 'ANIMAL_NOT_FOUND', 'Animal not found');
  }
  const row = await Transaction.findOneAndUpdate(
    { _id: id, owner: req.user.id },
    { $set: { ...fields, animal: animalId || null } },
    { new: true, runValidators: true }
  );
  if (!row) throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
  ok(res, row);
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isObjectId(id)) throw new AppError(400, 'INVALID_ID', 'Invalid transaction id');
  const row = await Transaction.findOneAndDelete({ _id: id, owner: req.user.id });
  if (!row) throw new AppError(404, 'TRANSACTION_NOT_FOUND', 'Transaction not found');
  ok(res, { deleted: true });
});

export const profitLossReport = asyncHandler(async (req, res) => {
  const query = reportQuerySchema.parse(req.query);
  ok(res, await getMonthProfit(req.user.id, query.month || monthNow()));
});

async function safeAlertFunction(paths, functionName, ownerId) {
  for (const path of paths) {
    try {
      const mod = await import(path);
      const fn = mod[functionName] ?? mod.default?.[functionName];
      if (typeof fn === 'function') {
        const result = await fn(ownerId);
        if (Array.isArray(result)) return result;
      }
    } catch (err) {
      if (err.code !== 'ERR_MODULE_NOT_FOUND') console.error(`Optional ${functionName} failed:`, err.message);
    }
  }
  return null;
}

async function optionalMilkModel() {
  try { const mod = await import('../models/MilkRecord.js'); return mod.default ?? mod.MilkRecord ?? null; }
  catch (err) { if (err.code === 'ERR_MODULE_NOT_FOUND') return null; throw err; }
}

export const dashboard = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const month = today.slice(0, 7);
  const [MilkRecord, profit, vaccineAlerts, milkAlerts, breedingAlerts] = await Promise.all([
    optionalMilkModel(),
    getMonthProfit(req.user.id, month),
    safeAlertFunction(['../services/vaccineEngine.js', '../services/healthAlerts.js'], 'getVaccineAlerts', req.user.id),
    safeAlertFunction(['../services/milkTrend.js', '../services/milkAlerts.js'], 'getMilkAlerts', req.user.id),
    safeAlertFunction(['../services/breedingCalc.js', '../services/breedingAlerts.js'], 'getBreedingAlerts', req.user.id),
  ]);

  const milkRows = MilkRecord ? await MilkRecord.find({ owner: req.user.id, date: today }).select('morningL eveningL').lean() : [];
  const alerts = [];
  if (vaccineAlerts) {
    for (const alert of vaccineAlerts) alerts.push({
      type: 'vaccine', level: alert.level || 'due_now', animalId: alert.animalId,
      animalName: alert.animalName || 'Animal', message: `${alert.vaccineName || 'Vaccine'}: ${alert.level || 'due now'}`,
      date: alert.dueDate || today,
    });
  }
  if (milkAlerts) {
    for (const alert of milkAlerts) alerts.push({
      type: 'milk', level: alert.level || 'warning', animalId: alert.animalId,
      animalName: alert.animalName || 'Animal',
      message: `Milk is lower than usual${Number.isFinite(Number(alert.dropPercent)) ? ` (${Math.round(alert.dropPercent)}% drop)` : ''}. Check feed, heat and the udder.`,
      date: today,
    });
  }
  if (breedingAlerts) {
    for (const alert of breedingAlerts) alerts.push({
      type: 'breeding', level: 'due_soon', animalId: alert.animalId,
      animalName: alert.animalName || 'Animal', message: String(alert.type || 'Breeding check').replaceAll('_', ' '), date: alert.date || today,
    });
  }

  // Until the other feature modules are merged, provide a basic vaccine fallback.
  if (!vaccineAlerts) {
    try {
      const { default: HealthEvent } = await import('../models/HealthEvent.js');
      const pending = await HealthEvent.find({ owner: req.user.id, kind: 'vaccine', status: 'pending', dueDate: { $lte: today } })
        .populate('animal', 'name').limit(10).lean();
      for (const event of pending) alerts.push({
        type: 'vaccine', level: event.dueDate < today ? 'overdue' : 'due_now',
        animalId: event.animal?._id?.toString(), animalName: event.animal?.name || 'Animal',
        message: `${event.name || 'Vaccine'} is ${event.dueDate < today ? 'overdue' : 'due today'}.`, date: event.dueDate || today,
      });
    } catch (err) { if (err.code !== 'ERR_MODULE_NOT_FOUND') throw err; }
  }

  ok(res, {
    todayMilkL: Math.round(milkRows.reduce((sum, row) => sum + Number(row.morningL || 0) + Number(row.eveningL || 0), 0) * 100) / 100,
    dueVaccinesCount: alerts.filter((alert) => alert.type === 'vaccine').length,
    monthProfit: profit.totals.profit,
    alerts: alerts.slice(0, 12),
  });
});
