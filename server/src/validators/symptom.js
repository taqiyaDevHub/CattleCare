import { z } from 'zod';
import { objectId } from './health.js';
import { isKnownSymptom } from '../services/symptomRules.js';

// POST /symptoms/check {animalId, symptoms: [keys], sinceDays, notes?}
export const symptomCheckSchema = z.object({
  animalId: objectId,
  symptoms: z
    .array(z.string().trim().min(1))
    .min(1, 'Pick at least one sign')
    .max(30)
    .refine((keys) => keys.every(isKnownSymptom), 'Unknown symptom')
    .transform((keys) => [...new Set(keys)]),
  sinceDays: z
    .number({ required_error: 'Sick since is required' })
    .int('Sick since must be a whole number of days')
    .min(0, 'Sick since cannot be negative')
    .max(365, 'Sick since is too long ago'),
  notes: z.string().trim().max(500, 'Notes are too long').optional(),
});
