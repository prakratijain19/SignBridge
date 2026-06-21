import { Router, type Request, type Response } from 'express';
import type {
  ApiResponse,
  Conversation as ConversationDTO,
  ConversationSummary,
  ConversationWithMessages,
  Message as MessageDTO,
} from '@signbridge/shared-types';
import type { Conversation, Message } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HttpError } from '../middleware/error.js';
import {
  addMessageSchema,
  createConversationSchema,
  updateConversationSchema,
} from '../validation/conversation.schema.js';

function toConversation(c: Conversation): ConversationDTO {
  return {
    id: c.id,
    title: c.title,
    mode: c.mode,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

function toMessage(m: Message): MessageDTO {
  return {
    id: m.id,
    conversationId: m.conversationId,
    sender: m.sender,
    modality: m.modality,
    language: m.language as MessageDTO['language'],
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

/**
 * Loads a conversation and asserts it belongs to the given user. Returns 404
 * (not 403) for conversations owned by others, so their existence isn't leaked.
 */
async function requireOwnedConversation(userId: string, id: string): Promise<Conversation> {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (!conversation || conversation.userId !== userId) {
    throw new HttpError(404, 'NOT_FOUND', 'Conversation not found.');
  }
  return conversation;
}

export const conversationsRouter: Router = Router();

conversationsRouter.use(requireAuth);

conversationsRouter.post(
  '/',
  validateBody(createConversationSchema),
  asyncHandler(
    async (req: Request, res: Response<ApiResponse<{ conversation: ConversationDTO }>>) => {
      const conversation = await prisma.conversation.create({
        data: {
          userId: req.user!.id,
          title: req.body.title ?? null,
          mode: req.body.mode,
        },
      });
      res.status(201).json({ success: true, data: { conversation: toConversation(conversation) } });
    },
  ),
);

conversationsRouter.get(
  '/',
  asyncHandler(
    async (req: Request, res: Response<ApiResponse<{ conversations: ConversationSummary[] }>>) => {
      const rows = await prisma.conversation.findMany({
        where: { userId: req.user!.id },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { messages: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true } },
        },
      });

      const conversations: ConversationSummary[] = rows.map((c) => ({
        ...toConversation(c),
        messageCount: c._count.messages,
        lastMessagePreview: c.messages[0]?.content ?? null,
      }));

      res.json({ success: true, data: { conversations } });
    },
  ),
);

conversationsRouter.get(
  '/:id',
  asyncHandler(
    async (
      req: Request<{ id: string }>,
      res: Response<ApiResponse<{ conversation: ConversationWithMessages }>>,
    ) => {
      await requireOwnedConversation(req.user!.id, req.params.id);
      const conversation = await prisma.conversation.findUniqueOrThrow({
        where: { id: req.params.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });

      res.json({
        success: true,
        data: {
          conversation: {
            ...toConversation(conversation),
            messages: conversation.messages.map(toMessage),
          },
        },
      });
    },
  ),
);

conversationsRouter.post(
  '/:id/messages',
  validateBody(addMessageSchema),
  asyncHandler(
    async (req: Request<{ id: string }>, res: Response<ApiResponse<{ message: MessageDTO }>>) => {
      await requireOwnedConversation(req.user!.id, req.params.id);

      const message = await prisma.message.create({
        data: {
          conversationId: req.params.id,
          sender: req.body.sender,
          modality: req.body.modality,
          language: req.body.language,
          content: req.body.content,
        },
      });

      // Bump the conversation so history sorts by most-recent activity.
      await prisma.conversation.update({
        where: { id: req.params.id },
        data: { updatedAt: new Date() },
      });

      res.status(201).json({ success: true, data: { message: toMessage(message) } });
    },
  ),
);

conversationsRouter.patch(
  '/:id',
  validateBody(updateConversationSchema),
  asyncHandler(
    async (
      req: Request<{ id: string }>,
      res: Response<ApiResponse<{ conversation: ConversationDTO }>>,
    ) => {
      await requireOwnedConversation(req.user!.id, req.params.id);
      const conversation = await prisma.conversation.update({
        where: { id: req.params.id },
        data: { title: req.body.title },
      });
      res.json({ success: true, data: { conversation: toConversation(conversation) } });
    },
  ),
);

conversationsRouter.delete(
  '/:id',
  asyncHandler(
    async (req: Request<{ id: string }>, res: Response<ApiResponse<{ success: true }>>) => {
      await requireOwnedConversation(req.user!.id, req.params.id);
      await prisma.conversation.delete({ where: { id: req.params.id } });
      res.json({ success: true, data: { success: true } });
    },
  ),
);
