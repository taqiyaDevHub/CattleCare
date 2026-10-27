import { z } from 'zod';

// A date must look like YYYY-MM-DD AND be a real calendar date (no 2026-02-31 or 2026-13-45).
const isRealDate = (text) => {
  const d = new Date(`${text}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text && text >= '1900-01-01' && text <= '2100-12-31';
};
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD').refine(isRealDate, 'Date is not a real calendar date');
const idSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
// Numbers or numeric strings only. null, "" and true/false are rejected (they used to become 0 or 1 silently).
const litres = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
  z.number().finite().min(0).max(1000)
);

export const milkDateQuerySchema = z.object({ date: dateSchema }).passthrough();
export const milkTrendQuerySchema = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }).passthrough();
export const bulkMilkSchema = z.object({
  date: dateSchema,
  entries: z.array(z.object({ animalId: idSchema, morningL: litres, eveningL: litres }).strict()).min(1).max(100),
}).strict().superRefine((value, ctx) => {
  const ids = value.entries.map((entry) => entry.animalId);
  if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['entries'], message: 'Each animal can appear only once per date' });
});
export const updateMilkSchema = z.object({
  date: dateSchema.optional(), morningL: litres.optional(), eveningL: litres.optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
export const createBreedingSchema = z.object({ animalId: idSchema, breedingDate: dateSchema, method: z.enum(['natural', 'AI']).optional().default('natural') }).strict();
export const breedingQuerySchema = z.object({ animalId: idSchema.optional() }).passthrough();
export const breedingOutcomeSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'not_pregnant', 'delivered', 'aborted']),
  deliveryDate: dateSchema.optional(),
  addCalf: z.boolean().optional().default(false),
}).strict().superRefine((value, ctx) => {
  if (value.status === 'delivered' && !value.deliveryDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['deliveryDate'], message: 'deliveryDate is required when status is delivered' });
});
