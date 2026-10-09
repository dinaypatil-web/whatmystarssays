import { PlanetaryTransitInfo } from "../types";

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
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
      description: 'Your current name frequency clashes with birth energies, which can attract unnecessary delays or resistance. Name correction is strongly recommended.',
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
