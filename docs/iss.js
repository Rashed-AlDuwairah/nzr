// ============================================================
//  محطة الفضاء الدولية — the one man-made thing in her sky
//
//  Its position is asked for live, so the observatory is tied to
//  something that is genuinely moving right now: seven and a half
//  kilometres every second, a full turn around the earth every 93
//  minutes. Nothing here is stored or guessed; if the link is down
//  we say so rather than invent a number.
// ============================================================
const API = 'https://api.wheretheiss.at/v1/satellites/25544';
const RE = 6371.0;   // km

// where a point at (lat, lon, height) sits in earth-centred coordinates
function ecef(latDeg, lonDeg, hKm) {
  const la = latDeg * Math.PI / 180, lo = lonDeg * Math.PI / 180, r = RE + hKm;
  return [r * Math.cos(la) * Math.cos(lo), r * Math.cos(la) * Math.sin(lo), r * Math.sin(la)];
}

// how high and in what direction it stands, seen from her
export function lookAngles(obsLat, obsLon, satLat, satLon, satAlt) {
  const la = obsLat * Math.PI / 180, lo = obsLon * Math.PI / 180;
  const o = ecef(obsLat, obsLon, 0.6), s = ecef(satLat, satLon, satAlt);
  const d = [s[0] - o[0], s[1] - o[1], s[2] - o[2]];
  const east  = [-Math.sin(lo), Math.cos(lo), 0];
  const north = [-Math.sin(la) * Math.cos(lo), -Math.sin(la) * Math.sin(lo), Math.cos(la)];
  const up    = [ Math.cos(la) * Math.cos(lo),  Math.cos(la) * Math.sin(lo), Math.sin(la)];
  const dot = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const range = Math.hypot(d[0], d[1], d[2]);
  const alt = Math.asin(dot(d, up) / range) * 180 / Math.PI;
  let az = Math.atan2(dot(d, east), dot(d, north)) * 180 / Math.PI;
  if (az < 0) az += 360;
  return { alt, az, range };
}

async function get(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

// where it is at this second
export async function issNow() {
  const d = await get(API);
  return { lat: d.latitude, lon: d.longitude, alt: d.altitude, vel: d.velocity, at: d.timestamp * 1000 };
}

// where it will be at each of these moments (ten at a time, as the service allows)
async function issAt(stamps) {
  const out = [];
  for (let i = 0; i < stamps.length; i += 10) {
    const part = stamps.slice(i, i + 10);
    const d = await get(`${API}/positions?timestamps=${part.join(',')}&units=kilometers`);
    for (const p of d) out.push({ lat: p.latitude, lon: p.longitude, alt: p.altitude, at: p.timestamp * 1000 });
  }
  return out;
}

// the next time it clears her horizon, searched by walking forward in time
export async function nextPass(obsLat, obsLon, minAlt = 10) {
  const t0 = Math.floor(Date.now() / 1000);
  const coarse = [];
  for (let m = 0; m <= 100; m += 2) coarse.push(t0 + m * 60);
  const rough = await issAt(coarse);

  let best = null;
  for (const p of rough) {
    const a = lookAngles(obsLat, obsLon, p.lat, p.lon, p.alt);
    if (a.alt > (best ? best.alt : -90)) best = { ...a, at: p.at };
  }
  if (!best || best.alt < minAlt - 12) return { visible: false, best };

  // walk the minutes around the best sample to find where it actually peaks
  const c = Math.floor(best.at / 1000);
  const fine = [];
  for (let s = -150; s <= 150; s += 30) fine.push(c + s);
  const near = await issAt(fine);
  let peak = best, rise = null, set = null;
  for (const p of near) {
    const a = lookAngles(obsLat, obsLon, p.lat, p.lon, p.alt);
    if (a.alt > peak.alt) peak = { ...a, at: p.at };
    if (a.alt > 0) { if (rise === null) rise = p.at; set = p.at; }
  }
  return { visible: peak.alt >= minAlt, peak, rise, set };
}

export const ISS_FACTS = {
  speedKmS: 7.66,
  orbitMin: 93,
};
