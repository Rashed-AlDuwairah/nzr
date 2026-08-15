// ============================================================
//  سماؤكِ الآن — the briefing
//
//  Everything below is derived from two numbers she gives us — where
//  she is standing and what time it is there — and nothing else. Open
//  the page an hour later and every line of it has changed, because
//  the sky it describes has turned.
// ============================================================
import { TARGETS, locate, nextRise, moonInfo, Astro } from './targets.js';

const AR = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
export const arNum = n => String(n).split('').map(c => (c >= '0' && c <= '9') ? AR[+c] : c).join('');

// One horizon for the whole observatory. Below five degrees a thing is behind
// a building or lost in the haze, so promising it to her would be a lie.
export const MIN_ALT = 5;
const SUN_MAX = -6;

const COMPASS = [
  [0,'شمالكِ'], [45,'شمالكِ الشرقي'], [90,'شرقكِ'], [135,'جنوبكِ الشرقي'],
  [180,'جنوبكِ'], [225,'جنوبكِ الغربي'], [270,'غربكِ'], [315,'شمالكِ الغربي'],
];
export function dirName(az) {
  const a = ((az % 360) + 360) % 360;
  let best = COMPASS[0], bd = 999;
  for (const c of COMPASS) {
    const d = Math.min(Math.abs(a - c[0]), 360 - Math.abs(a - c[0]));
    if (d < bd) { bd = d; best = c; }
  }
  return best[1];
}

export function clock(d) {
  if (!d) return null;
  const H = d.getHours(), m = d.getMinutes();
  const h = H % 12 || 12;
  return `${arNum(h)}:${arNum(String(m).padStart(2, '0'))} ${H < 12 ? 'ص' : 'م'}`;
}

// how dark is it really, right now
export function sky(observer, time) {
  const eq = Astro.Equator(Astro.Body.Sun, time, observer, true, true);
  const h = Astro.Horizon(time, observer, eq.ra, eq.dec, 'normal');
  const a = h.altitude;
  if (a > 0)   return { alt: a, name: 'نهار',            note: 'الشمس ما زالت فوق الأفق — انتظري غروبها لترَي شيئاً.' };
  if (a > -6)  return { alt: a, name: 'غروب',            note: 'الشفق ما زال يغسل السماء، وأول النجوم بدأت تظهر.' };
  if (a > -12) return { alt: a, name: 'شفقٌ بحري',       note: 'السماء تُظلم الآن، والنجوم اللامعة صارت واضحة.' };
  if (a > -18) return { alt: a, name: 'شفقٌ فلكي',       note: 'بقيت آخر خيوط الضوء في الأفق، وما عداها ليل.' };
  return         { alt: a, name: 'ليلٌ كامل',           note: 'السماء في أعتم حالاتها الآن — هذا أفضل وقتٍ للرصد.' };
}

export function moonLine(time) {
  const m = moonInfo(time);
  const p = m.phaseAngle;   // 0 new, 90 first quarter, 180 full, 270 last
  let name = 'هلال';
  if (p < 22 || p > 338)      name = 'محاق';
  else if (p < 68)            name = 'هلالٌ أول';
  else if (p < 112)           name = 'تربيعٌ أول';
  else if (p < 158)           name = 'أحدبُ متزايد';
  else if (p < 202)           name = 'بدرٌ تام';
  else if (p < 248)           name = 'أحدبُ متناقص';
  else if (p < 292)           name = 'تربيعٌ أخير';
  else                        name = 'هلالٌ أخير';
  return { name, pct: Math.round(m.frac * 100), distKm: m.distKm };
}

// what is actually over her head at this second
export function census(observer, time) {
  const up = [], down = [];
  for (const t of TARGETS) {
    const p = locate(t, observer, time);
    if (p.stale) continue;                       // the live one, before it answers
    (p.alt > MIN_ALT ? up : down).push({ t, ...p });
  }
  up.sort((a, b) => b.alt - a.alt);
  return { up, down };
}

// the first few things worth turning towards, and when the rest arrive
export function upcoming(observer, time, list, limit = 3) {
  const out = [];
  for (const d of list) {
    if (d.t.kind === 'sat') continue;            // the station has its own clock
    const when = nextRise(d.t, observer, time);
    if (when) out.push({ t: d.t, when });
  }
  out.sort((a, b) => a.when - b.when);
  return out.slice(0, limit);
}

// what turned while she was away
export function sinceLast(observer, now) {
  let last = null;
  try { last = +localStorage.getItem('noor_obs_last') || null; } catch (_) {}
  try { localStorage.setItem('noor_obs_last', String(+now)); } catch (_) {}
  if (!last || now - last < 6 * 60000) return null;
  const hours = (now - last) / 3600000;
  const deg = (hours * 15.041) % 360;
  const risen = [];
  for (const t of TARGETS) {
    if (t.kind === 'sat') continue;
    const then = locate(t, observer, new Date(last));
    const nowp = locate(t, observer, now);
    if (then.alt <= MIN_ALT && nowp.alt > MIN_ALT) risen.push(t.ar);
  }
  return { hours, deg, risen, last: new Date(last) };
}

// ------------------------------------------------------------------
//  متى أراه؟ — when a thing is next actually observable
//
//  "Above the horizon" is not the same as "visible": Jupiter can be
//  overhead at noon and she will see nothing. Observable here means
//  more than MIN_ALT above her horizon while the Sun is more than
//  6° below it.
//
//  One pass over time serves every target at once: the Sun is checked
//  first at each step, which is the cheap test and rules out most of
//  the day outright.
// ------------------------------------------------------------------
function sunAlt(observer, time) {
  const eq = Astro.Equator(Astro.Body.Sun, time, observer, true, true);
  return Astro.Horizon(time, observer, eq.ra, eq.dec, 'normal').altitude;
}

export function observableNow(t, observer, time) {
  if (t.kind === 'sat') return false;
  return locate(t, observer, time).alt > MIN_ALT && sunAlt(observer, time) < SUN_MAX;
}

// { id: Date } for each target given, searching forward as far as maxDays
export function nextObservable(list, observer, from, maxDays = 40) {
  const want = list.filter(t => t.kind !== 'sat');
  const out = {};
  const scan = (startMs, endMs, stepMs) => {
    for (let ms = startMs; ms < endMs && want.length; ms += stepMs) {
      const d = new Date(+from + ms);
      if (sunAlt(observer, d) >= SUN_MAX) continue;
      for (let i = want.length - 1; i >= 0; i--) {
        if (locate(want[i], observer, d).alt > MIN_ALT) {
          out[want[i].id] = d;
          want.splice(i, 1);
        }
      }
    }
  };
  scan(0, 2 * 86400000, 10 * 60000);            // the next two nights, to the minute-ish
  scan(2 * 86400000, maxDays * 86400000, 3600000);  // then week by week, to the hour
  return out;
}

// Arabic counts its nouns by number: one, two, a few, many.
// "٣ ساعات" is right and "٣ ساعة" is not, so this is not decoration.
function count(n, one, two, few, many) {
  if (n === 1) return one;
  if (n === 2) return two;
  if (n >= 3 && n <= 10) return `${arNum(n)} ${few}`;
  return `${arNum(n)} ${many}`;
}
const hours   = n => count(n, 'ساعة', 'ساعتين', 'ساعات', 'ساعة');
const minutes = n => count(n, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة');
const days    = n => count(n, 'يوم', 'يومين', 'أيام', 'يوماً');

// "بعد ٣ ساعات" / "بعد ١١ يوماً" — how far off, said plainly
export function howFar(when, from) {
  const ms = when - from;
  const h = ms / 3600000;
  if (h < 1) return `بعد ${minutes(Math.max(1, Math.round(ms / 60000)))}`;
  if (h < 24) {
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return mm >= 5 ? `بعد ${hours(hh)} و${minutes(mm)}` : `بعد ${hours(hh)}`;
  }
  return `بعد ${days(Math.round(h / 24))}`;
}
export { hours, minutes, days };
