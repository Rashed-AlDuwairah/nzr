// ============================================================
//  مِرصَد نورة — a real instrument pointed at a real sky
//
//  Ten objects, each located from her clock and her coordinates by
//  a full ephemeris: her birth-year star, the Moon in its true phase,
//  four planets, three fixed stars and a galaxy, and the radiant that
//  rains on her birthday. She stands under it while she looks.
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { ShaderPass } from './vendor/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './vendor/postprocessing/UnrealBloomPass.js';
import { buildNoura, buildRiyadh, buildWormhole, buildEarth, buildObservatory } from './world.js';
import { TARGETS, LIVE, locate, moonInfo, Astro } from './targets.js';
import { issNow, nextPass } from './iss.js';
import { acquire, describe as placeName, skyErrorDeg, USABLE_M } from './place.js';
import { sky, census, upcoming, moonLine, clock as hhmm, dirName, sinceLast,
         nextObservable, howFar, MIN_ALT } from './brief.js';

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const $ = id => document.getElementById(id);
const AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const arNum = n => String(n).split('').map(c => (c >= '0' && c <= '9') ? AR[+c] : c).join('');

function dirFromAzAlt(azDeg, altDeg, r = 1) {
  const az = azDeg * D2R, alt = altDeg * D2R;
  return new THREE.Vector3(
    Math.sin(az) * Math.cos(alt) * r, Math.sin(alt) * r, -Math.cos(az) * Math.cos(alt) * r);
}
function raDecToVec(raH, decDeg, r) {
  const ra = raH * 15 * D2R, dec = decDeg * D2R;
  return new THREE.Vector3(
    Math.cos(dec) * Math.sin(ra) * r, Math.sin(dec) * r, Math.cos(dec) * Math.cos(ra) * r);
}
function gmst(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;
  const t = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
          + 0.000387933 * T * T - T * T * T / 38710000;
  return ((t % 360) + 360) % 360;
}

// ---------------------------------------------------------------- state
const S = {
  lat: 24.7136, lon: 46.6753, placed: false,
  heading: null, useMotion: false,
  yaw: 0.16, pitch: 0.22, yawV: 0, pitchV: 0,
  idx: 0, found: new Set(), locked: false, lockHold: 0,
  ready: false, started: false,
  obs: null, place: null,
  mq: new THREE.Quaternion(), hasMq: false, lastMotion: 0,
  iss: null, issA: null, issPass: null, issErr: false,
  markY: (-90 - 46.6753) * Math.PI / 180,
  northOff: 0, hasNorth: false, backAt: null,
};
window.__OBS = S;

// ---------------------------------------------------------------- three
const canvas = $('sky');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

// motion is a choice, not an assumption
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 4000);
camera.position.set(0, 1.62, 0);   // her eye height, so the ground reads as ground

// ---------------------------------------------------------------- the grade
//  A multisampled half-float target, one bloom pass, and a final grade.
//  The dither at the end is the important part: this page is almost entirely
//  a very dark gradient, and 8-bit output turns that into visible rings.
//  Interleaved gradient noise remapped to a triangular distribution is the
//  standard fix (Jimenez, *Next Generation Post Processing in Call of Duty:
//  Advanced Warfare*) — it costs nothing and removes the banding completely.
const _sz = renderer.getDrawingBufferSize(new THREE.Vector2());
const composer = new EffectComposer(renderer,
  new THREE.WebGLRenderTarget(_sz.width, _sz.height, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.62, 0.7, 0.72);
composer.addPass(bloom);

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime:  { value: 0 },
    uCA:    { value: 0.0012 },
    uVig:   { value: 0.52 },
    uGrain: { value: 0.030 },
    uRush:  { value: 0.0 },     // radial streak, only while falling
  },
  vertexShader: `varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uCA, uVig, uGrain, uRush;
    varying vec2 vUv;

    // interleaved gradient noise — cheap, and its error is spread like blue noise
    float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

    void main(){
      vec2 uv = vUv, toC = uv - 0.5;
      vec3 col = vec3(0.0); float total = 0.0;
      for (int i = 0; i < 6; i++){
        float t = float(i) / 5.0;
        float w = 1.0 - t * 0.55;
        vec2 suv = uv - toC * uRush * t * 0.30;
        float ca = uCA * (0.35 + dot(toC, toC) * 3.2) * (1.0 + uRush * 5.0);
        col += vec3(texture2D(tDiffuse, suv + toC * ca).r,
                    texture2D(tDiffuse, suv).g,
                    texture2D(tDiffuse, suv - toC * ca).b) * w;
        total += w;
        if (uRush < 0.001) { total = w; break; }
      }
      col /= total;

      float vig = 1.0 - smoothstep(0.34, 1.22, length(toC) * (1.15 + uRush)) * uVig;
      col *= vig;

      float g = ign(gl_FragCoord.xy + fract(uTime) * 137.0) - 0.5;
      col += g * uGrain * (0.35 + 0.65 * (1.0 - dot(col, vec3(0.333))));

      // uniform -> triangular PDF, then one 8-bit step: bands become stipple
      float d = ign(gl_FragCoord.xy + 11.0);
      float tri = d < 0.5 ? sqrt(2.0 * d) - 1.0 : 1.0 - sqrt(2.0 - 2.0 * d);
      col += tri / 255.0;

      gl_FragColor = vec4(col, 1.0);
    }`
};
const grade = new ShaderPass(GradeShader);
composer.addPass(grade);
if (REDUCED) { grade.uniforms.uGrain.value = 0.012; grade.uniforms.uCA.value = 0.0; }

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
});

const R = 900;
// Everything that has a real compass bearing hangs off `world`, so it can be
// turned as one to agree with the phone's compass. Without this the sky is
// drawn against the phone's arbitrary alpha origin and every direction — the
// arrow included — is off by an unknown angle.
const world = new THREE.Group();
scene.add(world);
const skyGroup = new THREE.Group();     // the celestial sphere, turned to her horizon
world.add(skyGroup);
const localGroup = new THREE.Group();   // things fixed to her ground
world.add(localGroup);

// ---- night, airglow, and the ground she stands on
{
  const bg = new THREE.Mesh(new THREE.SphereGeometry(R * 2.4, 40, 28),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: `varying vec3 vD; void main(){ vD = position;
        gl_Position = (projectionMatrix * modelViewMatrix * vec4(position,1.0)).xyww; }`,
      fragmentShader: `varying vec3 vD;
        void main(){
          vec3 d = normalize(vD);
          vec3 col = vec3(0.016, 0.020, 0.038) * (1.0 - abs(d.y) * 0.3);
          col += exp(-abs(d.y) * 14.0) * vec3(0.10, 0.062, 0.032);
          col = mix(col, vec3(0.013, 0.012, 0.013), smoothstep(0.02, -0.03, d.y));
          gl_FragColor = vec4(col, 1.0);
        }`
    }));
  bg.frustumCulled = false; bg.renderOrder = -10;
  scene.add(bg);
}

// her city on the horizon, and Noura standing in the foreground
{
  const city = buildRiyadh();
  city.scale.setScalar(1.0);
  localGroup.add(city);
  const her = buildNoura();
  // she stands a few paces ahead, her head about level with the eye,
  // so she reads as a silhouette under the sky and never covers it
  her.position.set(1.15, 0, -4.4);
  her.scale.setScalar(1.0);
  her.rotation.y = -0.30;
  // she stands closer to the eye here than in the journey, so her rim carries
  // a little further — the body itself stays black
  her.traverse(o => {
    const u = o.material && o.material.uniforms;
    if (!u || !u.uRim) return;
    u.uRim.value *= 1.3;
  });
  localGroup.add(her);
}

// ---- a little light, so the dome and the figure are objects and not cut-outs
{
  scene.add(new THREE.HemisphereLight(0x33406e, 0x160d07, 1.5));
  const spill = new THREE.PointLight(0xffb765, 14.0, 30, 2.0);
  spill.position.set(-4.4, 1.4, -7.2);
  scene.add(spill);
}

// ---- her observatory, standing beside her
const dome = buildObservatory();
dome.position.set(-5.4, 0, -9.6);
dome.rotation.y = 0.46;
localGroup.add(dome);

// ---------------------------------------------------------------- the flight
//  Everything the arrival needs lives far above the ground scene, so the
//  two never see each other. The camera visits it and comes back.
const FLY_Y = 10000;
const flight = new THREE.Group();
flight.position.set(0, FLY_Y, 0);
flight.visible = false;
scene.add(flight);

const worm = buildWormhole();
flight.add(worm);

const texLoader = new THREE.TextureLoader();
const earth = buildEarth(texLoader);
earth.position.set(0, 0, -900);
earth.rotation.z = 0.41;                 // her planet's tilt, roughly
flight.add(earth);

// a field of stars for the approach, so Earth is not floating in a void
{
  const N = 1400, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(2600 + Math.random() * 900);
    pos[i*3] = v.x; pos[i*3+1] = v.y; pos[i*3+2] = v.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sz = new Float32Array(N);
  for (let i = 0; i < N; i++) sz[i] = Math.pow(Math.random(), 3.2) * 3.6 + 0.6;
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  flight.add(new THREE.Points(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aSize; varying float vS;
      void main(){ vS = aSize;
        gl_PointSize = aSize;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float vS;
      void main(){
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, r);
        gl_FragColor = vec4(vec3(0.88, 0.91, 1.0), a * 0.9);
      }`
  })));
}

// ---------------------------------------------------------------- catalogue
let starMat, lineSeg;
const marks = [];   // one visual per target

function buildSky(d) {
  const n = d.stars.length;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const size = new Float32Array(n), ph = new Float32Array(n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const [ra, dec, mag, ci] = d.stars[i];
    const v = raDecToVec(ra, dec, R);
    pos[i*3] = v.x; pos[i*3+1] = v.y; pos[i*3+2] = v.z;
    if (ci < 0.0)      c.setRGB(0.68, 0.79, 1.00);
    else if (ci < 0.3) c.setRGB(0.83, 0.89, 1.00);
    else if (ci < 0.6) c.setRGB(1.00, 0.98, 0.94);
    else if (ci < 0.9) c.setRGB(1.00, 0.93, 0.79);
    else if (ci < 1.3) c.setRGB(1.00, 0.86, 0.63);
    else               c.setRGB(1.00, 0.77, 0.53);
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    size[i] = Math.max(1.0, 6.2 - mag) * 0.74;
    ph[i] = Math.random() * 6.28;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  starMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `attribute vec3 aColor; attribute float aSize, aPhase;
      uniform float uTime; varying vec3 vC; varying float vT;
      void main(){ vC = aColor; vT = 0.76 + 0.24 * sin(uTime * (1.1 + aPhase) + aPhase * 19.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * vT * 3.4;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vT;
      void main(){ float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.06, r) + smoothstep(0.14, 0.0, r) * 0.85;
        gl_FragColor = vec4(vC * vT * 1.2, a * 0.95); }`
  });
  const pts = new THREE.Points(geo, starMat);
  pts.frustumCulled = false;
  skyGroup.add(pts);

  const lp = [];
  for (const seg of d.lines)
    for (let i = 0; i < seg.length - 1; i++) {
      const a = raDecToVec(seg[i][0], seg[i][1], R * 0.995);
      const b = raDecToVec(seg[i+1][0], seg[i+1][1], R * 0.995);
      lp.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
  lineSeg = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({
    color: 0x8fa8dd, transparent: true, opacity: 0.085,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  lineSeg.frustumCulled = false;
  skyGroup.add(lineSeg);
}

function discTexture(inner = 'rgba(255,255,255,1)') {
  const s = 128, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.22, 'rgba(255,240,214,0.82)');
  grd.addColorStop(0.55, 'rgba(255,200,130,0.20)');
  grd.addColorStop(1, 'rgba(255,180,100,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// each target gets a halo, a core and a ring that closes as she nears it
function buildMarks() {
  const tex = discTexture();
  for (const t of TARGETS) {
    const g = new THREE.Group();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, color: t.hue, opacity: 0 }));
    halo.scale.setScalar(46);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, color: 0xffffff, opacity: 0 }));
    core.scale.setScalar(14);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.054, 72),
      new THREE.MeshBasicMaterial({ color: 0xffb765, transparent: true, opacity: 0,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.scale.setScalar(R * 0.96);
    g.add(halo, core, ring);
    localGroup.add(g);          // positioned in horizon coordinates each frame
    marks.push({ t, g, halo, core, ring });
  }
}

// the Moon, drawn in its true phase
let moonMesh;
function buildMoon() {
  const map = texLoader.load('./tex/moon.jpg');
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  moonMesh = new THREE.Mesh(new THREE.PlaneGeometry(46, 46),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uPhase: { value: 1.6 }, uMap: { value: map }, uLib: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uPhase, uLib; uniform sampler2D uMap;
        varying vec2 vUv;
        #define PI 3.14159265
        void main(){
          float r2 = dot(vUv, vUv);
          if (r2 > 1.0) discard;
          // the disc is a sphere seen face on: unproject to get the map
          vec3 N = vec3(vUv.x, vUv.y, sqrt(max(0.0, 1.0 - r2)));
          vec2 uv = vec2(atan(N.x, N.z) / (2.0 * PI) + 0.5 + uLib, asin(clamp(N.y, -1.0, 1.0)) / PI + 0.5);
          vec3 surf = texture2D(uMap, uv).rgb;

          // lit by the true phase angle, with a soft terminator
          vec3 L = normalize(vec3(-sin(uPhase), 0.06, -cos(uPhase)));
          float lam = dot(N, L);
          float lit = smoothstep(-0.06, 0.22, lam);
          // the moon is a rough ball: it stays bright almost to the edge
          lit *= 0.55 + 0.45 * pow(max(lam, 0.0), 0.35);
          // earthshine on the dark limb
          float ash = (1.0 - lit) * 0.030;

          vec3 col = surf * (lit * 1.25 + ash);
          gl_FragColor = vec4(col, smoothstep(1.0, 0.90, r2));
        }`
    }));
  moonMesh.visible = false;   // until it is placed, it is a 46-unit black disc
  localGroup.add(moonMesh);
}

// ---------------------------------------------------------------- compass band
function buildBand() {
  const inner = $('bandInner');
  inner.innerHTML = '';
  const PPD = 5.2;
  const names = { 0:'N', 45:'NE', 90:'E', 135:'SE', 180:'S', 225:'SW', 270:'W', 315:'NW' };
  for (let rep = -1; rep <= 1; rep++)
    for (let a = 0; a < 360; a += 5) {
      const x = (a + rep * 360) * PPD, maj = a % 45 === 0;
      const tk = document.createElement('i');
      tk.className = 'tk' + (maj ? ' maj' : '');
      tk.style.left = x + 'px'; tk.style.height = maj ? '13px' : '7px';
      inner.appendChild(tk);
      if (maj) {
        const l = document.createElement('span');
        l.className = 'tkl'; l.style.left = x + 'px'; l.textContent = names[a];
        inner.appendChild(l);
      }
    }
  inner.dataset.ppd = PPD;
}
function updateBand(h) {
  const inner = $('bandInner');
  inner.style.transform = `translateX(${innerWidth / 2 - h * (+inner.dataset.ppd)}px)`;
}

// ---------------------------------------------------------------- device motion
function attachMotion() {
  const q = new THREE.Quaternion(), e = new THREE.Euler();
  const zee = new THREE.Vector3(0, 0, 1);
  const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
  const handler = ev => {
    if (ev.alpha == null) return;
    S.useMotion = true;
    S.lastMotion = performance.now();
    if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading))
      S.heading = ev.webkitCompassHeading;
    else if (ev.absolute === true) S.heading = (360 - ev.alpha) % 360;
    const scr = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * D2R;
    e.set(ev.beta * D2R, ev.alpha * D2R, -ev.gamma * D2R, 'YXZ');
    q.setFromEuler(e);
    q.multiply(q1);
    q.multiply(new THREE.Quaternion().setFromAxisAngle(zee, -scr));
    // the sensor is noisy at the last degree; the view must not shiver
    S.mq.copy(q); S.hasMq = true;
  };
  const add = () => {
    addEventListener('deviceorientationabsolute', handler, true);
    addEventListener('deviceorientation', handler, true);
  };
  if (typeof DeviceOrientationEvent !== 'undefined'
      && typeof DeviceOrientationEvent.requestPermission === 'function')
    return DeviceOrientationEvent.requestPermission()
      .then(r => { if (r === 'granted') add(); }).catch(() => {});
  add();
  return Promise.resolve();
}

// drag to look, when the device will not tell us where it points
{
  let down = false, px = 0, py = 0, moved = 0;
  addEventListener('pointerdown', e => { down = true; px = e.clientX; py = e.clientY; moved = 0; });
  addEventListener('pointermove', e => {
    if (!down || S.useMotion) return;
    moved += Math.abs(e.clientX - px) + Math.abs(e.clientY - py);
    S.yawV = -(e.clientX - px) * 0.0035;
    S.pitchV = (e.clientY - py) * 0.0035;
    px = e.clientX; py = e.clientY;
  });
  addEventListener('pointerup', () => { down = false; });
}

// ---------------------------------------------------------------- the list
//  What is above her, highest first, then what is not and when it returns.
//  Rebuilt on every open, because between one open and the next the sky
//  has moved.
function buildLog() {
  const host = $('logList');
  host.innerHTML = '';
  const now = new Date();
  const rows = TARGETS.map((t, i) => ({ t, i, p: locate(t, S.obs, now) }));
  const up = rows.filter(r => !r.p.stale && r.p.alt > MIN_ALT).sort((a, b) => b.p.alt - a.p.alt);
  const down = rows.filter(r => r.p.stale || r.p.alt <= MIN_ALT);

  // when do the ones below come back? computed once, here, not per frame
  const back = down.length ? nextObservable(down.map(r => r.t), S.obs, now) : {};

  const head = (txt, sub) => {
    const h = document.createElement('div');
    h.className = 'lgHead';
    h.innerHTML = `<span>${txt}</span>${sub ? `<em>${sub}</em>` : ''}`;
    host.appendChild(h);
  };
  const row = (r, right, cls) => {
    const b = document.createElement('button');
    b.className = 'logRow' + (cls ? ' ' + cls : '');
    b.dataset.i = r.i;
    b.innerHTML = `<span class="lg-n">${r.t.ar}</span><span class="lg-a">${right}</span>`;
    b.addEventListener('click', () => { selectTarget(r.i); toggleLog(false); });
    host.appendChild(b);
  };

  const st = sky(S.obs, now);
  if (st.alt > -6) {
    const d = document.createElement('div');
    d.className = 'lgNote';
    d.textContent = st.alt > 0
      ? 'الشمس ما زالت فوق الأفق — ما تحته موجودٌ فعلاً، لكنكِ لن ترَيه حتى تغيب.'
      : 'الشفق ما زال في السماء — انتظري قليلاً وسيظهر أكثرها.';
    host.appendChild(d);
  }

  if (up.length) {
    head('فوق أفقكِ الآن', arNum(up.length));
    for (const r of up)
      row(r, `<b class="n">${arNum(Math.round(r.p.alt))}°</b> <span class="dir">${dirName(r.p.az)}</span>`,
          S.found.has(r.t.id) ? 'seen' : '');
  } else {
    // the honest empty state: nothing at all, and when that changes
    const soonest = Object.entries(back).sort((a, b) => a[1] - b[1])[0];
    const e = document.createElement('div');
    e.className = 'lgEmpty';
    e.innerHTML = soonest
      ? `لا شيء من قائمتكِ فوق الأفق في هذه اللحظة.<br>`
        + `أقرب ما يعود إليكِ <b>${TARGETS.find(t => t.id === soonest[0]).ar}</b>، `
        + `${howFar(soonest[1], now)} — الساعة <b class="n">${hhmm(soonest[1])}</b>.`
      : 'لا شيء من قائمتكِ فوق الأفق الآن، ولا خلال الأربعين يوماً القادمة من هذا المكان.';
    host.appendChild(e);
  }

  if (down.length) {
    head('تحت الأفق', '');
    for (const r of down) {
      const w = back[r.t.id];
      const txt = r.p.stale ? 'بلا اتصال'
        : w ? howFar(w, now)
        : 'لا تُرى من هنا';
      row(r, txt, 'down');
    }
  }
}
function toggleLog(on) {
  const el = $('log');
  const show = on === undefined ? !el.classList.contains('on') : on;
  if (show) buildLog();
  el.classList.toggle('on', show);
}
// the highest thing above her horizon that she has not found yet,
// falling back to the highest thing above her horizon at all
function aimAtSomethingUp() {
  const now = new Date();
  let best = -1, bestAlt = MIN_ALT, seen = -1, seenAlt = MIN_ALT;
  TARGETS.forEach((t, i) => {
    const p = locate(t, S.obs, now);
    if (p.stale || p.alt <= MIN_ALT) return;
    if (!S.found.has(t.id)) { if (p.alt > bestAlt) { bestAlt = p.alt; best = i; } }
    else if (p.alt > seenAlt) { seenAlt = p.alt; seen = i; }
  });
  const pick = best >= 0 ? best : seen;
  if (pick < 0) return false;
  selectTarget(pick);
  return true;
}

function selectTarget(i) {
  S.idx = i;
  const t = TARGETS[i];
  S.backAt = null;
  if (t.kind !== 'sat') {
    const now = new Date();
    if (locate(t, S.obs, now).alt <= MIN_ALT)
      S.backAt = nextObservable([t], S.obs, now)[t.id] || null;
  }
  S.locked = false; S.lockHold = 0;
  document.body.classList.remove('locked');
  $('found').classList.remove('on');
  refreshHud();
}

function refreshHud() {
  const t = TARGETS[S.idx];
  $('obV').textContent = t.ar;
  $('obK').textContent = t.lat;
  const track = $('track');
  track.innerHTML = '';
  TARGETS.forEach((tt, i) => {
    const b = document.createElement('b');
    if (S.found.has(tt.id)) b.className = 'lit';
    else if (i === S.idx) b.className = 'next';
    track.appendChild(b);
  });
  // said in Arabic rather than as "3 / 11", which bidi keeps turning around
  $('foundCount').textContent = `${arNum(S.found.size)} من ${arNum(TARGETS.length)}`;
}

// ---------------------------------------------------------------- the live link
//  The station's position is asked for over the network, so it is the one
//  thing here that can fail. It fails quietly.
async function pollISS() {
  try {
    const p = await issNow();
    S.issA = S.iss; S.iss = p;
    S.issErr = false;
    if ($('brief').classList.contains('on')) paintISS();
  } catch (_) {
    S.issErr = true;
    if ($('brief').classList.contains('on')) paintISS();
  }
  setTimeout(pollISS, S.iss ? 4000 : 20000);
}
// between two answers, carry it forward along its own track
function issAtNow(now) {
  const b = S.iss, a = S.issA;
  if (!b) return null;
  if (!a || b.at <= a.at) return b;
  const k = Math.min(3, (now - b.at) / (b.at - a.at));
  let dLon = b.lon - a.lon;
  if (dLon > 180) dLon -= 360; else if (dLon < -180) dLon += 360;
  let lon = b.lon + dLon * k;
  if (lon > 180) lon -= 360; else if (lon < -180) lon += 360;
  return { lat: b.lat + (b.lat - a.lat) * k, lon, alt: b.alt + (b.alt - a.alt) * k, at: now };
}
async function findPass() {
  try { S.issPass = await nextPass(S.lat, S.lon); } catch (_) { S.issPass = null; }
}

// ---------------------------------------------------------------- loading
//  The percentage is real: each step reports when it has actually landed,
//  and the last one only fires after a frame has been drawn.
const STEPS = [
  ['engine',    'أُجهّز المُحرّك…'],
  ['fonts',     'أستدعي الحروف…'],
  ['catalogue', 'أنزّل فهرس النجوم…'],
  ['scene',     'أبني القبّة…'],
  ['first',     'أفتح السقف…'],
];
// ---- الصفيحة: the plate is ruled here rather than written out by hand,
//      because a degree ring is 180 ticks and an ecliptic is a curve.
const ARC_R = 430, ARC_LEN = 2 * Math.PI * ARC_R;
function drawPlate() {
  const svg = $('plate');
  const C = 500;
  const ns = 'http://www.w3.org/2000/svg';
  const el = (n, a) => { const e = document.createElementNS(ns, n);
    for (const k in a) e.setAttribute(k, a[k]); return e; };
  const pol = (r, deg) => [C + r * Math.cos((deg - 90) * D2R), C + r * Math.sin((deg - 90) * D2R)];

  // the limb: four concentric rules, the way a plate is bounded
  for (const [r, cls] of [[478, 'rule'], [470, 'rule2'], [388, 'rule'], [300, 'rule']])
    svg.appendChild(el('circle', { cx: C, cy: C, r, class: cls }));

  // the degree ring, ticked every two degrees and numbered every thirty
  for (let a = 0; a < 360; a += 2) {
    const maj = a % 30 === 0, mid = a % 10 === 0;
    const len = maj ? 22 : mid ? 13 : 7;
    const [x1, y1] = pol(470, a), [x2, y2] = pol(470 - len, a);
    svg.appendChild(el('line', { x1, y1, x2, y2, class: 'tick' + (maj ? ' maj' : '') }));
    if (maj) {
      const [tx, ty] = pol(444, a);
      const t = el('text', { x: tx, y: ty, class: 'num' });
      t.textContent = a;
      svg.appendChild(t);
    }
  }

  // the ecliptic, drawn as the tilted circle it is
  svg.appendChild(el('ellipse', { cx: C, cy: C, rx: 300, ry: 300 * Math.cos(23.44 * D2R),
    class: 'rule2', transform: `rotate(-18 ${C} ${C})` }));

  // hour circles converging on the pole
  for (let h = 0; h < 12; h++) {
    const a = h * 30;
    const [x1, y1] = pol(300, a), [x2, y2] = pol(-300, a);
    svg.appendChild(el('line', { x1, y1, x2, y2, class: 'rule' }));
  }
  // and the almucantars: circles of equal altitude, offset for her latitude
  for (const r of [96, 176, 246]) {
    const c = el('circle', { cx: C, cy: C - 62, r, class: 'rule' });
    svg.appendChild(c);
  }
  // the horizon, low and heavy
  svg.appendChild(el('circle', { cx: C, cy: C - 62, r: 300, class: 'rule2' }));

  // the progress arc rides the outer limb
  const arc = el('circle', { cx: C, cy: C, r: ARC_R, class: 'arc',
    'stroke-dasharray': `0 ${ARC_LEN}` });
  arc.id = 'plateArc';
  svg.appendChild(arc);
}
drawPlate();

const done = new Set();
function step(id) {
  if (done.has(id)) return;
  done.add(id);
  const k = done.size / STEPS.length;
  $('bootPct').textContent = arNum(Math.round(k * 100)) + '٪';
  $('plateArc').setAttribute('stroke-dasharray', `${(k * ARC_LEN).toFixed(1)} ${ARC_LEN}`);
  const nextStep = STEPS.find(sp => !done.has(sp[0]));
  $('bootWhat').textContent = nextStep ? nextStep[1] : 'السماء جاهزة لكِ.';
  if (done.size === STEPS.length) $('bootGo').classList.add('ready');
}

// ---------------------------------------------------------------- the arrival
//  Wall-clock phases, so a slow phone gets the same fifteen seconds at
//  fewer frames rather than a different journey.
const PHASES = [
  { id: 'worm',  t: 3.6, k: 'Traversing',      v: 'ثقبٌ دودي' },
  { id: 'earth', t: 4.4, k: 'Earth',           v: 'الأرض' },
  { id: 'dive',  t: 3.2, k: 'Riyadh',          v: 'الرياض' },
  { id: 'yard',  t: 6.2, k: 'The Observatory', v: 'مِرصَدُكِ' },
];
let flyIdx = -1, flyStart = 0;
window.__FLY = () => ({ idx: flyIdx, id: PHASES[flyIdx] && PHASES[flyIdx].id,
                        t: (performance.now() - flyStart) / 1000 });
// hold the arrival at a chosen moment, so a frame can be judged rather than caught
window.__FLYSET = (id, frac) => {
  const i = PHASES.findIndex(p => p.id === id);
  if (i < 0) return false;
  if (i >= 3) { localGroup.visible = true; skyGroup.visible = true; }
  flight.visible = i < 3;
  flyIdx = i; flyStart = performance.now() - frac * PHASES[i].t * 1000;
  S.frozen = true;
  $('capK').textContent = PHASES[i].k; $('capV').textContent = PHASES[i].v;
  $('flight').classList.add('on');
  return true;
};

function enterPhase(i) {
  flyIdx = i; flyStart = performance.now();
  if (i >= PHASES.length) { flight.visible = false; arrive(); return; }
  const p = PHASES[i];
  $('capK').textContent = p.k;
  $('capV').textContent = p.v;
  $('flight').classList.add('on');
  if (p.id === 'yard') { localGroup.visible = true; skyGroup.visible = true; }
}

function flyFrame(now, time) {
  const p = PHASES[flyIdx];
  const el = (performance.now() - flyStart) / 1000;
  const k = THREE.MathUtils.clamp(el / p.t, 0, 1);
  const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

  if (p.id === 'worm') {
    worm.visible = true;
    grade.uniforms.uRush.value = 0.10 + Math.sin(k * Math.PI) * 0.22;
    bloom.strength = 0.30;
    worm.userData.mat.uniforms.uTime.value = time;
    worm.userData.mat.uniforms.uRes.value.set(innerWidth, innerHeight);
    camera.position.set(Math.sin(time * 0.9) * 0.5, FLY_Y + Math.cos(time * 0.75) * 0.5,
      210 - ease * 420);
    camera.lookAt(0, FLY_Y, camera.position.z - 60);
    camera.rotation.z = Math.sin(time * 0.55) * 0.2 + k * 0.45;
    camera.fov = 62 + Math.sin(k * Math.PI) * 32;
    camera.updateProjectionMatrix();
    const out = THREE.MathUtils.clamp((el - (p.t - 0.8)) / 0.8, 0, 1);
    worm.userData.mat.uniforms.uFade.value = 1 - out;

  } else if (p.id === 'earth') {
    worm.visible = false;
    bloom.strength = 0.62;
    grade.uniforms.uRush.value *= 0.90;
    // stop where the whole disc still fits a portrait phone's narrow field
    camera.position.set(0, FLY_Y, -160 - ease * 400);
    camera.lookAt(0, FLY_Y, -900);
    camera.rotation.z = (1 - ease) * 0.4;
    camera.fov = 58; camera.updateProjectionMatrix();
    earth.userData.uniforms.uTime.value = time;
    earth.userData.uniforms.uMarkOn.value = Math.min(1, ease * 1.6);
    earth.rotation.y = S.markY + (1 - ease) * 0.55;   // turning her side towards us

  } else if (p.id === 'dive') {
    camera.position.set(0, FLY_Y, -560 - ease * 235);
    camera.lookAt(0, FLY_Y, -900);
    camera.fov = 58 - ease * 22; camera.updateProjectionMatrix();
    earth.userData.uniforms.uTime.value = time;
    earth.userData.uniforms.uMarkOn.value = 1;
    earth.rotation.y = S.markY;
    if (k > 0.72) {   // the last moment: the limb swallows the frame
      document.body.style.setProperty('--flash', String((k - 0.72) / 0.28));
      $('flight').style.opacity = String(1 - (k - 0.72) / 0.28);
    }

  } else if (p.id === 'yard') {
    flight.visible = false;
    grade.uniforms.uRush.value = 0;
    $('flight').style.opacity = '';
    // she is standing there, the dome beside her. The camera holds on the dome,
    // then walks the last few metres and lifts its eyes to the sky.
    const hold = THREE.MathUtils.clamp((ease - 0.62) / 0.38, 0, 1);
    const lift = hold * hold * (3 - 2 * hold);
    // far enough back that the dome fits a portrait phone's narrow horizontal
    // field, which is about 21° at this focal length
    const from = new THREE.Vector3(4.4, 3.1, 5.6), to = new THREE.Vector3(0, 1.62, 0);
    camera.position.lerpVectors(from, to, ease);
    camera.fov = 42 + ease * 24; camera.updateProjectionMatrix();
    camera.up.set(0, 1, 0);
    const look = new THREE.Vector3(-5.4, 1.9, -9.6)
      .lerp(new THREE.Vector3(0.9, 5.2, -7.0), lift);
    camera.lookAt(look);
  }

  if (k >= 1 && !S.frozen) enterPhase(flyIdx + 1);
}

// the earth's marker follows wherever she actually turned out to be
function markHer() {
  const la = S.lat * D2R, lo = S.lon * D2R;
  const v = new THREE.Vector3(Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo));
  earth.userData.globe.material.uniforms.uMark.value.copy(v);
  S.markY = -lo;                 // turn that meridian to face the camera
  earth.rotation.y = S.markY;
}

// ---------------------------------------------------------------- start
async function begin() {
  if (S.started) return;
  S.started = true;

  // iOS only grants the motion sensors if we ask inside her tap, before
  // anything is awaited — so this comes first, and location follows.
  const motion = attachMotion();

  // refined, not guessed — see place.js
  const fix = await acquire(better => {          // a better fix may still arrive
    S.place = better; S.lat = better.lat; S.lon = better.lon;
    S.obs = new Astro.Observer(S.lat, S.lon, 600);
    if ($('brief').classList.contains('on')) showBrief();
  });
  S.place = fix;
  S.lat = fix.lat; S.lon = fix.lon;
  S.placed = fix.source !== 'default';
  S.obs = new Astro.Observer(S.lat, S.lon, 600);
  if (S.placed) $('bootCat').textContent =
    `${Math.abs(S.lat).toFixed(4)}°${S.lat >= 0 ? 'N' : 'S'} `
    + `${Math.abs(S.lon).toFixed(4)}°${S.lon >= 0 ? 'E' : 'W'}`;
  await motion.catch(() => {});
  // give the sensor a moment to say whether it is there at all
  await new Promise(r => setTimeout(r, 700));

  pollISS();
  findPass();
  markHer();
}

// she has landed: first the briefing, then she looks up
function arrive() {
  $('flight').classList.remove('on');
  $('skip').classList.remove('on');
  $('flight').style.opacity = '';
  camera.fov = 66; camera.position.set(0, 1.62, 0); camera.updateProjectionMatrix();
  camera.lookAt(new THREE.Vector3(Math.sin(S.yaw), Math.sin(S.pitch), -Math.cos(S.yaw))
    .add(camera.position));
  S.phase = 'sky';
  $('letter').classList.add('on');     // his words first; the sky can wait a moment
}

function enterSky() {
  $('brief').classList.remove('on');
  $('hud').classList.add('on');
  if (!aimAtSomethingUp()) refreshHud();

  const note = [];
  if (!S.placed) note.push('لم يصلني موقعكِ، فحسبتُ سماء الرياض. لو سمحتِ بالموقع سترين سماءكِ أنتِ بالضبط.');
  else if (S.place && S.place.accM > USABLE_M)
    note.push('موقعكِ وصلني تقريبياً فقط. اخرجي إلى مكانٍ مكشوف لحظة وسيضبط نفسه.');
  if (!S.useMotion) note.push('جوالكِ لا يعطيني اتجاهه، فاسحبي بإصبعكِ لتلفّي في السماء.');
  else setTimeout(() => {
    if (S.hasNorth) return;
    $('note').textContent = 'جوالكِ لا يعطيني بوصلته، فالجهات قد تكون مُدارة. وجّهيه نحو الشمال والمسي هنا لأضبطها.';
    $('note').classList.add('on');
    $('note').style.pointerEvents = 'auto';
    $('note').onclick = () => {                 // she is facing north: so this is north
      const f = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      S.northOff = -Math.atan2(f.x, -f.z);
      S.hasNorth = true;
      $('note').textContent = 'ضُبِطَت. الشمال أمامكِ الآن.';
      setTimeout(() => $('note').classList.remove('on'), 3000);
    };
  }, 4000);
  if (note.length) {
    $('note').textContent = note.join(' ');
    $('note').classList.add('on');
    setTimeout(() => $('note').classList.remove('on'), 13000);
  }
}

// a number, a degree sign or a clock time must not be re-ordered by the
// surrounding right-to-left text
const num = v => `<b class="n">${v}</b>`;

// ---------------------------------------------------------------- the briefing
//  Written fresh every time it opens, from her coordinates and her clock.
function showBrief() {
  const now = new Date();
  const st = sky(S.obs, now);
  const ml = moonLine(now);
  const c = census(S.obs, now);
  const next = upcoming(S.obs, now, c.down);
  // read once per visit, so reopening the briefing does not erase the answer
  if (S.back === undefined) S.back = sinceLast(S.obs, now);
  const back = S.back;

  const pl = S.place || { source: 'default' };
  $('bWhere').innerHTML = S.placed
    ? `موقعكِ ${num(arNum(Math.abs(S.lat).toFixed(3)) + '°')}${S.lat >= 0 ? ' شمالاً' : ' جنوباً'}`
      + ` و${num(arNum(Math.abs(S.lon).toFixed(3)) + '°')}${S.lon >= 0 ? ' شرقاً' : ' غرباً'}`
      + ` <span class="soft">(${placeName(pl)})</span>،`
      + ` والساعة عندكِ ${num(hhmm(now))}.`
    : `لم يصلني موقعكِ، فحسبتُ لكِ سماء <b>الرياض</b>، والساعة ${num(hhmm(now))}.`;
  $('bSky').innerHTML = `<b>${st.name}</b><br>${st.note}`;

  const rows = [];
  rows.push(`القمر الليلة <b>${ml.name}</b>، ووجهه المضيء ${num(arNum(ml.pct) + '٪')}.`);
  if (c.up.length) {
    const names = c.up.slice(0, 4).map(u =>
      `<b>${u.t.ar}</b> على ارتفاع ${num(arNum(Math.round(u.alt)) + '°')} في ${dirName(u.az)}`);
    rows.push(`فوق أفقكِ الآن <b>${arNum(c.up.length)}</b> من الأهداف: ` + names.join('، ')
      + (c.up.length > 4 ? '، وغيرها.' : '.'));
  } else {
    rows.push('لا شيء من أهدافكِ فوق الأفق في هذه الدقيقة — كلها تحتك، والأرض تدور بها نحوكِ.');
  }
  if (next.length)
    rows.push('وما زال ينتظر دورَه: ' + next.map(n => `<b>${n.t.ar}</b> يشرق ${num(hhmm(n.when))}`).join('، ') + '.');
  $('bList').innerHTML = rows.map(r => `<p>${r}</p>`).join('');

  $('bBack').innerHTML = back
    ? `آخر مرة وقفتِ هنا كانت ${num(hhmm(back.last))}. منذ تلك اللحظة دارت سماؤكِ `
      + `${num(arNum(Math.round(back.deg)))} درجة`
      + (back.risen.length ? `، وشرق من وقتها <b>${back.risen.join('</b> و<b>')}</b>.` : '.')
    : '';
  $('bBack').style.display = back ? '' : 'none';

  paintISS();
  $('brief').classList.add('on');
}

function paintISS() {
  const el = $('bIss');
  if (!el) return;
  if (S.issErr && !S.iss) {
    el.innerHTML = 'لم أتمكّن من الوصول إلى المحطة الآن — سأظل أحاول وأنتِ ترصدين.';
    return;
  }
  if (!S.iss) { el.innerHTML = 'أسأل عن محطة الفضاء الدولية…'; return; }
  LIVE.iss = issAtNow(Date.now());
  const a = locate(TARGETS.find(t => t.id === 'iss'), S.obs, new Date());
  if (a.stale) { el.innerHTML = 'أسأل عن محطة الفضاء الدولية…'; return; }
  const km = Math.round(a.km);
  let line = `محطة الفضاء الدولية تبعد عنكِ الآن ${num(arNum(km.toLocaleString('en-US')))} كيلومتراً`;
  if (a.alt > 0) line += `، وهي <b>فوق أفقكِ</b> في ${dirName(a.az)} على ارتفاع ${num(arNum(Math.round(a.alt)) + '°')} — ارفعي رأسكِ الآن.`;
  else if (S.issPass && S.issPass.visible && S.issPass.rise)
    line += `. تمرّ فوقكِ ${num(hhmm(new Date(S.issPass.rise)))} وترتفع إلى ${num(arNum(Math.round(S.issPass.peak.alt)) + '°')}.`;
  else line += `، وتدور حول الأرض كل ٩٣ دقيقة، فانتظريها.`;
  el.innerHTML = line;
}

$('beginBtn').addEventListener('click', () => {
  if (S.started) return;
  begin();                                  // permissions and location, in the background
  localGroup.visible = false; skyGroup.visible = false;
  flight.visible = true;
  // the plate loses its light first, and the sky opens underneath it
  document.body.classList.add('opening');
  setTimeout(() => {
    enterPhase(0);
    $('skip').classList.add('on');
    $('boot').classList.add('gone');
  }, REDUCED ? 200 : 900);
});
$('skip').addEventListener('click', () => {
  if (flyIdx < 0 || flyIdx >= PHASES.length) return;
  flight.visible = false;
  localGroup.visible = true; skyGroup.visible = true;
  $('flight').style.opacity = '';
  enterPhase(PHASES.length);
});
$('briefGo').addEventListener('click', () => {
  if ($('hud').classList.contains('on')) $('brief').classList.remove('on');
  else enterSky();
});
$('letterGo').addEventListener('click', () => {
  $('letter').classList.remove('on');
  setTimeout(showBrief, 450);
});
$('briefBtn').addEventListener('click', showBrief);
// the "show me what is up" way out of a target that is under the ground
$('prompt').addEventListener('click', e => {
  if (e.target && e.target.id === 'jump') { if (!aimAtSomethingUp()) toggleLog(true); }
});
// while she is reading it, it keeps rewriting itself — the sky is moving
setInterval(() => { if ($('brief').classList.contains('on')) showBrief(); }, 20000);
$('logBtn').addEventListener('click', () => toggleLog());
$('logClose').addEventListener('click', () => toggleLog(false));
$('nextBtn').addEventListener('click', () => {
  const now = new Date();
  // the next thing she has not found *and* can actually see
  for (let k = 1; k <= TARGETS.length; k++) {
    const i = (S.idx + k) % TARGETS.length;
    const t = TARGETS[i];
    if (S.found.has(t.id)) continue;
    const p = locate(t, S.obs, now);
    if (!p.stale && p.alt > MIN_ALT) { selectTarget(i); return; }
  }
  // nothing left overhead — take her to whatever is still unfound, and the
  // prompt will tell her when it rises
  for (let k = 1; k <= TARGETS.length; k++) {
    const i = (S.idx + k) % TARGETS.length;
    if (!S.found.has(TARGETS[i].id)) { selectTarget(i); return; }
  }
  selectTarget((S.idx + 1) % TARGETS.length);
});

// ---------------------------------------------------------------- journey counter
const DEPART = new Date('2005-04-07T05:02:05Z');
function tripText(now) {
  let ms = now - DEPART;
  const yr = 365.25636 * 86400000;
  const y = Math.floor(ms / yr); ms -= y * yr;
  const d = Math.floor(ms / 86400000); ms -= d * 86400000;
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const mi = Math.floor(ms / 60000); ms -= mi * 60000;
  const se = Math.floor(ms / 1000);
  const p = n => arNum(String(n).padStart(2, '0'));
  return `${arNum(y)} سنة و${arNum(d)} يوماً و`
       + `<b class="n">${p(h)}:${p(mi)}:${p(se)}.${arNum(Math.floor((ms % 1000) / 100))}</b>`;
}

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  const now = new Date();

  grade.uniforms.uTime.value = time;

  if (flyIdx >= 0 && flyIdx < PHASES.length) {
    flyFrame(now, time);
    if (starMat) starMat.uniforms.uTime.value = time;
    composer.render();
    return;
  }
  if (!S.ready || !S.obs) { composer.render(); step('first'); return; }

  starMat.uniforms.uTime.value = time;
  LIVE.iss = issAtNow(+now);

  // turn the celestial sphere onto her horizon
  const lst = (gmst(now) + S.lon) * D2R;
  skyGroup.quaternion
    .setFromAxisAngle(new THREE.Vector3(1, 0, 0), (90 - S.lat) * D2R)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -lst));

  // ---- camera
  if (S.useMotion) {
    if (S.hasMq) camera.quaternion.slerp(S.mq, 1 - Math.exp(-dt * 12));
    // if the sensor falls silent, hand the view back to her finger
    if (performance.now() - S.lastMotion > 2500) { S.useMotion = false; S.heading = null; }
  }
  if (!S.useMotion) {
    S.yaw += S.yawV; S.pitch += S.pitchV;
    S.yawV *= Math.exp(-dt * 4.5); S.pitchV *= Math.exp(-dt * 4.5);
    S.pitch = THREE.MathUtils.clamp(S.pitch, -0.42, 1.45);
    camera.lookAt(new THREE.Vector3(
      Math.sin(S.yaw) * Math.cos(S.pitch), Math.sin(S.pitch), -Math.cos(S.yaw) * Math.cos(S.pitch))
      .add(camera.position));
  }
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const lookAlt = Math.asin(THREE.MathUtils.clamp(fwd.y, -1, 1)) * R2D;
  const camAz = ((Math.atan2(fwd.x, -fwd.z) * R2D) % 360 + 360) % 360;

  // ---- align the world with true north
  //  An object at true azimuth A is drawn at scene azimuth A - world.rotation.y,
  //  so setting that to (heading - camAz) puts what the phone says it is looking
  //  at exactly under the reticle. Without a compass the offset stays zero and
  //  the scene is at least self-consistent.
  if (S.heading != null) {
    let want = (S.heading - camAz) * D2R;
    let d = want - S.northOff;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    S.northOff += d * (1 - Math.exp(-dt * 2.2));      // ease, so it never snaps
    S.hasNorth = true;
  }
  world.rotation.y = S.northOff;
  const lookAz = ((camAz + S.northOff * R2D) % 360 + 360) % 360;   // where she is truly looking
  updateBand(lookAz);

  // ---- place every target where it truly is, and light the chosen one
  const active = TARGETS[S.idx];
  let sep = 999, aAlt = 0, aAz = 0, aDist = 0;
  const look = dirFromAzAlt(lookAz, lookAlt);

  for (const m of marks) {
    const p = locate(m.t, S.obs, now);
    const dir = dirFromAzAlt(p.az, p.alt);
    m.g.position.copy(dir).multiplyScalar(R * 0.96);
    m.ring.position.copy(dir).multiplyScalar(R * 0.95);
    m.ring.lookAt(0, 0, 0);
    const isActive = m.t === active;
    if (isActive) { aAlt = p.alt; aAz = p.az; aDist = p.distAu; sep = Math.acos(
      THREE.MathUtils.clamp(dir.dot(look), -1, 1)) * R2D; }
    const near = isActive ? THREE.MathUtils.clamp(1 - sep / 60, 0, 1) : 0;
    const seen = S.found.has(m.t.id);
    m.halo.material.opacity = isActive ? 0.40 + near * 0.55 : (seen ? 0.16 : 0.0);
    m.core.material.opacity = isActive ? 0.85 : (seen ? 0.30 : 0.0);
    m.halo.scale.setScalar((isActive ? 40 + Math.pow(near, 2) * 44 : 26) + Math.sin(time * 1.7) * 4);
    m.core.scale.setScalar(isActive ? 13 + Math.pow(near, 2) * 9 : 9);
    m.ring.material.opacity = isActive ? Math.pow(near, 2.2) * 0.7 : 0;
    if (m.t.kind === 'moon') { m.halo.material.opacity *= 0.5; m.core.material.opacity = 0; }
  }

  // the Moon itself
  {
    const p = locate(TARGETS.find(t => t.id === 'moon'), S.obs, now);
    const mi = moonInfo(now);
    moonMesh.visible = p.alt > -4;
    moonMesh.position.copy(dirFromAzAlt(p.az, p.alt)).multiplyScalar(R * 0.9);
    moonMesh.lookAt(0, 0, 0);
    moonMesh.material.uniforms.uPhase.value = mi.phaseAngle * D2R;
  }

  // ---- the guiding arrow
  const ar = $('arrow');
  const tdir = dirFromAzAlt(aAz, aAlt);
  const pv = tdir.clone().multiplyScalar(R * 0.96).project(camera);
  const onScreen = pv.z < 1 && Math.abs(pv.x) < 0.7 && Math.abs(pv.y) < 0.66;
  // it is under the ground: there is nothing to turn towards, and an arrow
  // pointing at her feet is worse than no arrow at all
  if (!onScreen && !S.locked && aAlt > MIN_ALT) {
    const dc = tdir.clone().applyQuaternion(camera.quaternion.clone().invert());
    const a = Math.atan2(dc.y, dc.x);
    const rad = Math.min(innerWidth, innerHeight) * 0.30;
    ar.classList.add('on');
    ar.style.transform = `translate(${(innerWidth/2 + Math.cos(a)*rad)|0}px, ${(innerHeight/2 - Math.sin(a)*rad)|0}px)`
      + ` translate(-50%,-50%) rotate(${-a}rad)`;
  } else ar.classList.remove('on');

  // ---- holding the aim is what counts as finding it
  const LOCK = 7;
  if (!S.locked && sep < LOCK && aAlt > MIN_ALT) {
    S.lockHold += dt;
    if (S.lockHold > 1.1) {
      S.locked = true;
      S.found.add(active.id);
      document.body.classList.add('locked');
      if (navigator.vibrate) navigator.vibrate([30, 60, 30, 60, 120]);
      showFound(active, aDist, now);
      refreshHud();
    }
  } else if (!S.locked) S.lockHold = Math.max(0, S.lockHold - dt * 2);
  $('ret').style.setProperty('--hold', Math.min(1, S.lockHold / 1.1));

  // ---- what to say
  const pr = $('prompt');
  if (S.locked) pr.classList.remove('on');
  else if (aAlt < MIN_ALT) {
    pr.classList.add('on');
    if (active.kind === 'sat') {
      pr.innerHTML = !LIVE.iss ? 'أسأل عن المحطة…'
        : (S.issPass && S.issPass.visible && S.issPass.rise)
          ? `المحطة خلف الأفق · تمرّ فوقكِ <em>${hhmm(new Date(S.issPass.rise))}</em>`
          : 'المحطة خلف الأفق الآن · تدور حول الأرض كل ٩٣ دقيقة';
    } else {
      const w = S.backAt;   // the same figure the list gives her, never a second opinion
      pr.innerHTML = (w ? `${active.ar} ليست في سمائكِ الآن · تعود <em>${howFar(w, now)}</em>`
                        : `${active.ar} ليست في سمائكِ الآن`)
        + `<br><u id="jump">اعرضي ما فوقكِ الآن</u>`;
    }
  } else {
    pr.classList.add('on');
    pr.innerHTML = sep > 55 ? 'لُفّي بجسمكِ… <em>اتبعي السهم</em>'
      : sep > 22 ? 'اقتربتِ…'
      : sep > LOCK ? 'قريبةٌ جداً… ارفعي أو اخفضي قليلاً'
      : '<em>ثبّتي يدكِ…</em>';
  }

  // ---- readouts
  $('readL').innerHTML = `ALT <b>${aAlt.toFixed(1)}°</b><br>AZ <b>${aAz.toFixed(1)}°</b><br>SEP <b>${sep > 180 ? '—' : sep.toFixed(1) + '°'}</b>`;
  $('readR').innerHTML =
    `${S.lat.toFixed(3)}°${S.lat >= 0 ? 'N' : 'S'} ${Math.abs(S.lon).toFixed(3)}°${S.lon >= 0 ? 'E' : 'W'}`
    + `<br>LST <b>${(((gmst(now) + S.lon) % 360 + 360) % 360 / 15).toFixed(2)}h</b>`
    + `<br>${active.lat}`;
  $('tripV').innerHTML = tripText(now);

  // mark which row she is currently aimed at
  if ($('log').classList.contains('on'))
    for (const r of $('logList').querySelectorAll('.logRow'))
      r.classList.toggle('cur', +r.dataset.i === S.idx);

  composer.render();
}

// ---------------------------------------------------------------- the card
function showFound(t, distAu, now) {
  $('fName').textContent = t.ar;
  $('fLat').textContent = t.lat;
  let facts = t.facts;
  const km = distAu * 149597870.7;
  const dNum = t.kind === 'sat' ? Math.round(LIVE.iss ? LIVE.iss.alt : 420)  // its height overhead
             : t.id === 'moon'  ? Math.round(km / 1000)                      // thousands of km
             : Math.round(km / 1e6);                                         // millions of km
  facts = facts.replace('<b class="d"></b>', `<b>${arNum(dNum)}</b>`);
  facts = facts.replace('<b class="p"></b>', `<b>${arNum(Math.round(moonInfo(now).frac * 100))}</b>`);
  facts = facts.replace('<b class="lt"></b>', `<b>${arNum(Math.round(km / 299792.458 / 60))}</b>`);
  $('fFacts').innerHTML = facts;
  $('fLine').innerHTML = t.line;
  $('fTrip').style.display = t.prime ? '' : 'none';
  setTimeout(() => $('found').classList.add('on'), 700);
}

// ---------------------------------------------------------------- go
step('engine');
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => step('fonts'));
else step('fonts');
setTimeout(() => step('fonts'), 4000);      // never let a slow CDN hold the door shut

fetch('./livesky.json').then(r => r.json()).then(d => {
  step('catalogue');
  buildSky(d);
  buildMarks();
  buildMoon();
  buildBand();
  step('scene');
  S.ready = true;
}).catch(() => {
  $('bootWhat').textContent = 'تعذّر تحميل فهرس النجوم. جرّبي تحديث الصفحة.';
});

frame();
