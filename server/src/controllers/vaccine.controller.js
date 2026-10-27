import HealthEvent from '../models/HealthEvent.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { findOwnedAnimal } from '../utils/ownedAnimal.js';
import { sortEvents } from './health.controller.js';

// GET /vaccines/schedule/:animalId
// All vaccine and deworming events of one animal: pending (soonest first), then done.
export const schedule = asyncHandler(async (req, res) => {
  const animal = await findOwnedAnimal(req.user.id, req.params.animalId);
  const events = await HealthEvent.find({
    owner: req.user.id,
    animal: animal._id,
    kind: { $in: ['vaccine', 'deworming'] },
  });
  ok(res, sortEvents(events));
});
