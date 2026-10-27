import { z } from 'zod';
import { dateStr } from './common.js';

const type = z.enum(['cow', 'buffalo', 'goat']);
const gender = z.enum(['female', 'male']);
const milkingStatus = z.enum(['milking', 'dry', 'none']);

const fields = {
  tag: z.string().trim().min(1, 'Tag is required').max(20),
  name: z.string().trim().min(1, 'Name is required').max(40),
  type,
  gender,
  ageMonths: z.number().int().min(0).max(360),
  weightKg: z.number().positive().max(2000).optional(),
  purchaseDate: dateStr.optional(),
  purchasePrice: z.number().min(0).optional(),
  milkingStatus: milkingStatus.optional(),
};

const lastVaccines = z
  .array(z.object({ vaccineId: z.string().min(1), doneDate: dateStr }))
  .max(30);

export const createAnimalSchema = z
  .object({ ...fields, lastVaccines: lastVaccines.optional() })
  .refine((a) => !(a.gender === 'male' && ['milking', 'dry'].includes(a.milkingStatus)), {
    message: 'A male animal cannot be milking or dry',
    path: ['milkingStatus'],
  });

// PUT: every field optional. "sold" is only set through the sell endpoint.
export const updateAnimalSchema = z
  .object({
    ...fields,
    status: z.enum(['active', 'dead']),
    lastCalvingDate: dateStr,
  })
  .partial();

export const sellSchema = z.object({
  soldDate: dateStr,
  soldPrice: z.number().min(0),
});

export const listQuerySchema = z.object({
  status: z.enum(['active', 'sold', 'dead']).optional(),
  type: type.optional(),
});