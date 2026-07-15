/**
 * Almas subindo pela página inteira dentro do reino (spec Fase 5.1 §3).
 * Server component: zero JS — o CSS esconde fora de [data-realm='death'] e
 * anima sob no-preference. Posições determinísticas por índice (hash Knuth).
 */
const SOUL_COUNT = 28;

export function SoulsLayer() {
  return (
    <div aria-hidden className="souls-layer">
      {Array.from({ length: SOUL_COUNT }, (_, i) => {
        const seed = (((i + 1) * 2654435761) % 4294967296) / 4294967296;
        const style = {
          '--soul-left': `${(seed * 100).toFixed(2)}%`,
          '--soul-delay': `${(seed * 14).toFixed(2)}s`,
          '--soul-duration': `${(9 + seed * 10).toFixed(2)}s`,
          '--soul-scale': (0.5 + seed).toFixed(2),
        } as React.CSSProperties;
        return <span key={i} className="soul" style={style} />;
      })}
    </div>
  );
}
