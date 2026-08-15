// ============================================================
//  الغرفة — a reading room, built rather than decorated
//
//  Everything here is a real material under image-based lighting:
//  oiled walnut, worn leather, brass, paper, wool. Nothing is a flat
//  colour with a glow on it. The room is lit by one lamp on the desk
//  and whatever the city sends through the window, which is why the
//  corners stay dark and the shelves have depth.
// ============================================================
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/extras/RoundedBoxGeometry.js';

const RND = (a, b) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- textures
//  Drawn to canvas rather than loaded, so the room costs nothing to ship
//  and the grain can be tuned instead of hunted for.

function noiseCanvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

// oiled walnut: long grain, a few darker rings, subtle end-blocks
export function woodTexture(scale = 1) {
  return noiseCanvas(512, 512, (g, w, h) => {
    g.fillStyle = '#312320'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const y = Math.random() * h;
      const a = RND(0.02, 0.10);
      g.strokeStyle = `rgba(${Math.random() < .5 ? '18,13,11' : '82,64,52'},${a})`;
      g.lineWidth = RND(0.4, 2.6);
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 16)
        g.lineTo(x, y + Math.sin(x * 0.02 + i) * RND(0.5, 3.5));
      g.stroke();
    }
    // knots
    for (let k = 0; k < 3; k++) {
      const cx = Math.random() * w, cy = Math.random() * h, r = RND(10, 26);
      for (let i = 0; i < 12; i++) {
        g.strokeStyle = `rgba(22,15,12,${RND(0.05, 0.16)})`;
        g.lineWidth = RND(0.6, 1.8);
        g.beginPath();
        g.ellipse(cx, cy, r * (i / 12 + 0.15), r * (i / 12 + 0.15) * 0.55, 0.4, 0, 7);
        g.stroke();
      }
    }
  });
}

// wool rug: a flat weave with a border
export function rugTexture() {
  return noiseCanvas(512, 512, (g, w, h) => {
    g.fillStyle = '#3a2622'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = `rgba(${Math.random() < .5 ? '24,15,13' : '92,62,52'},${RND(0.04, 0.18)})`;
      g.fillRect(Math.random() * w, Math.random() * h, RND(1, 5), RND(1, 2));
    }
    g.strokeStyle = 'rgba(160,128,88,.22)'; g.lineWidth = 7;
    g.strokeRect(28, 28, w - 56, h - 56);
    g.lineWidth = 2; g.strokeRect(44, 44, w - 88, h - 88);
  });
}

// plaster: almost flat, but never perfectly
export function plasterTexture() {
  return noiseCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#26241f'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = `rgba(${Math.random() < .5 ? '16,15,13' : '52,50,45'},${RND(0.02, 0.10)})`;
      g.fillRect(Math.random() * w, Math.random() * h, RND(1, 3), RND(1, 3));
    }
  });
}

// ---------------------------------------------------------------- a book
//  The spine carries the title, drawn as real Arabic so the browser
//  shapes it, plus bands, a rule, and the wear a read book has.
export function spineTexture(title, hue, plain) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 1024;
  const g = c.getContext('2d');
  const col = new THREE.Color(hue);
  if (!plain) col.offsetHSL(0, 0.04, 0.06);      // hers, a shade richer
  const base = `rgb(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0})`;
  g.fillStyle = base; g.fillRect(0, 0, 256, 1024);

  // leather grain
  for (let i = 0; i < 5200; i++) {
    g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,225,190'},${RND(0.015, 0.07)})`;
    g.fillRect(Math.random() * 256, Math.random() * 1024, RND(1, 4), RND(1, 3));
  }
  // darker at the hinges, the way a spine curves away from the light
  const edge = g.createLinearGradient(0, 0, 256, 0);
  edge.addColorStop(0, 'rgba(0,0,0,.55)');
  edge.addColorStop(0.22, 'rgba(0,0,0,0)');
  edge.addColorStop(0.78, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,.55)');
  g.fillStyle = edge; g.fillRect(0, 0, 256, 1024);

  // gilt bands — thin, and only as bright as old gilt actually is
  g.fillStyle = plain ? 'rgba(150,120,74,.34)' : 'rgba(198,162,102,.62)';
  for (const y of [150, 862]) g.fillRect(30, y, 196, 3);
  g.fillStyle = plain ? 'rgba(150,120,74,.16)' : 'rgba(198,162,102,.26)';
  for (const y of [168, 844]) g.fillRect(30, y, 196, 2);
  if (plain && Math.random() < 0.5) {          // a few carry a blind rule only
    g.fillStyle = 'rgba(0,0,0,.22)';
    g.fillRect(30, 500, 196, 2);
  }

  if (!title) {
    const t0 = new THREE.CanvasTexture(c);
    t0.colorSpace = THREE.SRGBColorSpace; t0.anisotropy = 8;
    return t0;
  }

  // the title, running up the spine
  g.save();
  g.translate(128, 512);
  g.rotate(-Math.PI / 2);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.direction = 'rtl';
  let size = 108;
  const font = w => `${w}px "Thmanyah Serif Display","Aref Ruqaa",serif`;
  g.font = font(size);
  while (g.measureText(title).width > 660 && size > 40) { size -= 4; g.font = font(size); }
  // struck twice: a dark bite into the leather, then the gilt sitting in it
  g.fillStyle = 'rgba(0,0,0,.55)';
  g.fillText(title, 0, 3);
  g.fillStyle = 'rgba(240,208,140,1)';
  g.shadowColor = 'rgba(255,220,150,.55)'; g.shadowBlur = 12;
  g.fillText(title, 0, 0);
  g.restore();

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// plain volumes: no title, just leather, bands and wear. Six of them are
// made once and shared, because a shelf needs three hundred books and not
// three hundred canvases.
const PLAIN = [];
export function plainSpine(i) {
  i = i % 10;
  if (PLAIN[i]) return PLAIN[i];
  const hue = [0x4a382a, 0x2c3a4c, 0x5a3a2c, 0x2c4438, 0x3e3048, 0x554634,
               0x63402c, 0x33404e, 0x4a2c2c, 0x3a4a3a][i % 10];
  return (PLAIN[i] = spineTexture('', hue, true));
}

// pages: a block of cream with the lines of the leaves showing
function pagesTexture() {
  return noiseCanvas(256, 256, (g, w, h) => {
    g.fillStyle = '#7d6f57'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 2) {
      g.fillStyle = `rgba(38,29,18,${RND(0.16, 0.46)})`;
      g.fillRect(x, 0, 1, h);
    }
    // dust settles on the top edge of a shelved book
    g.fillStyle = 'rgba(30,24,16,.5)'; g.fillRect(0, 0, w, 10);
  });
}

const PAGES = { tex: null };

export function buildBook(book, h, w, plainIdx) {
  const g = new THREE.Group();
  const W = w || 0.038, D = 0.16 + Math.random() * 0.035;   // spine width, depth in
  const H = h;

  const spine = new THREE.MeshPhysicalMaterial({
    map: plainIdx == null ? spineTexture(book.title, book.hue) : plainSpine(plainIdx),
    roughness: 0.78, metalness: 0.0, clearcoat: 0.18, clearcoatRoughness: 0.65,
  });
  if (!PAGES.tex) PAGES.tex = pagesTexture();
  // page edges are not white: they are dusty cream and they must never be
  // the brightest thing on the shelf
  const paper = new THREE.MeshStandardMaterial({
    map: PAGES.tex, color: 0x6f6350, roughness: 1.0 });
  const board = new THREE.MeshPhysicalMaterial({
    color: book.hue, roughness: 0.8, clearcoat: 0.15,
  });

  // A book on a shelf: spine out, fore-edge in, boards to the sides, pages
  // top and bottom. BoxGeometry, not RoundedBox — the latter has no face
  // groups, so a per-face material array would silently do nothing.
  // order: +x, -x, +y, -y, +z, -z
  const mats = [board, board, paper, paper, spine, paper];
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mats);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);

  g.userData = { book, body, W, H, D };
  return g;
}

// ---------------------------------------------------------------- the room
//  Six metres by five, three high. A wall of shelves, a desk under a
//  window, a rug, and a reading chair. Coordinates: the room runs along
//  x, the shelf wall is at -z, the window at +z.
export function buildRoom() {
  const g = new THREE.Group();
  const W = 6.0, D = 5.2, H = 2.74;

  const wood = woodTexture();
  const woodDark = woodTexture();
  const plaster = plasterTexture();
  plaster.repeat.set(4, 2);

  const floorTex = woodTexture();
  floorTex.repeat.set(6, 5);
  const floorMat = new THREE.MeshPhysicalMaterial({
    map: floorTex, roughness: 0.52, clearcoat: 0.35, clearcoatRoughness: 0.45,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  g.add(floor);

  const ceilMat = new THREE.MeshStandardMaterial({ map: plaster, roughness: 1.0, color: 0x4e4a42 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat);
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H;
  g.add(ceil);

  const wallMat = new THREE.MeshStandardMaterial({ map: plaster, roughness: 1.0, color: 0x5f5a50 });
  const wall = (w, h, x, y, z, ry) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.receiveShadow = true; g.add(m); return m;
  };
  wall(W, H, 0, H / 2, -D / 2, 0);            // shelf wall
  wall(W, H, 0, H / 2,  D / 2, Math.PI);      // window wall
  wall(D, H, -W / 2, H / 2, 0, Math.PI / 2);
  wall(D, H,  W / 2, H / 2, 0, -Math.PI / 2);

  // skirting and picture rail, because a room without trim reads as a box
  const trimMat = new THREE.MeshPhysicalMaterial({ map: woodDark, roughness: 0.55, clearcoat: 0.3 });
  const trim = (w, h, d, x, y, z) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.008), trimMat);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
  };
  for (const z of [-D / 2 + 0.03, D / 2 - 0.03]) { trim(W, 0.14, 0.05, 0, 0.07, z); trim(W, 0.05, 0.04, 0, 2.34, z); }
  for (const x of [-W / 2 + 0.03, W / 2 - 0.03]) {
    const m1 = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.14, D, 2, 0.008), trimMat);
    m1.position.set(x, 0.07, 0); g.add(m1);
  }

  // the rug
  const rugTex = rugTexture();
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.98 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.004, 0.5);
  rug.receiveShadow = true; g.add(rug);

  g.userData = { W, D, H, wood, trimMat };
  return g;
}

// ---------------------------------------------------------------- shelving
//  A case of shelves with real carcase sides, a plinth and a cornice, so
//  the books sit inside furniture rather than floating against a wall.
export function buildShelves(room, bays = 3) {
  const g = new THREE.Group();
  const caseW = 1.60, caseH = 2.28, caseD = 0.30;
  const shelfT = 0.035;
  const rows = 4;
  const mat = new THREE.MeshPhysicalMaterial({
    map: room.userData.wood, roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.4,
  });
  const slots = [];

  for (let b = 0; b < bays; b++) {
    const bay = new THREE.Group();
    const x0 = (b - (bays - 1) / 2) * (caseW + 0.06);

    const panel = (w, h, d, x, y, z) => {
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, 0.006), mat);
      m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
      bay.add(m); return m;
    };
    panel(0.04, caseH, caseD, -caseW / 2, caseH / 2, 0);      // sides
    panel(0.04, caseH, caseD,  caseW / 2, caseH / 2, 0);
    panel(caseW, 0.03, caseD - 0.02, 0, caseH - 0.015, 0);     // top
    panel(caseW + 0.10, 0.05, caseD + 0.05, 0, caseH + 0.03, 0); // cornice
    panel(caseW + 0.06, 0.12, caseD + 0.03, 0, 0.06, 0);       // plinth
    // the back, set in a little so the shelves have depth
    const back = new THREE.Mesh(new THREE.PlaneGeometry(caseW, caseH),
      new THREE.MeshStandardMaterial({ map: room.userData.wood, roughness: 0.85, color: 0x6b5236 }));
    back.position.set(0, caseH / 2, -caseD / 2 + 0.01);
    back.receiveShadow = true; bay.add(back);

    for (let r = 0; r < rows; r++) {
      const y = 0.16 + r * ((caseH - 0.30) / rows);
      panel(caseW - 0.08, shelfT, caseD - 0.02, 0, y, 0);
      slots.push({ bay: b, row: r, x0, y: y + shelfT / 2, caseW });
    }
    bay.position.x = x0;
    g.add(bay);
  }
  g.userData = { slots, caseW, caseH, caseD };
  return g;
}

// ---------------------------------------------------------------- the desk
export function buildDesk(room) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    map: room.userData.wood, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.5,
  });
  const leather = new THREE.MeshPhysicalMaterial({
    color: 0x2e211b, roughness: 0.85, clearcoat: 0.1,
  });
  const brass = new THREE.MeshPhysicalMaterial({
    color: 0xb08a48, roughness: 0.28, metalness: 1.0,
  });

  const top = new THREE.Mesh(new RoundedBoxGeometry(1.60, 0.055, 0.74, 3, 0.012), mat);
  top.position.y = 0.74; top.castShadow = true; top.receiveShadow = true; g.add(top);

  const inlay = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.54), leather);
  inlay.rotation.x = -Math.PI / 2; inlay.position.set(0, 0.7685, 0);
  inlay.receiveShadow = true; g.add(inlay);

  for (const sx of [-1, 1]) {
    const ped = new THREE.Mesh(new RoundedBoxGeometry(0.40, 0.70, 0.66, 3, 0.01), mat);
    ped.position.set(sx * 0.56, 0.36, 0);
    ped.castShadow = true; ped.receiveShadow = true; g.add(ped);
    for (let d = 0; d < 3; d++) {
      const pull = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 8, 20), brass);
      pull.position.set(sx * 0.56, 0.20 + d * 0.22, 0.335);
      pull.rotation.x = Math.PI / 2; g.add(pull);
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.004),
        new THREE.MeshBasicMaterial({ color: 0x120b06 }));
      line.position.set(sx * 0.56, 0.31 + d * 0.22, 0.331); g.add(line);
    }
  }

  // the lamp: a brass column and a green shade, which is where the room's
  // warmth actually comes from
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.05, 0.30, 24), brass);
  col.position.set(-0.52, 0.92, -0.12); col.castShadow = true; g.add(col);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.135, 0.11, 32, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0x0e3324, roughness: 0.45,
      side: THREE.DoubleSide, clearcoat: 0.7, clearcoatRoughness: 0.25 }));
  shade.position.set(-0.52, 1.10, -0.12); shade.castShadow = true; g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xd9a460 }));
  bulb.position.set(-0.52, 1.07, -0.12); g.add(bulb);

  // an open book left on the desk, and a cup
  const openMat = new THREE.MeshStandardMaterial({ color: 0x8f836c, roughness: 1.0 });
  for (const sx of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.24), openMat);
    leaf.position.set(0.18 + sx * 0.09, 0.775, 0.02);
    leaf.rotation.z = sx * 0.02;
    leaf.castShadow = true; leaf.receiveShadow = true; g.add(leaf);
  }
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.028, 0.075, 24),
    new THREE.MeshPhysicalMaterial({ color: 0xb8b0a0, roughness: 0.35, clearcoat: 0.7 }));
  cup.position.set(0.56, 0.805, 0.16); cup.castShadow = true; g.add(cup);

  g.userData = { bulbPos: new THREE.Vector3(-0.52, 1.07, -0.12) };
  return g;
}

// ---------------------------------------------------------------- the window
//  Onto the same Riyadh night the observatory looks at, so the three
//  places are recognisably one world.
export function buildWindow(room) {
  const g = new THREE.Group();
  const W = 1.5, H = 1.7;
  const frame = new THREE.MeshPhysicalMaterial({
    map: room.userData.wood, roughness: 0.5, clearcoat: 0.4,
  });

  const night = new THREE.Mesh(new THREE.PlaneGeometry(W, H),
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 v; void main(){ v = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime; varying vec2 v;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5); }
        void main(){
          // a sky that darkens upward, a low band of city, and stars
          vec3 sky = mix(vec3(0.16,0.09,0.05), vec3(0.012,0.016,0.036),
                         smoothstep(0.12, 0.85, v.y));
          float city = smoothstep(0.16, 0.05, v.y);
          vec3 col = sky + vec3(0.28,0.15,0.06) * city * 0.55;
          // windows in the towers
          vec2 gr = floor(vec2(v.x * 90.0, v.y * 120.0));
          float lit = step(0.86, h(gr)) * smoothstep(0.155, 0.02, v.y);
          col += vec3(1.0,0.72,0.34) * lit * 0.85;
          // stars above the glow
          vec2 sg = floor(v * vec2(200.0, 240.0));
          float st = step(0.9965, h(sg + 3.0)) * smoothstep(0.3, 0.7, v.y);
          col += vec3(0.9,0.93,1.0) * st * (0.6 + 0.4 * sin(uTime * 2.0 + h(sg) * 30.0));
          gl_FragColor = vec4(col, 1.0);
        }`
    }));
  g.add(night);

  // glazing bars
  const bar = (w, h, x, y) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.04, 2, 0.006), frame);
    m.position.set(x, y, 0.03); m.castShadow = true; g.add(m);
  };
  bar(W + 0.16, 0.09, 0,  H / 2 + 0.03);
  bar(W + 0.16, 0.09, 0, -H / 2 - 0.03);
  bar(0.09, H + 0.16, -W / 2 - 0.03, 0);
  bar(0.09, H + 0.16,  W / 2 + 0.03, 0);
  bar(0.04, H, 0, 0);
  bar(W, 0.04, 0, 0.2);
  // a sill deep enough to leave a book on
  const sill = new THREE.Mesh(new RoundedBoxGeometry(W + 0.34, 0.06, 0.22, 2, 0.008), frame);
  sill.position.set(0, -H / 2 - 0.10, 0.09);
  sill.castShadow = true; sill.receiveShadow = true; g.add(sill);

  g.userData = { night };
  return g;
}

// ---------------------------------------------------------------- the chair
export function buildChair(room) {
  const g = new THREE.Group();
  const leather = new THREE.MeshPhysicalMaterial({
    color: 0x4a2f24, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.5,
  });
  const wood = new THREE.MeshPhysicalMaterial({
    map: room.userData.wood, roughness: 0.5, clearcoat: 0.35,
  });
  const seat = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.16, 0.60, 4, 0.07), leather);
  seat.position.y = 0.44; seat.castShadow = true; seat.receiveShadow = true; g.add(seat);
  const back = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.66, 0.16, 4, 0.07), leather);
  back.position.set(0, 0.80, -0.24); back.rotation.x = -0.12;
  back.castShadow = true; g.add(back);
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.12, 0.54, 3, 0.05), leather);
    arm.position.set(sx * 0.31, 0.60, -0.02); arm.castShadow = true; g.add(arm);
  }
  for (const [sx, sz] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.022, 0.38, 12), wood);
    leg.position.set(sx * 0.25, 0.19, sz * 0.24); leg.castShadow = true; g.add(leg);
  }
  return g;
}
