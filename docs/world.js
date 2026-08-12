// ============================================================
//  عالم نورة — الرياض تحت النجوم
//  A wormhole, a girl with a book sitting on the ground,
//  and the Riyadh skyline holding up her sky.
// ============================================================
import * as THREE from 'three';

// ------------------------------------------------------------------
//  Riyadh skyline — drawn by hand into a panoramic texture
// ------------------------------------------------------------------
function drawSkylineTexture() {
  const W = 4096, H = 1150;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, W, H);

  const GROUND = H;                    // buildings stand on the canvas bottom
  const SIL = '#05060c';               // silhouette colour
  const rnd = (() => { let s = 20050813; return () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648; })();

  // ---- warm window lights, scattered inside a rectangle
  function windows(x, w, top, h, density = 0.30, warm = 1) {
    const cols = Math.max(2, Math.round(w / 13));
    const rows = Math.max(3, Math.round(h / 17));
    const cw = w / cols, ch = h / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (rnd() > density) continue;
      const a = 0.35 + rnd() * 0.65;
      const c = warm
        ? `rgba(255,${190 + (rnd() * 40 | 0)},${110 + (rnd() * 60 | 0)},${a})`
        : `rgba(190,215,255,${a})`;
      g.fillStyle = c;
      g.fillRect(x + i * cw + cw * 0.22, top + j * ch + ch * 0.25, cw * 0.5, ch * 0.42);
    }
  }

  // ---- generic tower
  function block(x, w, h, opts = {}) {
    const top = GROUND - h;
    g.fillStyle = SIL;
    if (opts.taper) {
      const t = opts.taper;
      g.beginPath();
      g.moveTo(x, GROUND);
      g.lineTo(x + w * t, top);
      g.lineTo(x + w * (1 - t), top);
      g.lineTo(x + w, GROUND);
      g.closePath(); g.fill();
    } else {
      g.fillRect(x, top, w, h);
    }
    if (opts.crown) { // rooftop mast
      g.fillRect(x + w / 2 - 2, top - opts.crown, 4, opts.crown);
      g.fillStyle = 'rgba(255,70,60,0.95)';
      g.beginPath(); g.arc(x + w / 2, top - opts.crown, 4.5, 0, 7); g.fill();
    }
    windows(x, w, top, h, opts.density ?? 0.28, opts.warm ?? 1);
  }

  // ---- برج المملكة — the great arch
  function kingdomCentre(cx, scale) {
    const w = 158 * scale, h = 760 * scale;
    const x = cx - w / 2, top = GROUND - h;
    g.save();
    g.fillStyle = SIL;
    // body: a slab whose shoulders curve inward toward the arch
    g.beginPath();
    g.moveTo(x, GROUND);
    g.lineTo(x, top + h * 0.30);
    g.quadraticCurveTo(x + w * 0.02, top + h * 0.06, x + w * 0.30, top);
    g.lineTo(x + w * 0.70, top);
    g.quadraticCurveTo(x + w * 0.98, top + h * 0.06, x + w, top + h * 0.30);
    g.lineTo(x + w, GROUND);
    g.closePath();
    g.fill();
    windows(x + w * 0.06, w * 0.88, top + h * 0.30, h * 0.66, 0.26);
    // the opening
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.moveTo(x + w * 0.30, top + h * 0.02);
    g.lineTo(x + w * 0.30, top + h * 0.30);
    g.quadraticCurveTo(cx, top + h * 0.58, x + w * 0.70, top + h * 0.30);
    g.lineTo(x + w * 0.70, top + h * 0.02);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'source-over';
    // the sky bridge across the top
    g.fillStyle = SIL;
    g.fillRect(x + w * 0.28, top + h * 0.045, w * 0.44, h * 0.030);
    g.fillStyle = 'rgba(180,215,255,0.85)';
    for (let i = 0; i < 11; i++)
      g.fillRect(x + w * 0.30 + i * (w * 0.40 / 11), top + h * 0.055, 3, 3);
    // the crown of blue light along the arch
    g.strokeStyle = 'rgba(120,190,255,0.55)';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(x + w * 0.30, top + h * 0.30);
    g.quadraticCurveTo(cx, top + h * 0.58, x + w * 0.70, top + h * 0.30);
    g.stroke();
    g.restore();
  }

  // ---- برج الفيصلية — the spire with its glass ball
  function faisaliah(cx, scale) {
    const w = 112 * scale, h = 690 * scale;
    const top = GROUND - h;
    g.fillStyle = SIL;
    // four legs tapering to a point
    g.beginPath();
    g.moveTo(cx - w / 2, GROUND);
    g.lineTo(cx - w * 0.045, top + h * 0.30);
    g.lineTo(cx + w * 0.045, top + h * 0.30);
    g.lineTo(cx + w / 2, GROUND);
    g.closePath(); g.fill();
    windows(cx - w * 0.36, w * 0.72, GROUND - h * 0.62, h * 0.62, 0.22);
    // the ball
    const by = top + h * 0.20, br = w * 0.215;
    g.beginPath(); g.arc(cx, by, br, 0, 7); g.fill();
    g.fillStyle = 'rgba(190,225,255,0.30)';
    g.beginPath(); g.arc(cx, by, br * 0.82, 0, 7); g.fill();
    g.fillStyle = 'rgba(230,245,255,0.75)';
    g.beginPath(); g.arc(cx - br * 0.28, by - br * 0.26, br * 0.22, 0, 7); g.fill();
    // spire above the ball
    g.fillStyle = SIL;
    g.beginPath();
    g.moveTo(cx - w * 0.035, by - br * 0.6);
    g.lineTo(cx, top - h * 0.055);
    g.lineTo(cx + w * 0.035, by - br * 0.6);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,80,60,0.95)';
    g.beginPath(); g.arc(cx, top - h * 0.05, 4, 0, 7); g.fill();
  }

  // ---- برج PIF — the twisted prism
  function pifTower(cx, scale) {
    const w = 104 * scale, h = 600 * scale;
    const top = GROUND - h;
    g.fillStyle = SIL;
    g.beginPath();
    g.moveTo(cx - w / 2, GROUND);
    g.lineTo(cx - w * 0.20, top);
    g.lineTo(cx + w * 0.34, top);
    g.lineTo(cx + w / 2, GROUND);
    g.closePath(); g.fill();
    windows(cx - w * 0.34, w * 0.68, top + h * 0.05, h * 0.9, 0.24, 0);
    // the diagonal seams of its facade
    g.strokeStyle = 'rgba(140,190,255,0.28)';
    g.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      g.beginPath();
      g.moveTo(cx - w / 2 + w * 0.3 * t, GROUND - h * t);
      g.lineTo(cx + w / 2 - w * 0.16 * t, GROUND - h * t - h * 0.04);
      g.stroke();
    }
  }

  // ---- the whole horizon
  // low city everywhere, so the skyline never breaks
  for (let x = -40; x < W + 40; x += 26 + rnd() * 34) {
    const h = 55 + rnd() * 130;
    block(x, 22 + rnd() * 34, h, { density: 0.16 });
  }
  // a denser mid-rise belt
  for (let x = -40; x < W + 40; x += 70 + rnd() * 90) {
    const h = 160 + rnd() * 240;
    block(x, 34 + rnd() * 44, h, { density: 0.22, taper: rnd() < 0.3 ? 0.06 : 0 });
  }

  // the landmarks, gathered where she is looking (texture centre = due north)
  const C = W * 0.5;
  block(C - 1000, 74, 470, { density: 0.3, taper: 0.06, crown: 30 });
  block(C - 830, 60, 380, { density: 0.26 });
  pifTower(C - 620, 1.0);
  block(C - 430, 78, 430, { density: 0.28, taper: 0.09 });
  kingdomCentre(C - 150, 1.0);
  block(C + 130, 66, 360, { density: 0.26, crown: 24 });
  faisaliah(C + 350, 1.0);
  block(C + 560, 80, 420, { density: 0.3, taper: 0.08 });
  block(C + 730, 56, 500, { density: 0.24, crown: 34 });
  block(C + 900, 96, 320, { density: 0.3 });
  // a second cluster, far to the other side
  block(C + 1700, 66, 420, { density: 0.24, taper: 0.07, crown: 26 });
  block(C + 1850, 50, 340, { density: 0.22 });
  block(C - 1700, 72, 400, { density: 0.24, taper: 0.06 });
  block(C - 1870, 54, 330, { density: 0.22, crown: 22 });

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function buildRiyadh() {
  const group = new THREE.Group();
  const RAD = 700, HEIGHT = 300, BASE = -18;

  const tex = drawSkylineTexture();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uMap: { value: tex }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uMap; uniform float uTime;
      varying vec2 vUv;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
      void main(){
        vec4 t = texture2D(uMap, vUv);
        if (t.a < 0.02) discard;
        vec3 col = t.rgb;
        // windows flicker; the dark silhouette does not
        float lum = max(col.r, max(col.g, col.b));
        float lit = smoothstep(0.10, 0.30, lum);
        float f = 0.72 + 0.28 * sin(uTime * (0.6 + h21(floor(vUv * vec2(900.0, 260.0))) * 3.2)
                                    + h21(floor(vUv * vec2(900.0, 260.0)) + 5.0) * 30.0);
        col *= mix(1.0, f, lit);
        // distance haze eats the base of the city
        col = mix(col, vec3(0.16, 0.10, 0.06), smoothstep(0.30, 0.0, vUv.y) * 0.75);
        gl_FragColor = vec4(col, t.a);
      }`
  });
  const city = new THREE.Mesh(
    new THREE.CylinderGeometry(RAD, RAD, HEIGHT, 96, 1, true), mat);
  city.position.y = BASE + HEIGHT / 2;
  city.frustumCulled = false;
  group.add(city);
  group.userData.cityMat = mat;

  // the warm dome of light a city throws onto its own sky
  const glow = new THREE.Mesh(
    new THREE.CylinderGeometry(RAD * 0.985, RAD * 0.985, HEIGHT * 1.5, 64, 1, true),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      uniforms: {},
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv;
        void main(){
          float up = smoothstep(0.62, 0.14, vUv.y);
          // brightest toward the heart of the city
          float d = abs(fract(vUv.x + 0.5) - 0.5) * 2.0;
          float side = mix(1.0, 0.35, smoothstep(0.0, 0.55, d));
          gl_FragColor = vec4(vec3(0.78, 0.46, 0.20), up * side * 0.34);
        }`
    })
  );
  glow.position.y = BASE + HEIGHT * 0.75;
  glow.frustumCulled = false;
  group.add(glow);

  // the ground she is sitting on
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(RAD * 1.02, 96),
    new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `varying vec2 vP; void main(){ vP = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */`
        varying vec2 vP;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5); }
        void main(){
          float r = length(vP);
          float grain = h21(floor(vP * 3.0)) * 0.5 + h21(floor(vP * 11.0)) * 0.5;
          vec3 col = mix(vec3(0.022, 0.017, 0.014), vec3(0.042, 0.032, 0.025), grain);
          // the city's glow spilling across the sand toward the horizon
          col += vec3(0.075, 0.040, 0.017) * smoothstep(0.0, 620.0, r);
          gl_FragColor = vec4(col, 1.0);
        }`
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  group.add(ground);

  return group;
}

// ------------------------------------------------------------------
//  نورة — seen from behind, sitting, holding her book
// ------------------------------------------------------------------
function figureMaterial(baseHex, rimBoost = 1.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: new THREE.Color(baseHex) },
      uCity: { value: new THREE.Color(0xffa855) },
      uSky:  { value: new THREE.Color(0x94aaff) },
      uRim:  { value: rimBoost },
    },
    vertexShader: `
      varying vec3 vN, vWP;
      void main(){
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBase, uCity, uSky; uniform float uRim;
      varying vec3 vN, vWP;
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vWP);
        float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.5);
        float up = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        // the city burns low and warm behind her; starlight settles on top
        float cityFace = pow(clamp(-N.z * 0.5 + 0.5, 0.0, 1.0), 1.3);
        vec3 warm = uCity * cityFace;
        vec3 sky  = uSky * pow(up, 1.5);
        vec3 col = uBase
                 + warm * 0.20
                 + sky  * 0.13
                 + rim * (warm + sky * 0.7) * 0.85 * uRim;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
}

// ------------------------------------------------------------------
//  نورة — one continuous surface, the way a figure is actually modelled.
//  Cross-sections are lofted along the body: hem, hips, waist, bust,
//  shoulders, neck, skull. Nothing is a stacked primitive.
// ------------------------------------------------------------------

// A superellipse ring: k = 1 gives an ellipse, lower k gives a fuller,
// more human cross-section than a plain tube.
function ringPoint(a, b, t, k) {
  const c = Math.cos(t), s = Math.sin(t);
  return [
    a * Math.sign(c) * Math.pow(Math.abs(c), k),
    b * Math.sign(s) * Math.pow(Math.abs(s), k),
  ];
}

// Loft a list of cross-sections into a single smooth skin.
// Each section: { c: Vector3 centre, a: half-width, b: half-depth,
//                 k: fullness, ex: right axis, ey: depth axis, warp(fn) }
function loft(sections, RAD = 56, capTop = true, capBottom = true) {
  const rows = sections.length;
  const pos = [];
  const EX = new THREE.Vector3(1, 0, 0);
  const EY = new THREE.Vector3(0, 0, 1);
  for (const s of sections) {
    const ex = s.ex || EX, ey = s.ey || EY;
    for (let i = 0; i < RAD; i++) {
      const t = (i / RAD) * Math.PI * 2;
      let [u, v] = ringPoint(s.a, s.b, t, s.k ?? 1);
      if (s.warp) { const r = s.warp(t, u, v); u = r[0]; v = r[1]; }
      pos.push(
        s.c.x + ex.x * u + ey.x * v,
        s.c.y + ex.y * u + ey.y * v,
        s.c.z + ex.z * u + ey.z * v);
    }
  }
  const idx = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let i = 0; i < RAD; i++) {
      const j = (i + 1) % RAD;
      const a = r * RAD + i, b = r * RAD + j;
      const c = (r + 1) * RAD + i, d = (r + 1) * RAD + j;
      idx.push(a, c, b, b, c, d);
    }
  }
  // close the ends so the silhouette never shows a hollow tube
  const cap = (rowStart, centre, flip) => {
    const ci = pos.length / 3;
    pos.push(centre.x, centre.y, centre.z);
    for (let i = 0; i < RAD; i++) {
      const j = (i + 1) % RAD;
      if (flip) idx.push(ci, rowStart + j, rowStart + i);
      else      idx.push(ci, rowStart + i, rowStart + j);
    }
  };
  if (capBottom) cap(0, sections[0].c, true);
  if (capTop)    cap((rows - 1) * RAD, sections[rows - 1].c, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function buildNoura() {
  const g = new THREE.Group();
  const skin  = figureMaterial(0x17171f, 1.0);
  const cloth = figureMaterial(0x101018, 1.25);
  const hairMat = figureMaterial(0x030307, 1.5);

  // ---------------------------------------------------------------
  //  the body: hem -> skirt -> hips -> waist -> bust -> shoulders
  //            -> neck -> skull, in one skin
  //  (her legs live inside the dress, so the column reads as cloth)
  // ---------------------------------------------------------------
  const fold = (amp, freq) => (t, u, v) => {
    const f = 1 + Math.sin(t * freq) * amp + Math.sin(t * (freq * 2 + 1)) * amp * 0.4;
    return [u * f, v * f];
  };

  const body = [
    { y: 0.000, a: 0.235, b: 0.205, k: 0.90, z:  0.010, w: fold(0.055, 7) },
    { y: 0.060, a: 0.222, b: 0.196, k: 0.90, z:  0.008, w: fold(0.050, 7) },
    { y: 0.180, a: 0.198, b: 0.178, k: 0.92, z:  0.006, w: fold(0.042, 7) },
    { y: 0.320, a: 0.176, b: 0.160, k: 0.94, z:  0.004, w: fold(0.034, 7) },
    { y: 0.460, a: 0.160, b: 0.146, k: 0.95, z:  0.002, w: fold(0.026, 7) },
    { y: 0.600, a: 0.150, b: 0.135, k: 0.96, z:  0.000, w: fold(0.018, 7) },
    { y: 0.720, a: 0.146, b: 0.128, k: 0.96, z: -0.004 },
    { y: 0.820, a: 0.148, b: 0.126, k: 0.95, z: -0.010 },   // hips, widest
    { y: 0.890, a: 0.132, b: 0.112, k: 0.94, z: -0.012 },
    { y: 0.960, a: 0.104, b: 0.092, k: 0.93, z: -0.010 },   // waist
    { y: 1.020, a: 0.110, b: 0.096, k: 0.93, z: -0.004 },
    { y: 1.090, a: 0.122, b: 0.108, k: 0.93, z:  0.004 },
    { y: 1.150, a: 0.128, b: 0.116, k: 0.92, z:  0.008 },   // bust
    { y: 1.210, a: 0.132, b: 0.104, k: 0.92, z:  0.004 },
    { y: 1.275, a: 0.146, b: 0.094, k: 0.90, z:  0.000 },
    { y: 1.325, a: 0.166, b: 0.088, k: 0.85, z: -0.004 },   // shoulders
    { y: 1.365, a: 0.148, b: 0.082, k: 0.85, z: -0.006 },
    { y: 1.400, a: 0.088, b: 0.072, k: 0.92, z: -0.004 },   // trapezius into neck
    { y: 1.445, a: 0.052, b: 0.054, k: 0.98, z:  0.000 },   // neck
    { y: 1.500, a: 0.050, b: 0.053, k: 0.98, z:  0.006 },
    { y: 1.540, a: 0.064, b: 0.072, k: 0.96, z:  0.010 },   // jaw
    { y: 1.585, a: 0.080, b: 0.090, k: 0.97, z:  0.006 },   // cheeks
    { y: 1.635, a: 0.086, b: 0.094, k: 0.98, z:  0.000 },   // skull
    { y: 1.685, a: 0.076, b: 0.082, k: 0.98, z: -0.006 },
    { y: 1.725, a: 0.050, b: 0.054, k: 0.98, z: -0.010 },
    { y: 1.748, a: 0.018, b: 0.019, k: 0.98, z: -0.012 },
  ].map(s => ({ c: V(0, s.y, s.z), a: s.a, b: s.b, k: s.k, warp: s.w }));

  const bodyMesh = new THREE.Mesh(loft(body, 56), cloth);
  g.add(bodyMesh);

  // the head and neck read as skin, so they are drawn again, just inside
  const headSkin = [
    { y: 1.425, a: 0.050, b: 0.052, z:  0.000 },
    { y: 1.500, a: 0.048, b: 0.051, z:  0.006 },
    { y: 1.540, a: 0.062, b: 0.070, z:  0.010 },
    { y: 1.585, a: 0.078, b: 0.088, z:  0.006 },
    { y: 1.635, a: 0.084, b: 0.092, z:  0.000 },
    { y: 1.685, a: 0.074, b: 0.080, z: -0.006 },
    { y: 1.725, a: 0.048, b: 0.052, z: -0.010 },
    { y: 1.746, a: 0.017, b: 0.018, z: -0.012 },
  ].map(s => ({ c: V(0, s.y, s.z), a: s.a, b: s.b, k: 0.98 }));
  g.add(new THREE.Mesh(loft(headSkin, 44), skin));

  // ---------------------------------------------------------------
  //  arms: lofted along a curve, tapering shoulder -> wrist
  // ---------------------------------------------------------------
  function arm(side, elbowOut, wristIn, holdsBook) {
    const s = side;
    // the first rings start inside the torso so the shoulder reads as
    // one joint instead of a plank stuck to her side
    const curve = new THREE.CatmullRomCurve3([
      V(s * 0.080, 1.322, -0.006),
      V(s * 0.135, 1.300, -0.010),
      V(s * 0.170, 1.215, -0.014),
      V(s * 0.184, 1.090, -0.006),   // elbow
      V(s * (0.184 - wristIn), 0.995,  0.010),
      V(s * (0.174 - wristIn), 0.905,  0.024 + (holdsBook ? 0.02 : 0)),
    ], false, 'catmullrom', 0.4);
    const N = 18;
    const radii = [0.086, 0.076, 0.066, 0.056, 0.049, 0.045, 0.042, 0.041,
                   0.040, 0.040, 0.041, 0.038, 0.034, 0.031, 0.030, 0.030,
                   0.031, 0.030];
    const rings = [];
    const up = V(0, 1, 0);
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1);
      const c = curve.getPoint(t);
      const tan = curve.getTangent(t).normalize();
      const ex = new THREE.Vector3().crossVectors(up, tan).normalize();
      const ey = new THREE.Vector3().crossVectors(tan, ex).normalize();
      const r = radii[i] * (1 + elbowOut * 0);
      rings.push({ c, a: r, b: r * 0.88, k: 0.95, ex, ey });
    }
    // the hand: a small flattened continuation
    const end = curve.getPoint(1);
    const tan = curve.getTangent(1).normalize();
    const ex = new THREE.Vector3().crossVectors(up, tan).normalize();
    const ey = new THREE.Vector3().crossVectors(tan, ex).normalize();
    for (let i = 1; i <= 4; i++) {
      const t = i / 4;
      rings.push({
        c: end.clone().addScaledVector(tan, 0.030 * t),
        a: 0.034 * (1 - t * 0.45), b: 0.019 * (1 - t * 0.3), k: 0.9, ex, ey,
      });
    }
    return new THREE.Mesh(loft(rings, 26), skin);
  }
  g.add(arm(-1, 0, 0.010, false));
  g.add(arm( 1, 0, 0.006, true));

  // ---------------------------------------------------------------
  //  her hair: its own skin, narrower than her shoulders,
  //  hugging the skull and falling behind her
  // ---------------------------------------------------------------
  const hair = [
    { y: 1.760, a: 0.030, b: 0.032, z: -0.012 },
    { y: 1.730, a: 0.058, b: 0.062, z: -0.012 },
    { y: 1.690, a: 0.084, b: 0.090, z: -0.010 },
    { y: 1.640, a: 0.095, b: 0.103, z: -0.004 },
    { y: 1.590, a: 0.092, b: 0.100, z:  0.000 },
    { y: 1.545, a: 0.082, b: 0.092, z: -0.010 },
    { y: 1.495, a: 0.076, b: 0.080, z: -0.030 },
    { y: 1.430, a: 0.098, b: 0.078, z: -0.044 },
    { y: 1.340, a: 0.128, b: 0.076, z: -0.054 },
    { y: 1.230, a: 0.146, b: 0.072, z: -0.060 },
    { y: 1.120, a: 0.152, b: 0.070, z: -0.064 },
    { y: 1.020, a: 0.150, b: 0.068, z: -0.066 },
    { y: 0.940, a: 0.140, b: 0.062, z: -0.066 },
    { y: 0.880, a: 0.120, b: 0.054, z: -0.064 },
    { y: 0.840, a: 0.086, b: 0.040, z: -0.060 },
    { y: 0.818, a: 0.040, b: 0.022, z: -0.056 },
  ].map((s, i, arr) => ({
    c: V(0, s.y, s.z), a: s.a, b: s.b, k: 0.95,
    // strands: a gentle scallop that deepens toward the ends
    warp: (t, u, v) => {
      const depth = i / (arr.length - 1);
      const f = 1 + Math.sin(t * 9.0) * 0.045 * depth + Math.sin(t * 5.0 + 1.3) * 0.03 * depth;
      // the front is pulled back so it frames the face instead of covering it
      const front = Math.max(0, Math.sin(t));
      return [u * f * (1 - front * 0.30), v * f * (1 - front * 0.55)];
    },
  }));
  g.add(new THREE.Mesh(loft(hair, 48), hairMat));

  // ---------------------------------------------------------------
  //  the book, closed, held down at her right side
  // ---------------------------------------------------------------
  const book = new THREE.Group();
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.185, 0.030), cloth);
  book.add(cover);
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.126, 0.172, 0.022),
    new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vN;
        void main(){
          float edge = pow(1.0 - abs(vN.z), 2.0);
          vec3 col = mix(vec3(0.10, 0.09, 0.08), vec3(0.52, 0.47, 0.40), edge);
          col *= 0.55 + 0.45 * clamp(vN.y * 0.5 + 0.5, 0.0, 1.0);
          gl_FragColor = vec4(col, 1.0); }`
    })
  );
  pages.position.x = -0.006;
  book.add(pages);
  book.position.set(0.212, 0.845, 0.052);
  book.rotation.set(0.16, 0.14, 0.07);
  g.add(book);
  g.userData.book = book;

  return g;
}

// ------------------------------------------------------------------
//  The wormhole
// ------------------------------------------------------------------
export function buildWormhole() {
  const LEN = 460, RAD = 7.5;
  const geo = new THREE.CylinderGeometry(RAD, RAD, LEN, 64, 200, true);
  geo.rotateX(Math.PI / 2);            // lay the tunnel along Z
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader: /* glsl */`
      uniform float uTime;
      varying vec2 vUv; varying float vZ;
      void main(){
        vUv = uv; vZ = position.z;
        vec3 p = position;
        // the throat breathes and wobbles as you fall through it
        float k = p.z * 0.02;
        p.x += sin(k + uTime * 1.7) * 1.5;
        p.y += cos(k * 1.3 + uTime * 1.4) * 1.5;
        float pinch = 0.72 + 0.28 * sin(k * 0.8 + uTime * 0.9);
        p.xy *= pinch;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uFade;
      varying vec2 vUv; varying float vZ;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1,0)), f.x),
                   mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.05; a *= 0.5; }
        return v;
      }
      void main(){
        // uv.x runs around the throat, uv.y runs along it
        vec2 uv = vec2(vUv.x * 4.0 + vUv.y * 1.2, vUv.y * 9.0 - uTime * 2.6);
        float streaks = fbm(uv * vec2(2.0, 7.0));
        float bands = fbm(uv * vec2(5.0, 2.0) + 11.0);
        float e = pow(streaks * 1.35, 2.1) + pow(bands, 3.0) * 0.6;
        // colour drifts from violet through cyan as you go deeper
        vec3 a = vec3(0.42, 0.13, 0.85);
        vec3 b = vec3(0.10, 0.62, 0.98);
        vec3 c = vec3(1.00, 0.80, 0.45);
        vec3 col = mix(a, b, fract(vUv.y * 2.0 + uTime * 0.35));
        col = mix(col, c, pow(streaks, 4.0) * 0.8);
        col *= e * 1.15;
        // the mouth of the tunnel stays bright, the walls fall away
        float vig = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.72, vUv.y);
        gl_FragColor = vec4(col * (0.30 + vig * 0.9), min(0.92, e * 1.25) * uFade);
      }`
  });
  const tunnel = new THREE.Mesh(geo, mat);
  tunnel.frustumCulled = false;

  const group = new THREE.Group();
  group.add(tunnel);
  group.userData.mat = mat;
  group.userData.LEN = LEN;

  // debris racing past you inside the throat
  const N = 900;
  const pos = new Float32Array(N * 3);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.2 + Math.random() * 5.6;
    pos[i*3] = Math.cos(a) * r;
    pos[i*3+1] = Math.sin(a) * r;
    pos[i*3+2] = (Math.random() - 0.5) * LEN;
    seed[i] = Math.random();
  }
  const dgeo = new THREE.BufferGeometry();
  dgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dgeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const dmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
    vertexShader: /* glsl */`
      attribute float aSeed; uniform float uTime;
      varying float vA;
      void main(){
        vec3 p = position;
        p.z = mod(p.z + uTime * 190.0 * (0.6 + aSeed), 460.0) - 230.0;
        vA = 0.5 + 0.5 * sin(aSeed * 40.0 + uTime * 3.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.5 + aSeed * 3.5) * (220.0 / max(1.0, -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float uFade; varying float vA;
      void main(){
        float r = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(vec3(0.85, 0.92, 1.0), smoothstep(0.5, 0.0, r) * vA * 0.85 * uFade);
      }`
  });
  const debris = new THREE.Points(dgeo, dmat);
  debris.frustumCulled = false;
  group.add(debris);
  group.userData.debrisMat = dmat;

  return group;
}
