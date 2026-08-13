// ============================================================
//  ما يمكن رصده الليلة — the observation list
//
//  Every object here is real and its position is computed for her
//  clock and her coordinates. Nothing is placed by hand.
// ============================================================
import * as Astro from './vendor/astronomy.js';

// her star: HD 219134, Cassiopeia, 21.35 light-years
Astro.DefineStar(Astro.Body.Star1, 23.2211, 57.1684, 21.35 / 3.26156);
// Vega, so the Summer Triangle has an anchor she can actually find
Astro.DefineStar(Astro.Body.Star2, 18.61565, 38.78369, 25.0 / 3.26156);
// Andromeda — the farthest thing a naked eye can reach
Astro.DefineStar(Astro.Body.Star3, 0.712306, 41.26917, 765000);
// Polaris, the one that never moves
Astro.DefineStar(Astro.Body.Star4, 2.529750, 89.26411, 447 / 3.26156);
// the Perseid radiant, which rains on her birthday
Astro.DefineStar(Astro.Body.Star5, 3.0667, 58.0, 1e6);

export const TARGETS = [
  {
    id: 'hers', body: Astro.Body.Star1, kind: 'star',
    ar: 'نجمتُكِ', lat: 'HD 219134 · Cassiopeia',
    mag: 5.6, hue: 0xfff0d6,
    facts: 'نجمةٌ في كوكبة ذات الكرسي، تبعد <b>٢١٫٣٥</b> سنة ضوئية، ولها كواكب تدور حولها.<br>'
         + 'الضوء الذي يلمس عينكِ الآن غادرها في <b>ربيع ٢٠٠٥</b> — عام ولادتكِ.',
    line: 'كنتُ أؤمن دائماً أن في السماء نجمةً تشبهكِ في سطوعها…<br>'
        + 'لكنني لم أكن أعلم أنّ ضوءها انطلق في ذات السنة التي جئتِ فيها لتضيئي دنيتي.<br>'
        + 'كل ليلة، ارفعي رأسكِ، ستجدينها هناك تقف في سمائكِ حارسةً لكِ.<br><br>'
        + 'كل عام وأنتِ قدري، ونوري الذي لا ينطفئ يا نُـورة.',
    prime: true,
  },
  {
    id: 'moon', body: Astro.Body.Moon, kind: 'moon',
    ar: 'القمر', lat: 'The Moon', mag: -12, hue: 0xf2ede4,
    facts: 'يبعد عنكِ الآن <b class="d"></b> ألف كيلومتر، ووجهه المضيء <b class="p"></b> بالمئة.<br>'
         + 'ضوءه يقطع المسافة إليكِ في <b>ثانية وربع</b> فقط.',
    line: 'القمر يتغيّر كل ليلة، ويظل الناس يكتبون فيه الشعر…<br>وأنتِ لا تتغيّرين، ولا يكفيكِ شِعر الدنيا كله.',
  },
  {
    id: 'venus', body: Astro.Body.Venus, kind: 'planet', ar: 'الزُّهَرة', lat: 'Venus',
    mag: -4, hue: 0xfff4d8,
    facts: 'ألمع ما في سمائكِ بعد الشمس والقمر · تبعد الآن <b class="d"></b> مليون كيلومتر.',
    line: 'سمّاها القدماء نجمة الحب، وظنّوها نجمتين لفرط جمالها.<br>ولو رأوكِ، لأعادوا تسميتها باسمكِ.',
  },
  {
    id: 'jupiter', body: Astro.Body.Jupiter, kind: 'planet', ar: 'المُشتري', lat: 'Jupiter',
    mag: -2, hue: 0xffe9c4,
    facts: 'أكبر كواكب المجموعة · يتّسع لألف أرض · تبعد الآن <b class="d"></b> مليون كيلومتر.<br>'
         + 'بمنظارٍ صغير ترين أقماره الأربعة الكبرى مصطفّة بجانبه.',
    line: 'أكبر كوكبٍ في مجموعتنا، ويظل أصغر من مساحتكِ في قلبي.',
  },
  {
    id: 'saturn', body: Astro.Body.Saturn, kind: 'planet', ar: 'زُحَل', lat: 'Saturn',
    mag: 0.5, hue: 0xf6e0b0,
    facts: 'صاحب الحلقات · تبعد الآن <b class="d"></b> مليون كيلومتر · ضوءه يستغرق نحو <b class="lt"></b> دقيقة ليصلكِ.',
    line: 'الكوكب الوحيد الذي يلبس خاتمه على مرأى من الكون كله…<br>وأنا أنتظر يومي.',
  },
  {
    id: 'mars', body: Astro.Body.Mars, kind: 'planet', ar: 'المرّيخ', lat: 'Mars',
    mag: 1.2, hue: 0xffb08a,
    facts: 'الكوكب الأحمر · تبعد الآن <b class="d"></b> مليون كيلومتر.',
    line: 'يبحث البشر فيه عن بيتٍ ثانٍ…<br>وأنا وجدت بيتي في عينيكِ من أول نظرة.',
  },
  {
    id: 'vega', body: Astro.Body.Star2, kind: 'star', ar: 'النَّسْرُ الواقِع', lat: 'Vega · Lyra',
    mag: 0, hue: 0xdce7ff,
    facts: 'أحد أضلاع مثلّث الصيف · يبعد ٢٥ سنة ضوئية · وسيصير نجم القطب بعد ١٢ ألف سنة.',
    line: 'نجمٌ سيقود الحائرين بعد اثني عشر ألف سنة…<br>وأنا اهتديتُ بكِ من أول ليلة.',
  },
  {
    id: 'polaris', body: Astro.Body.Star4, kind: 'star', ar: 'النَّجْمُ القُطْبِيّ', lat: 'Polaris',
    mag: 2, hue: 0xfff2e0,
    facts: 'النجم الذي لا يتحرك من مكانه · اهتدى به البحّارة والصحراويون آلاف السنين.<br>'
         + 'ارتفاعه فوق أفقكِ يساوي خط عرضكِ تماماً.',
    line: 'كل السماء تدور، وهو ثابت.<br>هكذا أنتِ في قلبي: كل شيء يتبدّل حولي، وأنتِ لا.',
  },
  {
    id: 'andromeda', body: Astro.Body.Star3, kind: 'deep', ar: 'مجرّة المرأة المُسَلْسَلة', lat: 'M31 · Andromeda',
    mag: 3.4, hue: 0xd9d4ff,
    facts: 'أبعد شيء تراه العين المجرّدة · تبعد <b>٢٫٥ مليون</b> سنة ضوئية.<br>'
         + 'الضوء الذي يصلكِ منها غادرها قبل أن يوجد البشر، وهي قادمة نحونا لتندمج بمجرّتنا.',
    line: 'مجرّتان تسيران نحو بعضهما منذ ملايين السنين لتصيرا واحدة…<br>مثلنا تماماً، إلا أننا سبقناهما.',
  },
  {
    id: 'perseids', body: Astro.Body.Star5, kind: 'radiant', ar: 'مَطَرُ ليلتِكِ', lat: 'Perseid Radiant',
    mag: 4, hue: 0xffc98a,
    facts: 'من هذه البقعة تنطلق شهب البرشاويات كل عام في ليلة ميلادكِ.<br>'
         + 'ما تحترق فيه ذرّاتٌ خلّفها مذنّبٌ يزور الشمس مرة كل ١٣٣ سنة.',
    line: 'الناس يتمنّون على الشهب…<br>والسماء نفسها تمطرها في ليلتكِ، احتفاءً بكِ.',
  },
];

// altitude, azimuth and distance for a target, right now, from here
export function locate(t, observer, time) {
  const eq = Astro.Equator(t.body, time, observer, true, true);
  const hor = Astro.Horizon(time, observer, eq.ra, eq.dec, 'normal');
  return { alt: hor.altitude, az: hor.azimuth, distAu: eq.dist };
}

// when does it next clear the horizon from here?
export function nextRise(t, observer, from) {
  try {
    const ev = Astro.SearchRiseSet(t.body, observer, +1, from, 2);
    return ev ? ev.date : null;
  } catch (_) { return null; }
}

export function moonInfo(time) {
  const ill = Astro.Illumination(Astro.Body.Moon, time);
  return { frac: ill.phase_fraction, phaseAngle: Astro.MoonPhase(time), distKm: ill.geo_dist * 149597870.7 };
}

export { Astro };
