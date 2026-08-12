// ============================================================
//  نورة — رحلة عبر الكون
//  A cinematic WebGL journey. Real 3D, real shaders, real feeling.
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { ShaderPass } from './vendor/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './vendor/postprocessing/UnrealBloomPass.js';
import { SkyNight } from './sky.js';

// ---------------------------------------------------------- setup
const canvas = document.getElementById('stage');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas, antialias: false, powerPreference: 'high-performance', stencil: false
  });
} catch (e) {
  document.getElementById('fallback').style.display = 'flex';
  throw e;
}
let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 9000);
camera.position.set(0, 0, 20);

const sun = new THREE.DirectionalLight(0xfff2e0, 2.2);
sun.position.set(300, 140, 200);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x223, 0.5));

// ---------------------------------------------------------- post
// multisampled target: the composer bypasses the canvas' own antialiasing,
// so without this every silhouette edge comes out stair-stepped
const _sz = renderer.getDrawingBufferSize(new THREE.Vector2());
const _rt = new THREE.WebGLRenderTarget(_sz.width, _sz.height, {
  type: THREE.HalfFloatType,
  samples: 4,
});
const composer = new EffectComposer(renderer, _rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.9, 0.65, 0.82);
composer.addPass(bloom);

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime:    { value: 0 },
    uStreak:  { value: 0 },   // radial blur (meteor fall)
    uCA:      { value: 0.0016 },
    uVig:     { value: 0.55 },
    uGrain:   { value: 0.045 },
    uWarm:    { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uStreak, uCA, uVig, uGrain, uWarm;
    varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec2 toC = uv - 0.5;
      // radial motion blur while falling
      vec3 col = vec3(0.0);
      float total = 0.0;
      for (int i = 0; i < 7; i++){
        float t = float(i) / 6.0;
        float w = 1.0 - t * 0.6;
        vec2 suv = uv - toC * uStreak * t * 0.35;
        // chromatic aberration, stronger at edges
        float ca = uCA * (0.4 + dot(toC,toC) * 3.0) * (1.0 + uStreak * 6.0);
        col += vec3(
          texture2D(tDiffuse, suv + toC * ca).r,
          texture2D(tDiffuse, suv).g,
          texture2D(tDiffuse, suv - toC * ca).b
        ) * w;
        total += w;
        if (uStreak < 0.001) { total = w; break; }
      }
      col /= total;
      // warm grade for the finale
      col = mix(col, col * vec3(1.12, 0.98, 0.82) + vec3(0.028, 0.014, 0.0), uWarm);
      // vignette
      float vig = 1.0 - smoothstep(0.35, 1.25, length(toC) * (1.2 + uStreak)) * uVig;
      col *= vig;
      // film grain
      float g = hash(uv * vec2(1920.0, 1080.0) + fract(uTime) * 43.0) - 0.5;
      col += g * uGrain * (0.4 + 0.6 * (1.0 - dot(col, vec3(0.333))));
      gl_FragColor = vec4(col, 1.0);
    }`
};
const finalPass = new ShaderPass(FinalShader);
composer.addPass(finalPass);

// ---------------------------------------------------------- shared glsl
const NOISE_GLSL = /* glsl */`
  float hash31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  vec3 hash33(vec3 p){
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return fract(sin(p) * 43758.5453123);
  }
  float vnoise(vec3 p){
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i+vec3(0,0,0)), hash31(i+vec3(1,0,0)), f.x),
          mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x),
          mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = p * 2.03 + vec3(11.7); a *= 0.5; }
    return v;
  }
`;

// ---------------------------------------------------------- sky dome
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, depthTest: false,
  uniforms: {
    uTime:   { value: 0 },
    uNebula: { value: 0 },   // nebula chapter intensity
    uWarm:   { value: 0 },   // finale warmth
  },
  vertexShader: /* glsl */`
    varying vec3 vDir;
    void main(){
      vDir = position;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_Position = (projectionMatrix * mv).xyww; // push to far plane
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime, uNebula, uWarm;
    varying vec3 vDir;
    ${NOISE_GLSL}
    vec3 stars(vec3 d, float scale, float density, float bright){
      vec3 p = d * scale;
      vec3 id = floor(p), f = fract(p);
      vec3 sp = hash33(id) * 0.7 + 0.15;
      float dist = length(f - sp);
      float sel = step(1.0 - density, hash31(id + 4.7));
      float tw = 0.72 + 0.28 * sin(uTime * (0.6 + hash31(id) * 2.4) + hash31(id) * 40.0);
      float s = smoothstep(0.10, 0.0, dist) * sel * tw * bright;
      // subtle colour temperature per star
      vec3 tint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.86, 0.7), hash31(id + 9.1));
      return s * tint;
    }
    void main(){
      vec3 d = normalize(vDir);
      vec3 col = vec3(0.004, 0.005, 0.012);

      // galactic band
      vec3 bn = normalize(vec3(0.2, 1.0, 0.35));
      float band = exp(-pow(dot(d, bn), 2.0) * 14.0);
      float bandNeb = fbm(d * 4.0 + vec3(3.1));
      col += band * mix(vec3(0.05, 0.05, 0.10), vec3(0.16, 0.12, 0.20), bandNeb) * (0.55 + bandNeb);

      // distant galaxies (soft warm smudges)
      float gal = pow(fbm(d * 2.2 + vec3(17.0)), 6.0) * 2.0;
      col += gal * vec3(0.30, 0.22, 0.30);

      // deep nebula (breathes in during the nebula chapter)
      float n1 = fbm(d * 3.0 + vec3(uTime * 0.008, 0.0, 4.2));
      float n2 = fbm(d * 6.5 + vec3(0.0, uTime * 0.006, 9.7));
      float neb = smoothstep(0.42, 0.95, n1) * (0.4 + 0.6 * n2);
      vec3 nebCol = mix(vec3(0.30, 0.10, 0.55), vec3(0.75, 0.22, 0.48), n2);
      nebCol = mix(nebCol, vec3(0.10, 0.45, 0.60), smoothstep(0.5, 0.9, n1) * 0.6);
      col += neb * nebCol * (0.10 + uNebula * 1.15);

      // starfield, three scales
      col += stars(d, 110.0, 0.015, 1.0);
      col += stars(d,  55.0, 0.010, 0.75);
      col += stars(d, 220.0, 0.020, 0.45);

      // finale warm horizon glow
      col += uWarm * max(0.0, -d.y + 0.15) * vec3(0.26, 0.13, 0.05);
      col = mix(col, col * vec3(1.08, 0.98, 0.88), uWarm * 0.5);

      gl_FragColor = vec4(col, 1.0);
    }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 32), skyMat);
sky.frustumCulled = false;
sky.renderOrder = -10;
scene.add(sky);

// ---------------------------------------------------------- star particles
function makeStarPoints(count, spread, zMin, zMax, sizeMin, sizeMax) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
    pos[i * 3 + 2] = zMin + Math.random() * (zMax - zMin);
    const t = Math.random();
    if (t < 0.72)      c.setHSL(0.62, 0.35, 0.75 + Math.random() * 0.25);
    else if (t < 0.9)  c.setHSL(0.08, 0.55, 0.72 + Math.random() * 0.2);
    else               c.setHSL(0.85, 0.45, 0.75);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    size[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
    phase[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec3 aColor; attribute float aSize, aPhase;
      uniform float uTime;
      varying vec3 vColor; varying float vTw;
      void main(){
        vColor = aColor;
        vTw = 0.7 + 0.3 * sin(uTime * (0.8 + aPhase * 0.3) + aPhase * 13.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * vTw * (340.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor; varying float vTw;
      void main(){
        vec2 d = gl_PointCoord - 0.5;
        float r = length(d);
        float a = smoothstep(0.5, 0.05, r);
        a += smoothstep(0.16, 0.0, r) * 0.8;
        gl_FragColor = vec4(vColor * vTw, a * 0.85);
      }`
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}
const starsFar  = makeStarPoints(15000, 2600, -2400, 500, 1.2, 3.2);
const starsNear = makeStarPoints(6000, 700, -1250, 120, 1.6, 4.6);
scene.add(starsFar, starsNear);

// cosmic dust: fast parallax layer close to the flight path
const dust = makeStarPoints(3200, 130, -1150, 60, 0.7, 1.5);
dust.material.uniforms = dust.material.uniforms; // shared shader
scene.add(dust);

// ---------------------------------------------------------- nebula volume sprites
function nebulaTexture() {
  const s = 256, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
  // break the perfect circle with soft holes
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * s, y = Math.random() * s, r = 6 + Math.random() * 26;
    const h = ctx.createRadialGradient(x, y, 0, x, y, r);
    h.addColorStop(0, 'rgba(0,0,0,0.55)'); h.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const nebulaGroup = new THREE.Group();
{
  const palette = [
    new THREE.Color(0x7a2bd6), new THREE.Color(0xd63c8f),
    new THREE.Color(0x2b6bd6), new THREE.Color(0x27b6c9),
    new THREE.Color(0xb03cd6), new THREE.Color(0x4527c9),
  ];
  const count = 240;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const phase = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // two intertwined lobes around the path
    const t = Math.random();
    const zz = -170 - t * 280;
    const ang = t * 9.0 + Math.random() * 1.6;
    const rad = 26 + Math.random() * 95;
    pos[i*3]   = Math.cos(ang) * rad + (Math.random()-0.5) * 40;
    pos[i*3+1] = Math.sin(ang * 0.7) * rad * 0.55 + (Math.random()-0.5) * 30;
    pos[i*3+2] = zz;
    const c = palette[(Math.random() * palette.length) | 0];
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    size[i] = 55 + Math.random() * 130;
    phase[i] = Math.random() * Math.PI * 2;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uMap: { value: nebulaTexture() }, uAmt: { value: 0.6 } },
    vertexShader: /* glsl */`
      attribute vec3 aColor; attribute float aSize, aPhase;
      uniform float uTime;
      varying vec3 vColor; varying float vA;
      void main(){
        vColor = aColor;
        vA = 0.6 + 0.4 * sin(uTime * 0.18 + aPhase);
        vec3 p = position;
        p.x += sin(uTime * 0.05 + aPhase) * 4.0;
        p.y += cos(uTime * 0.04 + aPhase * 1.7) * 3.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (420.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uAmt;
      varying vec3 vColor; varying float vA;
      void main(){
        float a = texture2D(uMap, gl_PointCoord).a;
        gl_FragColor = vec4(vColor, a * vA * 0.16 * uAmt);
      }`
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  nebulaGroup.add(pts);
  nebulaGroup.userData.mat = mat;
}
scene.add(nebulaGroup);

// ---------------------------------------------------------- gas giant + rings + moons
const planetGroup = new THREE.Group();
planetGroup.position.set(-78, 16, -600);
{
  const R = 34;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSun:  { value: new THREE.Vector3(0.72, 0.35, 0.6).normalize() },
    },
    vertexShader: /* glsl */`
      varying vec3 vN, vP;
      void main(){
        vN = normalize(normalMatrix * normal);
        vP = normalize(normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uSun;
      varying vec3 vN, vP;
      ${NOISE_GLSL}
      void main(){
        // flowing latitude bands
        float lat = vP.y;
        float swirl = fbm(vec3(vP.x * 3.0 + uTime * 0.01, lat * 9.0, vP.z * 3.0)) * 0.9;
        float b = sin(lat * 22.0 + swirl * 6.0) * 0.5 + 0.5;
        float b2 = sin(lat * 9.0 - swirl * 4.0 + 2.0) * 0.5 + 0.5;
        vec3 c1 = vec3(0.82, 0.62, 0.44);
        vec3 c2 = vec3(0.55, 0.38, 0.30);
        vec3 c3 = vec3(0.90, 0.80, 0.66);
        vec3 c4 = vec3(0.35, 0.30, 0.38);
        vec3 col = mix(mix(c1, c2, b), mix(c3 * 0.85, c4, b2), 0.45);
        // storm spot
        float storm = smoothstep(0.20, 0.02, length(vP.xy - vec2(0.42, -0.28)));
        col = mix(col, vec3(0.92, 0.55, 0.38), storm * 0.8);
        // lighting: wrapped diffuse + terminator softness
        vec3 L = normalize((viewMatrix * vec4(uSun, 0.0)).xyz);
        float ndl = dot(vN, L);
        float diff = pow(clamp(ndl * 0.62 + 0.38, 0.0, 1.0), 1.4);
        float rim = pow(1.0 - abs(dot(vN, vec3(0,0,1))), 3.0);
        col = col * diff * 1.02 + rim * vec3(0.55, 0.60, 0.85) * 0.30 * clamp(ndl + 0.6, 0.0, 1.0);
        col += vec3(0.02, 0.02, 0.04); // faint starlight fill
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64), mat);
  planetGroup.add(planet);
  planetGroup.userData.mat = mat;

  // atmosphere halo
  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.045, 64, 48),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      uniforms: { uColor: { value: new THREE.Color(0.45, 0.55, 0.95) } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uColor; varying vec3 vN;
        void main(){ float f = pow(clamp(dot(vN, vec3(0,0,-1)), 0.0, 1.0), 3.2);
        gl_FragColor = vec4(uColor, f * 0.32); }`
    })
  );
  planetGroup.add(atmo);

  // rings
  const ringGeo = new THREE.RingGeometry(R * 1.45, R * 2.5, 180, 1);
  const ringMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uInner: { value: R * 1.45 }, uOuter: { value: R * 2.5 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uInner, uOuter; varying vec2 vP;
      float h(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      void main(){
        float r = length(vP);
        float t = (r - uInner) / (uOuter - uInner);
        float bands = 0.0;
        for (int i = 1; i <= 4; i++){
          bands += sin(t * float(i * 37) + h(float(i)) * 6.28) * (1.0 / float(i));
        }
        bands = bands * 0.25 + 0.55;
        float gap = smoothstep(0.44, 0.47, t) * smoothstep(0.56, 0.53, t);
        bands *= 1.0 - gap * 0.85;
        float edge = smoothstep(0.0, 0.06, t) * smoothstep(1.0, 0.90, t);
        vec3 col = mix(vec3(0.75, 0.66, 0.55), vec3(0.9, 0.85, 0.75), bands);
        gl_FragColor = vec4(col * (0.5 + bands * 0.6), bands * edge * 0.75);
      }`
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2 - 0.32;
  ring.rotation.y = 0.12;
  planetGroup.add(ring);

  // moons
  const moonMat = new THREE.MeshStandardMaterial({ color: 0x9a948c, roughness: 0.95, metalness: 0 });
  const moon1 = new THREE.Mesh(new THREE.SphereGeometry(3.2, 32, 24), moonMat);
  const moon2 = new THREE.Mesh(new THREE.SphereGeometry(1.9, 24, 18), moonMat.clone());
  moon2.material.color.set(0xb8a795);
  planetGroup.add(moon1, moon2);
  planetGroup.userData.moons = [moon1, moon2];
}
scene.add(planetGroup);

// ---------------------------------------------------------- final home planet
const homeGroup = new THREE.Group();
homeGroup.position.set(0, -86, -1040);
{
  const R = 62;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSun:  { value: new THREE.Vector3(-0.4, 0.5, 0.75).normalize() },
      uWarm: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec3 vN, vP;
      void main(){
        vN = normalize(normalMatrix * normal);
        vP = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uWarm; uniform vec3 uSun;
      varying vec3 vN, vP;
      ${NOISE_GLSL}
      void main(){
        vec3 p = vP;
        float cont = fbm(p * 2.6 + vec3(5.2));
        float detail = fbm(p * 8.0 + vec3(1.7));
        float land = smoothstep(0.50, 0.56, cont + detail * 0.15);
        vec3 ocean = mix(vec3(0.03, 0.10, 0.22), vec3(0.05, 0.22, 0.34), detail);
        vec3 terra = mix(vec3(0.28, 0.22, 0.14), vec3(0.45, 0.36, 0.22), detail);
        terra = mix(terra, vec3(0.16, 0.30, 0.16), smoothstep(0.4, 0.7, detail) * 0.7);
        float ice = smoothstep(0.72, 0.9, abs(p.y));
        vec3 surf = mix(ocean, terra, land);
        surf = mix(surf, vec3(0.85, 0.88, 0.92), ice);
        // clouds
        float cl = smoothstep(0.52, 0.8, fbm(p * 4.0 + vec3(uTime * 0.008, 0.0, 3.0)));
        surf = mix(surf, vec3(0.82, 0.82, 0.88), cl * 0.6);
        // lighting
        vec3 L = normalize((viewMatrix * vec4(uSun, 0.0)).xyz);
        float ndl = dot(vN, L);
        float diff = pow(clamp(ndl * 0.6 + 0.4, 0.0, 1.0), 1.6);
        // specular glint on the ocean
        vec3 H = normalize(L + vec3(0,0,1));
        float spec = pow(clamp(dot(vN, H), 0.0, 1.0), 60.0) * (1.0 - land) * (1.0 - cl);
        vec3 col = surf * diff * 1.05 + spec * vec3(0.9, 0.85, 0.7) * 0.3;
        // warm birthday dusk on the rim
        float rim = pow(1.0 - abs(dot(vN, vec3(0,0,1))), 2.6);
        col += rim * mix(vec3(0.2, 0.3, 0.6), vec3(1.0, 0.5, 0.2), uWarm) * (0.25 + uWarm * 0.45);
        col += vec3(0.012, 0.014, 0.02);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const home = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 96), mat);
  homeGroup.add(home);
  homeGroup.userData.mat = mat;

  const atmo = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.06, 64, 48),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      uniforms: { uWarm: { value: 0 } },
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uWarm; varying vec3 vN;
        void main(){ float f = pow(clamp(dot(vN, vec3(0,0,-1)), 0.0, 1.0), 3.0);
        vec3 c = mix(vec3(0.35, 0.55, 1.0), vec3(1.0, 0.55, 0.25), uWarm);
        gl_FragColor = vec4(c, f * 0.6); }`
    })
  );
  homeGroup.add(atmo);
  homeGroup.userData.atmo = atmo;

  // aurora ribbons over the pole
  const aurGeo = new THREE.CylinderGeometry(R * 0.62, R * 0.86, R * 0.34, 96, 8, true);
  const aurMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAmt: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uAmt; varying vec2 vUv;
      ${NOISE_GLSL}
      void main(){
        float w = fbm(vec3(vUv.x * 9.0, uTime * 0.14, 2.0));
        float curtain = smoothstep(0.25, 0.65, w) * smoothstep(1.0, 0.35, vUv.y) * smoothstep(0.0, 0.25, vUv.y);
        vec3 c = mix(vec3(0.1, 0.9, 0.5), vec3(0.4, 0.3, 0.9), vUv.y + w * 0.3);
        gl_FragColor = vec4(c, curtain * 0.16 * uAmt);
      }`
  });
  const aurora = new THREE.Mesh(aurGeo, aurMat);
  aurora.position.y = R * 0.92;
  homeGroup.add(aurora);
  homeGroup.userData.aurora = aurMat;
}
scene.add(homeGroup);

// ---------------------------------------------------------- intro meteor
const meteorGroup = new THREE.Group();
{
  const geo = new THREE.IcosahedronGeometry(7, 3);
  const posAttr = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    const n = v.clone().normalize();
    const d = 1 + (Math.sin(n.x * 9) * Math.sin(n.y * 7) * Math.sin(n.z * 8)) * 0.22
                + (Math.random() - 0.5) * 0.06;
    v.copy(n).multiplyScalar(7 * d);
    posAttr.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const rock = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x584a3c, roughness: 0.9, metalness: 0.08,
    emissive: 0xff5a18, emissiveIntensity: 0.0,
  }));
  meteorGroup.add(rock);
  meteorGroup.userData.rock = rock;

  // fire shell
  const fire = new THREE.Mesh(
    new THREE.SphereGeometry(8.6, 32, 24),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
      uniforms: { uTime: { value: 0 }, uHeat: { value: 0 } },
      vertexShader: `varying vec3 vN; uniform float uTime;
        void main(){ vN = normalize(normalMatrix * normal);
        vec3 p = position * (1.0 + sin(uTime * 22.0 + position.y * 3.0) * 0.03);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0); }`,
      fragmentShader: `uniform float uHeat; varying vec3 vN;
        void main(){ float f = pow(clamp(dot(vN, vec3(0,0,-1)), 0.0, 1.0), 1.8);
        gl_FragColor = vec4(mix(vec3(1.0,0.45,0.1), vec3(1.0,0.85,0.5), f), f * uHeat); }`
    })
  );
  meteorGroup.add(fire);
  meteorGroup.userData.fire = fire;

  const glow = new THREE.PointLight(0xff7733, 0, 260, 1.8);
  meteorGroup.add(glow);
  meteorGroup.userData.glow = glow;

  // trailing embers
  const N = 260;
  const tgeo = new THREE.BufferGeometry();
  const tpos = new Float32Array(N * 3);
  const tseed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    tpos[i*3] = (Math.random()-0.5) * 6;
    tpos[i*3+1] = (Math.random()-0.5) * 6;
    tpos[i*3+2] = Math.random() * 90;
    tseed[i] = Math.random();
  }
  tgeo.setAttribute('position', new THREE.BufferAttribute(tpos, 3));
  tgeo.setAttribute('aSeed', new THREE.BufferAttribute(tseed, 1));
  const tmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uAmt: { value: 0 } },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime;
      varying float vLife;
      void main(){
        vec3 p = position;
        float t = fract(uTime * (0.5 + aSeed * 0.8) + aSeed * 7.0);
        p.z = t * 95.0;
        p.x += sin(aSeed * 40.0 + uTime * 3.0) * (1.0 + t * 5.0);
        p.y += cos(aSeed * 31.0 + uTime * 2.6) * (1.0 + t * 5.0);
        vLife = 1.0 - t;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (2.5 + aSeed * 3.5) * vLife * (300.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uAmt; varying float vLife;
      void main(){
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, r) * vLife * uAmt;
        gl_FragColor = vec4(mix(vec3(1.0, 0.3, 0.05), vec3(1.0, 0.9, 0.5), vLife), a);
      }`
  });
  const trail = new THREE.Points(tgeo, tmat);
  trail.frustumCulled = false;
  meteorGroup.add(trail);
  meteorGroup.userData.trail = tmat;
}
meteorGroup.visible = false;
scene.add(meteorGroup);

// ---------------------------------------------------------- fall streaks (camera space)
const fallGroup = new THREE.Group();
{
  const N = 420;
  const positions = new Float32Array(N * 2 * 3);
  const geo = new THREE.BufferGeometry();
  const seeds = [];
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 3.5 + Math.random() * 26;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    const z = -Math.random() * 220;
    const len = 4 + Math.random() * 16;
    positions[i*6]   = x; positions[i*6+1] = y; positions[i*6+2] = z;
    positions[i*6+3] = x; positions[i*6+4] = y; positions[i*6+5] = z + len;
    seeds.push({ x, y, z, len, sp: 260 + Math.random() * 320 });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xbfd4ff, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  fallGroup.add(lines);
  fallGroup.userData = { seeds, geo, mat };
}
camera.add(fallGroup);
scene.add(camera);

// ---------------------------------------------------------- shooting stars
const shooters = [];
{
  const geo = new THREE.PlaneGeometry(1, 1);
  const mkMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uAlpha: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform float uAlpha; varying vec2 vUv;
      void main(){
        float head = smoothstep(0.0, 0.9, vUv.x);
        float core = exp(-pow((vUv.y - 0.5) * 6.0, 2.0));
        vec3 col = mix(vec3(0.5, 0.7, 1.0), vec3(1.0), head);
        gl_FragColor = vec4(col, head * head * core * uAlpha);
      }`
  });
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(geo, mkMat());
    m.visible = false;
    m.frustumCulled = false;
    scene.add(m);
    shooters.push({ mesh: m, life: 0, dur: 1, vel: new THREE.Vector3() });
  }
}
function spawnShooter(nearPos) {
  const s = shooters.find(s => s.life <= 0);
  if (!s) return;
  const dir = new THREE.Vector3(
    (Math.random() - 0.5) * 2, -(0.3 + Math.random() * 0.7), -(Math.random() * 0.6)
  ).normalize();
  const start = nearPos.clone().add(new THREE.Vector3(
    (Math.random() - 0.5) * 240, 60 + Math.random() * 80, -140 - Math.random() * 160
  ));
  s.mesh.position.copy(start);
  s.vel.copy(dir).multiplyScalar(240 + Math.random() * 260);
  s.mesh.scale.set(26 + Math.random() * 30, 0.55, 1);
  // orient the plane along the velocity
  const look = start.clone().add(dir);
  s.mesh.lookAt(look);
  s.mesh.rotateY(Math.PI / 2);
  s.life = s.dur = 0.9 + Math.random() * 0.8;
  s.mesh.visible = true;
}

// ---------------------------------------------------------- star-writing (text particles)
const textGroup = new THREE.Group();
textGroup.position.set(0, 46, -1150);
scene.add(textGroup);
let textMat = null;

function sampleText(text, font, w, h, step) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, h / 2);
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 120) {
        pts.push([(x / w - 0.5), (0.5 - y / h) * (h / w)]);
      }
    }
  }
  return pts;
}

function buildTextParticles() {
  const en = sampleText('Happy Birthday Noura', "300 92px 'Cormorant Garamond', Georgia, serif", 1280, 200, 3);
  const ar = sampleText('نُورة', "400 250px 'Aref Ruqaa', 'Amiri', serif", 1280, 400, 3);
  const N = 3200;
  const W = 165; // world width of the writing
  const start = new Float32Array(N * 3);
  const ta = new Float32Array(N * 3);
  const tb = new Float32Array(N * 3);
  const rnd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    // scattered across the sky at first
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    const r = 130 + Math.random() * 160;
    start[i*3]   = Math.sin(ph) * Math.cos(th) * r;
    start[i*3+1] = Math.abs(Math.sin(ph) * Math.sin(th)) * r * 0.5 + (Math.random()-0.5) * 60;
    start[i*3+2] = Math.cos(ph) * r * 0.4;
    const pa = en[i % en.length], pb = ar[i % ar.length];
    ta[i*3]   = pa[0] * W + (Math.random()-0.5) * 0.7;
    ta[i*3+1] = pa[1] * W + 46.0 + (Math.random()-0.5) * 0.7;
    ta[i*3+2] = (Math.random()-0.5) * 2.5;
    tb[i*3]   = pb[0] * W + (Math.random()-0.5) * 0.7;
    tb[i*3+1] = pb[1] * W * 1.05 + 46.0 + (Math.random()-0.5) * 0.7;
    tb[i*3+2] = (Math.random()-0.5) * 2.5;
    rnd[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(start, 3));
  geo.setAttribute('aTargA', new THREE.BufferAttribute(ta, 3));
  geo.setAttribute('aTargB', new THREE.BufferAttribute(tb, 3));
  geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
  textMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uF1: { value: 0 },   // scattered -> english
      uF2: { value: 0 },   // english  -> نورة
      uFade: { value: 1 }, // released when she steps through the gate
    },
    vertexShader: /* glsl */`
      attribute vec3 aTargA, aTargB;
      attribute float aRnd;
      uniform float uTime, uF1, uF2;
      varying float vGold, vTw;
      float ease(float t){ return t * t * (3.0 - 2.0 * t); }
      void main(){
        // per-star stagger so the constellation writes itself
        float f1 = ease(clamp(uF1 * (1.35 + aRnd * 0.5) - aRnd * 0.55, 0.0, 1.0));
        float f2 = ease(clamp(uF2 * (1.35 + aRnd * 0.5) - aRnd * 0.55, 0.0, 1.0));
        vec3 p = mix(position, aTargA, f1);
        p = mix(p, aTargB, f2);
        // gentle life while travelling
        float loose = (1.0 - max(f1, f2) * 0.92);
        p.x += sin(uTime * 0.7 + aRnd * 40.0) * 1.6 * loose + sin(uTime * 1.3 + aRnd * 17.0) * 0.14;
        p.y += cos(uTime * 0.6 + aRnd * 33.0) * 1.6 * loose + cos(uTime * 1.1 + aRnd * 23.0) * 0.14;
        vGold = f2;
        vTw = 0.7 + 0.3 * sin(uTime * (1.0 + aRnd * 2.0) + aRnd * 50.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.0 + aRnd * 1.1 + max(f1, f2) * 0.5) * vTw * (300.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform float uFade;
      varying float vGold, vTw;
      void main(){
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.04, r);
        vec3 c = mix(vec3(0.85, 0.88, 1.0), vec3(1.0, 0.84, 0.55), vGold);
        gl_FragColor = vec4(c * (0.55 + vTw * 0.25), a * 0.5 * uFade);
      }`
  });
  const pts = new THREE.Points(geo, textMat);
  pts.frustumCulled = false;
  textGroup.add(pts);
  textGroup.lookAt(0, 6, -965); // face the camera's resting point
}
if (document.fonts && document.fonts.ready) {
  Promise.race([
    document.fonts.load("300 92px 'Cormorant Garamond'").then(() => document.fonts.load("400 250px 'Aref Ruqaa'")),
    new Promise(r => setTimeout(r, 3500)),
  ]).then(buildTextParticles).catch(buildTextParticles);
} else {
  buildTextParticles();
}

// ---------------------------------------------------------- camera path
const camCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 20),
  new THREE.Vector3(0, 2, -95),
  new THREE.Vector3(10, 5, -210),
  new THREE.Vector3(-9, -3, -335),
  new THREE.Vector3(12, 7, -470),
  new THREE.Vector3(34, 20, -585),
  new THREE.Vector3(8, 5, -700),
  new THREE.Vector3(-9, -2, -820),
  new THREE.Vector3(0, 2, -905),
  new THREE.Vector3(0, 6, -965),
], false, 'catmullrom', 0.35);

const lookCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, -160),
  new THREE.Vector3(2, 3, -280),
  new THREE.Vector3(-5, 0, -400),
  new THREE.Vector3(-40, 12, -560),
  new THREE.Vector3(-70, 16, -610),   // hold on the giant
  new THREE.Vector3(-10, 4, -760),
  new THREE.Vector3(0, 0, -880),
  new THREE.Vector3(0, 14, -1000),
  new THREE.Vector3(0, 46, -1150),    // rise to the writing in the sky
], false, 'catmullrom', 0.35);

// ---------------------------------------------------------- audio
const AudioEngine = {
  ctx: null, master: null, padBus: null, muted: false, started: false,
  padOsc: [], rumble: null, rumbleGain: null, lp: null, chordIdx: 0,
  chords: [
    [41, 48, 57, 60, 64],   // F maj add9
    [36, 48, 55, 62, 64],   // C add9
    [33, 45, 55, 60, 64],   // A min 7
    [38, 50, 57, 62, 65],   // D min 9
  ],
  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  start() {
    if (this.started) return;
    this.started = true;
    const C = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = C;
    this.master = C.createGain();
    this.master.gain.value = 0;
    this.master.connect(C.destination);
    this.master.gain.linearRampToValueAtTime(0.75, C.currentTime + 5);

    // soft hall
    const conv = C.createConvolver();
    const len = C.sampleRate * 3.4;
    const ir = C.createBuffer(2, len, C.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8);
    }
    conv.buffer = ir;
    const wet = C.createGain(); wet.gain.value = 0.55;
    conv.connect(wet).connect(this.master);

    this.lp = C.createBiquadFilter();
    this.lp.type = 'lowpass'; this.lp.frequency.value = 750; this.lp.Q.value = 0.4;
    this.padBus = C.createGain(); this.padBus.gain.value = 0.16;
    this.padBus.connect(this.lp);
    this.lp.connect(this.master); this.lp.connect(conv);

    this.sparkBus = C.createGain(); this.sparkBus.gain.value = 0.10;
    this.sparkBus.connect(conv); this.sparkBus.connect(this.master);

    // rumble for the fall
    const nb = C.createBuffer(1, C.sampleRate * 2, C.sampleRate);
    const nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.rumble = C.createBufferSource();
    this.rumble.buffer = nb; this.rumble.loop = true;
    const rlp = C.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 110;
    this.rumbleGain = C.createGain(); this.rumbleGain.gain.value = 0;
    this.rumble.connect(rlp).connect(this.rumbleGain).connect(this.master);
    this.rumble.start();

    this.playChord(this.chords[0], 6);
    this.chordTimer = setInterval(() => {
      if (C.state !== 'running') return;
      this.chordIdx = (this.chordIdx + 1) % this.chords.length;
      this.playChord(this.chords[this.chordIdx], 7);
    }, 13000);
    this.sparkTimer = setInterval(() => {
      if (C.state !== 'running' || Math.random() < 0.35) return;
      this.pluck();
    }, 5200);
  },
  playChord(midis, dur) {
    const C = this.ctx, t = C.currentTime;
    // release old voices
    for (const { g } of this.padOsc) {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 6);
    }
    const old = this.padOsc;
    setTimeout(() => old.forEach(({ o }) => { try { o.stop(); } catch (_) {} }), 7000);
    this.padOsc = [];
    for (const m of midis) {
      for (const det of [-4, 3]) {
        const o = C.createOscillator();
        o.type = 'sine';
        o.frequency.value = this.midi(m);
        o.detune.value = det;
        const g = C.createGain();
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(0.8 / midis.length, t + dur * 0.55);
        o.connect(g).connect(this.padBus);
        o.start();
        this.padOsc.push({ o, g });
      }
    }
  },
  pluck() {
    const C = this.ctx, t = C.currentTime;
    const scale = [72, 74, 76, 79, 81, 84, 88];
    const o = C.createOscillator();
    o.type = 'sine';
    o.frequency.value = this.midi(scale[(Math.random() * scale.length) | 0]);
    const g = C.createGain();
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    o.connect(g).connect(this.sparkBus);
    o.start(); o.stop(t + 2.8);
  },
  shimmer(v) {
    // guidance chime: swells as the light lens nears the waiting star
    if (!this.ctx) return;
    if (!this._sh) {
      const C = this.ctx;
      const g = C.createGain(); g.gain.value = 0;
      const o1 = C.createOscillator(); o1.type = 'sine'; o1.frequency.value = 1244.5; // D#6
      const o2 = C.createOscillator(); o2.type = 'sine'; o2.frequency.value = 1868.0; // A#6
      const g2 = C.createGain(); g2.gain.value = 0.35;
      const lfo = C.createOscillator(); lfo.frequency.value = 5.2;
      const lfoG = C.createGain(); lfoG.gain.value = 0.02;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      o1.connect(g); o2.connect(g2).connect(g);
      g.connect(this.sparkBus);
      o1.start(); o2.start(); lfo.start();
      this._sh = g;
    }
    this._sh.gain.setTargetAtTime(v * 0.05, this.ctx.currentTime, 0.15);
  },
  setRumble(v) {
    if (!this.rumbleGain) return;
    this.rumbleGain.gain.setTargetAtTime(v * 0.5, this.ctx.currentTime, 0.12);
  },
  warm(v) {
    if (!this.lp) return;
    this.lp.frequency.setTargetAtTime(750 + v * 900, this.ctx.currentTime, 1.5);
  },
  toggleMute() {
    if (!this.ctx) return;
    this.muted = !this.muted;
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.75, this.ctx.currentTime, 0.4);
    return this.muted;
  },
};

// ---------------------------------------------------------- v3: her real sky
const skyNight = new SkyNight(scene, camera);
skyNight.audio = AudioEngine;
window.__SKY = skyNight;
const journeyGroups = [sky, starsFar, starsNear, dust, nebulaGroup, planetGroup, homeGroup, meteorGroup, textGroup];
let skyLoadStarted = false;

// ---------------------------------------------------------- state & input
const S = {
  mode: 'title',        // title -> intro -> journey -> sky
  t0: 0,                // intro clock start
  scroll: 0, scrollT: 0,
  mouse: new THREE.Vector2(), mouseS: new THREE.Vector2(),
  shake: 0, fovKick: 0,
  shooterClock: 0,
  lastFrame: performance.now(),
  slowFrames: 0,
};
const $ = id => document.getElementById(id);
const chapters = [$('ch1'), $('ch2'), $('ch3'), $('ch4'), $('chAug'), $('ch5'), $('ch6'), $('ch7'), $('ch8')];
const chapterWindows = [
  [0.010, 0.096],
  [0.118, 0.204],
  [0.226, 0.312],
  [0.334, 0.420],
  [0.442, 0.528],
  [0.550, 0.636],
  [0.658, 0.736],
  [0.758, 0.836],
  [0.858, 0.920],
];
const progDots = Array.from(document.querySelectorAll('#prog i'));

$('begin').addEventListener('click', () => {
  if (S.mode !== 'title') return;
  AudioEngine.start();
  S.mode = 'intro';
  S.t0 = performance.now() / 1000;
  $('title').classList.add('gone');
  document.body.classList.add('cine');
  $('audioBtn').style.display = 'flex';
  meteorGroup.visible = true;
});

// ---------- v3 gate & sky-mode input
$('gate').addEventListener('click', () => {
  if (S.mode !== 'journey') return;
  // clear the closing card first — otherwise both texts sit on top of each other
  $('finale').classList.remove('on');
  $('prog').classList.remove('on');
  S.gateFade = 0;                       // and let her name fade from the sky
  setTimeout(() => $('skyIntro').classList.add('on'), 900);
});
// ---------- tutorial: teach it like a real game
const SVG = (d) => `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor"
  stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const TUT_STEPS = [
  { icon: SVG(`<path d="M17 30V17.5a2.5 2.5 0 0 1 5 0V25m0-2.5a2.5 2.5 0 0 1 5 0V26m0-2a2.5 2.5 0 0 1 5 0v3"/>
      <path d="M32 27v6a9 9 0 0 1-9 9h-1.2a7 7 0 0 1-5.6-2.9L11 32.5a2.4 2.4 0 0 1 3.6-3.1L17 32"/>
      <path d="M8 12h9M8 12l3.2-3M8 12l3.2 3" opacity=".55"/>`),
    text: 'اسحبي إصبعك على الشاشة بأي اتجاه لتدوري في السماء ٣٦٠ درجة… جربيها بعد ما نبدأ' },
  { icon: SVG(`<path d="M24 6l3.1 12.4L39 24l-11.9 5.6L24 42l-3.1-12.4L9 24l11.9-5.6z"/>
      <circle cx="24" cy="24" r="1.6" fill="currentColor"/>`),
    text: 'في السماء ٧ نجوم تحمل ضوءاً انطلق في سنوات عمرك.\nالسهم والهمسة في أعلى الشاشة يدلانك على النجم المطلوب — وكلما اقتربتِ منه علا الرنين واشتد توهجه' },
  { icon: SVG(`<circle cx="24" cy="24" r="15" opacity=".28"/>
      <path d="M24 9a15 15 0 0 1 13 22.5"/>
      <circle cx="24" cy="24" r="4.6" fill="currentColor" fill-opacity=".35"/>`),
    text: 'إذا وصلتِ النجم المتوهج: ضعي إصبعك عليه ولا ترفعيه حتى تكتمل حلقة الضوء حوله.\nكل نجم يفتح لكِ رسالة… وآخر نجم يخبئ المفاجأة الكبرى' },
  { icon: SVG(`<circle cx="33" cy="15" r="4.4" fill="currentColor" fill-opacity=".35"/>
      <path d="M29 19L10 38"/><path d="M22 17L13 26" opacity=".6"/><path d="M31 27l-9 9" opacity=".6"/>`),
    text: 'والشهب التي تعبر السماء حقيقية — تمطر كل عام في ليلة ميلادك.\nالمسي أي شهاب عابر تلتقطي أمنية' },
];
let tutIdx = 0;
function showTut(i) {
  tutIdx = i;
  $('tutStep').textContent = `${i + 1} — ${TUT_STEPS.length}`;
  $('tutIcon').innerHTML = TUT_STEPS[i].icon;
  $('tutText').innerText = TUT_STEPS[i].text;
  $('tutNext').textContent = i === TUT_STEPS.length - 1 ? 'ابدئي رحلة الضوء ✦' : 'التالي';
  $('tut').classList.add('on');
}
$('tutNext').addEventListener('click', () => {
  if (tutIdx < TUT_STEPS.length - 1) { showTut(tutIdx + 1); return; }
  $('tut').classList.remove('on');
  skyNight.tutorialDone = true;
  skyNight.whisperToStation();
});
$('helpBtn').addEventListener('click', () => showTut(0));

$('siStart').addEventListener('click', () => {
  if (!skyNight.ready) { setTimeout(() => $('siStart').click(), 400); return; }
  $('skyIntro').classList.remove('on');
  // the tear opens, and she falls through it
  $('flash').style.transition = 'opacity .55s ease';
  $('flash').style.opacity = 1;
  setTimeout(() => {
    S.mode = 'sky';
    document.body.classList.add('sky');
    for (const g of journeyGroups) g.visible = false;
    for (const s of shooters) { s.life = 0; s.mesh.visible = false; }
    $('finale').classList.remove('on');
    $('prog').classList.remove('on');
    chapters.forEach(c => c.classList.remove('on'));
    renderer.toneMappingExposure = 1.42;
    finalPass.uniforms.uWarm.value = 0.08;
    finalPass.uniforms.uCA.value = 0.0009;
    // the flash is now driven frame by frame by the wormhole itself
    $('flash').style.transition = 'none';
    skyNight.onFlash = v => { $('flash').style.opacity = String(v); };
    skyNight.onArrived = () => {
      document.body.classList.add('skyPlay');
      if (!skyNight.tutorialDone && skyNight.stationIdx < 7) showTut(0);
      else skyNight.whisperToStation();
    };
    skyNight.enter();
    $('flash').style.opacity = '0';
  }, 560);
});
$('memClose').addEventListener('click', () => {
  $('memCard').classList.remove('on');
  setTimeout(() => skyNight.whisperToStation(), 1500);
});
$('gyroBtn').addEventListener('click', () => skyNight.enableGyro());

// lens / hold-to-expose / drag routing for sky mode
const P = { down: false, x: 0, y: 0, t: 0, moved: 0, exposing: false };
addEventListener('pointerdown', e => {
  if (S.mode !== 'sky' || skyNight.phase !== 'play') return;
  P.down = true; P.x = e.clientX; P.y = e.clientY;
  P.t = performance.now(); P.moved = 0;
  skyNight.moveLens(e.clientX, e.clientY);
  P.exposing = skyNight.pressStart(e.clientX, e.clientY);
});
addEventListener('pointermove', e => {
  if (S.mode !== 'sky' || skyNight.phase !== 'play') return;
  skyNight.moveLens(e.clientX, e.clientY);
  if (!P.down) return;
  const dx = e.clientX - P.x, dy = e.clientY - P.y;
  P.moved += Math.abs(dx) + Math.abs(dy);
  if (pinch.dist) { skyNight.cancelExposure(); P.exposing = false; return; }
  if (P.exposing) skyNight.pressMove(e.clientX, e.clientY);
  else skyNight.drag(dx, dy);
  P.x = e.clientX; P.y = e.clientY;
});
addEventListener('pointerup', e => {
  if (S.mode !== 'sky' || !P.down) return;
  P.down = false;
  if (P.exposing) { skyNight.pressEnd(); P.exposing = false; return; }
  if (P.moved < 10 && performance.now() - P.t < 500) {
    skyNight.tapMeteor(e.clientX, e.clientY);
  }
});

$('audioBtn').addEventListener('click', () => {
  const m = AudioEngine.toggleMute();
  for (const id of ['wave1', 'wave2']) $(id).style.display = m ? 'none' : '';
  $('mute').style.display = m ? '' : 'none';
});

let hintShown = false, hintKilled = false;
function onScrollInput(dy) {
  if (S.mode !== 'journey') return;
  S.scrollT = THREE.MathUtils.clamp(S.scrollT + dy * 0.00003, 0, 1);
  if (!hintKilled && S.scrollT > 0.01) {
    hintKilled = true;
    $('hint').classList.remove('on');
  }
}
addEventListener('wheel', e => {
  if (S.mode === 'sky') { skyNight.zoom(e.deltaY * 0.012); return; }
  onScrollInput(e.deltaY);
}, { passive: true });
let touchY = null;
addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
addEventListener('touchmove', e => {
  if (touchY !== null) {
    onScrollInput((touchY - e.touches[0].clientY) * 3.2);
    touchY = e.touches[0].clientY;
  }
}, { passive: true });
addEventListener('keydown', e => {
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') onScrollInput(700);
  if (e.key === 'ArrowUp' || e.key === 'PageUp') onScrollInput(-700);
});
addEventListener('pointermove', e => {
  S.mouse.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
});
addEventListener('pointerdown', () => {
  if (S.mode === 'journey') spawnShooter(camera.position); // اصنعي أمنية
});
// ---------- mobile hardening
document.addEventListener('gesturestart', e => e.preventDefault());   // iOS pinch page-zoom
document.addEventListener('contextmenu', e => e.preventDefault());    // long-press menu breaks hold-to-expose
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && AudioEngine.ctx && AudioEngine.ctx.state === 'suspended') AudioEngine.ctx.resume();
});
addEventListener('pointerdown', () => {
  if (AudioEngine.ctx && AudioEngine.ctx.state === 'suspended') AudioEngine.ctx.resume();
});

// two-finger pinch = telescope zoom in the sky
const pinch = { pts: new Map(), dist: 0 };
addEventListener('touchstart', e => {
  if (S.mode !== 'sky' || e.touches.length !== 2) return;
  pinch.dist = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY);
}, { passive: true });
addEventListener('touchmove', e => {
  if (S.mode !== 'sky' || e.touches.length !== 2 || !pinch.dist) return;
  const d = Math.hypot(
    e.touches[0].clientX - e.touches[1].clientX,
    e.touches[0].clientY - e.touches[1].clientY);
  skyNight.zoom((pinch.dist - d) * 0.12);
  skyNight.cancelExposure();
  pinch.dist = d;
}, { passive: true });
addEventListener('touchend', () => { pinch.dist = 0; }, { passive: true });

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------- helpers
const ease = t => t * t * (3 - 2 * t);
const gauss = (x, c, w) => Math.exp(-((x - c) * (x - c)) / (2 * w * w));
const clamp01 = x => THREE.MathUtils.clamp(x, 0, 1);
const V3 = new THREE.Vector3();
const V3b = new THREE.Vector3();

function setChapter(el, on) {
  if (on !== el.classList.contains('on')) el.classList.toggle('on', on);
}

// ---------------------------------------------------------- main loop
let introHandoff = false;
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  const now = performance.now();

  // adaptive quality
  const fdt = now - S.lastFrame;
  S.lastFrame = now;
  if (fdt > 24) { if (++S.slowFrames > 90 && pixelRatio > 1.25) {
    pixelRatio = Math.max(1.25, pixelRatio - 0.25);
    renderer.setPixelRatio(pixelRatio);
    composer.setPixelRatio ? composer.setPixelRatio(pixelRatio) : composer.setSize(innerWidth, innerHeight);
    S.slowFrames = 0;
  } } else if (S.slowFrames > 0) S.slowFrames--;

  // shared uniforms
  skyMat.uniforms.uTime.value = time;
  starsFar.material.uniforms.uTime.value = time;
  starsNear.material.uniforms.uTime.value = time;
  dust.material.uniforms.uTime.value = time;
  nebulaGroup.userData.mat.uniforms.uTime.value = time;
  planetGroup.userData.mat.uniforms.uTime.value = time;
  homeGroup.userData.mat.uniforms.uTime.value = time;
  homeGroup.userData.aurora.uniforms.uTime.value = time;
  finalPass.uniforms.uTime.value = time;
  if (textMat) textMat.uniforms.uTime.value = time;

  // moons orbit
  const [m1, m2] = planetGroup.userData.moons;
  m1.position.set(Math.cos(time * 0.05) * 62, 6, Math.sin(time * 0.05) * 62);
  m2.position.set(Math.cos(time * 0.09 + 2) * 88, -10, Math.sin(time * 0.09 + 2) * 88);
  planetGroup.rotation.y = time * 0.008;

  // smooth mouse
  S.mouseS.lerp(S.mouse, 1 - Math.exp(-dt * 3.2));

  sky.position.copy(camera.position);

  // cinematic reveal: each world exists only in its own chapter
  const p0 = S.mode === 'journey' ? S.scroll : 0;
  planetGroup.visible = S.mode === 'journey' && p0 > 0.30 && p0 < 0.78;
  homeGroup.visible   = S.mode === 'journey' && p0 > 0.55;
  textGroup.visible   = S.mode === 'journey' && p0 > 0.62;

  if (S.mode === 'title') {
    // slow drift while she reads the title
    camera.position.set(Math.sin(time * 0.05) * 2, Math.cos(time * 0.04) * 1.2, 20);
    camera.lookAt(S.mouseS.x * 6, -S.mouseS.y * 4, -160);
    skyMat.uniforms.uNebula.value = 0.12;
  }

  else if (S.mode === 'intro') {
    const t = performance.now() / 1000 - S.t0;
    const rock = meteorGroup.userData;
    rock.fire.material.uniforms.uTime.value = time;
    rock.trail.uniforms.uTime.value = time;
    meteorGroup.rotation.x = time * 0.7;
    meteorGroup.rotation.y = time * 0.45;

    if (t < 5.0) {
      // the meteor closes in — and we dive into it
      const k = ease(clamp01(t / 5));
      V3.set(-230, 130, -820).lerp(V3b.set(0, 0, 12), k);
      meteorGroup.position.copy(V3);
      const heat = clamp01((t - 1.2) / 3);
      rock.rock.material.emissiveIntensity = heat * 1.6;
      rock.fire.material.uniforms.uHeat.value = heat * 0.9;
      rock.trail.uniforms.uAmt.value = heat;
      rock.glow.intensity = heat * 900;
      // trail points away from travel direction
      meteorGroup.lookAt(camera.position);
      camera.position.set(Math.sin(time * 0.05) * 2, Math.cos(time * 0.04) * 1.2, 20);
      camera.lookAt(meteorGroup.position);
      camera.fov = 62 - k * 10;
      // white-hot the instant we merge
      $('flash').style.opacity = String(clamp01((t - 4.45) / 0.55));
      S.shake = k * 0.25;
    } else if (t < 12.0) {
      // WE are the meteor now — the burn
      if (meteorGroup.visible) meteorGroup.visible = false;
      const f = clamp01((t - 5.0) / 0.8);            // ramp in
      const out = clamp01((t - 10.2) / 1.8);         // ramp out
      const drive = f * (1 - ease(out));
      $('flash').style.opacity = String(1 - clamp01((t - 5.0) / 0.9));
      camera.position.set(0, 0, 20 - (t - 5.0) * 0.6);
      camera.lookAt(0, 0, -400);
      camera.fov = 62 + drive * 34;
      S.shake = drive * 0.6;
      finalPass.uniforms.uStreak.value = drive * 0.85;
      bloom.strength = 1.0 + drive * 1.1;
      AudioEngine.setRumble(drive);
      // streaks scream past
      const fg = fallGroup.userData;
      fg.mat.opacity = drive * 0.8;
      const arr = fg.geo.attributes.position.array;
      for (let i = 0; i < fg.seeds.length; i++) {
        const s = fg.seeds[i];
        s.z += s.sp * dt * (0.25 + drive);
        if (s.z > 30) s.z -= 250;
        arr[i*6+2] = s.z; arr[i*6+5] = s.z + s.len * (1 + drive * 2.2);
      }
      fg.geo.attributes.position.needsUpdate = true;
    } else {
      // stillness after the storm
      const k = ease(clamp01((t - 12.0) / 2.2));
      camera.fov = 96 - 0 * k; // fov already eased by drive above
      camera.fov = THREE.MathUtils.lerp(camera.fov, 62, k);
      finalPass.uniforms.uStreak.value *= (1 - k);
      fallGroup.userData.mat.opacity *= (1 - k);
      bloom.strength = THREE.MathUtils.lerp(bloom.strength, 1.0, k);
      AudioEngine.setRumble(0);
      S.shake *= (1 - k);
      camera.position.lerp(V3.copy(camCurve.getPoint(0)), k * 0.15);
      camera.lookAt(0, 0, -400);
      if (t > 14.2 && !introHandoff) {
        introHandoff = true;
        S.mode = 'journey';
        S.scroll = 0; S.scrollT = 0;
        finalPass.uniforms.uStreak.value = 0;
        fallGroup.userData.mat.opacity = 0;
        if (!hintShown) { hintShown = true; $('hint').classList.add('on'); $('prog').classList.add('on'); }
      }
    }
    camera.updateProjectionMatrix();
  }

  else if (S.mode === 'journey') {
    // cinematic virtual scroll
    S.scroll += (S.scrollT - S.scroll) * (1 - Math.exp(-dt * 1.9));
    const p = S.scroll;
    if (!hintKilled && p > 0.012) { hintKilled = true; $('hint').classList.remove('on'); }

    camCurve.getPoint(p, V3);
    lookCurve.getPoint(p, V3b);
    // 3D parallax from the mouse — the world answers her hand
    const par = 1 - clamp01((p - 0.9) * 10) * 0.6;
    camera.position.copy(V3).add(
      new THREE.Vector3(S.mouseS.x * 3.2 * par, -S.mouseS.y * 2.0 * par, 0)
    );
    camera.lookAt(V3b.x + S.mouseS.x * 8 * par, V3b.y - S.mouseS.y * 5 * par, V3b.z);
    // gentle banking through the nebula
    camera.rotation.z += Math.sin(p * Math.PI * 4.0) * 0.045 * gauss(p, 0.3, 0.2)
                       + S.mouseS.x * -0.02 * par;

    // grades per chapter
    skyMat.uniforms.uNebula.value = 0.12 + gauss(p, 0.26, 0.11) * 1.0;
    nebulaGroup.userData.mat.uniforms.uAmt.value = 0.25 + gauss(p, 0.26, 0.12) * 1.1;
    const warm = ease(clamp01((p - 0.88) / 0.12));
    skyMat.uniforms.uWarm.value = warm;
    finalPass.uniforms.uWarm.value = warm;
    homeGroup.userData.mat.uniforms.uWarm.value = warm;
    homeGroup.userData.atmo.material.uniforms.uWarm.value = warm;
    homeGroup.userData.aurora.uniforms.uAmt.value = ease(clamp01((p - 0.78) / 0.1));
    bloom.strength = 0.9 + gauss(p, 0.26, 0.12) * 0.3 + warm * 0.2;
    renderer.toneMappingExposure = 1.0 + gauss(p, 0.5, 0.09) * 0.08 + warm * 0.1;
    camera.fov = 62 + gauss(p, 0.68, 0.08) * 6 - warm * 6;
    camera.updateProjectionMatrix();
    AudioEngine.warm(warm);

    // meteor shower chapter + occasional wanderers
    S.shooterClock -= dt;
    if (S.shooterClock <= 0) {
      const inShower = p > 0.58 && p < 0.8;
      if (inShower || Math.random() < 0.25) spawnShooter(camera.position);
      S.shooterClock = inShower ? 0.55 + Math.random() * 0.5 : 5 + Math.random() * 4;
    }

    // preload her real sky before the gate appears
    if (!skyLoadStarted && p > 0.7) {
      skyLoadStarted = true;
      skyNight.load().catch(err => console.warn('sky load failed', err));
    }

    // star-writing
    if (textMat) {
      textMat.uniforms.uF1.value = ease(clamp01((p - 0.920) / 0.055));
      textMat.uniforms.uF2.value = ease(clamp01((p - 0.972) / 0.026));
      if (S.gateFade !== undefined) {
        S.gateFade = Math.min(1, S.gateFade + dt / 1.4);
        textGroup.visible = S.gateFade < 1;
        textMat.uniforms.uFade.value = 1 - S.gateFade;
      }
    }

    // overlay text windows
    for (let i = 0; i < chapters.length; i++) {
      setChapter(chapters[i], p > chapterWindows[i][0] && p < chapterWindows[i][1]);
    }
    $('finale').classList.toggle('on', p > 0.99);
    progDots.forEach((d, i) => d.classList.toggle('lit', p > i * 0.2 + 0.01));
  }

  else if (S.mode === 'sky') {
    skyNight.update(dt, time);
    // the wormhole burns hot; the night that follows is quiet
    const wh = skyNight.phase === 'wormhole';
    bloom.strength += ((wh ? 0.72 : 0.8) - bloom.strength) * (1 - Math.exp(-dt * 3));
    finalPass.uniforms.uStreak.value += ((wh ? 0.55 : 0) - finalPass.uniforms.uStreak.value) * (1 - Math.exp(-dt * 3));
    finalPass.uniforms.uCA.value = wh ? 0.0045 : 0.0009;
    AudioEngine.setRumble(wh ? 0.75 : 0);
  }

  // camera shake (intro fall)
  if (S.shake > 0.001) {
    camera.position.x += (Math.random() - 0.5) * S.shake;
    camera.position.y += (Math.random() - 0.5) * S.shake;
    camera.rotation.z += (Math.random() - 0.5) * S.shake * 0.02;
  }

  // shooting star physics
  for (const s of shooters) {
    if (s.life > 0) {
      s.life -= dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      const lt = s.life / s.dur;
      s.mesh.material.uniforms.uAlpha.value = Math.sin(clamp01(lt) * Math.PI) * 0.9;
      if (s.life <= 0) s.mesh.visible = false;
    }
  }

  composer.render();
}
frame();
