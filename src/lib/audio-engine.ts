import type { AudioManifest, CueName } from '@/data/audio-manifest';

export type AudioEngineState = 'idle' | 'armed' | 'playing' | 'suspended';

/** Superfície mínima do AudioContext que o engine usa — mockável em teste
    (mesmo padrão de RealmTransitionDocument). */
export type AudioContextLike = Pick<
  AudioContext,
  | 'createGain'
  | 'createOscillator'
  | 'createBufferSource'
  | 'createBiquadFilter'
  | 'decodeAudioData'
  | 'resume'
  | 'suspend'
  | 'close'
  | 'currentTime'
  | 'destination'
>;

export type AudioEngineDeps = {
  createContext: () => AudioContextLike;
  fetchArrayBuffer: (src: string) => Promise<ArrayBuffer>;
};

export type AudioEngine = {
  enable(): void;
  disable(): void;
  suspend(): void;
  resume(): void;
  playCue(name: CueName): void;
  getState(): AudioEngineState;
  subscribe(cb: (s: AudioEngineState) => void): () => void;
};

const FADE_IN_S = 1;
const FADE_OUT_MS = 300;
const SYNTH_DRONE_GAIN = 0.15;
const SYNTH_BASE_HZ = 55;
const SYNTH_DETUNE_RATIO = 1.007;
const SYNTH_LOWPASS_HZ = 220;
const SYNTH_LFO_HZ = 0.08;
const SYNTH_LFO_DEPTH_HZ = 60;

const DEFAULT_DEPS: AudioEngineDeps = {
  createContext: () => new AudioContext(),
  fetchArrayBuffer: async (src) => {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`audio fetch ${res.status}: ${src}`);
    return res.arrayBuffer();
  },
};

/**
 * Máquina de estados do áudio (spec Fase 6 §1). Pura: sem React, sem DOM —
 * o AudioContext e o fetch entram por injeção. `enable()` deve ser chamado
 * de dentro de um gesto do usuário (autoplay policy).
 */
export function createAudioEngine(
  manifest: AudioManifest,
  deps: Partial<AudioEngineDeps> = {},
): AudioEngine {
  const { createContext, fetchArrayBuffer } = { ...DEFAULT_DEPS, ...deps };

  let state: AudioEngineState = 'idle';
  let ctx: AudioContextLike | null = null;
  let master: GainNode | null = null;
  let userOff = false;
  const buffers = new Map<string, AudioBuffer>();
  const listeners = new Set<(s: AudioEngineState) => void>();

  const setState = (next: AudioEngineState) => {
    state = next;
    for (const cb of listeners) cb(next);
  };

  const rampMasterTo = (value: number, seconds: number) => {
    if (!ctx || !master) return;
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(value, ctx.currentTime + seconds);
  };

  const startFileDrone = (buffer: AudioBuffer) => {
    if (!ctx || !master) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = manifest.drone?.gain ?? SYNTH_DRONE_GAIN;
    source.connect(gain);
    gain.connect(master);
    source.start();
  };

  const startSynthDrone = () => {
    if (!ctx || !master) return;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = SYNTH_LOWPASS_HZ;
    const gain = ctx.createGain();
    gain.gain.value = SYNTH_DRONE_GAIN;
    filter.connect(gain);
    gain.connect(master);
    for (const hz of [SYNTH_BASE_HZ, SYNTH_BASE_HZ * SYNTH_DETUNE_RATIO]) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = hz;
      osc.connect(filter);
      osc.start();
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = SYNTH_LFO_HZ;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = SYNTH_LFO_DEPTH_HZ;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
  };

  const load = async () => {
    const cueEntries = Object.entries(manifest.cues) as Array<
      [CueName, { src: string; gain: number }]
    >;
    const entries: Array<[string, string]> = cueEntries.map(([name, cue]) => [
      name,
      cue.src,
    ]);
    if (manifest.drone) entries.push(['drone', manifest.drone.src]);
    await Promise.all(
      entries.map(async ([name, src]) => {
        const data = await fetchArrayBuffer(src);
        if (!ctx) return;
        buffers.set(name, await ctx.decodeAudioData(data));
      }),
    );
  };

  const startPlaying = () => {
    const droneBuffer = buffers.get('drone');
    if (droneBuffer) startFileDrone(droneBuffer);
    else startSynthDrone();
    rampMasterTo(1, FADE_IN_S);
    setState('playing');
  };

  return {
    enable() {
      userOff = false;
      if (state === 'suspended' && ctx) {
        void ctx.resume();
        rampMasterTo(1, FADE_IN_S);
        setState('playing');
        return;
      }
      if (state !== 'idle') return;
      ctx = createContext();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination as AudioNode);
      void ctx.resume();
      setState('armed');
      load()
        .then(() => {
          if (state === 'armed') startPlaying();
        })
        .catch((error: unknown) => {
          console.error('audio: falha ao carregar buffers', error);
          void ctx?.close();
          ctx = null;
          master = null;
          buffers.clear();
          setState('idle');
        });
    },

    disable() {
      userOff = true;
      if (state === 'playing') {
        rampMasterTo(0, FADE_OUT_MS / 1000);
        const current = ctx;
        setTimeout(() => {
          if (userOff && current === ctx) void ctx?.suspend();
        }, FADE_OUT_MS + 50);
      }
      if (state === 'playing' || state === 'armed') setState('suspended');
    },

    suspend() {
      if (state !== 'playing') return;
      void ctx?.suspend();
      setState('suspended');
    },

    resume() {
      if (state !== 'suspended' || userOff || !ctx) return;
      void ctx.resume();
      setState('playing');
    },

    playCue(name) {
      if (state !== 'playing' || !ctx || !master) return;
      const buffer = buffers.get(name);
      if (!buffer) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = manifest.cues[name]?.gain ?? 1;
      source.connect(gain);
      gain.connect(master);
      source.start();
    },

    getState: () => state,

    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
