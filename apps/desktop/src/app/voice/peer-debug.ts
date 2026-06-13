import type { PeerDebugState } from '../types';

export function createDefaultPeerDebug({
  remoteUserId,
  pc,
  lastEvent,
  localAudioTrack,
  localVideoTrack,
  pendingIce,
}: {
  remoteUserId: string;
  pc: RTCPeerConnection | null;
  lastEvent: string;
  localAudioTrack: boolean;
  localVideoTrack: boolean;
  pendingIce: number;
}): PeerDebugState {
  return {
    remoteUserId,
    signalingState: pc?.signalingState ?? 'unknown',
    iceConnectionState: pc?.iceConnectionState ?? 'new',
    connectionState: pc?.connectionState ?? 'new',
    localDescriptionType: pc?.localDescription?.type ?? 'none',
    remoteDescriptionType: pc?.remoteDescription?.type ?? 'none',
    localAudioTrack,
    localVideoTrack,
    remoteAudioTrack: false,
    remoteVideoTrack: false,
    offersSent: 0,
    answersSent: 0,
    iceSent: 0,
    iceReceived: 0,
    pendingIce,
    lastEvent,
    updatedAt: new Date().toISOString(),
  };
}
