import HealthEvent from '../models/HealthEvent.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { findOwnedAnimal } from '../utils/ownedAnimal.js';
import { todayStr } from '../utils/healthDates.js';
import { healthQuerySchema } from '../validators/health.js';
import { findRuleByName, scheduleNextAfterDone } from '../services/vaccineEngine.js';

async function findOwnedEvent(req) {
  const event = await HealthEvent.findOne({ _id: req.params.id, owner: req.user.id });
  if (!event) throw new AppError(404, 'HEALTH_EVENT_NOT_FOUND', 'Health record not found');
  return event;
}

const time = (d) => (d ? new Date(d).getTime() : 0);

// Pending first (soonest date first), then done (latest first)
export function sortEvents(events) {
  const pending = events
    .filter((e) => e.status === 'pending')
    .sort(
      (a, b) =>
        time(a.dueDate ?? a.sinceDate ?? a.createdAt) - time(b.dueDate ?? b.sinceDate ?? b.createdAt)
    );
  const done = events
    .filter((e) => e.status !== 'pending')
    .sort((a, b) => time(b.doneDate ?? b.updatedAt) - time(a.doneDate ?? a.updatedAt));
  return [...pending, ...done];
}

// GET /health (?animalId=&status=&kind=)
export const list = asyncHandler(async (req, res) => {
  const q = healthQuerySchema.parse(req.query);
  const filter = { owner: req.user.id };
  if (q.animalId) filter.animal = q.animalId;
  if (q.status) filter.status = q.status;
  if (q.kind) filter.kind = q.kind;
  const events = await HealthEvent.find(filter);
  ok(res, sortEvents(events));
});

// POST /health {animalId, kind, name, dueDate?, sinceDate?, notes?}
export const create = asyncHandler(async (req, res) => {
  const { animalId, kind, name, dueDate, sinceDate, notes } = req.body;
  const animal = await findOwnedAnimal(req.user.id, animalId);
  const today = todayStr();

  const doc = { owner: req.user.id, animal: animal._id, kind, name, status: 'pending' };
  if (notes) doc.notes = notes;
  if (sinceDate) doc.sinceDate = sinceDate;

  if (kind === 'illness') {
    if (!doc.sinceDate) doc.sinceDate = today;
  } else {
    doc.dueDate = dueDate ?? today;
    // If the name matches a default vaccine, link it so "Mark done" can schedule the next one
    const rule = findRuleByName(name, animal);
    if (rule && rule.kind === kind) {
      doc.vaccineId = rule.id;
      const alreadyPending = await HealthEvent.exists({
        owner: req.user.id,
        animal: animal._id,
        vaccineId: rule.id,
        status: 'pending',
      });
      if (alreadyPending) {
        throw new AppError(409, 'ALREADY_PENDING', 'This vaccine is already on the list for this animal');
      }
    }
  }

  const event = await HealthEvent.create(doc);
  ok(res, event, 201);
});

// PATCH /health/:id/done {doneDate} -> marks done and creates the next due event
export const markDone = asyncHandler(async (req, res) => {
  const event = await findOwnedEvent(req);
  if (event.status === 'done') {
    throw new AppError(409, 'ALREADY_DONE', 'This record is already marked done');
  }

  event.set({ status: 'done', doneDate: req.body.doneDate });
  await event.save();

  const nextEvent = event.kind === 'illness' ? null : await scheduleNextAfterDone(event, req.user.id);
  ok(res, { event, nextEvent });
});

// PUT /health/:id
export const update = asyncHandler(async (req, res) => {
  const event = await findOwnedEvent(req);
  event.set(req.body);

  if (req.body.status === 'done' && !event.doneDate) event.doneDate = todayStr();
  if (req.body.status === 'pending') event.doneDate = undefined;

  await event.save();
  ok(res, event);
});

// DELETE /health/:id
export const remove = asyncHandler(async (req, res) => {
  const event = await findOwnedEvent(req);
  await event.deleteOne();
  ok(res, { deleted: true });
});
