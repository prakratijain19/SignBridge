import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { usersRouter } from './users.js';
import { conversationsRouter } from './conversations.js';
import { signSamplesRouter } from './sign-samples.js';
import { translateRouter } from './translate.js';
import { callsRouter } from './calls.js';
import { emergencyRouter } from './emergency.js';
import { learningRouter } from './learning.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/conversations', conversationsRouter);
apiRouter.use('/sign-samples', signSamplesRouter);
apiRouter.use('/translate', translateRouter);
apiRouter.use('/calls', callsRouter);
apiRouter.use('/emergency', emergencyRouter);
apiRouter.use('/learning', learningRouter);
