import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from './runtime-config';

export function createRealtimeSocket(token: string): Socket {
  return io(getSocketUrl(), {
    transports: ['websocket'],
    auth: {
      token,
    },
  });
}
