import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';

import type { ConnectionMetrics, VoiceParticipant } from '../../types';
import type {
  AudioEnhancementMode,
  ConnectedVoiceSession,
  PeerDebugState,
  RemoteMedia,
  SignalingDescription,
  SignalingIce,
  VoiceFlags,
} from '../types';
import { getMediaConstraintFlags } from '../audio/audio-processing';
import { buildProcessedMicrophoneGraph } from '../audio/noise-suppression';
import { createDefaultPeerDebug } from './peer-debug';

type VoiceCopy = {
  connectedToVoice: string;
  disconnectedFrom: string;
  inactive: string;
  screenShare: string;
};

type VoiceRealtimeParams = {
  audioControlForm: { inputLevel: number };
  audioEnhancementMode: AudioEnhancementMode;
  connectedVoiceSession: ConnectedVoiceSession | null;
  displayStreamRef: MutableRefObject<MediaStream | null>;
  i18n: VoiceCopy;
  language: 'ru' | 'en';
  peerLabel: (userId: string) => string;
  rtcConfig: RTCConfiguration;
  screenShareStoppingRef: MutableRefObject<boolean>;
  selectedChannel: { id: string; name: string; type: 'text' | 'voice' } | null;
  selectedInputDeviceId: string;
  selectedServerId: string;
  setActiveScreenShares: Dispatch<SetStateAction<Record<string, string>>>;
  setConnectedVoiceSession: Dispatch<SetStateAction<ConnectedVoiceSession | null>>;
  setError: Dispatch<SetStateAction<string>>;
  setMetrics: Dispatch<SetStateAction<Record<string, ConnectionMetrics>>>;
  setNetworkTicker: Dispatch<SetStateAction<number>>;
  setParticipants: Dispatch<SetStateAction<VoiceParticipant[]>>;
  setPeerDebug: Dispatch<SetStateAction<Record<string, PeerDebugState>>>;
  setRemoteMedia: Dispatch<SetStateAction<Record<string, RemoteMedia>>>;
  setScreenShareEnabled: Dispatch<SetStateAction<boolean>>;
  setScreenShareLabel: Dispatch<SetStateAction<string>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setVoiceFlags: Dispatch<SetStateAction<VoiceFlags>>;
  shareSystemAudioEnabled: boolean;
  socket: Socket | null;
  socketRef: MutableRefObject<Socket | null>;
  userId?: string;
  voiceFlags: VoiceFlags;
  activeVoiceChannelIdRef: MutableRefObject<string>;
  applyLocalAudioTrackState: (flags: VoiceFlags) => void;
  asMessage: (value: unknown) => string;
  audioStreamRef: MutableRefObject<MediaStream | null>;
  microphoneGainNodeRef: MutableRefObject<GainNode | null>;
  microphoneStreamRef: MutableRefObject<MediaStream | null>;
  mixedAudioContextRef: MutableRefObject<AudioContext | null>;
  mixedAudioStreamRef: MutableRefObject<MediaStream | null>;
  participantSocketsRef: MutableRefObject<Map<string, string>>;
  peerConnectionsRef: MutableRefObject<Map<string, RTCPeerConnection>>;
  pendingIceRef: MutableRefObject<Map<string, RTCIceCandidateInit[]>>;
  makingOfferRef: MutableRefObject<Set<string>>;
  ignoredOfferRef: MutableRefObject<Set<string>>;
  previewVideoRef: MutableRefObject<HTMLVideoElement | null>;
  pushToast: (message: string) => void;
  statsBytesRef: MutableRefObject<Map<string, { bytes: number; timestamp: number }>>;
};

export function useVoiceRealtime({
  activeVoiceChannelIdRef,
  applyLocalAudioTrackState,
  asMessage,
  audioControlForm,
  audioEnhancementMode,
  audioStreamRef,
  connectedVoiceSession,
  displayStreamRef,
  i18n,
  ignoredOfferRef,
  language,
  makingOfferRef,
  microphoneGainNodeRef,
  microphoneStreamRef,
  mixedAudioContextRef,
  mixedAudioStreamRef,
  participantSocketsRef,
  peerConnectionsRef,
  peerLabel,
  pendingIceRef,
  previewVideoRef,
  pushToast,
  rtcConfig,
  screenShareStoppingRef,
  selectedChannel,
  selectedInputDeviceId,
  selectedServerId,
  setActiveScreenShares,
  setConnectedVoiceSession,
  setError,
  setMetrics,
  setNetworkTicker,
  setParticipants,
  setPeerDebug,
  setRemoteMedia,
  setScreenShareEnabled,
  setScreenShareLabel,
  setStatus,
  setVoiceFlags,
  shareSystemAudioEnabled,
  socket,
  socketRef,
  statsBytesRef,
  userId,
  voiceFlags,
}: VoiceRealtimeParams) {
  function cleanupMixedAudio() {
    mixedAudioStreamRef.current?.getTracks().forEach((track) => track.stop());
    mixedAudioStreamRef.current = null;
    mixedAudioContextRef.current?.close().catch(() => undefined);
    mixedAudioContextRef.current = null;
  }

  function stopDisplayStreamTracks(stream: MediaStream | null) {
    stream?.getTracks().forEach((track) => {
      try {
        track.onended = null;
        track.stop();
      } catch {
        // Ignore best-effort media shutdown failures to avoid collapsing the UI.
      }
    });
  }

  function updatePeerDebug(
    remoteUserId: string,
    updater: (current: PeerDebugState) => PeerDebugState,
  ) {
    setPeerDebug((current) => {
      const base =
        current[remoteUserId] ??
        createDefaultPeerDebug({
          remoteUserId,
          pc: peerConnectionsRef.current.get(remoteUserId) ?? null,
          lastEvent: 'debug-init',
          localAudioTrack: Boolean(audioStreamRef.current?.getAudioTracks()[0]),
          localVideoTrack: Boolean(displayStreamRef.current?.getVideoTracks()[0]),
          pendingIce: pendingIceRef.current.get(remoteUserId)?.length ?? 0,
        });
      return {
        ...current,
        [remoteUserId]: updater(base),
      };
    });
  }

  function syncPeerConnectionDebug(remoteUserId: string, pc: RTCPeerConnection, lastEvent: string) {
    updatePeerDebug(remoteUserId, (current) => ({
      ...current,
      signalingState: pc.signalingState,
      iceConnectionState: pc.iceConnectionState,
      connectionState: pc.connectionState,
      localDescriptionType: pc.localDescription?.type ?? 'none',
      remoteDescriptionType: pc.remoteDescription?.type ?? 'none',
      localAudioTrack: Boolean(audioStreamRef.current?.getAudioTracks()[0]),
      localVideoTrack: Boolean(displayStreamRef.current?.getVideoTracks()[0]),
      pendingIce: pendingIceRef.current.get(remoteUserId)?.length ?? 0,
      lastEvent,
      updatedAt: new Date().toISOString(),
    }));
  }

  async function rebuildOutboundAudioStream() {
    const microphoneStream = microphoneStreamRef.current;
    const displayStream = displayStreamRef.current;
    const displayAudioTrack = shareSystemAudioEnabled ? displayStream?.getAudioTracks()[0] : undefined;

    cleanupMixedAudio();
    microphoneGainNodeRef.current = null;

    if (!microphoneStream) {
      audioStreamRef.current = null;
      return;
    }

    if (!displayAudioTrack && audioControlForm.inputLevel === 100 && audioEnhancementMode === 'studio') {
      audioStreamRef.current = microphoneStream;
      return;
    }

    try {
      const mixedContext = new AudioContext();
      await mixedContext.resume().catch(() => undefined);
      const destination = mixedContext.createMediaStreamDestination();
      const processed = await buildProcessedMicrophoneGraph(mixedContext, microphoneStream, {
        inputLevel: audioControlForm.inputLevel,
        mode: audioEnhancementMode,
      });
      microphoneGainNodeRef.current = processed.inputGain;
      processed.output.connect(destination);

      if (displayAudioTrack) {
        const displaySource = mixedContext.createMediaStreamSource(new MediaStream([displayAudioTrack]));
        displaySource.connect(destination);
      }

      mixedAudioContextRef.current = mixedContext;
      mixedAudioStreamRef.current = destination.stream;
      audioStreamRef.current = destination.stream;
      applyLocalAudioTrackState(voiceFlags);
    } catch (nextError) {
      audioStreamRef.current = microphoneStream;
      applyLocalAudioTrackState(voiceFlags);
      setError(asMessage(nextError));
    }
  }

  function ensureTransceiver(pc: RTCPeerConnection, kind: 'audio' | 'video') {
    const existing = pc.getTransceivers().find((transceiver) => transceiver.receiver.track.kind === kind);
    return existing ?? pc.addTransceiver(kind, { direction: 'sendrecv' });
  }

  async function syncLocalTracksToPeer(pc: RTCPeerConnection) {
    const audioTransceiver = ensureTransceiver(pc, 'audio');
    const videoTransceiver = ensureTransceiver(pc, 'video');
    const nextAudioTrack = audioStreamRef.current?.getAudioTracks()[0] ?? null;
    const nextVideoTrack = displayStreamRef.current?.getVideoTracks()[0] ?? null;

    await Promise.all([
      audioTransceiver.sender.replaceTrack(nextAudioTrack),
      videoTransceiver.sender.replaceTrack(nextVideoTrack),
    ]);
    for (const [remoteUserId, currentPc] of peerConnectionsRef.current.entries()) {
      if (currentPc === pc) {
        syncPeerConnectionDebug(remoteUserId, pc, 'local-tracks-synced');
      }
    }
  }

  async function flushPendingIce(remoteUserId: string, pc: RTCPeerConnection) {
    if (!pc.remoteDescription) {
      return;
    }

    const queued = pendingIceRef.current.get(remoteUserId) ?? [];
    pendingIceRef.current.delete(remoteUserId);
    for (const candidate of queued) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    if (queued.length > 0) {
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        pendingIce: 0,
        lastEvent: 'queued-ice-flushed',
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  async function sendOffer(remoteUserId: string, pc: RTCPeerConnection) {
    if (
      !socketRef.current ||
      !activeVoiceChannelIdRef.current ||
      makingOfferRef.current.has(remoteUserId) ||
      pc.signalingState !== 'stable'
    ) {
      return;
    }

    try {
      makingOfferRef.current.add(remoteUserId);
      await syncLocalTracksToPeer(pc);
      await pc.setLocalDescription(await pc.createOffer());
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        offersSent: current.offersSent + 1,
        localDescriptionType: pc.localDescription?.type ?? current.localDescriptionType,
        lastEvent: 'offer-sent',
        updatedAt: new Date().toISOString(),
      }));
      socketRef.current.emit(
        'signal:sdp',
        {
          channelId: activeVoiceChannelIdRef.current,
          targetUserId: remoteUserId,
          targetSocketId: participantSocketsRef.current.get(remoteUserId),
          description: pc.localDescription?.toJSON(),
        },
        (response?: { ok?: boolean; reason?: string }) => {
          if (!response?.ok) {
            updatePeerDebug(remoteUserId, (current) => ({
              ...current,
              lastEvent: `offer-failed:${response?.reason ?? 'unknown'}`,
              updatedAt: new Date().toISOString(),
            }));
          }
        },
      );
    } catch (nextError) {
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        lastEvent: `offer-error:${asMessage(nextError)}`,
        updatedAt: new Date().toISOString(),
      }));
      setError(asMessage(nextError));
    } finally {
      makingOfferRef.current.delete(remoteUserId);
    }
  }

  function createPeerConnection(remoteUserId: string) {
    const existing = peerConnectionsRef.current.get(remoteUserId);
    if (existing) {
      return existing;
    }

    const pc = new RTCPeerConnection(rtcConfig);
    ensureTransceiver(pc, 'audio');
    ensureTransceiver(pc, 'video');
    peerConnectionsRef.current.set(remoteUserId, pc);
    updatePeerDebug(remoteUserId, () =>
      createDefaultPeerDebug({
        remoteUserId,
        pc,
        lastEvent: 'peer-created',
        localAudioTrack: Boolean(audioStreamRef.current?.getAudioTracks()[0]),
        localVideoTrack: Boolean(displayStreamRef.current?.getVideoTracks()[0]),
        pendingIce: pendingIceRef.current.get(remoteUserId)?.length ?? 0,
      }),
    );

    pc.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current || !activeVoiceChannelIdRef.current) {
        return;
      }

      socketRef.current.emit(
        'signal:ice',
        {
          channelId: activeVoiceChannelIdRef.current,
          targetUserId: remoteUserId,
          targetSocketId: participantSocketsRef.current.get(remoteUserId),
          candidate: event.candidate.toJSON(),
        },
        (response?: { ok?: boolean; reason?: string }) => {
          if (!response?.ok) {
            updatePeerDebug(remoteUserId, (current) => ({
              ...current,
              lastEvent: `ice-failed:${response?.reason ?? 'unknown'}`,
              updatedAt: new Date().toISOString(),
            }));
          }
        },
      );
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        iceSent: current.iceSent + 1,
        lastEvent: 'ice-sent',
        updatedAt: new Date().toISOString(),
      }));
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      const isVideo = event.track.kind === 'video';

      setRemoteMedia((current) => ({
        ...current,
        [remoteUserId]: {
          ...current[remoteUserId],
          userId: remoteUserId,
          ...(isVideo ? { screenStream: stream } : { audioStream: stream }),
        },
      }));
      updatePeerDebug(remoteUserId, (current) => ({
        ...current,
        remoteAudioTrack: current.remoteAudioTrack || event.track.kind === 'audio',
        remoteVideoTrack: current.remoteVideoTrack || event.track.kind === 'video',
        lastEvent: `track-${event.track.kind}`,
        updatedAt: new Date().toISOString(),
      }));
    };

    pc.onconnectionstatechange = () => {
      syncPeerConnectionDebug(remoteUserId, pc, 'connection-state');
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        setRemoteMedia((current) => {
          const next = { ...current };
          delete next[remoteUserId];
          return next;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      syncPeerConnectionDebug(remoteUserId, pc, 'ice-connection-state');
    };

    pc.onsignalingstatechange = () => {
      syncPeerConnectionDebug(remoteUserId, pc, 'signaling-state');
    };

    pc.onnegotiationneeded = () => {
      void sendOffer(remoteUserId, pc);
    };

    void syncLocalTracksToPeer(pc);
    void flushPendingIce(remoteUserId, pc);

    return pc;
  }

  async function handleRemoteDescription(payload: SignalingDescription) {
    if (payload.channelId !== activeVoiceChannelIdRef.current || payload.fromUserId === userId) {
      return;
    }

    const pc = createPeerConnection(payload.fromUserId);
    const description = new RTCSessionDescription(payload.description);
    const isOffer = description.type === 'offer';
    const offerCollision = isOffer && (makingOfferRef.current.has(payload.fromUserId) || pc.signalingState !== 'stable');

    ignoredOfferRef.current.delete(payload.fromUserId);
    if (offerCollision && (userId ?? '') < payload.fromUserId) {
      ignoredOfferRef.current.add(payload.fromUserId);
      return;
    }

    try {
      if (offerCollision) {
        await pc.setLocalDescription({ type: 'rollback' });
      }

      await pc.setRemoteDescription(description);
      syncPeerConnectionDebug(payload.fromUserId, pc, `remote-${description.type}`);
      await flushPendingIce(payload.fromUserId, pc);

      if (description.type === 'offer') {
        await syncLocalTracksToPeer(pc);
        await pc.setLocalDescription(await pc.createAnswer());
        updatePeerDebug(payload.fromUserId, (current) => ({
          ...current,
          answersSent: current.answersSent + 1,
          localDescriptionType: pc.localDescription?.type ?? current.localDescriptionType,
          lastEvent: 'answer-sent',
          updatedAt: new Date().toISOString(),
        }));
        socketRef.current?.emit(
          'signal:sdp',
          {
            channelId: payload.channelId,
            targetUserId: payload.fromUserId,
            targetSocketId: participantSocketsRef.current.get(payload.fromUserId),
            description: pc.localDescription?.toJSON(),
          },
          (response?: { ok?: boolean; reason?: string }) => {
            if (!response?.ok) {
              updatePeerDebug(payload.fromUserId, (current) => ({
                ...current,
                lastEvent: `answer-failed:${response?.reason ?? 'unknown'}`,
                updatedAt: new Date().toISOString(),
              }));
            }
          },
        );
      }
    } catch (nextError) {
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        lastEvent: `remote-description-error:${asMessage(nextError)}`,
        updatedAt: new Date().toISOString(),
      }));
      setError(asMessage(nextError));
    }
  }

  async function handleRemoteIce(payload: SignalingIce) {
    if (payload.channelId !== activeVoiceChannelIdRef.current || payload.fromUserId === userId) {
      return;
    }

    if (ignoredOfferRef.current.has(payload.fromUserId)) {
      return;
    }

    const pc = peerConnectionsRef.current.get(payload.fromUserId);
    if (!pc || !pc.remoteDescription) {
      const queue = pendingIceRef.current.get(payload.fromUserId) ?? [];
      queue.push(payload.candidate);
      pendingIceRef.current.set(payload.fromUserId, queue);
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        iceReceived: current.iceReceived + 1,
        pendingIce: queue.length,
        lastEvent: 'ice-queued',
        updatedAt: new Date().toISOString(),
      }));
      return;
    }

    try {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        iceReceived: current.iceReceived + 1,
        pendingIce: 0,
        lastEvent: 'ice-applied',
        updatedAt: new Date().toISOString(),
      }));
    } catch (nextError) {
      updatePeerDebug(payload.fromUserId, (current) => ({
        ...current,
        lastEvent: `ice-error:${asMessage(nextError)}`,
        updatedAt: new Date().toISOString(),
      }));
      setError(asMessage(nextError));
    }
  }

  function syncPeerConnections(list: VoiceParticipant[]) {
    if (!userId || !audioStreamRef.current) {
      return;
    }

    const remoteParticipants = list.filter((participant) => participant.userId !== userId);
    const remoteIds = new Set(remoteParticipants.map((participant) => participant.userId));
    let createdPeer = false;

    for (const participant of remoteParticipants) {
      setRemoteMedia((current) => ({
        ...current,
        [participant.userId]: current[participant.userId] ?? { userId: participant.userId },
      }));
      const existingPeer = peerConnectionsRef.current.get(participant.userId);
      createPeerConnection(participant.userId);
      if (!existingPeer) {
        createdPeer = true;
      }
    }

    for (const [remoteUserId, pc] of peerConnectionsRef.current.entries()) {
      if (!remoteIds.has(remoteUserId)) {
        pc.close();
        peerConnectionsRef.current.delete(remoteUserId);
        pendingIceRef.current.delete(remoteUserId);
        statsBytesRef.current.delete(remoteUserId);
        setPeerDebug((current) => {
          const next = { ...current };
          delete next[remoteUserId];
          return next;
        });
      }
    }

    setRemoteMedia((current) => {
      const next: Record<string, RemoteMedia> = {};
      for (const remoteUserId of remoteIds) {
        if (current[remoteUserId]) {
          next[remoteUserId] = current[remoteUserId];
        }
      }
      return next;
    });

    if (createdPeer && remoteIds.size > 0) {
      void renegotiatePeers();
    }
  }

  async function renegotiatePeers() {
    for (const [remoteUserId, pc] of peerConnectionsRef.current.entries()) {
      await syncLocalTracksToPeer(pc);
      if (pc.signalingState === 'stable') {
        await sendOffer(remoteUserId, pc);
      }
    }
  }

  async function collectPeerMetrics(remoteUserId: string, pc: RTCPeerConnection): Promise<ConnectionMetrics | null> {
    const report = await pc.getStats();
    let rtt: number | undefined;
    let jitter: number | undefined;
    let packetsLost = 0;
    let packetsReceived = 0;
    let outboundBytes = 0;
    let timestamp = Date.now();

    report.forEach((stat) => {
      if (stat.type === 'candidate-pair' && stat.state === 'succeeded' && typeof stat.currentRoundTripTime === 'number') {
        rtt = Math.round(stat.currentRoundTripTime * 1000);
      }
      if (stat.type === 'inbound-rtp') {
        if (typeof stat.jitter === 'number') {
          jitter = Math.round(stat.jitter * 1000);
        }
        packetsLost += typeof stat.packetsLost === 'number' ? stat.packetsLost : 0;
        packetsReceived += typeof stat.packetsReceived === 'number' ? stat.packetsReceived : 0;
      }
      if (stat.type === 'outbound-rtp' && typeof stat.bytesSent === 'number') {
        outboundBytes += stat.bytesSent;
        timestamp = stat.timestamp;
      }
    });

    const previous = statsBytesRef.current.get(remoteUserId);
    statsBytesRef.current.set(remoteUserId, { bytes: outboundBytes, timestamp });
    const bitrate =
      previous && timestamp > previous.timestamp
        ? Math.round(((outboundBytes - previous.bytes) * 8) / ((timestamp - previous.timestamp) / 1000) / 1000)
        : undefined;
    const packetTotal = packetsLost + packetsReceived;

    return {
      rtt,
      jitter,
      packetLoss: packetTotal > 0 ? Number(((packetsLost / packetTotal) * 100).toFixed(2)) : undefined,
      bitrate,
      updatedAt: new Date().toISOString(),
    };
  }

  function averageMetric(values: ConnectionMetrics[], key: keyof Omit<ConnectionMetrics, 'updatedAt'>) {
    const numbers = values.map((value) => value[key]).filter((value): value is number => typeof value === 'number');
    if (numbers.length === 0) {
      return undefined;
    }

    return Math.round(numbers.reduce((sum, value) => sum + value, 0) / numbers.length);
  }

  async function publishConnectionMetrics(channelId: string) {
    if (!socketRef.current || peerConnectionsRef.current.size === 0) {
      return;
    }

    const values = await Promise.all(
      Array.from(peerConnectionsRef.current.entries()).map(([remoteUserId, pc]) =>
        collectPeerMetrics(remoteUserId, pc),
      ),
    );
    const available = values.filter(Boolean) as ConnectionMetrics[];
    if (available.length === 0) {
      return;
    }

    const metric: ConnectionMetrics = {
      rtt: averageMetric(available, 'rtt'),
      jitter: averageMetric(available, 'jitter'),
      packetLoss: averageMetric(available, 'packetLoss'),
      bitrate: averageMetric(available, 'bitrate'),
      updatedAt: new Date().toISOString(),
    };

    socketRef.current.emit('metrics:update', {
      channelId,
      ...metric,
    });
    setMetrics((current) => ({
      ...current,
      [userId ?? 'self']: metric,
    }));
    setNetworkTicker((value) => value + 1);
  }

  function closeAllPeers() {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    pendingIceRef.current.clear();
    makingOfferRef.current.clear();
    ignoredOfferRef.current.clear();
    statsBytesRef.current.clear();
    setPeerDebug({});
    setRemoteMedia({});
    setActiveScreenShares({});
  }

  async function joinVoiceChannel() {
    if (!selectedChannel || selectedChannel.type !== 'voice' || !socket || !selectedServerId) {
      return;
    }

    try {
      activeVoiceChannelIdRef.current = selectedChannel.id;
      const mediaFlags = getMediaConstraintFlags(audioEnhancementMode);
      microphoneStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInputDeviceId !== 'default' ? { exact: selectedInputDeviceId } : undefined,
          echoCancellation: mediaFlags.echoCancellation,
          noiseSuppression: mediaFlags.noiseSuppression,
          autoGainControl: mediaFlags.autoGainControl,
          channelCount: 1,
        },
      });
      await rebuildOutboundAudioStream();

      socket.emit('voice:join', { channelId: selectedChannel.id }, (response: { ok: boolean; reason?: string }) => {
        if (!response?.ok && response?.reason) {
          setError(response.reason);
          return;
        }

        setConnectedVoiceSession({
          channelId: selectedChannel.id,
          channelName: selectedChannel.name,
          serverId: selectedServerId,
        });
        void renegotiatePeers();
        setStatus(`${i18n.connectedToVoice} ${selectedChannel.name}`);
        pushToast(language === 'ru' ? `Подключено: ${selectedChannel.name}` : `Connected: ${selectedChannel.name}`);
      });
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  function leaveVoiceChannel() {
    if (!connectedVoiceSession || !socket) {
      return;
    }

    socket.emit('voice:leave', { channelId: connectedVoiceSession.channelId });
    microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
    microphoneStreamRef.current = null;
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    stopDisplayStreamTracks(displayStreamRef.current);
    displayStreamRef.current = null;
    cleanupMixedAudio();
    closeAllPeers();
    activeVoiceChannelIdRef.current = '';
    setConnectedVoiceSession(null);
    setParticipants([]);
    setScreenShareEnabled(false);
    setScreenShareLabel('');
    setActiveScreenShares({});
    setStatus(`${i18n.disconnectedFrom} ${connectedVoiceSession.channelName}`);
    pushToast(language === 'ru' ? `Отключено: ${connectedVoiceSession.channelName}` : `Disconnected: ${connectedVoiceSession.channelName}`);
  }

  function emitVoiceState(nextState: Partial<VoiceFlags>) {
    if (!connectedVoiceSession || !socket) {
      return;
    }

    const merged = { ...voiceFlags, ...nextState };
    setVoiceFlags(merged);
    applyLocalAudioTrackState(merged);
    socket.emit('voice:state', {
      channelId: connectedVoiceSession.channelId,
      ...merged,
    });
  }

  async function startScreenShare() {
    if (!connectedVoiceSession || !socket) {
      return;
    }

    try {
      screenShareStoppingRef.current = false;
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: shareSystemAudioEnabled,
      });
      displayStreamRef.current = stream;
      await rebuildOutboundAudioStream();
      setScreenShareEnabled(true);
      const [videoTrack] = stream.getVideoTracks();
      const label = videoTrack?.label || 'screen';
      setScreenShareLabel(label);
      await renegotiatePeers();

      socket.emit(
        'screen-share:start',
        {
          channelId: connectedVoiceSession.channelId,
          sourceName: label,
          withSystemAudio: stream.getAudioTracks().length > 0,
        },
        (response: { ok: boolean; reason?: string }) => {
          if (!response?.ok && response?.reason) {
            stopScreenShare();
            setError(response.reason);
          }
        },
      );

      if (videoTrack) {
        videoTrack.onended = () => {
          if (!screenShareStoppingRef.current) {
            stopScreenShare();
          }
        };
      }
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  function stopScreenShare() {
    if (!connectedVoiceSession || !socket) {
      return;
    }

    if (screenShareStoppingRef.current) {
      return;
    }

    screenShareStoppingRef.current = true;
    stopDisplayStreamTracks(displayStreamRef.current);
    displayStreamRef.current = null;
    void rebuildOutboundAudioStream();
    void renegotiatePeers();
    setScreenShareEnabled(false);
    setScreenShareLabel('');
    if (previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
    }
    socket.emit('screen-share:stop', { channelId: connectedVoiceSession.channelId });
    setStatus(`${i18n.screenShare}: ${i18n.inactive}`);
    window.setTimeout(() => {
      screenShareStoppingRef.current = false;
    }, 0);
  }

  return {
    cleanupMixedAudio,
    closeAllPeers,
    emitVoiceState,
    handleRemoteDescription,
    handleRemoteIce,
    joinVoiceChannel,
    leaveVoiceChannel,
    publishConnectionMetrics,
    rebuildOutboundAudioStream,
    renegotiatePeers,
    startScreenShare,
    stopDisplayStreamTracks,
    stopScreenShare,
    syncPeerConnections,
    updatePeerDebug,
  };
}
