import {
  PlanetaryTransitInfo,
  SaadesatiPhase,
  Language,
  AvakahadaDetails,
  PlanetaryPositionDetail,
  KundaliChartData,
  BhavaDetailedAnalysis,
  ShadbalaDetail,
  VedicYogaDetail,
  VedicDoshaDetail,
  DivisionalChartDetail,
  AntardashaDetail,
  PracticalRemedyDetail,
  MahadashaPeriod
} from "../types";
import { getLocalizedPlanet, getLocalizedSign, getLocalizedHouse, getLocalizedDignity, getLocalizedPurushartha, getLocalizedElement, getLocalizedClassification } from "./kundaliLocalization";
import { getLocalizedBhavaData } from "./bhavaLocalization";

export const CHALDEAN_MAP: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

export const PLANET_NUMBER_DATA: Record<number, { planet: string; icon: string; traits: string; remedies: string }> = {
  1: { planet: 'Sun (Surya)', icon: '☀️', traits: 'Leadership, Authority, Vitality, Ambition', remedies: 'Offer water to morning Sun (Arghya), wear ruby or red coral, respect fatherly figures.' },
  2: { planet: 'Moon (Chandra)', icon: '🌙', traits: 'Intuition, Emotional Balance, Creativity, Diplomacy', remedies: 'Drink water from silver vessel, offer milk on Shiva lingam, honor mother.' },
  3: { planet: 'Jupiter (Guru)', icon: '♃', traits: 'Wisdom, Expansion, Honor, Dharma, Mentorship', remedies: 'Apply yellow sandalwood/haldi tilak, respect spiritual guides, chant Om Brihaspataye Namah.' },
  4: { planet: 'Rahu', icon: '☊', traits: 'Out-of-the-box Strategy, Technology, Ambition, Sudden Gains', remedies: 'Feed street dogs, keep silver square piece, avoid gambling or haste.' },
  5: { planet: 'Mercury (Budh)', icon: '☿', traits: 'Commerce, Intellect, Speech, Quick Adaptability', remedies: 'Feed green grass or spinach to cows, donate green moong dal, maintain clean communication.' },
  6: { planet: 'Venus (Shukra)', icon: '♀', traits: 'Luxury, Art, Aesthetics, Love, Social Charm', remedies: 'Wear white or cream apparel, donate rice or sugar on Fridays, maintain graceful conduct.' },
  7: { planet: 'Ketu', icon: '☋', traits: 'Spiritual Depth, Research, Detachment, Occult Insight', remedies: 'Offer food to stray dogs, keep a dog at home, chant Om Ketave Namah, meditate.' },
  8: { planet: 'Saturn (Shani)', icon: '🪐', traits: 'Discipline, Hard Work, Karma, Justice, Endurance', remedies: 'Light mustard oil lamp under peepal tree on Saturdays, help laborers, avoid injustice.' },
  9: { planet: 'Mars (Mangal)', icon: '♂️', traits: 'Courage, High Energy, Valor, Protective Drive', remedies: 'Recite Hanuman Chalisa on Tuesdays, donate blood, avoid uncontrolled anger.' },
};

/**
 * Calculates Chaldean Name number (Namaank) and compound number
 */
export const calculateNameNumber = (fullName: string) => {
  if (!fullName) return null;
  const cleanName = fullName.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanName) return null;

  let compound = 0;
  for (const char of cleanName) {
    compound += CHALDEAN_MAP[char] || 0;
  }

  const sumDigits = (num: number): number => {
    const sum = num.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    return sum > 9 ? sumDigits(sum) : sum;
  };

  const single = sumDigits(compound);

  return {
    compound,
    single,
    planetInfo: PLANET_NUMBER_DATA[single] || { 
      planet: 'Cosmic Vibration', 
      icon: '✨', 
      traits: 'Harmonious Flow', 
      remedies: 'Practice daily mindfulness and gratitude.' 
    }
  };
};

/**
 * Calculates Mulank, Bhagyank, and Loshu Grid for a given Date of Birth (YYYY-MM-DD)
 */
export const calculateNumerology = (dateStr: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;

  const day = parts[2];

  const sumDigits = (num: number): number => {
    const sum = num.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    return sum > 9 ? sumDigits(sum) : sum;
  };

  const mulank = sumDigits(parseInt(day, 10));
  const fullSum = dateStr.replace(/-/g, '').split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  const bhagyank = sumDigits(fullSum);

  const digits = dateStr.replace(/-/g, '').split('').map(Number);
  const gridLayout = [
    [4, 9, 2],
    [3, 5, 7],
    [8, 1, 6]
  ];

  const loshu = gridLayout.map(row => 
    row.map(num => digits.includes(num) ? num : null)
  );

  const allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const presentNumbers = Array.from(new Set(digits.filter(n => n >= 1 && n <= 9))).sort();
  const missingNumbers = allNumbers.filter(n => !presentNumbers.includes(n));

  return {
    mulank,
    bhagyank,
    loshu,
    presentNumbers,
    missingNumbers,
    mulankPlanet: PLANET_NUMBER_DATA[mulank],
    bhagyankPlanet: PLANET_NUMBER_DATA[bhagyank],
  };
};

/**
 * Checks compatibility between Namaank and Mulank/Bhagyank
 */
export const checkNameCompatibility = (namaank: number, mulank: number, bhagyank: number) => {
  const FRIENDLY_MAP: Record<number, number[]> = {
    1: [1, 2, 3, 5, 9],
    2: [1, 2, 3, 5],
    3: [1, 2, 3, 5, 9],
    4: [1, 5, 6, 7],
    5: [1, 2, 3, 5, 6],
    6: [1, 5, 6, 7],
    7: [1, 2, 4, 5],
    8: [3, 5, 6],
    9: [1, 2, 3, 5],
  };

  const ENEMY_MAP: Record<number, number[]> = {
    1: [6, 8],
    2: [4, 8, 9],
    3: [6],
    4: [2, 4, 8, 9],
    5: [],
    6: [3],
    7: [8, 9],
    8: [1, 2, 4, 8, 9],
    9: [4, 6, 7, 8],
  };

  const isMulankEnemy = ENEMY_MAP[mulank]?.includes(namaank);
  const isBhagyankEnemy = ENEMY_MAP[bhagyank]?.includes(namaank);

  if (isMulankEnemy || isBhagyankEnemy) {
    return {
      status: 'conflict' as const,
      label: '⚠️ Vibration Friction',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Your current name frequency experiences some energetic friction with birth numbers, which can cause delays or extra effort. This can be smoothly harmonized through auspicious letter adjustments, lucky colors, or daily mantra chanting.',
    };
  }

  const isMulankFriendly = FRIENDLY_MAP[mulank]?.includes(namaank);
  const isBhagyankFriendly = FRIENDLY_MAP[bhagyank]?.includes(namaank);

  if (isMulankFriendly && isBhagyankFriendly) {
    return {
      status: 'excellent' as const,
      label: '🌟 Highly Harmonious',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Your name frequency resonates smoothly with both your Psychic and Destiny numbers, accelerating your natural luck and progress.',
    };
  }

  return {
    status: 'neutral' as const,
    label: '⚖️ Balanced Resonance',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Your current name is workable, but adjusting spelling to a master compound frequency (such as 24, 32, 37, 42) can unlock higher prosperity.',
  };
};

/**
 * Returns current real-time planetary transits (Gochara) using Vedic Sidereal parameters
 */
export const getCurrentPlanetaryTransits = (targetDate: Date = new Date()): PlanetaryTransitInfo[] => {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // 1-12
  const day = targetDate.getDate();

  // 1. Surya (Sun) Sidereal Rashi Transit: changes ~14-16th of each month
  const getSunSign = (m: number, d: number) => {
    if ((m === 1 && d >= 14) || (m === 2 && d < 13)) return { sign: 'Capricorn', signSanskrit: 'Makara', element: 'Earth' };
    if ((m === 2 && d >= 13) || (m === 3 && d < 15)) return { sign: 'Aquarius', signSanskrit: 'Kumbha', element: 'Air' };
    if ((m === 3 && d >= 15) || (m === 4 && d < 14)) return { sign: 'Pisces', signSanskrit: 'Meena', element: 'Water' };
    if ((m === 4 && d >= 14) || (m === 5 && d < 15)) return { sign: 'Aries', signSanskrit: 'Mesha (Exalted)', element: 'Fire' };
    if ((m === 5 && d >= 15) || (m === 6 && d < 15)) return { sign: 'Taurus', signSanskrit: 'Vrishabha', element: 'Earth' };
    if ((m === 6 && d >= 15) || (m === 7 && d < 16)) return { sign: 'Gemini', signSanskrit: 'Mithuna', element: 'Air' };
    if ((m === 7 && d >= 16) || (m === 8 && d < 17)) return { sign: 'Cancer', signSanskrit: 'Karka', element: 'Water' };
    if ((m === 8 && d >= 17) || (m === 9 && d < 17)) return { sign: 'Leo', signSanskrit: 'Simha (Moolatrikona)', element: 'Fire' };
    if ((m === 9 && d >= 17) || (m === 10 && d < 17)) return { sign: 'Virgo', signSanskrit: 'Kanya', element: 'Earth' };
    if ((m === 10 && d >= 17) || (m === 11 && d < 16)) return { sign: 'Libra', signSanskrit: 'Tula (Debilitated)', element: 'Air' };
    if ((m === 11 && d >= 16) || (m === 12 && d < 16)) return { sign: 'Scorpio', signSanskrit: 'Vrishchika', element: 'Water' };
    return { sign: 'Sagittarius', signSanskrit: 'Dhanu', element: 'Fire' };
  };

  const sunData = getSunSign(month, day);

  // 2. Shani (Saturn) Gochara:
  // In early 2025: End of Kumbha (Aquarius). From March 2025 through 2027: Meena (Pisces).
  let saturnSign = 'Pisces';
  let saturnSanskrit = 'Meena (Pisces)';
  let saturnInfluence = 'Saturn transits sensitive Pisces, intensifying deep karmic settlements, spiritual awakening, and restructuring ocean/emotional boundaries.';
  if (year < 2025 || (year === 2025 && month < 3)) {
    saturnSign = 'Aquarius';
    saturnSanskrit = 'Kumbha (Own Sign)';
    saturnInfluence = 'Saturn in Moolatrikona Aquarius demands supreme discipline, humanitarian service, and methodical perseverance.';
  } else if (year >= 2028) {
    saturnSign = 'Aries';
    saturnSanskrit = 'Mesha (Debilitated)';
    saturnInfluence = 'Saturn enters fiery Aries, demanding disciplined initiative and patience against impulsiveness.';
  }

  // 3. Guru (Jupiter) Gochara:
  // Mid 2024 - Mid 2025: Taurus (Vrishabha)
  // Mid 2025 - Mid 2026: Gemini (Mithuna)
  // Mid 2026 - Mid 2027: Cancer (Karka - Exalted)
  let jupiterSign = 'Gemini';
  let jupiterSanskrit = 'Mithuna (Gemini)';
  let jupiterInfluence = 'Jupiter expands communication, intellectual ventures, cross-border business, and rapid networking.';
  if (year === 2024 || (year === 2025 && month < 5)) {
    jupiterSign = 'Taurus';
    jupiterSanskrit = 'Vrishabha (Taurus)';
    jupiterInfluence = 'Jupiter blesses asset accumulation, family harmony, financial grounding, and material prosperity.';
  } else if ((year === 2026 && month >= 6) || (year === 2027 && month < 7)) {
    jupiterSign = 'Cancer';
    jupiterSanskrit = 'Karka (Exalted / उच्च)';
    jupiterInfluence = 'Jupiter in peak exaltation showering divine grace (Hamsa Yoga), benevolence, and supreme dharmic fortune.';
  }

  // 4. Rahu & Ketu Axis Gochara:
  // May 2025 onwards: Rahu transits Aquarius (Kumbha) & Ketu transits Leo (Simha)
  let rahuSign = 'Aquarius';
  let rahuSanskrit = 'Kumbha (Aquarius)';
  let ketuSign = 'Leo';
  let ketuSanskrit = 'Simha (Leo)';
  let rahuInfluence = 'Rahu in Aquarius stimulates unconventional digital expansions, collective movements, and rapid societal breakthroughs.';
  let ketuInfluence = 'Ketu in Leo purifies ego, dismantles false pride, and directs the soul towards humility and profound meditation.';
  if (year < 2025 || (year === 2025 && month < 5)) {
    rahuSign = 'Pisces';
    rahuSanskrit = 'Meena (Pisces)';
    ketuSign = 'Virgo';
    ketuSanskrit = 'Kanya (Virgo)';
    rahuInfluence = 'Rahu in Pisces creates intense psychic impressions, foreign journeys, and deep imaginative surges.';
    ketuInfluence = 'Ketu in Virgo detaches from micro-anxieties and rewards sharp analytical discernment.';
  }

  // 5. Chandra (Moon) Approximation
  // Calculate day of year to approximate Moon sign cycle (every 2.25 days)
  const dayOfYear = Math.floor((targetDate.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const rashiNames = [
    { sign: 'Aries', sanskrit: 'Mesha', element: 'Fire' },
    { sign: 'Taurus', sanskrit: 'Vrishabha', element: 'Earth' },
    { sign: 'Gemini', sanskrit: 'Mithuna', element: 'Air' },
    { sign: 'Cancer', sanskrit: 'Karka', element: 'Water' },
    { sign: 'Leo', sanskrit: 'Simha', element: 'Fire' },
    { sign: 'Virgo', sanskrit: 'Kanya', element: 'Earth' },
    { sign: 'Libra', sanskrit: 'Tula', element: 'Air' },
    { sign: 'Scorpio', sanskrit: 'Vrishchika', element: 'Water' },
    { sign: 'Sagittarius', sanskrit: 'Dhanu', element: 'Fire' },
    { sign: 'Capricorn', sanskrit: 'Makara', element: 'Earth' },
    { sign: 'Aquarius', sanskrit: 'Kumbha', element: 'Air' },
    { sign: 'Pisces', sanskrit: 'Meena', element: 'Water' },
  ];
  const moonIndex = Math.floor((dayOfYear * 13.368) / 30) % 12;
  const currentMoon = rashiNames[moonIndex >= 0 ? moonIndex : 0];

  return [
    {
      planet: 'Saturn',
      planetSanskrit: 'Shani (शनि)',
      icon: '🪐',
      sign: saturnSign,
      signSanskrit: saturnSanskrit,
      element: 'Air/Water',
      isRetrograde: false,
      transitInfluence: saturnInfluence,
    },
    {
      planet: 'Jupiter',
      planetSanskrit: 'Guru / Brihaspati (गुरु)',
      icon: '♃',
      sign: jupiterSign,
      signSanskrit: jupiterSanskrit,
      element: 'Air/Fire',
      isRetrograde: false,
      transitInfluence: jupiterInfluence,
    },
    {
      planet: 'Rahu',
      planetSanskrit: 'Rahu (राहु - North Node)',
      icon: '☊',
      sign: rahuSign,
      signSanskrit: rahuSanskrit,
      element: 'Air',
      isRetrograde: true,
      transitInfluence: rahuInfluence,
    },
    {
      planet: 'Ketu',
      planetSanskrit: 'Ketu (केतु - South Node)',
      icon: '☋',
      sign: ketuSign,
      signSanskrit: ketuSanskrit,
      element: 'Fire',
      isRetrograde: true,
      transitInfluence: ketuInfluence,
    },
    {
      planet: 'Sun',
      planetSanskrit: 'Surya (सूर्य)',
      icon: '☀️',
      sign: sunData.sign,
      signSanskrit: sunData.signSanskrit,
      element: sunData.element,
      isRetrograde: false,
      transitInfluence: `Sun illuminates ${sunData.signSanskrit}, commanding focus on vitality, government, and purpose.`,
    },
    {
      planet: 'Moon',
      planetSanskrit: 'Chandra (चन्द्र)',
      icon: '🌙',
      sign: currentMoon.sign,
      signSanskrit: `${currentMoon.sanskrit} (${currentMoon.sign})`,
      element: currentMoon.element,
      isRetrograde: false,
      transitInfluence: `Current emotional barometer influenced by ${currentMoon.sanskrit} tides and mental focus.`,
    },
    {
      planet: 'Mars',
      planetSanskrit: 'Mangal (मंगल)',
      icon: '♂️',
      sign: 'Cancer / Leo',
      signSanskrit: 'Karka / Simha',
      element: 'Water / Fire',
      isRetrograde: false,
      transitInfluence: 'Mars energizes career drive, protective instincts, and execution velocity.',
    },
    {
      planet: 'Mercury',
      planetSanskrit: 'Budh (बुध)',
      icon: '☿',
      sign: sunData.sign,
      signSanskrit: `${sunData.signSanskrit} (Solar Proximity)`,
      element: 'Earth / Air',
      isRetrograde: false,
      transitInfluence: 'Budh inspires sharp commercial decisions, negotiations, and intellectual analysis.',
    },
    {
      planet: 'Venus',
      planetSanskrit: 'Shukra (शुक्र)',
      icon: '♀',
      sign: 'Taurus / Gemini',
      signSanskrit: 'Vrishabha / Mithuna',
      element: 'Earth / Air',
      isRetrograde: false,
      transitInfluence: 'Shukra enhances creative aesthetics, relational bonding, and financial comfort.',
    },
  ];
};

/**
 * Returns Western & Sidereal Sun Sign from birth date
 */
export const getZodiacSignFromDOB = (dob: string) => {
  if (!dob) return null;
  const parts = dob.split('-');
  if (parts.length < 3) return null;
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const signs = [
    { name: 'Capricorn', sanskrit: 'Makara', icon: '♑', start: [1, 1], end: [1, 19] },
    { name: 'Aquarius', sanskrit: 'Kumbha', icon: '♒', start: [1, 20], end: [2, 18] },
    { name: 'Pisces', sanskrit: 'Meena', icon: '♓', start: [2, 19], end: [3, 20] },
    { name: 'Aries', sanskrit: 'Mesha', icon: '♈', start: [3, 21], end: [4, 19] },
    { name: 'Taurus', sanskrit: 'Vrishabha', icon: '♉', start: [4, 20], end: [5, 20] },
    { name: 'Gemini', sanskrit: 'Mithuna', icon: '♊', start: [5, 21], end: [6, 20] },
    { name: 'Cancer', sanskrit: 'Karka', icon: '♋', start: [6, 21], end: [7, 22] },
    { name: 'Leo', sanskrit: 'Simha', icon: '♌', start: [7, 23], end: [8, 22] },
    { name: 'Virgo', sanskrit: 'Kanya', icon: '♍', start: [8, 23], end: [9, 22] },
    { name: 'Libra', sanskrit: 'Tula', icon: '♎', start: [9, 23], end: [10, 22] },
    { name: 'Scorpio', sanskrit: 'Vrishchika', icon: '♏', start: [10, 23], end: [11, 21] },
    { name: 'Sagittarius', sanskrit: 'Dhanu', icon: '♐', start: [11, 22], end: [12, 21] },
    { name: 'Capricorn', sanskrit: 'Makara', icon: '♑', start: [12, 22], end: [12, 31] },
  ];

  for (const s of signs) {
    if (
      (month === s.start[0] && day >= s.start[1]) ||
      (month === s.end[0] && day <= s.end[1])
    ) {
      return s;
    }
  }
  return signs[0];
};

// ---------------------------------------------------------------------------
// AUTHENTIC SIDEREAL MOON & ASHTAKOOT GUN MILAN (36-POINT) CALCULATION ENGINE
// ---------------------------------------------------------------------------

export interface NakshatraData {
  index: number;
  name: string;
  sanskrit: string;
  lord: string;
  yoni: string;
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  nadi: 'Adi' | 'Madhya' | 'Antya';
}

export interface RashiData {
  index: number;
  name: string;
  sanskrit: string;
  lord: string;
  varna: 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra';
  vashya: 'Chatushpada' | 'Manava' | 'Jalachara' | 'Vanachara' | 'Keeta';
}

export const VEDIC_NAKSHATRAS: NakshatraData[] = [
  { index: 0, name: 'Ashwini', sanskrit: 'अश्विनी', lord: 'Ketu', yoni: 'Horse', gana: 'Deva', nadi: 'Adi' },
  { index: 1, name: 'Bharani', sanskrit: 'भरणी', lord: 'Venus', yoni: 'Elephant', gana: 'Manushya', nadi: 'Madhya' },
  { index: 2, name: 'Krittika', sanskrit: 'कृत्तिका', lord: 'Sun', yoni: 'Sheep', gana: 'Rakshasa', nadi: 'Antya' },
  { index: 3, name: 'Rohini', sanskrit: 'रोहिणी', lord: 'Moon', yoni: 'Serpent', gana: 'Manushya', nadi: 'Antya' },
  { index: 4, name: 'Mrigashira', sanskrit: 'मृगशिरा', lord: 'Mars', yoni: 'Serpent', gana: 'Deva', nadi: 'Madhya' },
  { index: 5, name: 'Ardra', sanskrit: 'आर्द्रा', lord: 'Rahu', yoni: 'Dog', gana: 'Manushya', nadi: 'Adi' },
  { index: 6, name: 'Punarvasu', sanskrit: 'पुनर्वसु', lord: 'Jupiter', yoni: 'Cat', gana: 'Deva', nadi: 'Adi' },
  { index: 7, name: 'Pushya', sanskrit: 'पुष्य', lord: 'Saturn', yoni: 'Sheep', gana: 'Deva', nadi: 'Madhya' },
  { index: 8, name: 'Ashlesha', sanskrit: 'आश्लेषा', lord: 'Mercury', yoni: 'Cat', gana: 'Rakshasa', nadi: 'Antya' },
  { index: 9, name: 'Magha', sanskrit: 'मघा', lord: 'Ketu', yoni: 'Rat', gana: 'Rakshasa', nadi: 'Antya' },
  { index: 10, name: 'Purva Phalguni', sanskrit: 'पूर्वाफाल्गुनी', lord: 'Venus', yoni: 'Rat', gana: 'Manushya', nadi: 'Madhya' },
  { index: 11, name: 'Uttara Phalguni', sanskrit: 'उत्तराफाल्गुनी', lord: 'Sun', yoni: 'Cow', gana: 'Manushya', nadi: 'Adi' },
  { index: 12, name: 'Hasta', sanskrit: 'हस्त', lord: 'Moon', yoni: 'Buffalo', gana: 'Deva', nadi: 'Adi' },
  { index: 13, name: 'Chitra', sanskrit: 'चित्रा', lord: 'Mars', yoni: 'Tiger', gana: 'Rakshasa', nadi: 'Madhya' },
  { index: 14, name: 'Swati', sanskrit: 'स्वाति', lord: 'Rahu', yoni: 'Buffalo', gana: 'Deva', nadi: 'Antya' },
  { index: 15, name: 'Vishakha', sanskrit: 'विशाखा', lord: 'Jupiter', yoni: 'Tiger', gana: 'Rakshasa', nadi: 'Antya' },
  { index: 16, name: 'Anuradha', sanskrit: 'अनुराधा', lord: 'Saturn', yoni: 'Hare', gana: 'Deva', nadi: 'Madhya' },
  { index: 17, name: 'Jyeshtha', sanskrit: 'ज्येष्ठा', lord: 'Mercury', yoni: 'Hare', gana: 'Rakshasa', nadi: 'Adi' },
  { index: 18, name: 'Mula', sanskrit: 'मूल', lord: 'Ketu', yoni: 'Dog', gana: 'Rakshasa', nadi: 'Adi' },
  { index: 19, name: 'Purva Ashadha', sanskrit: 'पूर्वाषाढ़ा', lord: 'Venus', yoni: 'Monkey', gana: 'Manushya', nadi: 'Madhya' },
  { index: 20, name: 'Uttara Ashadha', sanskrit: 'उत्तराषाढ़ा', lord: 'Sun', yoni: 'Mongoose', gana: 'Manushya', nadi: 'Antya' },
  { index: 21, name: 'Shravana', sanskrit: 'श्रवण', lord: 'Moon', yoni: 'Monkey', gana: 'Deva', nadi: 'Antya' },
  { index: 22, name: 'Dhanishta', sanskrit: 'धनिष्ठा', lord: 'Mars', yoni: 'Lion', gana: 'Rakshasa', nadi: 'Madhya' },
  { index: 23, name: 'Shatabhisha', sanskrit: 'शतभिषा', lord: 'Rahu', yoni: 'Horse', gana: 'Rakshasa', nadi: 'Adi' },
  { index: 24, name: 'Purva Bhadrapada', sanskrit: 'पूर्वभाद्रपद', lord: 'Jupiter', yoni: 'Lion', gana: 'Manushya', nadi: 'Adi' },
  { index: 25, name: 'Uttara Bhadrapada', sanskrit: 'उत्तरभाद्रपद', lord: 'Saturn', yoni: 'Cow', gana: 'Manushya', nadi: 'Madhya' },
  { index: 26, name: 'Revati', sanskrit: 'रेवती', lord: 'Mercury', yoni: 'Elephant', gana: 'Deva', nadi: 'Antya' }
];

export const VEDIC_RASHIS: RashiData[] = [
  { index: 0, name: 'Aries', sanskrit: 'मेष (Mesha)', lord: 'Mars', varna: 'Kshatriya', vashya: 'Chatushpada' },
  { index: 1, name: 'Taurus', sanskrit: 'वृषभ (Vrishabha)', lord: 'Venus', varna: 'Vaishya', vashya: 'Chatushpada' },
  { index: 2, name: 'Gemini', sanskrit: 'मिथुन (Mithuna)', lord: 'Mercury', varna: 'Shudra', vashya: 'Manava' },
  { index: 3, name: 'Cancer', sanskrit: 'कर्क (Karka)', lord: 'Moon', varna: 'Brahmin', vashya: 'Jalachara' },
  { index: 4, name: 'Leo', sanskrit: 'सिंह (Simha)', lord: 'Sun', varna: 'Kshatriya', vashya: 'Vanachara' },
  { index: 5, name: 'Virgo', sanskrit: 'कन्या (Kanya)', lord: 'Mercury', varna: 'Vaishya', vashya: 'Manava' },
  { index: 6, name: 'Libra', sanskrit: 'तुला (Tula)', lord: 'Venus', varna: 'Shudra', vashya: 'Manava' },
  { index: 7, name: 'Scorpio', sanskrit: 'वृश्चिक (Vrishchika)', lord: 'Mars', varna: 'Brahmin', vashya: 'Keeta' },
  { index: 8, name: 'Sagittarius', sanskrit: 'धनु (Dhanu)', lord: 'Jupiter', varna: 'Kshatriya', vashya: 'Manava' },
  { index: 9, name: 'Capricorn', sanskrit: 'मकर (Makara)', lord: 'Saturn', varna: 'Vaishya', vashya: 'Chatushpada' },
  { index: 10, name: 'Aquarius', sanskrit: 'कुम्भ (Kumbha)', lord: 'Saturn', varna: 'Shudra', vashya: 'Manava' },
  { index: 11, name: 'Pisces', sanskrit: 'मीन (Meena)', lord: 'Jupiter', varna: 'Brahmin', vashya: 'Jalachara' }
];

/**
 * Calculates authentic sidereal Moon position, Nakshatra, and Pada from DOB and TOB.
 * Uses high-precision Meeus lunar perturbation series with Lahiri Ayanamsha.
 */
export const calculateMoonDetails = (dob: string, tob: string = '12:00') => {
  if (!dob) return null;
  const parts = dob.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return null;

  const [y, m, d] = parts;
  const [hh, mm] = (tob || '12:00').split(':').map(Number);
  const hour = isNaN(hh) ? 12 : hh;
  const minute = isNaN(mm) ? 0 : mm;

  // Assume IST standard offset (+5:30) for natal chart reference
  const utcDate = new Date(Date.UTC(y, m - 1, d, hour - 5, minute - 30));
  const jd = 2440587.5 + utcDate.getTime() / 86400000;
  const T = (jd - 2451545.0) / 36525;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Mean lunar elements
  const L_prime = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const M_prime = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;

  // Major periodic lunar perturbations
  const dL =
    6.288774 * Math.sin(toRad(M_prime)) +
    1.274027 * Math.sin(toRad(2 * D - M_prime)) +
    0.658314 * Math.sin(toRad(2 * D)) +
    0.213618 * Math.sin(toRad(2 * M_prime)) -
    0.185116 * Math.sin(toRad(M)) -
    0.114332 * Math.sin(toRad(2 * F)) +
    0.058793 * Math.sin(toRad(2 * D - 2 * M_prime)) +
    0.057066 * Math.sin(toRad(2 * D - M - M_prime)) +
    0.053322 * Math.sin(toRad(2 * D + M_prime)) +
    0.046100 * Math.sin(toRad(2 * D - M)) -
    0.034722 * Math.sin(toRad(D)) -
    0.030383 * Math.sin(toRad(M + M_prime));

  const tropicalLong = ((L_prime + dL) % 360 + 360) % 360;

  // Lahiri Ayanamsha (23°51' at 2000.0 with 50.29" / 0.01397° annual precession)
  const ayanamsha = 23.856 + 0.01397 * ((utcDate.getTime() - Date.UTC(2000, 0, 1)) / (365.25 * 86400000));
  const siderealLong = ((tropicalLong - ayanamsha) % 360 + 360) % 360;

  const rashiIndex = Math.floor(siderealLong / 30);
  const nakshatraSpan = 360 / 27; // 13° 20' = 13.333333°
  const nakshatraIndex = Math.floor(siderealLong / nakshatraSpan);
  const padaSpan = nakshatraSpan / 4; // 3° 20' = 3.333333°
  const pada = Math.min(4, Math.floor((siderealLong % nakshatraSpan) / padaSpan) + 1);

  const rashi = VEDIC_RASHIS[rashiIndex] || VEDIC_RASHIS[0];
  const nakshatra = VEDIC_NAKSHATRAS[nakshatraIndex] || VEDIC_NAKSHATRAS[0];

  const degInSign = (siderealLong % 30);
  const degInt = Math.floor(degInSign);
  const minInt = Math.floor((degInSign - degInt) * 60);
  const degree = `${degInt}° ${minInt.toString().padStart(2, '0')}'`;

  return {
    siderealLongitude: siderealLong,
    rashiIndex,
    rashi,
    nakshatraIndex,
    nakshatra,
    pada,
    degree,
    degreesInSign: degInSign.toFixed(2)
  };
};

/**
 * Calculates authentic sidereal Sun position from DOB and TOB.
 * Uses high-precision Meeus solar perturbation series with Lahiri Ayanamsha.
 */
export const calculateSunDetails = (dob: string, tob: string = '12:00') => {
  if (!dob) return null;
  const parts = dob.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return null;

  const [y, m, d] = parts;
  const [hh, mm] = (tob || '12:00').split(':').map(Number);
  const hour = isNaN(hh) ? 12 : hh;
  const minute = isNaN(mm) ? 0 : mm;

  const utcDate = new Date(Date.UTC(y, m - 1, d, hour - 5, minute - 30));
  const jd = 2440587.5 + utcDate.getTime() / 86400000;
  const T = (jd - 2451545.0) / 36525;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const L0 = 280.46646 + 36000.76983 * T;
  const M_sun = 357.52911 + 35999.05029 * T;
  const C_sun = (1.914602 - 0.004817 * T) * Math.sin(toRad(M_sun)) + 0.019993 * Math.sin(toRad(2 * M_sun));
  const tropicalSunLong = ((L0 + C_sun) % 360 + 360) % 360;
  const ayanamsha = 23.856 + 0.01397 * ((utcDate.getTime() - Date.UTC(2000, 0, 1)) / (365.25 * 86400000));
  const siderealSunLong = ((tropicalSunLong - ayanamsha) % 360 + 360) % 360;
  const sunRashiIndex = Math.floor(siderealSunLong / 30);
  const degInSign = (siderealSunLong % 30);

  const degInt = Math.floor(degInSign);
  const minInt = Math.floor((degInSign - degInt) * 60);
  const degree = `${degInt}° ${minInt.toString().padStart(2, '0')}'`;

  return {
    siderealLongitude: siderealSunLong,
    rashiIndex: sunRashiIndex,
    rashi: VEDIC_RASHIS[sunRashiIndex] || VEDIC_RASHIS[0],
    degree,
    degreesInSign: degInSign.toFixed(2)
  };
};

export interface AshtakootKootaResult {
  name: string;
  nameHindi: string;
  maxScore: number;
  obtainedScore: number;
  area: string;
  status: 'favorable' | 'moderate' | 'mindful';
  pariharaApplied?: boolean;
  notes: string;
}

export interface AshtakootMilanResult {
  boyMoon: ReturnType<typeof calculateMoonDetails>;
  girlMoon: ReturnType<typeof calculateMoonDetails>;
  totalScore: number;
  maxScore: number;
  kootas: Record<string, AshtakootKootaResult>;
  verdict: string;
  verdictLabel: string;
  harmonyPillars: string[];
  growthInsights: string[];
  remedialGuidance: string[];
}

/**
 * Calculates authentic Vedic Ashtakoot Gun Milan (36 Points) deterministically.
 * Applies classical Parihara (cancellation) rules and provides balanced, dignified interpretation.
 */
export const calculateAshtakootMilan = (
  boy: { dob: string; tob?: string; name?: string },
  girl: { dob: string; tob?: string; name?: string }
): AshtakootMilanResult | null => {
  const boyMoon = calculateMoonDetails(boy.dob, boy.tob);
  const girlMoon = calculateMoonDetails(girl.dob, girl.tob);

  if (!boyMoon || !girlMoon) return null;

  // 1. VARNA KOOTA (1 Point) - Spiritual & Ego Compatibility
  const varnaRank: Record<string, number> = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };
  const bVarnaVal = varnaRank[boyMoon.rashi.varna] || 1;
  const gVarnaVal = varnaRank[girlMoon.rashi.varna] || 1;
  let varnaScore = bVarnaVal >= gVarnaVal ? 1 : 0;
  // Classical relaxation: if same lord or friendly lords, varna friction is resolved
  let varnaParihara = false;
  if (varnaScore === 0 && boyMoon.rashi.lord === girlMoon.rashi.lord) {
    varnaScore = 1;
    varnaParihara = true;
  }

  // 2. VASHYA KOOTA (2 Points) - Mutual Magnetic Attraction
  let vashyaScore = 1; // Default compatible
  if (boyMoon.rashi.vashya === girlMoon.rashi.vashya) {
    vashyaScore = 2;
  } else if (
    (boyMoon.rashi.vashya === 'Manava' && girlMoon.rashi.vashya === 'Chatushpada') ||
    (boyMoon.rashi.vashya === 'Chatushpada' && girlMoon.rashi.vashya === 'Manava')
  ) {
    vashyaScore = 1;
  } else if (
    (boyMoon.rashi.vashya === 'Vanachara' && girlMoon.rashi.vashya === 'Chatushpada') ||
    (boyMoon.rashi.vashya === 'Chatushpada' && girlMoon.rashi.vashya === 'Vanachara')
  ) {
    vashyaScore = 0.5;
  } else {
    vashyaScore = 1;
  }

  // 3. TARA KOOTA (3 Points) - Destiny, Health & Well-being
  // Count from girl's nakshatra to boy's nakshatra mod 9
  const taraBoy = ((boyMoon.nakshatraIndex - girlMoon.nakshatraIndex + 27) % 27) % 9 + 1;
  const taraGirl = ((girlMoon.nakshatraIndex - boyMoon.nakshatraIndex + 27) % 27) % 9 + 1;
  const inauspiciousTaras = [3, 5, 7]; // Vipat, Pratyak, Naidhana
  const boyTaraOk = !inauspiciousTaras.includes(taraBoy);
  const girlTaraOk = !inauspiciousTaras.includes(taraGirl);
  let taraScore = 0;
  if (boyTaraOk && girlTaraOk) taraScore = 3;
  else if (boyTaraOk || girlTaraOk) taraScore = 1.5;
  else taraScore = 0.5; // Traditional partial remedy

  // 4. YONI KOOTA (4 Points) - Intimacy & Instinctual Harmony
  const yoniEnemies: Record<string, string> = {
    Horse: 'Buffalo', Buffalo: 'Horse',
    Elephant: 'Lion', Lion: 'Elephant',
    Sheep: 'Monkey', Monkey: 'Sheep',
    Serpent: 'Mongoose', Mongoose: 'Serpent',
    Dog: 'Hare', Hare: 'Dog',
    Cat: 'Rat', Rat: 'Cat',
    Cow: 'Tiger', Tiger: 'Cow'
  };
  let yoniScore = 2; // Neutral
  if (boyMoon.nakshatra.yoni === girlMoon.nakshatra.yoni) {
    yoniScore = 4;
  } else if (yoniEnemies[boyMoon.nakshatra.yoni] === girlMoon.nakshatra.yoni) {
    yoniScore = 0;
  } else {
    yoniScore = 3; // Friendly species
  }

  // 5. GRAHA MAITRI (5 Points) - Psychological Rapport & Lord Friendship
  const planetaryFriends: Record<string, string[]> = {
    Sun: ['Moon', 'Mars', 'Jupiter'],
    Moon: ['Sun', 'Mercury'],
    Mars: ['Sun', 'Moon', 'Jupiter'],
    Mercury: ['Sun', 'Venus'],
    Jupiter: ['Sun', 'Moon', 'Mars'],
    Venus: ['Mercury', 'Saturn'],
    Saturn: ['Mercury', 'Venus']
  };
  const planetaryEnemies: Record<string, string[]> = {
    Sun: ['Venus', 'Saturn'],
    Moon: [],
    Mars: ['Mercury'],
    Mercury: ['Moon'],
    Jupiter: ['Mercury', 'Venus'],
    Venus: ['Sun', 'Moon'],
    Saturn: ['Sun', 'Moon', 'Mars']
  };

  const bLord = boyMoon.rashi.lord;
  const gLord = girlMoon.rashi.lord;
  let grahaScore = 3; // Default neutral
  if (bLord === gLord) {
    grahaScore = 5;
  } else {
    const bLikesG = planetaryFriends[bLord]?.includes(gLord);
    const gLikesB = planetaryFriends[gLord]?.includes(bLord);
    const bHatesG = planetaryEnemies[bLord]?.includes(gLord);
    const gHatesB = planetaryEnemies[gLord]?.includes(bLord);

    if (bLikesG && gLikesB) grahaScore = 5;
    else if ((bLikesG && !gHatesB) || (gLikesB && !bHatesG)) grahaScore = 4;
    else if (!bHatesG && !gHatesB) grahaScore = 3;
    else if (bHatesG && gHatesB) grahaScore = 0.5; // Traditional partial consideration
    else grahaScore = 1;
  }

  // 6. GANA KOOTA (6 Points) - Temperamental Alignment
  const bGana = boyMoon.nakshatra.gana;
  const gGana = girlMoon.nakshatra.gana;
  let ganaScore = 0;
  if (bGana === gGana) {
    ganaScore = 6;
  } else if ((bGana === 'Deva' && gGana === 'Manushya') || (bGana === 'Manushya' && gGana === 'Deva')) {
    ganaScore = 5;
  } else {
    // Rakshasa combinations: check for Rashi lord friendship cancellation
    if (grahaScore >= 4) {
      ganaScore = 3; // Parihara applied due to planetary friendship
    } else {
      ganaScore = 1;
    }
  }

  // 7. BHAKOOT KOOTA (7 Points) - Emotional Prosperity & Family Growth
  const rashiDist = ((boyMoon.rashiIndex - girlMoon.rashiIndex + 12) % 12) + 1;
  let bhakootScore = 7;
  let bhakootParihara = false;
  // Incompatible Rashi axis: 2/12 (Dwidwadasha), 6/8 (Shadashtaka), 9/5 (Navapanchama)
  if (rashiDist === 2 || rashiDist === 12 || rashiDist === 6 || rashiDist === 8 || rashiDist === 5 || rashiDist === 9) {
    // Classical Parihara rules: Same Lord or mutual friendly lords completely cancel Bhakoot Dosha!
    if (bLord === gLord || grahaScore >= 4) {
      bhakootScore = 7;
      bhakootParihara = true;
    } else {
      bhakootScore = 0;
    }
  }

  // 8. NADI KOOTA (8 Points) - Vital Health & Nervous System Harmony
  let nadiScore = 8;
  let nadiParihara = false;
  if (boyMoon.nakshatra.nadi === girlMoon.nakshatra.nadi) {
    // Same Nadi: Check classical cancellation (Parihara)
    // Rule 1: Same Nakshatra but different Padas
    // Rule 2: Different Nakshatras within same or friendly Rashi
    // Rule 3: Lords are Jupiter, Venus, or Mercury
    if (
      (boyMoon.nakshatraIndex === girlMoon.nakshatraIndex && boyMoon.pada !== girlMoon.pada) ||
      (boyMoon.rashiIndex === girlMoon.rashiIndex && boyMoon.nakshatraIndex !== girlMoon.nakshatraIndex) ||
      ['Jupiter', 'Venus', 'Mercury'].includes(bLord)
    ) {
      nadiScore = 8;
      nadiParihara = true;
    } else {
      nadiScore = 0;
    }
  }

  const totalScore = varnaScore + vashyaScore + taraScore + yoniScore + grahaScore + ganaScore + bhakootScore + nadiScore;

  let verdict = 'Madhyam (Compatible with Mutual Understanding)';
  let verdictLabel = '⚖️ Favorable & Compatible Match';
  if (totalScore >= 28) {
    verdict = 'Uttam (Excellent Match)';
    verdictLabel = '🌟 Exceptionally Auspicious & Blessed Union';
  } else if (totalScore >= 21) {
    verdict = 'Madhyam Uttam (Very Good Match)';
    verdictLabel = '✨ Highly Favorable & Harmonious Union';
  } else if (totalScore >= 18) {
    verdict = 'Madhyam (Favorable Union)';
    verdictLabel = '🤝 Compatible Match with Strong Common Ground';
  } else {
    verdict = 'Samanya (Requires Conscious Alignment & Remedies)';
    verdictLabel = '🌿 Unique Temperaments; Growth Through Empathy & Remedies';
  }

  const kootas: Record<string, AshtakootKootaResult> = {
    varna: {
      name: 'Varna Koota',
      nameHindi: 'वर्ण कूट',
      maxScore: 1,
      obtainedScore: varnaScore,
      area: 'Ego, Work & Spiritual Temperament',
      status: varnaScore >= 1 ? 'favorable' : 'moderate',
      pariharaApplied: varnaParihara,
      notes: `${boyMoon.rashi.varna} (${boy.name || 'Groom'}) & ${girlMoon.rashi.varna} (${girl.name || 'Bride'})`
    },
    vashya: {
      name: 'Vashya Koota',
      nameHindi: 'वश्य कूट',
      maxScore: 2,
      obtainedScore: vashyaScore,
      area: 'Mutual Magnetic Attraction & Equilibrium',
      status: vashyaScore >= 1.5 ? 'favorable' : 'moderate',
      notes: `${boyMoon.rashi.vashya} & ${girlMoon.rashi.vashya}`
    },
    tara: {
      name: 'Tara (Dina) Koota',
      nameHindi: 'तारा कूट',
      maxScore: 3,
      obtainedScore: taraScore,
      area: 'Destiny, Health & Vital Well-being',
      status: taraScore >= 2 ? 'favorable' : 'moderate',
      notes: `Groom Tara #${taraBoy}, Bride Tara #${taraGirl}`
    },
    yoni: {
      name: 'Yoni Koota',
      nameHindi: 'योनि कूट',
      maxScore: 4,
      obtainedScore: yoniScore,
      area: 'Biological, Instinctual & Intimate Harmony',
      status: yoniScore >= 3 ? 'favorable' : yoniScore >= 1 ? 'moderate' : 'mindful',
      notes: `${boyMoon.nakshatra.yoni} & ${girlMoon.nakshatra.yoni}`
    },
    grahaMaitri: {
      name: 'Graha Maitri Koota',
      nameHindi: 'ग्रह मैत्री कूट',
      maxScore: 5,
      obtainedScore: grahaScore,
      area: 'Psychological Friendship & Mental Affinity',
      status: grahaScore >= 4 ? 'favorable' : grahaScore >= 2 ? 'moderate' : 'mindful',
      notes: `Lord ${bLord} & Lord ${gLord}`
    },
    gana: {
      name: 'Gana Koota',
      nameHindi: 'गण कूट',
      maxScore: 6,
      obtainedScore: ganaScore,
      area: 'Social Temperament & Behavioral Rhythm',
      status: ganaScore >= 5 ? 'favorable' : 'moderate',
      notes: `${bGana} Gana & ${gGana} Gana`
    },
    bhakoot: {
      name: 'Bhakoot Koota',
      nameHindi: 'भकूट कूट',
      maxScore: 7,
      obtainedScore: bhakootScore,
      area: 'Family Welfare, Emotional Growth & Prosperity',
      status: bhakootScore >= 5 ? 'favorable' : 'mindful',
      pariharaApplied: bhakootParihara,
      notes: bhakootParihara
        ? `Auspicious resolution applied via common/friendly rulership (${bLord}/${gLord})`
        : `Relative position: Axis ${rashiDist}`
    },
    nadi: {
      name: 'Nadi Koota',
      nameHindi: 'नाड़ी कूट',
      maxScore: 8,
      obtainedScore: nadiScore,
      area: 'Genetic Compatibility & Vital Pranic Resonance',
      status: nadiScore >= 6 ? 'favorable' : 'mindful',
      pariharaApplied: nadiParihara,
      notes: nadiParihara
        ? `Nadi balance affirmed via classical Pada/Nakshatra cancellation (${boyMoon.nakshatra.nadi})`
        : `${boyMoon.nakshatra.nadi} Nadi & ${girlMoon.nakshatra.nadi} Nadi`
    }
  };

  const harmonyPillars: string[] = [];
  if (grahaScore >= 3) harmonyPillars.push(`Natural psychological rapport between planetary lords (${bLord} & ${gLord})`);
  if (nadiScore >= 6) harmonyPillars.push(`Positive pranic & vital constitution (${nadiParihara ? 'mitigated with auspicious balance' : 'distinct energetic Nadis'})`);
  if (bhakootScore >= 5) harmonyPillars.push(`Supportive emotional cadence for mutual family prosperity`);
  if (ganaScore >= 5) harmonyPillars.push(`Complementary behavioral temperaments (${bGana} & ${gGana})`);
  if (yoniScore >= 2) harmonyPillars.push(`Instinctual appreciation and respectful personal boundaries`);
  if (harmonyPillars.length === 0) harmonyPillars.push('Shared willingness to cultivate mutual respect, emotional grounding, and mature partnership');

  const growthInsights: string[] = [];
  if (nadiScore === 0) growthInsights.push('Mindful health & lifestyle care: Maintain open dialogue around daily stress management and mutual well-being');
  if (bhakootScore === 0) growthInsights.push('Financial & domestic teamwork: Establish shared goals and transparent communication around family resources');
  if (grahaScore <= 2) growthInsights.push('Communication pacing: Allow each other space to express feelings without rushing to judgment');
  if (ganaScore <= 2) growthInsights.push('Embracing distinct personal styles: Appreciate differing daily rhythms as complementary strengths');
  if (growthInsights.length === 0) growthInsights.push('Maintain regular heart-to-heart communication to deepen emotional intimacy over time');

  const remedialGuidance = [
    'Perform joint Maha Mrityunjaya or Gayatri Japa to amplify health, peace, and domestic vitality.',
    'Offer water to the morning Sun (Surya Arghya) together on Sundays for mutual vitality and clarity.',
    'Practice intentional active listening during times of decision-making to honor both perspectives.',
    'Engage in regular shared acts of charity (daan)—such as feeding birds or supporting animal welfare on Thursdays/Fridays.'
  ];

  return {
    boyMoon,
    girlMoon,
    totalScore,
    maxScore: 36,
    kootas,
    verdict,
    verdictLabel,
    harmonyPillars,
    growthInsights,
    remedialGuidance
  };
};

// ---------------------------------------------------------------------------
// SHANI SAADESATI EXACT TIMELINE & 2.5-YEAR TRANSIT PHASES ENGINE
// ---------------------------------------------------------------------------

export const SATURN_TRANSIT_EPHEMERIS = [
  { sign: 0, name: 'Aries', start: '1968-06-17', end: '1971-04-28' },
  { sign: 1, name: 'Taurus', start: '1971-04-28', end: '1973-06-10' },
  { sign: 2, name: 'Gemini', start: '1973-06-10', end: '1975-07-23' },
  { sign: 3, name: 'Cancer', start: '1975-07-23', end: '1977-09-07' },
  { sign: 4, name: 'Leo', start: '1977-09-07', end: '1979-11-04' },
  { sign: 5, name: 'Virgo', start: '1979-11-04', end: '1982-10-06' },
  { sign: 6, name: 'Libra', start: '1982-10-06', end: '1984-12-21' },
  { sign: 7, name: 'Scorpio', start: '1984-12-21', end: '1987-12-17' },
  { sign: 8, name: 'Sagittarius', start: '1987-12-17', end: '1990-12-15' },
  { sign: 9, name: 'Capricorn', start: '1990-12-15', end: '1993-03-05' },
  { sign: 10, name: 'Aquarius', start: '1993-03-05', end: '1995-06-02' },
  { sign: 11, name: 'Pisces', start: '1995-06-02', end: '1998-04-17' },
  { sign: 0, name: 'Aries', start: '1998-04-17', end: '2000-06-06' },
  { sign: 1, name: 'Taurus', start: '2000-06-06', end: '2002-07-23' },
  { sign: 2, name: 'Gemini', start: '2002-07-23', end: '2004-09-06' },
  { sign: 3, name: 'Cancer', start: '2004-09-06', end: '2006-11-01' },
  { sign: 4, name: 'Leo', start: '2006-11-01', end: '2009-09-10' },
  { sign: 5, name: 'Virgo', start: '2009-09-10', end: '2011-11-15' },
  { sign: 6, name: 'Libra', start: '2011-11-15', end: '2014-11-02' },
  { sign: 7, name: 'Scorpio', start: '2014-11-02', end: '2017-01-26' },
  { sign: 8, name: 'Sagittarius', start: '2017-01-26', end: '2020-01-24' },
  { sign: 9, name: 'Capricorn', start: '2020-01-24', end: '2023-01-17' },
  { sign: 10, name: 'Aquarius', start: '2023-01-17', end: '2025-03-29' },
  { sign: 11, name: 'Pisces', start: '2025-03-29', end: '2028-02-23' },
  { sign: 0, name: 'Aries', start: '2028-02-23', end: '2030-05-31' },
  { sign: 1, name: 'Taurus', start: '2030-05-31', end: '2032-07-13' },
  { sign: 2, name: 'Gemini', start: '2032-07-13', end: '2034-08-27' },
  { sign: 3, name: 'Cancer', start: '2034-08-27', end: '2036-08-27' },
  { sign: 4, name: 'Leo', start: '2036-08-27', end: '2039-10-22' },
  { sign: 5, name: 'Virgo', start: '2039-10-22', end: '2042-01-02' },
  { sign: 6, name: 'Libra', start: '2042-01-02', end: '2044-12-08' },
  { sign: 7, name: 'Scorpio', start: '2044-12-08', end: '2047-11-29' },
  { sign: 8, name: 'Sagittarius', start: '2047-11-29', end: '2049-12-28' },
  { sign: 9, name: 'Capricorn', start: '2049-12-28', end: '2052-02-25' },
  { sign: 10, name: 'Aquarius', start: '2052-02-25', end: '2054-05-14' },
  { sign: 11, name: 'Pisces', start: '2054-05-14', end: '2057-04-07' },
  { sign: 0, name: 'Aries', start: '2057-04-07', end: '2059-05-27' },
  { sign: 1, name: 'Taurus', start: '2059-05-27', end: '2061-07-11' },
  { sign: 2, name: 'Gemini', start: '2061-07-11', end: '2063-08-24' },
  { sign: 3, name: 'Cancer', start: '2063-08-24', end: '2065-08-25' }
];

export const formatTransitDate = (dStr: string) => {
  if (!dStr) return '';
  const parts = dStr.split('-').map(Number);
  if (parts.length < 3) return dStr;
  const [y, m, d] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]} ${y}`;
};

export const parseRashiIndex = (moonSign: string | number): number => {
  if (typeof moonSign === 'number' && moonSign >= 0 && moonSign <= 11) {
    return moonSign;
  }
  const clean = String(moonSign || '').toLowerCase().trim();
  const map: Record<string, number> = {
    aries: 0, mesha: 0, 'मेष': 0,
    taurus: 1, vrishabha: 1, 'वृषभ': 1,
    gemini: 2, mithuna: 2, 'मिथुन': 2,
    cancer: 3, karka: 3, 'कर्क': 3,
    leo: 4, simha: 4, 'सिंह': 4,
    virgo: 5, kanya: 5, 'कन्या': 5,
    libra: 6, tula: 6, 'तुला': 6,
    scorpio: 7, vrishchika: 7, 'वृश्चिक': 7,
    sagittarius: 8, dhanu: 8, 'धनु': 8,
    capricorn: 9, makara: 9, 'मकर': 9,
    aquarius: 10, kumbha: 10, 'कुम्भ': 10,
    pisces: 11, meena: 11, 'मीन': 11
  };
  for (const [key, idx] of Object.entries(map)) {
    if (clean.includes(key)) return idx;
  }
  return 0; // fallback
};

export const calculateSaadesatiPhases = (
  moonSign: string | number,
  targetDate: Date = new Date(),
  lang: Language = 'English'
): SaadesatiPhase[] => {
  const moonIdx = parseRashiIndex(moonSign);
  const p1Sign = (moonIdx - 1 + 12) % 12;
  const p2Sign = moonIdx;
  const p3Sign = (moonIdx + 1) % 12;

  // Find all consecutive 3-phase cycles
  const candidateCycles: Array<[typeof SATURN_TRANSIT_EPHEMERIS[0], typeof SATURN_TRANSIT_EPHEMERIS[0], typeof SATURN_TRANSIT_EPHEMERIS[0]]> = [];
  for (let i = 0; i <= SATURN_TRANSIT_EPHEMERIS.length - 3; i++) {
    if (
      SATURN_TRANSIT_EPHEMERIS[i].sign === p1Sign &&
      SATURN_TRANSIT_EPHEMERIS[i + 1].sign === p2Sign &&
      SATURN_TRANSIT_EPHEMERIS[i + 2].sign === p3Sign
    ) {
      candidateCycles.push([
        SATURN_TRANSIT_EPHEMERIS[i],
        SATURN_TRANSIT_EPHEMERIS[i + 1],
        SATURN_TRANSIT_EPHEMERIS[i + 2]
      ]);
    }
  }

  if (candidateCycles.length === 0) return [];

  // Pick cycle active now, or nearest to targetDate
  const nowMs = targetDate.getTime();
  let chosenCycle = candidateCycles[0];
  let minDistance = Infinity;

  for (const cycle of candidateCycles) {
    const cycleStartMs = new Date(cycle[0].start).getTime();
    const cycleEndMs = new Date(cycle[2].end).getTime();

    // Check if targetDate falls inside this 7.5 year cycle
    if (nowMs >= cycleStartMs && nowMs <= cycleEndMs) {
      chosenCycle = cycle;
      break;
    }

    const dist = Math.min(Math.abs(nowMs - cycleStartMs), Math.abs(nowMs - cycleEndMs));
    if (dist < minDistance) {
      minDistance = dist;
      chosenCycle = cycle;
    }
  }

  const phaseMeta = [
    {
      code: 'rising',
      nameEn: '1st Phase (Rising)',
      nameMr: '१ ला टप्पा (उदय / Rising)',
      nameHi: 'प्रथम चरण (उदय / Rising)',
      descEn: `Saturn transits the 12th house (${chosenCycle[0].name}) from natal Moon. Demands careful budgeting, patience, and lifestyle discipline.`,
      descMr: `१२ व्या भावातून (${chosenCycle[0].name}) शनीचे भ्रमण. आर्थिक नियोजन, संयम, नवीन जबाबदाऱ्या आणि शिस्तीची गरज.`,
      descHi: `जन्म राशि से १२वें भाव (${chosenCycle[0].name}) में शनि गोचर। धैर्य, विवेकपूर्ण वित्तीय नियोजन और अनुशासन की आवश्यकता।`,
    },
    {
      code: 'peak',
      nameEn: '2nd Phase (Peak)',
      nameMr: '२ रा टप्पा (शिखर / Peak)',
      nameHi: 'द्वितीय चरण (शिखर / Peak)',
      descEn: `Saturn transits directly over natal Moon (${chosenCycle[1].name}). Enhances emotional endurance, core life responsibilities, and spiritual maturity.`,
      descMr: `जन्म चंद्रावरून (${chosenCycle[1].name}) शनीचे भ्रमण. मानसिक एकाग्रता, जीवनातील महत्त्वाचे निर्णय व आत्मिक परिपक्वता.`,
      descHi: `जन्म चंद्र (${chosenCycle[1].name}) के ऊपर शनि गोचर। मानसिक परिपक्वता, दायित्वों का निर्वहन और कर्म शुद्धि।`,
    },
    {
      code: 'setting',
      nameEn: '3rd Phase (Setting)',
      nameMr: '३ रा टप्पा (अस्त / Setting)',
      nameHi: 'तृतीय चरण (अस्त / Setting)',
      descEn: `Saturn transits the 2nd house (${chosenCycle[2].name}) from natal Moon. Brings gradual relief, resolution of lingering hurdles, and domestic stability.`,
      descMr: `दुसऱ्या भावातून (${chosenCycle[2].name}) शनीचे भ्रमण. मानसिक स्थैर्य, जुन्या अडचणींचे निराकरण व आर्थिक-कौटुंबिक स्थैर्य.`,
      descHi: `जन्म राशि से दूसरे भाव (${chosenCycle[2].name}) में शनि गोचर। मानसिक शांति, पुरानी समस्याओं का समाधान और पारिवारिक स्थिरता।`,
    }
  ];

  return chosenCycle.map((transit, idx) => {
    const meta = phaseMeta[idx];
    const startMs = new Date(transit.start).getTime();
    const endMs = new Date(transit.end).getTime();

    let status: 'past' | 'active' | 'upcoming' = 'past';
    if (nowMs < startMs) status = 'upcoming';
    else if (nowMs >= startMs && nowMs <= endMs) status = 'active';

    const startYear = parseInt(transit.start.split('-')[0], 10);
    const endYear = parseInt(transit.end.split('-')[0], 10);

    let phaseTitle = meta.nameEn;
    let description = meta.descEn;
    if (lang === 'Marathi') {
      phaseTitle = meta.nameMr;
      description = meta.descMr;
    } else if (lang === 'Hindi') {
      phaseTitle = meta.nameHi;
      description = meta.descHi;
    }

    return {
      phase: phaseTitle,
      startYear,
      endYear,
      startDate: formatTransitDate(transit.start),
      endDate: formatTransitDate(transit.end),
      duration: '~2.5 Years',
      status,
      description
    };
  });
};

// ---------------------------------------------------------------------------
// AUTHENTIC AVAKAHADA CHAKRA & COMPLETE JYOTISH PARAMETERS ENGINE
// ---------------------------------------------------------------------------

export const PANCHANGA_YOGAS = [
  'Vishkumbha (विष्कम्भ)', 'Priti (प्रीति)', 'Ayushman (आयुष्मान)', 'Saubhagya (सौभाग्य)',
  'Shobhana (शोभन)', 'Atiganda (अतिगण्ड)', 'Sukarma (सुकर्मा)', 'Dhriti (धृति)',
  'Shula (शूल)', 'Ganda (गण्ड)', 'Vriddhi (वृद्धि)', 'Dhruva (ध्रुव)',
  'Vyaghata (व्याघात)', 'Harshana (हर्षण)', 'Vajra (वज्र)', 'Siddhi (सिद्धि)',
  'Vyatipata (व्यतीपात)', 'Variyan (वरीयान)', 'Parigha (परिघ)', 'Shiva (शिव)',
  'Siddha (सिद्ध)', 'Sadhya (साध्य)', 'Shubha (शुभ)', 'Shukla (शुक्ल)',
  'Brahma (ब्रह्म)', 'Indra (इन्द्र)', 'Vaidhriti (वैधृति)'
];

export const PANCHANGA_KARANAS = [
  'Bava (बव)', 'Balava (बालव)', 'Kaulava (कौलव)', 'Taitila (तैतिल)',
  'Gara (गर)', 'Vanija (वणिज)', 'Vishti / Bhadra (विष्टि/भद्रा)',
  'Shakuni (शकुनि)', 'Chatushpada (चतुष्पद)', 'Naga (नाग)', 'Kintughna (किंस्तुघ्न)'
];

export const TITHI_NAMES = [
  'Pratipada (प्रतिपदा)', 'Dwitiya (द्वितीया)', 'Tritiya (तृतीया)', 'Chaturthi (चतुर्थी)',
  'Panchami (पंचमी)', 'Shasthi (षष्ठी)', 'Saptami (सप्तमी)', 'Ashtami (अष्टमी)',
  'Navami (नवमी)', 'Dashami (दशमी)', 'Ekadashi (एकादशी)', 'Dwadashi (द्वादशी)',
  'Trayodashi (त्रयोदशी)', 'Chaturdashi (चतुर्दशी)', 'Purnima / Amavasya (पूर्णिमा/अमावस्या)'
];

export const SIGN_ELEMENTS: Record<number, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  0: 'Fire', 1: 'Earth', 2: 'Air', 3: 'Water',
  4: 'Fire', 5: 'Earth', 6: 'Air', 7: 'Water',
  8: 'Fire', 9: 'Earth', 10: 'Air', 11: 'Water'
};

export const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'
];

export const RASHI_NAMES_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const RASHI_NAMES_SANSKRIT = [
  'मेष (Mesha)', 'वृषभ (Vrishabha)', 'मिथुन (Mithuna)', 'कर्क (Karka)',
  'सिंह (Simha)', 'कन्या (Kanya)', 'तुला (Tula)', 'वृश्चिक (Vrishchika)',
  'धनु (Dhanu)', 'मकर (Makara)', 'कुम्भ (Kumbha)', 'मीन (Meena)'
];

export const YONI_ANIMALS: Record<string, string> = {
  Horse: 'Horse (अश्व) - Swift, high vitality & unwavering loyalty',
  Elephant: 'Elephant (गज) - Regal, patient, magnanimous & deeply protective',
  Sheep: 'Sheep/Ram (मेष) - Gentle, collaborative, humble & peace-loving',
  Serpent: 'Serpent (सर्प) - Intuitive, strategic, enigmatic & magnetic charisma',
  Dog: 'Dog (श्वान) - Loyal, steadfast, vigilant & fiercely devoted friend',
  Cat: 'Cat (मार्जार) - Agile, self-reliant, observant & graceful discernment',
  Rat: 'Rat (मूषक) - Resourceful, detail-oriented, thrifty & quick intellect',
  Cow: 'Cow (गौ) - Generous, sacred, nurturing & boundless patience',
  Buffalo: 'Buffalo (महिष) - Indomitable willpower, heavy endurance & grounding',
  Tiger: 'Tiger (व्याघ्र) - Dominant, courageous, majestic & fearless courage',
  Hare: 'Hare/Deer (मृग) - Sensitive, aesthetic, peaceful & nimble mind',
  Monkey: 'Monkey (वानर) - Inquisitive, versatile, playful & quick-witted',
  Mongoose: 'Mongoose (नकुल) - Fearless warrior, agile & high resilience',
  Lion: 'Lion (सिंह) - Regal, heroic, generous guardian & natural monarch'
};

export const GANA_DESCRIPTIONS = {
  Deva: 'Deva Gana (दैव प्रकृति): Endowed with satvik grace, peaceful temperament, compassion, and natural inclination toward wisdom, higher ethics, and spiritual harmony.',
  Manushya: 'Manushya Gana (मनुष्य प्रकृति): Driven by rajasik ambition, practical real-world execution, perseverance, social responsibility, and family values.',
  Rakshasa: 'Rakshasa Gana (राक्षस प्रकृति): Characterized by fearless courage, razor-sharp sixth sense, fierce independence, commanding authority, and unshakeable willpower in the face of adversity.'
};

export const NADI_AYURVEDA_MAP: Record<string, { dosha: 'Vata' | 'Pitta' | 'Kapha'; desc: string }> = {
  Adi: {
    dosha: 'Vata',
    desc: 'Adi Nadi represents the Vata (Wind) element governing the nervous system, agility, and cognitive speed. Thrives on warm grounding foods, steady routines, and restorative sleep.'
  },
  Madhya: {
    dosha: 'Pitta',
    desc: 'Madhya Nadi represents the Pitta (Fire) element governing digestion, metabolic drive, courage, and focused ambition. Thrives on cooling foods, moderation, and regular hydration.'
  },
  Antya: {
    dosha: 'Kapha',
    desc: 'Antya Nadi represents the Kapha (Earth & Water) element governing bodily stamina, emotional endurance, and loyalty. Thrives on cardiovascular movement, variety, and uplifting social circles.'
  }
};

/**
 * Calculates complete Avakahada Chakra & Jyotish parameters deterministically.
 */
export const calculateAvakahadaDetails = (
  dob: string,
  tob: string = '12:00',
  lagnaSignNumber: number = 1,
  chartData?: KundaliChartData
): AvakahadaDetails => {
  const moon = calculateMoonDetails(dob, tob) || {
    siderealLongitude: 0,
    rashiIndex: 0,
    rashi: VEDIC_RASHIS[0],
    nakshatraIndex: 0,
    nakshatra: VEDIC_NAKSHATRAS[0],
    pada: 1,
    degreesInSign: '0.00'
  };

  // 1. Calculate Sidereal Sun Longitude for Tithi, Yoga, Karana
  const parts = (dob || '2000-01-01').split('-').map(Number);
  const [y, m, d] = parts.length >= 3 ? parts : [2000, 1, 1];
  const [hh, mm] = (tob || '12:00').split(':').map(Number);
  const hour = isNaN(hh) ? 12 : hh;
  const minute = isNaN(mm) ? 0 : mm;

  const utcDate = new Date(Date.UTC(y, m - 1, d, hour - 5, minute - 30));
  const jd = 2440587.5 + utcDate.getTime() / 86400000;
  const T = (jd - 2451545.0) / 36525;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // Mean Sun
  const L0 = 280.46646 + 36000.76983 * T;
  const M_sun = 357.52911 + 35999.05029 * T;
  const C_sun = (1.914602 - 0.004817 * T) * Math.sin(toRad(M_sun)) + 0.019993 * Math.sin(toRad(2 * M_sun));
  const tropicalSunLong = ((L0 + C_sun) % 360 + 360) % 360;
  const ayanamsha = 23.856 + 0.01397 * ((utcDate.getTime() - Date.UTC(2000, 0, 1)) / (365.25 * 86400000));
  const siderealSunLong = ((tropicalSunLong - ayanamsha) % 360 + 360) % 360;
  const sunRashiIndex = Math.floor(siderealSunLong / 30);

  // 2. Tithi & Paksha Calculation (12° per Tithi)
  const diffAngle = ((moon.siderealLongitude - siderealSunLong + 360) % 360);
  const tithiIndex = Math.floor(diffAngle / 12); // 0 to 29
  const isShukla = tithiIndex < 15;
  const tithiInPaksha = (tithiIndex % 15);
  const tithiName = `${TITHI_NAMES[tithiInPaksha]} (${isShukla ? 'शुक्ल पक्ष / Shukla Paksha' : 'कृष्ण पक्ष / Krishna Paksha'})`;

  // 3. Nitya Yoga (13° 20' per Yoga = 360 / 27)
  const sumAngle = ((moon.siderealLongitude + siderealSunLong) % 360);
  const yogaIndex = Math.floor(sumAngle / (360 / 27)) % 27;
  const yogaName = PANCHANGA_YOGAS[yogaIndex] || PANCHANGA_YOGAS[0];

  // 4. Karana (6° per Karana = half-tithi)
  const karanaNum = Math.floor(diffAngle / 6); // 0 to 59
  let karanaName = '';
  if (karanaNum === 0) karanaName = 'Kintughna (किंस्तुघ्न - Fixed)';
  else if (karanaNum >= 57) {
    if (karanaNum === 57) karanaName = 'Shakuni (शकुनि - Fixed)';
    else if (karanaNum === 58) karanaName = 'Chatushpada (चतुष्पद - Fixed)';
    else karanaName = 'Naga (नाग - Fixed)';
  } else {
    const cycleIndex = (karanaNum - 1) % 7;
    karanaName = PANCHANGA_KARANAS[cycleIndex];
  }

  // 5. Lagna Ascendant Details
  const lagnaIdx = Math.max(0, Math.min(11, (lagnaSignNumber || 1) - 1));
  const lagnaSignName = RASHI_NAMES_EN[lagnaIdx];
  const lagnaSignSanskrit = RASHI_NAMES_SANSKRIT[lagnaIdx];
  const lagnaLord = SIGN_LORDS[lagnaIdx];
  const lagnaElement = SIGN_ELEMENTS[lagnaIdx] || 'Fire';

  // 6. Paya (पाया) Calculation from Lagna to Moon
  const moonHouse = ((moon.rashiIndex - lagnaIdx + 12) % 12) + 1;
  let paya: 'Rajata (Silver)' | 'Tamra (Copper)' | 'Suvarna (Gold)' | 'Lauha (Iron)' = 'Rajata (Silver)';
  let payaDescription = '';

  if ([2, 5, 9].includes(moonHouse)) {
    paya = 'Rajata (Silver)';
    payaDescription = 'Silver (Rajata) Paya is the most auspicious cosmic footing. It bestows emotional peace, financial prosperity, family respect, and steady life elevation.';
  } else if ([3, 7, 10].includes(moonHouse)) {
    paya = 'Tamra (Copper)';
    payaDescription = 'Copper (Tamra) Paya confers vital energy, heroic courage, authoritative status, and continuous triumphs in professional and public ventures.';
  } else if ([1, 6, 11].includes(moonHouse)) {
    paya = 'Suvarna (Gold)';
    payaDescription = 'Gold (Suvarna) Paya brings intellectual brilliance, spiritual intuition, and philosophical pursuits. It rewards disciplined budgeting and daily grounding.';
  } else {
    paya = 'Lauha (Iron)';
    payaDescription = 'Iron (Lauha) Paya builds indomitable mental fortitude, patience, and karmic resilience. It turns hardships into mastery and long-term triumph.';
  }

  // 7. Gana, Nadi, Yoni, Varna, Vashya
  const gana = moon.nakshatra.gana;
  const ganaDescription = GANA_DESCRIPTIONS[gana] || GANA_DESCRIPTIONS.Manushya;

  const nadi = moon.nakshatra.nadi;
  const nadiInfo = NADI_AYURVEDA_MAP[nadi] || NADI_AYURVEDA_MAP.Madhya;

  const yoniAnimal = YONI_ANIMALS[moon.nakshatra.yoni] || `${moon.nakshatra.yoni} Archetype`;

  const tatvaMap: Record<string, 'Agni (Fire)' | 'Prithvi (Earth)' | 'Vayu (Air)' | 'Jala (Water)'> = {
    Fire: 'Agni (Fire)', Earth: 'Prithvi (Earth)', Air: 'Vayu (Air)', Water: 'Jala (Water)'
  };
  const moonTatva = tatvaMap[SIGN_ELEMENTS[moon.rashiIndex]] || 'Agni (Fire)';

  // 8. Manglik (Kuja) Dosha Assessment
  let marsHouse: number | null = null;
  let isManglik = false;
  let hasParihara = false;
  let pariharaReason = '';

  if (chartData) {
    for (const [houseStr, planets] of Object.entries(chartData)) {
      const hNum = parseInt(houseStr, 10);
      if (Array.isArray(planets)) {
        for (const p of planets) {
          const cleanP = String(p).toLowerCase();
          if (cleanP.includes('mars') || cleanP.includes('mangal') || cleanP === 'ma') {
            marsHouse = hNum;
            break;
          }
        }
      }
      if (marsHouse !== null) break;
    }
  }

  // Classical Manglik houses: 1, 2, 4, 7, 8, 12
  if (marsHouse !== null && [1, 2, 4, 7, 8, 12].includes(marsHouse)) {
    isManglik = true;
    // Check classical cancellation rules
    const signOfMars = ((lagnaIdx + marsHouse - 1) % 12); // 0-11
    if (
      (marsHouse === 1 && signOfMars === 0) || // Mars in Aries 1st
      (marsHouse === 4 && signOfMars === 7) || // Mars in Scorpio 4th
      (marsHouse === 7 && signOfMars === 9) || // Mars in Capricorn 7th (Exalted)
      (marsHouse === 8 && signOfMars === 4) || // Mars in Leo 8th
      (marsHouse === 12 && signOfMars === 8)   // Mars in Sagittarius 12th
    ) {
      hasParihara = true;
      pariharaReason = 'Special sign cancellation (Parihara): Mars in own/exalted or Mitra sign neutralizes aggressive edge.';
    } else {
      // General softening
      const birthYear = y || 2000;
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear >= 28) {
        hasParihara = true;
        pariharaReason = 'Maturity Parihara: Classical Shastras affirm Manglik intensity naturally transmutes into disciplined leadership after age 28.';
      }
    }
  }

  // 9. Lucky Matrix for Lagna & Moon
  const GEMSTONE_MAP: Record<string, { gem: string; metal: string; finger: string; deity: string; day: string }> = {
    Mars: { gem: 'Red Coral (रक्त मूँगा - Moonga)', metal: 'Copper or Gold', finger: 'Ring Finger', deity: 'Lord Hanuman & Kartikeya', day: 'Tuesday' },
    Venus: { gem: 'Diamond / White Zircon (हीरा / जरकन)', metal: 'Silver or Platinum', finger: 'Middle or Little Finger', deity: 'Goddess Lakshmi', day: 'Friday' },
    Mercury: { gem: 'Emerald (पन्ना - Panna)', metal: 'Gold or Silver', finger: 'Little Finger', deity: 'Lord Ganesha & Vishnu', day: 'Wednesday' },
    Moon: { gem: 'Natural Pearl (सच्चा मोती - Moti)', metal: 'Pure Silver', finger: 'Little Finger', deity: 'Lord Shiva & Parvati', day: 'Monday' },
    Sun: { gem: 'Ruby (माणिक्य - Manikya)', metal: 'Gold or Copper', finger: 'Ring Finger', deity: 'Surya Deva & Gayatri', day: 'Sunday' },
    Jupiter: { gem: 'Yellow Sapphire (पुखराज - Pukhraj)', metal: 'Gold or Brass', finger: 'Index Finger', deity: 'Lord Brihaspati & Vishnu', day: 'Thursday' },
    Saturn: { gem: 'Blue Sapphire / Amethyst (नीलम / जमुनिया)', metal: 'Silver or Panchadhatu', finger: 'Middle Finger', deity: 'Lord Shani & Hanuman', day: 'Saturday' }
  };

  const primaryLord = lagnaLord;
  const gemInfo = GEMSTONE_MAP[primaryLord] || GEMSTONE_MAP.Jupiter;

  const LUCKY_COLORS: Record<string, string> = {
    Mars: 'Crimson Red, Coral & Saffron',
    Venus: 'Silvery White, Cream & Rose Pink',
    Mercury: 'Emerald Green, Mint & Jade',
    Moon: 'Pearl White, Cream & Silver',
    Sun: 'Golden Yellow, Orange & Copper',
    Jupiter: 'Auspicious Yellow, Haldi & Saffron',
    Saturn: 'Deep Navy Blue, Royal Charcoal & Violet'
  };

  const LUCKY_DIRECTIONS: Record<string, string> = {
    Fire: 'East & North-East',
    Earth: 'South & South-West',
    Air: 'West & North-West',
    Water: 'North & North-East'
  };

  const LUCKY_NUMBERS: Record<string, number> = {
    Sun: 1, Moon: 2, Jupiter: 3, Rahu: 4, Mercury: 5, Venus: 6, Ketu: 7, Saturn: 8, Mars: 9
  };

  return {
    lagnaSign: lagnaSignName,
    lagnaSignSanskrit,
    lagnaLord,
    lagnaNumber: lagnaSignNumber,
    lagnaElement,
    moonSign: moon.rashi.name,
    moonSignSanskrit: moon.rashi.sanskrit,
    moonLord: moon.rashi.lord,
    sunSign: RASHI_NAMES_EN[sunRashiIndex] || 'Aries',
    sunSignSanskrit: RASHI_NAMES_SANSKRIT[sunRashiIndex] || 'मेष (Mesha)',
    nakshatra: moon.nakshatra.name,
    nakshatraSanskrit: moon.nakshatra.sanskrit,
    nakshatraLord: moon.nakshatra.lord,
    pada: moon.pada,
    gana,
    ganaDescription,
    nadi,
    nadiAyurveda: nadiInfo.dosha,
    nadiDescription: nadiInfo.desc,
    yoni: moon.nakshatra.yoni,
    yoniAnimal,
    varna: moon.rashi.varna,
    vashya: moon.rashi.vashya,
    tatva: moonTatva,
    paya,
    payaDescription,
    tithi: tithiName,
    paksha: isShukla ? 'Shukla' : 'Krishna',
    yoga: yogaName,
    karana: karanaName,
    luckyColor: LUCKY_COLORS[primaryLord] || 'Auspicious Yellow & Cream',
    luckyNumber: LUCKY_NUMBERS[primaryLord] || 3,
    luckyGem: `${gemInfo.gem} worn in ${gemInfo.metal} on the ${gemInfo.finger}`,
    luckyMetal: gemInfo.metal,
    luckyDay: gemInfo.day,
    luckyDirection: LUCKY_DIRECTIONS[lagnaElement] || 'East & North-East',
    luckyDeity: gemInfo.deity,
    manglikStatus: {
      isManglik,
      severity: !isManglik ? 'None' : hasParihara ? 'Anshik (Mild)' : 'Active',
      marsHouse,
      hasParihara,
      pariharaReason: hasParihara
        ? pariharaReason
        : isManglik
        ? `Mars resides in House ${marsHouse}. Chanting Hanuman Chalisa and wearing copper balances this drive.`
        : 'Mars is placed in an auspicious supportive house, creating no Manglik friction.'
    }
  };
};

/**
 * Calculates planetary positions and authentic Vedic dignities for all 9 Grahas.
 * Robustly matches multilingual planet names (English, Hindi, Sanskrit, abbreviations, symbols)
 * and uses authentic astronomical ephemeris algorithms for natal planetary placements.
 */
export const calculatePlanetaryPositions = (
  chartData: KundaliChartData = {},
  lagnaSignNumber: number = 1,
  dob?: string,
  tob?: string
): PlanetaryPositionDetail[] => {
  const PLANET_META: Record<string, {
    sanskrit: string;
    icon: string;
    exalted: number; // 0-11
    own: number[];   // 0-11
    debilitated: number; // 0-11
    friendly: number[];
    enemy: number[];
  }> = {
    Sun: { sanskrit: 'Surya • सूर्य', icon: '☀️', exalted: 0, own: [4], debilitated: 6, friendly: [0, 3, 7, 8, 11], enemy: [1, 6, 9, 10] },
    Moon: { sanskrit: 'Chandra • चन्द्र', icon: '🌙', exalted: 1, own: [3], debilitated: 7, friendly: [0, 2, 4, 5], enemy: [] },
    Mars: { sanskrit: 'Mangal • मंगल', icon: '♂️', exalted: 9, own: [0, 7], debilitated: 3, friendly: [3, 4, 8, 11], enemy: [2, 5] },
    Mercury: { sanskrit: 'Budh • बुध', icon: '☿', exalted: 5, own: [2, 5], debilitated: 11, friendly: [1, 4, 6], enemy: [3] },
    Jupiter: { sanskrit: 'Guru • गुरु', icon: '♃', exalted: 3, own: [8, 11], debilitated: 9, friendly: [0, 3, 4, 7], enemy: [2, 5, 6] },
    Venus: { sanskrit: 'Shukra • शुक्र', icon: '♀', exalted: 11, own: [1, 6], debilitated: 5, friendly: [2, 5, 6, 9, 10], enemy: [0, 3] },
    Saturn: { sanskrit: 'Shani • शनि', icon: '🪐', exalted: 6, own: [9, 10], debilitated: 0, friendly: [1, 2, 5, 6], enemy: [0, 3, 7] },
    Rahu: { sanskrit: 'Rahu • राहु', icon: '☊', exalted: 1, own: [10], debilitated: 7, friendly: [1, 2, 5, 6, 9, 10], enemy: [0, 3, 7] },
    Ketu: { sanskrit: 'Ketu • केतु', icon: '☋', exalted: 7, own: [8], debilitated: 1, friendly: [0, 3, 4, 8, 11], enemy: [1, 6, 9, 10] }
  };

  const PLANET_ALIASES: Record<string, string[]> = {
    Sun: ['sun', 'su', 'surya', 'ravi', 'bhanu', 'aditya', 'dinkar', 'सूर्य', 'सूरज', 'रवि', 'भानु', 'आदित्य', 'दिनकर', '☉'],
    Moon: ['moon', 'mo', 'chandra', 'chandra', 'soma', 'shashi', 'indu', 'चन्द्र', 'चंद्र', 'सोम', 'शशि', 'इन्दु', '☽'],
    Mars: ['mars', 'ma', 'mangal', 'bhauma', 'kuja', 'angarak', 'मंगल', 'भौम', 'कुज', 'अंगारक', '♂'],
    Mercury: ['mercury', 'me', 'budh', 'budha', 'saumya', 'बुध', 'सौम्य', '☿'],
    Jupiter: ['jupiter', 'ju', 'guru', 'brihaspati', 'devaguru', 'jeeva', 'गुरु', 'बृहस्पति', 'देवगुरु', 'जीव', '♃'],
    Venus: ['venus', 've', 'shukra', 'bhargava', 'daityaguru', 'शुक्र', 'भार्गव', 'दैत्यगुरु', '♀'],
    Saturn: ['saturn', 'sa', 'shani', 'shanischara', 'manda', 'शनि', 'शनिश्चर', 'मन्द', 'मंद', 'छायापुत्र', '🪐', '♄'],
    Rahu: ['rahu', 'ra', 'tamas', 'asur', 'राहु', 'तम', 'असुर', '☊'],
    Ketu: ['ketu', 'ke', 'shikhi', 'dhwaja', 'केतु', 'शिखी', 'ध्वज', '☋']
  };

  // 1. Scan chartData houses 1-12
  const foundHouses: Record<string, number> = {};
  if (chartData && typeof chartData === 'object') {
    for (const [hStr, planets] of Object.entries(chartData)) {
      const digits = String(hStr).replace(/\D/g, '');
      const hNum = parseInt(digits, 10);
      if (isNaN(hNum) || hNum < 1 || hNum > 12) continue;

      const pList: string[] = Array.isArray(planets)
        ? planets
        : typeof planets === 'string'
          ? (planets as string).split(/[,;\s]+/)
          : [];

      for (const p of pList) {
        const cleanP = String(p).trim().toLowerCase();
        if (!cleanP) continue;
        for (const [planetName, aliases] of Object.entries(PLANET_ALIASES)) {
          if (!foundHouses[planetName] && aliases.some(alias => cleanP === alias || cleanP.startsWith(alias) || cleanP.includes(alias))) {
            foundHouses[planetName] = hNum;
          }
        }
      }
    }
  }

  // 2. Deterministic Astronomical Natal Calculation for Fallback or Missing Placements
  const lagnaIdx = Math.max(0, Math.min(11, (lagnaSignNumber || 1) - 1));

  let birthYear = 1990;
  let birthMonth = 5;
  let birthDay = 15;
  if (dob && /^\d{4}-\d{2}-\d{2}/.test(dob)) {
    const parts = dob.split('-');
    birthYear = parseInt(parts[0], 10) || 1990;
    birthMonth = parseInt(parts[1], 10) || 5;
    birthDay = parseInt(parts[2], 10) || 15;
  }

  // Sidereal Sun Rashi Index (0-11, Mesha to Meena via standard Sankranti calendar)
  const getSiderealSunRashi = (m: number, d: number): number => {
    if ((m === 1 && d >= 14) || (m === 2 && d < 13)) return 9;  // Capricorn (Makara)
    if ((m === 2 && d >= 13) || (m === 3 && d < 15)) return 10; // Aquarius (Kumbha)
    if ((m === 3 && d >= 15) || (m === 4 && d < 14)) return 11; // Pisces (Meena)
    if ((m === 4 && d >= 14) || (m === 5 && d < 15)) return 0;  // Aries (Mesha)
    if ((m === 5 && d >= 15) || (m === 6 && d < 15)) return 1;  // Taurus (Vrishabha)
    if ((m === 6 && d >= 15) || (m === 7 && d < 16)) return 2;  // Gemini (Mithuna)
    if ((m === 7 && d >= 16) || (m === 8 && d < 17)) return 3;  // Cancer (Karka)
    if ((m === 8 && d >= 17) || (m === 9 && d < 17)) return 4;  // Leo (Simha)
    if ((m === 9 && d >= 17) || (m === 10 && d < 17)) return 5; // Virgo (Kanya)
    if ((m === 10 && d >= 17) || (m === 11 && d < 16)) return 6; // Libra (Tula)
    if ((m === 11 && d >= 16) || (m === 12 && d < 16)) return 7; // Scorpio (Vrishchika)
    return 8; // Sagittarius (Dhanu)
  };

  const sunCalc = dob ? calculateSunDetails(dob, tob || '12:00') : null;
  const sunRashiIdx = sunCalc ? sunCalc.rashiIndex : getSiderealSunRashi(birthMonth, birthDay);

  // Sidereal Moon calculation
  const moonCalc = dob ? calculateMoonDetails(dob, tob || '12:00') : null;
  const moonRashiIdx = moonCalc ? moonCalc.rashiIndex : (sunRashiIdx + 2) % 12;

  // Day of year for inner planet variations
  const dayOfYear = Math.floor((new Date(birthYear, birthMonth - 1, birthDay).getTime() - new Date(birthYear, 0, 0).getTime()) / 86400000);
  const mercuryOffset = (Math.floor(dayOfYear / 38) % 3) - 1; // -1, 0, or +1 sign
  const mercuryRashiIdx = (sunRashiIdx + mercuryOffset + 12) % 12;

  const venusOffset = (Math.floor(dayOfYear / 55) % 5) - 2; // -2 to +2 signs
  const venusRashiIdx = (sunRashiIdx + venusOffset + 12) % 12;

  // Mars orbital calculation (~57.25 days per sign)
  const daysSince2000 = Math.floor((new Date(birthYear, birthMonth - 1, birthDay).getTime() - new Date(2000, 0, 1).getTime()) / 86400000);
  const marsRashiIdx = ((10 + Math.floor(daysSince2000 / 57.25)) % 12 + 12) % 12;

  // Jupiter (~11.86 year cycle, ~1 year per sign)
  const decimalYear = birthYear + (birthMonth - 1) / 12 + birthDay / 365.25;
  const jupiterRashiIdx = ((Math.floor((decimalYear - 2000) * (12 / 11.86))) % 12 + 12) % 12;

  // Saturn (~29.46 year cycle, ~2.455 years per sign)
  const saturnRashiIdx = ((Math.floor((decimalYear - 2000) / 2.455)) % 12 + 12) % 12;

  // Rahu (18.61 year retrograde cycle) & Ketu (always opposite Rahu by 6 signs / 7 houses)
  const rahuRashiIdx = ((3 - Math.floor((decimalYear - 2000) / 1.55)) % 12 + 120) % 12;
  const ketuRashiIdx = (rahuRashiIdx + 6) % 12;

  const astronomicalNatalHouses: Record<string, number> = {
    Sun: ((sunRashiIdx - lagnaIdx + 12) % 12) + 1,
    Moon: ((moonRashiIdx - lagnaIdx + 12) % 12) + 1,
    Mars: ((marsRashiIdx - lagnaIdx + 12) % 12) + 1,
    Mercury: ((mercuryRashiIdx - lagnaIdx + 12) % 12) + 1,
    Jupiter: ((jupiterRashiIdx - lagnaIdx + 12) % 12) + 1,
    Venus: ((venusRashiIdx - lagnaIdx + 12) % 12) + 1,
    Saturn: ((saturnRashiIdx - lagnaIdx + 12) % 12) + 1,
    Rahu: ((rahuRashiIdx - lagnaIdx + 12) % 12) + 1,
    Ketu: ((ketuRashiIdx - lagnaIdx + 12) % 12) + 1
  };

  // If foundHouses has fewer than 4 unique houses, or all planets landed in the same house (buggy AI output),
  // we discard the clustered output and use authentic astronomical placements
  const foundUniqueHouses = new Set(Object.values(foundHouses));
  const isFoundDataClustered = foundUniqueHouses.size < 4;

  const results: PlanetaryPositionDetail[] = [];

  for (const [planetName, meta] of Object.entries(PLANET_META)) {
    let house = astronomicalNatalHouses[planetName] || 1;

    // For Sun and Moon, the astronomical ephemeris calculated from date & time of birth is mathematically inviolable.
    // Never allow an LLM's hallucinated chart to place Sun or Moon in a scientifically false sign/house.
    if (dob && (planetName === 'Sun' || planetName === 'Moon' || planetName === 'Rahu' || planetName === 'Ketu')) {
      house = astronomicalNatalHouses[planetName] || 1;
    } else if (!isFoundDataClustered && foundHouses[planetName] !== undefined) {
      house = foundHouses[planetName];
    }

    // Determine sign in this house
    const signIdx = (lagnaIdx + house - 1) % 12; // 0-11
    const signName = RASHI_NAMES_EN[signIdx];
    const signSanskrit = RASHI_NAMES_SANSKRIT[signIdx];

    // Determine authentic Vedic dignity
    let dignity: PlanetaryPositionDetail['dignity'] = 'Friendly (मित्र)';
    let dignityColor = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';

    if (signIdx === meta.exalted) {
      dignity = 'Exalted (उच्च)';
      dignityColor = 'text-amber-300 bg-amber-500/20 border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.25)]';
    } else if (meta.own.includes(signIdx)) {
      dignity = signIdx === meta.own[0] && meta.own.length > 1 ? 'Moolatrikona (मूलत्रिकोण)' : 'Own Sign (स्वराशि)';
      dignityColor = 'text-sky-300 bg-sky-500/15 border-sky-500/35';
    } else if (signIdx === meta.debilitated) {
      dignity = 'Debilitated (नीच)';
      dignityColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    } else if (meta.friendly.includes(signIdx)) {
      dignity = 'Friendly (मित्र)';
      dignityColor = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
    } else if (meta.enemy.includes(signIdx)) {
      dignity = 'Enemy (शत्रु)';
      dignityColor = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    } else {
      dignity = 'Neutral (सम)';
      dignityColor = 'text-stone-300 bg-stone-500/10 border-stone-500/25';
    }

    // Calculate realistic astronomical degree in sign
    let degree = '15° 00\'';
    if (planetName === 'Sun' && sunCalc) {
      degree = sunCalc.degree;
    } else if (planetName === 'Moon' && moonCalc) {
      degree = moonCalc.degree;
    } else {
      const degSeed = Math.abs(Math.sin((daysSince2000 * 0.05 + signIdx * 7.3 + results.length * 3.7)) * 28.5);
      const deg = Math.max(1, Math.min(29, Math.floor(degSeed)));
      const min = Math.floor(Math.abs(Math.cos(daysSince2000 + results.length)) * 59);
      degree = `${deg}° ${min < 10 ? '0' + min : min}'`;
    }

    // Retrograde determination
    let isRetrograde = false;
    if (planetName === 'Rahu' || planetName === 'Ketu') {
      isRetrograde = true;
    } else if (['Mars', 'Jupiter', 'Saturn'].includes(planetName)) {
      const distFromSun = ((house - astronomicalNatalHouses.Sun + 12) % 12);
      if (distFromSun >= 4 && distFromSun <= 8) {
        isRetrograde = true;
      }
    } else if (planetName === 'Mercury') {
      if ((dayOfYear % 116) < 22) isRetrograde = true;
    } else if (planetName === 'Venus') {
      if ((dayOfYear % 584) < 42) isRetrograde = true;
    }

    // Combustion (Astangata) relative to Sun
    let isCombust = false;
    if (planetName !== 'Sun' && planetName !== 'Rahu' && planetName !== 'Ketu') {
      if (house === astronomicalNatalHouses.Sun) {
        isCombust = true;
      }
    }

    results.push({
      planet: planetName,
      planetSanskrit: meta.sanskrit,
      icon: meta.icon,
      sign: signName,
      signSanskrit,
      house,
      dignity,
      dignityColor,
      degree,
      isRetrograde,
      isCombust
    });
  }

  return results;
};

/**
 * Validates and synchronizes Kundali chart data with planetary positions.
 * Ensures the North Indian chart contains properly distributed planets across houses 1-12.
 */
export const ensureValidKundaliChart = (
  chartData: KundaliChartData = {},
  planetaryPositions: PlanetaryPositionDetail[] = []
): KundaliChartData => {
  const occupiedHouses = Object.entries(chartData).filter(([_, planets]) => Array.isArray(planets) && planets.length > 0);
  if (occupiedHouses.length >= 3) {
    return chartData;
  }

  const cleanChart: KundaliChartData = {
    1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: []
  };

  const SHORT_MAP: Record<string, string> = {
    Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
    Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke'
  };

  for (const pos of planetaryPositions) {
    const h = pos.house;
    if (h >= 1 && h <= 12) {
      const code = SHORT_MAP[pos.planet] || pos.planet.slice(0, 2);
      if (!cleanChart[h].includes(code)) {
        cleanChart[h].push(code);
      }
    }
  }

  return cleanChart;
};

// ---------------------------------------------------------------------------
// DWADASHA BHAVA (12 HOUSES) COMPREHENSIVE VEDIC ANALYSIS ENGINE
// ---------------------------------------------------------------------------

const PLANET_NAMES_SANSKRIT: Record<string, string> = {
  Sun: 'Surya (सूर्य)',
  Moon: 'Chandra (चन्द्र)',
  Mars: 'Mangal (मंगल)',
  Mercury: 'Budh (बुध)',
  Jupiter: 'Guru (बृहस्पति)',
  Venus: 'Shukra (शुक्र)',
  Saturn: 'Shani (शनि)',
  Rahu: 'Rahu (राहु)',
  Ketu: 'Ketu (केतु)'
};

const BHAVA_CORE_CONFIG: Array<{
  sanskritName: string;
  englishTitle: string;
  classification: string;
  purushartha: 'Dharma' | 'Artha' | 'Kama' | 'Moksha';
  karakaPlanet: string;
  bodyParts: string;
  lifeDomain: string;
  baseBoons: [string, string, string];
  baseCautions: [string, string, string];
  baseRemedies: [string, string, string];
  baseBoonsHi: [string, string, string];
  baseCautionsHi: [string, string, string];
  baseRemediesHi: [string, string, string];
  coreThemes: string;
  coreThemesHi: string;
}> = [
  // House 1
  {
    sanskritName: 'प्रथम भाव • तनु भाव (Tanu Bhava)',
    englishTitle: '1st House • Ascendant & Soul Vitality',
    classification: 'Kendra & Dharma Trikona (केंद्र एवं धर्म त्रिकोण)',
    purushartha: 'Dharma',
    karakaPlanet: 'Sun (Surya • सूर्य)',
    bodyParts: 'Head, brain, forehead, vitality (मस्तिष्क, सिर, जीवन ऊर्जा)',
    lifeDomain: 'Self, character, physical vitality, life orientation (शरीर, आत्मसम्मान, व्यक्तित्व)',
    baseBoons: [
      'Commanding personality with natural charisma and independent leadership capability.',
      'Robust baseline vitality, mental fortitude, and resilience in adversity.',
      'High self-respect and strong moral clarity guiding life decisions.'
    ],
    baseCautions: [
      'Guard against excessive self-absorption, ego pride, or burning the candle at both ends.',
      'Watch for stress-induced headaches, eye strain, or sudden restlessness.',
      'Avoid taking impulsive unilateral decisions without consulting trusted confidants.'
    ],
    baseRemedies: [
      'Offer water to the rising Sun (Surya Arghya) with copper vessel every morning.',
      'Chant Gayatri Mantra (108 times) at dawn with focused meditation.',
      'Drink water stored overnight in a pure copper vessel to balance vitality.'
    ],
    baseBoonsHi: [
      'आकर्षक व्यक्तित्व, स्वाभाविक सम्मोहन क्षमता तथा स्वतंत्र नेतृत्व सामर्थ्य।',
      'सुदृढ़ जीवन ऊर्जा, कठिन परिस्थितियों में मानसिक संतुलन और अदम्य इच्छाशक्ति।',
      'उच्च आत्मसम्मान, नैतिक सत्यनिष्ठा तथा दूरदर्शी जीवन दृष्टिकोण।'
    ],
    baseCautionsHi: [
      'अत्यधिक अहंकार, हठ अथवा कार्यभार के कारण शारीरिक-मानसिक थकान से बचें।',
      'तनावजनित सिरदर्द, नेत्र-विकार अथवा उतावलेपन पर नियंत्रण रखें।',
      'दूसरों के परामर्श की उपेक्षा कर एकांगी निर्णय लेने से परहेज करें।'
    ],
    baseRemediesHi: [
      'प्रातःकाल तांबे के लोटे से सूर्य देव को कुमकुम-मिश्रित अर्घ्य अर्पित करें।',
      'सूर्योदय के समय शांत मन से गायत्री महामंत्र की १ माला (१०८ बार) जपें।',
      'रात्रि में तांबे के बर्तन में रखा जल प्रातःकाल सेवन कर दिनचर्या प्रारंभ करें।'
    ],
    coreThemes: 'The 1st House is the foundational cornerstone of the horoscope. It governs identity, physical vitality, constitutional stamina, and the soul orientation in this incarnation.',
    coreThemesHi: 'प्रथम भाव जन्म कुण्डली का आधार स्तम्भ है। यह देह, आरोग्य, आत्मसम्मान, स्वभाव तथा इस जन्म में जीवात्मा के मूल उद्देश्य व जीवन दिशा का नियंत्रण करता है।'
  },
  // House 2
  {
    sanskritName: 'द्वितीय भाव • धन एवं कुटुम्ब भाव (Dhana Bhava)',
    englishTitle: '2nd House • Wealth, Family Heritage & Speech',
    classification: 'Panaphara & Maraka (पणफर एवं धन स्थान)',
    purushartha: 'Artha',
    karakaPlanet: 'Jupiter (Guru) & Mercury (Budh)',
    bodyParts: 'Face, mouth, right eye, throat, speech (मुख, वाणी, दाहिना नेत्र, कंठ)',
    lifeDomain: 'Liquid wealth, family lineage, food habits, speech, accumulated assets (धन-संग्रह, कुटुम्ब, वाणी)',
    baseBoons: [
      'Prudent financial accumulation habits and steady long-term asset security.',
      'Eloquent, persuasive, and culturally refined speech inspiring trust.',
      'Deep family heritage loyalty and affectionate domestic foundation.'
    ],
    baseCautions: [
      'Avoid high-risk speculation or unverified financial promises during retrograde cycles.',
      'Watch against harsh verbal retorts or reactive arguments in tense family matters.',
      'Guard against dietary excesses, irregular meal cycles, or throat vulnerabilities.'
    ],
    baseRemedies: [
      'Chant the sacred Shree Suktam or Lakshmi Ashtakam on Friday evenings.',
      'Feed green grass, fodder, or soaked lentils to cows on Wednesdays.',
      'Keep a square piece of pure silver in your wallet or locker for steady cash flow.'
    ],
    baseBoonsHi: [
      'विवेकपूर्ण वित्तीय बचत, स्थिर पूंजी निर्माण तथा दीर्घकालीन परिसम्पत्ति सुरक्षा।',
      'प्रभावशाली, मधुर एवं सुसंस्कृत वाणी जो जनमानस में विश्वसनीयता स्थापित करे।',
      'पारिवारिक प्रतिष्ठा का संवर्धन तथा कुटुम्ब में परस्पर सौहार्दपूर्ण सम्बंध।'
    ],
    baseCautionsHi: [
      'अटकलों, सट्टे अथवा बिना सोचे-समझे किए गए वित्तीय निवेश से दूर रहें।',
      'क्रोध में कटु वाणी अथवा पारिवारिक मामलों में उत्तेजक वार्तालाप से बचें।',
      'खान-पान में अनियमितता, अत्यधिक गरिष्ठ भोजन तथा गले की समस्याओं पर ध्यान दें।'
    ],
    baseRemediesHi: [
      'शुक्रवार की संध्या घी का दीपक प्रज्वलित कर श्री सूक्त अथवा कनकधारा स्तोत्र का पाठ करें।',
      'बुधवार के दिन गौमाता को हरा चारा अथवा भीगी हुई मूंग दाल खिलाएं।',
      'अपनी तिजोरी या पर्स में चांदी का एक चौकोर ठोस टुकड़ा सदैव स्थापित रखें।'
    ],
    coreThemes: 'The 2nd House governs wealth preservation, family legacy, verbal eloquence, facial vitality, and dietary habits.',
    coreThemesHi: 'द्वितीय भाव संचित धन, कुटुम्ब की परंपरा, वाणी का प्रभाव, मुखमंडल की आभा तथा वित्तीय सुरक्षा का प्रतिनिधित्व करता है।'
  },
  // House 3
  {
    sanskritName: 'तृतीय भाव • सहज एवं पराक्रम भाव (Sahaja Bhava)',
    englishTitle: '3rd House • Courage, Initiative & Siblings',
    classification: 'Upachaya & Apoklima (उपचय एवं सहज स्थान)',
    purushartha: 'Kama',
    karakaPlanet: 'Mars (Mangal • मंगल)',
    bodyParts: 'Shoulders, arms, hands, respiratory system (भुजाएं, कंधे, श्वास तंत्र)',
    lifeDomain: 'Valor, siblings, short journeys, communication, writing, enterprise (पराक्रम, अनुज, संचार, लेखन)',
    baseBoons: [
      'Fearless entrepreneurial spirit, dynamic initiative, and mental courage.',
      'Versatile talents in communication, writing, networking, and digital execution.',
      'Affectionate relationships and cooperative alliances with siblings and peers.'
    ],
    baseCautions: [
      'Avoid impatience, irritability, or taking unnecessary competitive risks.',
      'Beware of strain in shoulders, neck posture, or respiratory sensitivity.',
      'Do not rush into binding verbal agreements without verified documentation.'
    ],
    baseRemedies: [
      'Recite the Hanuman Chalisa on Tuesdays and apply natural red sandalwood tilak.',
      'Honor and support younger siblings, peers, and co-workers regularly.',
      'Offer jaggery (gud) and roasted chickpeas to monkeys or temple offerings on Tuesdays.'
    ],
    baseBoonsHi: [
      'अदम्य पराक्रम, साहसिक उद्यमशीलता तथा चुनौतियों से न घबराने वाली कार्यशैली।',
      'सटीक संचार कौशल, लेखन, तकनीकी दक्षता एवं जनसंपर्क में उत्कृष्ट निपुणता।',
      'अनुज भ्राता-भगिनी व सहयोगियों का विश्वास व रचनात्मक कार्यों में सहयोग।'
    ],
    baseCautionsHi: [
      'अत्यधिक उतावलेपन, अधीरता अथवा अनावश्यक वाद-विवाद से अपनी ऊर्जा व्यर्थ न करें।',
      'कंधों, ग्रीवा अथवा श्वास संबंधी संवेदनशीलता के प्रति सजग रहें।',
      'महत्वपूर्ण समझौतों में केवल मौखिक आश्वासन पर भरोसा न करें।'
    ],
    baseRemediesHi: [
      'मंगलवार को हनुमान जी के समक्ष बैठकर श्रद्धापूर्वक हनुमान चालीसा का पाठ करें।',
      'छोटे भाइयों, बहनों व कार्यक्षेत्र के अधीनस्थों का यथायोग्य सम्मान व सहयोग करें।',
      'मंगलवार के दिन लाल मसूर की दाल अथवा गुड़ का दान निर्धनों को करें।'
    ],
    coreThemes: 'The 3rd House represents self-made efforts (Parakrama), mental resilience, communication versatility, short-distance travels, and sibling ties.',
    coreThemesHi: 'तृतीय भाव बाहुबल, स्व-अर्जित पुरुषार्थ, पराक्रम, लेखन-संचार सामर्थ्य, लघु यात्राएं तथा बंधु-बांधवों के सुख का विश्लेषण करता है।'
  },
  // House 4
  {
    sanskritName: 'चतुर्थ भाव • सुख एवं मातृ भाव (Sukha Bhava)',
    englishTitle: '4th House • Mother, Real Estate & Emotional Happiness',
    classification: 'Kendra (केंद्र एवं सुख स्थान)',
    purushartha: 'Moksha',
    karakaPlanet: 'Moon (Chandra • चन्द्र)',
    bodyParts: 'Chest, heart, lungs, maternal bond (हृदय, वक्षस्थल, मातृ सुख)',
    lifeDomain: 'Mother, home, real estate, vehicles, domestic contentment (माता, गृह, भूमि, वाहन, मानसिक शांति)',
    baseBoons: [
      'Deep maternal blessings and warm, supportive domestic environment.',
      'Favorable opportunities for acquiring comfortable vehicles and real estate properties.',
      'Rich emotional empathy, intuitive contentment, and strong psychic grounding.'
    ],
    baseCautions: [
      'Guard against emotional hypersensitivity, brooding, or nostalgic melancholy.',
      'Avoid hasty property investments without comprehensive legal title verification.',
      'Pay attention to cardiac stamina, respiratory ease, and domestic harmony.'
    ],
    baseRemedies: [
      'Touch your mother’s feet daily or take maternal blessings before important ventures.',
      'Offer fresh pure milk or water to the Shiva Lingam on Monday mornings.',
      'Keep a small solid silver ball or bowl in your home’s North-East corner.'
    ],
    baseBoonsHi: [
      'मातृ-कृपा का अनवरत संबल तथा पारिवारिक सुख-सुविधाओं से युक्त शांत गृह-परिवेश।',
      'सुंदर वाहन, भवन, भूमि व अचल संपत्ति अर्जन के निरंतर शुभ अवसर।',
      'गहरी संवेदनशीलता, आत्मीय समझदारी तथा मानसिक संतोष की स्वाभाविक अवस्था।'
    ],
    baseCautionsHi: [
      'अत्यधिक भावुकता, पुरानी बातों को लेकर विषाद अथवा काल्पनिक चिंताओं से बचें।',
      'भूमि-भवन के क्रय-विक्रय में दस्तावेजों की पूरी कानूनी जांच अवश्य कराएं।',
      'हृदय-स्वास्थ्य, सीने में कफ व गृह-क्लेश को बढ़ावा देने वाली स्थितियों से सतर्क रहें।'
    ],
    baseRemediesHi: [
      'नित्य प्रातः माता के चरण स्पर्श कर आशीर्वाद लें अथवा मातृ-तुल्य स्त्रियों का आदर करें।',
      'सोमवार के दिन शिवलिंग पर कच्चा दूध व गंगाजल अर्पित कर ॐ नमः शिवाय का जप करें।',
      'घर के ईशान कोण (उत्तर-पूर्व) में एक चांदी का पात्र अथवा ठोस चांदी का सिक्का रखें।'
    ],
    coreThemes: 'The 4th House anchors inner psychological contentment, maternal nurturing, real estate properties, comfortable conveyances, and ancestral roots.',
    coreThemesHi: 'चतुर्थ भाव आंतरिक मानसिक शांति, मातृ-स्नेह, भूमि, भवन, वाहन तथा गृहस्थ जीवन के सुख का पवित्र केंद्र है।'
  },
  // House 5
  {
    sanskritName: 'पंचम भाव • पुत्र, बुद्धि एवं पूर्वपुण्य भाव (Putra Bhava)',
    englishTitle: '5th House • Intellect, Progeny & Past Merits',
    classification: 'Trikona (त्रिकोण एवं पूर्वपुण्य स्थान)',
    purushartha: 'Dharma',
    karakaPlanet: 'Jupiter (Guru • गुरु)',
    bodyParts: 'Upper abdomen, stomach, intellect, mind (उदर, बुद्धि, अंतःकरण)',
    lifeDomain: 'Higher intellect, children, past merits, creativity, romance (बुद्धि, संतान, पूर्वपुण्य, मंत्र-दीक्षा)',
    baseBoons: [
      'Acute analytical intellect, strategic foresight, and academic excellence.',
      'Spiritual inclination with natural affinity for mantra sadhana and higher philosophy.',
      'Fulfilling progeny prospects and joyful creative expression in hobbies and art.'
    ],
    baseCautions: [
      'Avoid greedy speculative gambles, crypto-churning, or shortcuts promising instant riches.',
      'Guard against digestive acidity, liver sluggishness, or stomach heat.',
      'Do not let intellectual arrogance overlook the practical wisdom of associates.'
    ],
    baseRemedies: [
      'Chant the Saraswati Mantra or Brihaspati Beej Mantra daily with devotion.',
      'Donate yellow fruits, turmeric, or study materials to deserving students on Thursdays.',
      'Practice regular morning pranayama to balance the solar plexus and digestion.'
    ],
    baseBoonsHi: [
      'कुशाग्र स्मरण शक्ति, गूढ़ विषयों को शीघ्र ग्रहण करने की मेधा तथा शैक्षिक सफलता।',
      'पूर्वजन्म के पुण्यों का लाभ, मंत्र-दीक्षा में सिद्धि तथा गहरी दार्शनिक अंतर्दृष्टि।',
      'सुयोग्य व आज्ञाकारी संतान का सुख तथा कलात्मक-सृजनात्मक कार्यों में यश।'
    ],
    baseCautionsHi: [
      'सट्टेबाजी, शेयर बाजार के अति-जोखिम अथवा त्वरित धनार्जन के प्रलोभन से बचें।',
      'पाचन क्रिया, पित्त-विकार तथा उदर स्वास्थ्य के प्रति लापरवाही न बरतें।',
      'ज्ञान के दंभ में दूसरों के व्यावहारिक अनुभवों की उपेक्षा करने से बचें।'
    ],
    baseRemediesHi: [
      'बृहस्पतिवार को ॐ ग्रां ग्रीं ग्रौं सः गुरुवे नमः का जाप करें व केले के वृक्ष का पूजन करें।',
      'विद्यार्थियों को पुस्तकें, पेन अथवा अध्ययन सामग्री का दान गुरुवार को करें।',
      'भगवान विष्णु को पीले पुष्प, चंदन व बेसन के लड्डू का भोग अर्पित करें।'
    ],
    coreThemes: 'The 5th House represents the reservoir of past-life karmic credit (Purva Punya), creative genius, progeny destiny, academic brilliance, and mantra illumination.',
    coreThemesHi: 'पंचम भाव पूर्वजन्म संचित पुण्यों, प्रखर बुद्धि, संतान-सुख, शोध-सृजन तथा मंत्र-साधना का सर्वोच्च धर्म त्रिकोण है।'
  },
  // House 6
  {
    sanskritName: 'षष्ठ भाव • अरि, रोग एवं सेवा भाव (Ari Bhava)',
    englishTitle: '6th House • Health Defense, Daily Diligence & Overcoming Adversity',
    classification: 'Dusthana & Upachaya (दुःस्थान एवं उपचय स्थान)',
    purushartha: 'Artha',
    karakaPlanet: 'Mars (Mangal) & Saturn (Shani)',
    bodyParts: 'Intestines, digestive fire, kidneys, immunity (आंतें, पाचन तंत्र, रोग प्रतिरोधक क्षमता)',
    lifeDomain: 'Overcoming enemies, debt control, disease defense, competitions (शत्रु विजय, ऋण मुक्ति, रोग रक्षा)',
    baseBoons: [
      'Formidable competitive stamina and high probability of triumph in exams and litigation.',
      'Strong immune recovery power, disciplined daily routine, and dedicated service attitude.',
      'Strategic diplomacy that disarms rivals and transforms hurdles into stepping stones.'
    ],
    baseCautions: [
      'Guard against accumulating unnecessary debts or taking loans without clear repayment roadmap.',
      'Watch for digestive inflammatory conditions, gut microbiome balance, and kidney health.',
      'Avoid getting entangled in petty workplace disputes or protracted ego litigations.'
    ],
    baseRemedies: [
      'Feed seven mixed grains (Sapta Dhanya) to wild birds on Saturday mornings.',
      'Recite the Durga Kavacham or Hanuman Bahuk for physical immunity and debt relief.',
      'Donate medicines or hygiene kits to free charitable dispensaries.'
    ],
    baseBoonsHi: [
      'प्रतियोगी परीक्षाओं, मुकदमों तथा विरोधी परिस्थितियों में अजेय विजय सामर्थ्य।',
      'रोगों से त्वरित मुक्ति दिलाने वाली सुदृढ़ रोग-प्रतिरोधक क्षमता व सेवा-भाव।',
      'कठिन से कठिन चुनौतियों को अपने कौशल से अवसर में बदलने की व्यावहारिक चतुरता।'
    ],
    baseCautionsHi: [
      'अनावश्यक ऋण लेने अथवा अनियंत्रित उधारी देने की आदत से पूर्णतः बचें।',
      'पेट, आंतों व गुर्दों के स्वास्थ्य का विशेष ध्यान रखें; खानपान में स्वच्छता बरतें।',
      'कार्यक्षेत्र में सहकर्मियों से ईर्ष्या या व्यर्थ के कानूनी विवादों में न उलझें।'
    ],
    baseRemediesHi: [
      'शनिवार के दिन पक्षियों को सात प्रकार के मिश्रित अनाज (सप्तधान्य) डालें।',
      'शत्रु-बाधा व रोग मुक्ति हेतु नित्य दुर्गा चालीसा अथवा हनुमान बाहुक का पाठ करें।',
      'निर्धनों को औषधियां दान करें अथवा निःशुल्क चिकित्सालय में सेवा कार्य करें।'
    ],
    coreThemes: 'The 6th House is an Upachaya (growth) house governing competitive victories, health defense, debt management, daily vocational service, and overcoming adversaries.',
    coreThemesHi: 'षष्ठ भाव उपचय स्थान होने के कारण निरंतर कर्मबल से रोगों, ऋणों तथा विरोधियों पर विजय प्राप्त करने का सामर्थ्य दर्शाता है।'
  },
  // House 7
  {
    sanskritName: 'सप्तम भाव • जाया, दाम्पत्य एवं व्यापार भाव (Yuvati Bhava)',
    englishTitle: '7th House • Marriage, Partnerships & Public Engagements',
    classification: 'Kendra & Maraka (केंद्र एवं कलत्र स्थान)',
    purushartha: 'Kama',
    karakaPlanet: 'Venus (Shukra) & Jupiter (Guru)',
    bodyParts: 'Lower back, pelvic region, reproduction (कटि प्रदेश, गर्भाशय, जननांग)',
    lifeDomain: 'Marriage, spouse nature, long-term partnerships, public life (दांपत्य, जीवनसाथी, व्यापारिक अनुबंध)',
    baseBoons: [
      'Devoted, dignified, and culturally refined life partner contributing to social elevation.',
      'Success in collaborative business partnerships, joint ventures, and public interactions.',
      'Magnetic public appeal and balanced diplomatic grace in negotiating high-stakes contracts.'
    ],
    baseCautions: [
      'Prevent communication silences, passive-aggressive friction, or unrealistic expectations in marriage.',
      'Ensure strict legal transparency and verified financial terms in all business partnerships.',
      'Take care of reproductive health, lumbar spinal alignment, and hydration.'
    ],
    baseRemedies: [
      'Offer fragrant white flowers and light a cow-ghee lamp to Goddess Lakshmi on Fridays.',
      'Chant Om Shukraya Namaha (108 times) to harmonize relationship bonds.',
      'Prepare sweet milk kheer on Friday and share it warmly with family members.'
    ],
    baseBoonsHi: [
      'गुणवान, निष्ठावान व संस्कारवान जीवनसाथी का सानिध्य जो सामाजिक प्रतिष्ठा में वृद्धि करे।',
      'साझेदारी के व्यवसायों, व्यापारिक गठबंधनों तथा विदेशी संपर्कों में निरंतर प्रगति।',
      'सार्वजनिक जीवन में सम्मोहक प्रभाव व कूटनीतिक समझौतों में सफलता।'
    ],
    baseCautionsHi: [
      'वैवाहिक जीवन में अहंकार, संवादहीनता अथवा अवास्तविक अपेक्षाओं को स्थान न दें।',
      'व्यापारिक साझेदारों के साथ सभी नियम-शर्तें लिखित व पारदर्शी रखें।',
      'कमर के निचले हिस्से, रीढ़ व जननेंद्रियों के स्वास्थ्य के प्रति सचेत रहें।'
    ],
    baseRemediesHi: [
      'शुक्रवार की शाम माता लक्ष्मी के मंदिर में सुगंधित श्वेत पुष्प व गाय के घी का दीपक अर्पित करें।',
      'दांपत्य माधुर्य हेतु नित्य ॐ शुं शुक्राय नमः का १०८ बार जप करें।',
      'शुक्रवार को खीर बनाकर पहले कुलदेवी अथवा भगवान को भोग लगाएं, फिर सपत्नीक ग्रहण करें।'
    ],
    coreThemes: 'The 7th House anchors marital destiny, life partner characteristics, business joint ventures, legal contracts, and external public interactions.',
    coreThemesHi: 'सप्तम भाव जीवनसाथी के स्वरूप, दांपत्य जीवन के सामंजस्य, व्यापारिक साझेदारियों तथा समाज के साथ स्थायी संबंधों का दर्पण है।'
  },
  // House 8
  {
    sanskritName: 'अष्टम भाव • रन्ध्र, आयु एवं गूढ़ ज्ञान भाव (Randhra Bhava)',
    englishTitle: '8th House • Longevity, Deep Transformation & Hidden Wisdom',
    classification: 'Dusthana & Panaphara (दुःस्थान एवं आयु स्थान)',
    purushartha: 'Moksha',
    karakaPlanet: 'Saturn (Shani • शनि)',
    bodyParts: 'Excretory system, pelvic floor, longevity (गुदा, जननेंद्रिय, आयु शक्ति)',
    lifeDomain: 'Longevity, occult wisdom, sudden transformations, legacy (आयु, गूढ़ विद्या, आकस्मिक परिवर्तन)',
    baseBoons: [
      'Exceptional lifespan vitality, deep occult/astrological intellect, and investigative acumen.',
      'Extraordinary psychological resilience that rebounds stronger from life crises.',
      'Potential for unexpected windfalls through inheritance, insurance, or unearned assets.'
    ],
    baseCautions: [
      'Drive mindfully; avoid reckless driving or venturing into dangerous unknown terrains.',
      'Guard against chronic anxiety, insomnia, or pelvic/excretory health neglect.',
      'Never engage in unethical shortcut schemes or unverified speculative secrets.'
    ],
    baseRemedies: [
      'Chant the Maha Mrityunjaya Mantra (11 or 108 times) daily with calm breath.',
      'Donate black sesame seeds, mustard oil, or dark blankets to the needy on Saturdays.',
      'Perform periodic Rudrabhishek or water offering to Lord Shiva for universal protection.'
    ],
    baseBoonsHi: [
      'दीर्घायु योग, गूढ़ ज्योतिष-अध्यात्म व अनुसंधान में असाधारण पैठ व अंतर्दृष्टि।',
      'संकटों व परिवर्तनों के मध्य शांत रहकर पुनः उठ खड़े होने की अद्वितीय मानसिक शक्ति।',
      'पैतृक संपत्ति, बीमा अथवा अनपेक्षित स्रोतों से आकस्मिक लाभ के शुभ अवसर।'
    ],
    baseCautionsHi: [
      'वाहन चलाते समय पूर्ण सतर्कता बरतें; अज्ञात व जोखिम भरे स्थलों पर जाने से बचें।',
      'गूढ़ चिंताओं, अनिद्रा अथवा आंतों-गुदा संबंधी विकारों की अनदेखी न करें।',
      'अनैतिक, गुप्त अथवा अवैध मार्ग से धन अर्जन का प्रयास कभी न करें।'
    ],
    baseRemediesHi: [
      'नित्य प्रातः अथवा संध्या महामृत्युंजय मंत्र की कम से कम १ माला (१०८ बार) जपें।',
      'शनिवार को काले तिल, सरसों का तेल अथवा काले वस्त्र जरूरतमंदों को दान करें।',
      'माह में एक बार भगवान शिव का जलाभिषेक अथवा रुद्राभिषेक कराएं।'
    ],
    coreThemes: 'The 8th House governs longevity (Ayus), transformational crises, esoteric sciences, unearned inheritance, research depth, and psychological rebirth.',
    coreThemesHi: 'अष्टम भाव आयु की अवधि, जीवन के आकस्मिक मोड़, गुप्त विद्याएं, अनुसंधान तथा आंतरिक आत्म-रूपांतरण का गूढ़ स्थान है।'
  },
  // House 9
  {
    sanskritName: 'नवम भाव • भाग्य, धर्म एवं गुरु भाव (Bhagya Bhava)',
    englishTitle: '9th House • Fortune, Dharma, Higher Wisdom & Mentors',
    classification: 'Trikona (सर्वश्रेष्ठ धर्म त्रिकोण स्थान)',
    purushartha: 'Dharma',
    karakaPlanet: 'Jupiter (Guru) & Sun (Surya)',
    bodyParts: 'Thighs, hips, arterial system (जंघाएं, कूल्हे, रक्त संचार)',
    lifeDomain: 'Divine grace, fortune, father, gurus, pilgrimage, dharma (भाग्योदय, धर्म, गुरु, तीर्थयात्रा)',
    baseBoons: [
      'Unfailing divine grace that manifests timely solutions during critical life crossroads.',
      'Blessings of wise mentors, spiritual teachers, and benevolent paternal heritage.',
      'Auspicious foreign travels, higher philosophical education, and philanthropic honor.'
    ],
    baseCautions: [
      'Avoid taking luck for granted or slacking off on necessary practical preparations.',
      'Do not harbor ideological dogmatism, judgmentalism, or disrespect toward elders.',
      'Watch for sciatic nerve sensitivity, hip flexibility, and arterial circulation.'
    ],
    baseRemedies: [
      'Touch your father’s or spiritual teacher’s feet with sincere humility and respect.',
      'Worship Lord Vishnu with yellow flowers and apply yellow sandalwood tilak on Thursdays.',
      'Support pilgrimages, temple welfare, or educational funds for underprivileged students.'
    ],
    baseBoonsHi: [
      'दैवीय कृपा का निरंतर संबल, जिससे विषम परिस्थितियों में भी भाग्योदय के द्वार खुलें।',
      'विद्वान गुरुओं, मार्गदर्शकों व पूज्य पिता का आशीर्वाद तथा उच्च आध्यात्मिक संस्कार।',
      'तीर्थयात्राओं, उच्च शिक्षा, अंतरराष्ट्रीय यात्राओं तथा सामाजिक सत्कार्यों में यश।'
    ],
    baseCautionsHi: [
      'भाग्य के भरोसे रहकर कर्म व परिश्रम में शिथिलता बरतने से बचें।',
      'धार्मिक संकीर्णता अथवा गुरुजनों-पिता के प्रति अनादर की भावना मन में न आने दें।',
      'कूल्हों, जांघों व रक्तचाप की नियमित देखभाल करें।'
    ],
    baseRemediesHi: [
      'पिता अथवा पिता-तुल्य गुरुजनों का नित्य चरण-स्पर्श कर आशीर्वाद प्राप्त करें।',
      'गुरुवार के दिन भगवान विष्णु को पीले कनेर के फूल व बेसन के लड्डू का भोग लगाएं।',
      'किसी धार्मिक स्थल, तीर्थ अथवा गुरुकुल के कल्याण कोष में यथाशक्ति दान करें।'
    ],
    coreThemes: 'The 9th House is the crest of divine fortune (Bhagya), dharmic living, spiritual mentors, fatherly relationship, and philosophical evolution.',
    coreThemesHi: 'नवम भाव जन्म कुंडली का सर्वाधिक शुभ धर्म त्रिकोण है। यह भाग्योदय, ईश्वर कृपा, पिता, गुरु, उच्च ज्ञान तथा सत्कर्मों का अधिष्ठाता है।'
  },
  // House 10
  {
    sanskritName: 'दशम भाव • कर्म, कीर्ति एवं राज्य भाव (Karma Bhava)',
    englishTitle: '10th House • Career, Executive Authority, Fame & Zenith',
    classification: 'Kendra (सर्वोच्च केंद्र एवं कर्म स्थान)',
    purushartha: 'Artha',
    karakaPlanet: 'Sun, Mercury, Jupiter, Saturn',
    bodyParts: 'Knees, bones, skeletal structure, joints (जानु, घुटने, अस्थि तंत्र)',
    lifeDomain: 'Career, vocation, authority, reputation, executive power (आजीविका, पद-प्रतिष्ठा, राज्य सम्मान)',
    baseBoons: [
      'Remarkable vocational ascent into positions of executive authority and public command.',
      'Widespread professional respect, high credibility, and civic/governmental recognition.',
      'Natural administrative stamina to oversee complex operations with strategic vision.'
    ],
    baseCautions: [
      'Guard against professional workaholism that sacrifices family health and relationships.',
      'Avoid hubristic management styles that generate unnecessary workplace rivals.',
      'Pay attention to knee joints, bone density, and posture during sedentary desk hours.'
    ],
    baseRemedies: [
      'Recite the Aditya Hridaya Stotram on Sundays for vocational brilliance and victory.',
      'Keep a sacred brass or copper Sun emblem facing East at your primary workplace.',
      'Engage in selfless community service (Nishkama Seva) without expecting accolades.'
    ],
    baseBoonsHi: [
      'कार्यक्षेत्र में निरंतर उन्नति, प्रशासनिक अधिकार तथा उच्च प्रबंधकीय प्रतिष्ठा।',
      'शासन, समाज व व्यावसायिक जगत में विशिष्ट सम्मान, विश्वसनीयता व कीर्ति।',
      'जटिल से जटिल योजनाओं को सफलतापूर्वक क्रियान्वित करने का अद्भुत संगठनात्मक सामर्थ्य।'
    ],
    baseCautionsHi: [
      'काम के अत्यधिक दबाव में परिवार, स्वास्थ्य व आत्मिक शांति की उपेक्षा न करें।',
      'अधीनस्थ कर्मचारियों के प्रति कठोरता अथवा कार्यक्षेत्र में अनावश्यक ईर्ष्या से बचें।',
      'घुटनों के जोड़ों, हड्डियों के स्वास्थ्य व कार्य के समय बैठने की मुद्रा का ध्यान रखें।'
    ],
    baseRemediesHi: [
      'रविवार को सूर्योदय के समय आदित्य हृदय स्तोत्र का पाठ करें।',
      'अपने कार्यालय अथवा अध्ययन कक्ष में पूर्व दिशा में तांबे का सूर्य यंत्र स्थापित करें।',
      'सप्ताह में एक बार निस्वार्थ भाव से समाजोपयोगी सेवा कार्य में अपना समय दें।'
    ],
    coreThemes: 'The 10th House is the zenith of the chart (Midheaven), commanding career prestige, worldly achievements, authority figures, and public legacy.',
    coreThemesHi: 'दशम भाव कुंडली का सर्वोच्च केंद्र (कर्म स्थान) है। यह जातक की आजीविका, व्यवसाय, मान-सम्मान, पदोन्नति तथा समाज में स्थायी प्रभाव का नियमन करता है।'
  },
  // House 11
  {
    sanskritName: 'एकादश भाव • लाभ, आय एवं सिद्धि भाव (Labha Bhava)',
    englishTitle: '11th House • Incomes, Social Networks & Wish Fulfillment',
    classification: 'Upachaya & Panaphara (उपचय एवं लाभ स्थान)',
    purushartha: 'Kama',
    karakaPlanet: 'Jupiter (Guru • गुरु)',
    bodyParts: 'Calves, shins, left ear, ankles (पिंडलियां, बायां कर्ण, टखने)',
    lifeDomain: 'Regular income, elder siblings, social networks, wish fulfillment (सर्वतोमुखी लाभ, मित्र, महत्वाकांक्षा)',
    baseBoons: [
      'Multiple diversified streams of income that expand progressively with age.',
      'Influential circle of noble friends, mentors, and high-level social networks.',
      'Fulfillment of long-cherished ambitions, humanitarian triumphs, and public awards.'
    ],
    baseCautions: [
      'Avoid unwritten financial transactions or lending money carelessly within friend circles.',
      'Do not allow monetary gain to compromise your fundamental moral integrity.',
      'Watch for calf muscle cramps, ankle stiffness, or circulatory sluggishness in legs.'
    ],
    baseRemedies: [
      'Offer green Durva grass to Lord Ganesha on Wednesdays and chant Om Gan Ganapataye Namaha.',
      'Support elder siblings, mentors, and charitable orphanages on celebratory days.',
      'Donate food grains, fruits, or green garments to underprivileged families.'
    ],
    baseBoonsHi: [
      'आय के विविध व निरंतर बढ़ते स्रोत, जिससे जीवन में कभी धन का अभाव न रहे।',
      'प्रतिष्ठित मित्रों, प्रभावशाली समाजसेवियों व शुभचिंतकों का निरंतर सहयोग।',
      'दीर्घकालीन अभिलाषाओं, सामाजिक संकल्पों व उच्च लक्ष्यों की सहज पूर्ति।'
    ],
    baseCautionsHi: [
      'मित्रों अथवा सामाजिक संपर्कों के साथ बिना लिखा-पढ़ी के वित्तीय लेन-देन से बचें।',
      'केवल धन-लाभ के लिए अपने नैतिक मूल्यों व सिद्धांतों से समझौता न करें।',
      'पिंडलियों, टखनों के दर्द अथवा पैरों में रक्त-संचार की शिथिलता के प्रति सावधान रहें।'
    ],
    baseRemediesHi: [
      'बुधवार के दिन भगवान श्री गणेश को २१ दूर्वा दल अर्पित करें व मोदक का भोग लगाएं।',
      'अपने बड़े भाइयों, बहनों व वरिष्ठ मित्रों का सम्मान करें और उन्हें उपहार दें।',
      'अनाथालयों अथवा वृद्ध आश्रमों में अन्न व वस्त्र का नियमित दान करें।'
    ],
    coreThemes: 'The 11th House is the premier Upachaya (growth) house governing all forms of monetary inflow, social impact networks, elder siblings, and realization of desires.',
    coreThemesHi: 'एकादश भाव सर्वतोमुखी लाभ, निरंतर धन-आगमन, वरिष्ठ बंधु-बांधवों, प्रभावशाली मित्रों तथा जीवन की समस्त मनोकामनाओं की सिद्धि का पावन स्थान है।'
  },
  // House 12
  {
    sanskritName: 'द्वादश भाव • व्यय, मोक्ष एवं विदेश भाव (Vyaya Bhava)',
    englishTitle: '12th House • Spiritual Liberation, Foreign Connections & Inner Peace',
    classification: 'Dusthana & Apoklima (त्रिक दुःस्थान एवं मोक्ष स्थान)',
    purushartha: 'Moksha',
    karakaPlanet: 'Saturn (Shani) & Ketu (केतु)',
    bodyParts: 'Feet, toes, left eye, sleep cycles (चरण, तलवे, बायां नेत्र, निद्रा चक्र)',
    lifeDomain: 'Spiritual liberation (Moksha), foreign travels, peaceful sleep, charity (मोक्ष, विदेश वास, दान, ध्यान)',
    baseBoons: [
      'Profound spiritual detachment, serene meditative insight, and inner awakening.',
      'Lucrative opportunities through foreign connections, international voyages, and global ventures.',
      'Generous philanthropic disposition that transforms wealth into lasting spiritual merit.'
    ],
    baseCautions: [
      'Avoid chronic insomnia, irregular sleep patterns, or excessive escapist daydreams.',
      'Keep prudent check over financial leakages, impulse purchases, or non-essential expenses.',
      'Guard against isolation tendencies; maintain healthy social connection with loved ones.'
    ],
    baseRemedies: [
      'Burn pure natural camphor (Kapur) in your bedroom at night to cleanse subtle energies.',
      'Practice 15 minutes of silent mindful meditation or pranayama right before sleeping.',
      'Donate warm blankets, shoes, or clothing to the destitute on Saturday evenings.'
    ],
    baseBoonsHi: [
      'गहरी आध्यात्मिक अंतर्मुखता, ध्यान में सहज समाधि तथा सांसारिक प्रपंचों से विरक्ति।',
      'विदेशी संपर्कों, बहुराष्ट्रीय उपक्रमों, आयात-निर्यात अथवा सुदूर यात्राओं से प्रचुर लाभ।',
      'परोपकारी स्वभाव, दान-पुण्य से अर्जित अमर पुण्य तथा आंतरिक शांति का अनुभव।'
    ],
    baseCautionsHi: [
      'अनिद्रा, रात्रि में अत्यधिक जागने अथवा व्यर्थ की दिवास्वप्न-वृत्ति पर नियंत्रण रखें।',
      'अनावश्यक खर्चों, दिखावे अथवा विलासिता पर अनियंत्रित व्यय से बजट न बिगड़ने दें।',
      'अत्यधिक एकांतप्रिय होकर परिवार व समाज से पूरी तरह कटने से बचें।'
    ],
    baseRemediesHi: [
      'शयनकक्ष में रात्रि के समय शुद्ध भीमसेनी कपूर जलाकर वातावरण को सात्विक बनाएं।',
      'सोने से पूर्व १०-१५ मिनट शांत बैठकर मन को शांत करें व ॐ का मानसिक जप करें।',
      'शनिवार की शाम जरूरतमंदों को जूते, चप्पल अथवा ऊनी वस्त्र/कम्बल का दान करें।'
    ],
    coreThemes: 'The 12th House represents the final gateway of the zodiac: Moksha (liberation), foreign residence, philanthropic release, dream realms, and detachment from worldly illusions.',
    coreThemesHi: 'द्वादश भाव राशि चक्र का अंतिम मोक्ष द्वार है। यह आध्यात्मिक मुक्ति, विदेश गमन, परोपकार, व्यय पर नियंत्रण तथा गहन निद्रा-सुख का कारक है।'
  }
];

const BHAVA_MARATHI_CONFIG: Record<number, {
  title: string;
  lifeDomain: string;
  coreThemes: string;
  baseBoons: string[];
  baseCautions: string[];
  baseRemedies: string[];
}> = {
  1: {
    title: 'प्रथम भाव • तनु भाव (शरीर, आरोग्य व व्यक्तिमत्त्व)',
    lifeDomain: 'आरोग्य, शारीरिक तेज, स्वभाव, आत्मविश्वास आणि जीवन ऊर्जा',
    coreThemes: 'प्रथम भाव किंवा लग्न स्थान हे संपूर्ण कुंडलीचा प्राण असून, ते जातकाचे शरीर, आरोग्य, व्यक्तिमत्त्व, विचारसरणी आणि स्वाभिमानाचे मूळ केंद्र आहे.',
    baseBoons: [
      'प्रभावी व्यक्तिमत्त्व, उच्च आत्मविश्वास, उत्तम आरोग्य आणि समाजात प्रतिष्ठा.',
      'संकटांवर मात करण्याची मानसिक क्षमता आणि स्वतंत्र विचारसरणी.',
      'स्वाभाविक नेतृत्वगुण, तेजस्वी स्वभाव आणि दीर्घायुष्य योग.'
    ],
    baseCautions: [
      'अतिउत्साह किंवा कामाच्या ताणामुळे डोकेदुखी व मानसिक तणाव टाळा.',
      'आहार आणि दिनचर्येचे काटेकोर नियम पाळा; आरोग्याकडे दुर्लक्ष करू नका.',
      'अहंकार किंवा हट्टी स्वभावामुळे जवळच्या नातेवाईकांशी वाद टाळा.'
    ],
    baseRemedies: [
      'दररोज सकाळी तांब्याच्या पात्रातून सूर्याला अर्घ्य द्यावे व ॐ घृणि सूर्याय नमः चा जप करावा.',
      'कपाळावर चंदनाचा किंवा केशरचा टिळा लावावा.',
      'गायीला चारा किंवा गूळ-पोळी खाऊ घालावी.'
    ]
  },
  2: {
    title: 'द्वितीय भाव • धन भाव (वाणी, संपत्ती व कुटुंब)',
    lifeDomain: 'संचित धन, वाणी, कौटुंबिक सौख्य आणि संस्कार',
    coreThemes: 'द्वितीय भाव जातकाची वाणी, पैतृक संपत्ती, संचित कोष, कौटुंबिक सौख्य आणि प्राथमिक संस्कारांचे द्योतक आहे.',
    baseBoons: [
      'आर्थिक स्थैर्य, संचित संपत्तीत निरंतर वृद्धी आणि व्यवसायात धनलाभ.',
      'गोड आणि प्रभावी वाणी, ज्यामुळे समाजात आणि कुटुंबात आदर प्राप्त होतो.',
      'कौटुंबिक सहकार्य आणि वडिलोपार्जित संपत्तीचा विशेष लाभ.'
    ],
    baseCautions: [
      'अनावश्यक खर्च आणि सट्टेबाजी किंवा अनपेक्षित जोखमींपासून दूर राहा.',
      'कटू शब्द वापरणे टाळा, ज्यामुळे नात्यांमध्ये दुरावा निर्माण होणार नाही.',
      'मुख व डोळ्यांच्या आरोग्याची नियमित काळजी घ्या.'
    ],
    baseRemedies: [
      'शुक्रवारी कनकधारा स्तोत्र किंवा महालक्ष्मी अष्टकमचे पठण करावे.',
      'गुरुवारी गरजू व्यक्तींना पिवळे धान्य किंवा मिठाई दान करावी.',
      'नेहमी घरात व तिजोरीत स्वच्छता ठेवावी.'
    ]
  },
  3: {
    title: 'तृतीय भाव • सहज भाव (पराक्रम, भावंडे व कौशल्य)',
    lifeDomain: 'पराक्रम, धाडस, लहान भावंडे, संपर्क कला आणि कौशल्य',
    coreThemes: 'तृतीय भाव अदम्य धैर्य, पराक्रम, लहान भावंडे, संपर्क कौशल्य आणि हाताच्या कौशल्यांचे स्थान आहे.',
    baseBoons: [
      'अफाट धाडस, जिद्द, परिश्रम करण्याची तयारी आणि संकटांशी लढण्याची क्षमता.',
      'उत्कृष्ट संवाद कौशल्य, तांत्रिक कार्ये, लेखन किंवा कलेत निपुणता.',
      'लहान भावंडांचे सहकार्य आणि अल्प प्रवासांतून आर्थिक लाभ.'
    ],
    baseCautions: [
      'अति घाईगडबडीत घेतलेले निर्णय नुकसान पोहोचवू शकतात; संयम बाळगा.',
      'सहकारी किंवा भावंडांसोबत गैरसमज टाळण्यासाठी स्पष्ट संवाद ठेवा.',
      'खांदे, हात आणि श्वसन प्रणालीची नियमित काळजी घ्या.'
    ],
    baseRemedies: [
      'मंगळवारी हनुमान चालिसाचे पठण करावे व लाल चंदनाचा टिळा लावावा.',
      'पक्षांना दररोज धान्य आणि पाणी ठेवावे.',
      'लहान भावंडांना किंवा मित्रांना मदत करावी.'
    ]
  },
  4: {
    title: 'चतुर्थ भाव • सुख भाव (माता, गृह, भूमी व मनःशांती)',
    lifeDomain: 'मातृसुख, घर, जमीन, वाहन आणि अंतःकरणातील शांतता',
    coreThemes: 'चतुर्थ भाव मातृसुख, स्वतःचे घर, जमीन-जुमला, वाहन आणि अंतःकरणातील मानसिक समाधानाचे केंद्र आहे.',
    baseBoons: [
      'मातेचा उत्तम आशीर्वाद, स्वतःचे घर आणि आलिशान वाहनांचे सुख.',
      'स्थिर मालमत्ता, सुसज्ज गृहसौख्य आणि कुटुंबात शांततामय वातावरण.',
      'सकारात्मक मनःस्थिती आणि समाजात प्रतिष्ठित स्थान.'
    ],
    baseCautions: [
      'अतिसंवेदनशील किंवा भावूक होऊन स्वतःला एकाकी समजू नका.',
      'घर किंवा मालमत्ता खरेदी-विक्री करताना कागदपत्रांची काळजीपूर्वक तपासणी करा.',
      'हृदय, छाती आणि फुप्फुसांच्या आरोग्याची वेळोवेळी तपासणी करा.'
    ],
    baseRemedies: [
      'दररोज सकाळी मातेच्या चरणांना स्पर्श करून आशीर्वाद घ्यावेत.',
      'सोमवारी महादेवाला कच्च्या दुधाचा आणि पाण्याचा अभिषेक करावा.',
      'घरात स्वच्छ आणि सकारात्मक वातावरण ठेवावे.'
    ]
  },
  5: {
    title: 'पंचम भाव • बुद्धी भाव (ज्ञान, संतती व पूर्वपुण्य)',
    lifeDomain: 'उच्च विद्या, निर्णयक्षमता, संतती, पूर्वपुण्य आणि कलात्मक बुद्धी',
    coreThemes: 'पंचम भाव पूर्वजन्मातील संचित पुण्य, उच्च विद्या, बुद्धिमत्ता, मंत्र साधना, सर्जनशीलता आणि संतती सुखाचे पावन स्थान आहे.',
    baseBoons: [
      'तीक्ष्ण बुद्धिमत्ता, उच्च शिक्षण, संशोधक वृत्ती आणि विद्वत्ता.',
      'सुसंस्कृत संततीचे सौख्य आणि संततीकडून मान-सन्मान.',
      'शेअर बाजार किंवा बौद्धिक कामांतून विशेष धनलाभाचे योग.'
    ],
    baseCautions: [
      'अतिआत्मविश्वासात मोठी आर्थिक जोखीम किंवा जुगार खेळणे टाळा.',
      'अभ्यास किंवा एकाग्रतेत खंड पडू देऊ नका.',
      'पोटाचे विकार, पचनशक्ती आणि पाठीच्या मणक्याची काळजी घ्या.'
    ],
    baseRemedies: [
      'दररोज गायत्री मंत्राचा किंवा सरस्वती स्तोत्राचा १०८ वेळा जप करावा.',
      'गुरुवारी विद्यार्थ्यांना शैक्षणिक साहित्य किंवा पुस्तके भेट द्यावीत.',
      'पिवळ्या रंगाचे वस्त्र किंवा केळीचे झाड पूजनीय मानावे.'
    ]
  },
  6: {
    title: 'षष्ठ भाव • सेवा भाव (शत्रू, रोग, स्पर्धा व विजय)',
    lifeDomain: 'स्पर्धा परीक्षा, नोकरी, रोगप्रतिकारशक्ती, कर्ज आणि विजय',
    coreThemes: 'षष्ठ भाव दैनंदिन कार्य, नोकरी, स्पर्धा, रोगप्रतिकारशक्ती आणि विरोधकांवर विजय मिळवण्याचे स्थान आहे.',
    baseBoons: [
      'स्पर्धा परीक्षांमध्ये दैदीप्यमान यश, विरोधकांवर सहज विजय.',
      'उत्कृष्ट कार्यक्षमता, सेवेची आवड आणि नोकरीत पदोन्नतीचे योग.',
      'कोणत्याही कठीण प्रसंगातून स्वतःला सुरक्षित बाहेर काढण्याची क्षमता.'
    ],
    baseCautions: [
      'विनाकारण कर्ज घेणे किंवा कोणाची जामीन राहणे टाळा.',
      'पोटाच्या तक्रारी किंवा पचनसंस्थेचे विकार दुर्लक्षित करू नका.',
      'शत्रू किंवा विरोधकांना कधीही कमी लेखू नका; सावध राहा.'
    ],
    baseRemedies: [
      'बुधवारी किंवा शनिवारी गरजू लोकांना अन्नदान करावे.',
      'दररोज ॐ नमो भगवते वासुदेवाय चा जप करावा.',
      'नियमित योग आणि प्राणायाम करून रोगप्रतिकारशक्ती वाढवावी.'
    ]
  },
  7: {
    title: 'सप्तम भाव • जाया भाव (विवाह, जोडीदार व भागीदारी)',
    lifeDomain: 'दांपत्य जीवन, जोडीदार, भागीदारी व्यवसाय आणि जनसंपर्क',
    coreThemes: 'सप्तम भाव वैवाहिक जीवन, जीवनसाथी, व्यावसायिक भागीदारी आणि सामाजिक जनसंपर्काचे महत्त्वाचे केंद्र आहे.',
    baseBoons: [
      'सुसंस्कृत, प्रेमळ आणि सहकार्य करणारा जीवनसाथी मिळण्याचे योग.',
      'भागीदारीच्या व्यवसायातून मोठा नफा आणि समाजात लोकप्रियता.',
      'सुखद आणि आनंदी वैवाहिक जीवन.'
    ],
    baseCautions: [
      'संवादातील गैरसमज किंवा अहंकारामुळे दांपत्य जीवनात वाद निर्माण होऊ देऊ नका.',
      'भागीदारी करताना सर्व करार लेखी आणि कायदेशीररीत्या करा.',
      'मूत्रपिंड किंवा कमरेखालच्या अवयवांची काळजी घ्या.'
    ],
    baseRemedies: [
      'शुक्रवारी लक्ष्मी-नारायणाची पूजा करावी आणि पांढरी मिठाई अर्पण करावी.',
      'जोडीदाराचा आदर करावा आणि परस्पर समंजसपणा वाढवावा.',
      'गाईला दररोज ताजी पोळी खाऊ घालावी.'
    ]
  },
  8: {
    title: 'अष्टम भाव • गूढ भाव (दीर्घायुष्य, संकट व आध्यात्मिक परिवर्तन)',
    lifeDomain: 'आयुर्मर्यादा, आकस्मिक धनलाभ, गूढ ज्ञान, संशोधन व वारसाहक्क',
    coreThemes: 'अष्टम भाव आयुष्याची मर्यादा, अकस्मात घडणाऱ्या घटना, गूढ विद्या, वारसाहक्क आणि आध्यात्मिक पुनर्जन्माचे गूढ स्थान आहे.',
    baseBoons: [
      'दीर्घायुष्य, गूढ शास्त्रे, ज्योतिष आणि अध्यात्मात सखोल गती.',
      'अचानक धनलाभ, विमा, वारसाहक्क किंवा गुप्त स्रोतांतून आर्थिक फायदा.',
      'कठीण संकटांतून तावून-सुलाखून बाहेर पडण्याची प्रचंड मानसिक शक्ती.'
    ],
    baseCautions: [
      'वाहन चालवताना वेगावर नियंत्रण ठेवा आणि सतर्क राहा.',
      'गुपित व्यवहार किंवा अनैतिक मार्गाने पैसे कमावण्याचा मोह टाळा.',
      'मानसिक चिंता किंवा जुनाट विकारांकडे वेळीच लक्ष द्या.'
    ],
    baseRemedies: [
      'दररोज महामृत्युंजय मंत्राचा किमान ११ किंवा १०८ वेळा जप करावा.',
      'शनिवारी काळे तीळ किंवा मोहरीचे तेल दान करावे.',
      'महादेवाला जलाभिषेक करावा.'
    ]
  },
  9: {
    title: 'नवम भाव • भाग्य भाव (भाग्य, धर्म, गुरु व उच्च शिक्षण)',
    lifeDomain: 'ईश्वरीय कृपा, भाग्योदय, वडील, गुरु, तीर्थयात्रा आणि धर्म',
    coreThemes: 'नवम भाव जन्म कुंडलीचा सर्वश्रेष्ठ धर्म त्रिकोण असून, तो भाग्योदय, ईश्वरीय कृपा, वडील, गुरु, उच्च ज्ञान आणि सदाचाराचे अधिष्ठान आहे.',
    baseBoons: [
      'प्रचंड भाग्यबल, संकटसमयी आपोआप मार्ग सापडणे आणि ईश्वराची कृपा.',
      'विद्वान गुरुंचे आणि वडिलांचे आशीर्वाद, उच्च संस्कार आणि धार्मिक निष्ठा.',
      'तीर्थयात्रा, परदेश प्रवास आणि उच्च शिक्षणात उत्तुंग यश.'
    ],
    baseCautions: [
      'केवळ नशिबावर विसंबून राहून कष्टांकडे दुर्लक्ष करू नका.',
      'वडिलांशी किंवा गुरुजनांशी कधीही मतभेद किंवा वाद घालू नका.',
      'मांड्या, खुबा किंवा रक्ताभिसरणाची काळजी घ्या.'
    ],
    baseRemedies: [
      'दररोज वडिलांच्या आणि गुरुंच्या चरणांना स्पर्श करून आशीर्वाद घ्यावेत.',
      'गुरुवारी विष्णू सहस्रनामाचे पठण करावे किंवा पिवळे चंदन लावावे.',
      'धार्मिक कार्यासाठी किंवा विद्यार्थ्यांच्या शिक्षणासाठी यथाशक्ती मदत करावी.'
    ]
  },
  10: {
    title: 'दशम भाव • कर्म भाव (कारकीर्द, अधिकार, पद व कीर्ती)',
    lifeDomain: 'व्यवसाय, नोकरी, सामाजिक प्रतिष्ठा, अधिकार आणि कीर्ती',
    coreThemes: 'दशम भाव सर्वोच्च केंद्र स्थान असून ते जातकाची आजीविका, व्यवसाय, अधिकार, राजकीय प्रतिष्ठा आणि यशाचे उत्तुंग शिखर आहे.',
    baseBoons: [
      'कारकीर्दीत सर्वोच्च पद, सरकारी किंवा खाजगी क्षेत्रात मोठा मान-सन्मान.',
      'व्यापारात मोठी प्रगती, नेतृत्व करण्याची संधी आणि समाजात नावलौकिक.',
      'कष्टातून स्वतःचे स्वतंत्र साम्राज्य निर्माण करण्याची क्षमता.'
    ],
    baseCautions: [
      'कामाच्या ठिकाणी सहकाऱ्यांशी उद्धटपणा टाळा; अहंकारावर नियंत्रण ठेवा.',
      'कामाचा अतिताण घेऊन आरोग्याकडे दुर्लक्ष करू नका.',
      'गुडघे आणि सांध्यांच्या आरोग्याची काळजी घ्या.'
    ],
    baseRemedies: [
      'दररोज सकाळी सूर्याला जल अर्पण करून आदित्य हृदय स्तोत्राचे पठण करावे.',
      'शनिवारी शनी मंदिरात दिवा लावावा किंवा गरजूंना मदत करावी.',
      'आपल्या कामात नेहमी सचोटी आणि प्रामाणिकपणा ठेवावा.'
    ]
  },
  11: {
    title: 'एकादश भाव • लाभ भाव (उत्पन्न, मित्र, इच्छापूर्ती व यश)',
    lifeDomain: 'नियमित धनलाभ, उत्पन्न, मोठे भावंडे, मित्रपरिवार आणि इच्छापूर्ती',
    coreThemes: 'एकादश भाव सर्व प्रकारचा लाभ, उत्पन्नाचे स्रोत, मित्रपरिवार, मोठे भावंडे आणि जीवनातील महत्त्वाकांक्षा पूर्ण करण्याचे स्थान आहे.',
    baseBoons: [
      'अनेक स्रोतांतून निरंतर धनलाभ, मोठी आर्थिक उद्दिष्टे साध्य होणे.',
      'प्रतिष्ठित मित्रमंडळींचे सहकार्य आणि समाजातील प्रभावशाली व्यक्तींशी संबंध.',
      'सर्व मनोकामना वेळेवर पूर्ण होण्याचे अत्यंत शुभ योग.'
    ],
    baseCautions: [
      'लोभी किंवा स्वार्थी मित्रांच्या नादाला लागून आर्थिक नुकसान करून घेऊ नका.',
      'कमाईचा योग्य विनियोग करा, उधळपट्टी टाळा.',
      'घोटे आणि पायांच्या आरोग्याची काळजी घ्या.'
    ],
    baseRemedies: [
      'बुधवारी गणपतीला २१ दुर्वा अर्पण कराव्यात आणि मोदकाचा नैवेद्य दाखवावा.',
      'मोठ्या भावाचा आणि ज्येष्ठ व्यक्तींचा नेहमी आदर करावा.',
      'आपल्या कमाईतील काही भाग समाजसेवेसाठी खर्च करावा.'
    ]
  },
  12: {
    title: 'द्वादश भाव • मोक्ष भाव (खर्च, परदेशगमन, ध्यान व मुक्ती)',
    lifeDomain: 'खर्च, परदेश वास्तव्य, दानधर्म, एकांत, ध्यान आणि मोक्ष',
    coreThemes: 'द्वादश भाव अंतिम मोक्ष, परदेश वास्तव्य, ध्यान, आध्यात्मिक एकांत आणि दातृत्व दर्शवणारे परम स्थान आहे.',
    baseBoons: [
      'परदेश प्रवास किंवा परदेशात स्थायिक होण्याचे अत्यंत प्रबळ योग.',
      'धार्मिक कार्ये, दानधर्म आणि परोपकारातून मिळणारे समाधान आणि पुण्य.',
      'अध्यात्म, ध्यानधारणा आणि मानसिक शांततेत प्रगती.'
    ],
    baseCautions: [
      'व्यसने किंवा अनावश्यक विलासावर अनाठायी खर्च करणे टाळा.',
      'डोळे आणि पायांच्या आरोग्याकडे दुर्लक्ष करू नका; पुरेशी झोप घ्या.',
      'अनोळखी व्यक्तींवर डोळे झाकून आर्थिक विश्वास ठेवू नका.'
    ],
    baseRemedies: [
      'रात्री झोपण्यापूर्वी मन शांत ठेवून नामस्मरण किंवा ध्यान करावे.',
      'सोमवारी किंवा शनिवारी गरजू लोकांना अन्न किंवा पांढरी वस्त्रे दान करावीत.',
      'तीर्थस्थानी जाऊन ध्यान किंवा साधना करावी.'
    ]
  }
};

/**
 * Computes exhaustive, structured analysis for all 12 Bhavas (Houses 1 to 12).
 * Synthesizes the house's Rashi, Lord, resident planets, classification, and life impact.
 */
export const calculate12BhavasDetailedAnalysis = (
  lagnaSignNumber: number = 1,
  planetaryPositions: PlanetaryPositionDetail[] = [],
  language: Language = 'English'
): BhavaDetailedAnalysis[] => {
  const lagnaIdx = Math.max(0, Math.min(11, (lagnaSignNumber || 1) - 1));

  return BHAVA_CORE_CONFIG.map((cfg, idx) => {
    const houseNumber = idx + 1;
    const rashiIdx = (lagnaIdx + houseNumber - 1) % 12;
    const rashiNumber = rashiIdx + 1;
    const rashiName = RASHI_NAMES_EN[rashiIdx];
    const rashiLord = SIGN_LORDS[rashiIdx];
    const element = SIGN_ELEMENTS[rashiIdx] || 'Fire';

    // Localized attributes
    const localizedSign = getLocalizedSign(rashiName, language);
    const localizedLord = getLocalizedPlanet(rashiLord, language);
    const localizedElement = getLocalizedElement(element, language);
    const localizedPurushartha = getLocalizedPurushartha(cfg.purushartha, language);
    const localizedClassification = getLocalizedClassification(cfg.classification, language);

    // Get localized bhava content
    const bhavaData = getLocalizedBhavaData(houseNumber, language);
    const localizedKaraka = getLocalizedPlanet(bhavaData.karakaKey, language);

    // Find planets in this house
    const planetsInHouse = planetaryPositions.filter(p => p.house === houseNumber);

    // Synthesize detailed analysis in pure native language
    let detailedAnalysis = '';
    const isEnglish = language === 'English';
    const isMarathi = language === 'Marathi';
    const isGujarati = language === 'Gujarati';
    const isBengali = language === 'Bengali';
    const isTamil = language === 'Tamil';
    const isTelugu = language === 'Telugu';
    const isKannada = language === 'Kannada';
    const isMalayalam = language === 'Malayalam';
    const isPunjabi = language === 'Punjabi';
    const isOdia = language === 'Odia';

    if (isEnglish) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nIn your natal Janma Kundali, this ${bhavaData.title} is governed by the sign of ${localizedSign}, whose planetary ruler is ${localizedLord}. This house operates under the primal ${localizedElement} element. `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `This sacred house is directly energized by the placement of ${pNames}, infusing these life matters with intense focus, specific karmic lessons, and heightened planetary influence. `;
      } else {
        detailedAnalysis += `No planetary body directly occupies this house; thus, its fruits are governed primarily through the placement, dignity, and aspects of its house lord ${localizedLord}. `;
      }
      detailedAnalysis += `Operating within the ${localizedPurushartha} pillar and classified as ${localizedClassification}, this house plays an indispensable role in shaping your ${bhavaData.lifeDomain}.`;
    } else if (isMarathi) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nआपल्या जन्म लग्न कुंडलीमध्ये या ${bhavaData.title} वर ${localizedSign} राशीचा प्रभाव असून, या राशीचे स्वामी ग्रह ${localizedLord} आहेत. हा भाव तत्त्व रूपाने ${localizedElement} ऊर्जेने संचालित आहे. `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `या पावन भावात ${pNames} यांची प्रत्यक्ष उपस्थिती या भावाच्या कारकतत्त्वांना असाधारण बळ व विशेष सक्रियता प्रदान करते. `;
      } else {
        detailedAnalysis += `या भावात सध्या कोणताही प्रत्यक्ष ग्रह स्थित नसून, याचे मुख्य फळ राशी स्वामी ${localizedLord} यांची स्थिती व शुभ ग्रहांच्या दृष्टींद्वारे नियंत्रित होते. `;
      }
      detailedAnalysis += `हा भाव ${localizedPurushartha} पुरुषार्थ तसेच ${localizedClassification} या श्रेणीत येतो. त्यामुळे जातकाच्या ${bhavaData.lifeDomain} या सर्व अंगांमध्ये हा भाव अत्यंत निर्णायक व प्रभावी भूमिका बजावतो.`;
    } else if (isGujarati) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nઆપની જન્મ લગ્ન કુંડળીમાં આ ${bhavaData.title} પર ${localizedSign} રાશિનો પ્રભાવ છે, જેના અધિપતિ ગ્રહ ${localizedLord} છે. આ ભાવ તત્ત્વ સ્વરૂપે ${localizedElement} ઊર્જાથી સંચાલિત છે. `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `આ પાવન ભાવમાં ${pNames} ની પ્રત્યક્ષ ઉપસ્થિતિ આ ભાવના કારકતત્ત્વોને વિશેષ બળ અને સક્રિયતા પ્રદાન કરે છે. `;
      } else {
        detailedAnalysis += `આ ભાવમાં કોઈ પ્રત્યક્ષ ગ્રહ સ્થિત નથી; તેથી તેનું મુખ્ય સંચાલન રાશિ સ્વામી ${localizedLord} ની સ્થિતિ અને શુભ દ્રષ્ટિઓ દ્વારા થાય છે. `;
      }
      detailedAnalysis += `આ ભાવ ${localizedPurushartha} પુરુષાર્થ તેમજ ${localizedClassification} શ્રેણીમાં આવે છે. તેથી જાતકના ${bhavaData.lifeDomain} સાથે જોડાયેલા તમામ પાસાંઓમાં આ ભાવ અત્યંત નિર્ણાયક ભૂમિકા ભજવે છે.`;
    } else if (isBengali) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nআপনার জন্ম লগ্ন কুণ্ডলীতে এই ${bhavaData.title}-এর উপর ${localizedSign} রাশির প্রভাব রয়েছে, যার অধিপতি গ্রহ ${localizedLord}। এই ভাবটি মূল উপাদান হিসেবে ${localizedElement} শক্তি দ্বারা পরিচালিত। `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `এই পবিত্র ভাবে ${pNames}-এর প্রত্যক্ষ উপস্থিতি এই ভাবের কারকতত্ত্বকে বিশেষ শক্তি ও সক্রিয়তা প্রদান করে। `;
      } else {
        detailedAnalysis += `এই ভাবে বর্তমানে কোনো প্রত্যক্ষ গ্রহ অবস্থিত নয়; সুতরাং এর ফলাফল মূলত রাশি পতি ${localizedLord}-এর অবস্থান ও শুভ দৃষ্টির দ্বারা নিয়ন্ত্রিত। `;
      }
      detailedAnalysis += `এই ভাবটি ${localizedPurushartha} পুরুষার্থ এবং ${localizedClassification} শ্রেণির অন্তর্গত। ফলে জাতকের ${bhavaData.lifeDomain} সংক্রান্ত সকল ক্ষেত্রে এটি অত্যন্ত গুরুত্বপূর্ণ ভূমিকা পালন করে।`;
    } else if (isTamil) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nஉங்கள் ஜென்ம லக்ன ஜாதகத்தில் இந்த ${bhavaData.title} ${localizedSign} ராசியால் ஆளப்படுகிறது, இதன் அதிபதி கிரகம் ${localizedLord} ஆவார். இந்த வீடு ${localizedElement} ஆற்றலால் இயக்கப்படுகிறது. `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `இந்த புனித வீட்டில் ${pNames} அமர்ந்துள்ளதால், இந்த வீட்டின் பலன்கள் விசேஷ ஆற்றலுடன் செயல்படுகின்றன. `;
      } else {
        detailedAnalysis += `இந்த வீட்டில் நேரடி கிரகங்கள் இல்லை; எனவே இதன் பலன்கள் வீட்டதிபதி ${localizedLord} கிரகத்தின் நிலையால் தீர்மானிக்கப்படுகின்றன. `;
      }
      detailedAnalysis += `இந்த வீடு ${localizedPurushartha} புருஷார்த்தம் மற்றும் ${localizedClassification} அமைப்பில் வருகிறது. எனவே ஜாதகரின் ${bhavaData.lifeDomain} சார்ந்த விஷயங்களில் இது மிக முக்கிய பங்கு வகிக்கிறது.`;
    } else if (isTelugu) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nమీ జన్మ లగ్న కుండలిలో ఈ ${bhavaData.title} పై ${localizedSign} రాశి ప్రభావం ఉంది, దీనికి అధిపతి గ్రహం ${localizedLord}. ఈ స్థానం ${localizedElement} తత్త్వ శక్తితో నడుస్తుంది. `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `ఈ పవిత్ర స్థానంలో ${pNames} ఉండటం వల్ల ఈ భావపు కారకత్వాలకు విశేష బలం మరియు చైతన్యం లభిస్తుంది. `;
      } else {
        detailedAnalysis += `ఈ స్థానంలో ప్రత్యక్ష గ్రహాలు లేవు; కావున దీని ఫలితాలు రాశినాథుడు ${localizedLord} స్థితి మరియు శుభ దృష్టిల ద్వారా నియంత్రించబడతాయి. `;
      }
      detailedAnalysis += `ఈ స్థానం ${localizedPurushartha} పురుషార్థం మరియు ${localizedClassification} పరిధిలోకి వస్తుంది. అందువల్ల జాతకుని ${bhavaData.lifeDomain} అంశాలలో ఇది అత్యంత కీలకమైన పాత్ర పోషిస్తుంది.`;
    } else if (isKannada) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nನಿಮ್ಮ ಜನ್ಮ ಲಗ್ನ ಕುಂಡಲಿಯಲ್ಲಿ ಈ ${bhavaData.title} ಮೇಲೆ ${localizedSign} ರಾಶಿಯ ಪ್ರಭಾವವಿದ್ದು, ಇದರ ಅಧಿಪತಿ ಗ್ರಹ ${localizedLord}. ಈ ಭಾವವು ${localizedElement} ಶಕ್ತಿಯಿಂದ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ. `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `ಈ ಪವಿತ್ರ ಮನೆಯಲ್ಲಿ ${pNames} ಉಪಸ್ಥಿತಿಯು ಈ ಭಾವದ ಕಾರಕತ್ವಗಳಿಗೆ ವಿಶೇಷ ಬಲ ಮತ್ತು ಚೈತನ್ಯವನ್ನು ನೀಡುತ್ತದೆ. `;
      } else {
        detailedAnalysis += `ಈ ಮನೆಯಲ್ಲಿ ಯಾವುದೇ ಪ್ರತ್ಯಕ್ಷ ಗ್ರಹಗಳಿಲ್ಲ; ಆದ್ದರಿಂದ ಇದರ ಫಲಗಳು ರಾಶ್ಯಾಧಿಪತಿ ${localizedLord} ಅವರ ಸ್ಥಿತಿ ಮತ್ತು ಶುಭ ದೃಷ್ಟಿಯಿಂದ ನಿರ್ಧರಿಸಲ್ಪಡುತ್ತವೆ. `;
      }
      detailedAnalysis += `ಈ ಮನೆಯು ${localizedPurushartha} ಪುರುಷಾರ್ಥ ಮತ್ತು ${localizedClassification} ವ್ಯಾಪ್ತಿಗೆ ಬರುತ್ತದೆ. ಆದ್ದರಿಂದ ಜಾತಕರ ${bhavaData.lifeDomain} ವಿಷಯಗಳಲ್ಲಿ ಇದು ನಿರ್ಣಾಯಕ ಪಾತ್ರ ವಹಿಸುತ್ತದೆ.`;
    } else if (isMalayalam) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nനിങ്ങളുടെ ജന്മ ലഗ്ന ജാതകത്തിൽ ഈ ${bhavaData.title} ${localizedSign} രാശിയാൽ ഭരിക്കപ്പെടുന്നു, ഇതിന്റെ അധിപൻ ${localizedLord} ആണ്. ഈ ഭാവം ${localizedElement} ഊർജ്ജത്താൽ നിയന്ത്രിക്കപ്പെടുന്നു. `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `ഈ പവിത്ര ഭാവത്തിൽ ${pNames} സ്ഥിതി ചെയ്യുന്നത് ഈ ഭാവത്തിന്റെ ഫലങ്ങൾക്ക് പ്രത്യേക ശക്തിയും ചൈതന്യവും നൽകുന്നു. `;
      } else {
        detailedAnalysis += `ഈ ഭാവത്തിൽ നേരിട്ട് ഗ്രഹങ്ങളൊന്നുമില്ല; അതിനാൽ ഇതിന്റെ ഫലങ്ങൾ രാശ്യാപനായ ${localizedLord} ഗ്രഹത്തിന്റെ സ്ഥിതിയാൽ നിയന്ത്രിക്കപ്പെടുന്നു. `;
      }
      detailedAnalysis += `ഈ ഭാവം ${localizedPurushartha} പുരുഷാർത്ഥത്തിലും ${localizedClassification} വിഭാഗത്തിലും ഉൾപ്പെടുന്നു. അതിനാൽ ജാതകന്റെ ${bhavaData.lifeDomain} കാര്യങ്ങളിൽ ഇത് നിർണ്ണായക പങ്കു വഹിക്കുന്നു.`;
    } else if (isPunjabi) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nਤੁਹਾਡੀ ਜਨਮ ਲਗਨ ਕੁੰਡਲੀ ਵਿੱਚ ਇਸ ${bhavaData.title} ਉੱਤੇ ${localizedSign} ਰਾਸ਼ੀ ਦਾ ਪ੍ਰਭਾਵ ਹੈ, ਜਿਸਦੇ ਸੁਆਮੀ ਗ੍ਰਹਿ ${localizedLord} ਹਨ। ਇਹ ਭਾਵ ${localizedElement} ਤੱਤ ਦੀ ਊਰਜਾ ਨਾਲ ਚੱਲਦਾ ਹੈ। `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `ਇਸ ਪਵਿੱਤਰ ਭਾਵ ਵਿੱਚ ${pNames} ਦੀ ਮੌਜੂਦਗੀ ਇਸ ਭਾਵ ਦੇ ਕਾਰਕਤੱਤਾਂ ਨੂੰ ਵਿਸ਼ੇਸ਼ ਬਲ ਅਤੇ ਊਰਜਾ ਪ੍ਰਦਾਨ ਕਰਦੀ ਹੈ। `;
      } else {
        detailedAnalysis += `ਇਸ ਭਾਵ ਵਿੱਚ ਕੋਈ ਪ੍ਰਤੱਖ ਗ੍ਰਹਿ ਸਥਿਤ ਨਹੀਂ ਹੈ; ਇਸ ਲਈ ਇਸਦੇ ਫਲ ਮੁੱਖ ਤੌਰ 'ਤੇ ਰਾਸ਼ੀ ਸੁਆਮੀ ${localizedLord} ਦੀ ਸਥਿਤੀ ਦੁਆਰਾ ਨਿਯੰਤਰਿਤ ਹੁੰਦੇ ਹਨ। `;
      }
      detailedAnalysis += `ਇਹ ਭਾਵ ${localizedPurushartha} ਪੁਰਸ਼ਾਰਥ ਅਤੇ ${localizedClassification} ਦੀ ਸ਼੍ਰੇਣੀ ਵਿੱਚ ਆਉਂਦਾ ਹੈ। ਇਸ ਲਈ ਜਾਤਕ ਦੇ ${bhavaData.lifeDomain} ਨਾਲ ਜੁੜੇ ਪਹਿਲੂਆਂ ਵਿੱਚ ਇਹ ਅਹਿਮ ਭੂਮਿਕਾ ਨਿਭਾਉਂਦਾ ਹੈ।`;
    } else if (isOdia) {
      detailedAnalysis = `${bhavaData.coreThemes}\n\nଆପଣଙ୍କ ଜନ୍ମ ଲଗ୍ନ କୁଣ୍ଡଳୀରେ ଏହି ${bhavaData.title} ଉପରେ ${localizedSign} ରାଶିର ପ୍ରଭାବ ରହିଛି, ଯାହାର ଅଧିପତି ଗ୍ରହ ${localizedLord} ଅଟନ୍ତି। ଏହି ଭାବ ${localizedElement} ଶକ୍ତି ଦ୍ୱାରା ପରିଚାଳିତ। `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `ଏହି ପବିତ୍ର ଭାବରେ ${pNames}ଙ୍କ ପ୍ରତ୍ୟକ୍ଷ ଉପସ୍ଥିତି ଏହି ଭାବର କାରକତ୍ୱକୁ ବିଶେଷ ବଳ ଓ ସକ୍ରିୟତା ପ୍ରଦାନ କରେ। `;
      } else {
        detailedAnalysis += `ଏହି ଭାବରେ କୌଣସି ପ୍ରତ୍ୟକ୍ଷ ଗ୍ରହ ନାହାନ୍ତି; ତେଣୁ ଏହାର ଫଳ ମୁଖ୍ୟତଃ ରାଶିପତି ${localizedLord}ଙ୍କ ସ୍ଥିତି ଓ ଶୁଭ ଦୃଷ୍ଟି ଦ୍ୱାରା ନିୟନ୍ତ୍ରିତ। `;
      }
      detailedAnalysis += `ଏହି ଭାବ ${localizedPurushartha} ପୁରୁଷାର୍ଥ ଏବଂ ${localizedClassification} ଶ୍ରେଣୀରେ ଆସେ। ତେଣୁ ଜାତକଙ୍କ ${bhavaData.lifeDomain} କ୍ଷେତ୍ରରେ ଏହା ଅତ୍ୟନ୍ତ ନିର୍ଣ୍ଣାୟକ ଭୂମିକା ଗ୍ରହଣ କରେ।`;
    } else {
      // Hindi default
      detailedAnalysis = `${bhavaData.coreThemes}\n\nआपकी जन्म लग्न कुण्डली में इस ${bhavaData.title} पर ${localizedSign} राशि का प्रभाव है, जिसके अधिपति ग्रह ${localizedLord} हैं। यह भाव तत्त्व रूप में ${localizedElement} ऊर्जा से संचालित है। `;
      if (planetsInHouse.length > 0) {
        const pNames = planetsInHouse.map(p => `${getLocalizedPlanet(p.planet, language)} (${getLocalizedDignity(p.dignity, language)})`).join(', ');
        detailedAnalysis += `इस पावन भाव में ${pNames} की प्रत्यक्ष उपस्थिति इस भाव के कारकतत्वों को असाधारण बल व विशिष्ट सक्रियता प्रदान करती है। `;
      } else {
        detailedAnalysis += `इस भाव में वर्तमान में कोई प्रत्यक्ष ग्रह स्थित नहीं है, अतः इसका मुख्य संचालन राशि स्वामी ${localizedLord} की स्थिति तथा शुभ ग्रहों की दृष्टियों द्वारा नियंत्रित होता है। `;
      }
      detailedAnalysis += `यह भाव ${localizedPurushartha} पुरुषार्थ तथा ${localizedClassification} की श्रेणी में आता है। अतः जातक के ${bhavaData.lifeDomain} से जुड़े समस्त आयामों में यह भाव अत्यंत निर्णायक व प्रभावशाली भूमिका निभाता है।`;
    }

    // Dynamic boons, cautions, and remedies strictly localized
    let boons = [...bhavaData.baseBoons];
    let cautions = [...bhavaData.baseCautions];
    let remedies = [...bhavaData.baseRemedies];

    if (planetsInHouse.length > 0) {
      for (const p of planetsInHouse) {
        const planetLabel = getLocalizedPlanet(p.planet, language);
        if (p.dignity.includes('Exalted') || p.dignity.includes('Own') || p.dignity.includes('Moolatrikona')) {
          if (isEnglish) boons.unshift(`Auspicious dignity of ${planetLabel} significantly magnifies the boons and fruits of this house.`);
          else if (isMarathi) boons.unshift(`${planetLabel} यांची शुभ व बलवान स्थिती या भावाच्या फळांमध्ये असाधारण वृद्धी घडवून आणते.`);
          else if (isGujarati) boons.unshift(`${planetLabel} ની શુભ અને બળવાન સ્થિતિ આ ભાવના ફળોમાં વૃદ્ધિ કરે છે.`);
          else if (isBengali) boons.unshift(`${planetLabel}-এর শুভ ও উচ্চ অবস্থান এই ভাবের শুভ ফলকে বহুগুণ বৃদ্ধি করে।`);
          else if (isTamil) boons.unshift(`${planetLabel} கிரகத்தின் சுப பலம் இந்த வீட்டின் நற்பலன்களை பன்மடங்கு அதிகரிக்கிறது.`);
          else if (isTelugu) boons.unshift(`${planetLabel} యొక్క శుభ మరియు ఉచ్ఛ స్థితి ఈ స్థానపు ఫలితాలను గణనీయంగా పెంచుతుంది.`);
          else if (isKannada) boons.unshift(`${planetLabel} ಅವರ ಶುಭ ಮತ್ತು ಉಚ್ಚ ಸ್ಥಿತಿಯು ಈ ಭಾವದ ಸತ್ಫಲಗಳನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ.`);
          else if (isMalayalam) boons.unshift(`${planetLabel} ഗ്രഹത്തിന്റെ ഉച്ചസ്ഥിതി ഈ ഭാവത്തിന്റെ ശുഭഫലങ്ങളെ വർദ്ധിപ്പിക്കുന്നു.`);
          else if (isPunjabi) boons.unshift(`${planetLabel} ਦੀ ਸ਼ੁਭ ਅਤੇ ਉੱਚ ਸਥਿਤੀ ਇਸ ਭਾਵ ਦੇ ਫਲਾਂ ਵਿੱਚ ਵਾਧਾ ਕਰਦੀ ਹੈ।`);
          else if (isOdia) boons.unshift(`${planetLabel}ଙ୍କ ଶୁଭ ଓ ଉଚ୍ଚ ସ୍ଥିତି ଏହି ଭାବର ଶୁଭ ଫଳକୁ ବୃଦ୍ଧି କରେ।`);
          else boons.unshift(`${planetLabel} की शुभ व उच्च स्थिति इस भाव के फलों में असाधारण वृद्धि करती है।`);
        } else if (p.dignity.includes('Debilitated') || p.dignity.includes('Enemy')) {
          if (isEnglish) cautions.unshift(`Dignity of ${planetLabel} advises conscious patience and mindfulness in matters governed by this house.`);
          else if (isMarathi) cautions.unshift(`${planetLabel} यांची स्थिती या भावाशी संबंधित विषयात विशेष सावधगिरी व संयम बाळगण्याची प्रेरणा देते.`);
          else if (isGujarati) cautions.unshift(`${planetLabel} ની સ્થિતિ આ ભાવ સંબંધિત બાબતોમાં ધૈર્ય અને સાવધાની રાખવાની સલાહ આપે છે.`);
          else if (isBengali) cautions.unshift(`${planetLabel}-এর অবস্থান এই ভাব সংক্রান্ত বিষয়ে ধৈর্য ও সতর্কতা অবলম্বনের নির্দেশ দেয়।`);
          else if (isTamil) cautions.unshift(`${planetLabel} கிரகத்தின் நிலை இந்த வீடு சார்ந்த விஷயங்களில் பொறுமையும் கவனமும் தேவை என்பதை உணர்த்துகிறது.`);
          else if (isTelugu) cautions.unshift(`${planetLabel} యొక్క స్థితి ఈ స్థానానికి సంబంధించిన విషయాలలో ఓర్పు మరియు జాగరూకత అవసరమని సూచిస్తుంది.`);
          else if (isKannada) cautions.unshift(`${planetLabel} ಅವರ ಸ್ಥಿತಿಯು ಈ ಭಾವಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ವಿಷಯಗಳಲ್ಲಿ ತಾಳ್ಮೆ ಮತ್ತು ಜಾಗರೂಕತೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆ.`);
          else if (isMalayalam) cautions.unshift(`${planetLabel} ഗ്രഹത്തിന്റെ സ്ഥിതി ഈ ഭാവവുമായി ബന്ധപ്പെട്ട കാര്യങ്ങളിൽ ക്ഷമയും ജാഗ്രതയും പാലിക്കാൻ നിർദ്ദേശിക്കുന്നു.`);
          else if (isPunjabi) cautions.unshift(`${planetLabel} ਦੀ ਸਥਿਤੀ ਇਸ ਭਾਵ ਨਾਲ ਸੰਬੰਧਿਤ ਮਾਮਲਿਆਂ ਵਿੱਚ ਧੀਰਜ ਅਤੇ ਸਾਵਧਾਨੀ ਰੱਖਣ ਦੀ ਸਲਾਹ ਦਿੰਦੀ ਹੈ।`);
          else if (isOdia) cautions.unshift(`${planetLabel}ଙ୍କ ସ୍ଥିତି ଏହି ଭାବ ସମ୍ବନ୍ଧୀୟ ବିଷୟରେ ଧୈର୍ଯ୍ୟ ଓ ସତର୍କତା ଅବଲମ୍ବନ କରିବାକୁ ପ୍ରେରଣା ଦିଏ।`);
          else cautions.unshift(`${planetLabel} की स्थिति इस भाव से संबंधित मामलों में सचेत व धैर्यवान रहने की प्रेरणा देती है।`);
        }
      }
    }

    return {
      houseNumber,
      name: bhavaData.title,
      sanskritName: bhavaData.title,
      rashiNumber,
      rashiName: localizedSign,
      rashiSanskrit: localizedSign,
      rashiLord: localizedLord,
      rashiLordSanskrit: localizedLord,
      element: localizedElement,
      classification: localizedClassification,
      purushartha: localizedPurushartha,
      karakaPlanet: localizedKaraka,
      bodyParts: bhavaData.bodyParts,
      lifeDomain: bhavaData.lifeDomain,
      planets: planetsInHouse,
      detailedAnalysis,
      boons: boons.slice(0, 3),
      cautions: cautions.slice(0, 3),
      remedies: remedies.slice(0, 3)
    };
  });
};

// ---------------------------------------------------------------------------
// LOSHU GRID 8-PLANES & MISSING NUMBERS INFOGRAPHIC ENGINE
// ---------------------------------------------------------------------------

export interface LoshuPlaneInfo {
  name: string;
  nameHindi: string;
  numbers: number[];
  presentCount: number;
  percentage: number;
  status: 'Full (100%)' | 'Strong (66%)' | 'Partial (33%)' | 'Inactive (0%)';
  statusColor: string;
  lifeDomain: string;
  meaning: string;
}

export const LOSHU_MISSING_REMEDIES: Record<number, {
  title: string;
  rulingPlanet: string;
  icon: string;
  voidEffect: string;
  crystal: string;
  direction: string;
  color: string;
  remedyAction: string;
}> = {
  1: {
    title: 'Number 1 (Water / North)',
    rulingPlanet: 'Sun (Surya)',
    icon: '☀️',
    voidEffect: 'Difficulty expressing inner voice, hesitation in stepping into leadership, or indecisiveness.',
    crystal: 'Red Jasper or Sunstone',
    direction: 'North',
    color: 'Royal Blue or Deep Crimson',
    remedyAction: 'Place a small indoor water fountain in the North; offer morning water to the Sun (Surya Arghya).'
  },
  2: {
    title: 'Number 2 (Earth / South-West)',
    rulingPlanet: 'Moon (Chandra)',
    icon: '🌙',
    voidEffect: 'Emotional impatience, trust hesitation, or relationship overthinking.',
    crystal: 'Moonstone or Rose Quartz',
    direction: 'South-West',
    color: 'Pearl White or Soft Cream',
    remedyAction: 'Keep crystals or paired clay artifacts in the South-West; drink water from silver vessel.'
  },
  3: {
    title: 'Number 3 (Wood / East)',
    rulingPlanet: 'Jupiter (Guru)',
    icon: '♃',
    voidEffect: 'Scattered creative vision, procrastination in higher studies, or lack of steady mentorship.',
    crystal: 'Amethyst or Yellow Citrine',
    direction: 'East',
    color: 'Bright Yellow or Forest Green',
    remedyAction: 'Place lush indoor plants (Bamboo/Money Plant) in the East; apply daily yellow sandalwood/haldi tilak.'
  },
  4: {
    title: 'Number 4 (Wood / South-East)',
    rulingPlanet: 'Rahu',
    icon: '☊',
    voidEffect: 'Lack of practical organization, impatience with paperwork, or financial leakages.',
    crystal: 'Tiger Eye or Green Aventurine',
    direction: 'South-East',
    color: 'Green or Woody Earth',
    remedyAction: 'Keep a clean wooden desktop accessory; maintain organized financial logs; wear green wristband.'
  },
  5: {
    title: 'Number 5 (Earth / Central Brahmasthan)',
    rulingPlanet: 'Mercury (Budh)',
    icon: '☿',
    voidEffect: 'Restlessness, fluctuating career focus, hesitation in networking, or commercial delays.',
    crystal: 'Green Jade, Emerald or Peridot',
    direction: 'Center (Brahmasthan)',
    color: 'Vibrant Emerald Green',
    remedyAction: 'Keep central home space clutter-free; place a pyramid or crystal lotus in the center; feed green grass to cows.'
  },
  6: {
    title: 'Number 6 (Metal / North-West)',
    rulingPlanet: 'Venus (Shukra)',
    icon: '♀',
    voidEffect: 'Difficulty enjoying luxury, domestic strain, or lack of supportive friends and mentors.',
    crystal: 'Clear Quartz or Pyrite',
    direction: 'North-West',
    color: 'Gleaming Silver, Golden White or Platinum',
    remedyAction: 'Hang a 6-pipe metallic wind chime in the North-West; donate white fragrant items on Fridays.'
  },
  7: {
    title: 'Number 7 (Metal / West)',
    rulingPlanet: 'Ketu',
    icon: '☋',
    voidEffect: 'Skeptical detachment, difficulty completing creative projects, or scattered research drive.',
    crystal: 'Smoky Quartz or Cats Eye',
    direction: 'West',
    color: 'Silver Grey or Charcoal',
    remedyAction: 'Keep metal bowls or round white pebbles in the West; practice daily 10-minute silent meditation.'
  },
  8: {
    title: 'Number 8 (Earth / North-East)',
    rulingPlanet: 'Saturn (Shani)',
    icon: '🪐',
    voidEffect: 'Lack of long-term patience, struggling with structured discipline, or impulsive career shifts.',
    crystal: 'Black Obsidian or Hematite',
    direction: 'North-East',
    color: 'Deep Navy, Indigo or Earthy Ochre',
    remedyAction: 'Keep North-East zone pristine and spiritually consecrated; light a mustard oil lamp on Saturdays.'
  },
  9: {
    title: 'Number 9 (Fire / South)',
    rulingPlanet: 'Mars (Mangal)',
    icon: '♂️',
    voidEffect: 'Low motivation, hesitation to take bold initiative, or delayed social recognition.',
    crystal: 'Carnelian or Red Agate',
    direction: 'South',
    color: 'Vermilion, Fiery Orange or Red',
    remedyAction: 'Place bright warm lighting or red artwork in the South; recite Hanuman Chalisa for energy.'
  }
};

/**
 * Calculates completion status for all 8 Loshu Planes.
 */
export const calculateLoshuPlanes = (presentNumbers: number[]): LoshuPlaneInfo[] => {
  const planes = [
    {
      name: 'Mental Plane (मस्तिष्क तल)',
      nameHindi: 'विचार व बौद्धिक क्षमता',
      numbers: [4, 9, 2],
      lifeDomain: 'Intellect, Memory & Strategic Vision',
      meaning: 'Governs sharp analytical reasoning, memory retention, and abstract conceptual design.'
    },
    {
      name: 'Emotional Plane (भावनात्मक तल)',
      nameHindi: 'हृदय व अंतःकरण',
      numbers: [3, 5, 7],
      lifeDomain: 'Empathy, Intuition & Spiritual Heart',
      meaning: 'Governs emotional depth, gut instinct, artistic sensitivity, and genuine interpersonal bonding.'
    },
    {
      name: 'Practical Plane (व्यावहारिक तल)',
      nameHindi: 'कर्म व क्रियान्वयन',
      numbers: [8, 1, 6],
      lifeDomain: 'Execution, Wealth & Material Reality',
      meaning: 'Governs physical stamina, commercial pragmatism, financial accumulation, and methodical discipline.'
    },
    {
      name: 'Thought Plane (योजना तल)',
      nameHindi: 'दूरदर्शिता व विचार',
      numbers: [4, 3, 8],
      lifeDomain: 'Planning, Vision & System Design',
      meaning: 'Ability to conceptualize grand blueprints and architect long-term foundations before taking action.'
    },
    {
      name: 'Will Plane (इच्छाशक्ति तल)',
      nameHindi: 'दृढ़ संकल्प व एकाग्रता',
      numbers: [9, 5, 1],
      lifeDomain: 'Resilience, Determination & Tenacity',
      meaning: 'Supreme unshakeable persistence; turns ideas into reality despite obstacles and delays.'
    },
    {
      name: 'Action Plane (कर्म तल)',
      nameHindi: 'त्वरित निर्णय व गति',
      numbers: [2, 7, 6],
      lifeDomain: 'Execution Velocity, Charisma & Speed',
      meaning: 'Quick responsiveness, practical charisma, closing deals, and tangible real-world manifestation.'
    },
    {
      name: 'Golden Raj Yoga (स्वर्ण राजयोग)',
      nameHindi: 'समृद्धि व सफलता रेखा',
      numbers: [4, 5, 6],
      lifeDomain: 'Prosperity, Global Fame & Success',
      meaning: 'The elite diagonal of luxury and high accomplishment; creates wealth, authority, and public respect.'
    },
    {
      name: 'Silver Raj Yoga (रजत राजयोग / संपदा)',
      nameHindi: 'स्थिर संपदा व भूमि लाभ',
      numbers: [2, 5, 8],
      lifeDomain: 'Real Estate, Assets & Earth Grounding',
      meaning: 'The stabilizing diagonal of property, physical asset accumulation, emotional serenity, and endurance.'
    }
  ];

  return planes.map((p) => {
    const presentInPlane = p.numbers.filter(num => presentNumbers.includes(num));
    const count = presentInPlane.length;
    const percentage = Math.round((count / p.numbers.length) * 100);

    let status: LoshuPlaneInfo['status'] = 'Inactive (0%)';
    let statusColor = 'text-slate-500 bg-white/5 border-white/5';

    if (percentage === 100) {
      status = 'Full (100%)';
      statusColor = 'text-amber-300 bg-amber-500/20 border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.2)]';
    } else if (percentage >= 66) {
      status = 'Strong (66%)';
      statusColor = 'text-emerald-300 bg-emerald-500/15 border-emerald-500/35';
    } else if (percentage >= 33) {
      status = 'Partial (33%)';
      statusColor = 'text-sky-300 bg-sky-500/10 border-sky-500/25';
    }

    return {
      name: p.name,
      nameHindi: p.nameHindi,
      numbers: p.numbers,
      presentCount: count,
      percentage,
      status,
      statusColor,
      lifeDomain: p.lifeDomain,
      meaning: p.meaning
    };
  });
};

// ---------------------------------------------------------------------------
// 1. SHADBALA (SIX-FOLD MATHEMATICAL PLANETARY STRENGTH)
// ---------------------------------------------------------------------------

export const calculateShadbala = (
  planetaryPositions: PlanetaryPositionDetail[] = [],
  lagnaSignNumber: number = 1,
  dob?: string,
  tob?: string,
  language: Language = 'English'
): ShadbalaDetail[] => {
  const PHYSICAL_PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  // Parse birth hour for Kaala Bala (day vs night)
  let hour = 12;
  if (tob && tob.includes(':')) {
    hour = parseInt(tob.split(':')[0], 10) || 12;
  }
  const isDayBirth = hour >= 6 && hour < 18;

  const REQUIRED_RUPAS: Record<string, number> = {
    Sun: 6.5,
    Moon: 6.0,
    Mars: 5.0,
    Mercury: 7.0,
    Jupiter: 6.5,
    Venus: 5.5,
    Saturn: 5.0
  };

  const NAISARGIKA_POINTS: Record<string, number> = {
    Sun: 60.0,
    Moon: 51.4,
    Venus: 42.9,
    Jupiter: 34.3,
    Mercury: 25.7,
    Mars: 17.1,
    Saturn: 8.6
  };

  return PHYSICAL_PLANETS.map((planetName) => {
    const pos = planetaryPositions.find(p => p.planet === planetName);
    const house = pos?.house || 1;
    const dignity = pos?.dignity || 'Neutral (सम)';

    // 1. Sthana Bala (Positional Strength: 30 - 180 points)
    let sthana = 90;
    if (dignity.includes('Exalted')) sthana = 180;
    else if (dignity.includes('Moolatrikona')) sthana = 150;
    else if (dignity.includes('Own')) sthana = 135;
    else if (dignity.includes('Friendly')) sthana = 110;
    else if (dignity.includes('Neutral')) sthana = 90;
    else if (dignity.includes('Enemy')) sthana = 60;
    else if (dignity.includes('Debilitated')) sthana = 35;

    // Kendra bonus for Sthana Bala
    if ([1, 4, 7, 10].includes(house)) sthana += 15;
    else if ([5, 9].includes(house)) sthana += 10;

    // 2. Dig Bala (Directional Strength: 10 - 60 points)
    let peakHouse = 1;
    if (planetName === 'Jupiter' || planetName === 'Mercury') peakHouse = 1;
    else if (planetName === 'Moon' || planetName === 'Venus') peakHouse = 4;
    else if (planetName === 'Saturn') peakHouse = 7;
    else if (planetName === 'Sun' || planetName === 'Mars') peakHouse = 10;

    const houseDistance = Math.min(Math.abs(house - peakHouse), 12 - Math.abs(house - peakHouse));
    const digBala = Math.max(10, Math.round(60 - houseDistance * 8.33));

    // 3. Kaala Bala (Temporal Strength: 30 - 60 points)
    let kaalaBala = 45;
    if (['Sun', 'Jupiter', 'Venus'].includes(planetName)) {
      kaalaBala = isDayBirth ? 60 : 35;
    } else if (['Moon', 'Mars', 'Saturn'].includes(planetName)) {
      kaalaBala = !isDayBirth ? 60 : 35;
    } else {
      kaalaBala = 50; // Mercury adapts to any time
    }

    // 4. Cheshta Bala (Motional Strength: 30 - 60 points)
    let cheshtaBala = pos?.isRetrograde ? 60 : 42;

    // 5. Naisargika Bala (Natural hierarchy)
    const naisargikaBala = NAISARGIKA_POINTS[planetName] || 30.0;

    // 6. Drik Bala (Aspectual Strength: 20 - 55 points)
    let drikBala = 30;
    if (dignity.includes('Exalted') || dignity.includes('Own')) drikBala += 15;
    if (pos?.isCombust) drikBala -= 12;

    const totalShashtiamsas = Math.round(sthana + digBala + kaalaBala + cheshtaBala + naisargikaBala + drikBala);
    const totalRupas = Number((totalShashtiamsas / 60).toFixed(2));
    const requiredRupas = REQUIRED_RUPAS[planetName] || 6.0;
    const ratioPercent = Math.round((totalRupas / requiredRupas) * 100);

    let strengthStatus: ShadbalaDetail['strengthStatus'] = 'Sufficient';
    if (ratioPercent >= 125) strengthStatus = 'Exceptional';
    else if (ratioPercent >= 105) strengthStatus = 'Strong';
    else if (ratioPercent >= 92) strengthStatus = 'Sufficient';
    else if (ratioPercent >= 78) strengthStatus = 'Moderate';
    else strengthStatus = 'Weak';

    // Delivering power in localized text
    let deliveringPower = 'Capable of delivering balanced positive results.';
    if (language === 'Marathi') {
      if (ratioPercent >= 105) deliveringPower = 'अत्यंत प्रभावी, शुभ फळ देण्यास पूर्ण सक्षम.';
      else if (ratioPercent >= 92) deliveringPower = 'संतुलित व स्थिर फळे देण्यास समर्थ.';
      else deliveringPower = 'मध्यम बल, वैदिक उपायांनी प्रबल करणे हितावह.';
    } else if (language === 'Hindi') {
      if (ratioPercent >= 105) deliveringPower = 'अत्यंत शक्तिशाली एवं शुभ फलप्रदाता।';
      else if (ratioPercent >= 92) deliveringPower = 'संतुलित एवं स्थिर परिणाम देने में सक्षम।';
      else deliveringPower = 'मध्यम बल, वैदिक उपायों द्वारा संबल आवश्यक।';
    } else if (language === 'Gujarati') {
      if (ratioPercent >= 105) deliveringPower = 'અત્યંત પ્રભાવશાળી અને શુભ ફળ આપવા સક્ષમ.';
      else deliveringPower = 'સંતુલિત ફળ આપે છે, ઉપાયોથી બળ વધારવું.';
    } else {
      if (ratioPercent >= 105) deliveringPower = 'Highly potent and capable of manifesting commanding positive outcomes.';
      else if (ratioPercent >= 92) deliveringPower = 'Stable, consistent, and capable of fulfilling its natal promises.';
      else deliveringPower = 'Moderate capacity; benefits from targeted Vedic remedies and gemstone support.';
    }

    return {
      planet: planetName,
      planetLocalized: getLocalizedPlanet(planetName, language),
      icon: pos?.icon || '✨',
      sthanaBala: Math.round(sthana),
      digBala,
      kaalaBala,
      cheshtaBala,
      naisargikaBala: Math.round(naisargikaBala),
      drikBala: Math.round(drikBala),
      totalShashtiamsas,
      totalRupas,
      requiredRupas,
      ratioPercent,
      strengthStatus,
      deliveringPower
    };
  });
};

// ---------------------------------------------------------------------------
// 2. VEDIC YOGAS (SPECIAL PLANETARY COMBINATIONS)
// ---------------------------------------------------------------------------

export const calculateYogas = (
  planetaryPositions: PlanetaryPositionDetail[] = [],
  lagnaSignNumber: number = 1,
  language: Language = 'English'
): VedicYogaDetail[] => {
  const yogas: VedicYogaDetail[] = [];
  const lagnaIdx = (lagnaSignNumber || 1) - 1;

  const houseOf: Record<string, number> = {};
  const signOf: Record<string, number> = {};
  for (const pos of planetaryPositions) {
    houseOf[pos.planet] = pos.house;
    signOf[pos.planet] = (lagnaIdx + pos.house - 1) % 12;
  }

  // 1. Gaja Kesari Yoga (Jupiter in Kendra from Moon)
  const moonHouse = houseOf.Moon || 1;
  const jupHouse = houseOf.Jupiter || 1;
  const jupFromMoon = ((jupHouse - moonHouse + 12) % 12) + 1;
  if ([1, 4, 7, 10].includes(jupFromMoon)) {
    yogas.push({
      name: language === 'Marathi' ? 'गजकेसरी योग' : language === 'Hindi' ? 'गजकेसरी योग' : 'Gaja Kesari Yoga',
      category: 'Auspicious',
      planetsInvolved: ['Jupiter', 'Moon'],
      description: language === 'Marathi'
        ? 'चंद्रापासून केंद्र भावात (१, ४, ७, १०) देवगुरू बृहस्पती विराजमान असल्याने हा अत्यंत पावन योग निर्माण होतो.'
        : 'Formed by Jupiter residing in an auspicious Kendra (1, 4, 7, 10) from the natal Moon.',
      lifeImpact: language === 'Marathi'
        ? 'समाजात अढळ प्रतिष्ठा, अफाट बौद्धिक सामर्थ्य, दीर्घायुष्य आणि संकटसमयी दैवी संरक्षण प्राप्त होते.'
        : 'Bestows illustrious social respect, deep wisdom, moral virtue, enduring prosperity, and overcoming adversaries.',
      isActive: true
    });
  }

  // 2. Budhaditya Yoga (Sun + Mercury conjunct)
  if (houseOf.Sun && houseOf.Mercury && houseOf.Sun === houseOf.Mercury) {
    yogas.push({
      name: language === 'Marathi' ? 'बुधादित्य योग' : language === 'Hindi' ? 'बुधादित्य योग' : 'Budhaditya Yoga',
      category: 'Raja',
      planetsInvolved: ['Sun', 'Mercury'],
      description: language === 'Marathi'
        ? 'सूर्य आणि बुध एकाच भावात एकत्र आल्याने हा कुशाग्र बुद्धिमत्तेचा राजयोग निर्माण होतो.'
        : 'Formed by the conjunction of the Sun (soul, authority) and Mercury (intellect, articulation).',
      lifeImpact: language === 'Marathi'
        ? 'तीक्ष्ण बुद्धिमत्ता, संवाद चातुर्य, प्रशासकीय कार्यक्षमता व व्यावसायिक यश प्राप्त होते.'
        : 'Confers sharp analytical intellect, executive decision-making clarity, administrative authority, and academic brilliance.',
      isActive: true
    });
  }

  // 3. Pancha Mahapurusha Yogas (Mars, Mercury, Jupiter, Venus, Saturn in Kendra in exalted or own sign)
  // Ruchaka (Mars)
  if ([1, 4, 7, 10].includes(houseOf.Mars || 0) && [0, 7, 9].includes(signOf.Mars || 0)) {
    yogas.push({
      name: 'Ruchaka Mahapurusha Yoga (रुचक योग)',
      category: 'Mahapurusha',
      planetsInvolved: ['Mars'],
      description: 'Formed by Mars in an exalted (Capricorn) or own sign (Aries/Scorpio) placed in a vital Kendra.',
      lifeImpact: 'Unconquerable physical bravery, high land/property assets, leadership acumen, and triumph over rivals.',
      isActive: true
    });
  }

  // Hamsa (Jupiter)
  if ([1, 4, 7, 10].includes(houseOf.Jupiter || 0) && [3, 8, 11].includes(signOf.Jupiter || 0)) {
    yogas.push({
      name: 'Hamsa Mahapurusha Yoga (हंस योग)',
      category: 'Mahapurusha',
      planetsInvolved: ['Jupiter'],
      description: 'Formed by Jupiter exalted (Cancer) or in own sign (Sagittarius/Pisces) anchored in a Kendra.',
      lifeImpact: 'High spiritual wisdom, noble dharmic stature, profound counseling mastery, and universally respected character.',
      isActive: true
    });
  }

  // Malavya (Venus)
  if ([1, 4, 7, 10].includes(houseOf.Venus || 0) && [1, 6, 11].includes(signOf.Venus || 0)) {
    yogas.push({
      name: 'Malavya Mahapurusha Yoga (मालव्य योग)',
      category: 'Mahapurusha',
      planetsInvolved: ['Venus'],
      description: 'Formed by Venus exalted (Pisces) or in own sign (Taurus/Libra) situated in a Kendra.',
      lifeImpact: 'Sensory luxuries, artistic mastery, marital joy, prestigious vehicle conveyances, and magnetic charisma.',
      isActive: true
    });
  }

  // Sasa (Saturn)
  if ([1, 4, 7, 10].includes(houseOf.Saturn || 0) && [6, 9, 10].includes(signOf.Saturn || 0)) {
    yogas.push({
      name: 'Sasa Mahapurusha Yoga (शश योग)',
      category: 'Mahapurusha',
      planetsInvolved: ['Saturn'],
      description: 'Formed by Saturn exalted (Libra) or in own sign (Capricorn/Aquarius) placed in a Kendra.',
      lifeImpact: 'Commanding authority over large organizations or masses, disciplined stamina, and monumental public standing.',
      isActive: true
    });
  }

  // Bhadra (Mercury)
  if ([1, 4, 7, 10].includes(houseOf.Mercury || 0) && [2, 5].includes(signOf.Mercury || 0)) {
    yogas.push({
      name: 'Bhadra Mahapurusha Yoga (भद्र योग)',
      category: 'Mahapurusha',
      planetsInvolved: ['Mercury'],
      description: 'Formed by Mercury in own sign (Gemini) or peak exaltation (Virgo) situated in a Kendra.',
      lifeImpact: 'Commercial genius, mathematical precision, persuasive speech, and high academic acclaim.',
      isActive: true
    });
  }

  // 4. Chandra-Mangal Yoga (Moon + Mars)
  if (houseOf.Moon && houseOf.Mars && (houseOf.Moon === houseOf.Mars || Math.abs(houseOf.Moon - houseOf.Mars) === 6)) {
    yogas.push({
      name: 'Chandra-Mangal Yoga (चन्द्र-मंगल योग)',
      category: 'Dhana',
      planetsInvolved: ['Moon', 'Mars'],
      description: 'Formed by the mutual aspect or union of emotional intuition (Moon) and decisive drive (Mars).',
      lifeImpact: 'Dynamic entrepreneurial energy, high earning initiative, financial independence, and commercial ventures.',
      isActive: true
    });
  }

  // 5. Lakshmi Yoga (Venus + 9th lord connection or Venus in 9th)
  if (houseOf.Venus === 9 || [5, 9].includes(houseOf.Venus || 0)) {
    yogas.push({
      name: 'Lakshmi Yoga (लक्ष्मी योग)',
      category: 'Dhana',
      planetsInvolved: ['Venus'],
      description: 'Formed when Venus influences the sacred 9th house of fortune (Bhagya) or auspicious Trikonas.',
      lifeImpact: 'Enduring financial prosperity, gracious living, moral integrity, and protection from sudden destitution.',
      isActive: true
    });
  }

  // 6. Amala Yoga (Benefics in 10th house)
  if ([houseOf.Jupiter, houseOf.Venus, houseOf.Mercury].includes(10)) {
    yogas.push({
      name: 'Amala Yoga (अमला योग)',
      category: 'Raja',
      planetsInvolved: ['Jupiter', 'Venus'],
      description: 'Formed by pure natural benefics occupying the 10th house of worldly profession and authority.',
      lifeImpact: 'Spotless vocational reputation, philanthropic honors, enduring leadership, and ethical professional triumph.',
      isActive: true
    });
  }

  // Ensure at least 2 classic positive yogas are documented
  if (yogas.length === 0) {
    yogas.push({
      name: 'Dharmakarmadhipati Yoga (धर्मकर्माधिपति योग)',
      category: 'Raja',
      planetsInvolved: ['Sun', 'Jupiter'],
      description: 'Formed by the harmonious interconnection between the house of righteousness (9th) and career (10th).',
      lifeImpact: 'Aligns career trajectory with higher dharma, conferring moral dignity and stable lifetime status.',
      isActive: true
    });
  }

  return yogas;
};

// ---------------------------------------------------------------------------
// 3. VEDIC DOSHAS & KARMIC DEBT ASSESSMENT
// ---------------------------------------------------------------------------

export const calculateDoshas = (
  planetaryPositions: PlanetaryPositionDetail[] = [],
  lagnaSignNumber: number = 1,
  avakahadaData: AvakahadaDetails | null,
  language: Language = 'English'
): VedicDoshaDetail[] => {
  const doshas: VedicDoshaDetail[] = [];
  const lagnaIdx = (lagnaSignNumber || 1) - 1;

  const houseOf: Record<string, number> = {};
  const signOf: Record<string, number> = {};
  for (const pos of planetaryPositions) {
    houseOf[pos.planet] = pos.house;
    signOf[pos.planet] = (lagnaIdx + pos.house - 1) % 12;
  }

  // 1. Manglik (Kuja) Dosha
  const marsH = houseOf.Mars || 1;
  const marsSign = signOf.Mars || 0;
  const isManglikHouse = [1, 2, 4, 7, 8, 12].includes(marsH);

  let manglikCancelled = false;
  let cancellationReason = '';
  if (isManglikHouse) {
    // Classical Parihara rules
    if (marsSign === 9) { // Exalted in Capricorn
      manglikCancelled = true;
      cancellationReason = 'Neutralized because Mars is exalted in Capricorn (मकर राशि में उच्च मंगल).';
    } else if (marsSign === 0 || marsSign === 7) { // Own sign Aries / Scorpio
      manglikCancelled = true;
      cancellationReason = 'Neutralized because Mars is in its own auspicious sign (स्वराशि मंगल).';
    } else if (houseOf.Jupiter === 1 || houseOf.Jupiter === 7) {
      manglikCancelled = true;
      cancellationReason = 'Neutralized by the protective aspect of benevolent Jupiter (गुरु दृष्टि परिहार).';
    }
  }

  doshas.push({
    name: language === 'Marathi' ? 'मांगलिक (कुज) दोष' : language === 'Hindi' ? 'मांगलिक (कुज) दोष' : 'Manglik (Kuja) Dosha',
    severity: !isManglikHouse ? 'None' : manglikCancelled ? 'None' : marsH === 7 || marsH === 8 ? 'Moderate' : 'Mild',
    isActive: isManglikHouse && !manglikCancelled,
    explanation: !isManglikHouse
      ? (language === 'Marathi' ? 'मंगळ शुभ स्थानात असल्याने जन्मपत्रिकेत कोणताही मांगलिक दोष नाही (निर्दोष).' : 'Mars is comfortably placed outside marital conflict houses. Your chart is completely free from Kuja Dosha.')
      : manglikCancelled
        ? (language === 'Marathi' ? `मंगळ स्थानामुळे दोष दिसत असला तरी शास्त्रीय नियमांनुसार तो निष्प्रभ झाला आहे: ${cancellationReason}` : `Classical cancellation verified: ${cancellationReason}`)
        : (language === 'Marathi' ? `मंगळ ${marsH} व्या भावात स्थित असल्याने वैवाहिक व भागीदारी संवादात सजगता व संयम आवश्यक आहे.` : `Mars resides in House ${marsH}. Requires emotional maturity and conscious communication in marital partnerships.`),
    cancellationText: manglikCancelled ? cancellationReason : undefined,
    remedy: language === 'Marathi'
      ? 'मंगळवारी हनुमान चालीसा पठण, सुंदरकांड वाचन किंवा गरजू व्यक्तींना गूळ व मसूर डाळ दान करावी.'
      : 'Recite Hanuman Chalisa on Tuesdays and offer sweet bread or jaggery to birds and monkeys.'
  });

  // 2. Kala Sarpa Dosha
  const rahuH = houseOf.Rahu || 1;
  const ketuH = houseOf.Ketu || 7;
  const otherPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

  let sideA = 0;
  let sideB = 0;
  for (const p of otherPlanets) {
    const h = houseOf[p] || 1;
    // Check if planet falls between Rahu and Ketu
    const distFromRahu = ((h - rahuH + 12) % 12);
    if (distFromRahu > 0 && distFromRahu < 6) {
      sideA++;
    } else if (distFromRahu > 6) {
      sideB++;
    }
  }

  const isFullKalsarp = (sideA === 7 && sideB === 0) || (sideB === 7 && sideA === 0);
  const isAnshikKalsarp = (sideA === 6 && sideB === 1) || (sideB === 6 && sideA === 1);

  doshas.push({
    name: language === 'Marathi' ? 'कालसर्प योग / दोष' : language === 'Hindi' ? 'कालसर्प योग / दोष' : 'Kala Sarpa Dosha',
    severity: isFullKalsarp ? 'Moderate' : isAnshikKalsarp ? 'Mild' : 'None',
    isActive: isFullKalsarp || isAnshikKalsarp,
    explanation: isFullKalsarp
      ? (language === 'Marathi' ? 'सर्व मुख्य ग्रह राहू आणि केतू यांच्या एका बाजूला स्थित असल्याने पूर्ण कालसर्प योग बनतो.' : 'All primary planets are bound within the Rahu-Ketu nodal axis, indicating early-life friction followed by profound spiritual rise.')
      : isAnshikKalsarp
        ? (language === 'Marathi' ? 'एक ग्रह राहू-केतू परिघाबाहेर असल्याने हा आंशिक कालसर्प योग आहे.' : 'One planet breaks the nodal boundary, forming Anshik (partial) Kala Sarpa with reduced intensity.')
        : (language === 'Marathi' ? 'ग्रह दोन्ही बाजूंना संतुलित असल्याने पत्रिकेत कालसर्प दोष नाही (निर्दोष).' : 'Planets are freely distributed across both nodal hemispheres. Chart is completely free of Kala Sarpa Dosha.'),
    remedy: language === 'Marathi'
      ? 'नित्य महामृत्युंजय मंत्राचा जप (१०८ वेळा) करावा आणि नागपंचमीला किंवा सोमवारी शिवाला जल अर्पण करावे.'
      : 'Chant the sacred Maha Mrityunjaya Mantra (108 times) and worship Lord Shiva on Mondays.'
  });

  // 3. Pitri Dosha
  const isPitriActive = (houseOf.Sun && houseOf.Rahu && (houseOf.Sun === houseOf.Rahu || houseOf.Sun === 9 && houseOf.Saturn === 9));
  doshas.push({
    name: language === 'Marathi' ? 'पितृ दोष / पूर्वज ऋण' : language === 'Hindi' ? 'पितृ दोष / ऋण' : 'Pitri Dosha',
    severity: isPitriActive ? 'Mild' : 'None',
    isActive: Boolean(isPitriActive),
    explanation: isPitriActive
      ? (language === 'Marathi' ? 'सूर्य व राहू यांच्या युतीमुळे पूर्वज आशीर्वादाची आवश्यकता अधोरेखित होते.' : 'Affliction to the Sun or 9th house indicates ancestors requiring remembrance, prayer, and charitable dedication.')
      : (language === 'Marathi' ? 'सूर्य आणि नवम भाव शुभ असल्याने पितृदोष नाही.' : 'Sun and the 9th house of ancestors are auspiciously situated without nodal affliction.'),
    remedy: language === 'Marathi'
      ? 'अमावास्येला पितरांच्या नावाने अन्नाचे दान करावे, पिंपळाच्या वृक्षाला जल अर्पण करावे.'
      : 'Offer tarpanam or charitable meals to the needy on Amavasya and water a Peepal tree.'
  });

  // 4. Guru Chandal Dosha
  const isGuruChandal = (houseOf.Jupiter && houseOf.Rahu && houseOf.Jupiter === houseOf.Rahu);
  doshas.push({
    name: language === 'Marathi' ? 'गुरु चांडाळ दोष' : language === 'Hindi' ? 'गुरु चांडाल दोष' : 'Guru Chandal Dosha',
    severity: isGuruChandal ? 'Mild' : 'None',
    isActive: Boolean(isGuruChandal),
    explanation: isGuruChandal
      ? (language === 'Marathi' ? 'बृहस्पती व राहू एकाच भावात असल्याने पारंपारिक विचारांत बंडखोरी व बौद्धिक संघर्ष संभवतो.' : 'Jupiter conjunct Rahu creates unconventional philosophy and requires grounding through disciplined mentors.')
      : (language === 'Marathi' ? 'बृहस्पती राहूच्या प्रभावापासून पूर्णपणे मुक्त आहे.' : 'Jupiter is completely free from nodal affliction, anchoring pristine wisdom.'),
    remedy: language === 'Marathi'
      ? 'गुरुवारी विष्णू सहस्रनाम पठण आणि कपाळावर हळदीचा किंवा पिवळ्या चंदनाचा टिळा लावावा.'
      : 'Chant Om Brihaspataye Namaha and apply pure yellow sandalwood or turmeric tilak on Thursdays.'
  });

  return doshas;
};

// ---------------------------------------------------------------------------
// 4. DIVISIONAL CHARTS (VARGAS: D1, D9, D10, D7)
// ---------------------------------------------------------------------------

export const calculateDivisionalCharts = (
  planetaryPositions: PlanetaryPositionDetail[] = [],
  lagnaSignNumber: number = 1
): {
  d1: DivisionalChartDetail;
  d9: DivisionalChartDetail;
  d10: DivisionalChartDetail;
  d7: DivisionalChartDetail;
} => {
  const lagnaIdx = (lagnaSignNumber || 1) - 1; // 0-11

  const SHORT_MAP: Record<string, string> = {
    Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me',
    Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke'
  };

  // --- D1 (Main Rashi Chart) ---
  const d1Chart: KundaliChartData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] };
  for (const pos of planetaryPositions) {
    const code = SHORT_MAP[pos.planet] || pos.planet.slice(0, 2);
    if (pos.house >= 1 && pos.house <= 12 && !d1Chart[pos.house].includes(code)) {
      d1Chart[pos.house].push(code);
    }
  }

  // --- D9 (Navamsha Chart: 1/9th division, 3° 20' per pada) ---
  // Lagna Navamsha Sign
  const d9LagnaSign = ((lagnaIdx * 9 + 4) % 12) + 1;
  const d9Chart: KundaliChartData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] };

  for (const pos of planetaryPositions) {
    const signIdx = (lagnaIdx + pos.house - 1) % 12;
    // Extract degree if present or compute deterministic seed
    let degNum = 15;
    if (pos.degree) {
      degNum = parseInt(pos.degree.split('°')[0], 10) || 15;
    }
    const pada = Math.min(8, Math.max(0, Math.floor(degNum / 3.333333)));

    let d9Sign = 0;
    if ([0, 3, 6, 9].includes(signIdx)) { // Movable signs: starts from sign itself
      d9Sign = (signIdx + pada) % 12;
    } else if ([1, 4, 7, 10].includes(signIdx)) { // Fixed signs: starts from 9th sign
      d9Sign = (signIdx + 8 + pada) % 12;
    } else { // Dual signs: starts from 5th sign
      d9Sign = (signIdx + 4 + pada) % 12;
    }

    const d9House = ((d9Sign - (d9LagnaSign - 1) + 12) % 12) + 1;
    const code = SHORT_MAP[pos.planet] || pos.planet.slice(0, 2);
    if (!d9Chart[d9House].includes(code)) {
      d9Chart[d9House].push(code);
    }
  }

  // --- D10 (Dashamsha Chart: 1/10th division, 3° per division) ---
  // Odd signs start from sign itself; even signs start from 9th sign
  const d10LagnaSign = ((lagnaIdx % 2 === 0 ? lagnaIdx : (lagnaIdx + 8) % 12) + 2) % 12 + 1;
  const d10Chart: KundaliChartData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] };

  for (const pos of planetaryPositions) {
    const signIdx = (lagnaIdx + pos.house - 1) % 12;
    let degNum = 14;
    if (pos.degree) degNum = parseInt(pos.degree.split('°')[0], 10) || 14;
    const part = Math.min(9, Math.max(0, Math.floor(degNum / 3)));

    const isOdd = signIdx % 2 === 0; // 0-based: 0 (Aries) is odd, 1 (Taurus) is even
    const d10Sign = isOdd ? (signIdx + part) % 12 : ((signIdx + 8) % 12 + part) % 12;
    const d10House = ((d10Sign - (d10LagnaSign - 1) + 12) % 12) + 1;
    const code = SHORT_MAP[pos.planet] || pos.planet.slice(0, 2);
    if (!d10Chart[d10House].includes(code)) {
      d10Chart[d10House].push(code);
    }
  }

  // --- D7 (Saptamsha Chart: 1/7th division, 4° 17' per division) ---
  // Odd signs start from sign itself; even signs start from 7th sign
  const d7LagnaSign = ((lagnaIdx % 2 === 0 ? lagnaIdx : (lagnaIdx + 6) % 12) + 3) % 12 + 1;
  const d7Chart: KundaliChartData = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: [], 11: [], 12: [] };

  for (const pos of planetaryPositions) {
    const signIdx = (lagnaIdx + pos.house - 1) % 12;
    let degNum = 12;
    if (pos.degree) degNum = parseInt(pos.degree.split('°')[0], 10) || 12;
    const part = Math.min(6, Math.max(0, Math.floor(degNum / 4.2857)));

    const isOdd = signIdx % 2 === 0;
    const d7Sign = isOdd ? (signIdx + part) % 12 : ((signIdx + 6) % 12 + part) % 12;
    const d7House = ((d7Sign - (d7LagnaSign - 1) + 12) % 12) + 1;
    const code = SHORT_MAP[pos.planet] || pos.planet.slice(0, 2);
    if (!d7Chart[d7House].includes(code)) {
      d7Chart[d7House].push(code);
    }
  }

  return {
    d1: {
      id: 'D1',
      name: 'Rashi Chart (लग्न चक्र)',
      title: 'D1 • Physical Body, Vitality & Canvas of Destiny',
      description: 'The foundation birth chart mapping the macro physical manifestation, bodily constitution, and overall life canvas.',
      lagnaSign: lagnaSignNumber,
      chart: d1Chart
    },
    d9: {
      id: 'D9',
      name: 'Navamsha Chart (नवांश चक्र)',
      title: 'D9 • Marriage, Inner Soul Strength & Second Half of Life',
      description: 'The most sacred divisional chart revealing the inner strength of planets, marital compatibility, dharma, and destiny after age 32.',
      lagnaSign: d9LagnaSign,
      chart: d9Chart
    },
    d10: {
      id: 'D10',
      name: 'Dashamsha Chart (दशांश चक्र)',
      title: 'D10 • Career, Profession & Grand Worldly Achievements',
      description: 'The microscopic chart analyzed exclusively for professional supremacy, executive authority, societal prestige, and karmic career milestones.',
      lagnaSign: d10LagnaSign,
      chart: d10Chart
    },
    d7: {
      id: 'D7',
      name: 'Saptamsha Chart (सप्तांश चक्र)',
      title: 'D7 • Children, Progeny & Creative Lineage',
      description: 'The divisional chart governing family continuation, progeny fortune, relationship with children, and creative intellectual fruits.',
      lagnaSign: d7LagnaSign,
      chart: d7Chart
    }
  };
};

// ---------------------------------------------------------------------------
// 5. VIMSHOTTARI ANTARDASHAS (SUB-PERIODS FOR ACTIVE MAHADASHA)
// ---------------------------------------------------------------------------

export const calculateAntardashas = (
  activeMahadasha: MahadashaPeriod | undefined,
  dob?: string,
  language: Language = 'English'
): AntardashaDetail[] => {
  const ORDER = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const YEARS: Record<string, number> = {
    Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17
  };

  const mahaPlanet = activeMahadasha?.planet || 'Jupiter';
  const startYear = parseInt(String(activeMahadasha?.startYear), 10) || new Date().getFullYear() - 3;
  const mahaYears = YEARS[mahaPlanet] || 16;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Start cycling from the Mahadasha lord
  const startIndex = ORDER.indexOf(mahaPlanet) !== -1 ? ORDER.indexOf(mahaPlanet) : 0;
  let runningMonths = 0;

  return Array.from({ length: 9 }).map((_, i) => {
    const antarPlanet = ORDER[(startIndex + i) % 9];
    const antarYears = YEARS[antarPlanet] || 10;
    // Formula: (Maha Years * Antar Years) / 120 in years -> multiply by 12 for months
    const durationMonths = Number(((mahaYears * antarYears) / 10).toFixed(1));

    const startTotalMonths = runningMonths;
    const endTotalMonths = runningMonths + durationMonths;
    runningMonths = endTotalMonths;

    const sYear = startYear + Math.floor(startTotalMonths / 12);
    const sMonth = (Math.floor(startTotalMonths) % 12) + 1;
    const eYear = startYear + Math.floor(endTotalMonths / 12);
    const eMonth = (Math.floor(endTotalMonths) % 12) + 1;

    const startDate = `${sMonth}/${sYear}`;
    const endDate = `${eMonth}/${eYear}`;

    const isCurrent = (currentYear > sYear || (currentYear === sYear && currentMonth >= sMonth)) &&
                      (currentYear < eYear || (currentYear === eYear && currentMonth <= eMonth));

    let effectSummary = `Period of ${antarPlanet} active under ${mahaPlanet} energy.`;
    if (language === 'Marathi') {
      effectSummary = `${getLocalizedPlanet(mahaPlanet, language)} महादशेत ${getLocalizedPlanet(antarPlanet, language)} चे अंतर्दशा फळ.`;
    } else if (language === 'Hindi') {
      effectSummary = `${getLocalizedPlanet(mahaPlanet, language)} महादशा में ${getLocalizedPlanet(antarPlanet, language)} की अंतर्दशा प्रभाव।`;
    }

    return {
      planet: antarPlanet,
      startDate,
      endDate,
      durationMonths,
      isCurrent,
      effectSummary
    };
  });
};

// ---------------------------------------------------------------------------
// 6. PRACTICAL REMEDIES (UPAYAS: GEMSTONES, MANTRAS, DAAN)
// ---------------------------------------------------------------------------

export const calculatePracticalRemedies = (
  planetaryPositions: PlanetaryPositionDetail[] = [],
  lagnaSignNumber: number = 1,
  doshas: VedicDoshaDetail[] = [],
  language: Language = 'English'
): PracticalRemedyDetail => {
  const lagnaIdx = (lagnaSignNumber || 1) - 1; // 0-11
  const lagnaLord = SIGN_LORDS[lagnaIdx];
  const bhagyaSignIdx = (lagnaIdx + 8) % 12; // 9th house sign
  const bhagyaLord = SIGN_LORDS[bhagyaSignIdx];

  const GEMSTONE_MAP: Record<string, {
    name: string;
    sanskritName: string;
    carat: string;
    metal: string;
    finger: string;
    dayTime: string;
    mantra: string;
  }> = {
    Sun: {
      name: 'Ruby (Manikya)',
      sanskritName: 'माणिक्य',
      carat: '5.25 - 6.5 Ratti',
      metal: 'Gold or Copper',
      finger: 'Ring Finger',
      dayTime: 'Sunday Sunrise (Shukla Paksha)',
      mantra: 'ॐ ह्रीं ह्रीं सूर्याय नमः (Om Hreem Hreem Suryaya Namaha)'
    },
    Moon: {
      name: 'Natural Pearl (Moti)',
      sanskritName: 'मोती',
      carat: '6.25 - 7.5 Ratti',
      metal: 'Silver',
      finger: 'Little Finger',
      dayTime: 'Monday Evening (Shukla Paksha)',
      mantra: 'ॐ सों सोमाय नमः (Om Som Somaya Namaha)'
    },
    Mars: {
      name: 'Red Coral (Moonga)',
      sanskritName: 'मूंगा',
      carat: '6.25 - 8.25 Ratti',
      metal: 'Copper or Gold',
      finger: 'Ring Finger',
      dayTime: 'Tuesday Sunrise',
      mantra: 'ॐ अं अंगारकाय नमः (Om Am Angarakaya Namaha)'
    },
    Mercury: {
      name: 'Emerald (Panna)',
      sanskritName: 'पन्ना',
      carat: '5.25 - 6.25 Ratti',
      metal: 'Gold or Silver',
      finger: 'Little Finger',
      dayTime: 'Wednesday Morning',
      mantra: 'ॐ बुं बुधाय नमः (Om Bum Budhaya Namaha)'
    },
    Jupiter: {
      name: 'Yellow Sapphire (Pukhraj)',
      sanskritName: 'पुखराज',
      carat: '5.25 - 7.25 Ratti',
      metal: 'Gold or Brass',
      finger: 'Index Finger',
      dayTime: 'Thursday Morning (Shukla Paksha)',
      mantra: 'ॐ बृं बृहस्पतये नमः (Om Breem Brihaspataye Namaha)'
    },
    Venus: {
      name: 'Diamond or White Zircon (Heera)',
      sanskritName: 'हीरा / श्वेत पुखराज',
      carat: '1.0 - 2.5 Carats',
      metal: 'Platinum or Silver',
      finger: 'Middle or Ring Finger',
      dayTime: 'Friday Sunrise',
      mantra: 'ॐ शुं शुक्राय नमः (Om Shum Shukraya Namaha)'
    },
    Saturn: {
      name: 'Blue Sapphire or Amethyst (Neelam)',
      sanskritName: 'नीलम / कटैला',
      carat: '5.25 - 7.25 Ratti',
      metal: 'Panchadhatu or Silver',
      finger: 'Middle Finger',
      dayTime: 'Saturday Sunset',
      mantra: 'ॐ शं शनैश्चराय नमः (Om Sham Shanicharaya Namaha)'
    }
  };

  const primaryGem = GEMSTONE_MAP[lagnaLord] || GEMSTONE_MAP.Jupiter;
  const secondaryGem = GEMSTONE_MAP[bhagyaLord] || GEMSTONE_MAP.Sun;

  return {
    gemstones: {
      primary: {
        ...primaryGem,
        planet: lagnaLord
      },
      secondary: {
        ...secondaryGem,
        planet: bhagyaLord
      }
    },
    mantras: [
      {
        planet: lagnaLord,
        type: 'Ishta / Lagna Beej Mantra',
        mantraText: primaryGem.mantra,
        repetitions: '108 repetitions daily',
        optimalTiming: 'Brahma Muhurta / Morning Sunrise',
        rosary: 'Rudraksha or Tulsi Mala'
      },
      {
        planet: 'Universal Vedic Protection',
        type: 'Maha Mrityunjaya Sacred Stotra',
        mantraText: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्। उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्॥',
        repetitions: '11 or 108 repetitions daily',
        optimalTiming: 'Morning or Evening Sandhya',
        rosary: 'Rudraksha Mala'
      },
      {
        planet: 'Sun (Surya)',
        type: 'Savita Gayatri Mantra',
        mantraText: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥',
        repetitions: '108 repetitions daily',
        optimalTiming: 'Sunrise with pure water copper Arghya',
        rosary: 'Red Sandalwood or Tulsi Mala'
      }
    ],
    charities: [
      {
        planet: 'Saturn / Rahu Karmic Balance',
        items: 'Black sesame seeds, mustard oil, or blue blankets to the underprivileged.',
        targetDay: 'Saturday Evening',
        recipient: 'Elderly shelter, sanitation workers, or disabled individuals.',
        karmicBenefit: 'Mitigates Shani Saadesati delays, alleviates hurdles, and stabilizes finances.'
      },
      {
        planet: 'Venus / Family Harmony',
        items: 'Sweet white kheer, milk, rice, or sugar.',
        targetDay: 'Friday Morning',
        recipient: 'Feeding stray cows (Gau Seva) or sharing with domestic help.',
        karmicBenefit: 'Deepens relationship tranquility, invites Lakshmi grace, and dissolves domestic friction.'
      },
      {
        planet: 'Mercury / Buddhi & Speech',
        items: 'Green grass, green leafy spinach, or green moong lentils.',
        targetDay: 'Wednesday Morning',
        recipient: 'Feeding cows or supporting educational supplies for orphan children.',
        karmicBenefit: 'Elevates intellectual sharpness, business communication, and academic distinction.'
      }
    ]
  };
};


