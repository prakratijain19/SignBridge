import { Router, type Request, type Response } from 'express';
import type { ApiResponse, TranslateResult } from '@signbridge/shared-types';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { translate } from '../lib/translation/index.js';
import { translateSchema } from '../validation/translation.schema.js';

export const translateRouter: Router = Router();

translateRouter.use(requireAuth);

translateRouter.post(
  '/',
  validateBody(translateSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<TranslateResult>>) => {
    const { text, from, to } = req.body;
    const result = await translate(text, from, to);
    res.json({ success: true, data: result });
  }),
);
