export const portalVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const portalFragment = /* glsl */ `
  uniform float uTime;      // relógio — vórtice gira sozinho
  uniform float uProximity; // 0..1: fome do vórtice (seção vs viewport)
  uniform float uFrenzy;    // 0..1 (lerp): hover/focus do botão — frenesi
  uniform float uCrossed;   // 0..1 (lerp): dentro do reino — flash de expansão
  uniform float uAspect;    // largura/altura da View
  varying vec2 vUv;

  const vec3 GREEN = vec3(0.494, 1.0, 0.714); // #7effb6
  const vec3 DEEP = vec3(0.086, 0.31, 0.19);  // verde profundo do abismo

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

  // UV espiralado: rotação cresce para o centro — o vórtice.
  vec2 swirl(vec2 p, float strength) {
    float d = length(p);
    float angle = strength / (d + 0.15) + uTime * (0.35 + 0.65 * uFrenzy);
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c) * p;
  }

  // Anel: SDF radial com borda deformada por fbm giratório.
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
    float energy = 0.35 + 0.65 * uProximity + 0.4 * uFrenzy;
    float radius = 0.27 + 0.02 * uFrenzy + 0.9 * uCrossed;
    float width = 0.008 + 0.016 * energy;

    // Aberração cromática: 3 amostras com raios deslocados.
    float shift = 0.008 + 0.025 * uFrenzy + 0.05 * uCrossed;
    float r = ring(p, radius + shift, width);
    float g = ring(p, radius, width);
    float b = ring(p, radius - shift, width);

    // Interior: correntes de fbm arrastadas em espiral para o centro.
    float dist = length(p);
    float held = smoothstep(radius, radius * 0.15, dist);
    vec2 sp = swirl(p, 1.6 + 1.2 * uFrenzy);
    float streams = fbm(sp * 3.5 + vec2(0.0, uTime * 0.35));
    streams = pow(streams, 1.6) * 1.3;

    // Abismo: o centro engole a luz.
    float abyss = smoothstep(radius * 0.55, 0.0, dist);
    float interior = held * streams * energy * (1.0 - abyss * 0.85);

    vec3 color = GREEN * (g + interior) * energy
      + DEEP * interior * 0.6
      + vec3(r, g * 0.4, b) * 0.3 * energy;
    color *= 1.0 - abyss * 0.6;
    float alpha = clamp(
      (max(r, max(g, b)) + interior + abyss * 0.35 * held) * energy,
      0.0,
      0.95
    );
    gl_FragColor = vec4(color, alpha);
  }
`;

// Almas: pontos instanciados espiralando de fora para o anel. Movimento 100%
// no vertex shader (fase por atributo aSeed) — zero JS por frame.
export const soulsVertex = /* glsl */ `
  uniform float uTime;
  uniform float uProximity;
  uniform float uFrenzy;
  uniform float uAspect;
  attribute float aSeed;
  varying float vLife;

  void main() {
    float speed = 0.05 + 0.1 * uProximity + 0.15 * uFrenzy;
    // vida 0→1: nasce na borda, morre sugada no anel.
    float life = fract(aSeed * 7.31 + uTime * speed);
    float angle = aSeed * 6.28318
      + uTime * (0.4 + 0.6 * uFrenzy)
      + life * 4.0;
    float radius = mix(0.75, 0.05, life);
    // Espaço local do plano 1x1: x comprimido por uAspect para círculo real.
    vec3 pos = vec3(cos(angle) * radius / uAspect, sin(angle) * radius, 0.0);
    vLife = life;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.0 + 6.0 * (1.0 - life)) * (1.0 + uFrenzy);
  }
`;

export const soulsFragment = /* glsl */ `
  varying float vLife;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float glow = smoothstep(0.5, 0.0, length(c));
    float fadeIn = smoothstep(0.0, 0.15, vLife);
    float fadeOut = smoothstep(1.0, 0.85, vLife);
    gl_FragColor = vec4(
      vec3(0.494, 1.0, 0.714) * glow,
      glow * fadeIn * fadeOut * 0.8
    );
  }
`;
