// ============================================================
//  سماء ليلتها الأولى — Riyadh, 13 / 8 / 2005, 21:00
//  «ضوء ٢٠٠٥»: real stars, real distances — light that left its
//  home in the years of her life arrives tonight, and the oldest
//  light of all carries a photograph.
// ============================================================
import * as THREE from 'three';

const R = 1000;

function dirFromAzAlt(azDeg, altDeg) {
  const az = THREE.MathUtils.degToRad(azDeg);
  const alt = THREE.MathUtils.degToRad(altDeg);
  return new THREE.Vector3(
    Math.sin(az) * Math.cos(alt),
    Math.sin(alt),
    -Math.cos(az) * Math.cos(alt)
  );
}

function starColor(ci) {
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

// the 21 reasons — his own words, three revealed at each light station
export const REASONS = [
  'لأنكِ حين تضحكين، لا أسمع مجرد صوت.. بل أشعر أن حياتي الحقيقية قد بدأت للتو.',
  'لأننا لا نحتاج للكلام.. أنتِ تنظرين في عينيّ، وتقرئين كل السيناريوهات التي يخبئها قلبي.',
  'لأن العالم كله يبحث عن الشمس، بينما أنا يكفيني أن أهمس "نُـورة" ليتبدد كل ظلامي.',
  'لأن في هذا العالم المجنون والمزعج، صوتكِ هو اللحن الوحيد الذي ينبض قلبي على إيقاعه.',
  'لأن بصحبتكِ، حتى المشي في شارعٍ فارغ يبدو وكأنه أجمل مشهد ختامي في فيلم رومانسي.',
  'لأنكِ حين تغارين وتغضبين قليلاً، تبدين فاتنة جداً، لدرجة أنني أود إغضابكِ فقط لأرى هذه الملامح!',
  'لأن أبواب العالم كلها لو أُغلقت في وجهي، سأظل أبتسم.. لأنني أعرف أن وطني الحقيقي هو قلبكِ.',
  'لأنكِ عنيدة جداً يا نورة.. وأنا متيم بعنادكِ لدرجة أنني أريد أن أُهزم أمامكِ دائماً وبكل سرور.',
  'لأن أياً كان ما يحدث لي، جيداً أو سيئاً، روحي تركض إليكِ قبل أن تتحرك قدماي.',
  'لأن الصمت معكِ ليس فراغاً.. نحن نجلس بصمت، وتخوض أعيننا أطول وأجمل حوار في التاريخ.',
  'يقولون أن الحب يحدث مرة واحدة فقط في العُمر.. كذبوا، أنا أقع في حبكِ من جديد في كل مرة أراكِ فيها!',
  'طالما أن يدكِ الصَغيرة تقبض على يدي، لا يهمني إلى أين يأخذني الطريق.. أنتِ هي وجهتي.',
  'الناس يغمضون أعينهم ويتمنون أمنية حين يسقط شهاب.. لكن في ليلة ميلادكِ، السماء هي من أمطرت شهبها لتحتفل، لأن أمنيتها الكبرى تحققت ونزلت إلى الأرض.',
  'لأن دمعة واحدة تسقط من عينكِ، أشعر بها كخنجر في صدري.. أنا مستعد لمحاربة العالم كله فقط لتبتسمي.',
  'لأنكِ حين تنظرين إليّ بذلك الإيمان في عينيكِ، أشعر وكأنني ملك قادر على السيطرة على هذا الكون من أجلكِ.',
  'لأن يومي لا يبدأ بشروق الشمس.. يومي يبدأ فقط حين تفتحين أنتِ عينيكِ.',
  'الانتظار عذاب.. لكن إن كان الانتظار من أجلكِ أنتِ؟ يمكنني أن أقف في مكاني عمراً كاملاً فقط لألمح وجهكِ.',
  'لأن قلبي عرفكِ واهتز لكِ منذ اللحظة الأولى، وكأننا تعاهدنا على الحب في ألف حياة قبل هذه الحياة.',
  'لأنني كنت قصة ناقصة، حتى جئتِ أنتِ وكتبتِ أجمل نهاية.. أنتِ حقيقتي المطلقة.',
  '"طالما أن هناك حياة" (Jab Tak Hai Jaan).. فكل غدٍ أراه، أرى وجهكِ فيه.',
  'لأنكِ "نُـورة".. واسمٌ كهذا، وفتاةٌ مثلكِ.. لا تحدث في العُمر إلا مرة واحدة.',
];

// station stories — replace the `personal` lines with his own words later
const STATION_TEXTS = [
  { fact: 'يبعد ٢٥ سنة ضوئية · هذا الضوء غادره حوالي عام ٢٠٠١ — قبل أن تولدي',
    personal: 'قبل أن توجدي أصلاً، كان الضوء في طريقه.. وكان القدر يكتب أول سطر في قصتنا.' },
  { fact: 'يبعد ١٩ سنة ضوئية · غادر حوالي ٢٠٠٧ — وكنتِ وقتها في الثانية',
    personal: 'كنتِ طفلة صغيرة تتعلمين الكلام.. وهذا الضوء كان يركض نحو ليلة ستعرفين فيها كم أنتِ غالية.' },
  { fact: 'يبعد ١٧ سنة ضوئية · غادر حوالي ٢٠٠٩ — وكنتِ في الرابعة',
    personal: 'النسر الطائر أطلق ضوءه وأنتِ في الرابعة.. كأنه عرف الموعد قبلنا كلنا.' },
  { fact: 'نجمان توأمان يدوران حول بعضهما منذ ملايين السنين · ضوؤهما غادر حوالي ٢٠٠٩',
    personal: 'توأمان لا يفترقان أبداً.. أول ما عرفتكِ فهمت ليش الله خلق النجوم أزواج.' },
  { fact: 'نجم خافت لا تراه العين المجردة · يبعد ١٣ سنة ضوئية، غادر حوالي ٢٠١٣',
    personal: 'كان موجوداً يحبكِ من بعيد وأنتِ ما تشوفينه.. مثلي تماماً، قبل أن تعرفيني.' },
  { fact: 'أول نجم قاس البشر بُعده في التاريخ · يبعد ١١ سنة ضوئية، غادر حوالي ٢٠١٥',
    personal: 'البشر كلهم عرفوا كم يبعد هذا النجم.. وأنا وحدي عرفت أنه ما فيه مسافة بيني وبينكِ.' },
  { fact: 'يبعد ٢٢ سنة ضوئية · هذا الضوء غادر نجمه عام ٢٠٠٥ — عام ولادتكِ',
    personal: '' }, // the finale speaks for itself
];

const ARABIC_NAMES = {
  Vega: 'النَّسْرُ الواقِع', Altair: 'النَّسْرُ الطائِر', Deneb: 'ذَنَبُ الدَّجاجة',
  Antares: 'قَلْبُ العَقْرَب', Arcturus: 'السِّماكُ الرامِح', Polaris: 'النَّجْمُ القُطْبِيّ',
  Spica: 'السِّماكُ الأَعْزَل', Alphecca: 'الفَكَّة', Rasalhague: 'رَأْسُ الحَوَّاء',
  Shaula: 'الشَّوْلَة', Enif: 'أَنْفُ الفَرَس', Fomalhaut: 'فَمُ الحُوت',
};

const EXPOSE_TIME = 2.6;      // seconds of held light to develop a station
const EXPOSE_ANGLE = 0.075;   // radians — how close the held finger must stay

export class SkyNight {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.ready = false;
    this.entered = false;
    this.yaw = Math.PI;
    this.pitch = 0.35;
    this.yawV = 0; this.pitchV = 0;
    this.fov = 60;
    this.meteors = [];
    this.meteorClock = 2.5;
    this.labelEls = [];
    this.gyro = null;
    this.audio = null;

    // quest state
    this.stationIdx = Math.min(+(localStorage.getItem('noor_sky_station') || 0), 6);
    this.wishes = +(localStorage.getItem('noor_sky_wishes') || 0);
    this.exposing = false;
    this.exposure = 0;
    this.lensDir = new THREE.Vector3(0, 0, -1);
    this.finaleT = -1;
    this.photoParts = null;
  }

  async load() {
    const data = await (await fetch('./sky2005.json')).json();
    this.data = data;
    this.build(data);
    this.ready = true;
  }

  build(d) {
    // ---------- background: real milky way + faint stars + desert horizon
    const gp = dirFromAzAlt(d.galaxy.poleAz, d.galaxy.poleAlt);
    const gc = dirFromAzAlt(d.galaxy.centerAz, d.galaxy.centerAlt);
    this.bgMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPole: { value: gp }, uCore: { value: gc }, uDim: { value: 0 } },
      vertexShader: `varying vec3 vDir;
        void main(){ vDir = position;
        gl_Position = (projectionMatrix * modelViewMatrix * vec4(position,1.0)).xyww; }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uDim; uniform vec3 uPole, uCore;
        varying vec3 vDir;
        ${NOISE}
        void main(){
          vec3 dn = normalize(vDir);
          vec3 col = vec3(0.006, 0.008, 0.016);
          float band = exp(-pow(dot(dn, uPole), 2.0) * 26.0);
          float coreBoost = 0.45 + 0.9 * pow(clamp(dot(dn, uCore), 0.0, 1.0), 2.0);
          float cloud = fbm(dn * 5.0 + vec3(2.7)) * 0.7 + fbm(dn * 12.0) * 0.3;
          float rift = smoothstep(0.30, 0.55, fbm(dn * 7.0 + vec3(8.1)));
          vec3 mw = mix(vec3(0.12, 0.12, 0.17), vec3(0.20, 0.17, 0.20), cloud);
          col += band * mw * cloud * coreBoost * (0.35 + 0.65 * rift) * 1.6;
          col += vec3(0.010, 0.012, 0.022) * (1.0 - abs(dn.y));
          vec3 sp = dn * 380.0;
          vec3 sid = floor(sp), sf = fract(sp);
          vec3 spos = vec3(hash31(sid), hash31(sid + 3.1), hash31(sid + 7.7)) * 0.7 + 0.15;
          float sd = length(sf - spos);
          float sel = step(0.972, hash31(sid + 11.3));
          col += smoothstep(0.09, 0.0, sd) * sel * 0.16 * vec3(0.8, 0.85, 1.0) * step(0.012, dn.y);
          float ground = smoothstep(0.012, -0.02, dn.y);
          vec3 gcol = vec3(0.012, 0.008, 0.007) + fbm(dn * 40.0) * 0.008;
          col = mix(col, gcol, ground);
          float hz = exp(-abs(dn.y) * 26.0);
          col += hz * vec3(0.055, 0.030, 0.012) * (1.0 - ground * 0.4);
          col *= 1.0 - uDim * 0.55;   // the sky holds its breath for the finale
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
      uniforms: { uTime: { value: 0 }, uDim: { value: 0 } },
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
        uniform float uDim;
        varying vec3 vColor; varying float vTw;
        void main(){
          float r = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.06, r);
          a += smoothstep(0.14, 0.0, r) * 0.9;
          gl_FragColor = vec4(vColor * vTw, a * 0.9 * (1.0 - uDim * 0.6));
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
    this.constLines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({
      color: 0x8fa8dd, transparent: true, opacity: 0.10,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    this.constLines.frustumCulled = false;
    this.group.add(this.constLines);

    // ---------- moon (true 57% waxing gibbous)
    const mdir = dirFromAzAlt(d.moon.az, d.moon.alt);
    const moonSize = 34;
    const moon = new THREE.Mesh(
      new THREE.PlaneGeometry(moonSize, moonSize),
      new THREE.ShaderMaterial({
        transparent: true, depthWrite: false,
        uniforms: { uPhase: { value: THREE.MathUtils.degToRad(d.moon.phaseAngle) } },
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: /* glsl */`
          uniform float uPhase; varying vec2 vUv;
          ${NOISE}
          void main(){
            float r2 = dot(vUv, vUv);
            if (r2 > 1.0) discard;
            vec3 N = vec3(vUv.x, vUv.y, sqrt(1.0 - r2));
            vec3 L = normalize(vec3(-sin(uPhase), 0.12, -cos(uPhase)));
            float lit = clamp(dot(N, L) * 1.6 + 0.05, 0.0, 1.0);
            float maria = fbm(N * 5.5 + vec3(3.3));
            vec3 surf = mix(vec3(0.86, 0.85, 0.80), vec3(0.55, 0.55, 0.53), smoothstep(0.45, 0.7, maria));
            gl_FragColor = vec4(surf * (lit * 0.95 + 0.012), smoothstep(1.0, 0.86, r2));
          }`
      })
    );
    moon.position.copy(mdir).multiplyScalar(R * 0.9);
    moon.lookAt(0, 0, 0);
    this.group.add(moon);
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

    // ---------- jupiter
    const jdir = dirFromAzAlt(d.jupiter.az, d.jupiter.alt);
    const jup = new THREE.Sprite(new THREE.SpriteMaterial({
      map: discTexture('#fff3dc'), transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
    }));
    jup.position.copy(jdir).multiplyScalar(R * 0.95);
    jup.scale.setScalar(9);
    this.group.add(jup);
    this.jupiterPos = jup.position.clone();

    // ---------- perseids
    this.radiantDir = dirFromAzAlt(d.radiant.az, d.radiant.alt);
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

    // ---------- the seven light stations
    this.stations = d.stations.map((s, i) => {
      const dir = dirFromAzAlt(s.az, s.alt);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: discTexture('#ffe9c4'), transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0xffe0a6, opacity: 0,
      }));
      halo.position.copy(dir).multiplyScalar(R * 0.96);
      halo.scale.setScalar(26);
      this.group.add(halo);
      // a collected station keeps a quiet silver ember
      const done = i < this.stationIdx;
      if (done) { halo.material.opacity = 0.28; halo.material.color.set(0xaec3e8); halo.scale.setScalar(14); }
      return { ...s, i, dir, halo, done, glow: 0 };
    });

    // ---------- star labels
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
  }

  enter() {
    this.entered = true;
    this.group.visible = true;
    this.camera.position.set(0, 2, 0);
    this.fov = 60;
    this.updateCamera();
    this.refreshHud();
    if (this.stationIdx < 7) setTimeout(() => this.whisperToStation(), 3500);
  }

  // ------------------------------------------------ camera & input
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
    if (this.exposing) return;
    const k = this.fov / 60;
    this.yawV   = -dx * 0.0032 * k;
    this.pitchV =  dy * 0.0032 * k;
  }
  zoom(delta) { this.fov = THREE.MathUtils.clamp(this.fov + delta, 36, 78); }

  screenToDir(x, y) {
    this.camera.updateMatrixWorld(true);
    const ndc = new THREE.Vector3((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1, 0.5);
    return ndc.unproject(this.camera).sub(this.camera.position).normalize();
  }

  moveLens(x, y) {
    if (!this.entered) return;
    this.lensDir.copy(this.screenToDir(x, y));
  }

  // hold to expose — returns true if the press begins an exposure
  pressStart(x, y) {
    if (!this.entered || this.finaleT >= 0) return false;
    const st = this.stations && this.stations[this.stationIdx];
    if (!st) return false;
    const dir = this.screenToDir(x, y);
    if (dir.angleTo(st.dir) < EXPOSE_ANGLE * (this.fov / 60) * 1.4) {
      this.exposing = true;
      this.exposure = 0;
      return true;
    }
    return false;
  }
  pressMove(x, y) {
    if (!this.exposing) return;
    const st = this.stations[this.stationIdx];
    const dir = this.screenToDir(x, y);
    if (dir.angleTo(st.dir) > EXPOSE_ANGLE * (this.fov / 60) * 2.2) this.cancelExposure();
  }
  pressEnd() {
    if (this.exposing) this.cancelExposure();
  }
  cancelExposure() {
    this.exposing = false;
    document.getElementById('expRing').style.opacity = 0;
  }

  tapMeteor(x, y) {
    const v = new THREE.Vector3();
    for (const m of this.meteors) {
      if (m.life <= 0 || m.caught) continue;
      v.copy(m.mesh.position).project(this.camera);
      if (v.z > 1) continue;
      const sx = (v.x * 0.5 + 0.5) * innerWidth, sy = (-v.y * 0.5 + 0.5) * innerHeight;
      if ((sx-x)*(sx-x) + (sy-y)*(sy-y) < 64*64) {
        m.caught = true;
        m.mesh.material.uniforms.uGold.value = 1;
        this.wishes++;
        localStorage.setItem('noor_sky_wishes', this.wishes);
        this.refreshHud();
        if (navigator.vibrate) navigator.vibrate(30);
        const t = document.getElementById('wishToast');
        t.classList.remove('on'); void t.offsetWidth; t.classList.add('on');
        return true;
      }
    }
    return false;
  }

  enableGyro() {
    const handler = (e) => {
      if (e.alpha == null) return;
      const a = THREE.MathUtils.degToRad(e.alpha);
      const b = THREE.MathUtils.degToRad(e.beta);
      const g = THREE.MathUtils.degToRad(e.gamma);
      const R1 = new THREE.Matrix4().makeRotationZ(a);
      const R2 = new THREE.Matrix4().makeRotationX(b);
      const R3 = new THREE.Matrix4().makeRotationY(g);
      const M = new THREE.Matrix4().multiplyMatrices(R1, new THREE.Matrix4().multiplyMatrices(R2, R3));
      const f = new THREE.Vector3(0, 0, -1).applyMatrix4(M);
      const look = new THREE.Vector3(f.x, f.z, -f.y);
      this.yaw = Math.atan2(look.x, -look.z);
      this.pitch = Math.asin(THREE.MathUtils.clamp(look.y, -1, 1));
    };
    const attach = () => { addEventListener('deviceorientation', handler, true); this.gyro = handler; };
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      DeviceOrientationEvent.requestPermission().then(r => { if (r === 'granted') attach(); }).catch(() => {});
    } else attach();
  }

  // ------------------------------------------------ quest flow
  refreshHud() {
    const c = document.getElementById('memCount');
    if (c) c.textContent = this.stationIdx >= 7 ? 'اكتمل الضوء ✦' : `محطة الضوء ${this.stationIdx + 1} / 7 ✦`;
    const w = document.getElementById('wishCount');
    if (w) w.textContent = `${this.wishes} ☄`;
  }

  whisperToStation() {
    const st = this.stations && this.stations[this.stationIdx];
    if (!st || this.finaleT >= 0) return;
    const az = st.az;
    const dirs = ['الشمال', 'الشمالِ الشرقيّ', 'الشرق', 'الجنوبِ الشرقيّ', 'الجنوب', 'الجنوبِ الغربيّ', 'الغرب', 'الشمالِ الغربيّ'];
    const dname = dirs[Math.round(((az % 360) + 360) % 360 / 45) % 8];
    const h = st.alt > 55 ? 'عاليًا قربَ السَّمت' : st.alt > 25 ? 'في منتصفِ السماء' : 'قريبًا من الأفق';
    const last = this.stationIdx === 6;
    const w = document.getElementById('whisper');
    w.textContent = last
      ? `بقي أقدم ضوء.. ضوء عام ٢٠٠٥ — انظري نحو ${dname}، ${h}، حيث يومض نجم عام ميلادك`
      : `فيه ضوء قديم ينتظرك نحو ${dname}، ${h}.. اقتربي منه وأمسكيه بإصبعك حتى يكتمل`;
    w.classList.add('on');
    clearTimeout(this.whisperTO);
    this.whisperTO = setTimeout(() => w.classList.remove('on'), 9000);
  }

  completeStation() {
    const st = this.stations[this.stationIdx];
    st.done = true;
    st.halo.material.color.set(0xaec3e8);
    this.cancelExposure();
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    if (this.audio) this.audio.pluck();

    if (this.stationIdx === 6) {
      this.startFinale();
      return;
    }
    // station card
    const T = STATION_TEXTS[this.stationIdx];
    document.getElementById('stName').textContent = st.ar;
    document.getElementById('stFact').textContent = T.fact;
    document.getElementById('stPersonal').textContent = T.personal;
    const ul = document.getElementById('stReasons');
    ul.innerHTML = '';
    for (const r of REASONS.slice(this.stationIdx * 3, this.stationIdx * 3 + 3)) {
      const li = document.createElement('div');
      li.textContent = '✦ ' + r;
      ul.appendChild(li);
    }
    document.getElementById('memCard').classList.add('on');
    this.stationIdx++;
    localStorage.setItem('noor_sky_station', this.stationIdx);
    this.refreshHud();
  }

  // ------------------------------------------------ finale: light develops the photograph
  startFinale() {
    this.stationIdx = 7;
    localStorage.setItem('noor_sky_station', 7);
    this.refreshHud();
    this.finaleT = 0;
    // seven light orbs rise from the stations
    this.orbs = this.stations.map(st => {
      const o = new THREE.Sprite(new THREE.SpriteMaterial({
        map: discTexture('#fff2d0'), transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, color: 0xffe9bb,
      }));
      o.position.copy(st.dir).multiplyScalar(R * 0.9);
      o.scale.setScalar(18);
      this.group.add(o);
      return { o, from: o.position.clone() };
    });
    this.photoCenter = dirFromAzAlt(200, 42).multiplyScalar(R * 0.75);
    this.buildPhotoParticles();
  }

  buildPhotoParticles() {
    const img = new Image();
    img.src = './us.jpg';
    img.onerror = () => { img.onerror = null; img.src = './noor.jpg'; };
    img.onload = () => {
      const G = 88; // sampling grid
      const cv = document.createElement('canvas');
      cv.width = cv.height = G;
      const ctx = cv.getContext('2d');
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, G, G);
      const px = ctx.getImageData(0, 0, G, G).data;
      const W = 210; // world size of the developed photograph
      const pts = [], cols = [];
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
        const k = (y * G + x) * 4;
        pts.push((x / G - 0.5) * W, (0.5 - y / G) * W, 0);
        cols.push(px[k] / 255, px[k+1] / 255, px[k+2] / 255);
      }
      const n = pts.length / 3;
      const start = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const d = new THREE.Vector3().randomDirection().multiplyScalar(300 + Math.random() * 500);
        start[i*3] = d.x; start[i*3+1] = Math.abs(d.y) * 0.6 + 40; start[i*3+2] = d.z;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(start, 3));
      geo.setAttribute('aTarget', new THREE.BufferAttribute(new Float32Array(pts), 3));
      geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(cols), 3));
      const rnd = new Float32Array(n);
      for (let i = 0; i < n; i++) rnd[i] = Math.random();
      geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
      this.photoMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: 0 }, uTime: { value: 0 } },
        vertexShader: /* glsl */`
          attribute vec3 aTarget, aColor; attribute float aRnd;
          uniform float uT, uTime;
          varying vec3 vC; varying float vA;
          float ease(float t){ return t * t * (3.0 - 2.0 * t); }
          void main(){
            float f = ease(clamp(uT * (1.3 + aRnd * 0.5) - aRnd * 0.6, 0.0, 1.0));
            vec3 p = mix(position, aTarget, f);
            p.x += sin(uTime * 1.1 + aRnd * 40.0) * 2.2 * (1.0 - f);
            p.y += cos(uTime * 0.9 + aRnd * 30.0) * 2.2 * (1.0 - f);
            vC = aColor; vA = 0.25 + f * 0.75;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = (2.2 + aRnd * 1.4) * (500.0 / max(1.0, -mv.z));
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vC; varying float vA;
          void main(){
            float r = length(gl_PointCoord - 0.5);
            gl_FragColor = vec4(vC, smoothstep(0.5, 0.1, r) * vA);
          }`
      });
      this.photoParts = new THREE.Points(geo, this.photoMat);
      this.photoParts.position.copy(this.photoCenter);
      this.photoParts.lookAt(this.camera.position);
      this.photoParts.visible = false;
      this.group.add(this.photoParts);
    };
  }

  // ------------------------------------------------ per-frame
  update(dt, time) {
    if (!this.ready || !this.entered) return;
    this.bgMat.uniforms.uTime.value = time;
    this.starMat.uniforms.uTime.value = time;

    this.yaw += this.yawV; this.pitch += this.pitchV;
    this.yawV *= Math.exp(-dt * 4.5); this.pitchV *= Math.exp(-dt * 4.5);
    this.updateCamera();

    // perseids
    this.meteorClock -= dt;
    if (this.meteorClock <= 0) {
      this.spawnMeteor();
      if (Math.random() < 0.25) this.spawnMeteor();
      this.meteorClock = 1.2 + Math.random() * 2.6;
    }
    for (const m of this.meteors) {
      if (m.life <= 0) continue;
      m.life -= dt;
      const sp = m.caught ? m.speed * 0.35 : m.speed;
      m.dir.addScaledVector(m.tan, sp * dt).normalize();
      m.mesh.position.copy(m.dir).multiplyScalar(R * 0.98);
      m.mesh.scale.set(30 + m.speed * 40, m.caught ? 2.6 : 1.6, 1);
      const ahead = m.dir.clone().addScaledVector(m.tan, 0.05).multiplyScalar(R * 0.98);
      m.mesh.lookAt(ahead);
      m.mesh.rotateY(Math.PI / 2);
      m.mesh.material.uniforms.uAlpha.value = Math.sin(THREE.MathUtils.clamp(m.life / m.dur, 0, 1) * Math.PI) * 0.95;
      if (m.life <= 0) m.mesh.visible = false;
    }

    // ---------- lens proximity: sound & light guidance
    let shimmer = 0;
    const active = this.stationIdx < 7 && this.finaleT < 0 ? this.stations[this.stationIdx] : null;
    for (const st of this.stations || []) {
      let target = st.done ? 0.28 : 0.0;
      if (st === active) {
        const ang = this.lensDir.angleTo(st.dir);
        const near = THREE.MathUtils.clamp(1 - ang / 0.9, 0, 1);
        shimmer = Math.pow(near, 3);
        target = 0.12 + Math.pow(near, 2.5) * 0.8 + Math.sin(time * 3.0) * 0.08 * near;
        st.halo.scale.setScalar(20 + Math.pow(near, 2) * 16 + Math.sin(time * 2.2) * 3);
      }
      st.halo.material.opacity += (target - st.halo.material.opacity) * (1 - Math.exp(-dt * 3));
    }
    if (this.audio && this.audio.shimmer) this.audio.shimmer(shimmer * (this.exposing ? 1.6 : 1.0));

    // ---------- exposure
    const ring = document.getElementById('expRing');
    if (this.exposing && active) {
      this.exposure += dt / EXPOSE_TIME;
      const v = new THREE.Vector3().copy(active.dir).multiplyScalar(R).project(this.camera);
      ring.style.opacity = 1;
      ring.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px';
      ring.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px';
      ring.style.setProperty('--p', Math.min(this.exposure, 1));
      if (navigator.vibrate && (this.exposure * 10 | 0) !== (((this.exposure - dt / EXPOSE_TIME) * 10) | 0)) navigator.vibrate(8);
      if (this.exposure >= 1) this.completeStation();
    } else if (ring.style.opacity !== '0') ring.style.opacity = 0;

    // ---------- finale
    if (this.finaleT >= 0) {
      this.finaleT += dt;
      const t = this.finaleT;
      const dim = THREE.MathUtils.clamp(t / 4, 0, 1) * 0.9;
      this.bgMat.uniforms.uDim.value = dim;
      this.starMat.uniforms.uDim.value = dim;
      // orbs drift to where the photograph will develop
      const k = THREE.MathUtils.clamp((t - 1.5) / 4.5, 0, 1);
      const e = k * k * (3 - 2 * k);
      for (const { o, from } of this.orbs) {
        o.position.lerpVectors(from, this.photoCenter, e);
        o.material.opacity = 1 - e * 0.9;
        o.scale.setScalar(18 - e * 10);
      }
      if (t > 5.5 && this.photoParts && !this.photoParts.visible) {
        this.photoParts.visible = true;
        this.photoParts.lookAt(this.camera.position);
      }
      if (this.photoParts && this.photoParts.visible) {
        this.photoMat.uniforms.uTime.value = time;
        this.photoMat.uniforms.uT.value = THREE.MathUtils.clamp((t - 5.5) / 7, 0, 1);
      }
      if (t > 13.5 && !this.photoShown) {
        this.photoShown = true;
        document.getElementById('lightPhoto').classList.add('on');
      }
    }

    // labels
    const W = innerWidth, H = innerHeight;
    const v = new THREE.Vector3();
    for (const s of this.namedStars) {
      v.copy(s.pos).project(this.camera);
      if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) { s.el.style.opacity = 0; continue; }
      s.el.style.opacity = this.finaleT >= 0 ? 0 : 0.75;
      s.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * W) | 0}px, ${((-v.y * 0.5 + 0.5) * H + 14) | 0}px)`;
    }
  }

  spawnMeteor() {
    const m = this.meteors.find(m => m.life <= 0);
    if (!m) return;
    const axis = new THREE.Vector3().randomDirection().cross(this.radiantDir).normalize();
    const ang = THREE.MathUtils.degToRad(15 + Math.random() * 40);
    m.dir.copy(this.radiantDir).applyAxisAngle(axis, ang).normalize();
    if (m.dir.y < 0.06) { m.dir.y = 0.06 + Math.random() * 0.2; m.dir.normalize(); }
    m.tan.copy(m.dir).sub(this.radiantDir.clone().multiplyScalar(m.dir.dot(this.radiantDir))).normalize();
    m.speed = 0.5 + Math.random() * 0.5;
    m.life = m.dur = 0.8 + Math.random() * 0.9;
    m.caught = false;
    m.mesh.material.uniforms.uGold.value = 0;
    m.mesh.visible = true;
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
