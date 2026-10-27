import Animal from '../models/Animal.js';
import MilkRecord from '../models/MilkRecord.js';
import Breeding from '../models/Breeding.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { milkTrend, getMilkAlerts, MILK_DROP_MESSAGE } from '../services/milkTrend.js';
import { breedingCalc, getBreedingAlerts } from '../services/breedingCalc.js';

const validId = (id) => /^[a-f\d]{24}$/i.test(id);
const ownedAnimal = async (animalId, ownerId) => {
  if (!validId(animalId)) throw new AppError(400, 'INVALID_ID', 'Invalid animal id');
  const animal = await Animal.findOne({ _id: animalId, owner: ownerId });
  if (!animal) throw new AppError(404, 'ANIMAL_NOT_FOUND', 'Animal not found');
  return animal;
};
const ownedMilk = async (id, ownerId) => {
  if (!validId(id)) throw new AppError(400, 'INVALID_ID', 'Invalid milk record id');
  const row = await MilkRecord.findOne({ _id: id, owner: ownerId });
  if (!row) throw new AppError(404, 'MILK_RECORD_NOT_FOUND', 'Milk record not found');
  return row;
};
const ownedBreeding = async (id, ownerId) => {
  if (!validId(id)) throw new AppError(400, 'INVALID_ID', 'Invalid breeding record id');
  const row = await Breeding.findOne({ _id: id, owner: ownerId }).populate('animal');
  if (!row || !row.animal || String(row.animal.owner) !== String(ownerId)) throw new AppError(404, 'BREEDING_NOT_FOUND', 'Breeding record not found');
  return row;
};
// MongoDB error 11000 = duplicate key (one milk record per animal per date). Return a clean 409 instead of a 500.
const duplicateToConflict = (e) => {
  if (e && e.code === 11000) throw new AppError(409, 'MILK_RECORD_EXISTS', 'A milk record already exists for this animal and date');
  throw e;
};
// Validated query lives in req.parsedQuery (set by the route). Falls back to req.query.
const queryOf = (req) => req.parsedQuery || req.query;

export const listMilk = asyncHandler(async (req, res) => {
  const date = queryOf(req).date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new AppError(400, 'VALIDATION_ERROR', 'date must use YYYY-MM-DD');
  const animals = await Animal.find({ owner: req.user.id, status: 'active', archivedAt: null, milkingStatus: 'milking' }).select('_id tag name').sort({ name: 1 }).lean();
  const records = await MilkRecord.find({ owner: req.user.id, date, animal: { $in: animals.map((a) => a._id) } }).lean();
  const byAnimal = new Map(records.map((r) => [String(r.animal), r]));
  ok(res, animals.map((animal) => {
    const row = byAnimal.get(String(animal._id));
    return { animalId: String(animal._id), tag: animal.tag, name: animal.name, morningL: row?.morningL ?? 0, eveningL: row?.eveningL ?? 0, ...(row ? { id: String(row._id) } : {}) };
  }));
});

export const bulkMilk = asyncHandler(async (req, res) => {
  // Step 1: check every animal first, so a bad entry stops the request before anything is saved.
  const checked = [];
  for (const entry of req.body.entries) {
    const animal = await ownedAnimal(entry.animalId, req.user.id);
    if (animal.status !== 'active' || animal.archivedAt || animal.milkingStatus !== 'milking') throw new AppError(400, 'ANIMAL_NOT_MILKING', `${animal.name} is not an active milking animal`);
    checked.push({ entry, animal });
  }
  // Step 2: save.
  const output = [];
  for (const { entry, animal } of checked) {
    let row;
    try {
      row = await MilkRecord.findOneAndUpdate(
        { owner: req.user.id, animal: animal._id, date: req.body.date },
        { $set: { morningL: entry.morningL, eveningL: entry.eveningL } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
    } catch (e) { duplicateToConflict(e); }
    output.push({ animalId: String(animal._id), tag: animal.tag, name: animal.name, morningL: row.morningL, eveningL: row.eveningL, id: String(row._id) });
  }
  ok(res, output, 201);
});

export const getMilkTrend = asyncHandler(async (req, res) => {
  await ownedAnimal(req.params.animalId, req.user.id);
  const days = Math.min(365, Math.max(1, Number.parseInt(queryOf(req).days || '30', 10) || 30));
  ok(res, await milkTrend(req.user.id, req.params.animalId, days));
});

export const updateMilk = asyncHandler(async (req, res) => {
  const row = await ownedMilk(req.params.id, req.user.id);
  if (req.body.date !== undefined) row.date = req.body.date;
  if (req.body.morningL !== undefined) row.morningL = req.body.morningL;
  if (req.body.eveningL !== undefined) row.eveningL = req.body.eveningL;
  try { await row.save(); } catch (e) { duplicateToConflict(e); }
  ok(res, row);
});
export const deleteMilk = asyncHandler(async (req, res) => {
  await ownedMilk(req.params.id, req.user.id);
  await MilkRecord.deleteOne({ _id: req.params.id, owner: req.user.id });
  ok(res, { deleted: true });
});
export const milkAlerts = asyncHandler(async (req, res) => {
  const alerts = await getMilkAlerts(req.user.id);
  ok(res, alerts.map((a) => ({ ...a, message: MILK_DROP_MESSAGE })));
});

export const listBreeding = asyncHandler(async (req, res) => {
  const filter = { owner: req.user.id };
  const animalId = queryOf(req).animalId;
  if (animalId) {
    await ownedAnimal(animalId, req.user.id);
    filter.animal = animalId;
  }
  const rows = await Breeding.find(filter).populate({ path: 'animal', match: { owner: req.user.id }, select: 'tag name type gender status' }).sort({ breedingDate: -1 });
  ok(res, rows.filter((r) => r.animal));
});
export const breedingAlerts = asyncHandler(async (req, res) => ok(res, await getBreedingAlerts(req.user.id)));
export const getBreeding = asyncHandler(async (req, res) => ok(res, await ownedBreeding(req.params.id, req.user.id)));
export const createBreeding = asyncHandler(async (req, res) => {
  const animal = await ownedAnimal(req.body.animalId, req.user.id);
  if (animal.gender !== 'female') throw new AppError(400, 'FEMALE_ANIMAL_REQUIRED', 'Breeding records are only allowed for female animals');
  if (animal.status !== 'active' || animal.archivedAt) throw new AppError(400, 'ANIMAL_NOT_ACTIVE', 'Breeding requires an active animal');
  const dates = breedingCalc(animal.type, req.body.breedingDate);
  const row = await Breeding.create({ owner: req.user.id, animal: animal._id, breedingDate: req.body.breedingDate, method: req.body.method, ...dates });
  ok(res, row, 201);
});
export const updateBreedingOutcome = asyncHandler(async (req, res) => {
  const row = await ownedBreeding(req.params.id, req.user.id);
  const { status, deliveryDate, addCalf } = req.body;
  row.status = status;
  if (deliveryDate !== undefined) row.deliveryDate = deliveryDate;
  let mother = null;
  if (status === 'delivered') {
    if (!deliveryDate) throw new AppError(400, 'DELIVERY_DATE_REQUIRED', 'deliveryDate is required when status is delivered');
    mother = await Animal.findOne({ _id: row.animal._id, owner: req.user.id });
    if (!mother) throw new AppError(404, 'ANIMAL_NOT_FOUND', 'Mother animal not found');
    mother.lastCalvingDate = deliveryDate;
    mother.milkingStatus = 'milking';
    row.deliveryDate = deliveryDate;
    await mother.validate(); // check both documents are valid BEFORE saving either one
  }
  await row.validate();
  if (mother) await mother.save();
  await row.save();
  // Calf creation is intentionally not automatic. The API returns a flag for the UI to offer the Add Calf flow.
  ok(res, { breeding: row, addCalfOffered: status === 'delivered' && addCalf === true });
});
