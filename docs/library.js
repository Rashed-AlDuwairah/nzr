// ============================================================
//  مكتبةُ نورة — the last room
//
//  She reads. So the last thing is a room she can walk around in, with
//  fourteen books on the shelves, each spine a line out of a song, each
//  book a page he wrote. When the last one is closed, the room says so.
//
//  Movement is by standing places rather than a joystick: tap where you
//  want to be and the camera walks there. Look with a finger. Tap a
//  spine to pull it out. That is the whole control scheme, and it works
//  the same on a phone as on a desk.
// ============================================================
import * as THREE from 'three';
import { EffectComposer } from './vendor/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/postprocessing/RenderPass.js';
import { ShaderPass } from './vendor/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from './vendor/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from './vendor/extras/RoomEnvironment.js';
import { buildRoom, buildShelves, buildDesk, buildWindow, buildChair, buildBook } from './room.js';
import { BOOKS, FINALE } from './books.js';

const $ = id => document.getElementById(id);
const AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const arNum = n => String(n).split('').map(c => (c >= '0' && c <= '9') ? AR[+c] : c).join('');
const D2R = Math.PI / 180;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------- state
const S = {
  read: new Set(),
  yaw: 0, pitch: -0.02, yawT: 0, pitchT: -0.02,
  at: 0, walking: null,
  open: null, busy: false, ready: false, started: false,
};
window.__LIB = S;
window.__BOOKS = () => bookNodes.map(n => ({ id: n.userData.book.id, pos: n.position.toArray() }));
window.__CAMPOS = () => camera.position.toArray();
window.__SCREEN = arr => {
  const v = new THREE.Vector3(...arr).project(camera);
  return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight, v.z];
};

// ---------------------------------------------------------------- three
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.05, 60);
camera.position.set(0, 1.58, 1.6);

// Image-based lighting. Without it every material here is plastic: brass
// needs something to reflect before it reads as metal at all.
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
  scene.environmentIntensity = 0.28;      // a lit room, but a dim one
}

// ---------------------------------------------------------------- the room
const room = buildRoom();
scene.add(room);
const { W: RW, D: RD } = room.userData;

const shelves = buildShelves(room, 3);
shelves.position.set(0, 0, -RD / 2 + 0.17);
scene.add(shelves);

const desk = buildDesk(room);
desk.position.set(0, 0, RD / 2 - 1.15);
desk.rotation.y = Math.PI;
scene.add(desk);

const win = buildWindow(room);
win.position.set(0, 1.62, RD / 2 - 0.02);
win.rotation.y = Math.PI;
scene.add(win);

const chair = buildChair(room);
chair.position.set(1.55, 0, 0.35);
chair.rotation.y = -0.6;
scene.add(chair);

// ---------------------------------------------------------------- light
//  One lamp does the work. Everything else is bounce and the window.
const lamp = new THREE.PointLight(0xffc186, 3.4, 4.6, 2.2);
lamp.position.copy(desk.userData.bulbPos).applyMatrix4(desk.matrixWorld);
lamp.position.set(0.52, 1.07, RD / 2 - 1.03);
lamp.castShadow = true;
lamp.shadow.mapSize.set(1024, 1024);
lamp.shadow.bias = -0.004;
lamp.shadow.radius = 3;
scene.add(lamp);

// a second, dimmer source above the shelves so the spines are readable
const shelfLight = new THREE.SpotLight(0xffdcae, 13.0, 8.5, 1.02, 0.85, 1.4);
shelfLight.position.set(0, 2.42, -0.35);
shelfLight.target.position.set(0, 1.15, -RD / 2 + 0.2);
shelfLight.castShadow = true;
shelfLight.shadow.mapSize.set(1024, 1024);
shelfLight.shadow.bias = -0.004;
scene.add(shelfLight, shelfLight.target);

// the window's own cold spill
const moon = new THREE.DirectionalLight(0x9fb6e8, 0.5);
moon.position.set(0.6, 2.4, RD / 2 + 1);
moon.target.position.set(0, 0.6, 0);
scene.add(moon, moon.target);

scene.add(new THREE.AmbientLight(0x2e2a24, 1.05));
// a soft fill from the room side so the spines are not pure silhouette
const fill = new THREE.PointLight(0xffc07a, 4.0, 8.0, 1.9);
fill.position.set(0, 2.0, 0.1);
scene.add(fill);

// ---------------------------------------------------------------- the books
//  A shelf holds thirty-odd volumes, not eight. Hers are scattered among
//  them: richer leather, a gilt title, and the rest plain. Finding one is
//  meant to take a moment — that is the game — but never a hunt, because
//  the title under the reticle names whatever she is looking at.
const bookNodes = [];
{
  const slots = shelves.userData.slots;
  const mine = [...BOOKS];
  // deal hers round the shelves so every shelf is worth searching
  const perSlot = slots.map(() => []);
  mine.forEach((b, i) => perSlot[(i * 5 + 1) % slots.length].push(b));

  slots.forEach((slot, si) => {
    const inner = slot.caseW - 0.12;
    let x = slot.x0 - inner / 2 + 0.012;
    const queue = [...perSlot[si]];
    // hers are spaced through the row rather than dropped in together
    const gapsBetweenMine = queue.length ? Math.floor(26 / (queue.length + 1)) : 99;
    let sinceMine = Math.floor(Math.random() * 3) + 1;
    let n = 0, plainIdx = si;

    while (x < slot.x0 + inner / 2 - 0.03) {
      let real = null;
      if (queue.length && sinceMine >= gapsBetweenMine) { real = queue.shift(); sinceMine = 0; }
      else sinceMine++;

      const w = real ? 0.040 + Math.random() * 0.016 : 0.024 + Math.random() * 0.026;
      if (x + w > slot.x0 + inner / 2) break;
      const h = real ? 0.215 + 0.055 * (real.tall || 1)
                     : 0.185 + Math.random() * 0.075;
      const node = buildBook(real || { title: '', hue: 0 }, h, w,
                             real ? null : ((plainIdx = (plainIdx * 7 + 3) % 10)));
      node.position.set(x + w / 2, slot.y + h / 2, shelves.position.z + 0.055);
      node.rotation.z = (Math.random() - 0.5) * 0.016;
      node.userData.home = node.position.clone();
      node.userData.homeRot = node.rotation.clone();
      scene.add(node);
      if (real) bookNodes.push(node);
      x += w + 0.0022;
      n++;
      // an occasional gap, the way a shelf in use actually looks
      if (!real && Math.random() < 0.05) x += 0.012 + Math.random() * 0.02;
    }
    // anything of hers that did not fit goes at the end of the row
    while (queue.length) {
      const real = queue.shift();
      const w = 0.046, h = 0.215 + 0.055 * (real.tall || 1);
      const node = buildBook(real, h, w, null);
      node.position.set(slot.x0 + inner / 2 - w / 2 - 0.01, slot.y + h / 2,
        shelves.position.z + 0.055);
      node.userData.home = node.position.clone();
      node.userData.homeRot = node.rotation.clone();
      scene.add(node);
      bookNodes.push(node);
    }
  });
}

// ---------------------------------------------------------------- standing places
//  Three in front of the shelves, one at the desk, one at the window.
const SPOTS = [
  { p: new THREE.Vector3(-1.62, 1.56, -1.02), look: new THREE.Vector3(-1.66, 1.30, -RD / 2), ar: 'الرفّ الأيسر' },
  { p: new THREE.Vector3( 0.00, 1.56, -1.02), look: new THREE.Vector3( 0.00, 1.30, -RD / 2), ar: 'الرفّ الأوسط' },
  { p: new THREE.Vector3( 1.62, 1.56, -1.02), look: new THREE.Vector3( 1.66, 1.30, -RD / 2), ar: 'الرفّ الأيمن' },
  // stood back far enough to see the whole desk, and looking down at it
  // rather than at the wall a hand's width behind it
  { p: new THREE.Vector3( 0.00, 1.46, 0.62), look: new THREE.Vector3(0.00, 0.98, RD / 2 - 1.12), ar: 'المكتب' },
  { p: new THREE.Vector3( 0.00, 1.54, 1.02), look: new THREE.Vector3(0.00, 1.48, RD / 2), ar: 'النافذة' },
];

function faceTowards(target, from) {
  const d = target.clone().sub(from);
  return { yaw: Math.atan2(d.x, -d.z), pitch: Math.asin(THREE.MathUtils.clamp(d.clone().normalize().y, -1, 1)) };
}

function walkTo(i, instant) {
  if (S.busy || i === S.at) return;
  const spot = SPOTS[i];
  const aim = faceTowards(spot.look, spot.p);
  if (instant || REDUCED) {
    camera.position.copy(spot.p);
    S.yaw = S.yawT = aim.yaw; S.pitch = S.pitchT = aim.pitch;
    S.at = i; paintSpots(); return;
  }
  S.walking = { from: camera.position.clone(), to: spot.p.clone(), t: 0,
                dur: 0.55 + camera.position.distanceTo(spot.p) * 0.30 };
  S.yawT = aim.yaw; S.pitchT = aim.pitch;
  S.at = i;
  paintSpots();
}

function paintSpots() {
  const host = $('spots');
  host.innerHTML = '';
  SPOTS.forEach((sp, i) => {
    const b = document.createElement('button');
    b.className = 'spot' + (i === S.at ? ' on' : '');
    b.textContent = sp.ar;
    b.addEventListener('click', () => walkTo(i));
    host.appendChild(b);
  });
}

// ---------------------------------------------------------------- looking
{
  let down = false, px = 0, py = 0, moved = 0, id = null;
  const start = e => {
    if (S.open || e.target.closest('.ui')) return;
    down = true; id = e.pointerId; px = e.clientX; py = e.clientY; moved = 0;
  };
  const move = e => {
    if (!down || e.pointerId !== id) return;
    const dx = e.clientX - px, dy = e.clientY - py;
    moved += Math.abs(dx) + Math.abs(dy);
    S.yawT -= dx * 0.0032;
    S.pitchT = THREE.MathUtils.clamp(S.pitchT - dy * 0.0028, -0.62, 0.52);
    px = e.clientX; py = e.clientY;
  };
  const end = e => {
    if (!down || e.pointerId !== id) return;
    down = false;
    if (moved < 8) pick(e.clientX, e.clientY);      // a tap, not a drag
  };
  addEventListener('pointerdown', start);
  addEventListener('pointermove', move);
  addEventListener('pointerup', end);
  addEventListener('pointercancel', () => { down = false; });
}

// ---------------------------------------------------------------- picking
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(cx, cy) {
  if (S.open || S.busy) return;
  ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(bookNodes.map(n => n.userData.body), false);
  if (!hits.length) return;
  const node = bookNodes.find(n => n.userData.body === hits[0].object);
  if (node) openBook(node);
}

// ---------------------------------------------------------------- reading
function openBook(node) {
  const b = node.userData.book;
  S.open = node; S.busy = true;
  node.userData.pull = 0;

  $('bkTitle').textContent = b.title;
  $('bkText').innerHTML = b.text;
  $('book').classList.add('on');

  if (navigator.vibrate) navigator.vibrate(16);
  if (!S.read.has(b.id)) {
    S.read.add(b.id);
    save();
    paintCount(true);
  }
  setTimeout(() => { S.busy = false; }, 400);
}

function closeBook() {
  $('book').classList.remove('on');
  S.open = null;
  if (S.read.size === BOOKS.length && !$('end').classList.contains('on'))
    setTimeout(finish, 900);
}

function paintCount(pop) {
  $('count').textContent = `${arNum(S.read.size)} من ${arNum(BOOKS.length)}`;
  const t = $('track');
  t.innerHTML = '';
  for (const b of BOOKS) {
    const i = document.createElement('i');
    if (S.read.has(b.id)) i.className = 'lit';
    t.appendChild(i);
  }
  if (pop) { const c = $('tally'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
}

function save() {
  try { localStorage.setItem('noor_lib', JSON.stringify([...S.read])); } catch (_) {}
}
function load() {
  try {
    const v = JSON.parse(localStorage.getItem('noor_lib') || '[]');
    if (Array.isArray(v)) for (const id of v) if (BOOKS.some(b => b.id === id)) S.read.add(id);
  } catch (_) {}
}

// ---------------------------------------------------------------- the ending
function finish() {
  $('endT').textContent = FINALE.title;
  $('endB').innerHTML = FINALE.body;
  $('endS').textContent = FINALE.sign;
  $('end').classList.add('on');
  document.body.classList.add('ending');
  S.ending = performance.now();
}

// ---------------------------------------------------------------- the grade
const _sz = renderer.getDrawingBufferSize(new THREE.Vector2());
const composer = new EffectComposer(renderer,
  new THREE.WebGLRenderTarget(_sz.width, _sz.height, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.7, 0.92);
composer.addPass(bloom);
const Grade = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.62 },
              uGrain: { value: 0.022 }, uWarm: { value: 0 } },
  vertexShader: `varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain, uWarm;
    varying vec2 vUv;
    float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
    void main(){
      vec2 toC = vUv - 0.5;
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      col = mix(col, col * vec3(1.10, 0.99, 0.86) + vec3(0.02, 0.008, 0.0), uWarm);
      col *= 1.0 - smoothstep(0.30, 1.10, length(toC)) * uVig;
      float g = ign(gl_FragCoord.xy + fract(uTime) * 137.0) - 0.5;
      col += g * uGrain * (0.4 + 0.6 * (1.0 - dot(col, vec3(0.333))));
      float d = ign(gl_FragCoord.xy + 11.0);
      float tri = d < 0.5 ? sqrt(2.0 * d) - 1.0 : 1.0 - sqrt(2.0 - 2.0 * d);
      col += tri / 255.0;
      gl_FragColor = vec4(col, 1.0);
    }`
};
const grade = new ShaderPass(Grade);
composer.addPass(grade);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
});

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
const hoverV = new THREE.Vector3();

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  grade.uniforms.uTime.value = time;
  win.userData.night.material.uniforms.uTime.value = time;

  // walking
  if (S.walking) {
    S.walking.t += dt / S.walking.dur;
    const k = THREE.MathUtils.clamp(S.walking.t, 0, 1);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(S.walking.from, S.walking.to, e);
    camera.position.y += Math.sin(k * Math.PI * 3) * 0.012;   // a little gait
    if (k >= 1) S.walking = null;
  }

  // looking, always eased
  S.yaw += (S.yawT - S.yaw) * (1 - Math.exp(-dt * 9));
  S.pitch += (S.pitchT - S.pitch) * (1 - Math.exp(-dt * 9));
  camera.rotation.set(0, 0, 0);
  camera.rotateY(S.yaw);
  camera.rotateX(S.pitch);

  // the book she is looking at leans out of the shelf
  let near = null, nearD = 1e9;
  if (!S.open) {
    ndc.set(0, 0);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(bookNodes.map(n => n.userData.body), false);
    if (hits.length && hits[0].distance < 3.4) {
      near = bookNodes.find(n => n.userData.body === hits[0].object);
      nearD = hits[0].distance;
    }
  }
  for (const n of bookNodes) {
    const want = (n === near || n === S.open) ? 1 : 0;
    n.userData.pull = (n.userData.pull || 0) + (want - (n.userData.pull || 0)) * (1 - Math.exp(-dt * 8));
    const p = n.userData.pull;
    n.position.z = n.userData.home.z + p * 0.075;
    n.position.y = n.userData.home.y + p * 0.012;
    n.rotation.x = n.userData.homeRot.x - p * 0.10;
  }
  $('cursor').classList.toggle('on', !!near && !S.open);
  if (near) $('cursor').textContent = near.userData.book.title;

  // the ending warms the room and closes the lamp down
  if (S.ending) {
    const k = THREE.MathUtils.clamp((performance.now() - S.ending) / 4200, 0, 1);
    grade.uniforms.uWarm.value = k;
    lamp.intensity = 3.4 * (1 - k * 0.55);
    shelfLight.intensity = 13.0 * (1 - k * 0.8);
    moon.intensity = 0.5 + k * 0.9;
    scene.environmentIntensity = 0.28 * (1 - k * 0.5);
  }

  composer.render();
  if (!S.ready) { S.ready = true; $('boot').classList.add('gone'); }
}

// ---------------------------------------------------------------- go
load();
paintCount(false);
paintSpots();
walkTo(1, true);
$('bkClose').addEventListener('click', closeBook);
$('endClose').addEventListener('click', () => $('end').classList.remove('on'));
addEventListener('keydown', e => {
  if (e.key === 'Escape' && S.open) closeBook();
  if (e.key >= '1' && e.key <= '5') walkTo(+e.key - 1);
});
frame();
