import type { NextFunction, Request, Response } from 'express';
import type { ApiResponse } from '@signbridge/shared-types';

/** Thrown deliberately by route handlers to return a controlled error. */
export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    /** Optional field-level details, surfaced in the response for form errors. */
    public readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Central error handler. Must be registered last, after all routes. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response<ApiResponse<never>>,
  // next is required so Express recognises this as an error handler.
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
  });
}
