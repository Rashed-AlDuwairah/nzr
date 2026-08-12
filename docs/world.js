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

export function buildNoura() {
  const g = new THREE.Group();
  const skin  = figureMaterial(0x14141d, 0.95);
  // the dress carries a little light so her black hair reads against it
  const cloth = figureMaterial(0x191a28, 1.15);
  const hairMat = figureMaterial(0x040407, 1.75);

  // She stands about 1.62 tall, barefoot on the warm sand.

  // ---- feet, just showing under the hem
  for (const sx of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), skin);
    foot.scale.set(1.0, 0.62, 1.5);
    foot.position.set(sx * 0.075, 0.038, -0.015);
    g.add(foot);
  }

  // ---- the long dress, from shoulder to ankle, flaring as it falls
  const dressGeo = new THREE.CylinderGeometry(0.180, 0.272, 1.20, 40, 20, true);
  {
    const p = dressGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const t = (v.y + 0.60) / 1.20;              // 0 at the hem, 1 at the shoulder
      // a waist, and soft folds that deepen toward the hem
      const waist = 1.0 - 0.14 * Math.exp(-Math.pow((t - 0.62) * 4.4, 2.0));
      const ang = Math.atan2(v.z, v.x);
      const folds = 1.0 + Math.sin(ang * 7.0) * 0.030 * Math.pow(1 - t, 1.5)
                        + Math.sin(ang * 13.0 + 1.7) * 0.016 * Math.pow(1 - t, 2.0);
      v.x *= waist * folds;
      v.z *= waist * folds;
      v.y += Math.sin(ang * 7.0) * 0.020 * Math.pow(1 - t, 2.2);   // uneven hem
      p.setXYZ(i, v.x, v.y, v.z);
    }
    dressGeo.computeVertexNormals();
  }
  const dress = new THREE.Mesh(dressGeo, cloth);
  dress.position.set(0, 0.68, 0);
  g.add(dress);

  // ---- shoulders, neck, head — tilted back to look up
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.175, 28, 20), cloth);
  shoulders.scale.set(1.30, 0.60, 0.82);
  shoulders.position.set(0, 1.295, 0);
  g.add(shoulders);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.10, 18), skin);
  neck.position.set(0, 1.365, 0.006);
  neck.rotation.x = -0.16;
  g.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.104, 34, 28), skin);
  head.scale.set(1.0, 1.10, 1.04);
  head.position.set(0, 1.470, 0.004);
  head.rotation.x = -0.34;
  g.add(head);

  // ---- her hair: black, past the shoulder blades
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.113, 34, 28), hairMat);
  cap.scale.set(1.04, 1.07, 1.10);
  cap.position.set(0, 1.474, -0.012);
  cap.rotation.x = -0.34;
  g.add(cap);

  // narrower than her shoulders, or it reads as a cape instead of hair
  const fallGeo = new THREE.CylinderGeometry(0.118, 0.142, 0.66, 32, 22, true);
  {
    const p = fallGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const t = (v.y + 0.33) / 0.66;              // 0 at the ends, 1 at the nape
      const ang = Math.atan2(v.z, v.x);
      v.z += (1 - t) * 0.030 - 0.006;             // drifts back as it falls
      if (v.z > 0) v.z *= 0.42;                   // lies flat against her back
      v.x *= 1.0 + Math.pow(1 - t, 2.0) * 0.10;
      // the ends part into strands instead of a straight hem
      v.y += Math.sin(ang * 5.0) * 0.050 * Math.pow(1 - t, 1.6)
           - Math.pow(1 - t, 3.0) * 0.055;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    fallGeo.computeVertexNormals();
  }
  const fall = new THREE.Mesh(fallGeo, hairMat);
  fall.position.set(0, 1.100, -0.052);
  fall.rotation.x = 0.05;
  g.add(fall);

  for (let i = 0; i < 7; i++) {                    // loose strands
    const a = (i / 6 - 0.5) * 1.5;
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.003, 0.24 + (i % 3) * 0.06, 6), hairMat);
    s.position.set(Math.sin(a) * 0.098, 0.930 - (i % 3) * 0.028, -0.082 + Math.cos(a) * 0.016);
    s.rotation.set(0.05, 0, Math.sin(a) * 0.22);
    g.add(s);
  }

  // ---- arms hanging at her sides
  for (const sx of [-1, 1]) {
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.046, 0.24, 6, 14), cloth);
    upper.position.set(sx * 0.205, 1.155, 0.004);
    upper.rotation.set(0.03, 0, sx * 0.075);
    g.add(upper);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.040, 0.235, 6, 14), skin);
    // the right forearm swings a little forward, carrying the book
    fore.position.set(sx * 0.228, 0.905, sx > 0 ? -0.055 : 0.004);
    fore.rotation.set(sx > 0 ? -0.26 : 0.02, 0, sx * 0.05);
    g.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 12), skin);
    hand.scale.set(0.85, 1.15, 0.62);
    hand.position.set(sx * 0.238, 0.775, sx > 0 ? -0.088 : 0.004);
    g.add(hand);
  }

  // ---- the book, closed, carried against her hip
  const book = new THREE.Group();
  const coverMat = figureMaterial(0x0d0b12, 1.35);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.225, 0.040), coverMat);
  book.add(cover);
  // the page block, catching what light there is
  const pages = new THREE.Mesh(
    new THREE.BoxGeometry(0.140, 0.205, 0.030),
    new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader: `varying vec3 vN; varying vec2 vUv;
        void main(){ vN = normalize(mat3(modelMatrix) * normal); vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vN; varying vec2 vUv;
        void main(){
          float lines = 0.82 + 0.18 * sin(vUv.y * 190.0);   // the stacked page edges
          vec3 col = vec3(0.40, 0.37, 0.33) * lines;
          col *= 0.45 + 0.55 * clamp(vN.y * 0.5 + 0.5, 0.0, 1.0);
          gl_FragColor = vec4(col, 1.0); }`
    })
  );
  pages.position.z = 0.006;
  book.add(pages);
  book.position.set(0.262, 0.745, -0.092);
  book.rotation.set(0.20, 0.16, 0.10);
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
