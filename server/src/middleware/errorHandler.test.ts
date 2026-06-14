import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { z, ZodError } from 'zod';
import { errorHandler, type AppError } from './errorHandler';

function createMockResponse() {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as Response;
}

describe('errorHandler', () => {
  it('responds with 400 and VALIDATION_ERROR for a ZodError', () => {
    const schema = z.object({ name: z.string() });
    let zodError: ZodError;
    try {
      schema.parse({});
      throw new Error('expected ZodError');
    } catch (err) {
      zodError = err as ZodError;
    }

    const res = createMockResponse();
    errorHandler(zodError, {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: expect.any(String),
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it('reuses status and code from a custom AppError', () => {
    const error: AppError = new Error('Too many requests');
    error.status = 429;
    error.code = 'RATE_LIMITED';

    const res = createMockResponse();
    errorHandler(error, {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Too many requests',
        code: 'RATE_LIMITED',
      },
    });
  });

  it('responds with 500 and INTERNAL_ERROR for a generic error', () => {
    const res = createMockResponse();
    errorHandler(new Error('boom'), {} as never, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
    });
  });
});
