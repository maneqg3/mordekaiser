export const portalVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const portalFragment = /* glsl */ `
  uniform float uTime;      // relógio — o fbm gira sozinho
  uniform float uProximity; // 0..1: centro da seção vs centro do viewport
  uniform float uHover;     // 0..1 (lerp): hover/focus do botão da travessia
  uniform float uCrossed;   // 0..1 (lerp): dentro do reino — flash de expansão
  uniform float uAspect;    // largura/altura da View
  varying vec2 vUv;

  // Paleta do reino (spec §3): #7effb6 sobre #050807.
  const vec3 GREEN = vec3(0.494, 1.0, 0.714);

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

  // Brilho do anel: SDF radial com a borda deformada por fbm giratório.
  float ring(vec2 p, float radius, float width) {
    float angle = atan(p.y, p.x);
    float wobble =
      fbm(vec2(angle * 1.6 + uTime * 0.25, length(p) * 3.0 - uTime * 0.4));
    float d = abs(length(p) - radius - (wobble - 0.5) * 0.06);
    return width / (d + width);
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);

    // ponytail: constantes de feel — calibrar olhando o portal.
    float energy = 0.3 + 0.7 * uProximity + 0.35 * uHover;
    float radius = 0.27 + 0.02 * uHover + 0.9 * uCrossed;
    float width = 0.008 + 0.014 * energy;

    // Aberração cromática: 3 amostras RGB com raios deslocados (spec §3).
    float shift = 0.008 + 0.02 * uHover + 0.05 * uCrossed;
    float r = ring(p, radius + shift, width);
    float g = ring(p, radius, width);
    float b = ring(p, radius - shift, width);

    // Interior redemoinha com fbm dobrado, contido pelo anel.
    float dist = length(p);
    float held = smoothstep(radius, radius * 0.25, dist);
    float warp = fbm(p * 2.0 - vec2(uTime * 0.05, 0.0));
    float swirl =
      fbm(p * 3.0 + vec2(uTime * 0.12, -uTime * 0.08) + vec2(warp));
    float interior = held * swirl * 0.45 * energy;

    vec3 color = GREEN * (g + interior) * energy
      + vec3(r, g * 0.4, b) * 0.3 * energy;
    float alpha = clamp((max(r, max(g, b)) + interior) * energy, 0.0, 0.9);
    gl_FragColor = vec4(color, alpha);
  }
`;
