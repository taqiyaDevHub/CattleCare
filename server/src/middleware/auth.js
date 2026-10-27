import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/appError.js';

export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Please log in'));
  }
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: payload.id };
    next();
  } catch {
    next(new AppError(401, 'UNAUTHORIZED', 'Session expired. Please log in again'));
  }
}