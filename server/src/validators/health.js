import { z } from 'zod';
import { dateStr } from './common.js';
import { todayStr } from '../utils/healthDates.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const kind = z.enum(['vaccine', 'deworming', 'illness']);
const status = z.enum(['pending', 'done']);
const urgency = z.enum(['watch', 'see_vet_today', 'emergency']);
const notes = z.string().trim().max(500, 'Notes are too long');
const name = z.string().trim().min(1, 'Name is required').max(80, 'Name is too long');

// POST /health {animalId, kind, name, dueDate?, sinceDate?, notes?}
export const createHealthSchema = z.object({
  animalId: objectId,
  kind,
  name,
  dueDate: dateStr.optional(),
  sinceDate: dateStr.optional(),
  notes: notes.optional(),
});

// PATCH /health/:id/done {doneDate}
export const doneSchema = z.object({
  doneDate: dateStr.refine((d) => d <= todayStr(), 'Done date cannot be in the future'),
});

// PUT /health/:id (every field optional)
export const updateHealthSchema = z
  .object({
    name,
    dueDate: dateStr,
    doneDate: dateStr,
    status,
    sinceDate: dateStr,
    urgency,
    symptoms: z.array(z.string().trim().min(1).max(40)).max(30),
    notes,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Nothing to update' });

// GET /health (?animalId=&status=&kind=)
export const healthQuerySchema = z.object({
  animalId: objectId.optional(),
  status: status.optional(),
  kind: kind.optional(),
});
