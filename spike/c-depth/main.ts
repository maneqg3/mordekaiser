import * as THREE from 'three';

const params = new URLSearchParams(location.search);
// mx/my permitem ao Playwright fixar o mouse sem simular movimento.
const forcedX = params.has('mx') ? Number(params.get('mx')) : null;
const forcedY = params.has('my') ? Number(params.get('my')) : null;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();
const [image, depth] = await Promise.all([
  loader.loadAsync('./assets/splash.jpg'),
  loader.loadAsync('./assets/depth.png'),
]);

const uniforms = {
  uTexture: { value: image },
  uDepth: { value: depth },
  uMouse: { value: new THREE.Vector2(forcedX ?? 0, forcedY ?? 0) },
  uStrength: { value: 0.035 },
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D uTexture;
    uniform sampler2D uDepth;
    uniform vec2 uMouse;
    uniform float uStrength;
    varying vec2 vUv;

    void main() {
      float depth = texture2D(uDepth, vUv).r;
      vec2 offset = uMouse * depth * uStrength;
      gl_FragColor = texture2D(uTexture, vUv + offset);
    }
  `,
});

scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

const target = new THREE.Vector2(forcedX ?? 0, forcedY ?? 0);
if (forcedX === null) {
  addEventListener('pointermove', (e) => {
    target.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  });
}

function render() {
  uniforms.uMouse.value.lerp(target, 0.08);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
});
