import { z } from 'zod';
import { normalizePhone, PHONE_RE } from '../utils/phone.js';

const phone = z
  .string({ required_error: 'Phone is required' })
  .transform(normalizePhone)
  .refine((p) => PHONE_RE.test(p), 'Phone must look like 03XXXXXXXXX');

const pin = z.string({ required_error: 'PIN is required' }).regex(/^\d{4}$/, 'PIN must be 4 digits');

const name = z.string().trim().min(2, 'Name is too short').max(60, 'Name is too long');

export const registerSchema = z.object({ name, phone, pin });
export const loginSchema = z.object({ phone, pin });

export const updateMeSchema = z
  .object({
    name: name.optional(),
    milkRatePerLitre: z.number().min(0).max(100000).optional(),
  })
  .refine((v) => v.name !== undefined || v.milkRatePerLitre !== undefined, {
    message: 'Send name or milkRatePerLitre',
  });