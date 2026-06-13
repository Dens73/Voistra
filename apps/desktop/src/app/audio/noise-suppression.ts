import { RnnoiseWorkletNode, loadRnnoise } from '@sapphi-red/web-noise-suppressor';
import rnnoiseWorkletPath from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url';
import rnnoiseWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url';
import rnnoiseSimdWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url';

import type { AudioEnhancementMode } from '../types';

let rnnoiseBinary: ArrayBuffer | null = null;
let rnnoiseBinaryPromise: Promise<ArrayBuffer> | null = null;

async function loadRnnoiseBinaryOnce() {
  if (rnnoiseBinary) {
    return rnnoiseBinary;
  }

  if (!rnnoiseBinaryPromise) {
    rnnoiseBinaryPromise = loadRnnoise({
      url: rnnoiseWasmPath,
      simdUrl: rnnoiseSimdWasmPath,
    }).then((binary) => {
      rnnoiseBinary = binary;
      return binary;
    });
  }

  return rnnoiseBinaryPromise;
}

export async function buildProcessedMicrophoneGraph(
  context: AudioContext,
  stream: MediaStream,
  options: {
    inputLevel: number;
    mode: AudioEnhancementMode;
  },
) {
  const source = context.createMediaStreamSource(stream);
  const inputGain = context.createGain();
  inputGain.gain.value = Math.max(0, Math.min(2, options.inputLevel / 100));
  source.connect(inputGain);

  let tail: AudioNode = inputGain;

  const highpass = context.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = options.mode === 'studio' ? 70 : options.mode === 'balanced' ? 95 : 120;
  highpass.Q.value = 0.7;
  tail.connect(highpass);
  tail = highpass;

  if (options.mode !== 'studio' && typeof context.audioWorklet !== 'undefined') {
    try {
      await context.audioWorklet.addModule(rnnoiseWorkletPath);
      const wasmBinary = await loadRnnoiseBinaryOnce();
      const rnnoise = new RnnoiseWorkletNode(context, {
        wasmBinary,
        maxChannels: 1,
      });
      tail.connect(rnnoise);
      tail = rnnoise;
    } catch {
      // Fall back to the native Web Audio chain if RNNoise is unavailable.
    }
  }

  if (options.mode !== 'studio') {
    const humCut = context.createBiquadFilter();
    humCut.type = 'notch';
    humCut.frequency.value = 50;
    humCut.Q.value = 3.5;
    tail.connect(humCut);
    tail = humCut;

    const presence = context.createBiquadFilter();
    presence.type = 'peaking';
    presence.frequency.value = 2500;
    presence.Q.value = 1.1;
    presence.gain.value = options.mode === 'voice_focus' ? 2.4 : 1.3;
    tail.connect(presence);
    tail = presence;
  }

  const lowpass = context.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = options.mode === 'studio' ? 12000 : options.mode === 'balanced' ? 9000 : 7600;
  lowpass.Q.value = 0.7;
  tail.connect(lowpass);
  tail = lowpass;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = options.mode === 'voice_focus' ? -30 : options.mode === 'balanced' ? -24 : -18;
  compressor.knee.value = options.mode === 'voice_focus' ? 24 : 18;
  compressor.ratio.value = options.mode === 'voice_focus' ? 12 : options.mode === 'balanced' ? 8 : 3;
  compressor.attack.value = options.mode === 'studio' ? 0.01 : 0.003;
  compressor.release.value = options.mode === 'voice_focus' ? 0.16 : 0.22;
  tail.connect(compressor);
  tail = compressor;

  const outputTrim = context.createGain();
  outputTrim.gain.value = options.mode === 'voice_focus' ? 1.05 : 1;
  tail.connect(outputTrim);

  return { source, inputGain, output: outputTrim };
}
