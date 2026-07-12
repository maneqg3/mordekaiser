// Glifos de Ochnun — runas angulares desenhadas para o projeto (a língua é
// ficcional; não existe fonte). pathLength=1 normaliza o stroke: o write-on
// vira dashoffset 1→0 sem medir getTotalLength em runtime. Invisíveis por
// padrão (CSS); só o scrub da forja os revela — sem JS, a Fase 2 fica.
const GLYPH_PATHS = [
  'M12 72 L26 8 L40 72 M18 46 H34',
  'M56 8 V72 M56 40 L84 8 M56 40 L84 72',
  'M100 8 L128 8 L100 40 L128 40 L100 72 L128 72',
  'M144 8 V72 M144 8 L172 24 L144 40',
  'M188 40 L202 8 L216 40 L202 72 Z',
  'M232 8 L260 72 M260 8 L232 72 M234 40 H258',
];

export function OchnunGlyphs() {
  return (
    <svg
      aria-hidden
      data-ochnun
      viewBox="0 0 272 80"
      className="ochnun-glyphs mx-auto w-56 sm:w-72"
    >
      {GLYPH_PATHS.map((d) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="square"
        />
      ))}
    </svg>
  );
}
