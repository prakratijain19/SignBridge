import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { HttpError } from './error.js';

/**
 * Builds middleware that validates `req.body` against the given Zod schema.
 * On success the parsed (and normalised) value replaces `req.body`. On failure
 * it throws an HttpError with field-level details for the client to render.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const key = issue.path.join('.') || '_';
          (details[key] ??= []).push(issue.message);
        }
        throw new HttpError(
          400,
          'VALIDATION_ERROR',
          'The submitted data is invalid.',
          details,
        );
      }
      throw err;
    }
  };
}
