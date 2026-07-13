/** Superfície mínima do Document que a travessia usa — mockável em teste. */
export type RealmTransitionDocument = {
  startViewTransition?: (update: () => void) => unknown;
};

/**
 * Aplica a mutação do reino via View Transition quando o browser suporta e o
 * usuário não pediu reduced-motion; caso contrário aplica direto (o CSS cuida
 * do crossfade de tokens ou da troca instantânea). Retorna o caminho tomado.
 */
export function applyRealmTransition(
  doc: RealmTransitionDocument,
  reducedMotion: boolean,
  mutate: () => void,
): 'view-transition' | 'direct' {
  if (reducedMotion || typeof doc.startViewTransition !== 'function') {
    mutate();
    return 'direct';
  }
  doc.startViewTransition(mutate);
  return 'view-transition';
}
