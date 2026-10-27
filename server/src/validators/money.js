import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD');
const animalIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid animal id');

export const createTransactionSchema = z.object({
  animalId: animalIdSchema.optional().nullable(),
  type: z.enum(['expense', 'income']),
  category: z.enum(['feed', 'medicine', 'vet_fee', 'labour', 'other', 'animal_sale']),
  amount: z.coerce.number().finite().positive().max(1_000_000_000),
  date: dateSchema,
  note: z.string().trim().max(300).optional().default(''),
}).superRefine((value, ctx) => {
  const expenseCategories = ['feed', 'medicine', 'vet_fee', 'labour'];
  if (value.type === 'expense' && value.category === 'animal_sale') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category'], message: 'Animal sale is an income category' });
  }
  if (value.type === 'income' && expenseCategories.includes(value.category)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['category'], message: 'Choose an income category' });
  }
});

export const updateTransactionSchema = createTransactionSchema;

export const transactionQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must use YYYY-MM').optional(),
  animalId: animalIdSchema.optional(),
}).passthrough();

export const reportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must use YYYY-MM').optional(),
}).passthrough();
