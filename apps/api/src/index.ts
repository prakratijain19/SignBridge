import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { attachSocketServer } from './realtime/socket.js';

// Explicit HTTP server so Socket.IO can share the same port as the REST API.
const server = createServer(createApp());
const io = attachSocketServer(server);

server.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`SignBridge API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received, shutting down gracefully...`);
  await io.close();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
