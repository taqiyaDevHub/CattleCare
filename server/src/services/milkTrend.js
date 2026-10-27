import Animal from '../models/Animal.js';
import MilkRecord from '../models/MilkRecord.js';
import { localNow } from './localNow.js';

const round2 = (n) => Math.round(n * 100) / 100;
const total = (row) => Number(row.morningL || 0) + Number(row.eveningL || 0);

export async function milkTrend(ownerId, animalId, days = 30) {
  const animal = await Animal.findOne({ _id: animalId, owner: ownerId }).select('_id');
  if (!animal) return [];
  const end = localNow(); end.setUTCHours(0, 0, 0, 0);
  const start = new Date(end); start.setUTCDate(start.getUTCDate() - (days - 1));
  const startText = start.toISOString().slice(0, 10);
  const endText = end.toISOString().slice(0, 10);
  const rows = await MilkRecord.find({ owner: ownerId, animal: animal._id, date: { $gte: startText, $lte: endText } }).sort({ date: 1 }).lean();
  const byDate = new Map(rows.map((row) => [row.date, round2(total(row))]));
  return Array.from({ length: days }, (_, index) => {
    const d = new Date(start); d.setUTCDate(start.getUTCDate() + index);
    const date = d.toISOString().slice(0, 10);
    return { date, totalL: byDate.has(date) ? byDate.get(date) : null };
  });
}

export async function getMilkAlerts(ownerId) {
  const animals = await Animal.find({ owner: ownerId, status: 'active', archivedAt: null, milkingStatus: 'milking' }).select('_id name').lean();
  if (!animals.length) return [];
  const today = localNow(); today.setUTCHours(0, 0, 0, 0);
  const recentStart = new Date(today); recentStart.setUTCDate(today.getUTCDate() - 2);
  const oldStart = new Date(today); oldStart.setUTCDate(today.getUTCDate() - 9);
  const recentText = recentStart.toISOString().slice(0, 10);
  const oldText = oldStart.toISOString().slice(0, 10);
  const todayText = today.toISOString().slice(0, 10);
  const ids = animals.map((a) => a._id);
  const records = await MilkRecord.find({ owner: ownerId, animal: { $in: ids }, date: { $gte: oldText, $lte: todayText } }).lean();
  const grouped = new Map();
  for (const row of records) {
    if (!grouped.has(String(row.animal))) grouped.set(String(row.animal), []);
    grouped.get(String(row.animal)).push({ date: row.date, value: total(row) });
  }
  const alerts = [];
  for (const animal of animals) {
    const rows = grouped.get(String(animal._id)) || [];
    const recent = rows.filter((r) => r.date >= recentText && r.date <= todayText);
    const older = rows.filter((r) => r.date >= oldText && r.date < recentText);
    if (recent.length < 2 || older.length < 5) continue;
    const avgRecent = recent.reduce((s, r) => s + r.value, 0) / recent.length;
    const avgOlder = older.reduce((s, r) => s + r.value, 0) / older.length;
    if (avgOlder <= 0) continue;
    const dropPercent = Math.round(((avgOlder - avgRecent) / avgOlder) * 100);
    if (dropPercent >= 20) alerts.push({ animalId: String(animal._id), animalName: animal.name, dropPercent, level: dropPercent >= 35 ? 'strong' : 'warning' });
  }
  return alerts;
}

export const MILK_DROP_MESSAGE = 'Milk is lower than usual. Check feed, heat and the udder.';
