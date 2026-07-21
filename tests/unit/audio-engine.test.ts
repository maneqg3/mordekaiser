import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createAudioEngine,
  type AudioContextLike,
} from '@/lib/audio-engine';
import type { AudioManifest } from '@/data/audio-manifest';

class FakeParam {
  value = 0;
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
}

function fakeNode() {
  return {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    gain: new FakeParam(),
    frequency: new FakeParam(),
    type: 'sine',
    buffer: null as unknown,
    loop: false,
  };
}

function fakeContext() {
  const nodes: ReturnType<typeof fakeNode>[] = [];
  const make = () => {
    const n = fakeNode();
    nodes.push(n);
    return n;
  };
  const ctx = {
    createGain: vi.fn(make),
    createOscillator: vi.fn(make),
    createBufferSource: vi.fn(make),
    createBiquadFilter: vi.fn(make),
    decodeAudioData: vi.fn(
      async (data: ArrayBuffer) => ({ decoded: data }) as unknown as AudioBuffer,
    ),
    resume: vi.fn(async () => {}),
    suspend: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    currentTime: 0,
    destination: {} as AudioDestinationNode,
  };
  return { ctx: ctx as unknown as AudioContextLike, raw: ctx, nodes };
}

const MANIFEST_WITH_FILES: AudioManifest = {
  drone: { src: '/audio/drone.ogg', gain: 0.15 },
  cues: { sucumba: { src: '/audio/sucumba.ogg', gain: 0.9 } },
};

const MANIFEST_SYNTH: AudioManifest = { drone: null, cues: {} };

function makeEngine(
  manifest: AudioManifest,
  fetchArrayBuffer = vi.fn(async () => new ArrayBuffer(8)),
) {
  const { ctx, raw, nodes } = fakeContext();
  const engine = createAudioEngine(manifest, {
    createContext: () => ctx,
    fetchArrayBuffer,
  });
  return { engine, raw, nodes, fetchArrayBuffer };
}

async function flush() {
  // Cadeia real: fetch -> decode -> Promise.all -> then; cada await consome
  // um round de microtask — 10 rounds cobrem com folga.
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('estados', () => {
  test('nasce idle e sem AudioContext', () => {
    const createContext = vi.fn();
    const engine = createAudioEngine(MANIFEST_SYNTH, {
      createContext: createContext as never,
      fetchArrayBuffer: vi.fn(),
    });
    expect(engine.getState()).toBe('idle');
    expect(createContext).not.toHaveBeenCalled();
  });

  test('enable arma e, com buffers prontos, toca', async () => {
    const { engine, raw } = makeEngine(MANIFEST_WITH_FILES);
    engine.enable();
    expect(engine.getState()).toBe('armed');
    expect(raw.resume).toHaveBeenCalled();
    await flush();
    expect(engine.getState()).toBe('playing');
  });

  test('fetch falhou -> volta a idle e fecha o contexto', async () => {
    const failing = vi.fn(async () => {
      throw new Error('404');
    });
    const { engine, raw } = makeEngine(MANIFEST_WITH_FILES, failing);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    engine.enable();
    await flush();
    expect(engine.getState()).toBe('idle');
    expect(raw.close).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('disable em playing -> suspended; suspende o contexto apos fade', async () => {
    const { engine, raw } = makeEngine(MANIFEST_WITH_FILES);
    engine.enable();
    await flush();
    engine.disable();
    expect(engine.getState()).toBe('suspended');
    vi.advanceTimersByTime(400);
    expect(raw.suspend).toHaveBeenCalled();
  });

  test('enable de suspended religa sem refetch', async () => {
    const { engine, fetchArrayBuffer } = makeEngine(MANIFEST_WITH_FILES);
    engine.enable();
    await flush();
    const fetches = fetchArrayBuffer.mock.calls.length;
    engine.disable();
    engine.enable();
    expect(engine.getState()).toBe('playing');
    expect(fetchArrayBuffer.mock.calls.length).toBe(fetches);
  });

  test('suspend/resume de sistema (visibilidade)', async () => {
    const { engine } = makeEngine(MANIFEST_WITH_FILES);
    engine.enable();
    await flush();
    engine.suspend();
    expect(engine.getState()).toBe('suspended');
    engine.resume();
    expect(engine.getState()).toBe('playing');
  });

  test('resume de sistema NAO religa depois de disable do usuario', async () => {
    const { engine } = makeEngine(MANIFEST_WITH_FILES);
    engine.enable();
    await flush();
    engine.disable();
    engine.resume();
    expect(engine.getState()).toBe('suspended');
  });

  test('disable durante armed cancela o inicio', async () => {
    const { engine } = makeEngine(MANIFEST_WITH_FILES);
    engine.enable();
    engine.disable();
    await flush();
    expect(engine.getState()).toBe('suspended');
  });
});

describe('playCue', () => {
  test('fora de playing e no-op', () => {
    const { engine, raw } = makeEngine(MANIFEST_WITH_FILES);
    engine.playCue('sucumba');
    expect(raw.createBufferSource).not.toHaveBeenCalled();
  });

  test('cue sem arquivo no manifesto e no-op', async () => {
    const { engine, raw } = makeEngine(MANIFEST_WITH_FILES);
    engine.enable();
    await flush();
    const sources = raw.createBufferSource.mock.calls.length;
    engine.playCue('q');
    expect(raw.createBufferSource.mock.calls.length).toBe(sources);
  });

  test('em playing dispara um buffer source', async () => {
    const { engine, raw, nodes } = makeEngine(MANIFEST_WITH_FILES);
    engine.enable();
    await flush();
    engine.playCue('sucumba');
    expect(raw.createBufferSource).toHaveBeenCalled();
    const started = nodes.filter((n) => n.start.mock.calls.length > 0);
    expect(started.length).toBeGreaterThanOrEqual(2); // drone + cue
  });
});

describe('drone sintetizado', () => {
  test('sem arquivo de drone, osciladores nascem', async () => {
    const { engine, raw } = makeEngine(MANIFEST_SYNTH);
    engine.enable();
    await flush();
    expect(engine.getState()).toBe('playing');
    expect(raw.createOscillator).toHaveBeenCalled();
    expect(raw.createBiquadFilter).toHaveBeenCalled();
  });
});

describe('subscribe', () => {
  test('notifica transicoes e permite unsubscribe', async () => {
    const { engine } = makeEngine(MANIFEST_SYNTH);
    const seen: string[] = [];
    const off = engine.subscribe((s) => seen.push(s));
    engine.enable();
    await flush();
    expect(seen).toEqual(['armed', 'playing']);
    off();
    engine.disable();
    expect(seen).toEqual(['armed', 'playing']);
  });
});
