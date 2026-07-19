import { AUDIO_MANIFEST } from '@/data/audio-manifest';
import { createAudioEngine, type AudioEngine } from '@/lib/audio-engine';

let engine: AudioEngine | null = null;

/** Singleton client-safe: criar o engine não toca em AudioContext — isso só
    acontece dentro de enable(), sempre a partir de um gesto. */
export function getAudio(): AudioEngine {
  if (!engine) engine = createAudioEngine(AUDIO_MANIFEST);
  return engine;
}
