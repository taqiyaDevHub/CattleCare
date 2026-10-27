import Breeding from '../models/Breeding.js';
import { AppError } from '../utils/appError.js';
import { localNow } from './localNow.js';

const gestationDays = { cow: 283, buffalo: 310, goat: 150 };
export function breedingCalc(type, breedingDate) {
  const days = gestationDays[type];
  if (!days) throw new AppError(400, 'UNSUPPORTED_ANIMAL_TYPE', 'Breeding dates are only supported for cow, buffalo and goat');
  const addDays = (dateText, amount) => {
    const date = new Date(`${dateText}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
  };
  const expectedDelivery = addDays(breedingDate, days);
  return {
    expectedDelivery,
    dryPeriodStart: type === 'goat' ? null : addDays(expectedDelivery, -60),
    heatCheckDate: addDays(breedingDate, 21),
    pregnancyCheckDate: addDays(breedingDate, 60),
  };
}

export async function getBreedingAlerts(ownerId) {
  const today = localNow().toISOString().slice(0, 10);
  const future = localNow(); future.setUTCDate(future.getUTCDate() + 14);
  const futureText = future.toISOString().slice(0, 10);
  const rows = await Breeding.find({ owner: ownerId, status: { $in: ['pending', 'confirmed'] } })
    .populate({ path: 'animal', match: { owner: ownerId, status: 'active', archivedAt: null }, select: 'name type' }).lean();
  const alerts = [];
  for (const row of rows) {
    if (!row.animal) continue;
    const candidates = [
      ['heat_check', row.heatCheckDate],
      ['pregnancy_check', row.pregnancyCheckDate],
      ...(row.dryPeriodStart ? [['dry_period', row.dryPeriodStart]] : []),
      ['delivery_soon', row.expectedDelivery],
    ];
    for (const [type, date] of candidates) {
      if (date && date >= today && date <= futureText) alerts.push({ animalId: String(row.animal._id), animalName: row.animal.name, type, date });
    }
  }
  return alerts.sort((a, b) => a.date.localeCompare(b.date));
}
