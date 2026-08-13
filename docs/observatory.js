// ============================================================
//  مِرصَد نورة — a real instrument pointed at a real sky
//
//  Ten objects, each located from her clock and her coordinates by
//  a full ephemeris: her birth-year star, the Moon in its true phase,
//  four planets, three fixed stars and a galaxy, and the radiant that
//  rains on her birthday. She stands under it while she looks.
// ============================================================
import * as THREE from 'three';
import { buildNoura, buildRiyadh } from './world.js';
import { TARGETS, LIVE, locate, nextRise, moonInfo, Astro } from './targets.js';
import { issNow, nextPass } from './iss.js';
import { sky, census, upcoming, moonLine, clock as hhmm, dirName, sinceLast } from './brief.js';

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
  obs: null,
  mq: new THREE.Quaternion(), hasMq: false, lastMotion: 0,
  iss: null, issA: null, issPass: null, issErr: false,
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
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 4000);
camera.position.set(0, 1.62, 0);   // her eye height, so the ground reads as ground
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const R = 900;
const skyGroup = new THREE.Group();     // the celestial sphere, turned to her horizon
scene.add(skyGroup);
const localGroup = new THREE.Group();   // things fixed to her ground
scene.add(localGroup);

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
  // she is closer to the eye here than in the journey, so she is lit a
  // little more generously — a body, not a shadow
  her.traverse(o => {
    const u = o.material && o.material.uniforms;
    if (!u || !u.uBase) return;
    u.uBase.value.addScalar(0.055);
    u.uCity.value.multiplyScalar(1.3);
    u.uRim.value *= 1.7;
  });
  localGroup.add(her);
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
    color: 0x8fa8dd, transparent: true, opacity: 0.16,
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
  moonMesh = new THREE.Mesh(new THREE.PlaneGeometry(46, 46),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { uPhase: { value: 1.6 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform float uPhase; varying vec2 vUv;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9,78.2,45.1))) * 43758.5); }
        float n(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                     mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
        void main(){
          float r2 = dot(vUv, vUv);
          if (r2 > 1.0) discard;
          vec3 N = vec3(vUv.x, vUv.y, sqrt(1.0 - r2));
          vec3 L = normalize(vec3(-sin(uPhase), 0.10, -cos(uPhase)));
          float lit = clamp(dot(N, L) * 1.7 + 0.04, 0.0, 1.0);
          float maria = n(N * 4.5 + 3.0) * 0.6 + n(N * 11.0) * 0.4;
          vec3 surf = mix(vec3(0.88,0.87,0.83), vec3(0.55,0.55,0.54), smoothstep(0.45,0.72,maria));
          gl_FragColor = vec4(surf * (lit * 1.05 + 0.012), smoothstep(1.0, 0.88, r2));
        }`
    }));
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

// ---------------------------------------------------------------- the log
function buildLog() {
  const host = $('logList');
  host.innerHTML = '';
  TARGETS.forEach((t, i) => {
    const row = document.createElement('button');
    row.className = 'logRow';
    row.dataset.i = i;
    row.innerHTML = `<span class="lg-n">${t.ar}</span><span class="lg-a"></span>`;
    row.addEventListener('click', () => { selectTarget(i); toggleLog(false); });
    host.appendChild(row);
  });
}
function toggleLog(on) {
  const el = $('log');
  const show = on === undefined ? !el.classList.contains('on') : on;
  el.classList.toggle('on', show);
}
function selectTarget(i) {
  S.idx = i;
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

// ---------------------------------------------------------------- start
async function begin() {
  if (S.started) return;
  S.started = true;
  $('openHint').textContent = '…';

  // iOS only grants the motion sensors if we ask inside her tap, before
  // anything is awaited — so this comes first, and location follows.
  const motion = attachMotion();

  await new Promise(res => {
    if (!navigator.geolocation) return res();
    const to = setTimeout(res, 9000);
    navigator.geolocation.getCurrentPosition(p => {
      clearTimeout(to);
      S.lat = p.coords.latitude; S.lon = p.coords.longitude; S.placed = true;
      res();
    }, () => { clearTimeout(to); res(); }, { enableHighAccuracy: false, timeout: 8000 });
  });
  S.obs = new Astro.Observer(S.lat, S.lon, 600);
  await motion.catch(() => {});
  // give the sensor a moment to say whether it is there at all
  await new Promise(r => setTimeout(r, 700));

  pollISS();
  findPass();

  $('open').classList.add('gone');
  showBrief();
}

function enterSky() {
  $('brief').classList.remove('on');
  $('hud').classList.add('on');
  refreshHud();

  const note = [];
  if (!S.placed) note.push('لم يصلني موقعكِ، فحسبتُ سماء الرياض. لو سمحتِ بالموقع سترين سماءكِ أنتِ بالضبط.');
  if (!S.useMotion) note.push('جوالكِ لا يعطيني اتجاهه، فاسحبي بإصبعكِ لتلفّي في السماء.');
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

  $('bWhere').innerHTML = S.placed
    ? `موقعكِ الآن ${num(arNum(Math.abs(S.lat).toFixed(2)) + '°')}${S.lat >= 0 ? ' شمالاً' : ' جنوباً'}`
      + ` و${num(arNum(Math.abs(S.lon).toFixed(2)) + '°')}${S.lon >= 0 ? ' شرقاً' : ' غرباً'}،`
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

$('beginBtn').addEventListener('click', begin);
$('briefGo').addEventListener('click', () => {
  if ($('hud').classList.contains('on')) $('brief').classList.remove('on');
  else enterSky();
});
$('briefBtn').addEventListener('click', showBrief);
// while she is reading it, it keeps rewriting itself — the sky is moving
setInterval(() => { if ($('brief').classList.contains('on')) showBrief(); }, 20000);
$('logBtn').addEventListener('click', () => toggleLog());
$('logClose').addEventListener('click', () => toggleLog(false));
$('nextBtn').addEventListener('click', () => {
  // move to the next thing still unfound
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
  return `${arNum(y)} سنة · ${arNum(d)} يوم · ${p(h)}:${p(mi)}:${p(se)}.${arNum(Math.floor((ms % 1000) / 100))}`;
}

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
let riseCache = { at: 0, when: null, id: null };

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  const now = new Date();
  if (!S.ready || !S.obs) { renderer.render(scene, camera); return; }

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
  let lookAz = ((Math.atan2(fwd.x, -fwd.z) * R2D) % 360 + 360) % 360;
  updateBand(S.heading != null ? S.heading : lookAz);

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
  if (!onScreen && !S.locked) {
    const dc = tdir.clone().applyQuaternion(camera.quaternion.clone().invert());
    const a = Math.atan2(dc.y, dc.x);
    const rad = Math.min(innerWidth, innerHeight) * 0.30;
    ar.classList.add('on');
    ar.style.transform = `translate(${(innerWidth/2 + Math.cos(a)*rad)|0}px, ${(innerHeight/2 - Math.sin(a)*rad)|0}px)`
      + ` translate(-50%,-50%) rotate(${-a}rad)`;
  } else ar.classList.remove('on');

  // ---- holding the aim is what counts as finding it
  const LOCK = 7;
  if (!S.locked && sep < LOCK && aAlt > 2) {
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
  else if (aAlt < 0) {
    pr.classList.add('on');
    if (riseCache.id !== active.id || now - riseCache.at > 120000) {
      riseCache = { id: active.id, at: +now, when: nextRise(active, S.obs, now) };
    }
    if (active.kind === 'sat') {
      pr.innerHTML = !LIVE.iss ? 'أسأل عن المحطة…'
        : (S.issPass && S.issPass.visible && S.issPass.rise)
          ? `المحطة خلف الأفق · تمرّ فوقكِ <em>${hhmm(new Date(S.issPass.rise))}</em>`
          : 'المحطة خلف الأفق الآن · تدور حول الأرض كل ٩٣ دقيقة';
    } else {
      const w = hhmm(riseCache.when);
      pr.innerHTML = w ? `${active.ar} تحت الأفق الآن · يشرق <em>${w}</em>`
                       : `${active.ar} تحت الأفق الآن`;
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
  $('tripV').textContent = tripText(now);

  // the log's live altitudes
  if ($('log').classList.contains('on')) {
    const rows = $('logList').children;
    for (let i = 0; i < rows.length; i++) {
      const p = locate(TARGETS[i], S.obs, now);
      const a = rows[i].querySelector('.lg-a');
      a.textContent = p.stale ? 'بلا اتصال' : p.alt > 2 ? `${p.alt.toFixed(0)}°` : 'تحت الأفق';
      rows[i].classList.toggle('down', p.stale || p.alt <= 2);
      rows[i].classList.toggle('seen', S.found.has(TARGETS[i].id));
      rows[i].classList.toggle('cur', i === S.idx);
    }
  }

  renderer.render(scene, camera);
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
fetch('./livesky.json').then(r => r.json()).then(d => {
  buildSky(d);
  buildMarks();
  buildMoon();
  buildBand();
  buildLog();
  S.ready = true;
}).catch(() => {
  $('open').innerHTML = '<div class="box"><div class="bd">تعذّر تحميل السماء. جرّبي تحديث الصفحة.</div></div>';
});

frame();
