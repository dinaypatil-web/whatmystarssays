import { Language } from '../types';

/**
 * Universal text cleaner to strip raw Markdown asterisks (*, **, ***),
 * hashes, and formatting artifacts from plain text displays.
 */
export const stripAsterisksAndMarkdown = (text: string | undefined | null): string => {
  if (!text) return '';
  return text
    // Replace triple and double asterisks with inner text
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove stray asterisks
    .replace(/\*/g, '')
    // Remove markdown heading hashes at line starts
    .replace(/^#{1,6}\s+/gm, '')
    // Replace bullet asterisks/hyphens at line starts with clean bullets
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();
};

export interface KundaliLocaleData {
  planetHeaders: {
    planet: string;
    sign: string;
    house: string;
    dignity: string;
  };
  cardinalPoints: {
    starLord: string;
    subLord: string;
    nakshatra: string;
    moonSign: string;
  };
  chapterLabels: {
    chapter: string;
    part: string;
    ch1Title: string;
    ch2Title: string;
    ch3Title: string;
    ch4Title: string;
    epilogueTitle: string;
  };
  bhavaPillars: {
    selectHouse: string;
    rashi: string;
    lord: string;
    karaka: string;
    anatomy: string;
    element: string;
    purushartha: string;
    lifeDomain: string;
    occupyingPlanets: string;
    noPlanets: string;
    analysisTitle: string;
    boonsTitle: string;
    cautionsTitle: string;
    upayasTitle: string;
    counselTitle: string;
    continuationBanner: string;
    goToPart2: string;
    points: string;
    remediesCount: string;
  };
  navigation: {
    prevPage: string;
    nextPage: string;
    pageLabel: string;
    ofLabel: string;
    coverOption: string;
    chartOption: string;
    panchangaOption: string;
    navagrahaOption: string;
    mahadashaOption: string;
    epilogueOption: string;
  };
  footers: {
    bookName: string;
    pagePrefix: string;
    coverFooter: string;
    chartFooter: string;
    panchangaFooter: string;
    navagrahaFooter: string;
    mahadashaFooter: string;
    bhavaFooter: string;
    epilogueFooter: string;
  };
  cover: {
    title: string;
    subtitle: string;
    treatise: string;
    nativeName: string;
    dob: string;
    tob: string;
    pob: string;
    system: string;
  };
  panchanga: {
    varna: string;
    vashya: string;
    yoni: string;
    gana: string;
    nadi: string;
    paya: string;
    element: string;
    tithi: string;
    manglikTitle: string;
    manglikActive: string;
    manglikNirdosha: string;
    luckyTitle: string;
    gemstone: string;
    metal: string;
    color: string;
    direction: string;
  };
  mahadasha: {
    title: string;
    subtitle: string;
    activeSeal: string;
    sadesatiTitle: string;
  };
}

export const PLANET_TRANSLATIONS: Record<Language, Record<string, string>> = {
  English: {
    Sun: 'Sun',
    Moon: 'Moon',
    Mars: 'Mars',
    Mercury: 'Mercury',
    Jupiter: 'Jupiter',
    Venus: 'Venus',
    Saturn: 'Saturn',
    Rahu: 'Rahu',
    Ketu: 'Ketu'
  },
  Hindi: {
    Sun: 'सूर्य',
    Moon: 'चन्द्र',
    Mars: 'मंगल',
    Mercury: 'बुध',
    Jupiter: 'गुरु (बृहस्पति)',
    Venus: 'शुक्र',
    Saturn: 'शनि',
    Rahu: 'राहु',
    Ketu: 'केतु'
  },
  Marathi: {
    Sun: 'सूर्य',
    Moon: 'चंद्र',
    Mars: 'मंगळ',
    Mercury: 'बुध',
    Jupiter: 'गुरू',
    Venus: 'शुक्र',
    Saturn: 'शनी',
    Rahu: 'राहू',
    Ketu: 'केतू'
  },
  Gujarati: {
    Sun: 'સૂર્ય',
    Moon: 'ચંદ્ર',
    Mars: 'મંગળ',
    Mercury: 'બુધ',
    Jupiter: 'ગુરુ',
    Venus: 'શુક્ર',
    Saturn: 'શનિ',
    Rahu: 'રાહુ',
    Ketu: 'કેતુ'
  },
  Bengali: {
    Sun: 'সূর্য',
    Moon: 'চন্দ্র',
    Mars: 'মঙ্গল',
    Mercury: 'বুধ',
    Jupiter: 'বৃহস্পতি',
    Venus: 'শুক্র',
    Saturn: 'শনি',
    Rahu: 'রাহু',
    Ketu: 'কেতু'
  },
  Tamil: {
    Sun: 'சூரியன்',
    Moon: 'சந்திரன்',
    Mars: 'செவ்வாய்',
    Mercury: 'புதன்',
    Jupiter: 'குரு',
    Venus: 'சுக்கிரன்',
    Saturn: 'சனி',
    Rahu: 'ராகு',
    Ketu: 'கேது'
  },
  Telugu: {
    Sun: 'సూర్యుడు',
    Moon: 'చంద్రుడు',
    Mars: 'కుజుడు',
    Mercury: 'బుధుడు',
    Jupiter: 'గురుడు',
    Venus: 'శుక్రుడు',
    Saturn: 'శని',
    Rahu: 'రాహువు',
    Ketu: 'కేతువు'
  },
  Kannada: {
    Sun: 'ಸೂರ್ಯ',
    Moon: 'ಚಂದ್ರ',
    Mars: 'ಮಂಗಳ',
    Mercury: 'ಬುಧ',
    Jupiter: 'ಗುರು',
    Venus: 'ಶುಕ್ರ',
    Saturn: 'ಶನಿ',
    Rahu: 'ರಾಹು',
    Ketu: 'ಕೇತು'
  },
  Malayalam: {
    Sun: 'സൂര്യൻ',
    Moon: 'ചന്ദ്രൻ',
    Mars: 'ചൊവ്വ',
    Mercury: 'ബുധൻ',
    Jupiter: 'വ്യാഴം (ഗുരു)',
    Venus: 'ശുക്രൻ',
    Saturn: 'ശനി',
    Rahu: 'രാഹു',
    Ketu: 'കേതു'
  },
  Punjabi: {
    Sun: 'ਸੂਰਜ',
    Moon: 'ਚੰਦਰਮਾ',
    Mars: 'ਮੰਗਲ',
    Mercury: 'ਬੁੱਧ',
    Jupiter: 'ਗੁਰੂ',
    Venus: 'ਸ਼ੁੱਕਰ',
    Saturn: 'ਸ਼ਨੀ',
    Rahu: 'ਰਾਹੂ',
    Ketu: 'ਕੇਤੂ'
  },
  Odia: {
    Sun: 'ସୂର୍ଯ୍ୟ',
    Moon: 'ଚନ୍ଦ୍ର',
    Mars: 'ମଙ୍ଗଳ',
    Mercury: 'ବୁଧ',
    Jupiter: 'ବୃହସ୍ପତି',
    Venus: 'ଶୁକ୍ର',
    Saturn: 'ଶନି',
    Rahu: 'ରାହୁ',
    Ketu: 'କେତୁ'
  }
};

export const RASHI_TRANSLATIONS: Record<Language, string[]> = {
  English: [
    'Aries', 'Taurus', 'Gemini', 'Cancer',
    'Leo', 'Virgo', 'Libra', 'Scorpio',
    'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ],
  Hindi: [
    'मेष', 'वृषभ', 'मिथुन', 'कर्क',
    'सिंह', 'कन्या', 'तुला', 'वृश्चिक',
    'धनु', 'मकर', 'कुम्भ', 'मीन'
  ],
  Marathi: [
    'मेष', 'वृषभ', 'मिथुन', 'कर्क',
    'सिंह', 'कन्या', 'तूळ', 'वृश्चिक',
    'धनु', 'मकर', 'कुंभ', 'मीन'
  ],
  Gujarati: [
    'મેષ', 'વૃષભ', 'મિથુન', 'કર્ક',
    'સિંહ', 'કન્યા', 'તુલા', 'વૃશ્ચિક',
    'ધન', 'મકર', 'કુંભ', 'મીન'
  ],
  Bengali: [
    'মেষ', 'বৃষ', 'মিথুন', 'কর্কট',
    'সিংহ', 'কন্যা', 'তুলা', 'বৃশ্চিক',
    'ধনু', 'মকর', 'কুম্ভ', 'মীন'
  ],
  Tamil: [
    'மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்',
    'சிம்மம்', 'கன்னி', 'துலாம்', 'விருச்சிகம்',
    'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்'
  ],
  Telugu: [
    'మేషం', 'వృషభం', 'మిథునం', 'కర్కాటకం',
    'సింహం', 'కన్య', 'తుల', 'వృశ్చికం',
    'ధనుస్సు', 'మకరం', 'కుంభం', 'మీనం'
  ],
  Kannada: [
    'ಮೇಷ', 'ವೃಷಭ', 'ಮಿಥುನ', 'ಕರ್ಕಾಟಕ',
    'ಸಿಂಹ', 'ಕನ್ಯಾ', 'ತುಲಾ', 'ವೃಶ್ಚಿಕ',
    'ಧನುಸ್ಸು', 'ಮಕರ', 'ಕುಂಭ', 'ಮೀನ'
  ],
  Malayalam: [
    'മേടം', 'ഇടവം', 'മിഥുനം', 'കർക്കിടകം',
    'ചിങ്ങം', 'കന്നി', 'തുലാം', 'വൃശ്ചികം',
    'ധനു', 'മകരം', 'കുംഭം', 'മീനം'
  ],
  Punjabi: [
    'ਮੇਖ', 'ਬ੍ਰਿਖ', 'ਮਿਥੁਨ', 'ਕਰਕ',
    'ਸਿੰਘ', 'ਕੰਨਿਆ', 'ਤੁਲਾ', 'ਬ੍ਰਿਸ਼ਚਕ',
    'ਧਨੁ', 'ਮਕਰ', 'ਕੁੰਭ', 'ਮੀਨ'
  ],
  Odia: [
    'ମେଷ', 'ବୃଷ', 'ମିଥୁନ', 'କର୍କଟ',
    'ସିଂହ', 'କନ୍ୟା', 'ତୁଳା', 'ବିଛା',
    'ଧନୁ', 'ମକର', 'କୁମ୍ଭ', 'ମୀନ'
  ]
};

export const DIGNITY_TRANSLATIONS: Record<Language, Record<string, string>> = {
  English: {
    Exalted: 'Exalted',
    'Own Sign': 'Own Sign',
    Moolatrikona: 'Moolatrikona',
    Friendly: 'Friendly',
    Neutral: 'Neutral',
    Enemy: 'Enemy',
    Debilitated: 'Debilitated'
  },
  Hindi: {
    Exalted: 'उच्च',
    'Own Sign': 'स्वराशि',
    Moolatrikona: 'मूलत्रिकोण',
    Friendly: 'मित्र',
    Neutral: 'सम',
    Enemy: 'शत्रु',
    Debilitated: 'नीच'
  },
  Marathi: {
    Exalted: 'उच्च',
    'Own Sign': 'स्वराशी',
    Moolatrikona: 'मूलत्रिकोण',
    Friendly: 'मित्र',
    Neutral: 'सम',
    Enemy: 'शत्रू',
    Debilitated: 'नीच'
  },
  Gujarati: {
    Exalted: 'ઉચ્ચ',
    'Own Sign': 'સ્વરાશિ',
    Moolatrikona: 'મૂળત્રિકોણ',
    Friendly: 'મિત્ર',
    Neutral: 'સમ',
    Enemy: 'શત્રુ',
    Debilitated: 'નીચ'
  },
  Bengali: {
    Exalted: 'তুঙ্গী (উচ্চ)',
    'Own Sign': 'স্বক্ষেত্র',
    Moolatrikona: 'মূলত্রিকোণ',
    Friendly: 'মিত্র',
    Neutral: 'সম',
    Enemy: 'শত্রু',
    Debilitated: 'নীচ'
  },
  Tamil: {
    Exalted: 'உச்சம்',
    'Own Sign': 'ஆட்சி',
    Moolatrikona: 'மூலத்திரிகோணம்',
    Friendly: 'நட்பு',
    Neutral: 'சமம்',
    Enemy: 'பகை',
    Debilitated: 'நீசம்'
  },
  Telugu: {
    Exalted: 'ఉచ్ఛ',
    'Own Sign': 'స్వక్షేత్రం',
    Moolatrikona: 'మూలత్రికోణం',
    Friendly: 'మిత్ర',
    Neutral: 'సమ',
    Enemy: 'శత్రు',
    Debilitated: 'నీచ'
  },
  Kannada: {
    Exalted: 'ಉಚ್ಚ',
    'Own Sign': 'ಸ್ವಕ್ಷೇತ್ರ',
    Moolatrikona: 'ಮೂಲತ್ರಿಕೋಣ',
    Friendly: 'ಮಿತ್ರ',
    Neutral: 'ಸಮ',
    Enemy: 'ಶತ್ರು',
    Debilitated: 'ನೀಚ'
  },
  Malayalam: {
    Exalted: 'ഉച്ചം',
    'Own Sign': 'സ്വക്ഷേത്രം',
    Moolatrikona: 'മൂലത്രികോണം',
    Friendly: 'മിത്രം',
    Neutral: 'സമം',
    Enemy: 'ശത്രു',
    Debilitated: 'നീചം'
  },
  Punjabi: {
    Exalted: 'ਉੱਚ',
    'Own Sign': 'ਸਵੈ-ਰਾਸ਼ੀ',
    Moolatrikona: 'ਮੂਲ-ਤ੍ਰਿਕੋਣ',
    Friendly: 'ਮਿੱਤਰ',
    Neutral: 'ਸਮ',
    Enemy: 'ਸ਼ਤਰੂ',
    Debilitated: 'ਨੀਚ'
  },
  Odia: {
    Exalted: 'ଉଚ୍ଚ',
    'Own Sign': 'ସ୍ୱରାଶି',
    Moolatrikona: 'ମୂଳତ୍ରିକୋଣ',
    Friendly: 'ମିତ୍ର',
    Neutral: 'ସମ',
    Enemy: 'ଶତ୍ରୁ',
    Debilitated: 'ନୀଚ'
  }
};

/**
 * Returns localized planet name without parentheses or nested duplicates.
 */
export const getLocalizedPlanet = (planet: string, language: Language): string => {
  const normPlanet = (planet || '').replace(/•|\(|\)/g, ' ').trim();
  const matchedKey = Object.keys(PLANET_TRANSLATIONS.English).find(k => 
    normPlanet.toLowerCase().includes(k.toLowerCase())
  );
  if (matchedKey) {
    return PLANET_TRANSLATIONS[language]?.[matchedKey] || PLANET_TRANSLATIONS.English[matchedKey];
  }
  return planet;
};

/**
 * Returns localized zodiac sign name without parentheses.
 */
export const getLocalizedSign = (sign: string | number, language: Language): string => {
  let signIdx = 0;
  if (typeof sign === 'number') {
    signIdx = (sign - 1 + 12) % 12;
  } else {
    const sLower = (sign || '').toLowerCase().trim();
    const foundIdx = RASHI_TRANSLATIONS.English.findIndex(s => sLower.includes(s.toLowerCase()));
    signIdx = foundIdx !== -1 ? foundIdx : 0;
  }
  return RASHI_TRANSLATIONS[language]?.[signIdx] || RASHI_TRANSLATIONS.English[signIdx];
};

/**
 * Returns localized house label (e.g. House 1, भाव १, etc.).
 */
export const getLocalizedHouse = (houseNumber: number, language: Language): string => {
  switch (language) {
    case 'Hindi':
      return `भाव ${houseNumber}`;
    case 'Marathi':
      return `भाव ${houseNumber}`;
    case 'Gujarati':
      return `ભાવ ${houseNumber}`;
    case 'Bengali':
      return `${houseNumber}ম ভাব`;
    case 'Tamil':
      return `${houseNumber}-ம் வீடு`;
    case 'Telugu':
      return `${houseNumber}వ స్థానం`;
    case 'Kannada':
      return `${houseNumber}ನೇ ಮನೆ`;
    case 'Malayalam':
      return `${houseNumber}-ാം ഭാവം`;
    case 'Punjabi':
      return `ਭਾਵ ${houseNumber}`;
    case 'Odia':
      return `ଭାବ ${houseNumber}`;
    case 'English':
    default:
      return `House ${houseNumber}`;
  }
};

/**
 * Normalizes dignity to clean, un-nested localized label.
 */
export const getLocalizedDignity = (dignity: string, language: Language): string => {
  const dLower = (dignity || '').toLowerCase();
  let baseKey = 'Friendly';
  if (dLower.includes('exalt') || dLower.includes('उच्च')) baseKey = 'Exalted';
  else if (dLower.includes('moolatrikona') || dLower.includes('मूल')) baseKey = 'Moolatrikona';
  else if (dLower.includes('own') || dLower.includes('स्व')) baseKey = 'Own Sign';
  else if (dLower.includes('debilitat') || dLower.includes('नीच')) baseKey = 'Debilitated';
  else if (dLower.includes('enemy') || dLower.includes('शत्रु')) baseKey = 'Enemy';
  else if (dLower.includes('neutral') || dLower.includes('सम')) baseKey = 'Neutral';
  else if (dLower.includes('friend') || dLower.includes('मित्र')) baseKey = 'Friendly';

  return DIGNITY_TRANSLATIONS[language]?.[baseKey] || DIGNITY_TRANSLATIONS.English[baseKey];
};

/**
 * Comprehensive UI strings localized for all supported languages.
 */
export const getKundaliLocale = (language: Language): KundaliLocaleData => {
  const isEn = language === 'English';
  const isHi = language === 'Hindi';
  const isMr = language === 'Marathi';
  const isGu = language === 'Gujarati';
  const isBn = language === 'Bengali';
  const isTa = language === 'Tamil';
  const isTe = language === 'Telugu';
  const isKn = language === 'Kannada';
  const isMl = language === 'Malayalam';
  const isPa = language === 'Punjabi';
  const isOd = language === 'Odia';

  if (isEn) {
    return {
      planetHeaders: {
        planet: 'Planet',
        sign: 'Sign',
        house: 'House',
        dignity: 'Dignity'
      },
      cardinalPoints: {
        starLord: 'Star Lord',
        subLord: 'Sub Lord',
        nakshatra: 'Nakshatra',
        moonSign: 'Moon Sign'
      },
      chapterLabels: {
        chapter: 'Chapter',
        part: 'Part',
        ch1Title: 'Ascendant Birth Chart & Planetary Coordinates',
        ch2Title: 'Avakahada Chakra & Birth Panchanga (8 Cosmic Pillars)',
        ch3Title: 'Navagraha Matrix & Four Life Pillars (Purusharthas)',
        ch4Title: 'Vimshottari Mahadasha Timeline & Shani Sade Sati',
        epilogueTitle: 'Sacred Epilogue & Vedic Mantras'
      },
      bhavaPillars: {
        selectHouse: 'Select House:',
        rashi: 'Sign',
        lord: 'House Lord',
        karaka: 'Significator',
        anatomy: 'Anatomy',
        element: 'Element',
        purushartha: 'Life Pillar',
        lifeDomain: 'Life Domain & Key Themes:',
        occupyingPlanets: 'Occupying Planets:',
        noPlanets: 'No planet occupies; fully governed by house lord and planetary aspects.',
        analysisTitle: 'In-depth Astrological Synthesis:',
        boonsTitle: 'Favorable Boons & Cosmic Blessings:',
        cautionsTitle: 'Mindful Cautions & Vulnerabilities:',
        upayasTitle: 'Actionable Upayas & Sacred Mantras:',
        counselTitle: 'Karmic Fruition Counsel:',
        continuationBanner: 'Detailed Continuation: View Boons, Cautions & Vedic Upayas on next page.',
        goToPart2: 'Part 2',
        points: 'points',
        remediesCount: 'remedies'
      },
      navigation: {
        prevPage: 'Previous Page',
        nextPage: 'Next Page',
        pageLabel: 'Page',
        ofLabel: 'of',
        coverOption: 'Page 1: Royal Book Cover',
        chartOption: 'Page 2: Janma Kundali & Chart',
        panchangaOption: 'Page 3: Avakahada & Panchanga',
        navagrahaOption: 'Page 4: Navagraha & Purushartha',
        mahadashaOption: 'Page 5: Vimshottari Mahadasha & Sade Sati',
        epilogueOption: 'Epilogue & Mantras'
      },
      footers: {
        bookName: 'Janma Kundali Codex',
        pagePrefix: 'Page',
        coverFooter: 'Certified Royal Patrika',
        chartFooter: 'Ascendant Birth Chart',
        panchangaFooter: 'Birth Panchanga',
        navagrahaFooter: 'Planetary Matrix',
        mahadashaFooter: 'Mahadasha & Sade Sati',
        bhavaFooter: 'Comprehensive House Codex',
        epilogueFooter: 'Universal Peace & Mantras'
      },
      cover: {
        title: 'Brihat Janma Kundali Codex',
        subtitle: 'Royal Vedic Life Patrika',
        treatise: 'Comprehensive Astrological Codex & Destiny Guidebook',
        nativeName: 'Name of Native',
        dob: 'Date of Birth',
        tob: 'Time of Birth',
        pob: 'Place of Birth',
        system: 'System'
      },
      panchanga: {
        varna: '1. Varna (Spiritual Nature)',
        vashya: '2. Vashya (Dominance & Alignment)',
        yoni: '3. Yoni (Instinctive Drive)',
        gana: '4. Gana (Disposition & Temperament)',
        nadi: '5. Nadi (Bio-Energetic Pulse)',
        paya: '6. Paya (Foundational Base)',
        element: '7. Tatva (Elemental Core)',
        tithi: '8. Tithi & Lunar Day',
        manglikTitle: 'Manglik Dosha Assessment',
        manglikActive: 'Active Manglik Influence',
        manglikNirdosha: 'Nir-dosha (No Manglik Affliction)',
        luckyTitle: 'Sacred Auspicious Matrix',
        gemstone: 'Gemstone:',
        metal: 'Metal:',
        color: 'Color:',
        direction: 'Direction:'
      },
      mahadasha: {
        title: 'Vimshottari Mahadasha Timeline & Sade Sati',
        subtitle: '120-Year Planetary Cycles',
        activeSeal: 'Active',
        sadesatiTitle: 'Saturn Sade Sati Cycles (Relative to Moon)'
      }
    };
  }

  // Default to Indic localized strings (Hindi / Marathi / Gujarati / etc.)
  if (isMr) {
    return {
      planetHeaders: {
        planet: 'ग्रह',
        sign: 'राशी',
        house: 'भाव',
        dignity: 'स्थिती'
      },
      cardinalPoints: {
        starLord: 'नक्षत्र स्वामी',
        subLord: 'उप स्वामी',
        nakshatra: 'जन्म नक्षत्र',
        moonSign: 'चंद्र राशी'
      },
      chapterLabels: {
        chapter: 'अध्याय',
        part: 'भाग',
        ch1Title: 'जन्म लग्न चक्र आणि ग्रह स्थिती',
        ch2Title: 'अवकहडा चक्र आणि जन्म पंचांग',
        ch3Title: 'नवग्रह स्थिती आणि चार पुरुषार्थ',
        ch4Title: 'विंशोत्तरी महादशा कालचक्र आणि साडेसाती',
        epilogueTitle: 'उपसंहार आणि वैदिक आशीर्वाद'
      },
      bhavaPillars: {
        selectHouse: 'भाव निवडा:',
        rashi: 'राशी',
        lord: 'भावेश',
        karaka: 'कारक',
        anatomy: 'शरीर अंग',
        element: 'तत्त्व',
        purushartha: 'पुरुषार्थ',
        lifeDomain: 'जीवन क्षेत्र आणि कारकत्व:',
        occupyingPlanets: 'स्थित ग्रह:',
        noPlanets: 'कोणताही प्रत्यक्ष ग्रह नाही; भावेश आणि दृष्टींद्वारे नियंत्रित.',
        analysisTitle: 'सखोल ज्योतिषीय विश्लेषण:',
        boonsTitle: 'शुभ फळे आणि ईश्वरीय कृपा:',
        cautionsTitle: 'सतर्कता आणि आव्हाने:',
        upayasTitle: 'वैदिक उपाय आणि मंत्र अनुष्ठान:',
        counselTitle: 'कर्म सिद्धी सल्ला:',
        continuationBanner: 'सविस्तर विवेचन: या भावाची शुभ फळे, दक्षता आणि उपाय पुढील पानावर पहा.',
        goToPart2: 'भाग २',
        points: 'मुद्दे',
        remediesCount: 'उपाय'
      },
      navigation: {
        prevPage: 'मागील पृष्ठ',
        nextPage: 'पुढील पृष्ठ',
        pageLabel: 'पृष्ठ',
        ofLabel: 'पैकी',
        coverOption: 'पृष्ठ १: मुख्य पृष्ठ',
        chartOption: 'पृष्ठ २: जन्म लग्न चक्र',
        panchangaOption: 'पृष्ठ ३: अवकहडा आणि पंचांग',
        navagrahaOption: 'पृष्ठ ४: नवग्रह आणि पुरुषार्थ',
        mahadashaOption: 'पृष्ठ ५: महादशा आणि साडेसाती',
        epilogueOption: 'उपसंहार आणि मंत्र'
      },
      footers: {
        bookName: 'जन्म कुंडली संहिता',
        pagePrefix: 'पृष्ठ',
        coverFooter: 'प्रमाणीकृत कुंडली',
        chartFooter: 'जन्म लग्न चक्र',
        panchangaFooter: 'जन्म पंचांग',
        navagrahaFooter: 'नवग्रह स्थिती',
        mahadashaFooter: 'महादशा आणि साडेसाती',
        bhavaFooter: 'द्वादश भाव संहिता',
        epilogueFooter: 'शांती मंत्र'
      },
      cover: {
        title: 'बृहत् जन्म कुंडली ग्रंथ',
        subtitle: 'शाही वैदिक जन्म पत्रिका',
        treatise: 'कर्म विपाक संहिता आणि जीवन मार्गदर्शक',
        nativeName: 'जातकाचे नाव',
        dob: 'जन्म तारीख',
        tob: 'जन्म वेळ',
        pob: 'जन्म ठिकाण',
        system: 'पद्धती'
      },
      panchanga: {
        varna: '१. वर्ण (आत्मिक प्रवृत्ती)',
        vashya: '२. वश्य (प्रभाव व सामंजस्य)',
        yoni: '३. योनी (स्वभाव)',
        gana: '४. गण (प्रकृती)',
        nadi: '५. नाडी (आरोग्य ऊर्जा)',
        paya: '६. पाया (पायाभूत आधार)',
        element: '७. तत्त्व (मूलभूत ऊर्जा)',
        tithi: '८. तिथी व योग',
        manglikTitle: 'मांगलिक दोष विचार',
        manglikActive: 'मांगलिक प्रभाव सक्रिय',
        manglikNirdosha: 'निर्दोष (कोणताही मांगलिक दोष नाही)',
        luckyTitle: 'शुभ घटक',
        gemstone: 'रत्न:',
        metal: 'धातू:',
        color: 'रंग:',
        direction: 'दिशा:'
      },
      mahadasha: {
        title: 'विंशोत्तरी महादशा कालचक्र आणि साडेसाती',
        subtitle: '१२० वर्षांची ग्रह दशा',
        activeSeal: 'सक्रिय',
        sadesatiTitle: 'शनि साडेसाती चक्र (चंद्र राशीनुसार)'
      }
    };
  }

  if (isGu) {
    return {
      planetHeaders: {
        planet: 'ગ્રહ',
        sign: 'રાશિ',
        house: 'ભાવ',
        dignity: 'સ્થિતિ'
      },
      cardinalPoints: {
        starLord: 'નક્ષત્ર સ્વામી',
        subLord: 'ઉપ સ્વામી',
        nakshatra: 'જન્મ નક્ષત્ર',
        moonSign: 'ચંદ્ર રાશિ'
      },
      chapterLabels: {
        chapter: 'અધ્યાય',
        part: 'ભાગ',
        ch1Title: 'જન્મ લગ્ન ચક્ર અને ગ્રહ સ્પષ્ટ',
        ch2Title: 'અવકહડા ચક્ર અને જન્મ પંચાંગ',
        ch3Title: 'નવગ્રહ સ્થિતિ અને પુરુષાર્થ',
        ch4Title: 'વિંશોત્તરી મહાદશા કાળચક્ર અને સાડાસાતી',
        epilogueTitle: 'ઉપસંહાર અને વૈદિક આશીર્વાદ'
      },
      bhavaPillars: {
        selectHouse: 'ભાવ પસંદ કરો:',
        rashi: 'રાશિ',
        lord: 'ભાવેશ',
        karaka: 'કારક',
        anatomy: 'શરીર અંગ',
        element: 'તત્ત્વ',
        purushartha: 'પુરુષાર્થ',
        lifeDomain: 'જીવન ક્ષેત્ર અને કારકત્વ:',
        occupyingPlanets: 'સ્થિત ગ્રહો:',
        noPlanets: 'કોઈ પ્રત્યક્ષ ગ્રહ નથી; ભાવેશ દ્વારા સંચાલિત.',
        analysisTitle: 'ઊંડાણપૂર્વક જ્યોતિષીય વિશ્લેષણ:',
        boonsTitle: 'શુભ ફળો અને કૃપા:',
        cautionsTitle: 'સતર્કતા અને પડકારો:',
        upayasTitle: 'વૈદિક ઉપાયો અને મંત્ર:',
        counselTitle: 'કર્મ સિદ્ધિ સલાહ:',
        continuationBanner: 'વિસ્તૃત વિગતો: આ ભાવના શુભ ફળ અને ઉપાયો આગળના પૃષ્ઠ પર જુઓ.',
        goToPart2: 'ભાગ ૨',
        points: 'મુદ્દા',
        remediesCount: 'ઉપાય'
      },
      navigation: {
        prevPage: 'પાછલું પૃષ્ઠ',
        nextPage: 'આગલું પૃષ્ઠ',
        pageLabel: 'પૃષ્ઠ',
        ofLabel: 'માંથી',
        coverOption: 'પૃષ્ઠ ૧: મુખપૃષ્ઠ',
        chartOption: 'પૃષ્ઠ ૨: જન્મ લગ્ન ચક્ર',
        panchangaOption: 'પૃષ્ઠ ૩: અવકહડા અને પંચાંગ',
        navagrahaOption: 'પૃષ્ઠ ૪: નવગ્રહ અને પુરુષાર્થ',
        mahadashaOption: 'પૃષ્ઠ ૫: મહાદશા અને સાડાસાતી',
        epilogueOption: 'ઉપસંહાર અને મંત્ર'
      },
      footers: {
        bookName: 'જન્મ કુંડળી સંહિતા',
        pagePrefix: 'પૃષ્ઠ',
        coverFooter: 'પ્રમાણિત કુંડળી',
        chartFooter: 'જન્મ લગ્ન ચક્ર',
        panchangaFooter: 'જન્મ પંચાંગ',
        navagrahaFooter: 'નવગ્રહ સ્થિતિ',
        mahadashaFooter: 'મહાદશા અને સાડાસાતી',
        bhavaFooter: 'દ્વાદશ ભાવ સંહિતા',
        epilogueFooter: 'શાંતિ મંત્ર'
      },
      cover: {
        title: 'બૃહત્ જન્મ કુંડળી ગ્રંથ',
        subtitle: 'વૈદિક જીવન પત્રિકા',
        treatise: 'કર્મ વિપાક સંહિતા અને જીવન માર્ગદર્શક',
        nativeName: 'જાતકનું નામ',
        dob: 'જન્મ તારીખ',
        tob: 'જન્મ સમય',
        pob: 'જન્મ સ્થળ',
        system: 'પદ્ધતિ'
      },
      panchanga: {
        varna: '૧. વર્ણ',
        vashya: '૨. વશ્ય',
        yoni: '૩. યોનિ',
        gana: '૪. ગણ',
        nadi: '૫. નાડી',
        paya: '૬. પાયા',
        element: '૭. તત્ત્વ',
        tithi: '૮. તિથિ',
        manglikTitle: 'માંગલિક દોષ વિચાર',
        manglikActive: 'માંગલિક પ્રભાવ સક્રિય',
        manglikNirdosha: 'નિર્દોષ (કોઈ માંગલિક દોષ નથી)',
        luckyTitle: 'શુભ તત્ત્વો',
        gemstone: 'રત્ન:',
        metal: 'ધાતુ:',
        color: 'રંગ:',
        direction: 'દિશા:'
      },
      mahadasha: {
        title: 'વિંશોત્તરી મહાદશા અને સાડાસાતી',
        subtitle: '૧૨૦ વર્ષનું કાળચક્ર',
        activeSeal: 'સક્રિય',
        sadesatiTitle: 'શનિ સાડાસાતી ચક્ર'
      }
    };
  }

  // Default to Hindi
  return {
    planetHeaders: {
      planet: 'ग्रह',
      sign: 'राशि',
      house: 'भाव',
      dignity: 'स्थिति'
    },
    cardinalPoints: {
      starLord: 'नक्षत्र स्वामी',
      subLord: 'उप स्वामी',
      nakshatra: 'जन्म नक्षत्र',
      moonSign: 'चन्द्र राशि'
    },
    chapterLabels: {
      chapter: 'अध्याय',
      part: 'भाग',
      ch1Title: 'जन्म लग्न चक्र एवं ग्रह स्पष्ट स्थिति',
      ch2Title: 'अवकहड़ा चक्र एवं जन्म पंचांग (८ मूलभूत आधार)',
      ch3Title: 'नवग्रह स्थिति एवं पुरुषार्थ चतुष्टय',
      ch4Title: 'विंशोत्तरी महादशा काल चक्र एवं साढ़ेसाती',
      epilogueTitle: 'उपसंहार, वैदिक महामन्त्र एवं आशीर्वाद'
    },
    bhavaPillars: {
      selectHouse: 'भाव चयन:',
      rashi: 'राशि',
      lord: 'भावेश',
      karaka: 'स्थिर कारक',
      anatomy: 'शरीर अंग',
      element: 'तत्त्व',
      purushartha: 'पुरुषार्थ',
      lifeDomain: 'जीवन क्षेत्र एवं कारकत्व:',
      occupyingPlanets: 'स्थित ग्रह:',
      noPlanets: 'कोई प्रत्यक्ष ग्रह स्थित नहीं; संपूर्ण फल भावेश एवं दृष्टियों द्वारा नियंत्रित।',
      analysisTitle: 'गहन ज्योतिषीय विश्लेषण:',
      boonsTitle: 'शुभ फल एवं ग्रह कृपा:',
      cautionsTitle: 'सतर्कता एवं चुनौतियाँ:',
      upayasTitle: 'वैदिक उपाय, मन्त्र एवं अनुष्ठान:',
      counselTitle: 'कर्म सिद्धि परामर्श:',
      continuationBanner: 'विस्तृत विवरण जारी: इस भाव के शुभ फल, सतर्कता एवं वैदिक उपाय आगामी पृष्ठ पर देखें।',
      goToPart2: 'भाग २',
      points: 'बिंदु',
      remediesCount: 'उपचार'
    },
    navigation: {
      prevPage: 'पिछला पृष्ठ',
      nextPage: 'अगला पृष्ठ',
      pageLabel: 'पृष्ठ',
      ofLabel: 'कुल',
      coverOption: 'पृष्ठ १: शाही मुखपृष्ठ',
      chartOption: 'पृष्ठ २: जन्म लग्न चक्र एवं ग्रह स्पष्ट',
      panchangaOption: 'पृष्ठ ३: अवकहड़ा चक्र एवं जन्म पंचांग',
      navagrahaOption: 'पृष्ठ ४: नवग्रह स्थिति एवं पुरुषार्थ',
      mahadashaOption: 'पृष्ठ ५: विंशोत्तरी महादशा एवं साढ़ेसाती',
      epilogueOption: 'उपसंहार एवं मन्त्र'
    },
    footers: {
      bookName: 'जन्म कुण्डली संहिता',
      pagePrefix: 'पृष्ठ',
      coverFooter: 'ज्योतिषपीठ प्रमाणीकरण',
      chartFooter: 'जन्म लग्न चक्र',
      panchangaFooter: 'जन्म पंचांग',
      navagrahaFooter: 'नवग्रह स्थिति',
      mahadashaFooter: 'महादशा एवं साढ़ेसाती',
      bhavaFooter: 'द्वादश भाव विस्तृत संहिता',
      epilogueFooter: 'शान्ति मन्त्र'
    },
    cover: {
      title: 'बृहत् जन्म कुण्डली ग्रन्थ',
      subtitle: 'शाही वैदिक जन्म पत्रिका',
      treatise: 'कर्म विपाक संहिता एवं जीवन मार्गदर्शक ग्रन्थ',
      nativeName: 'जातकाभिधान (जातक का नाम)',
      dob: 'जन्म तिथि',
      tob: 'जन्म समय',
      pob: 'जन्म स्थान',
      system: 'सिद्धान्त'
    },
    panchanga: {
      varna: '१. वर्ण (आत्मिक प्रकृति)',
      vashya: '२. वश्य (प्रभाव व सामंजस्य)',
      yoni: '३. योनि (प्रवृत्तिमूलक स्वभाव)',
      gana: '४. गण (चरित्र व स्वभाव)',
      nadi: '५. नाड़ी (जैविक ऊर्जा व स्वास्थ्य)',
      paya: '६. पाया (आधारभूत स्थिति)',
      element: '७. तत्त्व (मूलभूत ऊर्जा)',
      tithi: '८. पक्ष व तिथि',
      manglikTitle: 'माङ्गलिक दोष विचार',
      manglikActive: 'माङ्गलिक प्रभाव सक्रिय',
      manglikNirdosha: 'निर्दोष (कोई माङ्गलिक दोष नहीं)',
      luckyTitle: 'शुभ तत्त्व सारिणी',
      gemstone: 'रत्न:',
      metal: 'धातु:',
      color: 'रंग:',
      direction: 'दिशा:'
    },
    mahadasha: {
      title: 'विंशोत्तरी महादशा काल चक्र एवं साढ़ेसाती',
      subtitle: '१२० वर्षीय ग्रह काल चक्र',
      activeSeal: 'सक्रिय',
      sadesatiTitle: 'शनि साढ़ेसाती चक्र (चन्द्र राशि अनुसार)'
    }
  };
};

