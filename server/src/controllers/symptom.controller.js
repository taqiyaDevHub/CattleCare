import HealthEvent from '../models/HealthEvent.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { findOwnedAnimal } from '../utils/ownedAnimal.js';
import { todayStr, parseDate, addDays, toDateStr } from '../utils/healthDates.js';
import {
  getSymptomOptions,
  getSymptomLabels,
  assessSymptoms,
  buildHints,
  buildTips,
  buildVetSummary,
} from '../services/symptomRules.js';
import { getAnimalAgeMonths } from '../services/vaccineEngine.js';

// GET /symptoms/options -> {symptoms: [{key, label, redFlag}]}
export const options = asyncHandler(async (req, res) => {
  ok(res, { symptoms: getSymptomOptions() });
});

// POST /symptoms/check {animalId, symptoms, sinceDays, notes?}
//   -> {urgency, hints[], tips[], vetSummary, healthEventId}
export const check = asyncHandler(async (req, res) => {
  const { animalId, symptoms, sinceDays, notes } = req.body;

  const animal = await findOwnedAnimal(req.user.id, animalId);
  if (animal.status !== 'active') {
    throw new AppError(409, 'ANIMAL_NOT_ACTIVE', 'Only active animals can be checked');
  }

  const today = todayStr();
  const sinceDate = toDateStr(addDays(parseDate(today), -sinceDays));
  const ageMonths = getAnimalAgeMonths(animal);

  const { urgency, reasons } = assessSymptoms({ symptoms, sinceDays, ageMonths });
  const hints = buildHints(symptoms, reasons);
  const tips = buildTips(urgency, symptoms);

  // Save the result as an illness HealthEvent
  const labels = getSymptomLabels(symptoms);
  const eventName = `Illness: ${labels[0]}${labels.length > 1 ? ` +${labels.length - 1} more` : ''}`;
  const event = await HealthEvent.create({
    owner: req.user.id,
    animal: animal._id,
    kind: 'illness',
    name: eventName,
    status: 'pending',
    sinceDate,
    urgency,
    symptoms,
    ...(notes ? { notes } : {}),
  });

  // Recent vaccine history helps the vet
  const done = await HealthEvent.find({
    owner: req.user.id,
    animal: animal._id,
    kind: { $in: ['vaccine', 'deworming'] },
    status: 'done',
  }).sort({ doneDate: -1 });
  const seen = new Set();
  const lastVaccines = [];
  for (const d of done) {
    const key = d.vaccineId || d.name;
    if (seen.has(key)) continue;
    seen.add(key);
    lastVaccines.push({ name: d.name, doneDate: toDateStr(d.doneDate) });
  }

  const vetSummary = buildVetSummary({
    animal,
    ageMonths,
    symptoms,
    urgency,
    sinceDate,
    sinceDays,
    notes,
    lastVaccines,
    today,
  });

  ok(res, { urgency, hints, tips, vetSummary, healthEventId: event._id.toString() });
});
