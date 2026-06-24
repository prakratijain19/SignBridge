import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import type { ApiResponse, CreateCallResult, IceServerConfig } from '@signbridge/shared-types';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getIceServers } from '../lib/ice.js';

export const callsRouter: Router = Router();

callsRouter.use(requireAuth);

/**
 * Starts a call: creates a VIDEO conversation for the user (so the call appears
 * in their history and they can persist transcript lines to it) and returns a
 * fresh signaling room id plus the ICE server list. Each participant calls this
 * for their own conversation; the shared room id pairs them for signaling.
 */
callsRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response<ApiResponse<CreateCallResult>>) => {
    const conversation = await prisma.conversation.create({
      data: { userId: req.user!.id, mode: 'VIDEO' },
    });
    res.status(201).json({
      success: true,
      data: {
        roomId: crypto.randomUUID(),
        conversationId: conversation.id,
        iceServers: getIceServers(),
      },
    });
  }),
);

callsRouter.get(
  '/ice',
  (_req: Request, res: Response<ApiResponse<{ iceServers: IceServerConfig[] }>>) => {
    res.json({ success: true, data: { iceServers: getIceServers() } });
  },
);
