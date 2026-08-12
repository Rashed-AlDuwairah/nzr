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
          gl_FragColor = vec4(vec3(0.75, 0.42, 0.17), up * side * 0.26);
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
          vec3 col = mix(vec3(0.013, 0.010, 0.009), vec3(0.026, 0.020, 0.016), grain);
          // the city's glow spilling across the sand toward the horizon
          col += vec3(0.055, 0.028, 0.011) * smoothstep(200.0, 700.0, r);
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
      uCity: { value: new THREE.Color(0xff9a44) },
      uSky:  { value: new THREE.Color(0x7f9dff) },
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
        float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.2);
        float up = clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        // the city burns low and warm behind her; the sky is a cool wash above
        float cityFace = pow(clamp(-N.z * 0.5 + 0.5, 0.0, 1.0), 1.4);
        vec3 warm = uCity * cityFace;
        vec3 light = mix(warm, uSky, smoothstep(0.45, 1.0, up) * 0.55);
        vec3 col = uBase + light * 0.035 + rim * light * 0.42 * uRim;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
}

export function buildNoura() {
  const g = new THREE.Group();
  const skin = figureMaterial(0x0a0a10, 0.9);
  const cloth = figureMaterial(0x07070d, 1.15);
  const hairMat = figureMaterial(0x030308, 1.35);

  // ---- hips and the fold of her dress on the ground
  const hips = new THREE.Mesh(new THREE.SphereGeometry(0.245, 28, 20), cloth);
  hips.scale.set(1.05, 0.66, 1.0);
  hips.position.set(0, 0.16, 0);
  g.add(hips);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.355, 0.24, 32, 1, true), cloth);
  skirt.position.set(0, 0.12, 0.03);
  g.add(skirt);

  // ---- torso, leaning back a little the way you do when you look up
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.225, 0.50, 28, 1), cloth);
  torso.position.set(0, 0.55, 0.045);
  torso.rotation.x = -0.16;
  g.add(torso);

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.195, 26, 18), cloth);
  shoulders.scale.set(1.42, 0.62, 0.80);
  shoulders.position.set(0, 0.79, 0.005);
  g.add(shoulders);

  // ---- neck and head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.075, 0.10, 16), skin);
  neck.position.set(0, 0.885, 0.015);
  g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.118, 32, 26), skin);
  head.scale.set(1.0, 1.08, 1.04);
  head.position.set(0, 1.00, 0.012);
  head.rotation.x = -0.30;              // tilted up toward the stars
  g.add(head);

  // ---- her hair: a black fall down her back
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.132, 32, 26), hairMat);
  cap.scale.set(1.02, 1.06, 1.06);
  cap.position.set(0, 1.008, 0.004);
  cap.rotation.x = -0.30;
  g.add(cap);

  const fallGeo = new THREE.CylinderGeometry(0.140, 0.215, 0.70, 30, 12, true);
  {   // sculpt it so it hugs her back and flares at the ends
    const p = fallGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const t = (v.y + 0.35) / 0.70;            // 0 at the bottom, 1 at the nape
      const back = THREE.MathUtils.clamp(v.z / 0.18, -1, 1);
      v.z += (1 - t) * 0.16 - 0.02;             // sweeps backward as it falls
      v.x *= 1.0 + (1 - t) * 0.10;
      v.z *= back > 0 ? 0.72 : 1.0;             // flatter against her back
      v.y += Math.sin(v.x * 9.0) * 0.012 * (1 - t);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    fallGeo.computeVertexNormals();
  }
  const fall = new THREE.Mesh(fallGeo, hairMat);
  fall.position.set(0, 0.70, -0.050);
  fall.rotation.x = 0.10;
  g.add(fall);

  // a few loose strands catching the city light
  for (let i = 0; i < 5; i++) {
    const a = (i / 4 - 0.5) * 1.5;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.30 + i * 0.03, 6), hairMat);
    s.position.set(Math.sin(a) * 0.14, 0.60 - i * 0.015, -0.11 + Math.cos(a) * 0.02);
    s.rotation.set(0.14, 0, Math.sin(a) * 0.28);
    g.add(s);
  }

  // ---- knees drawn up in front of her
  for (const sx of [-1, 1]) {
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.28, 6, 14), cloth);
    thigh.position.set(sx * 0.13, 0.30, -0.20);
    thigh.rotation.set(1.15, 0, sx * 0.10);
    g.add(thigh);
    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.26, 6, 12), cloth);
    shin.position.set(sx * 0.165, 0.16, -0.42);
    shin.rotation.set(0.55, 0, sx * 0.06);
    g.add(shin);
  }

  // ---- arms coming round to hold the book in her lap
  for (const sx of [-1, 1]) {
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.24, 6, 12), skin);
    upper.position.set(sx * 0.235, 0.66, -0.045);
    upper.rotation.set(0.52, 0, sx * 0.20);
    g.add(upper);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.049, 0.24, 6, 12), skin);
    fore.position.set(sx * 0.215, 0.475, -0.215);
    fore.rotation.set(1.30, 0, sx * 0.12);
    g.add(fore);
  }

  // ---- the book, open across her knees, its pages catching the sky
  const book = new THREE.Group();
  const pageMat = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `varying vec2 vUv; varying vec3 vN;
      void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vN;
      void main(){
        float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
        vec3 col = mix(vec3(0.28, 0.26, 0.24), vec3(0.62, 0.58, 0.52), edge);
        col *= 0.55 + 0.45 * clamp(vN.y, 0.0, 1.0);
        gl_FragColor = vec4(col, 1.0); }`
  });
  for (const sx of [-1, 1]) {
    const page = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.012, 0.21), pageMat);
    page.position.set(sx * 0.079, 0, 0);
    page.rotation.z = sx * -0.13;
    book.add(page);
  }
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.020, 0.215), cloth);
  book.add(spine);
  book.position.set(0, 0.395, -0.30);
  book.rotation.set(-0.62, 0, 0);
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
