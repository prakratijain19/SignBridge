import { Router } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from './auth.js';
import { usersRouter } from './users.js';
import { conversationsRouter } from './conversations.js';
import { signSamplesRouter } from './sign-samples.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/conversations', conversationsRouter);
apiRouter.use('/sign-samples', signSamplesRouter);
