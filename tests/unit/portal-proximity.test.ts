import { describe, expect, it } from 'vitest';
import { portalProximity } from '@/webgl/portal-proximity';

// viewport 900px, seção 600px: centro da seção = rectTop + 300.
const VIEWPORT = 900;
const SECTION = 600;

describe('portalProximity', () => {
  it('é 1 quando o centro da seção coincide com o centro do viewport', () => {
    // rectTop 150 → centro 450 = centro do viewport (900/2)
    expect(portalProximity(150, SECTION, VIEWPORT)).toBe(1);
  });

  it('é 0 quando a seção acabou de sair do viewport', () => {
    // rectTop -600 → seção termina em y=0; distância = alcance = 750
    expect(portalProximity(-600, SECTION, VIEWPORT)).toBe(0);
  });

  it('clampa em 0 além do alcance', () => {
    expect(portalProximity(-1200, SECTION, VIEWPORT)).toBe(0);
    expect(portalProximity(3000, SECTION, VIEWPORT)).toBe(0);
  });

  it('cresce monotonicamente na aproximação', () => {
    const far = portalProximity(600, SECTION, VIEWPORT);
    const near = portalProximity(300, SECTION, VIEWPORT);
    expect(near).toBeGreaterThan(far);
    expect(far).toBeGreaterThan(0);
  });

  it('degenera para 0 sem alcance (alturas zero)', () => {
    expect(portalProximity(0, 0, 0)).toBe(0);
  });
});
