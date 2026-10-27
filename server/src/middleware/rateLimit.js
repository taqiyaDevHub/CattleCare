import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      ok: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many attempts. Try again in 15 minutes',
      },
    }),
});