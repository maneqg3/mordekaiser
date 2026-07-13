import { MACE_HEIGHT, plateShapes } from '@/webgl/forge-layout';

// As placas convergindo na silhueta da Véu da Noite — derivadas da MESMA
// tabela de perfil da cena 3D (spec 4.5 §4). Abstratas e estilizadas, não
// réplica do jogo. O gate permanece torre (símbolo distinto de propósito).
const CENTER_X = 100;
const BASELINE_Y = 270;
const SPAN = 260; // altura útil do viewBox 200×280

function toView(worldUnits: number): number {
  return (worldUnits / MACE_HEIGHT) * SPAN;
}

export function ForgePlates() {
  return (
    <svg aria-hidden viewBox="0 0 200 280" className="mx-auto w-40 sm:w-52">
      <g fill="#111314" stroke="#7effb6" strokeOpacity="0.35" strokeWidth="1">
        {plateShapes().map((plate) => {
          const yBottom = (BASELINE_Y - toView(plate.yBottom)).toFixed(1);
          const yTop = (BASELINE_Y - toView(plate.yTop)).toFixed(1);
          const points = [
            `${(CENTER_X - toView(plate.halfWidthBottom)).toFixed(1)},${yBottom}`,
            `${(CENTER_X + toView(plate.halfWidthBottom)).toFixed(1)},${yBottom}`,
            `${(CENTER_X + toView(plate.halfWidthTop)).toFixed(1)},${yTop}`,
            `${(CENTER_X - toView(plate.halfWidthTop)).toFixed(1)},${yTop}`,
          ].join(' ');
          return <polygon key={plate.yBottom} points={points} />;
        })}
      </g>
    </svg>
  );
}
