import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import type { AppError } from './errorHandler';

export const securityHeaders = helmet();

export const corsMiddleware = cors({ origin: process.env.CLIENT_URL });

export const chatRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    const error: AppError = new Error('Too many requests, please try again later.');
    error.status = 429;
    error.code = 'RATE_LIMITED';
    next(error);
  },
});
