import type { Request, Response } from 'express';
import type { ApiResponse } from '@signbridge/shared-types';

export function notFound(_req: Request, res: Response<ApiResponse<never>>): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' },
  });
}
