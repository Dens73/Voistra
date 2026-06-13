import type { AudioEnhancementMode } from '../types';

export function getMediaConstraintFlags(mode: AudioEnhancementMode) {
  if (mode === 'studio') {
    return {
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false,
    };
  }

  return {
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
  };
}

export function getMicTestScale(mode: AudioEnhancementMode) {
  if (mode === 'voice_focus') {
    return 260;
  }

  if (mode === 'balanced') {
    return 240;
  }

  return 220;
}
