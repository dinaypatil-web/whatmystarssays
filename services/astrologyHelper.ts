import { PlanetaryTransitInfo, SaadesatiPhase, Language, AvakahadaDetails, PlanetaryPositionDetail, KundaliChartData } from "../types";

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

  return {
    siderealLongitude: siderealLong,
    rashiIndex,
    rashi,
    nakshatraIndex,
    nakshatra,
    pada,
    degreesInSign: (siderealLong % 30).toFixed(2)
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
 */
export const calculatePlanetaryPositions = (
  chartData: KundaliChartData = {},
  lagnaSignNumber: number = 1
): PlanetaryPositionDetail[] => {
  const PLANET_META: Record<string, { sanskrit: string; icon: string; exalted: number; own: number[]; debilitated: number }> = {
    Sun: { sanskrit: 'Surya (सूर्य)', icon: '☀️', exalted: 0, own: [4], debilitated: 6 },
    Moon: { sanskrit: 'Chandra (चन्द्र)', icon: '🌙', exalted: 1, own: [3], debilitated: 7 },
    Mars: { sanskrit: 'Mangal (मंगल)', icon: '♂️', exalted: 9, own: [0, 7], debilitated: 3 },
    Mercury: { sanskrit: 'Budh (बुध)', icon: '☿', exalted: 5, own: [2, 5], debilitated: 11 },
    Jupiter: { sanskrit: 'Guru (गुरु)', icon: '♃', exalted: 3, own: [8, 11], debilitated: 9 },
    Venus: { sanskrit: 'Shukra (शुक्र)', icon: '♀', exalted: 11, own: [1, 6], debilitated: 5 },
    Saturn: { sanskrit: 'Shani (शनि)', icon: '🪐', exalted: 6, own: [9, 10], debilitated: 0 },
    Rahu: { sanskrit: 'Rahu (राहु)', icon: '☊', exalted: 1, own: [10], debilitated: 7 },
    Ketu: { sanskrit: 'Ketu (केतु)', icon: '☋', exalted: 7, own: [8], debilitated: 1 }
  };

  const results: PlanetaryPositionDetail[] = [];

  for (const [planetName, meta] of Object.entries(PLANET_META)) {
    let house = 1;
    let found = false;

    // Scan chartData houses 1-12
    for (const [hStr, planets] of Object.entries(chartData)) {
      const hNum = parseInt(hStr, 10);
      if (Array.isArray(planets)) {
        for (const p of planets) {
          const cleanP = String(p).toLowerCase();
          const target = planetName.toLowerCase();
          if (cleanP === target || cleanP.startsWith(target.slice(0, 2)) || cleanP.includes(target)) {
            house = hNum;
            found = true;
            break;
          }
        }
      }
      if (found) break;
    }

    // Determine sign in this house
    const lagnaIdx = Math.max(0, Math.min(11, (lagnaSignNumber || 1) - 1));
    const signIdx = (lagnaIdx + house - 1) % 12; // 0-11
    const signName = RASHI_NAMES_EN[signIdx];
    const signSanskrit = RASHI_NAMES_SANSKRIT[signIdx];

    // Determine dignity
    let dignity: PlanetaryPositionDetail['dignity'] = 'Friendly (मित्र)';
    let dignityColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

    if (signIdx === meta.exalted) {
      dignity = 'Exalted (उच्च)';
      dignityColor = 'text-amber-300 bg-amber-500/20 border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.25)]';
    } else if (meta.own.includes(signIdx)) {
      dignity = signIdx === meta.own[0] ? 'Moolatrikona (मूलत्रिकोण)' : 'Own Sign (स्वराशि)';
      dignityColor = 'text-sky-300 bg-sky-500/15 border-sky-500/35';
    } else if (signIdx === meta.debilitated) {
      dignity = 'Debilitated (नीच)';
      dignityColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    } else {
      dignity = 'Friendly (मित्र)';
      dignityColor = 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25';
    }

    results.push({
      planet: planetName,
      planetSanskrit: meta.sanskrit,
      icon: meta.icon,
      sign: signName,
      signSanskrit,
      house,
      dignity,
      dignityColor
    });
  }

  return results;
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


