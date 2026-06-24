import type { IceServerConfig } from '@signbridge/shared-types';
import { env } from '../config/env.js';

/**
 * Builds the ICE server list for WebRTC. Always includes a free public STUN
 * server (enough for same-network / localhost calls); adds TURN only if it is
 * configured (needed for many cross-network calls).
 */
export function getIceServers(): IceServerConfig[] {
  const servers: IceServerConfig[] = [{ urls: 'stun:stun.l.google.com:19302' }];
  if (env.TURN_URL) {
    servers.push({
      urls: env.TURN_URL,
      ...(env.TURN_USERNAME ? { username: env.TURN_USERNAME } : {}),
      ...(env.TURN_CREDENTIAL ? { credential: env.TURN_CREDENTIAL } : {}),
    });
  }
  return servers;
}
