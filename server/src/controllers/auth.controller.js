import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';

export const toUserDto = (u) => ({
  id: u._id.toString(),
  name: u.name,
  phone: u.phone,
  milkRatePerLitre: u.milkRatePerLitre,
});

const signToken = (id) => jwt.sign({ id }, env.JWT_SECRET, { expiresIn: '30d' });

export const register = asyncHandler(async (req, res) => {
  const { name, phone, pin } = req.body;
  const pinHash = await bcrypt.hash(pin, 10);
  const user = await User.create({ name, phone, pinHash });
  ok(res, { token: signToken(user.id), user: toUserDto(user) }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { phone, pin } = req.body;
  const user = await User.findOne({ phone });
  const valid = user && (await bcrypt.compare(pin, user.pinHash));
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Wrong phone or PIN');
  ok(res, { token: signToken(user.id), user: toUserDto(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Please log in');
  ok(res, toUserDto(user));
});