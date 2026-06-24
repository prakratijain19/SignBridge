import { io, type Socket } from 'socket.io-client';
import type { SignalMessage } from '@signbridge/shared-types';
import { API_URL } from '../auth-api';

/**
 * Thin wrapper over the authenticated Socket.IO connection used purely for
 * WebRTC signaling (SDP + ICE relay) and room presence.
 */
export interface Signaling {
  socket: Socket;
  join: (roomId: string) => void;
  leave: () => void;
  sendSignal: (msg: SignalMessage) => void;
  onSignal: (cb: (msg: SignalMessage) => void) => void;
  onPeerJoined: (cb: () => void) => void;
  onPeerPresent: (cb: (present: boolean) => void) => void;
  onPeerLeft: (cb: () => void) => void;
  onRoomFull: (cb: () => void) => void;
  disconnect: () => void;
}

export function createSignaling(token: string): Signaling {
  const socket = io(API_URL, { auth: { token }, transports: ['websocket'] });
  let room: string | null = null;

  return {
    socket,
    join: (roomId) => {
      room = roomId;
      socket.emit('join', roomId);
    },
    leave: () => {
      if (room) socket.emit('leave');
      room = null;
    },
    sendSignal: (msg) => socket.emit('signal', msg),
    onSignal: (cb) => socket.on('signal', cb),
    onPeerJoined: (cb) => socket.on('peer-joined', cb),
    onPeerPresent: (cb) => socket.on('peer-present', cb),
    onPeerLeft: (cb) => socket.on('peer-left', cb),
    onRoomFull: (cb) => socket.on('room-full', cb),
    disconnect: () => socket.disconnect(),
  };
}
