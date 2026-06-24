import { Router, type Request, type Response } from 'express';
import type {
  ApiResponse,
  EmergencyContact as ContactDTO,
  EmergencyEvent as EventDTO,
  QuickPhrase as PhraseDTO,
} from '@signbridge/shared-types';
import type { EmergencyContact, EmergencyEvent, QuickPhrase } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HttpError } from '../middleware/error.js';
import {
  createContactSchema,
  createEventSchema,
  createPhraseSchema,
  updateContactSchema,
  updatePhraseSchema,
} from '../validation/emergency.schema.js';

function toContact(c: EmergencyContact): ContactDTO {
  return { id: c.id, name: c.name, phone: c.phone, relation: c.relation, isPrimary: c.isPrimary };
}
function toPhrase(p: QuickPhrase): PhraseDTO {
  return {
    id: p.id,
    text: p.text,
    language: p.language as PhraseDTO['language'],
    sortOrder: p.sortOrder,
  };
}
function toEvent(e: EmergencyEvent): EventDTO {
  return {
    id: e.id,
    text: e.text,
    language: e.language as EventDTO['language'],
    channel: e.channel as EventDTO['channel'],
    createdAt: e.createdAt.toISOString(),
  };
}

/** Loads a row owned by the user, throwing 404 (not 403) for others' rows. */
async function ownedContact(userId: string, id: string): Promise<EmergencyContact> {
  const row = await prisma.emergencyContact.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new HttpError(404, 'NOT_FOUND', 'Contact not found.');
  return row;
}
async function ownedPhrase(userId: string, id: string): Promise<QuickPhrase> {
  const row = await prisma.quickPhrase.findUnique({ where: { id } });
  if (!row || row.userId !== userId) throw new HttpError(404, 'NOT_FOUND', 'Phrase not found.');
  return row;
}

export const emergencyRouter: Router = Router();

emergencyRouter.use(requireAuth);

// ── Contacts ────────────────────────────────────────────────────────────────

emergencyRouter.get(
  '/contacts',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ contacts: ContactDTO[] }>>) => {
    const rows = await prisma.emergencyContact.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: { contacts: rows.map(toContact) } });
  }),
);

emergencyRouter.post(
  '/contacts',
  validateBody(createContactSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ contact: ContactDTO }>>) => {
    const userId = req.user!.id;
    if (req.body.isPrimary) {
      await prisma.emergencyContact.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    const contact = await prisma.emergencyContact.create({
      data: {
        userId,
        name: req.body.name,
        phone: req.body.phone,
        relation: req.body.relation ?? null,
        isPrimary: req.body.isPrimary ?? false,
      },
    });
    res.status(201).json({ success: true, data: { contact: toContact(contact) } });
  }),
);

emergencyRouter.patch(
  '/contacts/:id',
  validateBody(updateContactSchema),
  asyncHandler(
    async (req: Request<{ id: string }>, res: Response<ApiResponse<{ contact: ContactDTO }>>) => {
      const userId = req.user!.id;
      await ownedContact(userId, req.params.id);
      if (req.body.isPrimary) {
        await prisma.emergencyContact.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
      const contact = await prisma.emergencyContact.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: { contact: toContact(contact) } });
    },
  ),
);

emergencyRouter.delete(
  '/contacts/:id',
  asyncHandler(
    async (req: Request<{ id: string }>, res: Response<ApiResponse<{ success: true }>>) => {
      await ownedContact(req.user!.id, req.params.id);
      await prisma.emergencyContact.delete({ where: { id: req.params.id } });
      res.json({ success: true, data: { success: true } });
    },
  ),
);

// ── Quick phrases ─────────────────────────────────────────────────────────────

emergencyRouter.get(
  '/phrases',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ phrases: PhraseDTO[] }>>) => {
    const rows = await prisma.quickPhrase.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: { phrases: rows.map(toPhrase) } });
  }),
);

emergencyRouter.post(
  '/phrases',
  validateBody(createPhraseSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ phrase: PhraseDTO }>>) => {
    const phrase = await prisma.quickPhrase.create({
      data: {
        userId: req.user!.id,
        text: req.body.text,
        language: req.body.language,
        sortOrder: req.body.sortOrder,
      },
    });
    res.status(201).json({ success: true, data: { phrase: toPhrase(phrase) } });
  }),
);

emergencyRouter.patch(
  '/phrases/:id',
  validateBody(updatePhraseSchema),
  asyncHandler(
    async (req: Request<{ id: string }>, res: Response<ApiResponse<{ phrase: PhraseDTO }>>) => {
      await ownedPhrase(req.user!.id, req.params.id);
      const phrase = await prisma.quickPhrase.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: { phrase: toPhrase(phrase) } });
    },
  ),
);

emergencyRouter.delete(
  '/phrases/:id',
  asyncHandler(
    async (req: Request<{ id: string }>, res: Response<ApiResponse<{ success: true }>>) => {
      await ownedPhrase(req.user!.id, req.params.id);
      await prisma.quickPhrase.delete({ where: { id: req.params.id } });
      res.json({ success: true, data: { success: true } });
    },
  ),
);

// ── History ──────────────────────────────────────────────────────────────────

emergencyRouter.get(
  '/history',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ events: EventDTO[] }>>) => {
    const rows = await prisma.emergencyEvent.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ success: true, data: { events: rows.map(toEvent) } });
  }),
);

emergencyRouter.post(
  '/history',
  validateBody(createEventSchema),
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ event: EventDTO }>>) => {
    const event = await prisma.emergencyEvent.create({
      data: {
        userId: req.user!.id,
        text: req.body.text,
        language: req.body.language,
        channel: req.body.channel,
      },
    });
    res.status(201).json({ success: true, data: { event: toEvent(event) } });
  }),
);

emergencyRouter.delete(
  '/history',
  asyncHandler(async (req: Request, res: Response<ApiResponse<{ deleted: number }>>) => {
    const result = await prisma.emergencyEvent.deleteMany({ where: { userId: req.user!.id } });
    res.json({ success: true, data: { deleted: result.count } });
  }),
);
