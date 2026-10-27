import User from '../models/User.js';
import { AppError } from '../utils/appError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import { toUserDto } from './auth.controller.js';

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Please log in');
  ok(res, toUserDto(user));
});