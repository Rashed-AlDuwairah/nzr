// ============================================================
//  مِرصَد نورة — her real star, live, above her, tonight
//
//  Everything here is computed, not staged: sidereal time from her
//  clock, her horizon from her coordinates, and the true altitude and
//  azimuth of HD 219134 — a star 21.35 light-years away in Cassiopeia,
//  whose light left home in the spring of 2005.
// ============================================================
import * as THREE from 'three';

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const $ = id => document.getElementById(id);
let __dbg;

// ---------------------------------------------------------------- sky maths
// Julian date from a JS Date
function julian(date) { return date.getTime() / 86400000 + 2440587.5; }

// Greenwich mean sidereal time, in degrees
function gmst(date) {
  const jd = julian(date);
  const T = (jd - 2451545.0) / 36525;
  let t = 280.46061837 + 360.98564736629 * (jd - 2451545.0)
        + 0.000387933 * T * T - T * T * T / 38710000;
  return ((t % 360) + 360) % 360;
}

// Precess J2000 coordinates to the date, so the aim stays true
function precess(raH, decDeg, date) {
  const T = (julian(date) - 2451545.0) / 36525;
  const z  = (0.6406161 * T + 0.0000839 * T * T) * D2R;
  const th = (0.5567530 * T - 0.0001185 * T * T) * D2R;
  const ze = (0.6406161 * T + 0.0000301 * T * T) * D2R;
  const ra = raH * 15 * D2R, dec = decDeg * D2R;
  const A = Math.cos(dec) * Math.sin(ra + ze);
  const B = Math.cos(th) * Math.cos(dec) * Math.cos(ra + ze) - Math.sin(th) * Math.sin(dec);
  const C = Math.sin(th) * Math.cos(dec) * Math.cos(ra + ze) + Math.cos(th) * Math.sin(dec);
  return [ (Math.atan2(A, B) + z) * R2D / 15, Math.asin(C) * R2D ];
}

// Right ascension / declination -> altitude / azimuth for a place and time
function altAz(raH, decDeg, latDeg, lonDeg, date) {
  const lst = gmst(date) + lonDeg;                 // local sidereal time, degrees
  const ha = ((lst - raH * 15) % 360 + 540) % 360 - 180;
  const H = ha * D2R, dec = decDeg * D2R, lat = latDeg * D2R;
  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H);
  const alt = Math.asin(THREE.MathUtils.clamp(sinAlt, -1, 1));
  const az = Math.atan2(-Math.sin(H) * Math.cos(dec),
                        Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(H));
  return [alt * R2D, ((az * R2D) % 360 + 360) % 360];   // az measured from north, eastward
}

// When does it next clear the horizon from here?
function nextRise(raH, decDeg, lat, lon, from) {
  for (let m = 0; m < 60 * 26; m += 4) {
    const t = new Date(from.getTime() + m * 60000);
    if (altAz(raH, decDeg, lat, lon, t)[0] > 6) return t;
  }
  return null;
}

function dirFromAzAlt(azDeg, altDeg, r = 1) {
  const az = azDeg * D2R, alt = altDeg * D2R;
  return new THREE.Vector3(
    Math.sin(az) * Math.cos(alt) * r,
    Math.sin(alt) * r,
    -Math.cos(az) * Math.cos(alt) * r);
}

const AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const arNum = n => String(n).split('').map(c => (c >= '0' && c <= '9') ? AR[+c] : c).join('');

// ---------------------------------------------------------------- state
const S = {
  lat: 24.7136, lon: 46.6753, placed: false,   // Riyadh until she says otherwise
  heading: null,                                // true compass heading, if the device gives one
  yaw: 0, pitch: 0.5, yawV: 0, pitchV: 0,       // fallback look, and the smoothed device look
  useMotion: false,
  locked: false, lockT: 0,
  star: null, data: null,
  ready: false,
};

window.__OBS = S;

// ---------------------------------------------------------------- three
const canvas = $('sky');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, 0.1, 4000);
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const R = 900;
const skyGroup = new THREE.Group();   // holds everything fixed to the celestial sphere
scene.add(skyGroup);

// ---- the ground and the horizon glow
{
  const bg = new THREE.Mesh(
    new THREE.SphereGeometry(R * 2.4, 40, 28),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec3 vD; void main(){ vD = position;
        gl_Position = (projectionMatrix * modelViewMatrix * vec4(position,1.0)).xyww; }`,
      fragmentShader: `
        uniform float uTime; varying vec3 vD;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5); }
        void main(){
          vec3 d = normalize(vD);
          vec3 col = vec3(0.014, 0.018, 0.034) * (1.0 - abs(d.y) * 0.35);
          float hz = exp(-abs(d.y) * 16.0);
          col += hz * vec3(0.075, 0.048, 0.028);
          float g = smoothstep(0.02, -0.03, d.y);
          col = mix(col, vec3(0.012, 0.011, 0.012), g);
          gl_FragColor = vec4(col, 1.0);
        }`
    }));
  bg.frustumCulled = false; bg.renderOrder = -10;
  scene.add(bg);
}

// ---- the horizon ring, with the four directions marked in the world
const horizon = new THREE.Group();
scene.add(horizon);
{
  const pts = [];
  for (let a = 0; a <= 360; a += 2) {
    const v = dirFromAzAlt(a, 0, R * 0.9);
    pts.push(v.x, v.y, v.z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
  horizon.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: 0xffc98a, transparent: true, opacity: 0.16 })));
}

// ---------------------------------------------------------------- the catalogue
let starPoints, starMat, lineSeg, herStar, herHalo, herRing;

function buildSky(d) {
  // stars, placed on the celestial sphere; the whole sphere is then turned
  // to match her horizon every frame
  const n = d.stars.length;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const ph = new Float32Array(n);
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
    size[i] = Math.max(1.0, 6.2 - mag) * 0.72;
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
    vertexShader: `
      attribute vec3 aColor; attribute float aSize, aPhase;
      uniform float uTime; varying vec3 vC; varying float vT;
      void main(){
        vC = aColor;
        vT = 0.76 + 0.24 * sin(uTime * (1.1 + aPhase) + aPhase * 19.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * vT * 3.4;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vC; varying float vT;
      void main(){
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.06, r) + smoothstep(0.14, 0.0, r) * 0.85;
        gl_FragColor = vec4(vC * vT * 1.2, a * 0.95);
      }`
  });
  starPoints = new THREE.Points(geo, starMat);
  starPoints.frustumCulled = false;
  skyGroup.add(starPoints);

  // constellation lines
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
    color: 0x8fa8dd, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  lineSeg.frustumCulled = false;
  skyGroup.add(lineSeg);

  // ---- her star: a disc, a halo, and a ring that closes when she finds it
  const tex = discTexture();
  herHalo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xffd08a }));
  herHalo.scale.setScalar(46);
  skyGroup.add(herHalo);

  herStar = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, color: 0xfff0d6 }));
  herStar.scale.setScalar(15);
  skyGroup.add(herStar);

  const rgeo = new THREE.RingGeometry(0.052, 0.056, 72);
  herRing = new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({
    color: 0xffb765, transparent: true, opacity: 0, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  skyGroup.add(herRing);

  const [pra, pdec] = precess(d.star.ra, d.star.dec, new Date());
  S.star = { ...d.star, pra, pdec };
  const v = raDecToVec(pra, pdec, R * 0.98);
  herHalo.position.copy(v); herStar.position.copy(v);
  herRing.position.copy(v.clone().multiplyScalar(0.99));
  herRing.scale.setScalar(R * 0.98);
}

function raDecToVec(raH, decDeg, r) {
  // equatorial frame: +Y toward the north celestial pole, RA measured about it
  const ra = raH * 15 * D2R, dec = decDeg * D2R;
  return new THREE.Vector3(
    Math.cos(dec) * Math.sin(ra) * r,
    Math.sin(dec) * r,
    Math.cos(dec) * Math.cos(ra) * r);
}

function discTexture() {
  const s = 128, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.22, 'rgba(255,240,214,0.85)');
  grd.addColorStop(0.55, 'rgba(255,200,130,0.22)');
  grd.addColorStop(1, 'rgba(255,180,100,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Turn the celestial sphere so it sits correctly over her horizon:
// spin by the local sidereal time, then tip by her latitude.
function orientSky(date) {
  const lst = (gmst(date) + S.lon) * D2R;
  const q = new THREE.Quaternion();
  // tip: the pole rises to her latitude above the northern horizon
  q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), (90 - S.lat) * D2R);
  const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -lst);
  skyGroup.quaternion.copy(q).multiply(spin);
}

// ---------------------------------------------------------------- compass band
function buildBand() {
  const inner = $('bandInner');
  inner.innerHTML = '';
  const PPD = 5.2;                       // pixels per degree of heading
  const names = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
  // three copies so it can scroll seamlessly
  for (let rep = -1; rep <= 1; rep++) {
    for (let a = 0; a < 360; a += 5) {
      const x = (a + rep * 360) * PPD;
      const maj = a % 45 === 0;
      const tk = document.createElement('i');
      tk.className = 'tk' + (maj ? ' maj' : '');
      tk.style.left = x + 'px';
      tk.style.height = maj ? '13px' : '7px';
      inner.appendChild(tk);
      if (maj) {
        const l = document.createElement('span');
        l.className = 'tkl';
        l.style.left = x + 'px';
        l.textContent = names[a];
        inner.appendChild(l);
      }
    }
  }
  inner.dataset.ppd = PPD;
}
function updateBand(headingDeg) {
  const inner = $('bandInner');
  const PPD = +inner.dataset.ppd;
  const x = innerWidth / 2 - headingDeg * PPD;
  inner.style.transform = `translateX(${x}px)`;
}

// ---------------------------------------------------------------- device motion
function screenAngleRad() {
  const a = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  return (a || 0) * D2R;
}

function attachMotion() {
  const q = new THREE.Quaternion();
  const zee = new THREE.Vector3(0, 0, 1);
  const e = new THREE.Euler();
  const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));   // -PI/2 about X

  const handler = ev => {
    if (ev.alpha == null) return;
    S.useMotion = true;
    // iOS gives a true-north heading; Android usually does not
    if (typeof ev.webkitCompassHeading === 'number' && !isNaN(ev.webkitCompassHeading))
      S.heading = ev.webkitCompassHeading;

    const alpha = ev.alpha * D2R, beta = ev.beta * D2R, gamma = ev.gamma * D2R;
    e.set(beta, alpha, -gamma, 'YXZ');
    q.setFromEuler(e);
    q.multiply(q1);                                    // camera looks out the back
    q.multiply(new THREE.Quaternion().setFromAxisAngle(zee, -screenAngleRad()));
    camera.quaternion.copy(q);

    if (S.heading == null) {
      // absolute events on Android carry true north in alpha
      if (ev.absolute === true) S.heading = (360 - ev.alpha) % 360;
    }
  };

  const add = () => {
    addEventListener('deviceorientationabsolute', handler, true);
    addEventListener('deviceorientation', handler, true);
  };
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    return DeviceOrientationEvent.requestPermission()
      .then(r => { if (r === 'granted') add(); })
      .catch(() => {});
  }
  add();
  return Promise.resolve();
}

// desktop / no-compass fallback: drag to look
{
  let down = false, px = 0, py = 0;
  addEventListener('pointerdown', e => { down = true; px = e.clientX; py = e.clientY; });
  addEventListener('pointerup', () => { down = false; });
  addEventListener('pointermove', e => {
    if (!down || S.useMotion) return;
    S.yawV = -(e.clientX - px) * 0.0035;
    S.pitchV = (e.clientY - py) * 0.0035;
    px = e.clientX; py = e.clientY;
  });
}

// ---------------------------------------------------------------- the journey counter
function tripText(now) {
  const dep = new Date(S.data.star.departedISO);
  let ms = now - dep;
  const yr = 365.25636 * 86400000;
  const years = Math.floor(ms / yr); ms -= years * yr;
  const days = Math.floor(ms / 86400000); ms -= days * 86400000;
  const hrs = Math.floor(ms / 3600000); ms -= hrs * 3600000;
  const min = Math.floor(ms / 60000); ms -= min * 60000;
  const sec = Math.floor(ms / 1000);
  const t = ms % 1000;
  return `${arNum(years)} سنة · ${arNum(days)} يوم · ${arNum(String(hrs).padStart(2,'0'))}:${arNum(String(min).padStart(2,'0'))}:${arNum(String(sec).padStart(2,'0'))}.${arNum(String(Math.floor(t/100)))}`;
}

// ---------------------------------------------------------------- start
async function begin() {
  $('openHint').textContent = 'Asking…';
  // her place, if she will give it
  await new Promise(res => {
    if (!navigator.geolocation) return res();
    const done = () => res();
    const to = setTimeout(done, 9000);
    navigator.geolocation.getCurrentPosition(p => {
      clearTimeout(to);
      S.lat = p.coords.latitude; S.lon = p.coords.longitude; S.placed = true;
      res();
    }, () => { clearTimeout(to); res(); }, { enableHighAccuracy: false, timeout: 8000 });
  });
  await attachMotion();

  $('open').classList.add('gone');
  $('hud').classList.add('on');
  setTimeout(() => { $('trip').classList.add('on'); }, 1600);

  if (!S.placed) {
    $('note').textContent = 'لم يصلني موقعك، فحسبتُ سماء الرياض. لو سمحتِ بالموقع سترين سماءكِ أنتِ بالضبط.';
    $('note').classList.add('on');
    setTimeout(() => $('note').classList.remove('on'), 12000);
  }
  if (!S.useMotion) {
    $('note').textContent = 'جوالك لا يعطيني اتجاهه، فاسحبي بإصبعك لتلفّي في السماء.';
    $('note').classList.add('on');
    setTimeout(() => $('note').classList.remove('on'), 12000);
  }
}
$('beginBtn').addEventListener('click', begin, { once: true });

// ---------------------------------------------------------------- loop
const clock = new THREE.Clock();
let lastRise = null, riseCheck = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  const now = new Date();

  if (!S.ready) { renderer.render(scene, camera); return; }

  starMat.uniforms.uTime.value = time;
  orientSky(now);

  // where her star stands right now
  const [alt, az] = altAz(S.star.pra, S.star.pdec, S.lat, S.lon, now);

  // ---- camera
  if (!S.useMotion) {
    S.yaw += S.yawV; S.pitch += S.pitchV;
    S.yawV *= Math.exp(-dt * 4.5); S.pitchV *= Math.exp(-dt * 4.5);
    S.pitch = THREE.MathUtils.clamp(S.pitch, -0.5, 1.45);
    const d = new THREE.Vector3(
      Math.sin(S.yaw) * Math.cos(S.pitch), Math.sin(S.pitch), -Math.cos(S.yaw) * Math.cos(S.pitch));
    camera.lookAt(d);
  }

  // where the camera is actually pointing, in her sky
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  const lookAlt = Math.asin(THREE.MathUtils.clamp(fwd.y, -1, 1)) * R2D;
  let lookAz = Math.atan2(fwd.x, -fwd.z) * R2D;
  lookAz = ((lookAz % 360) + 360) % 360;
  // if the device gave us true north, trust it over the sky's own frame
  const headingShown = S.heading != null ? S.heading : lookAz;
  updateBand(headingShown);

  // ---- how far off is she?
  const target = dirFromAzAlt(az, alt);
  const look = dirFromAzAlt(lookAz, lookAlt);
  const sep = Math.acos(THREE.MathUtils.clamp(target.dot(look), -1, 1)) * R2D;

  // ---- her star, breathing, and its ring closing as she nears it
  const near = THREE.MathUtils.clamp(1 - sep / 60, 0, 1);
  herHalo.scale.setScalar(40 + Math.pow(near, 2) * 46 + Math.sin(time * 1.7) * 5);
  herHalo.material.opacity = 0.42 + near * 0.5;
  herStar.scale.setScalar(13 + Math.pow(near, 2) * 10 + Math.sin(time * 2.3) * 1.6);
  herRing.material.opacity = Math.pow(near, 2.2) * 0.7;
  herRing.lookAt(0, 0, 0);

  // ---- the guiding arrow, on a ring about the centre of the view
  const ar = $('arrow');
  const onScreen = (() => {
    const p = target.clone().multiplyScalar(R * 0.98).project(camera);
    return p.z < 1 && Math.abs(p.x) < 0.7 && Math.abs(p.y) < 0.65;
  })();
  if (!onScreen && !S.locked) {
    const dc = target.clone().applyQuaternion(camera.quaternion.clone().invert());
    const a = Math.atan2(dc.y, dc.x);
    const rad = Math.min(innerWidth, innerHeight) * 0.30;
    ar.classList.add('on');
    ar.style.transform =
      `translate(${(innerWidth/2 + Math.cos(a)*rad)|0}px, ${(innerHeight/2 - Math.sin(a)*rad)|0}px)`
      + ` translate(-50%,-50%) rotate(${-a}rad)`;
  } else ar.classList.remove('on');

  // ---- the lock
  if (!S.locked && sep < 7 && alt > 3) {
    S.locked = true; S.lockT = 0;
    document.body.classList.add('locked');
    if (navigator.vibrate) navigator.vibrate([30, 60, 30, 60, 120]);
    setTimeout(() => $('found').classList.add('on'), 900);
  }
  if (S.locked) S.lockT += dt;

  // ---- what to tell her
  const say = $('say');
  if (S.locked) {
    say.style.opacity = 0;
  } else if (alt < 0) {
    say.style.opacity = 1;
    if (!lastRise || now - riseCheck > 60000) {
      riseCheck = now; lastRise = nextRise(S.star.pra, S.star.pdec, S.lat, S.lon, now);
    }
    const when = lastRise
      ? lastRise.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      : null;
    say.textContent = when
      ? `نجمتُكِ تحت الأفق الآن… تشرق الساعة ${when}. انتظريها، فهي لا تُخلف موعداً.`
      : 'نجمتُكِ تحت الأفق الآن. عودي بعد قليل.';
  } else {
    say.style.opacity = 1;
    say.textContent = sep > 55
      ? 'لُفّي بجسمك… نجمتُكِ في جهةٍ أخرى من السماء'
      : sep > 22 ? 'اقتربتِ… واصلي في هذا الاتجاه'
      : sep > 9  ? 'قريبةٌ جداً… ارفعي أو اخفضي قليلاً'
                 : 'ثبّتي يدك…';
  }

  // ---- the readouts
  $('readL').innerHTML =
    `ALT <b>${alt.toFixed(1)}°</b><br>AZ <b>${az.toFixed(1)}°</b><br>SEP <b>${sep.toFixed(1)}°</b>`;
  $('readR').innerHTML =
    `${S.lat.toFixed(3)}°${S.lat >= 0 ? 'N' : 'S'} ${Math.abs(S.lon).toFixed(3)}°${S.lon >= 0 ? 'E' : 'W'}`
    + `<br>LST <b>${(((gmst(now) + S.lon) % 360 + 360) % 360 / 15).toFixed(2)}h</b>`
    + `<br>HD 219134 · <b>21.35 ly</b>`;

  $('tripV').textContent = tripText(now);

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- go
fetch('./livesky.json').then(r => r.json()).then(d => {
  S.data = d;
  buildSky(d);
  buildBand();
  $('foundFacts').innerHTML =
    `اسمها في السجلّات <b>HD 219134</b>، في كوكبة ذات الكرسي.<br>`
    + `تبعد <b>٢١٫٣٥</b> سنة ضوئية، ولها كواكب تدور حولها.<br>`
    + `الضوء الذي رأيتِه الآن غادرها في <b>ربيع ٢٠٠٥</b> — عام ولادتك.`;
  S.ready = true;
}).catch(() => {
  $('open').innerHTML = '<div class="box"><div class="bd">تعذّر تحميل السماء. جرّبي تحديث الصفحة.</div></div>';
});

frame();
