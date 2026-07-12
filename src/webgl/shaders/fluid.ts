// Port dos shaders de PavelDoGreat/WebGL-Fluid-Simulation (MIT).
// Nosso trabalho é o pipeline de FBOs ping-pong dentro do R3F (spec §5).
// Sem vorticity confinement: a spec lista só advecção/divergência/Jacobi/
// subtração de gradiente. ponytail: entra na Fase 4 se a névoa ficar morta.

export const fluidVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const splatFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float uAspect;
  uniform vec2 uPoint;
  uniform vec3 uColor;
  uniform float uRadius;
  void main() {
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

export const advectionFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDt;
  uniform float uDissipation;
  void main() {
    vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexelSize;
    vec4 result = texture2D(uSource, coord);
    float decay = 1.0 + uDissipation * uDt;
    gl_FragColor = result / decay;
  }
`;

export const divergenceFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
    float T = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
    gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
  }
`;

export const pressureFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float divergence = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
  }
`;

export const gradientSubtractFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;
  void main() {
    float L = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float R = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float B = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float T = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(velocity - vec2(R - L, T - B), 0.0, 1.0);
  }
`;

export const clearFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform float uValue;
  void main() {
    gl_FragColor = uValue * texture2D(uTexture, vUv);
  }
`;

export const displayFragment = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uDye;
  void main() {
    vec3 dye = texture2D(uDye, vUv).rgb;
    float alpha = clamp(max(dye.r, max(dye.g, dye.b)) * 1.4, 0.0, 0.85);
    gl_FragColor = vec4(dye, alpha);
  }
`;
