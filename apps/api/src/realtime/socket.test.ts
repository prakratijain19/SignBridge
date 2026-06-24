import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { io as ioc, type Socket as ClientSocket } from 'socket.io-client';
import type { Server } from 'socket.io';
import { attachSocketServer } from './socket.js';
import { signAccessToken } from '../lib/jwt.js';

let httpServer: HttpServer;
let io: Server;
let url: string;
const clients: ClientSocket[] = [];

function token(sub = 'usr_1'): string {
  return signAccessToken({ sub, role: 'HEARING_USER' });
}

function connect(opts: Record<string, unknown>): ClientSocket {
  const client = ioc(url, { transports: ['websocket'], forceNew: true, ...opts });
  clients.push(client);
  return client;
}

beforeAll(async () => {
  httpServer = createServer();
  io = attachSocketServer(httpServer);
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address() as AddressInfo;
  url = `http://localhost:${port}`;
});

afterAll(async () => {
  clients.forEach((c) => c.disconnect());
  await io.close();
  httpServer.close();
});

describe('socket signaling auth', () => {
  it('rejects a connection with no token', async () => {
    const client = connect({ auth: {} });
    const message = await new Promise<string>((resolve) => {
      client.on('connect_error', (err) => resolve(err.message));
    });
    expect(message).toBe('UNAUTHORIZED');
  });

  it('accepts a connection with a valid token', async () => {
    const client = connect({ auth: { token: token() } });
    await new Promise<void>((resolve, reject) => {
      client.on('connect', () => resolve());
      client.on('connect_error', (err) => reject(err));
    });
    expect(client.connected).toBe(true);
  });
});

describe('room capacity', () => {
  it('rejects a third participant with room-full', async () => {
    const room = 'room-capacity-test';
    const join = (sub: string) =>
      new Promise<ClientSocket>((resolve) => {
        const c = connect({ auth: { token: token(sub) } });
        c.on('connect', () => {
          c.emit('join', room);
          resolve(c);
        });
      });

    await join('user-a');
    await join('user-b');
    const third = connect({ auth: { token: token('user-c') } });

    const full = await new Promise<boolean>((resolve) => {
      third.on('connect', () => third.emit('join', room));
      third.on('room-full', () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });
    expect(full).toBe(true);
  });
});
