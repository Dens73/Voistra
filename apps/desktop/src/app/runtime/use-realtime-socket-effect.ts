import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';

import { createRealtimeSocket } from '../../lib/socket';
import type { AuthUser, ConnectionMetrics, VoiceParticipant } from '../../types';
import type { PeerDebugState, SignalingDescription, SignalingIce } from '../types';

type SocketCopy = {
  realtimeConnected: string;
  realtimeDisconnected: string;
  screenShare: string;
  turnReady: string;
};

type Params = {
  handleRemoteDescription: (payload: SignalingDescription) => Promise<void>;
  handleRemoteIce: (payload: SignalingIce) => Promise<void>;
  i18n: SocketCopy;
  language: 'ru' | 'en';
  participantSocketsRef: MutableRefObject<Map<string, string>>;
  peerLabel: (userId: string) => string;
  pushNotification: (title: string, body: string, tone?: 'soft' | 'alert') => void;
  setActiveScreenShares: Dispatch<SetStateAction<Record<string, string>>>;
  setMetrics: Dispatch<SetStateAction<Record<string, ConnectionMetrics>>>;
  setOnlineUserIds: Dispatch<SetStateAction<string[]>>;
  setParticipants: Dispatch<SetStateAction<VoiceParticipant[]>>;
  setRtcConfig: Dispatch<SetStateAction<RTCConfiguration>>;
  setSocket: Dispatch<SetStateAction<Socket | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
  socket: Socket | null;
  socketRef: MutableRefObject<Socket | null>;
  syncPeerConnections: (list: VoiceParticipant[]) => void;
  token: string;
  updatePeerDebug: (remoteUserId: string, updater: (current: PeerDebugState) => PeerDebugState) => void;
  user: AuthUser | null;
};

export function useRealtimeSocketEffect({
  handleRemoteDescription,
  handleRemoteIce,
  i18n,
  language,
  participantSocketsRef,
  peerLabel,
  pushNotification,
  setActiveScreenShares,
  setMetrics,
  setOnlineUserIds,
  setParticipants,
  setRtcConfig,
  setSocket,
  setStatus,
  socket,
  socketRef,
  syncPeerConnections,
  token,
  updatePeerDebug,
  user,
}: Params) {
  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const nextSocket = createRealtimeSocket(token);
    socketRef.current = nextSocket;

    nextSocket.on('connect', () => {
      setStatus(i18n.realtimeConnected);
    });

    nextSocket.on('disconnect', () => {
      setStatus(i18n.realtimeDisconnected);
      setParticipants([]);
    });

    nextSocket.on('session.ready', (payload: { turn: { url: string; username?: string; password?: string } }) => {
      setStatus(`${i18n.turnReady}: ${payload.turn.url}`);
      setRtcConfig({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: payload.turn.url,
            username: payload.turn.username,
            credential: payload.turn.password,
          },
        ],
      });
    });

    nextSocket.on('voice:participants', (list: VoiceParticipant[]) => {
      participantSocketsRef.current = new Map(
        list
          .filter((participant) => Boolean(participant.socketId))
          .map((participant) => [participant.userId, participant.socketId as string]),
      );
      setParticipants(list);
      syncPeerConnections(list);
    });

    nextSocket.on('voice:state', (payload: { state: VoiceParticipant }) => {
      if (payload.state.socketId) {
        participantSocketsRef.current.set(payload.state.userId, payload.state.socketId);
      }
      setParticipants((current) => {
        const next = current.filter((participant) => participant.userId !== payload.state.userId);
        return [...next, payload.state];
      });
    });

    nextSocket.on('metrics:updated', (payload: { userId: string; metrics: ConnectionMetrics }) => {
      setMetrics((current) => ({
        ...current,
        [payload.userId]: payload.metrics,
      }));
    });

    nextSocket.on('presence:online', (payload: { onlineUserIds: string[] }) => {
      setOnlineUserIds(payload.onlineUserIds);
    });

    nextSocket.on('screen-share:started', (payload: { sourceName: string; userId: string }) => {
      setActiveScreenShares((current) => ({
        ...current,
        [payload.userId]: payload.sourceName,
      }));
      setStatus(`${i18n.screenShare}: ${payload.sourceName}`);
      if (payload.userId !== user?.id) {
        pushNotification(
          language === 'ru' ? 'Запущена демонстрация экрана' : 'Screen share started',
          `${peerLabel(payload.userId)}: ${payload.sourceName}`,
          'soft',
        );
      }
    });

    nextSocket.on('screen-share:stopped', (payload: { userId: string }) => {
      setActiveScreenShares((current) => {
        const next = { ...current };
        delete next[payload.userId];
        return next;
      });
      setStatus('Screen share stopped');
      if (payload.userId !== user?.id) {
        pushNotification(
          language === 'ru' ? 'Демонстрация экрана остановлена' : 'Screen share stopped',
          peerLabel(payload.userId),
          'soft',
        );
      }
    });

    nextSocket.on('signal:sdp', (payload: SignalingDescription) => {
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        lastEvent: `sdp-received:${payload.description.type ?? 'unknown'}`,
        updatedAt: new Date().toISOString(),
      }));
      void handleRemoteDescription(payload);
    });

    nextSocket.on('signal:ice', (payload: SignalingIce) => {
      void handleRemoteIce(payload);
    });

    setSocket(nextSocket);

    return () => {
      socketRef.current = null;
      nextSocket.disconnect();
      setSocket(null);
    };
  }, [token, user]);
}
