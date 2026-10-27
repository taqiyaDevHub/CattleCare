import { readFileSync } from 'node:fs';
import HealthEvent from '../models/HealthEvent.js';
import Animal from '../models/Animal.js';
import {
  todayStr,
  parseDate,
  toDateStr,
  startOfDay,
  addDays,
  addMonths,
  monthsBetween,
  daysBetween,
} from '../utils/healthDates.js';

const config = JSON.parse(readFileSync(new URL('../data/vaccines.json', import.meta.url), 'utf8'));

export const VACCINE_RULES = config.rules;
export const VACCINE_DISCLAIMER = config.disclaimer;
export const HISTORY_UNKNOWN_NOTE = 'Due now (history unknown)';
const HISTORY_NOTE = 'Added from history';
const DUE_SOON_DAYS = config.dueSoonDays ?? 7;

// ---------- helpers ----------

export const getRule = (id) => VACCINE_RULES.find((r) => r.id === id) ?? null;

export function ruleAppliesToAnimal(rule, animal) {
  if (!rule.appliesTo.includes(animal.type)) return false;
  if (rule.femaleOnly && animal.gender !== 'female') return false;
  return true;
}

// Finds a default rule from a typed name ("FMD", "fmd", "Deworming", full name...)
export function findRuleByName(name, animal) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return null;
  return (
    VACCINE_RULES.filter((r) => ruleAppliesToAnimal(r, animal)).find(
      (r) =>
        r.id === n ||
        r.name.toLowerCase() === n ||
        r.name.toLowerCase().split(' ')[0] === n ||
        `${r.name.toLowerCase()} booster` === n
    ) ?? null
  );
}

function birthDate(animal, today) {
  if (animal.dob) return startOfDay(animal.dob);
  return addMonths(today, -(animal.ageMonths || 0));
}

// Current age in whole months (uses dob when known, so it stays correct over time)
export function getAnimalAgeMonths(animal) {
  const today = parseDate(todayStr());
  return monthsBetween(birthDate(animal, today), today);
}

function makeEvent(animal, rule, fields) {
  const event = {
    kind: rule.kind,
    name: rule.name,
    vaccineId: rule.id,
    status: 'pending',
    ...fields,
  };
  if (animal.owner) event.owner = animal.owner;
  if (animal._id) event.animal = animal._id;
  return event;
}

// Latest valid (not in the future) done date per vaccineId
function latestDoneByVaccine(lastVaccines, today) {
  const map = new Map();
  for (const item of Array.isArray(lastVaccines) ? lastVaccines : []) {
    if (!item || !item.vaccineId || !item.doneDate) continue;
    const date = parseDate(String(item.doneDate).slice(0, 10));
    if (Number.isNaN(date.getTime()) || date > today) continue;
    const current = map.get(item.vaccineId);
    if (!current || date > current) map.set(item.vaccineId, date);
  }
  return map;
}

// ---------- generateSchedule(animal, lastVaccines) -> HealthEvent[] ----------
// Called by Member 1 when an animal is added.
// - last vaccine date given: a "done" history event + next due = last date + interval
// - no history: "Due now (history unknown)" (or the date the animal reaches the start age)
export function generateSchedule(animal, lastVaccines = []) {
  const today = parseDate(todayStr());
  const birth = birthDate(animal, today);
  const ageMonths = monthsBetween(birth, today);
  const latest = latestDoneByVaccine(lastVaccines, today);
  const events = [];

  for (const rule of VACCINE_RULES) {
    if (!ruleAppliesToAnimal(rule, animal)) continue;

    const last = latest.get(rule.id);
    if (last) {
      events.push(
        makeEvent(animal, rule, {
          status: 'done',
          doneDate: last,
          dueDate: last,
          notes: HISTORY_NOTE,
        })
      );
      if (!rule.once) {
        events.push(makeEvent(animal, rule, { dueDate: addDays(last, rule.intervalDays) }));
      }
      continue;
    }

    // Brucellosis: only once, between 4 and 8 months. Too old = nothing to schedule.
    if (rule.once && ageMonths > rule.maxAgeMonths) continue;

    const start = addMonths(birth, rule.startAgeMonths);
    if (start > today) {
      events.push(
        makeEvent(animal, rule, {
          dueDate: start,
          notes: `From ${rule.startAgeMonths} months of age`,
        })
      );
    } else {
      events.push(makeEvent(animal, rule, { dueDate: today, notes: HISTORY_UNKNOWN_NOTE }));
    }
  }

  return events;
}

// ---------- next event after "Mark done" ----------
// FMD: first dose -> booster after 30 days -> then every 180 days.
// Others: done date + interval. Brucellosis (once) has no next event.
export function buildNextEvent(rule, animal, doneDate, doneCount) {
  if (!rule || rule.once || !ruleAppliesToAnimal(rule, animal)) return null;
  const isBooster = Boolean(rule.boosterAfterDays) && doneCount === 1;
  return makeEvent(animal, rule, {
    name: isBooster ? `${rule.name} booster` : rule.name,
    dueDate: addDays(doneDate, isBooster ? rule.boosterAfterDays : rule.intervalDays),
  });
}

// Creates the next pending event for a vaccine/deworming event that was just marked done.
// Returns the new HealthEvent or null.
export async function scheduleNextAfterDone(event, ownerId) {
  if (!event.vaccineId) return null;
  const rule = getRule(event.vaccineId);
  if (!rule) return null;

  const animal = await Animal.findOne({ _id: event.animal, owner: ownerId });
  if (!animal || animal.status !== 'active' || animal.archivedAt) return null;

  const base = { owner: ownerId, animal: event.animal, vaccineId: event.vaccineId };
  if (await HealthEvent.exists({ ...base, status: 'pending' })) return null;

  const doneCount = await HealthEvent.countDocuments({ ...base, status: 'done' });
  const next = buildNextEvent(rule, animal, event.doneDate, doneCount);
  return next ? HealthEvent.create(next) : null;
}

// ---------- getVaccineAlerts(ownerId) ----------
// -> [{animalId, animalName, vaccineName, dueDate, level}]
// level: overdue (past) | due_now (today) | due_soon (next 7 days)
// Only pending vaccine events of active animals.
export function dueLevel(dueDate, today) {
  const diff = daysBetween(today, dueDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'due_now';
  return 'due_soon';
}

export async function getVaccineAlerts(ownerId) {
  const today = parseDate(todayStr());
  const limit = addDays(today, DUE_SOON_DAYS);

  const events = await HealthEvent.find({
    owner: ownerId,
    kind: 'vaccine',
    status: 'pending',
    dueDate: { $lte: limit },
  })
    .sort({ dueDate: 1 })
    .lean();
  if (!events.length) return [];

  const animals = await Animal.find({
    owner: ownerId,
    status: 'active',
    archivedAt: null,
    _id: { $in: events.map((e) => e.animal) },
  })
    .select('name')
    .lean();
  const names = new Map(animals.map((a) => [String(a._id), a.name]));

  return events
    .filter((e) => names.has(String(e.animal)))
    .map((e) => ({
      animalId: String(e.animal),
      animalName: names.get(String(e.animal)),
      vaccineName: e.name,
      dueDate: toDateStr(e.dueDate),
      level: dueLevel(e.dueDate, today),
    }));
}
