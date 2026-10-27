import Animal from '../models/Animal.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { dobFromAgeMonths } from '../utils/dates.js';
import { getRelatedModels, getGenerateSchedule } from '../utils/optional.js';
import { listQuerySchema } from '../validators/animal.js';

async function findOwned(req) {
  const animal = await Animal.findOne({ _id: req.params.id, owner: req.user.id });
  if (!animal) throw new AppError(404, 'ANIMAL_NOT_FOUND', 'Animal not found');
  return animal;
}

export const list = asyncHandler(async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  const filter = { owner: req.user.id, archivedAt: null };
  if (q.status) filter.status = q.status;
  if (q.type) filter.type = q.type;
  const animals = await Animal.find(filter).sort({ name: 1 });
  ok(res, animals);
});

export const getOne = asyncHandler(async (req, res) => {
  ok(res, await findOwned(req));
});

export const create = asyncHandler(async (req, res) => {
  const { lastVaccines = [], ...fields } = req.body;

  const animal = await Animal.create({
    ...fields,
    owner: req.user.id,
    dob: dobFromAgeMonths(fields.ageMonths),
  });

  // Member 2's generateSchedule builds the vaccine/deworming events
  const generateSchedule = await getGenerateSchedule();
  const { HealthEvent } = await getRelatedModels();
  if (generateSchedule && HealthEvent) {
    try {
      const events = await generateSchedule(animal, lastVaccines);
      if (Array.isArray(events) && events.length) {
        await HealthEvent.insertMany(
          events.map((e) => ({
            ...(typeof e.toObject === 'function' ? e.toObject() : e),
            owner: animal.owner,
            animal: animal._id,
          }))
        );
      }
    } catch (err) {
      console.error('Schedule generation failed:', err);
    }
  }

  ok(res, animal, 201);
});

export const update = asyncHandler(async (req, res) => {
  const animal = await findOwned(req);

  if (animal.status === 'sold' && req.body.status) {
    throw new AppError(409, 'ANIMAL_SOLD', 'A sold animal cannot change status');
  }

  animal.set(req.body);
  if (req.body.ageMonths !== undefined) {
    animal.dob = dobFromAgeMonths(req.body.ageMonths);
  }
  if (animal.gender === 'male' && animal.milkingStatus !== 'none') {
    throw new AppError(400, 'VALIDATION_ERROR', 'milkingStatus: A male animal cannot be milking or dry');
  }

  await animal.save();
  ok(res, animal);
});

export const archive = asyncHandler(async (req, res) => {
  const animal = await findOwned(req);
  if (!animal.archivedAt) {
    animal.archivedAt = new Date();
    await animal.save();
  }
  ok(res, { archived: true });
});

export const sell = asyncHandler(async (req, res) => {
  const animal = await findOwned(req);
  if (animal.archivedAt) {
    throw new AppError(409, 'ANIMAL_ARCHIVED', 'An archived animal cannot be sold');
  }
  if (animal.status !== 'active') {
    throw new AppError(409, 'ANIMAL_NOT_ACTIVE', 'Only active animals can be sold');
  }

  const { Transaction } = await getRelatedModels();
  if (!Transaction) {
    throw new AppError(500, 'SERVER_ERROR', 'Transaction model is not available yet');
  }

  const { soldDate, soldPrice } = req.body;
  const tx = await Transaction.create({
    owner: req.user.id,
    animal: animal._id,
    type: 'income',
    category: 'animal_sale',
    amount: soldPrice,
    date: soldDate,
    note: `Sold ${animal.name}`,
  });

  try {
    animal.set({ status: 'sold', soldDate, soldPrice, milkingStatus: 'none' });
    await animal.save();
  } catch (err) {
    await Transaction.deleteOne({ _id: tx._id });
    throw err;
  }

  ok(res, animal);
});