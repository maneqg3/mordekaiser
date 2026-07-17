export const ambianceVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const ambianceFragment = /* glsl */ `
  uniform float uTime;   // respiração da névoa
  uniform float uReveal; // 0→1: a cúpula desce (revela de cima para baixo)
  uniform float uAspect;
  varying vec2 vUv;

  const vec3 FOG = vec3(0.322, 1.0, 0.612);  // #52ff9c
  const vec3 DARK = vec3(0.02, 0.031, 0.027);

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += amplitude * noise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 p = vUv * vec2(uAspect, 1.0) * 3.0;

    // Fundo vivo: respiração lenta, quase subliminar.
    float breath = fbm(p * 0.6 + vec2(0.0, uTime * 0.03));

    // Paredes da cúpula: fumaça fbm concentrada nas bordas da viewport.
    vec2 edge = min(vUv, 1.0 - vUv);
    float border = min(edge.x, edge.y);
    float smoke = fbm(p + vec2(uTime * 0.06, -uTime * 0.04));
    float wall = smoothstep(0.28, 0.0, border) * (0.5 + 0.5 * smoke);

    // Cúpula desce: revela de cima (vUv.y=1 é o topo) para baixo.
    float threshold = 1.0 - uReveal;
    float wipe = smoothstep(threshold - 0.15, threshold, vUv.y)
      * smoothstep(0.0, 0.05, uReveal);

    float alpha = (wall * 0.35 + breath * 0.08) * wipe;
    vec3 color = mix(DARK, FOG, wall * 0.6);
    gl_FragColor = vec4(color, alpha);
  }
`;
