import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import type { SignalMessage } from '@signbridge/shared-types';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../lib/jwt.js';

const MAX_PER_ROOM = 2;

interface SocketUser {
  userId: string;
}

/**
 * Attaches the Socket.IO signaling server to the HTTP server. Sockets are
 * authenticated with the JWT access token; the server only relays WebRTC
 * signaling (SDP + ICE) between the (max two) peers in a room.
 */
export function attachSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigins, credentials: true },
  });

  // Authenticate every connection with the access token from the handshake.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') {
      next(new Error('UNAUTHORIZED'));
      return;
    }
    try {
      const { sub } = verifyAccessToken(token);
      (socket.data as SocketUser).userId = sub;
      next();
    } catch {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket: Socket) => {
    let joinedRoom: string | null = null;

    socket.on('join', (roomId: unknown) => {
      if (typeof roomId !== 'string' || roomId.length === 0) {
        socket.emit('error-message', 'Invalid room.');
        return;
      }
      const room = io.sockets.adapter.rooms.get(roomId);
      const occupants = room ? room.size : 0;
      if (occupants >= MAX_PER_ROOM) {
        socket.emit('room-full', roomId);
        return;
      }

      void socket.join(roomId);
      joinedRoom = roomId;
      // Tell the joiner whether someone is already here, and notify that peer.
      socket.emit('peer-present', occupants > 0);
      if (occupants > 0) socket.to(roomId).emit('peer-joined');
    });

    // Relay signaling to the other socket in the room.
    socket.on('signal', (message: SignalMessage) => {
      if (joinedRoom) socket.to(joinedRoom).emit('signal', message);
    });

    function leave() {
      if (joinedRoom) {
        socket.to(joinedRoom).emit('peer-left');
        void socket.leave(joinedRoom);
        joinedRoom = null;
      }
    }

    socket.on('leave', leave);
    socket.on('disconnect', leave);
  });

  return io;
}
