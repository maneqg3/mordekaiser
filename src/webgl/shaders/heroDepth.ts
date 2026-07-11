export const heroDepthVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const heroDepthFragment = /* glsl */ `
  uniform sampler2D uTexture;
  uniform sampler2D uDepth;
  uniform vec2 uMouse;     // -1..1, lerp suavizado no useFrame
  uniform float uScroll;   // 0..1 dentro do hero (mobile)
  uniform float uStrength; // 0.035 — validado no spike (Risco 3 APROVADO)
  uniform vec2 uUvScale;   // equivalente a background-size: cover
  uniform vec2 uUvOffset;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * uUvScale + uUvOffset;
    float depth = texture2D(uDepth, uv).r - 0.5;
    vec2 shift = (uMouse + vec2(0.0, uScroll * 0.6)) * depth * uStrength;
    gl_FragColor = texture2D(uTexture, uv + shift);
  }
`;
