// ============================================================
//  سماء ليلتها الأولى — Riyadh, 13 / 8 / 2005, 21:00
//  A real planetarium: every star where it truly was that night.
// ============================================================
import * as THREE from 'three';

const R = 1000; // celestial sphere radius

function dirFromAzAlt(azDeg, altDeg) {
  const az = THREE.MathUtils.degToRad(azDeg);
  const alt = THREE.MathUtils.degToRad(altDeg);
  // az 0 = North (-Z), 90 = East (+X)
  return new THREE.Vector3(
    Math.sin(az) * Math.cos(alt),
    Math.sin(alt),
    -Math.cos(az) * Math.cos(alt)
  );
}

function starColor(ci) {
  // B-V colour index -> approximate tint
  if (ci < 0.0)  return [0.67, 0.78, 1.00];
  if (ci < 0.3)  return [0.82, 0.88, 1.00];
  if (ci < 0.6)  return [1.00, 0.98, 0.94];
  if (ci < 0.9)  return [1.00, 0.93, 0.78];
  if (ci < 1.3)  return [1.00, 0.85, 0.62];
  return [1.00, 0.76, 0.52];
}

const NOISE = /* glsl */`
  float hash31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 p){
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i+vec3(1,0,0)), f.x),
          mix(hash31(i+vec3(0,1,0)), hash31(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i+vec3(0,0,1)), hash31(i+vec3(1,0,1)), f.x),
          mix(hash31(i+vec3(0,1,1)), hash31(i+vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p){
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++){ v += a * vnoise(p); p = p * 2.03 + vec3(9.4); a *= 0.5; }
    return v;
  }
`;

// the 21 reasons — each one a golden star in her real sky
export const REASONS = [
  'لأنَّ ضحكتَكِ تُشبِهُ بدايةَ كلِّ شيءٍ جميل',
  'لأنَّكِ تسمعينَ ما لا أقولُه',
  'لأنَّ اسمَكِ وحدَهُ يُضيءُ يومي',
  'لأنَّ صوتَكِ أهدأُ مكانٍ في العالم',
  'لأنَّكِ تجعلينَ العاديَّ حكاية',
  'لأنَّ غيرتَكِ الصغيرةَ ألطفُ ما رأيت',
  'لأنَّكِ قلبٌ يتَّسعُ لي كلَّما ضاقَ العالم',
  'لأنَّ عنادَكِ نفسَهُ صارَ يُعجِبُني',
  'لأنَّكِ أوَّلُ مَن أُريدُ إخبارَهُ بكلِّ شيء',
  'لأنَّ وجودَكِ يجعلُ الصمتَ مريحًا',
  'لأنَّكِ تكبرينَ في عيني كلَّ يوم',
  'لأنَّ يدَكِ في يدي خريطتي الوحيدة',
  'لأنَّكِ وُلدتِ في ليلةٍ تُمطرُ فيها السماءُ شهبًا حقيقية',
  'لأنَّ حزنَكِ يوجعُني أكثرَ من حزني',
  'لأنَّكِ تؤمنينَ بي أكثرَ ممّا أومنُ بنفسي',
  'لأنَّ صباحاتِكِ تُشبِهُ ضوءَ أوَّلِ النهار',
  'لأنَّكِ جعلتِ للانتظارِ معنًى',
  'لأنَّ قلبي عرفَكِ من قبلِ أن أعرفَكِ',
  'لأنَّكِ نصفي الأصدق',
  'لأنَّ معكِ صارَ للمستقبلِ وجه',
  'لأنَّكِ نُورة… ويكفي',
];

// original Arabic names of the brightest stars overhead that night
const ARABIC_NAMES = {
  Vega: 'النَّسْرُ الواقِع', Altair: 'النَّسْرُ الطائِر', Deneb: 'ذَنَبُ الدَّجاجة',
  Antares: 'قَلْبُ العَقْرَب', Arcturus: 'السِّماكُ الرامِح', Polaris: 'النَّجْمُ القُطْبِيّ',
  Spica: 'السِّماكُ الأَعْزَل', Alphecca: 'الفَكَّة', Rasalhague: 'رَأْسُ الحَوَّاء',
  Shaula: 'الشَّوْلَة', Enif: 'أَنْفُ الفَرَس', Fomalhaut: 'فَمُ الحُوت',
};

export class SkyNight {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.ready = false;
    this.entered = false;
    this.yaw = Math.PI;         // start facing south (Antares / galactic core)
    this.pitch = 0.35;
    this.yawV = 0; this.pitchV = 0;
    this.fov = 60;
    this.meteors = [];
    this.memStars = [];
    this.collected = new Set(JSON.parse(localStorage.getItem('noor_sky_mem') || '[]'));
    this.wishes = +(localStorage.getItem('noor_sky_wishes') || 0);
    this.meteorClock = 2.5;
    this.labelEls = [];
    this.converged = false;
    this.convergeT = -1;
    this.gyro = null;
  }

  async load() {
    const data = await (await fetch('./sky2005.json')).json();
    this.data = data;
    this.build(data);
    this.ready = true;
  }

  build(d) {
    // ---------- night background: real milky way + desert horizon
    const gp = dirFromAzAlt(d.galaxy.poleAz, d.galaxy.poleAlt);
    const gc = dirFromAzAlt(d.galaxy.centerAz, d.galaxy.centerAlt);
    this.bgMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPole: { value: gp },
        uCore: { value: gc },
      },
      vertexShader: `varying vec3 vDir;
        void main(){ vDir = position;
        gl_Position = (projectionMatrix * modelViewMatrix * vec4(position,1.0)).xyww; }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uPole, uCore;
        varying vec3 vDir;
        ${NOISE}
        void main(){
          vec3 dn = normalize(vDir);
          vec3 col = vec3(0.006, 0.008, 0.016);
          // real milky way band, brightest toward the galactic core
          float band = exp(-pow(dot(dn, uPole), 2.0) * 26.0);
          float coreBoost = 0.45 + 0.9 * pow(clamp(dot(dn, uCore), 0.0, 1.0), 2.0);
          float cloud = fbm(dn * 5.0 + vec3(2.7)) * 0.7 + fbm(dn * 12.0) * 0.3;
          float rift = smoothstep(0.30, 0.55, fbm(dn * 7.0 + vec3(8.1))); // dark dust lane
          vec3 mw = mix(vec3(0.12, 0.12, 0.17), vec3(0.20, 0.17, 0.20), cloud);
          col += band * mw * cloud * coreBoost * (0.35 + 0.65 * rift) * 1.6;
          // gentle airglow gradient
          col += vec3(0.010, 0.012, 0.022) * (1.0 - abs(dn.y));
          // dense faint background stars (below naked-eye limit)
          vec3 sp = dn * 380.0;
          vec3 sid = floor(sp), sf = fract(sp);
          vec3 spos = vec3(hash31(sid), hash31(sid + 3.1), hash31(sid + 7.7)) * 0.7 + 0.15;
          float sd = length(sf - spos);
          float sel = step(0.972, hash31(sid + 11.3));
          col += smoothstep(0.09, 0.0, sd) * sel * 0.16 * vec3(0.8, 0.85, 1.0) * step(0.012, dn.y);
          // desert ground below the horizon
          float ground = smoothstep(0.012, -0.02, dn.y);
          vec3 gcol = vec3(0.012, 0.008, 0.007) + fbm(dn * 40.0) * 0.008;
          col = mix(col, gcol, ground);
          // warm city glow hugging the horizon
          float hz = exp(-abs(dn.y) * 26.0);
          col += hz * vec3(0.055, 0.030, 0.012) * (1.0 - ground * 0.4);
          gl_FragColor = vec4(col, 1.0);
        }`
    });
    const bg = new THREE.Mesh(new THREE.SphereGeometry(R * 3, 48, 32), this.bgMat);
    bg.frustumCulled = false;
    bg.renderOrder = -9;
    this.group.add(bg);

    // ---------- the real stars
    const n = d.stars.length;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const phase = new Float32Array(n);
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const [az, alt, mag, ci] = d.stars[i];
      v.copy(dirFromAzAlt(az, alt)).multiplyScalar(R);
      pos[i*3] = v.x; pos[i*3+1] = v.y; pos[i*3+2] = v.z;
      const c = starColor(ci);
      const boost = mag < 1.5 ? 1.15 : 1.0;
      col[i*3] = c[0]*boost; col[i*3+1] = c[1]*boost; col[i*3+2] = c[2]*boost;
      size[i] = Math.max(0.9, (6.6 - mag)) * 0.62;
      phase[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    this.starMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: /* glsl */`
        attribute vec3 aColor; attribute float aSize, aPhase;
        uniform float uTime;
        varying vec3 vColor; varying float vTw;
        void main(){
          vColor = aColor;
          vTw = 0.78 + 0.22 * sin(uTime * (1.2 + aPhase) + aPhase * 20.0);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * vTw * 3.3;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vColor; varying float vTw;
        void main(){
          float r = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.06, r);
          a += smoothstep(0.14, 0.0, r) * 0.9;
          gl_FragColor = vec4(vColor * vTw, a * 0.9);
        }`
    });
    const stars = new THREE.Points(geo, this.starMat);
    stars.frustumCulled = false;
    this.group.add(stars);

    // ---------- constellation lines
    const lpos = [];
    for (const line of d.lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = dirFromAzAlt(line[i][0], line[i][1]).multiplyScalar(R * 0.995);
        const b = dirFromAzAlt(line[i+1][0], line[i+1][1]).multiplyScalar(R * 0.995);
        lpos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lpos), 3));
    const lmat = new THREE.LineBasicMaterial({
      color: 0x8fa8dd, transparent: true, opacity: 0.10,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.constLines = new THREE.LineSegments(lgeo, lmat);
    this.constLines.frustumCulled = false;
    this.group.add(this.constLines);

    // ---------- the moon, in its true phase (57% waxing gibbous)
    const mdir = dirFromAzAlt(d.moon.az, d.moon.alt);
    const moonSize = 34; // ~2x real angular size, cinematic
    const moonMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: {
        uPhase: { value: THREE.MathUtils.degToRad(d.moon.phaseAngle) },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uPhase; varying vec2 vUv;
        ${NOISE}
        void main(){
          float r2 = dot(vUv, vUv);
          if (r2 > 1.0) discard;
          vec3 N = vec3(vUv.x, vUv.y, sqrt(1.0 - r2));
          // sun direction from phase angle (0 = new, PI = full)
          vec3 L = normalize(vec3(-sin(uPhase), 0.12, -cos(uPhase)));
          float lit = clamp(dot(N, L) * 1.6 + 0.05, 0.0, 1.0);
          float maria = fbm(N * 5.5 + vec3(3.3));
          vec3 surf = mix(vec3(0.86, 0.85, 0.80), vec3(0.55, 0.55, 0.53), smoothstep(0.45, 0.7, maria));
          float edge = smoothstep(1.0, 0.86, r2);
          vec3 col = surf * (lit * 0.95 + 0.012);
          gl_FragColor = vec4(col, edge);
        }`
    });
    const moon = new THREE.Mesh(new THREE.PlaneGeometry(moonSize, moonSize), moonMat);
    moon.position.copy(mdir).multiplyScalar(R * 0.9);
    moon.lookAt(0, 0, 0);
    this.group.add(moon);
    // soft halo
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(moonSize * 4.4, moonSize * 4.4),
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec2 vUv;
          void main(){ float d = length(vUv);
          gl_FragColor = vec4(vec3(0.75, 0.78, 0.85), exp(-d * 4.4) * 0.5); }`
      })
    );
    halo.position.copy(mdir).multiplyScalar(R * 0.92);
    halo.lookAt(0, 0, 0);
    this.group.add(halo);

    // ---------- jupiter, setting in the west
    const jdir = dirFromAzAlt(d.jupiter.az, d.jupiter.alt);
    const jup = new THREE.Sprite(new THREE.SpriteMaterial({
      map: discTexture('#fff3dc'), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    jup.position.copy(jdir).multiplyScalar(R * 0.95);
    jup.scale.setScalar(9);
    this.group.add(jup);
    this.jupiterPos = jup.position.clone();

    // ---------- perseid radiant
    this.radiantDir = dirFromAzAlt(d.radiant.az, d.radiant.alt);

    // ---------- meteor pool
    const mgeo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < 14; i++) {
      const mat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uAlpha: { value: 0 }, uGold: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */`
          uniform float uAlpha, uGold; varying vec2 vUv;
          void main(){
            float head = smoothstep(0.0, 0.92, vUv.x);
            float core = exp(-pow((vUv.y - 0.5) * 5.2, 2.0));
            vec3 c = mix(mix(vec3(0.55, 0.75, 1.0), vec3(1.0), head),
                         mix(vec3(1.0, 0.75, 0.3), vec3(1.0, 0.95, 0.7), head), uGold);
            gl_FragColor = vec4(c, head * head * core * uAlpha);
          }`
      });
      const m = new THREE.Mesh(mgeo, mat);
      m.visible = false; m.frustumCulled = false;
      this.group.add(m);
      this.meteors.push({ mesh: m, life: 0, dur: 1, dir: new THREE.Vector3(), tan: new THREE.Vector3(), speed: 0, caught: false });
    }

    // ---------- 21 golden memory stars
    const golden = [];
    let seed = 13.8;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 21; i++) {
      const az = (i * 360 / 21 + rnd() * 14 - 7 + 8) % 360;
      const alt = 16 + rnd() * 48;
      golden.push([az, alt]);
    }
    const gTex = discTexture('#ffe2a8');
    for (let i = 0; i < 21; i++) {
      const dir = dirFromAzAlt(golden[i][0], golden[i][1]);
      // keep clear of the moon
      if (dir.angleTo(dirFromAzAlt(d.moon.az, d.moon.alt)) < 0.12) dir.applyAxisAngle(new THREE.Vector3(0,1,0), 0.2);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: gTex, transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0xffd98f,
      }));
      sp.position.copy(dir).multiplyScalar(R * 0.97);
      sp.scale.setScalar(11);
      this.group.add(sp);
      this.memStars.push({ sprite: sp, idx: i, collected: this.collected.has(i), pulse: Math.random() * 6, home: sp.position.clone() });
      if (this.collected.has(i)) { sp.material.color.set(0x9fb4d8); sp.scale.setScalar(6); }
    }

    // ---------- star labels (original Arabic names)
    const labelHost = document.getElementById('labels');
    this.namedStars = [];
    for (const s of this.data.named) {
      const ar = ARABIC_NAMES[s.n];
      if (!ar || s.alt < 5) continue;
      const el = document.createElement('div');
      el.className = 'starLabel';
      el.textContent = ar;
      labelHost.appendChild(el);
      this.namedStars.push({ el, pos: dirFromAzAlt(s.az, s.alt).multiplyScalar(R * 0.98) });
    }
    const jl = document.createElement('div');
    jl.className = 'starLabel jup';
    jl.textContent = 'المُشتري';
    labelHost.appendChild(jl);
    this.namedStars.push({ el: jl, pos: this.jupiterPos });

    // ---------- «نجمة نورة» — appears when all 21 are found
    this.nooraStar = new THREE.Sprite(new THREE.SpriteMaterial({
      map: discTexture('#fff0d0'), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, color: 0xffe9c0, opacity: 0,
    }));
    this.nooraStar.position.copy(dirFromAzAlt(180, 62)).multiplyScalar(R * 0.9);
    this.nooraStar.scale.setScalar(0.001);
    this.group.add(this.nooraStar);
  }

  enter() {
    this.entered = true;
    this.group.visible = true;
    this.camera.position.set(0, 2, 0);
    this.fov = 60;
    this.updateCamera();
    this.refreshCounter();
  }

  updateCamera() {
    this.pitch = THREE.MathUtils.clamp(this.pitch, -0.06, 1.45);
    const d = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.lookAt(this.camera.position.clone().add(d));
    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();
  }

  drag(dx, dy) {
    const k = this.fov / 60;
    this.yawV   = -dx * 0.0032 * k;
    this.pitchV =  dy * 0.0032 * k;
  }
  zoom(delta) {
    this.fov = THREE.MathUtils.clamp(this.fov + delta, 36, 78);
  }

  enableGyro() {
    const handler = (e) => {
      if (e.alpha == null) return;
      // W3C deviceorientation -> look direction
      const a = THREE.MathUtils.degToRad(e.alpha);
      const b = THREE.MathUtils.degToRad(e.beta);
      const g = THREE.MathUtils.degToRad(e.gamma);
      const R1 = new THREE.Matrix4().makeRotationZ(a);
      const R2 = new THREE.Matrix4().makeRotationX(b);
      const R3 = new THREE.Matrix4().makeRotationY(g);
      const M = new THREE.Matrix4().multiplyMatrices(R1, new THREE.Matrix4().multiplyMatrices(R2, R3));
      const f = new THREE.Vector3(0, 0, -1).applyMatrix4(M);
      // device frame: x east, y north, z up  ->  our frame: x east, y up, z south(-north)
      const look = new THREE.Vector3(f.x, f.z, -f.y);
      this.yaw = Math.atan2(look.x, -look.z);
      this.pitch = Math.asin(THREE.MathUtils.clamp(look.y, -1, 1));
    };
    const attach = () => {
      addEventListener('deviceorientation', handler, true);
      this.gyro = handler;
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') attach(); }).catch(() => {});
    } else attach();
  }

  spawnMeteor() {
    const m = this.meteors.find(m => m.life <= 0);
    if (!m) return;
    // start 15..55 degrees away from the radiant, streak away from it
    const axis = new THREE.Vector3().randomDirection().cross(this.radiantDir).normalize();
    const ang = THREE.MathUtils.degToRad(15 + Math.random() * 40);
    m.dir.copy(this.radiantDir).applyAxisAngle(axis, ang).normalize();
    if (m.dir.y < 0.06) m.dir.y = 0.06 + Math.random() * 0.2;
    m.dir.normalize();
    m.tan.copy(m.dir).sub(this.radiantDir.clone().multiplyScalar(m.dir.dot(this.radiantDir))).normalize();
    m.speed = 0.5 + Math.random() * 0.5;   // radians/s along the sphere
    m.life = m.dur = 0.8 + Math.random() * 0.9;
    m.caught = false;
    m.mesh.material.uniforms.uGold.value = 0;
    m.mesh.visible = true;
  }

  refreshCounter() {
    const c = document.getElementById('memCount');
    if (c) c.textContent = `${this.collected.size} / 21 ✦`;
    const w = document.getElementById('wishCount');
    if (w) w.textContent = `${this.wishes} ☄`;
  }

  // returns true if the tap hit something interactive
  tap(x, y, W, H) {
    const v = new THREE.Vector3();
    // memory stars
    for (const s of this.memStars) {
      if (s.collected || this.convergeT >= 0) continue;
      v.copy(s.sprite.position).project(this.camera);
      if (v.z > 1) continue;
      const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      if ((sx-x)*(sx-x) + (sy-y)*(sy-y) < 46*46) {
        s.collected = true;
        this.collected.add(s.idx);
        localStorage.setItem('noor_sky_mem', JSON.stringify([...this.collected]));
        s.sprite.material.color.set(0x9fb4d8);
        this.refreshCounter();
        const card = document.getElementById('memCard');
        document.getElementById('memNum').textContent = `السببُ ${this.collected.size} من ٢١`;
        document.getElementById('memText').textContent = REASONS[s.idx];
        card.classList.add('on');
        if (this.collected.size >= 21) setTimeout(() => this.converge(), 4200);
        return true;
      }
    }
    // meteors -> wishes
    for (const m of this.meteors) {
      if (m.life <= 0 || m.caught) continue;
      v.copy(m.mesh.position).project(this.camera);
      if (v.z > 1) continue;
      const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      if ((sx-x)*(sx-x) + (sy-y)*(sy-y) < 64*64) {
        m.caught = true;
        m.mesh.material.uniforms.uGold.value = 1;
        this.wishes++;
        localStorage.setItem('noor_sky_wishes', this.wishes);
        this.refreshCounter();
        const t = document.getElementById('wishToast');
        t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
        return true;
      }
    }
    return false;
  }

  converge() {
    if (this.converged) return;
    this.converged = true;
    this.convergeT = 0;
  }

  update(dt, time) {
    if (!this.ready || !this.entered) return;
    this.bgMat.uniforms.uTime.value = time;
    this.starMat.uniforms.uTime.value = time;

    // inertial look
    this.yaw += this.yawV; this.pitch += this.pitchV;
    this.yawV *= Math.exp(-dt * 4.5); this.pitchV *= Math.exp(-dt * 4.5);
    this.updateCamera();

    // meteors — the Perseids
    this.meteorClock -= dt;
    if (this.meteorClock <= 0) {
      this.spawnMeteor();
      if (Math.random() < 0.25) this.spawnMeteor(); // little bursts
      this.meteorClock = 1.2 + Math.random() * 2.6;
    }
    for (const m of this.meteors) {
      if (m.life <= 0) continue;
      m.life -= dt;
      const sp = m.caught ? m.speed * 0.35 : m.speed;
      m.dir.addScaledVector(m.tan, sp * dt).normalize();
      m.mesh.position.copy(m.dir).multiplyScalar(R * 0.98);
      const len = 30 + m.speed * 40;
      m.mesh.scale.set(len, m.caught ? 2.6 : 1.6, 1);
      // orient along motion
      const ahead = m.dir.clone().addScaledVector(m.tan, 0.05).multiplyScalar(R * 0.98);
      m.mesh.lookAt(ahead);
      m.mesh.rotateY(Math.PI / 2);
      const lt = m.life / m.dur;
      m.mesh.material.uniforms.uAlpha.value = Math.sin(THREE.MathUtils.clamp(lt, 0, 1) * Math.PI) * 0.95;
      if (m.life <= 0) m.mesh.visible = false;
    }

    // golden stars breathe
    for (const s of this.memStars) {
      s.pulse += dt * 2.0;
      if (!s.collected) s.sprite.scale.setScalar(11 + Math.sin(s.pulse) * 2.6);
    }

    // convergence: all 21 fly together into نجمة نورة
    if (this.convergeT >= 0) {
      this.convergeT += dt;
      const k = THREE.MathUtils.clamp(this.convergeT / 6, 0, 1);
      const e = k * k * (3 - 2 * k);
      for (const s of this.memStars) {
        s.sprite.position.lerpVectors(s.home, this.nooraStar.position, e);
        s.sprite.material.opacity = 1 - e * 0.95;
      }
      this.nooraStar.material.opacity = e;
      this.nooraStar.scale.setScalar(0.001 + e * 46 * (1 + Math.sin(time * 2.2) * 0.06));
      if (k >= 1 && !this.finalShown) {
        this.finalShown = true;
        document.getElementById('skyFinal').classList.add('on');
      }
    }

    // labels
    const W = innerWidth, H = innerHeight;
    const v = new THREE.Vector3();
    for (const s of this.namedStars) {
      v.copy(s.pos).project(this.camera);
      const behind = v.z > 1;
      if (behind || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { s.el.style.opacity = 0; continue; }
      s.el.style.opacity = 0.75;
      s.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * W) | 0}px, ${((-v.y * 0.5 + 0.5) * H + 14) | 0}px)`;
    }
  }
}

function discTexture(color) {
  const s = 64, cv = document.createElement('canvas');
  cv.width = cv.height = s;
  const ctx = cv.getContext('2d');
  const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
  g.addColorStop(0, color);
  g.addColorStop(0.4, color + 'cc');
  g.addColorStop(1, color + '00');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
