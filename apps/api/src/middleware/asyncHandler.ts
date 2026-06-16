import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so rejected promises are forwarded to Express'
 * error handler. Express 4 does not catch async errors on its own, so without
 * this a thrown HttpError inside an async handler would hang the request.
 */
export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response,
>(handler: (req: Req, res: Res, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    handler(req as Req, res as Res, next).catch(next);
  };
}
