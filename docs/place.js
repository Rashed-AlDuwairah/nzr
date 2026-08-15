// ============================================================
//  أين تقف — finding her, properly
//
//  A single getCurrentPosition returns whatever the phone has lying
//  around: often a cell-tower guess several kilometres wide. Every
//  number this observatory prints is computed from that one pair of
//  coordinates, so it is worth spending twelve seconds getting it
//  right.
//
//  The algorithm:
//    1. If a good fix was saved on an earlier visit, use it at once so
//       the sky is never blank while we wait.
//    2. Open watchPosition at high accuracy with no cached answers.
//       The first fix is usually coarse; each one after it is better.
//    3. Keep the best-accuracy fix seen. Stop as soon as it is inside
//       GOOD_M, or when PATIENCE_MS have passed, whichever is first.
//    4. Keep watching quietly afterwards, and adopt any later fix that
//       beats the one in hand.
//    5. Save the result for next time.
//
//  Nothing here silently pretends: the caller is told the accuracy in
//  metres and where the answer came from.
// ============================================================
const KEY = 'noor_obs_place';
const GOOD_M = 30;          // good enough to stop early
const USABLE_M = 3000;      // beyond this the sky barely shifts, but say so
const PATIENCE_MS = 12000;  // how long we are willing to stand still
const SAVED_TTL = 90 * 86400000;

export const RIYADH = { lat: 24.7136, lon: 46.6753, accM: null, source: 'default' };

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && Date.now() - raw.at < SAVED_TTL && isFinite(raw.lat) && isFinite(raw.lon))
      return { lat: raw.lat, lon: raw.lon, accM: raw.accM, source: 'saved', at: raw.at };
  } catch (_) {}
  return null;
}
function save(p) {
  try { localStorage.setItem(KEY, JSON.stringify({ lat: p.lat, lon: p.lon, accM: p.accM, at: Date.now() })); }
  catch (_) {}
}

// how much of the sky a positional error actually costs her:
// one degree of latitude is 111 km, and altitude error tracks it directly
export function skyErrorDeg(accM) {
  return accM == null ? null : accM / 111000;
}

const AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
const arNum = n => String(n).split('').map(c => (c >= '0' && c <= '9') ? AR[+c] : c).join('');

export function describe(p) {
  if (p.source === 'gps') {
    const a = Math.round(p.accM);
    return a < 1000 ? `بدقّة ${arNum(a)} متراً` : `بدقّة ${arNum((a / 1000).toFixed(1))} كم`;
  }
  if (p.source === 'saved') return 'من زيارتكِ السابقة';
  return 'سماء الرياض';
}

// resolves with the best fix it can get; onBetter fires for refinements
export function acquire(onBetter) {
  const saved = load();
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(saved || { ...RIYADH });

    let best = null, settled = false, id = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      const out = best || saved || { ...RIYADH };
      if (best) save(best);
      resolve(out);
      // keep listening: a better fix a few seconds later is still worth having
      if (id != null) setTimeout(() => { try { navigator.geolocation.clearWatch(id); } catch (_) {} }, 20000);
    };
    const deadline = setTimeout(finish, PATIENCE_MS);

    const take = pos => {
      const c = pos.coords;
      const p = { lat: c.latitude, lon: c.longitude, accM: c.accuracy ?? 9999, source: 'gps', at: Date.now() };
      if (best && p.accM >= best.accM) return;      // no improvement, ignore
      best = p;
      if (settled) { save(p); if (onBetter) onBetter(p); return; }
      if (p.accM <= GOOD_M) { clearTimeout(deadline); finish(); }
    };
    const fail = () => { clearTimeout(deadline); finish(); };

    try {
      id = navigator.geolocation.watchPosition(take, fail,
        { enableHighAccuracy: true, maximumAge: 0, timeout: PATIENCE_MS });
    } catch (_) { fail(); }
  });
}

export { USABLE_M };
