import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://127.0.0.1:3000/ws';

export function createRealtimeSocket(token: string): Socket {
  return io(SOCKET_URL, {
    transports: ['websocket'],
    auth: {
      token,
    },
  });
}
