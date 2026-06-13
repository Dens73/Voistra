import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import type { AudioEnhancementMode, VoiceFlags } from '../types';
import { getMediaConstraintFlags, getMicTestScale } from './audio-processing';
import { buildProcessedMicrophoneGraph } from './noise-suppression';

type UseLocalAudioControlsParams = {
  asMessage: (value: unknown) => string;
  audioControlForm: { inputLevel: number };
  audioEnhancementMode: AudioEnhancementMode;
  audioStreamRef: MutableRefObject<MediaStream | null>;
  micTestAnalyserRef: MutableRefObject<AnalyserNode | null>;
  micTestAnimationFrameRef: MutableRefObject<number | null>;
  micTestAudioContextRef: MutableRefObject<AudioContext | null>;
  micTestRunning: boolean;
  micTestStreamRef: MutableRefObject<MediaStream | null>;
  selectedInputDeviceId: string;
  setAudioEnhancementMode: Dispatch<SetStateAction<AudioEnhancementMode>>;
  setError: Dispatch<SetStateAction<string>>;
  setInputDevices: Dispatch<SetStateAction<MediaDeviceInfo[]>>;
  setMicTestLevel: Dispatch<SetStateAction<number>>;
  setMicTestRunning: Dispatch<SetStateAction<boolean>>;
  setOutputDevices: Dispatch<SetStateAction<MediaDeviceInfo[]>>;
  setProfileForm: Dispatch<
    SetStateAction<{
      displayName: string;
      avatarUrl: string;
      bio: string;
      currentPassword: string;
      newPassword: string;
      reconnectEnabled: boolean;
      pushToTalkEnabled: boolean;
      voiceActivationEnabled: boolean;
      noiseSuppressionEnabled: boolean;
      echoCancellationEnabled: boolean;
      autoGainControlEnabled: boolean;
    }>
  >;
};

export function useLocalAudioControls({
  asMessage,
  audioControlForm,
  audioEnhancementMode,
  audioStreamRef,
  micTestAnalyserRef,
  micTestAnimationFrameRef,
  micTestAudioContextRef,
  micTestRunning,
  micTestStreamRef,
  selectedInputDeviceId,
  setAudioEnhancementMode,
  setError,
  setInputDevices,
  setMicTestLevel,
  setMicTestRunning,
  setOutputDevices,
  setProfileForm,
}: UseLocalAudioControlsParams) {
  function stopMicTest() {
    if (micTestAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(micTestAnimationFrameRef.current);
      micTestAnimationFrameRef.current = null;
    }
    micTestStreamRef.current?.getTracks().forEach((track) => track.stop());
    micTestStreamRef.current = null;
    micTestAudioContextRef.current?.close().catch(() => undefined);
    micTestAudioContextRef.current = null;
    micTestAnalyserRef.current = null;
    setMicTestRunning(false);
    setMicTestLevel(0);
  }

  function applyLocalAudioTrackState(nextFlags: VoiceFlags) {
    const enabled =
      !nextFlags.muted &&
      !nextFlags.deafened &&
      (nextFlags.voiceActivationActive || nextFlags.pushToTalkActive || nextFlags.speaking);
    audioStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });
  }

  function applyAudioEnhancementMode(mode: AudioEnhancementMode) {
    setAudioEnhancementMode(mode);

    if (mode === 'voice_focus' || mode === 'balanced') {
      setProfileForm((current) => ({
        ...current,
        pushToTalkEnabled: false,
        voiceActivationEnabled: true,
        noiseSuppressionEnabled: true,
        echoCancellationEnabled: true,
        autoGainControlEnabled: true,
      }));
      return;
    }

    setProfileForm((current) => ({
      ...current,
      noiseSuppressionEnabled: false,
      echoCancellationEnabled: false,
      autoGainControlEnabled: false,
    }));
  }

  async function refreshMediaDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setInputDevices(devices.filter((device) => device.kind === 'audioinput'));
      setOutputDevices(devices.filter((device) => device.kind === 'audiooutput'));
    } catch {
      // Best effort device listing.
    }
  }

  async function toggleMicrophoneTest() {
    if (micTestRunning) {
      stopMicTest();
      return;
    }

    try {
      const mediaFlags = getMediaConstraintFlags(audioEnhancementMode);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInputDeviceId !== 'default' ? { exact: selectedInputDeviceId } : undefined,
          echoCancellation: mediaFlags.echoCancellation,
          noiseSuppression: mediaFlags.noiseSuppression,
          autoGainControl: mediaFlags.autoGainControl,
          channelCount: 1,
        },
      });

      const context = new AudioContext();
      await context.resume().catch(() => undefined);
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      const processed = await buildProcessedMicrophoneGraph(context, stream, {
        inputLevel: audioControlForm.inputLevel,
        mode: audioEnhancementMode,
      });
      processed.output.connect(analyser);

      micTestStreamRef.current = stream;
      micTestAudioContextRef.current = context;
      micTestAnalyserRef.current = analyser;
      setMicTestRunning(true);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (const value of data) {
          const normalized = (value - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        setMicTestLevel(Math.max(0, Math.min(100, Math.round(rms * getMicTestScale(audioEnhancementMode)))));
        micTestAnimationFrameRef.current = window.requestAnimationFrame(tick);
      };

      tick();
    } catch (nextError) {
      setError(asMessage(nextError));
    }
  }

  return {
    applyAudioEnhancementMode,
    applyLocalAudioTrackState,
    refreshMediaDevices,
    stopMicTest,
    toggleMicrophoneTest,
  };
}
