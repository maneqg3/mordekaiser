export type CueName = 'passive' | 'q' | 'w' | 'e' | 'r-sfx' | 'sucumba';

export type AudioCue = { src: string; gain: number };

export type AudioManifest = {
  /** null → drone sintetizado proceduralmente (spec Fase 6 §1.3). */
  drone: AudioCue | null;
  /** Só liste arquivos que EXISTEM em public/audio/ — todo item listado
      precisa carregar, senão o engine volta a idle (contrato da spec). */
  cues: Partial<Record<CueName, AudioCue>>;
};

/** Vazio até a pasta public/audio/ ser populada (Task 8). */
export const AUDIO_MANIFEST: AudioManifest = {
  drone: null,
  cues: {},
};
