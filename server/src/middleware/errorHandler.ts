import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  status?: number;
  code?: string;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: err.issues.map((issue) => issue.message).join(', '),
        code: 'VALIDATION_ERROR',
      },
    });
    return;
  }

  const appError = err as AppError;
  if (appError?.status && appError?.code) {
    res.status(appError.status).json({
      error: {
        message: appError.message,
        code: appError.code,
      },
    });
    return;
  }

  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
  });
}
