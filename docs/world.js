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
      const a = 0.48 + rnd() * 0.52;
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
    // a stepped crown, the way most towers actually finish
    if (opts.step) {
      const sw = w * 0.62, sh = h * 0.10;
      g.fillRect(x + (w - sw) / 2, top - sh, sw, sh + 2);
      const sw2 = w * 0.34;
      g.fillRect(x + (w - sw2) / 2, top - sh * 1.7, sw2, sh * 0.8);
    }
    if (opts.crown) { // rooftop mast
      g.fillRect(x + w / 2 - 2, top - opts.crown, 4, opts.crown);
      g.fillStyle = 'rgba(255,70,60,0.95)';
      g.beginPath(); g.arc(x + w / 2, top - opts.crown, 4.5, 0, 7); g.fill();
    }
    // the near edge catching the haze, so towers read as volumes not cutouts
    const eg = g.createLinearGradient(x, 0, x + w, 0);
    eg.addColorStop(0,    'rgba(255,186,120,0.16)');
    eg.addColorStop(0.14, 'rgba(255,186,120,0.02)');
    eg.addColorStop(0.86, 'rgba(120,150,220,0.02)');
    eg.addColorStop(1,    'rgba(120,150,220,0.13)');
    g.fillStyle = eg;
    g.fillRect(x, top, w, h);
    windows(x, w, top, h, opts.density ?? 0.28, opts.warm ?? 1);
  }

  // ---- برج المملكة — the slab that opens into an arch, with its sky bridge
  function kingdomCentre(cx, scale) {
    const w = 196 * scale, h = 800 * scale;
    const x = cx - w / 2, top = GROUND - h;
    const legIn = w * 0.315, legOut = w * 0.685;   // the two legs of the arch
    const archFoot = top + h * 0.335;              // where the opening begins
    g.save();

    // the body: wide at the base, drawing in as it rises, then flaring out
    // again into the two horns that carry the bridge
    g.fillStyle = SIL;
    g.beginPath();
    g.moveTo(x - w * 0.030, GROUND);
    g.lineTo(x + w * 0.045, top + h * 0.50);
    g.quadraticCurveTo(x + w * 0.048, top + h * 0.19, x + w * 0.205, top + h * 0.010);
    g.lineTo(x + w * 0.330, top);
    g.lineTo(x + w * 0.670, top);
    g.quadraticCurveTo(x + w * 0.952, top + h * 0.19, x + w * 0.920, top + h * 0.50);
    g.lineTo(x + w * 1.030, GROUND);
    g.closePath();
    g.fill();
    windows(x + w * 0.05, w * 0.90, archFoot + h * 0.02, h * 0.62, 0.30);

    // cut the opening: a tall parabola between the legs
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.moveTo(x + legIn, top - h * 0.02);
    g.lineTo(x + legIn, archFoot);
    g.quadraticCurveTo(cx, archFoot + h * 0.235, x + legOut, archFoot);
    g.lineTo(x + legOut, top - h * 0.02);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'source-over';

    // the sky bridge laid across the horns
    g.fillStyle = SIL;
    g.fillRect(x + w * 0.275, top + h * 0.030, w * 0.450, h * 0.026);
    g.fillStyle = 'rgba(190,220,255,0.9)';
    for (let i = 0; i < 14; i++)
      g.fillRect(x + w * 0.295 + i * (w * 0.410 / 14), top + h * 0.038, 2.5, 3.5);

    // the blue light that traces the inside of the arch at night
    g.strokeStyle = 'rgba(120,195,255,0.6)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(x + legIn, archFoot);
    g.quadraticCurveTo(cx, archFoot + h * 0.235, x + legOut, archFoot);
    g.stroke();
    // and the vertical seams up both legs
    g.strokeStyle = 'rgba(120,195,255,0.28)';
    g.lineWidth = 2;
    for (const lx of [x + legIn, x + legOut]) {
      g.beginPath(); g.moveTo(lx, archFoot); g.lineTo(lx, top + h * 0.03); g.stroke();
    }
    // aircraft lights on both horns
    g.fillStyle = 'rgba(255,70,60,0.95)';
    for (const hx of [x + w * 0.22, x + w * 0.78]) {
      g.beginPath(); g.arc(hx, top + h * 0.012, 4, 0, 7); g.fill();
    }
    g.restore();
  }

  // ---- برج الفيصلية — the spire with its glass ball
  function faisaliah(cx, scale) {
    const w = 150 * scale, h = 720 * scale;
    const top = GROUND - h;                    // the tip of the spire
    const ballY = top + h * 0.215, br = w * 0.098;
    g.save();

    // the pyramid: four legs that curve slightly inward as they climb
    g.fillStyle = SIL;
    g.beginPath();
    g.moveTo(cx - w / 2, GROUND);
    g.quadraticCurveTo(cx - w * 0.155, top + h * 0.62, cx - w * 0.018, ballY + br * 0.55);
    g.lineTo(cx + w * 0.018, ballY + br * 0.55);
    g.quadraticCurveTo(cx + w * 0.155, top + h * 0.62, cx + w / 2, GROUND);
    g.closePath(); g.fill();
    windows(cx - w * 0.30, w * 0.60, GROUND - h * 0.55, h * 0.55, 0.20);

    // the two inner legs, so it reads as a frame and not a solid wedge
    g.strokeStyle = 'rgba(150,190,240,0.22)';
    g.lineWidth = 2;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + s * w * 0.28, GROUND);
      g.quadraticCurveTo(cx + s * w * 0.10, top + h * 0.55, cx, ballY + br);
      g.stroke();
    }

    // the glass ball
    g.fillStyle = SIL;
    g.beginPath(); g.arc(cx, ballY, br, 0, 7); g.fill();
    g.fillStyle = 'rgba(200,230,255,0.34)';
    g.beginPath(); g.arc(cx, ballY, br * 0.86, 0, 7); g.fill();
    g.fillStyle = 'rgba(235,248,255,0.85)';
    g.beginPath(); g.arc(cx - br * 0.30, ballY - br * 0.28, br * 0.26, 0, 7); g.fill();

    // the spire above it
    g.fillStyle = SIL;
    g.beginPath();
    g.moveTo(cx - w * 0.026, ballY - br * 0.55);
    g.lineTo(cx, top);
    g.lineTo(cx + w * 0.026, ballY - br * 0.55);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,80,60,0.95)';
    g.beginPath(); g.arc(cx, top + 4, 3.5, 0, 7); g.fill();
    g.restore();
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
  block(C - 1060, 74, 470, { density: 0.30, taper: 0.06, crown: 30 });
  block(C - 900,  58, 380, { density: 0.26, step: 1 });
  block(C - 790,  46, 300, { density: 0.24 });
  pifTower(C - 640, 1.0);
  block(C - 500,  70, 430, { density: 0.28, taper: 0.09, step: 1 });
  block(C - 380,  50, 330, { density: 0.24 });
  kingdomCentre(C - 170, 1.0);
  block(C + 90,   58, 360, { density: 0.26, crown: 24 });
  block(C + 185,  44, 280, { density: 0.24 });
  faisaliah(C + 380, 1.0);
  block(C + 570,  74, 420, { density: 0.30, taper: 0.08, step: 1 });
  block(C + 700,  50, 340, { density: 0.24 });
  block(C + 810,  56, 520, { density: 0.24, crown: 34 });
  block(C + 940,  90, 320, { density: 0.30, step: 1 });
  // a second cluster, far to the other side
  block(C + 1700, 66, 420, { density: 0.24, taper: 0.07, crown: 26, step: 1 });
  block(C + 1850, 50, 340, { density: 0.22 });
  block(C - 1700, 72, 400, { density: 0.24, taper: 0.06, step: 1 });
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
        col = mix(col, vec3(0.26, 0.16, 0.09), smoothstep(0.32, 0.0, vUv.y) * 0.72);
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
// A body at night is a silhouette with a rim on it — not a grey model under
// a lamp. The interior stays almost black so the eye reads the shape, and all
// the information lives in two thin edges: the city burning behind her, and
// the sky sitting on her shoulders. This is the whole art direction of the
// piece, so the dome uses it too.
function figureMaterial(baseHex, rimBoost = 1.0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: new THREE.Color(baseHex) },
      uWarm: { value: new THREE.Color(0xff9a4e) },   // the city, low and behind
      uCool: { value: new THREE.Color(0x9db4d6) },   // starlight, from above
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
      uniform vec3 uBase, uWarm, uCool; uniform float uRim;
      varying vec3 vN, vWP;
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vWP);
        float f = 1.0 - clamp(dot(N, V), 0.0, 1.0);

        // a thin, bright edge — the exponent is what keeps it an edge and
        // not a wash across the whole body
        float rim = pow(f, 3.4);
        float halo = pow(f, 1.7) * 0.10;

        // which way the edge faces decides its colour
        float up   = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        float back = pow(clamp(-N.z * 0.5 + 0.5, 0.0, 1.0), 2.0);

        vec3 col = uBase;
        col += uWarm * rim * back * 1.05 * uRim;
        col += uCool * rim * pow(up, 1.4) * 0.72 * uRim;
        col += (uWarm * 0.5 + uCool * 0.5) * halo * uRim;
        col += uCool * pow(up, 3.0) * 0.035;      // the faintest top light

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
  const skin  = figureMaterial(0x07080d, 1.15);
  const cloth = figureMaterial(0x05060b, 1.00);
  const hairMat = figureMaterial(0x030408, 1.45);

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
  // A fullscreen quad in front of the camera, raymarched. A tunnel made of
  // geometry can only ever be a painted cylinder; marched, it has depth you
  // can fall into, the walls occlude each other, and the throat can twist.
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, transparent: true,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uRes: { value: new THREE.Vector2(1, 1) } },
    vertexShader: `varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime, uFade; uniform vec2 uRes;
      varying vec2 vUv;
      #define PI 3.14159265

      float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n3(vec3 p){
        vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z);
      }
      float fbm(vec3 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++){ v += a * n3(p); p = p * 2.03 + 5.7; a *= 0.5; }
        return v;
      }

      // the throat wanders, so it is never a straight pipe
      // the wander must stay well inside the radius or the camera falls out of
      // its own tunnel and half the screen goes empty
      vec2 centre(float z){
        return vec2(sin(z * 0.055 + uTime * 0.35) * 0.9 + sin(z * 0.017) * 1.1,
                    cos(z * 0.047 - uTime * 0.30) * 0.8 + cos(z * 0.021) * 1.0);
      }
      float radius(float z){ return 5.4 + sin(z * 0.038 + uTime * 0.5) * 0.6; }

      void main(){
        vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
        vec3 ro = vec3(0.0, 0.0, uTime * 30.0);
        vec3 rd = normalize(vec3(uv * 1.25, 1.0));

        // march until the ray leaves the throat: that crossing IS the wall,
        // and because it is a real hit the streaks converge in perspective
        float t = 0.2, hit = -1.0;
        for (int i = 0; i < 78; i++){
          vec3 p = ro + rd * t;
          float d = radius(p.z) - length(p.xy - centre(p.z));   // >0 while inside
          if (d < 0.03) { hit = t; break; }
          t += max(0.22, d * 0.62);
          if (t > 120.0) break;
        }

        vec3 col = vec3(0.0);
        if (hit > 0.0) {
          vec3 p = ro + rd * hit;
          vec2 rel = p.xy - centre(p.z);
          float ang = atan(rel.y, rel.x);

          // filaments: fine around the throat, stretched along the fall
          float band = fbm(vec3(ang * 4.0, p.z * 0.55 - uTime * 9.0, 1.7));
          float fine = fbm(vec3(ang * 13.0, p.z * 1.7 - uTime * 22.0, 4.3));
          float grit = fbm(vec3(ang * 30.0, p.z * 3.4 - uTime * 38.0, 8.1));
          float e = pow(band, 2.2) * 0.55 + pow(fine, 3.0) * 1.35 + pow(grit, 5.0) * 2.2;

          // depth: the far wall dims, so the centre reads as distance
          // near wall dark, far wall bright: that ordering is what makes the
          // eye travel down the tunnel instead of sitting on the surface
          float fog  = 1.0 / (1.0 + hit * hit * 0.0016);
          float near = smoothstep(2.0, 16.0, hit);

          float depth = clamp(hit / 70.0, 0.0, 1.0);
          vec3 tint = mix(vec3(0.30, 0.09, 0.62), vec3(0.14, 0.60, 1.00), smoothstep(0.05, 0.40, depth));
          tint = mix(tint, vec3(1.00, 0.72, 0.34), smoothstep(0.45, 0.95, depth));

          col = tint * e * fog * near * 1.9;
        } else {
          // no wall within reach: this is the far mouth, and it should read as
          // light at the end rather than a hole cut in the middle of the frame
          col += vec3(1.0, 0.84, 0.58) * 0.26;
        }

        // and the mouth itself, tight
        float m = exp(-length(uv) * 6.0);
        col += vec3(1.0, 0.90, 0.74) * m * 0.42;

        // a few sparks tearing past the lens
        float sp = pow(fbm(vec3(uv * 34.0, uTime * 9.0)), 9.0) * 9.0;
        col += vec3(0.95, 0.95, 1.0) * sp;

        col *= uFade;
        col = col / (1.0 + col * 0.85);        // hold the highlights together
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  quad.renderOrder = -5;
  g.add(quad);
  g.userData.mat = mat;
  g.userData.debrisMat = mat;    // one material now; the old rig expected two
  return g;
}

// ------------------------------------------------------------------
//  الأرض — the real one
//
//  Procedural continents always read as noise, because they are. These
//  are the NASA Blue Marble plates that ship with the three.js examples:
//  daylight, night lights, cloud cover and a normal map. The shader does
//  the parts a texture cannot — the terminator, the cloud shadow, the
//  city glow bleeding past the day/night line, and a rim of atmosphere
//  that reddens where the sun grazes it.
// ------------------------------------------------------------------
export function buildEarth(loader) {
  const g = new THREE.Group();
  const R = 60;
  const tex = (f, srgb) => {
    const t = loader.load('./tex/' + f);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };

  const uniforms = {
    uDay:    { value: tex('earth_day.jpg', true) },
    uNight:  { value: tex('earth_night.jpg', true) },
    uBRC:    { value: tex('earth_brc.jpg', false) },   // bump / roughness / clouds
    uNormal: { value: tex('earth_normal.jpg', false) },
    // aimed so that the meridian turned towards the camera is in darkness and
    // the day is a crescent at the limb — she is arriving at her own night
    uSun:    { value: new THREE.Vector3(0.80, 0.17, -0.58).normalize() },
    uMark:   { value: new THREE.Vector3(0, 0, 1) },
    uTime:   { value: 0 },
    uMarkOn: { value: 0 },
  };

  const globe = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 80),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: /* glsl */`
        varying vec3 vN, vNw, vP; varying vec2 vUv;
        void main(){
          vUv = uv;
          vN = normalize(normal);                       // object space: map + marker
          vNw = normalize(mat3(modelMatrix) * normal);  // world space: the sun
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vP = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uDay, uNight, uBRC, uNormal;
        uniform vec3 uSun, uMark; uniform float uTime, uMarkOn;
        varying vec3 vN, vNw, vP; varying vec2 vUv;

        void main(){
          vec3 N = normalize(vN);          // object space
          vec3 W = normalize(vNw);         // world space — the sun does not spin with her
          vec3 L = normalize(uSun);

          // perturb the normal with the terrain map so mountains catch the light
          vec3 nm = texture2D(uNormal, vUv).xyz * 2.0 - 1.0;
          vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), W));
          vec3 B = cross(W, T);
          vec3 Np = normalize(W + (T * nm.x + B * nm.y) * 0.35);

          float lam  = dot(Np, L);
          float lamG = dot(W,  L);
          float day  = smoothstep(-0.09, 0.22, lam);
          float term = smoothstep(-0.25, 0.15, lamG);      // the soft terminator band

          vec3 dayCol   = texture2D(uDay, vUv).rgb;
          vec3 nightCol = texture2D(uNight, vUv).rgb;

          // clouds ride slightly ahead of the surface and cast their own shade
          vec2 cuv = vUv + vec2(uTime * 0.0016, 0.0);
          float cloud = texture2D(uBRC, cuv).b;
          float shade = texture2D(uBRC, cuv + L.xy * 0.004).b;

          vec3 lit = dayCol * (0.06 + max(lam, 0.0) * 1.28);
          lit = mix(lit, lit * 0.72, shade * 0.55 * day);
          lit += vec3(1.0, 0.99, 0.96) * cloud * (0.05 + max(lamG, 0.0) * 1.05);

          // the night side is city light, and it leaks a little past the line
          vec3 dark = nightCol * vec3(1.0, 0.82, 0.52) * 2.35 * (1.0 - term);

          vec3 col = lit * term + dark;

          // where she is standing: a core, a halo, and a ring opening outward,
          // so the eye finds her on a planet covered in other people's lights
          float d = distance(N, normalize(uMark));
          float core = exp(-d * d * 1600.0);
          float halo = exp(-d * d * 130.0);
          float ph   = fract(uTime * 0.42);
          float ring = exp(-pow((d - ph * 0.20) * 46.0, 2.0)) * (1.0 - ph);
          col += vec3(1.0, 0.80, 0.48) * uMarkOn *
                 (core * 5.0 + halo * 0.55 + ring * 0.9);

          gl_FragColor = vec4(col, 1.0);
        }`
    }));
  g.add(globe);

  // atmosphere: a shell that thickens at the limb and reddens near the terminator
  const air = new THREE.Mesh(new THREE.SphereGeometry(R * 1.032, 96, 56),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uSun: uniforms.uSun },
      vertexShader: `varying vec3 vN, vV;
        void main(){ vN = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vV = normalize(wp.xyz - cameraPosition);
          gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSun; varying vec3 vN, vV;
        void main(){
          float f = pow(clamp(1.0 + dot(vV, normalize(vN)), 0.0, 1.0), 2.4);
          float s = dot(normalize(vN), normalize(uSun));
          float lit = smoothstep(-0.45, 0.55, s);
          // Rayleigh blue overhead, a sunset red where the light grazes
          vec3 blue = vec3(0.16, 0.38, 0.86);
          vec3 fire = vec3(1.00, 0.42, 0.16);
          float graze = smoothstep(0.36, 0.0, abs(s)) * lit;
          vec3 c = mix(blue, fire, graze * 0.85);
          gl_FragColor = vec4(c, f * (0.16 + lit * 0.72));
        }`
    }));
  g.add(air);

  g.userData = { globe, air, R, uniforms };
  return g;
}

// ------------------------------------------------------------------
//  المرصد — the dome she walks into
//
//  A drum, a hemisphere, and one shutter cut out of it, standing on a
//  low plinth. The seam glows the same ember as the rest of her sky.
// ------------------------------------------------------------------
export function buildObservatory() {
  // Built the way it is photographed at night: a black shape with light
  // escaping from three places — the bearing seam, the shutter, and the door.
  // No lamp, no grey. The silhouette does the work.
  const g = new THREE.Group();
  const shell = figureMaterial(0x05060c, 0.85);
  const glow = (hex, o) => new THREE.MeshBasicMaterial({
    color: hex, transparent: true, opacity: o,
    blending: THREE.AdditiveBlending, depthWrite: false });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.34, 0.26, 64), shell);
  plinth.position.y = 0.13; g.add(plinth);

  // a real dome sits on a drum about as tall as the dome is high, not on a saucer
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.92, 1.98, 2.35, 64, 1, true), shell);
  drum.position.y = 1.44; g.add(drum);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.94, 72, 36, 0.30, Math.PI * 2 - 0.60, 0, Math.PI / 2), shell);
  dome.position.y = 2.60; g.add(dome);

  // the seam where the dome turns on the drum: the brightest line on the building
  const seam = new THREE.Mesh(new THREE.TorusGeometry(1.97, 0.015, 8, 128),
    new THREE.MeshBasicMaterial({ color: 0xffcf95 }));
  seam.rotation.x = Math.PI / 2; seam.position.y = 2.60; g.add(seam);
  const seamGlow = new THREE.Mesh(new THREE.TorusGeometry(1.97, 0.085, 8, 96), glow(0xffb765, 0.26));
  seamGlow.rotation.x = Math.PI / 2; seamGlow.position.y = 2.60; g.add(seamGlow);

  // the shutter: an opening onto the sky, with the tube leaning out of it
  const slit = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.95),
    new THREE.MeshBasicMaterial({ color: 0x04060c, side: THREE.DoubleSide }));
  slit.position.set(0, 3.16, 1.58); slit.rotation.x = -0.46; g.add(slit);

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 2.5, 32), shell);
  tube.position.set(0, 3.18, 0.78); tube.rotation.x = 1.02; g.add(tube);

  // the door: a warm slot, brightest at the threshold
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 1.15),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: `varying vec2 v; void main(){ v = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 v;
        void main(){
          float up = smoothstep(1.0, 0.02, v.y);
          float side = smoothstep(0.0, 0.13, v.x) * smoothstep(1.0, 0.87, v.x);
          vec3 c = mix(vec3(1.0,0.63,0.26), vec3(1.0,0.88,0.68), up);
          gl_FragColor = vec4(c, (0.22 + up * 0.70) * side);
        }`
    }));
  door.position.set(0, 0.86, 1.99); g.add(door);

  const spill = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.4),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 v; void main(){ v = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec2 v;
        void main(){
          float d = pow(smoothstep(1.0, 0.0, v.y), 1.6);
          float w = smoothstep(0.0, 0.36, v.x) * smoothstep(1.0, 0.64, v.x);
          gl_FragColor = vec4(vec3(1.0,0.66,0.30), d * w * 0.17);
        }`
    }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.012, 3.2); g.add(spill);

  // a few lit windows around the drum, uneven the way a real building is
  for (let i = 0; i < 9; i++) {
    if (Math.random() < 0.3) continue;
    const a = (i / 9) * Math.PI * 2 + 0.25;
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.3),
      glow(0xffcf95, 0.20 + Math.random() * 0.3));
    const wy = 1.55 + (i % 2) * 0.62;
    w.position.set(Math.sin(a) * 1.95, wy, Math.cos(a) * 1.95);
    w.lookAt(Math.sin(a) * 9, wy, Math.cos(a) * 9);
    g.add(w);
  }

  g.userData = { door };
  return g;
}
