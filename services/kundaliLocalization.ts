import { Language } from '../types';

/**
 * Universal text cleaner to strip raw Markdown asterisks (*, **, ***),
 * hashes, and formatting artifacts from plain text displays.
 */
export const stripAsterisksAndMarkdown = (text: string | undefined | null, language?: Language): string => {
  if (!text) return '';
  let cleaned = text
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

  if (language && language !== 'English') {
    // Strip pure English-only parentheticals like (Health, Self & Vitality), (Tanu Bhava), etc.
    cleaned = cleaned.replace(/\s*\([a-zA-Z\s,&'\/\.\-0-9]+\)/g, '');
  } else if (language === 'English') {
    // Strip Indic/Devanagari parentheticals in English mode
    cleaned = cleaned.replace(/\s*\([^\x00-\x7F]+\)/g, '');
  }

  return cleaned.trim();
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
    ch1Part1Title: string;
    ch1Part2Title: string;
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
    rulerLabel: string;
    karakaLabel: string;
  };
  navigation: {
    prevPage: string;
    nextPage: string;
    pageLabel: string;
    ofLabel: string;
    coverOption: string;
    chartOption: string;
    sphutaOption: string;
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
    sphutaFooter: string;
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
    defaultNativeName: string;
  };
  panchanga: {
    varna: string;
    varnaDesc: string;
    vashya: string;
    vashyaDesc: string;
    yoni: string;
    yoniDesc: string;
    gana: string;
    nadi: string;
    nadiDesc: string;
    paya: string;
    payaDesc: string;
    element: string;
    elementDesc: string;
    tithi: string;
    manglikTitle: string;
    manglikActive: string;
    manglikNirdosha: string;
    pariharaText: string;
    cautionBadge: string;
    auspiciousBadge: string;
    luckyTitle: string;
    gemstone: string;
    metal: string;
    color: string;
    direction: string;
  };
  purusharthaDetails: {
    dharmaTitle: string;
    dharmaDesc: string;
    arthaTitle: string;
    arthaDesc: string;
    kamaTitle: string;
    kamaDesc: string;
    mokshaTitle: string;
    mokshaDesc: string;
  };
  lagnaCard: {
    titleTemplate: (sign: string) => string;
    descTemplate: (sign: string) => string;
  };
  sphutaCard: {
    title: string;
    desc: string;
  };
  insightCard: {
    title: string;
    desc: string;
  };
  mahadasha: {
    title: string;
    subtitle: string;
    activeSeal: string;
    activeBadge: string;
    sadesatiTitle: string;
  };
  counsel: {
    counselTemplate: (lord: string, karaka: string, domain: string) => string;
  };
  epilogue: {
    headerTitle: string;
    mantra1Label: string;
    mantra2Label: string;
    sealBadge: string;
    sealTitle: string;
    sealCalculations: (systemName: string) => string;
    refIdPrefix: string;
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
    Jupiter: 'गुरु',
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
    Jupiter: 'വ്യാഴം',
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
    Exalted: 'তুঙ্গী',
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

export const PURUSHARTHA_TRANSLATIONS: Record<Language, Record<string, string>> = {
  English: { Dharma: 'Dharma', Artha: 'Artha', Kama: 'Kama', Moksha: 'Moksha' },
  Hindi: { Dharma: 'धर्म', Artha: 'अर्थ', Kama: 'काम', Moksha: 'मोक्ष' },
  Marathi: { Dharma: 'धर्म', Artha: 'अर्थ', Kama: 'काम', Moksha: 'मोक्ष' },
  Gujarati: { Dharma: 'ધર્મ', Artha: 'અર્થ', Kama: 'કામ', Moksha: 'મોક્ષ' },
  Bengali: { Dharma: 'ধর্ম', Artha: 'অর্থ', Kama: 'কাম', Moksha: 'মোক্ষ' },
  Tamil: { Dharma: 'தர்மம்', Artha: 'அர்த்தம்', Kama: 'காமம்', Moksha: 'மோட்சம்' },
  Telugu: { Dharma: 'ధర్మం', Artha: 'అర్థం', Kama: 'కామం', Moksha: 'మోక్షం' },
  Kannada: { Dharma: 'ಧರ್ಮ', Artha: 'ಅರ್ಥ', Kama: 'ಕಾಮ', Moksha: 'ಮೋಕ್ಷ' },
  Malayalam: { Dharma: 'ധർമ്മം', Artha: 'അർത്ഥം', Kama: 'കാമം', Moksha: 'മോക്ഷം' },
  Punjabi: { Dharma: 'ਧਰਮ', Artha: 'ਅਰਥ', Kama: 'ਕਾਮ', Moksha: 'ਮੋਖ' },
  Odia: { Dharma: 'ଧର୍ମ', Artha: 'ଅର୍ଥ', Kama: 'କାମ', Moksha: 'ମୋକ୍ଷ' }
};

export const ELEMENT_TRANSLATIONS: Record<Language, Record<string, string>> = {
  English: { Fire: 'Fire', Earth: 'Earth', Air: 'Air', Water: 'Water' },
  Hindi: { Fire: 'अग्नि', Earth: 'पृथ्वी', Air: 'वायु', Water: 'जल' },
  Marathi: { Fire: 'अग्नी', Earth: 'पृथ्वी', Air: 'वायू', Water: 'जल' },
  Gujarati: { Fire: 'અગ્નિ', Earth: 'પૃથ્વી', Air: 'વાયુ', Water: 'જળ' },
  Bengali: { Fire: 'অগ্নি', Earth: 'পৃথিবী', Air: 'বায়ু', Water: 'জল' },
  Tamil: { Fire: 'நெருப்பு', Earth: 'நிலம்', Air: 'காற்று', Water: 'நீர்' },
  Telugu: { Fire: 'అగ్ని', Earth: 'పృథ్వి', Air: 'వాయువు', Water: 'జలం' },
  Kannada: { Fire: 'ಅಗ್ನಿ', Earth: 'ಪೃಥ್ವಿ', Air: 'ವಾಯು', Water: 'ಜಲ' },
  Malayalam: { Fire: 'അഗ്നി', Earth: 'ഭൂമി', Air: 'വായു', Water: 'ജലം' },
  Punjabi: { Fire: 'ਅਗਨੀ', Earth: 'ਪ੍ਰਿਥਵੀ', Air: 'ਵਾਯੂ', Water: 'ਜਲ' },
  Odia: { Fire: 'ଅଗ୍ନି', Earth: 'ପୃଥିବୀ', Air: 'ବାୟୁ', Water: 'ଜଳ' }
};

export const CLASSIFICATION_TRANSLATIONS: Record<Language, Record<string, string>> = {
  English: {
    Kendra: 'Kendra (Cardinal Pillar)',
    Trikona: 'Trikona (Trine of Fortune)',
    Panaphara: 'Panaphara (Succedent)',
    Apoklima: 'Apoklima (Cadent)',
    Dusthana: 'Dusthana (Karmic Friction)'
  },
  Hindi: {
    Kendra: 'केन्द्र स्थान',
    Trikona: 'त्रिकोण स्थान',
    Panaphara: 'पणफर स्थान',
    Apoklima: 'अपोक्लिम स्थान',
    Dusthana: 'त्रिक / दुःस्थान'
  },
  Marathi: {
    Kendra: 'केंद्र स्थान',
    Trikona: 'त्रिकोण स्थान',
    Panaphara: 'पणफर स्थान',
    Apoklima: 'अपोक्लिम स्थान',
    Dusthana: 'त्रिक / दुःख स्थान'
  },
  Gujarati: {
    Kendra: 'કેન્દ્ર સ્થાન',
    Trikona: 'ત્રિકોણ સ્થાન',
    Panaphara: 'પણફર સ્થાન',
    Apoklima: 'અપોક્લિમ સ્થાન',
    Dusthana: 'ત્રિક / દુઃસ્થાન'
  },
  Bengali: {
    Kendra: 'কেন্দ্র স্থান',
    Trikona: 'ত্রিকোণ স্থান',
    Panaphara: 'পণফর স্থান',
    Apoklima: 'অপোক্লিম স্থান',
    Dusthana: 'ত্রিক / দুঃস্থান'
  },
  Tamil: {
    Kendra: 'கேந்திர ஸ்தானம்',
    Trikona: 'திரிகோண ஸ்தானம்',
    Panaphara: 'பணபர ஸ்தானம்',
    Apoklima: 'அப்போக்லிம ஸ்தானம்',
    Dusthana: 'துர்ஸ்தானம்'
  },
  Telugu: {
    Kendra: 'కేంద్ర స్థానం',
    Trikona: 'త్రికోణ స్థానం',
    Panaphara: 'పణఫర స్థానం',
    Apoklima: 'అపోక్లిమ స్థానం',
    Dusthana: 'దుస్థానం'
  },
  Kannada: {
    Kendra: 'ಕೇಂದ್ರ ಸ್ಥಾನ',
    Trikona: 'ತ್ರಿಕೋಣ ಸ್ಥಾನ',
    Panaphara: 'ಪಣಫರ ಸ್ಥಾನ',
    Apoklima: 'ಅಪೋಕ್ಲಿಮ ಸ್ಥಾನ',
    Dusthana: 'ದುಃಸ್ಥಾನ'
  },
  Malayalam: {
    Kendra: 'കേന്ദ്ര സ്ഥാനം',
    Trikona: 'ത്രികോണ സ്ഥാനം',
    Panaphara: 'പണഫര സ്ഥാനം',
    Apoklima: 'അപോക്ലിമ സ്ഥാനം',
    Dusthana: 'ദുസ്ഥാനം'
  },
  Punjabi: {
    Kendra: 'ਕੇਂਦਰ ਸਥਾਨ',
    Trikona: 'ਤ੍ਰਿਕੋਣ ਸਥਾਨ',
    Panaphara: 'ਪਣਫਰ ਸਥਾਨ',
    Apoklima: 'ਅਪੋਕਲਿਮ ਸਥਾਨ',
    Dusthana: 'ਦੁਸਥਾਨ'
  },
  Odia: {
    Kendra: 'କେନ୍ଦ୍ର ସ୍ଥାନ',
    Trikona: 'ତ୍ରିକୋଣ ସ୍ଥାନ',
    Panaphara: 'ପଣଫର ସ୍ଥାନ',
    Apoklima: 'ଅପୋକ୍ଲିମ ସ୍ଥାନ',
    Dusthana: 'ଦୁଃସ୍ଥାନ'
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
  if (dLower.includes('exalt') || dLower.includes('उच्च') || dLower.includes('ઉચ્ચ') || dLower.includes('உச்ச')) baseKey = 'Exalted';
  else if (dLower.includes('moolatrikona') || dLower.includes('मूल') || dLower.includes('મૂળ')) baseKey = 'Moolatrikona';
  else if (dLower.includes('own') || dLower.includes('स्व') || dLower.includes('સ્વ') || dLower.includes('ஆட்சி')) baseKey = 'Own Sign';
  else if (dLower.includes('debilitat') || dLower.includes('नीच') || dLower.includes('નીચ') || dLower.includes('நீச')) baseKey = 'Debilitated';
  else if (dLower.includes('enemy') || dLower.includes('शत्रु') || dLower.includes('शत्रू') || dLower.includes('பகை')) baseKey = 'Enemy';
  else if (dLower.includes('neutral') || dLower.includes('सम') || dLower.includes('சம')) baseKey = 'Neutral';
  else if (dLower.includes('friend') || dLower.includes('मित्र') || dLower.includes('મિત્ર') || dLower.includes('நட்பு')) baseKey = 'Friendly';

  return DIGNITY_TRANSLATIONS[language]?.[baseKey] || DIGNITY_TRANSLATIONS.English[baseKey];
};

/**
 * Normalizes Purushartha life pillar to clean localized label.
 */
export const getLocalizedPurushartha = (purushartha: string, language: Language): string => {
  const pLower = (purushartha || '').toLowerCase();
  let key = 'Dharma';
  if (pLower.includes('dharma') || pLower.includes('धर्म') || pLower.includes('ધર્મ') || pLower.includes('தர்ம')) key = 'Dharma';
  else if (pLower.includes('artha') || pLower.includes('अर्थ') || pLower.includes('અર્થ') || pLower.includes('அர்த்த')) key = 'Artha';
  else if (pLower.includes('kama') || pLower.includes('काम') || pLower.includes('કામ') || pLower.includes('காம')) key = 'Kama';
  else if (pLower.includes('moksha') || pLower.includes('मोक्ष') || pLower.includes('મોક્ષ') || pLower.includes('மோட்ச')) key = 'Moksha';

  return PURUSHARTHA_TRANSLATIONS[language]?.[key] || PURUSHARTHA_TRANSLATIONS.English[key];
};

/**
 * Normalizes Element (Fire, Earth, Air, Water) to clean localized label.
 */
export const getLocalizedElement = (element: string, language: Language): string => {
  const eLower = (element || '').toLowerCase();
  let key = 'Fire';
  if (eLower.includes('fire') || eLower.includes('अग्नि') || eLower.includes('अग्नी') || eLower.includes('અગ્નિ') || eLower.includes('நெரு')) key = 'Fire';
  else if (eLower.includes('earth') || eLower.includes('पृथ्वी') || eLower.includes('પૃથ્વી') || eLower.includes('நில') || eLower.includes('ഭൂ')) key = 'Earth';
  else if (eLower.includes('air') || eLower.includes('वायु') || eLower.includes('वायू') || eLower.includes('વાયુ') || eLower.includes('காற்')) key = 'Air';
  else if (eLower.includes('water') || eLower.includes('जल') || eLower.includes('जळ') || eLower.includes('நீர்')) key = 'Water';

  return ELEMENT_TRANSLATIONS[language]?.[key] || ELEMENT_TRANSLATIONS.English[key];
};

/**
 * Normalizes House Classification to clean localized label.
 */
export const getLocalizedClassification = (classification: string, language: Language): string => {
  const cLower = (classification || '').toLowerCase();
  let key = 'Kendra';
  if (cLower.includes('kendra') || cLower.includes('केंद्र') || cLower.includes('केन्द्र') || cLower.includes('கேந்திர')) key = 'Kendra';
  else if (cLower.includes('trikona') || cLower.includes('त्रिकोण') || cLower.includes('திரிகோண')) key = 'Trikona';
  else if (cLower.includes('panaphara') || cLower.includes('पणफर') || cLower.includes('பணபர')) key = 'Panaphara';
  else if (cLower.includes('apoklima') || cLower.includes('अपोक्लिम') || cLower.includes('அப்போக்')) key = 'Apoklima';
  else if (cLower.includes('dusthana') || cLower.includes('trik') || cLower.includes('त्रिक') || cLower.includes('दुःस्थान') || cLower.includes('துர்')) key = 'Dusthana';

  return CLASSIFICATION_TRANSLATIONS[language]?.[key] || CLASSIFICATION_TRANSLATIONS.English[key];
};

/**
 * Normalizes Paya (astrological footing) to clean localized label across all 11 languages.
 */
export const getLocalizedPaya = (paya: string, language: Language): string => {
  const pLower = (paya || '').toLowerCase();
  let key: 'Silver' | 'Copper' | 'Gold' | 'Iron' = 'Silver';
  if (pLower.includes('silver') || pLower.includes('rajata') || pLower.includes('रजत') || pLower.includes('चांदी')) key = 'Silver';
  else if (pLower.includes('copper') || pLower.includes('tamra') || pLower.includes('ताम्र') || pLower.includes('तांबा')) key = 'Copper';
  else if (pLower.includes('gold') || pLower.includes('suvarna') || pLower.includes('स्वर्ण') || pLower.includes('सोना')) key = 'Gold';
  else if (pLower.includes('iron') || pLower.includes('lauha') || pLower.includes('लोहा') || pLower.includes('लोखंड')) key = 'Iron';

  const PAYA_MAP: Record<Language, Record<'Silver' | 'Copper' | 'Gold' | 'Iron', string>> = {
    English: { Silver: 'Silver (Rajata)', Copper: 'Copper (Tamra)', Gold: 'Gold (Suvarna)', Iron: 'Iron (Lauha)' },
    Marathi: { Silver: 'रौप्य पाया', Copper: 'ताम्र पाया', Gold: 'सुवर्ण पाया', Iron: 'लोखंडी पाया' },
    Hindi: { Silver: 'रजत पाया', Copper: 'ताम्र पाया', Gold: 'स्वर्ण पाया', Iron: 'लौह पाया' },
    Gujarati: { Silver: 'રૂપેરી પાયો', Copper: 'તાંબા પાયો', Gold: 'સુવર્ણ પાયો', Iron: 'લોખંડ પાયો' },
    Bengali: { Silver: 'রৌপ্য পায়া', Copper: 'তাম্র পায়া', Gold: 'স্বর্ণ পায়া', Iron: 'লৌহ পায়া' },
    Tamil: { Silver: 'வெள்ளி பாதம்', Copper: 'செம்பு பாதம்', Gold: 'பொன் பாதம்', Iron: 'இரும்பு பாதம்' },
    Telugu: { Silver: 'వెండి పాదం', Copper: 'రాగి పాదం', Gold: 'సువర్ణ పాదం', Iron: 'ఇనుప పాదం' },
    Kannada: { Silver: 'ಬೆಳ್ಳಿ ಪಾದ', Copper: 'ತಾಮ್ರ ಪಾದ', Gold: 'ಸುವರ್ಣ ಪಾದ', Iron: 'ಕಬ್ಬಿಣ ಪಾದ' },
    Malayalam: { Silver: 'വെള്ളി പാദം', Copper: 'ചെമ്പ് പാദം', Gold: 'സ്വർണ്ണ പാദം', Iron: 'ഇരുമ്പ് പാദം' },
    Punjabi: { Silver: 'ਚਾਂਦੀ ਦਾ ਪਾਵਾ', Copper: 'ਤਾਂਬੇ ਦਾ ਪਾਵਾ', Gold: 'ਸੋਨੇ ਦਾ ਪਾਵਾ', Iron: 'ਲੋਹੇ ਦਾ ਪਾਵਾ' },
    Odia: { Silver: 'ରୂପା ପାଦ', Copper: 'ତମ୍ବା ପାଦ', Gold: 'ସୁବର୍ଣ୍ଣ ପାଦ', Iron: 'ଲୁହା ପାଦ' }
  };

  return PAYA_MAP[language]?.[key] || PAYA_MAP.English[key];
};

/**
 * Comprehensive UI strings localized for all 11 supported languages.
 */
export const getKundaliLocale = (language: Language): KundaliLocaleData => {
  switch (language) {
    case 'English':
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
          ch1Part1Title: 'Ascendant Birth Chart & Astral Coordinates',
          ch1Part2Title: 'Graha Sphuta • Planetary Degrees & Dignities Table',
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
          remediesCount: 'remedies',
          rulerLabel: 'Ruler Planet',
          karakaLabel: 'Significator'
        },
        navigation: {
          prevPage: 'Previous Page',
          nextPage: 'Next Page',
          pageLabel: 'Page',
          ofLabel: 'of',
          coverOption: 'Page 1: Royal Book Cover',
          chartOption: 'Page 2: Janma Kundali & Chart',
          sphutaOption: 'Page 3: Graha Sphuta & Planetary Table',
          panchangaOption: 'Page 4: Avakahada & Panchanga',
          navagrahaOption: 'Page 5: Navagraha & Purushartha',
          mahadashaOption: 'Page 6: Vimshottari Mahadasha & Sade Sati',
          epilogueOption: 'Epilogue & Mantras'
        },
        footers: {
          bookName: 'Janma Kundali Codex',
          pagePrefix: 'Page',
          coverFooter: 'Certified Royal Patrika',
          chartFooter: 'Ascendant Birth Chart',
          sphutaFooter: 'Graha Sphuta Table',
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
          system: 'System',
          defaultNativeName: 'Jataka (Seeker)'
        },
        panchanga: {
          varna: '1. Varna',
          varnaDesc: 'Spiritual Temperament',
          vashya: '2. Vashya',
          vashyaDesc: 'Dominance & Alignment',
          yoni: '3. Yoni',
          yoniDesc: 'Instinctive Nature',
          gana: '4. Gana',
          nadi: '5. Nadi',
          nadiDesc: 'Bio-Energetic Pulse',
          paya: '6. Paya',
          payaDesc: 'Foundational Base',
          element: '7. Tatva',
          elementDesc: 'Elemental Core',
          tithi: '8. Tithi & Lunar Day',
          manglikTitle: 'Manglik Dosha Assessment',
          manglikActive: 'Active Manglik Influence',
          manglikNirdosha: 'Nir-dosha (No Manglik Affliction)',
          pariharaText: 'Parihara (Nullification) Present',
          cautionBadge: 'Caution',
          auspiciousBadge: 'Auspicious',
          luckyTitle: 'Sacred Auspicious Matrix',
          gemstone: 'Gemstone:',
          metal: 'Metal:',
          color: 'Color:',
          direction: 'Direction:'
        },
        purusharthaDetails: {
          dharmaTitle: 'Dharma (Houses 1, 5, 9)',
          dharmaDesc: 'Soul purpose, righteousness & spiritual duty',
          arthaTitle: 'Artha (Houses 2, 6, 10)',
          arthaDesc: 'Wealth, career, financial assets & material security',
          kamaTitle: 'Kama (Houses 3, 7, 11)',
          kamaDesc: 'Aspirations, love, desires & creative expression',
          mokshaTitle: 'Moksha (Houses 4, 8, 12)',
          mokshaDesc: 'Spiritual liberation, inner peace & detachment'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `Ascendant Sign: ${sign} (Lagna House 1)`,
          descTemplate: (sign: string) => `The Ascendant (Lagna) represents the physical incarnation, vitality, and primary orientation of consciousness. With ${sign} rising at the eastern horizon during birth, your life operates with innate purpose, distinct individuality, and continuous evolution. Detailed planetary longitudes and dignities are presented on the subsequent page.`
        },
        sphutaCard: {
          title: 'Planetary Dignity & Cosmic Strength (Shadbala Matrix):',
          desc: 'In authentic Vedic Jyotish, planetary strength and dignity determine the potency with which a Graha delivers its karmic results. Planets in Exaltation or Own Sign bestow heightened boons with ease, while planets in Debilitation or Enemy Signs encourage conscious discipline, patience, and classical remedial propitiation.'
        },
        insightCard: {
          title: 'Astrological Insight:',
          desc: 'The planetary dispositions in your Janma Kundali reflect accumulated karmic predispositions. Harmonious planetary alignment across the four Purusharthas indicates that conscious action, ethical dedication, and timely remedies bring balance and fruition.'
        },
        mahadasha: {
          title: 'Vimshottari Mahadasha Timeline & Sade Sati',
          subtitle: '120-Year Planetary Cycles',
          activeSeal: 'Active',
          activeBadge: 'Current Period Marked Active',
          sadesatiTitle: 'Saturn Sade Sati Cycles (Relative to Moon)'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `The ruler of this house is ${lord} and natural significator is ${karaka}. Diligent adherence to these classical upayas balances transit challenges and promotes auspicious fruition across ${domain}.`
        },
        epilogue: {
          headerTitle: 'Sacred Mantras & Astrological Colophon',
          mantra1Label: 'Maha Mrityunjaya Mantra (Life Vitality & Protection)',
          mantra2Label: 'Gayatri Mantra (Intellectual Illumination)',
          sealBadge: 'Certified Jyotish',
          sealTitle: 'Vedic Astrology Bureau Seal',
          sealCalculations: (sys: string) => `Cast under ${sys} Calculations`,
          refIdPrefix: 'Ref ID: WMS-'
        }
      };

    case 'Marathi':
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
          ch1Part1Title: 'जन्म लग्न चक्र आणि खगोलीय निर्देशक',
          ch1Part2Title: 'ग्रह स्पष्ट • नवग्रह स्थिती, राशी व अंश तालिका',
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
          remediesCount: 'उपाय',
          rulerLabel: 'राशी स्वामी',
          karakaLabel: 'स्थिर कारक'
        },
        navigation: {
          prevPage: 'मागील पृष्ठ',
          nextPage: 'पुढील पृष्ठ',
          pageLabel: 'पृष्ठ',
          ofLabel: 'पैकी',
          coverOption: 'पृष्ठ १: मुख्य पृष्ठ',
          chartOption: 'पृष्ठ २: जन्म लग्न चक्र',
          sphutaOption: 'पृष्ठ ३: ग्रह स्पष्ट व ग्रह स्थिती',
          panchangaOption: 'पृष्ठ ४: अवकहडा आणि पंचांग',
          navagrahaOption: 'पृष्ठ ५: नवग्रह आणि पुरुषार्थ',
          mahadashaOption: 'पृष्ठ ६: महादशा आणि साडेसाती',
          epilogueOption: 'उपसंहार आणि मंत्र'
        },
        footers: {
          bookName: 'जन्म कुंडली संहिता',
          pagePrefix: 'पृष्ठ',
          coverFooter: 'प्रमाणीकृत कुंडली',
          chartFooter: 'जन्म लग्न चक्र',
          sphutaFooter: 'ग्रह स्पष्ट तालिका',
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
          system: 'पद्धती',
          defaultNativeName: 'जातक'
        },
        panchanga: {
          varna: '१. वर्ण',
          varnaDesc: 'आत्मिक प्रवृत्ती',
          vashya: '२. वश्य',
          vashyaDesc: 'प्रभाव व सामंजस्य',
          yoni: '३. योनी',
          yoniDesc: 'प्रवृत्ती व स्वभाव',
          gana: '४. गण',
          nadi: '५. नाडी',
          nadiDesc: 'आरोग्य ऊर्जा',
          paya: '६. पाया',
          payaDesc: 'पायाभूत आधार',
          element: '७. तत्त्व',
          elementDesc: 'मूलभूत तत्त्व',
          tithi: '८. तिथी व योग',
          manglikTitle: 'मांगलिक दोष विचार',
          manglikActive: 'मांगलिक प्रभाव सक्रिय',
          manglikNirdosha: 'निर्दोष (कोणताही मांगलिक दोष नाही)',
          pariharaText: 'दोष परिहार उपस्थित',
          cautionBadge: 'सावधान',
          auspiciousBadge: 'शुभ',
          luckyTitle: 'शुभ घटक',
          gemstone: 'रत्न:',
          metal: 'धातू:',
          color: 'रंग:',
          direction: 'दिशा:'
        },
        purusharthaDetails: {
          dharmaTitle: 'धर्म (भाव १, ५, ९)',
          dharmaDesc: 'आत्मिक हेतू, कर्तव्यनिष्ठा व नीतिमत्ता',
          arthaTitle: 'अर्थ (भाव २, ६, १०)',
          arthaDesc: 'धन, कारकीर्द व संचित संपत्ती',
          kamaTitle: 'काम (भाव ३, ७, ११)',
          kamaDesc: 'इच्छा, नातेसंबंध व प्रेम',
          mokshaTitle: 'मोक्ष (भाव ४, ८, १२)',
          mokshaDesc: 'मुक्ती, अध्यात्म व मनःशांती'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `जन्म लग्न राशी: ${sign} (प्रथम भाव / लग्न स्थान)`,
          descTemplate: (sign: string) => `जन्म लग्न हे आत्म्याचे स्थूल रूप, प्रकृती, शारीरिक तेज आणि विचारसरणीचे मूळ केंद्र आहे. आपल्या जन्माच्या वेळी पूर्व क्षितिजावर ${sign} राशीचा उदय झाल्यामुळे आपल्या व्यक्तिमत्त्वात दृढ आत्मविश्वास आणि स्वतंत्र विचारसरणी दिसून येते. सर्व नवग्रहांचे स्पष्ट अंश, राशी व स्थिती पुढील पानावर सविस्तर दिली आहे.`
        },
        sphutaCard: {
          title: 'ग्रह स्पष्ट व ग्रहावस्था विश्लेषण:',
          desc: 'वैदिक ज्योतिष शास्त्रानुसार ग्रहांचे अंश, राशी आणि अवस्था यावरून ग्रह किती सामर्थ्याने फळे देणार हे निश्चित होते. उच्च किंवा स्वराशीतील ग्रह शुभ फळांची सहज वृद्धी करतात, तर नीच किंवा शत्रू राशीतील ग्रह जातकाला संयम, परिश्रम आणि वैदिक उपायांची प्रेरणा देतात.'
        },
        insightCard: {
          title: 'ज्योतिषीय दृष्टी:',
          desc: 'आपल्या जन्म कुंडलीतील ग्रहांची स्थिती संचित प्रारब्ध कर्मांचे प्रतिबिंब आहे. चार पुरुषार्थांमध्ये ग्रहांचा सुसंवाद दर्शवतो की योग्य कर्म, नीतिमत्ता आणि वेळेवर केलेले वैदिक उपाय जीवनातील सर्व उद्दिष्टे साध्य करतात.'
        },
        mahadasha: {
          title: 'विंशोत्तरी महादशा कालचक्र आणि साडेसाती',
          subtitle: '१२० वर्षांची ग्रह दशा',
          activeSeal: 'सक्रिय',
          activeBadge: 'चालू महादशेवर विशेष शिक्का',
          sadesatiTitle: 'शनि साडेसाती चक्र (चंद्र राशीनुसार)'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `या भावाचे अधिपती ${lord} असून नैसर्गिक कारक ${karaka} आहेत. उल्लिखित वैदिक उपायांचे निष्ठापूर्वक पालन केल्यास गोचर ग्रहांचे अडथळे दूर होऊन ${domain} मध्ये शुभता व प्रगती प्राप्त होते.`
        },
        epilogue: {
          headerTitle: 'वैदिक महामंत्र आणि अंतिम मार्गदर्शन',
          mantra1Label: 'महामृत्युंजय मंत्र (आरोग्य व दीर्घायुष्य)',
          mantra2Label: 'गायत्री मंत्र (बुद्धी व तेज)',
          sealBadge: 'प्रमाणीकृत ज्योतिष',
          sealTitle: 'वैदिक ज्योतिष पीठ मुद्रा',
          sealCalculations: (sys: string) => `${sys} सिद्धांतानुसार प्रमाणित`,
          refIdPrefix: 'संदर्भ क्रमांक: WMS-'
        }
      };

    case 'Gujarati':
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
          ch1Part1Title: 'જન્મ લગ્ન ચક્ર અને ખગોળીય નિર્દેશાંક',
          ch1Part2Title: 'ગ્રહ સ્પષ્ટ • નવગ્રહ સ્થિતિ અને રાશિ પત્રક',
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
          remediesCount: 'ઉપાય',
          rulerLabel: 'રાશિ સ્વામી',
          karakaLabel: 'સ્થિર કારક'
        },
        navigation: {
          prevPage: 'પાછલું પૃષ્ઠ',
          nextPage: 'આગલું પૃષ્ઠ',
          pageLabel: 'પૃષ્ઠ',
          ofLabel: 'માંથી',
          coverOption: 'પૃષ્ઠ ૧: મુખપૃષ્ઠ',
          chartOption: 'પૃષ્ઠ ૨: જન્મ લગ્ન ચક્ર',
          sphutaOption: 'પૃષ્ઠ ૩: ગ્રહ સ્પષ્ટ અને ગ્રહ સ્થિતિ',
          panchangaOption: 'પૃષ્ઠ ૪: અવકહડા અને પંચાંગ',
          navagrahaOption: 'પૃષ્ઠ ૫: નવગ્રહ અને પુરુષાર્થ',
          mahadashaOption: 'પૃષ્ઠ ૬: મહાદશા અને સાડાસાતી',
          epilogueOption: 'ઉપસંહાર અને મંત્ર'
        },
        footers: {
          bookName: 'જન્મ કુંડળી સંહિતા',
          pagePrefix: 'પૃષ્ઠ',
          coverFooter: 'પ્રમાણિત કુંડળી',
          chartFooter: 'જન્મ લગ્ન ચક્ર',
          sphutaFooter: 'ગ્રહ સ્પષ્ટ પત્રક',
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
          system: 'પદ્ધતિ',
          defaultNativeName: 'જાતક'
        },
        panchanga: {
          varna: '૧. વર્ણ',
          varnaDesc: 'આત્મિક પ્રકૃતિ',
          vashya: '૨. વશ્ય',
          vashyaDesc: 'પ્રભાવ અને સુમેળ',
          yoni: '૩. યોનિ',
          yoniDesc: 'સ્વભાવ અને પ્રવૃત્તિ',
          gana: '૪. ગણ',
          nadi: '૫. નાડી',
          nadiDesc: 'આરોગ્ય ઊર્જા',
          paya: '૬. પાયા',
          payaDesc: 'પાયાનું બળ',
          element: '૭. તત્ત્વ',
          elementDesc: 'મૂળભૂત તત્ત્વ',
          tithi: '૮. તિથિ અને યોગ',
          manglikTitle: 'માંગલિક દોષ વિચાર',
          manglikActive: 'માંગલિક પ્રભાવ સક્રિય',
          manglikNirdosha: 'નિર્દોષ (કોઈ માંગલિક દોષ નથી)',
          pariharaText: 'દોષ પરિહાર ઉપસ્થિત',
          cautionBadge: 'સાવધાન',
          auspiciousBadge: 'શુભ',
          luckyTitle: 'શુભ તત્ત્વો',
          gemstone: 'રત્ન:',
          metal: 'ધાતુ:',
          color: 'રંગ:',
          direction: 'દિશા:'
        },
        purusharthaDetails: {
          dharmaTitle: 'ધર્મ (ભાવ ૧, ૫, ૯)',
          dharmaDesc: 'આત્મિક ઉદ્દેશ્ય, કર્તવ્યનિષ્ઠા અને નૈતિકતા',
          arthaTitle: 'અર્થ (ભાવ ૨, ૬, ૧૦)',
          arthaDesc: 'ધન, આજીવિકા અને સંચિત સંપત્તિ',
          kamaTitle: 'કામ (ભાવ ૩, ૭, ૧૧)',
          kamaDesc: 'ઈચ્છાઓ, સંબંધો અને સ્નેહ',
          mokshaTitle: 'મોક્ષ (ભાવ ૪, ૮, ૧૨)',
          mokshaDesc: 'મુક્તિ, અધ્યાત્મ અને માનસિક શાંતિ'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `જન્મ લગ્ન રાશિ: ${sign} (પ્રથમ ભાવ / લગ્ન સ્થાન)`,
          descTemplate: (sign: string) => `જન્મ લગ્ન એ આત્માનું સ્થૂળ સ્વરૂપ, આરોગ્ય અને વિચારસરણીનું કેન્દ્ર છે. જન્મ સમયે પૂર્વ ક્ષિતિજ પર ${sign} રાશિ ઉદિત થવાથી આપના વ્યક્તિત્વમાં તેજ અને દ્રઢ નિર્ણયશક્તિ છે. ગ્રહોની સ્પષ્ટ સ્થિતિ આગામી પૃષ્ઠ પર વિગતવાર દર્શાવેલ છે.`
        },
        sphutaCard: {
          title: 'ગ્રહ સ્પષ્ટ અને બળાબળ સમીક્ષા:',
          desc: 'વૈદિક જ્યોતિષમાં ગ્રહોની અંશાત્મક સ્થિતિ અને બળ એ નક્કી કરે છે કે ગ્રહ કેવા ફળ આપશે. ઉચ્ચ કે સ્વરાશિના ગ્રહ શુભ ફળોમાં વૃદ્ધિ કરે છે, જ્યારે નીચ કે શત્રુ રાશિના ગ્રહ ધૈર્ય અને શાસ્ત્રીય ઉપાયોની પ્રેરણા આપે છે.'
        },
        insightCard: {
          title: 'જ્યોતિષીય દ્રષ્ટિ:',
          desc: 'આપની જન્મ કુંડળીમાં ગ્રહોની સ્થિતિ સંચિત કર્મોનું દર્પણ છે. ચારેય પુરુષાર્થોમાં સંતુલન રાખવાથી અને સમયસર શાસ્ત્રીય ઉપાય કરવાથી જીવનમાં સફળતા પ્રાપ્ત થાય છે.'
        },
        mahadasha: {
          title: 'વિંશોત્તરી મહાદશા અને સાડાસાતી',
          subtitle: '૧૨૦ વર્ષનું કાળચક્ર',
          activeSeal: 'સક્રિય',
          activeBadge: 'ચાલુ મહાદશા પર વિશેષ મુદ્રા',
          sadesatiTitle: 'શનિ સાડાસાતી ચક્ર'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `આ ભાવના અધિપતિ ${lord} અને કારક ${karaka} છે. દર્શાવેલ ઉપાયોનું પાલન કરવાથી ${domain} માં પ્રગતિ અને સુખ પ્રાપ્ત થાય છે.`
        },
        epilogue: {
          headerTitle: 'વૈદિક મહામંત્રો અને અંતિમ પરામર્શ',
          mantra1Label: 'મહામૃત્યુંજય મંત્ર (આરોગ્ય અને રક્ષણ)',
          mantra2Label: 'ગાયત્રી મંત્ર (બુદ્ધિ અને જ્ઞાન)',
          sealBadge: 'પ્રમાણિત જ્યોતિષ',
          sealTitle: 'વૈદિક જ્યોતિષ બ્યુરો મુદ્રા',
          sealCalculations: (sys: string) => `${sys} પદ્ધતિ અનુસાર પ્રમાણિત`,
          refIdPrefix: 'સંદર્ભ: WMS-'
        }
      };

    case 'Bengali':
      return {
        planetHeaders: {
          planet: 'গ্রহ',
          sign: 'রাশি',
          house: 'ভাব',
          dignity: 'স্থিতি'
        },
        cardinalPoints: {
          starLord: 'নক্ষত্র পতি',
          subLord: 'উপ পতি',
          nakshatra: 'জন্ম নক্ষত্র',
          moonSign: 'চন্দ্র রাশি'
        },
        chapterLabels: {
          chapter: 'অধ্যায়',
          part: 'ভাগ',
          ch1Title: 'জন্ম লগ্ন চক্র ও গ্রহ স্থিতি',
          ch1Part1Title: 'জন্ম লগ্ন চক্র ও জ্যোতির্বৈজ্ঞানিক স্থানাঙ্ক',
          ch1Part2Title: 'গ্রহ স্ফুট • নবগ্রহ স্থিতি ও রাশি তালিকা',
          ch2Title: 'অবকহড়া চক্র ও জন্ম পঞ্জিকা',
          ch3Title: 'নবগ্রহ অবস্থান ও চতুর্বর্গ পুরুষার্থ',
          ch4Title: 'বিংশোত্তরী মহাদশা কালচক্র ও সাড়ে সাতি',
          epilogueTitle: 'উপসংহার ও বৈদিক আশীর্বাদ'
        },
        bhavaPillars: {
          selectHouse: 'ভাব নির্বাচন:',
          rashi: 'রাশি',
          lord: 'ভাবাধিপতি',
          karaka: 'কারক',
          anatomy: 'শারীরিক অঙ্গ',
          element: 'তত্ত্ব',
          purushartha: 'পুরুষার্থ',
          lifeDomain: 'জীবন ক্ষেত্র ও মূল বিষয়:',
          occupyingPlanets: 'অবস্থিত গ্রহ:',
          noPlanets: 'কোনো প্রত্যক্ষ গ্রহ নেই; ভাবাধিপতি দ্বারা নিয়ন্ত্রিত।',
          analysisTitle: 'গভীর জ্যোতিষীয় বিশ্লেষণ:',
          boonsTitle: 'শুভ ফল ও দৈব কৃপা:',
          cautionsTitle: 'সতর্কতা ও প্রতিকূলতা:',
          upayasTitle: 'বৈদিক প্রতিকার ও মন্ত্র:',
          counselTitle: 'কর্ম সিদ্ধি পরামর্শ:',
          continuationBanner: 'বিস্তারিত বিবরণ: এই ভাবের শুভ ফল ও প্রতিকার পরবর্তী পৃষ্ঠায় দেখুন।',
          goToPart2: 'ভাগ ২',
          points: 'বিন্দু',
          remediesCount: 'প্রতিকার',
          rulerLabel: 'রাশি পতি',
          karakaLabel: 'স্থির কারক'
        },
        navigation: {
          prevPage: 'পূর্ববর্তী পৃষ্ঠা',
          nextPage: 'পরবর্তী পৃষ্ঠা',
          pageLabel: 'পৃষ্ঠা',
          ofLabel: 'এর',
          coverOption: 'পৃষ্ঠা ১: রাজকীয় প্রচ্ছদ',
          chartOption: 'পৃষ্ঠা ২: জন্ম লগ্ন চক্র',
          sphutaOption: 'পৃষ্ঠা ৩: গ্রহ স্ফুট ও গ্রহ স্থিতি',
          panchangaOption: 'পৃষ্ঠা ৪: অবকহড়া ও পঞ্জিকা',
          navagrahaOption: 'পৃষ্ঠা ৫: নবগ্রহ ও পুরুষার্থ',
          mahadashaOption: 'পৃষ্ঠা ৬: মহাদশা ও সাড়ে সাতি',
          epilogueOption: 'উপসংহার ও শান্তি মন্ত্র'
        },
        footers: {
          bookName: 'জন্ম কুণ্ডলী সংহিতা',
          pagePrefix: 'পৃষ্ঠা',
          coverFooter: 'প্রমাণিত জন্ম পত্রিকা',
          chartFooter: 'জন্ম লগ্ন চক্র',
          sphutaFooter: 'গ্রহ স্ফুট তালিকা',
          panchangaFooter: 'জন্ম পঞ্জিকা',
          navagrahaFooter: 'নবগ্রহ অবস্থান',
          mahadashaFooter: 'মহাদশা ও সাড়ে সাতি',
          bhavaFooter: 'দ্বাদশ ভাব সংহিতা',
          epilogueFooter: 'শান্তি মন্ত্র'
        },
        cover: {
          title: 'বৃহৎ জন্ম কুণ্ডলী গ্রন্থ',
          subtitle: 'রাজকীয় বৈদিক জন্ম পত্রিকা',
          treatise: 'কর্ম বিপাক সংহিতা ও জীবন নির্দেশিকা',
          nativeName: 'জাতকের নাম',
          dob: 'জন্ম তারিখ',
          tob: 'জন্ম সময়',
          pob: 'জন্ম স্থান',
          system: 'পদ্ধতি',
          defaultNativeName: 'জাতক'
        },
        panchanga: {
          varna: '১. বর্ণ',
          varnaDesc: 'আধ্যাত্মিক প্রকৃতি',
          vashya: '২. বশ্য',
          vashyaDesc: 'প্রভাব ও সামঞ্জস্য',
          yoni: '৩. যোনি',
          yoniDesc: 'প্রবৃত্তি ও স্বভাব',
          gana: '৪. গণ',
          nadi: '৫. নাড়ী',
          nadiDesc: 'জৈব শক্তি ও স্বাস্থ্য',
          paya: '৬. পায়া',
          payaDesc: 'ভিত্তি শক্তি',
          element: '৭. তত্ত্ব',
          elementDesc: 'মূল উপাদান',
          tithi: '৮. তিথি ও যোগ',
          manglikTitle: 'মাঙ্গলিক দোষ বিচার',
          manglikActive: 'মাঙ্গলিক প্রভাব সক্রিয়',
          manglikNirdosha: 'নির্দোষ (কোনো মাঙ্গলিক দোষ নেই)',
          pariharaText: 'দোষ পরিহার উপস্থিত',
          cautionBadge: 'সতর্ক',
          auspiciousBadge: 'শুভ',
          luckyTitle: 'শুভ উপাদান',
          gemstone: 'রত্ন:',
          metal: 'ধাতু:',
          color: 'রং:',
          direction: 'দিক:'
        },
        purusharthaDetails: {
          dharmaTitle: 'ধর্ম (ভাব ১, ৫, ৯)',
          dharmaDesc: 'আত্মার লক্ষ্য, ন্যায়পরায়ণতা ও আধ্যাত্মিক কর্তব্য',
          arthaTitle: 'অর্থ (ভাব ২, ৬, ১০)',
          arthaDesc: 'সম্পদ, কর্মজীবন ও আর্থিক স্থায়িত্ব',
          kamaTitle: 'কাম (ভাব ৩, ৭, ১১)',
          kamaDesc: 'ইচ্ছা, প্রেম, সম্পর্ক ও সৃজনশীলতা',
          mokshaTitle: 'মোক্ষ (ভাব ৪, ৮, ১২)',
          mokshaDesc: 'মুক্তি, আধ্যাত্মিকতা ও মানসিক শান্তি'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `জন্ম লগ্ন রাশি: ${sign} (প্রথম ভাব / লগ্ন কেন্দ্র)`,
          descTemplate: (sign: string) => `জন্ম লগ্ন হলো মানব দেহের জীবনীশক্তি ও দৃষ্টিভঙ্গির মূল ভিত্তি। জন্মের সময় পূর্ব দিগন্তে ${sign} রাশি উদিত হওয়ায় আপনার ব্যক্তিত্বে সততা ও দৃঢ় আত্মবিশ্বাস প্রতিভাত হয়। নবগ্রহের স্ফুট তালিকা পরবর্তী পৃষ্ঠায় দেওয়া হলো।`
        },
        sphutaCard: {
          title: 'গ্রহ স্ফুট ও গ্রহের বল বিচার:',
          desc: 'বৈদিক জ্যোতিষে গ্রহের ডিগ্রি ও স্থিতি নির্ধারণ করে গ্রহ কতটুকু শক্তিশালী ফল দেবে। উচ্চ বা স্বক্ষেত্রের গ্রহ শুভ ফল সহজে বৃদ্ধি করে, এবং নীচ বা শত্রু রাশিস্থ গ্রহ ধৈর্য ও শাস্ত্রীয় প্রতিকারের পথ নির্দেশ করে।'
        },
        insightCard: {
          title: 'জ্যোতিষীয় অন্তর্দৃষ্টি:',
          desc: 'আপনার জন্ম কুণ্ডলীতে গ্রহের অবস্থান পূর্বার্জিত কর্মের প্রতিচ্ছবি। চতুর্বর্গ পুরুষার্থের ভারসাম্য বজায় রেখে সঠিক বৈদিক প্রতিকার অনুশীলন করলে জীবনে সিদ্ধি লাভ হয়।'
        },
        mahadasha: {
          title: 'বিংশোত্তরী মহাদশা কালচক্র ও সাড়ে সাতি',
          subtitle: '১২০ বছরের গ্রহ মহাদশা',
          activeSeal: 'সক্রিয়',
          activeBadge: 'বর্তমান মহাদশায় বিশেষ সিলমোহর',
          sadesatiTitle: 'শনি সাড়ে সাতি চক্র (চন্দ্র রাশি অনুসারে)'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `এই ভাবের অধিপতি ${lord} এবং নৈসর্গিক কারক ${karaka}। শাস্ত্রীয় নিয়ম ও বৈদিক প্রতিকার নিষ্ঠার সাথে পালন করলে ${domain} ক্ষেত্রে শুভ ফল নিশ্চিত হয়।`
        },
        epilogue: {
          headerTitle: 'বৈদিক মহামন্ত্র ও অন্তিম নির্দেশনা',
          mantra1Label: 'মহামৃত্যুঞ্জয় মন্ত্র (আরোগ্য ও সুরক্ষা)',
          mantra2Label: 'গায়ত্রী মন্ত্র (বুদ্ধি ও আত্মজ্যোতি)',
          sealBadge: 'প্রমাণিত জ্যোতিষ',
          sealTitle: 'বৈদিক জ্যোতিষ ব্যুরো সিলমোহর',
          sealCalculations: (sys: string) => `${sys} পদ্ধতি অনুসারে গণনাকৃত`,
          refIdPrefix: 'রেফারেন্স: WMS-'
        }
      };

    case 'Tamil':
      return {
        planetHeaders: {
          planet: 'கிரகம்',
          sign: 'ராசி',
          house: 'வீடு',
          dignity: 'நிலை'
        },
        cardinalPoints: {
          starLord: 'நட்சத்திர அதிபதி',
          subLord: 'உப அதிபதி',
          nakshatra: 'ஜென்ம நட்சத்திரம்',
          moonSign: 'சந்திர ராசி'
        },
        chapterLabels: {
          chapter: 'அத்தியாயம்',
          part: 'பாகம்',
          ch1Title: 'ஜென்ம லக்ன சக்கரம் மற்றும் கிரக நிலைகள்',
          ch1Part1Title: 'ஜென்ம லக்ன சக்கரம் மற்றும் வானியல் ஆயத்தொலைவுகள்',
          ch1Part2Title: 'கிரக ஸ்புடம் • கிரக பாகைகள் மற்றும் ஆட்சி அட்டவணை',
          ch2Title: 'அவகஹடா சக்கரம் மற்றும் ஜென்ம பஞ்சாங்கம்',
          ch3Title: 'நவக்கிரக அமைப்பு மற்றும் நால்வகை புருஷார்த்தங்கள்',
          ch4Title: 'விம்சோத்தரி மகாதிசை காலசக்கரம் மற்றும் ஏழரை சனி',
          epilogueTitle: 'வேத மந்திரங்கள் மற்றும் இறுதி வழிகாட்டல்'
        },
        bhavaPillars: {
          selectHouse: 'வீட்டைத் தேர்வுசெய்க:',
          rashi: 'ராசி',
          lord: 'வீட்டதிபதி',
          karaka: 'காரகர்',
          anatomy: 'உடற்பகுதி',
          element: 'தத்துவம்',
          purushartha: 'புருஷார்த்தம்',
          lifeDomain: 'வாழ்க்கை களம் மற்றும் முக்கிய அம்சங்கள்:',
          occupyingPlanets: 'அமர்ந்த கிரகங்கள்:',
          noPlanets: 'கிரகங்கள் ஏதுமில்லை; வீட்டதிபதியின் நிலையால் வழிநடத்தப்படுகிறது.',
          analysisTitle: 'ஆழ்ந்த ஜோதிட பகுப்பாய்வு:',
          boonsTitle: 'சுப பலன்கள் மற்றும் தெய்வீக அருள்:',
          cautionsTitle: 'எச்சரிக்கைகள் மற்றும் சவால்கள்:',
          upayasTitle: 'வேத பரிகாரங்கள் மற்றும் மந்திரங்கள்:',
          counselTitle: 'கர்ம சித்தி ஆலோசனை:',
          continuationBanner: 'விரிவான தொடர்ச்சி: சுப பலன்கள் மற்றும் பரிகாரங்களை அடுத்த பக்கத்தில் காண்க.',
          goToPart2: 'பாகம் 2',
          points: 'குறிப்புகள்',
          remediesCount: 'பரிகாரங்கள்',
          rulerLabel: 'ராசி நாதன்',
          karakaLabel: 'இயற்கை காரகர்'
        },
        navigation: {
          prevPage: 'முந்தைய பக்கம்',
          nextPage: 'அடுத்த பக்கம்',
          pageLabel: 'பக்கம்',
          ofLabel: 'இல்',
          coverOption: 'பக்கம் 1: முகப்பு',
          chartOption: 'பக்கம் 2: ஜென்ம லக்ன சக்கரம்',
          sphutaOption: 'பக்கம் 3: கிரக ஸ்புட அட்டவணை',
          panchangaOption: 'பக்கம் 4: அவகஹடா மற்றும் பஞ்சாங்கம்',
          navagrahaOption: 'பக்கம் 5: நவக்கிரகம் மற்றும் புருஷார்த்தம்',
          mahadashaOption: 'பக்கம் 6: மகாதிசை மற்றும் ஏழரை சனி',
          epilogueOption: 'வேத மந்திரங்கள்'
        },
        footers: {
          bookName: 'ஜென்ம ஜாதக சம்ஹிதை',
          pagePrefix: 'பக்கம்',
          coverFooter: 'சான்றளிக்கப்பட்ட ஜாதகம்',
          chartFooter: 'ஜென்ம லக்ன சக்கரம்',
          sphutaFooter: 'கிரக ஸ்புட அட்டவணை',
          panchangaFooter: 'ஜென்ம பஞ்சாங்கம்',
          navagrahaFooter: 'நவக்கிரக அமைப்பு',
          mahadashaFooter: 'மகாதிசை மற்றும் சனி சக்கரம்',
          bhavaFooter: 'பன்னிரண்டு பாவ சம்ஹிதை',
          epilogueFooter: 'சாந்தி மந்திரங்கள்'
        },
        cover: {
          title: 'பிருஹத் ஜென்ம ஜாதக நூல்',
          subtitle: 'ராஜரீக வேத ஜாதக புத்தகம்',
          treatise: 'கர்ம விபாக சம்ஹிதை மற்றும் வாழ்க்கை வழிகாட்டி',
          nativeName: 'ஜாதகர் பெயர்',
          dob: 'பிறந்த தேதி',
          tob: 'பிறந்த நேரம்',
          pob: 'பிறந்த இடம்',
          system: 'முறை',
          defaultNativeName: 'ஜாதகர்'
        },
        panchanga: {
          varna: '1. வர்ணம்',
          varnaDesc: 'ஆன்ம இயல்பு',
          vashya: '2. வசியம்',
          vashyaDesc: 'ஆளுமை மற்றும் இணக்கம்',
          yoni: '3. யோனி',
          yoniDesc: 'இயற்கை குணம்',
          gana: '4. கணம்',
          nadi: '5. நாடி',
          nadiDesc: 'உடல் ஆரோக்கிய சக்தி',
          paya: '6. பாதம்',
          payaDesc: 'அடிப்படை பலம்',
          element: '7. தத்துவம்',
          elementDesc: 'மூல ஆற்றல்',
          tithi: '8. திதி மற்றும் யோகம்',
          manglikTitle: 'செவ்வாய் தோஷ ஆய்வு',
          manglikActive: 'செவ்வாய் தாக்கம் உள்ளது',
          manglikNirdosha: 'தோஷம் இல்லை',
          pariharaText: 'தோஷ நிவர்த்தி உள்ளது',
          cautionBadge: 'கவனம்',
          auspiciousBadge: 'சுபம்',
          luckyTitle: 'அதிர்ஷ்ட கூறுகள்',
          gemstone: 'ரத்தினம்:',
          metal: 'உலோகம்:',
          color: 'நிறம்:',
          direction: 'திசை:'
        },
        purusharthaDetails: {
          dharmaTitle: 'தர்மம் (வீடுகள் 1, 5, 9)',
          dharmaDesc: 'ஆன்ம நோக்கம், கடமை மற்றும் அறநெறி',
          arthaTitle: 'அர்த்தம் (வீடுகள் 2, 6, 10)',
          arthaDesc: 'செல்வம், தொழில் மற்றும் நிதி நிலைத்தன்மை',
          kamaTitle: 'காமம் (வீடுகள் 3, 7, 11)',
          kamaDesc: 'ஆசைகள், அன்பு மற்றும் சமூக உறவுகள்',
          mokshaTitle: 'மோட்சம் (வீடுகள் 4, 8, 12)',
          mokshaDesc: 'ஆன்மீகம், மன அமைதி மற்றும் விடுதலை'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `ஜென்ம லக்னம்: ${sign} (முதல் வீடு)`,
          descTemplate: (sign: string) => `ஜென்ம லக்னம் என்பது உடல் நலன், தோற்றம் மற்றும் ஆளுமையின் அடித்தளமாகும். பிறக்கும் வேளையில் கிழக்கு அடிவானத்தில் ${sign} ராசி உதித்ததால் ஆற்றலும் தன்னம்பிக்கையும் உண்டாகிறது. கிரக நிலைகள் அடுத்த பக்கத்தில் தரப்பட்டுள்ளன.`
        },
        sphutaCard: {
          title: 'கிரக ஸ்புடம் மற்றும் பலம்:',
          desc: 'வேத ஜோதிடத்தில் கிரகங்களின் நிலை மற்றும் பாகைகள் பலன்களை நிர்ணயிக்கின்றன. உச்சம் அல்லது ஆட்சியில் உள்ள கிரகங்கள் சுப பலன்களை எளிதில் தருகின்றன; பகை அல்லது நீச கிரகங்கள் பொறுமையையும் பரிகாரங்களையும் வலியுறுத்துகின்றன.'
        },
        insightCard: {
          title: 'ஜோதிட பார்வை:',
          desc: 'ஜாதகத்தில் கிரகங்களின் நிலை முற்பிறவி கர்ம வினைகளின் வெளிப்பாடாகும். நால்வகை புருஷார்த்தங்களை உணர்ந்து உரிய பரிகாரங்களைச் செய்வதன் மூலம் வாழ்வில் மேன்மை அடையலாம்.'
        },
        mahadasha: {
          title: 'விம்சோத்தரி மகாதிசை காலசக்கரம் மற்றும் ஏழரை சனி',
          subtitle: '120 ஆண்டு கிரக சுழற்சி',
          activeSeal: 'நடப்பில்',
          activeBadge: 'தற்போது நடக்கும் திசைக்கு சிறப்பு முத்திரை',
          sadesatiTitle: 'சனி கால சுழற்சிகள்'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `இந்த வீட்டின் அதிபதி ${lord} மற்றும் காரகர் ${karaka}. வேத பரிகாரங்களை கடைபிடிப்பதன் மூலம் ${domain} சார்ந்த விஷயங்களில் சுப பலன்கள் கிடைக்கும்.`
        },
        epilogue: {
          headerTitle: 'வேத மந்திரங்கள் மற்றும் நிறைவுரை',
          mantra1Label: 'மகா மிருத்யுஞ்சய மந்திரம் (ஆயுள் மற்றும் பாதுகாப்பு)',
          mantra2Label: 'காயத்ரி மந்திரம் (ஞானம் மற்றும் அறிவு)',
          sealBadge: 'சான்றளிக்கப்பட்ட ஜோதிடம்',
          sealTitle: 'வேத ஜோதிட பீட முத்திரை',
          sealCalculations: (sys: string) => `${sys} முறைப்படி கணிக்கப்பட்டது`,
          refIdPrefix: 'குறிப்பு எண்: WMS-'
        }
      };

    case 'Telugu':
      return {
        planetHeaders: {
          planet: 'గ్రహం',
          sign: 'రాశి',
          house: 'స్థానం',
          dignity: 'స్థితి'
        },
        cardinalPoints: {
          starLord: 'నక్షత్ర నాథుడు',
          subLord: 'ఉప నాథుడు',
          nakshatra: 'జన్మ నక్షత్రం',
          moonSign: 'చంద్ర రాశి'
        },
        chapterLabels: {
          chapter: 'అధ్యాయం',
          part: 'భాగం',
          ch1Title: 'జన్మ లగ్న చక్రం మరియు గ్రహ స్థితులు',
          ch1Part1Title: 'జన్మ లగ్న చక్రం మరియు ఖగోళ అంశాలు',
          ch1Part2Title: 'గ్రహ స్ఫుటం • నవగ్రహ స్థితులు మరియు బలాబలాలు',
          ch2Title: 'అవకహడా చక్రం మరియు జన్మ పంచాంగం',
          ch3Title: 'నవగ్రహ అమరిక మరియు చతుర్విధ పురుషార్థాలు',
          ch4Title: 'వింశోత్తరి మహాదశ కాలచక్రం మరియు ఏలినాటి శని',
          epilogueTitle: 'ఉపసంహారం మరియు వైదిక ఆశీస్సులు'
        },
        bhavaPillars: {
          selectHouse: 'స్థానాన్ని ఎంచుకోండి:',
          rashi: 'రాశి',
          lord: 'స్థానాధిపతి',
          karaka: 'కారకుడు',
          anatomy: 'శరీర భాగం',
          element: 'తత్త్వం',
          purushartha: 'పురుషార్థం',
          lifeDomain: 'జీవిత రంగం మరియు ముఖ్య అంశాలు:',
          occupyingPlanets: 'ఉన్న గ్రహాలు:',
          noPlanets: 'ప్రత్యక్ష గ్రహాలు లేవు; స్థానాధిపతి మరియు దృష్టిలచే నడుస్తుంది.',
          analysisTitle: 'సమగ్ర జ్యోతిష్య విశ్లేషణ:',
          boonsTitle: 'శుభ ఫలితాలు మరియు దైవ కృప:',
          cautionsTitle: 'హెచ్చరికలు మరియు సవాళ్లు:',
          upayasTitle: 'వైదిక పరిహారాలు మరియు మంత్రాలు:',
          counselTitle: 'కర్మ సిద్ధి సలహా:',
          continuationBanner: 'వివరాలు: ఈ స్థానపు శుభ ఫలితాలు మరియు పరిహారాలు తర్వాతి పేజీలో చూడండి.',
          goToPart2: 'భాగం 2',
          points: 'అంశాలు',
          remediesCount: 'పరిహారాలు',
          rulerLabel: 'రాశినాథుడు',
          karakaLabel: 'స్థిర కారకుడు'
        },
        navigation: {
          prevPage: 'మునుపటి పేజీ',
          nextPage: 'తర్వాతి పేజీ',
          pageLabel: 'పేజీ',
          ofLabel: 'లో',
          coverOption: 'పేజీ 1: ముఖచిత్రం',
          chartOption: 'పేజీ 2: జన్మ లగ్న చక్రం',
          sphutaOption: 'పేజీ 3: గ్రహ స్ఫుట పట్టిక',
          panchangaOption: 'పేజీ 4: అవకహడా మరియు పంచాంగం',
          navagrahaOption: 'పేజీ 5: నవగ్రహాలు మరియు పురుషార్థాలు',
          mahadashaOption: 'పేజీ 6: మహాదశ మరియు శని ప్రభావం',
          epilogueOption: 'ఉపసంహారం మరియు మంత్రాలు'
        },
        footers: {
          bookName: 'జన్మ కుండలి సంహిత',
          pagePrefix: 'పేజీ',
          coverFooter: 'ప్రమాణీకృత జాతకం',
          chartFooter: 'జన్మ లగ్న చక్రం',
          sphutaFooter: 'గ్రహ స్ఫుట పట్టిక',
          panchangaFooter: 'జన్మ పంచాంగం',
          navagrahaFooter: 'నవగ్రహ అమరిక',
          mahadashaFooter: 'మహాదశ మరియు శని చక్రం',
          bhavaFooter: 'ద్వాదశ భావ సంహిత',
          epilogueFooter: 'శాంతి మంత్రాలు'
        },
        cover: {
          title: 'బృహత్ జన్మ కుండలి గ్రంథం',
          subtitle: 'రాచరిక వైదిక జన్మ పత్రిక',
          treatise: 'కర్మ విపాక సంహిత మరియు జీవిత మార్గదర్శిని',
          nativeName: 'జాతకుని పేరు',
          dob: 'పుట్టిన తేదీ',
          tob: 'పుట్టిన సమయం',
          pob: 'పుట్టిన ప్రదేశం',
          system: 'పద్ధతి',
          defaultNativeName: 'జాతకుడు'
        },
        panchanga: {
          varna: '1. వర్ణం',
          varnaDesc: 'ఆధ్యాత్మిక స్వభావం',
          vashya: '2. వశ్యం',
          vashyaDesc: 'ప్రభావం మరియు అనుకూలత',
          yoni: '3. యోని',
          yoniDesc: 'సహజ స్వభావం',
          gana: '4. గణం',
          nadi: '5. నాడి',
          nadiDesc: 'ఆరోగ్య శక్తి',
          paya: '6. పాదం',
          payaDesc: 'పునాది బలం',
          element: '7. తత్త్వం',
          elementDesc: 'మూల శక్తి',
          tithi: '8. తిథి మరియు యోగం',
          manglikTitle: 'కుజ దోష విచారణ',
          manglikActive: 'కుజ ప్రభావం ఉంది',
          manglikNirdosha: 'దోషం లేదు',
          pariharaText: 'దోష పరిహారం ఉంది',
          cautionBadge: 'జాగ్రత్త',
          auspiciousBadge: 'శుభం',
          luckyTitle: 'శుభ తత్త్వాలు',
          gemstone: 'రత్నం:',
          metal: 'లోహం:',
          color: 'రంగు:',
          direction: 'దిశ:'
        },
        purusharthaDetails: {
          dharmaTitle: 'ధర్మం (స్థానాలు 1, 5, 9)',
          dharmaDesc: 'ఆత్మ లక్ష్యం, ధర్మపాలన మరియు నైతిక నిష్ఠ',
          arthaTitle: 'అర్థం (స్థానాలు 2, 6, 10)',
          arthaDesc: 'ధనం, వృత్తి మరియు సంపద',
          kamaTitle: 'కామం (స్థానాలు 3, 7, 11)',
          kamaDesc: 'కోరికలు, ప్రేమ మరియు అనుబంధాలు',
          mokshaTitle: 'మోక్షం (స్థానాలు 4, 8, 12)',
          mokshaDesc: 'ముక్తి, ఆధ్యాత్మికత మరియు మానసిక ప్రశాంతత'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `జన్మ లగ్న రాశి: ${sign} (ప్రథమ స్థానం)`,
          descTemplate: (sign: string) => `జన్మ లగ్నం శరీరం, ఆరోగ్యం మరియు జీవిత దృక్పథానికి ప్రధాన ఆధారం. జన్మ సమయంలో తూర్పు దిగంతంలో ${sign} రాశి ఉదయించడం వల్ల వ్యక్తిత్వంలో ఆత్మవిశ్వాసం పెరుగుతుంది. గ్రహాల స్ఫుట పట్టిక తర్వాతి పేజీలో ఇవ్వబడింది.`
        },
        sphutaCard: {
          title: 'గ్రహ స్ఫుటం మరియు బలాబలాల సమీక్ష:',
          desc: 'వైదిక జ్యోతిషంలో గ్రహాల అంశలు మరియు స్థితి వాటి ఫలితాల తీవ్రతను నిర్ణయిస్తాయి. ఉచ్ఛ లేదా స్వక్షేత్రంలో ఉన్న గ్రహాలు శుభ ఫలితాలను ఇస్తాయి; నీచ లేదా శత్రు క్షేత్ర గ్రహాలు సహనాన్ని మరియు శాస్త్రీయ పరిహారాలను సూచిస్తాయి.'
        },
        insightCard: {
          title: 'జ్యోతిష్య దృష్టి:',
          desc: 'జన్మ కుండలిలోని గ్రహ స్థితులు సంచిత కర్మల ప్రతిబింబం. నాలుగు పురుషార్థాలను సమతుల్యంగా నడుపుతూ పరిహారాలు ఆచరిస్తే సకల కార్యసిద్ధి కలుగుతుంది.'
        },
        mahadasha: {
          title: 'వింశోత్తరి మహాదశ మరియు ఏలినాటి శని',
          subtitle: '120 సంవత్సరాల గ్రహ చక్రం',
          activeSeal: 'ప్రస్తుతం',
          activeBadge: 'ప్రస్తుత మహాదశకు ప్రత్యేక ముద్ర',
          sadesatiTitle: 'శని సంచార చక్రం'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `ఈ స్థానాధిపతి ${lord} మరియు కారకుడు ${karaka}. సూచించిన పరిహారాలు నిష్ఠతో ఆచరించడం ద్వారా ${domain} రంగంలో అభివృద్ధి లభిస్తుంది.`
        },
        epilogue: {
          headerTitle: 'వైదిక మహామంత్రాలు మరియు ముగింపు',
          mantra1Label: 'మహా మృత్యుంజయ మంత్రం (ఆరోగ్యం మరియు రక్షణ)',
          mantra2Label: 'గాయత్రీ మంత్రం (బుద్ధి మరియు తేజస్సు)',
          sealBadge: 'ధృవీకృత జ్యోతిష్యం',
          sealTitle: 'వైదిక జ్యోతిష్య పీఠ ముద్ర',
          sealCalculations: (sys: string) => `${sys} సిద్ధాంతం ప్రకారం లెక్కించబడింది`,
          refIdPrefix: 'రిఫరెన్స్: WMS-'
        }
      };

    case 'Kannada':
      return {
        planetHeaders: {
          planet: 'ಗ್ರಹ',
          sign: 'ರಾಶಿ',
          house: 'ಮನೆ',
          dignity: 'ಸ್ಥಿತಿ'
        },
        cardinalPoints: {
          starLord: 'ನಕ್ಷತ್ರ ನಾಥ',
          subLord: 'ಉಪ ನಾಥ',
          nakshatra: 'ಜನ್ಮ ನಕ್ಷತ್ರ',
          moonSign: 'ಚಂದ್ರ ರಾಶಿ'
        },
        chapterLabels: {
          chapter: 'ಅಧ್ಯಾಯ',
          part: 'ಭಾಗ',
          ch1Title: 'ಜನ್ಮ ಲಗ್ನ ಚಕ್ರ ಮತ್ತು ಗ್ರಹ ಸ್ಥಿತಿಗಳು',
          ch1Part1Title: 'ಜನ್ಮ ಲಗ್ನ ಚಕ್ರ ಮತ್ತು ಖಗೋಳ ನಿರ್ದೇಶಾಂಕಗಳು',
          ch1Part2Title: 'ಗ್ರಹ ಸ್ಫುಟ • ನವಗ್ರಹ ಸ್ಥಿತಿ ಮತ್ತು ಅಂಶ ಪಟ್ಟಿ',
          ch2Title: 'ಅವಕಹಡಾ ಚಕ್ರ ಮತ್ತು ಜನ್ಮ ಪಂಚಾಂಗ',
          ch3Title: 'ನವಗ್ರಹ ವ್ಯವಸ್ಥೆ ಮತ್ತು ಚತುರ್ವಿಧ ಪುರುಷಾರ್ಥಗಳು',
          ch4Title: 'ವಿಂಶೋತ್ತರಿ ಮಹಾದಶಾ ಕಾಲಚಕ್ರ ಮತ್ತು ಸಾಡೇ ಸಾತಿ',
          epilogueTitle: 'ಉಪಸಂಹಾರ ಮತ್ತು ವೈದಿಕ ಆಶೀರ್ವಾದ'
        },
        bhavaPillars: {
          selectHouse: 'ಮನೆ ಆಯ್ಕೆಮಾಡಿ:',
          rashi: 'ರಾಶಿ',
          lord: 'ಮನೆಯ ಒಡೆಯ',
          karaka: 'ಕಾರಕ',
          anatomy: 'ದೇಹದ ಭಾಗ',
          element: 'ತತ್ತ್ವ',
          purushartha: 'ಪುರುಷಾರ್ಥ',
          lifeDomain: 'ಜೀವನ ಕ್ಷೇತ್ರ ಮತ್ತು ಪ್ರಮುಖ ವಿಷಯಗಳು:',
          occupyingPlanets: 'ಸ್ಥಿತ ಗ್ರಹಗಳು:',
          noPlanets: 'ಯಾವುದೇ ಗ್ರಹಗಳಿಲ್ಲ; ಮನೆಯ ಅಧಿಪತಿಯಿಂದ ನಿರ್ವಹಿಸಲ್ಪಡುತ್ತದೆ.',
          analysisTitle: 'ಆಳವಾದ ಜ್ಯೋತಿಷ್ಯ ವಿಶ್ಲೇಷಣೆ:',
          boonsTitle: 'ಶುಭ ಫಲಗಳು ಮತ್ತು ದೈವ ಕೃಪೆ:',
          cautionsTitle: 'ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಸವಾಲುಗಳು:',
          upayasTitle: 'ವೈದಿಕ ಪರಿಹಾರಗಳು ಮತ್ತು ಮಂತ್ರಗಳು:',
          counselTitle: 'ಕರ್ಮ ಸಿದ್ಧಿ ಸಲಹೆ:',
          continuationBanner: 'ವಿವರವಾದ ಮುಂದುವರಿಕೆ: ಶುಭ ಫಲಗಳು ಮತ್ತು ಪರಿಹಾರಗಳನ್ನು ಮುಂದಿನ ಪುಟದಲ್ಲಿ ನೋಡಿ.',
          goToPart2: 'ಭಾಗ 2',
          points: 'ಅಂಶಗಳು',
          remediesCount: 'ಪರಿಹಾರಗಳು',
          rulerLabel: 'ರಾಶ್ಯಾಧಿಪತಿ',
          karakaLabel: 'ಸ್ಥಿರ ಕಾರಕ'
        },
        navigation: {
          prevPage: 'ಹಿಂದಿನ ಪುಟ',
          nextPage: 'ಮುಂದಿನ ಪುಟ',
          pageLabel: 'ಪುಟ',
          ofLabel: 'ರ',
          coverOption: 'ಪುಟ 1: ಮುಖಪುಟ',
          chartOption: 'ಪುಟ 2: ಜನ್ಮ ಲಗ್ನ ಚಕ್ರ',
          sphutaOption: 'ಪುಟ 3: ಗ್ರಹ ಸ್ಫುಟ ಪಟ್ಟಿ',
          panchangaOption: 'ಪುಟ 4: ಅವಕಹಡಾ ಮತ್ತು ಪಂಚಾಂಗ',
          navagrahaOption: 'ಪುಟ 5: ನವಗ್ರಹ ಮತ್ತು ಪುರುಷಾರ್ಥ',
          mahadashaOption: 'ಪುಟ 6: ಮಹಾದಶಾ ಮತ್ತು ಸಾಡೇ ಸಾತಿ',
          epilogueOption: 'ಉಪಸಂಹಾರ ಮತ್ತು ಮಂತ್ರಗಳು'
        },
        footers: {
          bookName: 'ಜನ್ಮ ಕುಂಡಲಿ ಸಂಹಿತೆ',
          pagePrefix: 'ಪುಟ',
          coverFooter: 'ಪ್ರಮಾಣೀಕೃತ ಕುಂಡಲಿ',
          chartFooter: 'ಜನ್ಮ ಲಗ್ನ ಚಕ್ರ',
          sphutaFooter: 'ಗ್ರಹ ಸ್ಫುಟ ಪಟ್ಟಿ',
          panchangaFooter: 'ಜನ್ಮ ಪಂಚಾಂಗ',
          navagrahaFooter: 'ನವಗ್ರಹ ವ್ಯವಸ್ಥೆ',
          mahadashaFooter: 'ಮಹಾದಶಾ ಮತ್ತು ಸಾಡೇ ಸಾತಿ',
          bhavaFooter: 'ದ್ವಾದಶ ಭಾವ ಸಂಹಿತೆ',
          epilogueFooter: 'ಶಾಂತಿ ಮಂತ್ರಗಳು'
        },
        cover: {
          title: 'ಬೃಹತ್ ಜನ್ಮ ಕುಂಡಲಿ ಗ್ರಂಥ',
          subtitle: 'ವೈದಿಕ ಜನ್ಮ ಪತ್ರಿಕೆ',
          treatise: 'ಕರ್ಮ ವಿಪಾಕ ಸಂಹಿತೆ ಮತ್ತು ಜೀವನ ಮಾರ್ಗದರ್ಶಿ',
          nativeName: 'ಜಾತಕರ ಹೆಸರು',
          dob: 'ಹುಟ್ಟಿದ ದಿನಾಂಕ',
          tob: 'ಹುಟ್ಟಿದ ಸಮಯ',
          pob: 'ಹುಟ್ಟಿದ ಸ್ಥಳ',
          system: 'ಪದ್ಧತಿ',
          defaultNativeName: 'ಜಾತಕ'
        },
        panchanga: {
          varna: '1. ವರ್ಣ',
          varnaDesc: 'ಆಧ್ಯಾತ್ಮಿಕ ಪ್ರವೃತ್ತಿ',
          vashya: '2. ವಶ್ಯ',
          vashyaDesc: 'ಪ್ರಭಾವ ಮತ್ತು ಹೊಂದಾಣಿಕೆ',
          yoni: '3. ಯೋನಿ',
          yoniDesc: 'ಸಹಜ ಸ್ವಭಾವ',
          gana: '4. ಗಣ',
          nadi: '5. ನಾಡಿ',
          nadiDesc: 'ಆರೋಗ್ಯ ಚೈತನ್ಯ',
          paya: '6. ಪಾದ',
          payaDesc: 'ಮೂಲ ಬಲ',
          element: '7. ತತ್ತ್ವ',
          elementDesc: 'ಮೂಲ ಶಕ್ತಿ',
          tithi: '8. ತಿಥಿ ಮತ್ತು ಯೋಗ',
          manglikTitle: 'ಕುಜ ದೋಷ ಪರಿಶೀಲನೆ',
          manglikActive: 'ಕುಜ ಪ್ರಭಾವವಿದೆ',
          manglikNirdosha: 'ದೋಷವಿಲ್ಲ',
          pariharaText: 'ದೋಷ ಪರಿಹಾರವಿದೆ',
          cautionBadge: 'ಎಚ್ಚರಿಕೆ',
          auspiciousBadge: 'ಶುಭ',
          luckyTitle: 'ಶುಭ ತತ್ತ್ವಗಳು',
          gemstone: 'ರತ್ನ:',
          metal: 'ಲೋಹ:',
          color: 'ಬಣ್ಣ:',
          direction: 'ದಿಕ್ಕು:'
        },
        purusharthaDetails: {
          dharmaTitle: 'ಧರ್ಮ (ಮನೆಗಳು 1, 5, 9)',
          dharmaDesc: 'ಆತ್ಮದ ಧ್ಯೇಯ, ಕರ್ತವ್ಯ ಮತ್ತು ಧರ್ಮಪಾಲನೆ',
          arthaTitle: 'ಅರ್ಥ (ಮನೆಗಳು 2, 6, 10)',
          arthaDesc: 'ಸಂಪತ್ತು, ವೃತ್ತಿ ಮತ್ತು ಆರ್ಥಿಕ ಭದ್ರತೆ',
          kamaTitle: 'ಕಾಮ (ಮನೆಗಳು 3, 7, 11)',
          kamaDesc: 'ಇಷ್ಟಾರ್ಥಗಳು, ಪ್ರೀತಿ ಮತ್ತು ಸಾಮಾಜಿಕ ಸಂಬಂಧಗಳು',
          mokshaTitle: 'ಮೋಕ್ಷ (ಮನೆಗಳು 4, 8, 12)',
          mokshaDesc: 'ಮುಕ್ತಿ, ಆಧ್ಯಾತ್ಮ ಮತ್ತು ಮಾನಸಿಕ ಶಾಂತಿ'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `ಜನ್ಮ ಲಗ್ನ ರಾಶಿ: ${sign} (ಪ್ರಥಮ ಭಾವ)`,
          descTemplate: (sign: string) => `ಜನ್ಮ ಲಗ್ನವು ದೇಹ, ಚೈತನ್ಯ ಮತ್ತು ವ್ಯಕ್ತಿತ್ವದ ಮೂಲಾಧಾರವಾಗಿದೆ. ಜನನದ ಸಮಯದಲ್ಲಿ ಪೂರ್ವ ದಿಗಂತದಲ್ಲಿ ${sign} ರಾಶಿಯ ಉದಯದಿಂದ ವ್ಯಕ್ತಿತ್ವದಲ್ಲಿ ಆತ್ಮವಿಶ್ವಾಸ ಹೆಚ್ಚುತ್ತದೆ. ಗ್ರಹಗಳ ಸ್ಫುಟ ಪಟ್ಟಿ ಮುಂದಿನ ಪುಟದಲ್ಲಿದೆ.`
        },
        sphutaCard: {
          title: 'ಗ್ರಹ ಸ್ಫುಟ ಮತ್ತು ಬಲಾಬಲ ವಿಶ್ಲೇಷಣೆ:',
          desc: 'ವೈದಿಕ ಜ್ಯೋತಿಷ್ಯದಲ್ಲಿ ಗ್ರಹಗಳ ಅಂಶಗಳು ಮತ್ತು ಸ್ಥಿತಿ ಅವುಗಳ ಫಲ ನೀಡುವ ಸಾಮರ್ಥ್ಯವನ್ನು ನಿರ್ಧರಿಸುತ್ತವೆ. ಉಚ್ಚ ಅಥವಾ ಸ್ವಕ್ಷೇತ್ರ ಗ್ರಹಗಳು ಶುಭ ಫಲಗಳನ್ನು ನೀಡುತ್ತವೆ; ನೀಚ ಅಥವಾ ಶತ್ರು ಗ್ರಹಗಳು ಶಾಸ್ತ್ರೀಯ ಪರಿಹಾರಗಳ ಅಗತ್ಯವನ್ನು ಸೂಚಿಸುತ್ತವೆ.'
        },
        insightCard: {
          title: 'ಜ್ಯೋತಿಷ್ಯ ದೃಷ್ಟಿಕೋನ:',
          desc: 'ಕುಂಡಲಿಯಲ್ಲಿನ ಗ್ರಹ ಸ್ಥಿತಿಗಳು ಪೂರ್ವಾರ್ಜಿತ ಕರ್ಮಗಳ ಪ್ರತಿಬಿಂಬ. ನಾಲ್ಕು ಪುರುಷಾರ್ಥಗಳಲ್ಲಿ ಸಮತೋಲನ ಸಾಧಿಸಿ ನಿಷ್ಠೆಯಿಂದ ಪರಿಹಾರಗಳನ್ನು ಆಚರಿಸಿದರೆ ಜೀವನದಲ್ಲಿ ಸಿದ್ಧಿ ದೊರೆಯುತ್ತದೆ.'
        },
        mahadasha: {
          title: 'ವಿಂಶೋತ್ತರಿ ಮಹಾದಶಾ ಮತ್ತು ಸಾಡೇ ಸಾತಿ',
          subtitle: '120 ವರ್ಷಗಳ ಗ್ರಹ ಕಾಲಚಕ್ರ',
          activeSeal: 'ಚಾಲ್ತಿಯಲ್ಲಿದೆ',
          activeBadge: 'ಪ್ರಸ್ತುತ ಮಹಾದಶೆಗೆ ವಿಶೇಷ ಮುದ್ರೆ',
          sadesatiTitle: 'ಶನಿ ಸಾಡೇ ಸಾತಿ ಚಕ್ರ'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `ಈ ಭಾವದ ಅಧಿಪತಿ ${lord} ಮತ್ತು ಕಾರಕ ${karaka}. ವೈದಿಕ ಪರಿಹಾರಗಳನ್ನು ಪಾಲಿಸುವುದರಿಂದ ${domain} ಕ್ಷೇತ್ರದಲ್ಲಿ ಅಭಿವೃದ್ಧಿ ಸಾಧ್ಯವಾಗುತ್ತದೆ.`
        },
        epilogue: {
          headerTitle: 'ವೈದಿಕ ಮಹಾಮಂತ್ರಗಳು ಮತ್ತು ಮುಕ್ತಾಯ',
          mantra1Label: 'ಮಹಾ ಮೃತ್ಯುಂಜಯ ಮಂತ್ರ (ಆರೋಗ್ಯ ಮತ್ತು ರಕ್ಷಣೆ)',
          mantra2Label: 'ಗಾಯತ್ರೀ ಮಂತ್ರ (ಜ್ಞಾನ ಮತ್ತು ತೇಜಸ್ಸು)',
          sealBadge: 'ಪ್ರಮಾಣೀಕೃತ ಜ್ಯೋತಿಷ್ಯ',
          sealTitle: 'ವೈದಿಕ ಜ್ಯೋತಿಷ್ಯ ಪೀಠ ಮುದ್ರೆ',
          sealCalculations: (sys: string) => `${sys} ಪದ್ಧತಿಯ ಪ್ರಕಾರ ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗಿದೆ`,
          refIdPrefix: 'ಉಲ್ಲೇಖ: WMS-'
        }
      };

    case 'Malayalam':
      return {
        planetHeaders: {
          planet: 'ഗ്രഹം',
          sign: 'രാശി',
          house: 'ഭാവം',
          dignity: 'സ്ഥിതി'
        },
        cardinalPoints: {
          starLord: 'നക്ഷത്രാധിപൻ',
          subLord: 'ഉപാധിപൻ',
          nakshatra: 'ജന്മ നക്ഷത്രം',
          moonSign: 'ചന്ദ്ര രാശി'
        },
        chapterLabels: {
          chapter: 'അധ്യായം',
          part: 'ഭാഗം',
          ch1Title: 'ജന്മ ലഗ്ന ചക്രവും ഗ്രഹ സ്ഥിതിയും',
          ch1Part1Title: 'ജന്മ ലഗ്ന ചക്രവും ജ്യോതിശാസ്ത്ര അളവുകളും',
          ch1Part2Title: 'ഗ്രഹ സ്ഫുടം • നവഗ്രഹ സ്ഥിതിയും അംശ പട്ടികയും',
          ch2Title: 'അവകഹഡാ ചക്രവും ജന്മ പഞ്ചാംഗവും',
          ch3Title: 'നവഗ്രഹ വിന്യാസവും ചതുർവിധ പുരുഷാർത്ഥങ്ങളും',
          ch4Title: 'വിംശോത്തരി മഹാദശാ കാലചക്രവും ഏഴരശ്ശrecords',
          epilogueTitle: 'ഉപസംഹാരവും ശാന്തി മന്ത്രങ്ങളും'
        },
        bhavaPillars: {
          selectHouse: 'ഭാവം തിരഞ്ഞെടുക്കുക:',
          rashi: 'രാശി',
          lord: 'ഭാവാധിപൻ',
          karaka: 'കാരകൻ',
          anatomy: 'ശരീര ഭാഗം',
          element: 'തത്ത്വം',
          purushartha: 'പുരുഷാർത്ഥം',
          lifeDomain: 'ജീവിത മേഖലയും പ്രധാന വിഷയങ്ങളും:',
          occupyingPlanets: 'സ്ഥിതി ചെയ്യുന്ന ഗ്രഹങ്ങൾ:',
          noPlanets: 'ഗ്രഹങ്ങളൊന്നുമില്ല; ഭാവാധിപന്റെ സ്ഥിതിയാൽ നിയന്ത്രിക്കപ്പെടുന്നു.',
          analysisTitle: 'ആഴത്തിലുള്ള ജ്യോതിഷ വിശകലനം:',
          boonsTitle: 'ശുഭ ഫലങ്ങളും ദൈവാനുഗ്രഹവും:',
          cautionsTitle: 'ജാഗ്രതകളും വെല്ലുവിളികളും:',
          upayasTitle: 'വൈദിക പരിഹാരങ്ങളും മന്ത്രങ്ങളും:',
          counselTitle: 'കർമ്മ സിദ്ധി ഉപദേശം:',
          continuationBanner: 'വിശദമായ തുടർച്ച: ശുഭ ഫലങ്ങളും പരിഹാരങ്ങളും അടുത്ത പേജിൽ കാണുക.',
          goToPart2: 'ഭാഗം 2',
          points: 'കാര്യങ്ങൾ',
          remediesCount: 'പരിഹാരങ്ങൾ',
          rulerLabel: 'രാശ്യാധിപൻ',
          karakaLabel: 'സ്ഥിര കാരകൻ'
        },
        navigation: {
          prevPage: 'മുൻപത്തെ പേജ്',
          nextPage: 'അടുത്ത പേജ്',
          pageLabel: 'പേജ്',
          ofLabel: 'ൽ',
          coverOption: 'പേജ് 1: മുഖചിത്രം',
          chartOption: 'പേജ് 2: ജന്മ ലഗ്ന ചക്രം',
          sphutaOption: 'പേജ് 3: ഗ്രഹ സ്ഫുട പട്ടിക',
          panchangaOption: 'പേജ് 4: അവകഹഡയും പഞ്ചാംഗവും',
          navagrahaOption: 'പേജ് 5: നവഗ്രഹങ്ങളും പുരുഷാർത്ഥങ്ങളും',
          mahadashaOption: 'പേജ് 6: മഹാദശയും ശനി ദോഷവും',
          epilogueOption: 'ശാന്തി മന്ത്രങ്ങൾ'
        },
        footers: {
          bookName: 'ജന്മ കുണ്ഡലി സംഹിത',
          pagePrefix: 'പേജ്',
          coverFooter: 'സാക്ഷ്യപ്പെടുത്തിയ ജാതകം',
          chartFooter: 'ജന്മ ലഗ്ന ചക്രം',
          sphutaFooter: 'ഗ്രഹ സ്ഫുട പട്ടിക',
          panchangaFooter: 'ജന്മ പഞ്ചാംഗം',
          navagrahaFooter: 'നവഗ്രഹ വിന്യാസം',
          mahadashaFooter: 'മഹാദശാ കാലചക്രം',
          bhavaFooter: 'ദ്വാദശ ഭാവ സംഹിത',
          epilogueFooter: 'ശാന്തി മന്ത്രങ്ങൾ'
        },
        cover: {
          title: 'ബൃഹത് ജന്മ കുണ്ഡലി ഗ്രന്ഥം',
          subtitle: 'വൈദിക ജന്മ പത്രിക',
          treatise: 'കർമ്മ വിപാക സംഹിതയും ജീവിത മാർഗ്ഗദർശിയും',
          nativeName: 'ജാതകന്റെ പേര്',
          dob: 'ജനന തീയതി',
          tob: 'ജനന സമയം',
          pob: 'ജനന സ്ഥലം',
          system: 'രീതി',
          defaultNativeName: 'ജാതകൻ'
        },
        panchanga: {
          varna: '1. വർണ്ണം',
          varnaDesc: 'ആത്മീയ പ്രകൃതി',
          vashya: '2. വശ്യം',
          vashyaDesc: 'സ്വാധീനവും ചേർച്ചയും',
          yoni: '3. യോനി',
          yoniDesc: 'സഹജ സ്വഭാവം',
          gana: '4. ഗണം',
          nadi: '5. നാഡി',
          nadiDesc: 'ആരോഗ്യ ഊർജ്ജം',
          paya: '6. പാദം',
          payaDesc: 'അടിസ്ഥാന ബലം',
          element: '7. തത്ത്വം',
          elementDesc: 'മൂല ഊർജ്ജം',
          tithi: '8. തിഥിയും യോഗവും',
          manglikTitle: 'ചൊവ്വാ ദോഷ വിചാരം',
          manglikActive: 'ചൊവ്വാ സ്വാധീനമുണ്ട്',
          manglikNirdosha: 'ദോഷമില്ല',
          pariharaText: 'ദോഷ പരിഹാരമുണ്ട്',
          cautionBadge: 'ശ്രദ്ധിക്കുക',
          auspiciousBadge: 'ശുഭം',
          luckyTitle: 'ശുഭ ഘടകങ്ങൾ',
          gemstone: 'രത്നം:',
          metal: 'ലോഹം:',
          color: 'നിറം:',
          direction: 'ദിശ:'
        },
        purusharthaDetails: {
          dharmaTitle: 'ധർമ്മം (ഭാവങ്ങൾ 1, 5, 9)',
          dharmaDesc: 'ആത്മീയ ലക്ഷ്യം, നീതിബോധം, കർമ്മനിഷ്ഠ',
          arthaTitle: 'അർത്ഥം (ഭാവങ്ങൾ 2, 6, 10)',
          arthaDesc: 'ധനം, തൊഴിൽ, സാമ്പത്തിക സുരക്ഷിതത്വം',
          kamaTitle: 'കാമം (ഭാവങ്ങൾ 3, 7, 11)',
          kamaDesc: 'ആഗ്രഹങ്ങൾ, സ്നേഹം, ബന്ധങ്ങൾ',
          mokshaTitle: 'മോക്ഷം (ഭാവങ്ങൾ 4, 8, 12)',
          mokshaDesc: 'മുക്തി, ആധ്യാത്മികത, മനസ്സമാധാനം'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `ജന്മ ലഗ്ന രാശി: ${sign} (ഒന്നാം ഭാവം)`,
          descTemplate: (sign: string) => `ജന്മ ലഗ്നം ശരീരത്തിന്റെയും ആരോഗ്യത്തിന്റെയും മനസ്സിന്റെയും അടിസ്ഥാനമാണ്. ജനന സമയത്ത് കിഴക്കേ ചക്രവാളത്തിൽ ${sign} രാശി ഉദിച്ചതിനാൽ വ്യക്തിത്വത്തിൽ പ്രത്യേക തേജസ്സും ദൃഢനിശ്ചയവും ഉണ്ടാകുന്നു. ഗ്രഹങ്ങളുടെ വിശദമായ വിവരങ്ങൾ അടുത്ത പേജിലുണ്ട്.`
        },
        sphutaCard: {
          title: 'ഗ്രഹ സ്ഫുടവും ബലാബല അവലോകനവും:',
          desc: 'ഗ്രഹങ്ങളുടെ അംശങ്ങളും സ്ഥിതിയും അവ നൽകുന്ന ഫലങ്ങളുടെ തീവ്രതയെ നിശ്ചയിക്കുന്നു. ഉച്ചത്തിലോ സ്വക്ഷേത്രത്തിലോ ഉള്ള ഗ്രഹങ്ങൾ ശുഭ ഫലങ്ങൾ നൽകുന്നു; നീചത്തിലോ ശത്രു രാശിയിലോ ഉള്ള ഗ്രഹങ്ങൾ ക്ഷമയും വൈദിക പരിഹാരങ്ങളും ആവശ്യപ്പെടുന്നു.'
        },
        insightCard: {
          title: 'ജ്യോതിഷ ദൃഷ്ടി:',
          desc: 'കുണ്ഡലിയിലെ ഗ്രഹ സ്ഥിതി പൂർവ്വജന്മ കർമ്മങ്ങളുടെ പ്രതിഫలనമാണ്. നാല് പുരുഷാർത്ഥങ്ങളും തുല്യമായി പാലിച്ച് യഥാസമയം പരിഹാരങ്ങൾ ചെയ്താൽ ജീവിതത്തിൽ ശ്രേയസ്സ് ഉണ്ടാകും.'
        },
        mahadasha: {
          title: 'വിംശോത്തരി മഹാദശയും ശനി ദോഷവും',
          subtitle: '120 വർഷത്തെ ഗ്രഹ ദശാചക്രം',
          activeSeal: 'സജീവം',
          activeBadge: 'നിലവിലെ ദശയ്ക്ക് പ്രത്യേക മുദ്ര',
          sadesatiTitle: 'ശനി ദശാ ചക്രം'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `ഈ ഭാവത്തിന്റെ നാഥൻ ${lord} ഗ്രഹവും കാരകൻ ${karaka} ഗ്രഹവുമാണ്. സൂചിപ്പിച്ച പരിഹാരങ്ങൾ നിഷ്ഠയോടെ ചെയ്താൽ ${domain} രംഗത്ത് അഭിവൃദ്ധി ഉണ്ടാകും.`
        },
        epilogue: {
          headerTitle: 'ശാന്തി മന്ത്രങ്ങളും ഉപസംഹാരവും',
          mantra1Label: 'മഹാ മൃത്യുഞ്ജയ മന്ത്രം (ആയുസ്സും ആരോഗ്യവും)',
          mantra2Label: 'ഗായത്രീ മന്ത്രം (ജ്ഞാനവും തേജസ്സും)',
          sealBadge: 'സാക്ഷ്യപ്പെടുത്തിയ ജ്യോതിഷം',
          sealTitle: 'വൈദിക ജ്യോതിഷ പീഠ മുദ്ര',
          sealCalculations: (sys: string) => `${sys} സമ്പ്രദായ പ്രകാരം കണക്കാക്കിയത്`,
          refIdPrefix: 'റഫറൻസ്: WMS-'
        }
      };

    case 'Punjabi':
      return {
        planetHeaders: {
          planet: 'ਗ੍ਰਹਿ',
          sign: 'ਰਾਸ਼ੀ',
          house: 'ਭਾਵ',
          dignity: 'ਸਥਿਤੀ'
        },
        cardinalPoints: {
          starLord: 'ਨਕਸ਼ਤਰ ਸੁਆਮੀ',
          subLord: 'ਉਪ ਸੁਆਮੀ',
          nakshatra: 'ਜਨਮ ਨਕਸ਼ਤਰ',
          moonSign: 'ਚੰਦਰ ਰਾਸ਼ੀ'
        },
        chapterLabels: {
          chapter: 'ਅਧਿਆਇ',
          part: 'ਭਾਗ',
          ch1Title: 'ਜਨਮ ਲਗਨ ਚੱਕਰ ਅਤੇ ਗ੍ਰਹਿ ਸਥਿਤੀ',
          ch1Part1Title: 'ਜਨਮ ਲਗਨ ਚੱਕਰ ਅਤੇ ਖਗੋਲੀ ਨਿਰਦੇਸ਼ਾਂਕ',
          ch1Part2Title: 'ਗ੍ਰਹਿ ਸਪਸ਼ਟ • ਨੌਂ ਗ੍ਰਹਿਆਂ ਦੀ ਸਥਿਤੀ ਅਤੇ ਸਾਰਣੀ',
          ch2Title: 'ਅਵਕਹੜਾ ਚੱਕਰ ਅਤੇ ਜਨਮ ਪੰਚਾਂਗ',
          ch3Title: 'ਨਵਗ੍ਰਹਿ ਸਥਿਤੀ ਅਤੇ ਚਾਰ ਪੁਰਸ਼ਾਰਥ',
          ch4Title: 'ਵਿੰਸ਼ੋਤਰੀ ਮਹਾਦਸ਼ਾ ਕਾਲਚੱਕਰ ਅਤੇ ਸਾੜ੍ਹਸਤੀ',
          epilogueTitle: 'ਉਪਸੰਹਾਰ ਅਤੇ ਵੈਦਿਕ ਆਸ਼ੀਰਵਾਦ'
        },
        bhavaPillars: {
          selectHouse: 'ਭਾਵ ਚੁਣੋ:',
          rashi: 'ਰਾਸ਼ੀ',
          lord: 'ਭਾਵ ਸੁਆਮੀ',
          karaka: 'ਕਾਰਕ',
          anatomy: 'ਸਰੀਰ ਅੰਗ',
          element: 'ਤੱਤ',
          purushartha: 'ਪੁਰਸ਼ਾਰਥ',
          lifeDomain: 'ਜੀਵਨ ਖੇਤਰ ਅਤੇ ਮੁੱਖ ਵਿਸ਼ੇ:',
          occupyingPlanets: 'ਸਥਿਤ ਗ੍ਰਹਿ:',
          noPlanets: 'ਕੋਈ ਗ੍ਰਹਿ ਸਥਿਤ ਨਹੀਂ; ਭਾਵ ਸੁਆਮੀ ਦੁਆਰਾ ਨਿਯੰਤਰਿਤ।',
          analysisTitle: 'ਡੂੰਘਾਈ ਨਾਲ ਜੋਤਿਸ਼ ਵਿਸ਼ਲੇਸ਼ਣ:',
          boonsTitle: 'ਸ਼ੁਭ ਫਲ ਅਤੇ ਕਿਰਪਾ:',
          cautionsTitle: 'ਸਾਵਧਾਨੀਆਂ ਅਤੇ ਚੁਣੌਤੀਆਂ:',
          upayasTitle: 'ਵੈਦਿਕ ਉਪਾਅ ਅਤੇ ਮੰਤਰ:',
          counselTitle: 'ਕਰਮ ਸਿੱਧੀ ਸਲਾਹ:',
          continuationBanner: 'ਵਿਸਤ੍ਰਿਤ ਵੇਰਵਾ: ਇਸ ਭਾਵ ਦੇ ਸ਼ੁਭ ਫਲ ਅਤੇ ਉਪਾਅ ਅਗਲੇ ਪੰਨੇ ਉੱਤੇ ਦੇਖੋ।',
          goToPart2: 'ਭਾਗ 2',
          points: 'ਨੁਕਤੇ',
          remediesCount: 'ਉਪਾਅ',
          rulerLabel: 'ਰਾਸ਼ੀ ਸੁਆਮੀ',
          karakaLabel: 'ਸਥਿਰ ਕਾਰਕ'
        },
        navigation: {
          prevPage: 'ਪਿਛਲਾ ਪੰਨਾ',
          nextPage: 'ਅਗਲਾ ਪੰਨਾ',
          pageLabel: 'ਪੰਨਾ',
          ofLabel: 'ਵਿੱਚੋਂ',
          coverOption: 'ਪੰਨਾ 1: ਮੁੱਖ ਪੰਨਾ',
          chartOption: 'ਪੰਨਾ 2: ਜਨਮ ਲਗਨ ਚੱਕਰ',
          sphutaOption: 'ਪੰਨਾ 3: ਗ੍ਰਹਿ ਸਪਸ਼ਟ ਸਾਰਣੀ',
          panchangaOption: 'ਪੰਨਾ 4: ਅਵਕਹੜਾ ਅਤੇ ਪੰਚਾਂਗ',
          navagrahaOption: 'ਪੰਨਾ 5: ਨਵਗ੍ਰਹਿ ਅਤੇ ਪੁਰਸ਼ਾਰਥ',
          mahadashaOption: 'ਪੰਨਾ 6: ਮਹਾਦਸ਼ਾ ਅਤੇ ਸਾੜ੍ਹਸਤੀ',
          epilogueOption: 'ਉਪਸੰਹਾਰ ਅਤੇ ਮੰਤਰ'
        },
        footers: {
          bookName: 'ਜਨਮ ਕੁੰਡਲੀ ਸੰਹਿਤਾ',
          pagePrefix: 'ਪੰਨਾ',
          coverFooter: 'ਪ੍ਰਮਾਣਿਤ ਕੁੰਡਲੀ',
          chartFooter: 'ਜਨਮ ਲਗਨ ਚੱਕਰ',
          sphutaFooter: 'ਗ੍ਰਹਿ ਸਪਸ਼ਟ ਸਾਰਣੀ',
          panchangaFooter: 'ਜਨਮ ਪੰਚਾਂਗ',
          navagrahaFooter: 'ਨਵਗ੍ਰਹਿ ਸਥਿਤੀ',
          mahadashaFooter: 'ਮਹਾਦਸ਼ਾ ਅਤੇ ਸਾੜ੍ਹਸਤੀ',
          bhavaFooter: 'ਦੁਆਦਸ਼ ਭਾਵ ਸੰਹਿਤਾ',
          epilogueFooter: 'ਸ਼ਾਂਤੀ ਮੰਤਰ'
        },
        cover: {
          title: 'ਬ੍ਰਿਹਤ ਜਨਮ ਕੁੰਡਲੀ ਗ੍ਰੰਥ',
          subtitle: 'ਵੈਦਿਕ ਜਨਮ ਪੱਤ੍ਰੀ',
          treatise: 'ਕਰਮ ਵਿਪਾਕ ਸੰਹਿਤਾ ਅਤੇ ਜੀਵਨ ਮਾਰਗਦਰਸ਼ਕ',
          nativeName: 'ਜਾਤਕ ਦਾ ਨਾਮ',
          dob: 'ਜਨਮ ਮਿਤੀ',
          tob: 'ਜਨਮ ਸਮਾਂ',
          pob: 'ਜਨਮ ਸਥਾਨ',
          system: 'ਪੱਧਤੀ',
          defaultNativeName: 'ਜਾਤਕ'
        },
        panchanga: {
          varna: '1. ਵਰਣ',
          varnaDesc: 'ਆਤਮਿਕ ਸੁਭਾਅ',
          vashya: '2. ਵਸ਼ਯ',
          vashyaDesc: 'ਪ੍ਰਭਾਵ ਅਤੇ ਤਾਲਮੇਲ',
          yoni: '3. ਯੋਨੀ',
          yoniDesc: 'ਕੁਦਰਤੀ ਸੁਭਾਅ',
          gana: '4. ਗਣ',
          nadi: '5. ਨਾੜੀ',
          nadiDesc: 'ਸਿਹਤ ਊਰਜਾ',
          paya: '6. ਪਾਵਾ',
          payaDesc: 'ਬੁਨਿਆਦੀ ਬਲ',
          element: '7. ਤੱਤ',
          elementDesc: 'ਮੂਲ ਊਰਜਾ',
          tithi: '8. ਤਿਥੀ ਅਤੇ ਯੋਗ',
          manglikTitle: 'ਮਾਂਗਲਿਕ ਦੋਸ਼ ਵਿਚਾਰ',
          manglikActive: 'ਮਾਂਗਲਿਕ ਪ੍ਰਭਾਵ ਸਰਗਰਮ',
          manglikNirdosha: 'ਨਿਰਦੋਸ਼ (ਕੋਈ ਮਾਂਗਲਿਕ ਦੋਸ਼ ਨਹੀਂ)',
          pariharaText: 'ਦੋਸ਼ ਪਰਿਹਾਰ ਮੌਜੂਦ',
          cautionBadge: 'ਸਾਵਧਾਨ',
          auspiciousBadge: 'ਸ਼ੁਭ',
          luckyTitle: 'ਸ਼ੁਭ ਤੱਤ',
          gemstone: 'ਰਤਨ:',
          metal: 'ਧਾਤੂ:',
          color: 'ਰੰਗ:',
          direction: 'ਦਿਸ਼ਾ:'
        },
        purusharthaDetails: {
          dharmaTitle: 'ਧਰਮ (ਭਾਵ 1, 5, 9)',
          dharmaDesc: 'ਆਤਮਿਕ ਉਦੇਸ਼, ਕਰਤੱਵ ਅਤੇ ਸਦਾਚਾਰ',
          arthaTitle: 'ਅਰਥ (ਭਾਵ 2, 6, 10)',
          arthaDesc: 'ਧਨ, ਕਾਰੋਬਾਰ ਅਤੇ ਸੰਪਤੀ',
          kamaTitle: 'ਕਾਮ (ਭਾਵ 3, 7, 11)',
          kamaDesc: 'ਇੱਛਾਵਾਂ, ਪਿਆਰ ਅਤੇ ਰਿਸ਼ਤੇ',
          mokshaTitle: 'ਮੋਖ (ਭਾਵ 4, 8, 12)',
          mokshaDesc: 'ਮੁਕਤੀ, ਅਧਿਆਤਮ ਅਤੇ ਮਨ ਦੀ ਸ਼ਾਂਤੀ'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `ਜਨਮ ਲਗਨ ਰਾਸ਼ੀ: ${sign} (ਪਹਿਲਾ ਭਾਵ)`,
          descTemplate: (sign: string) => `ਜਨਮ ਲਗਨ ਸਰੀਰ, ਸਿਹਤ ਅਤੇ ਜੀਵਨ ਦ੍ਰਿਸ਼ਟੀਕੋਣ ਦਾ ਮੁੱਖ ਆਧਾਰ ਹੈ। ਜਨਮ ਸਮੇਂ ਪੂਰਬੀ ਦਿਸ਼ਾ ਵਿੱਚ ${sign} ਰਾਸ਼ੀ ਦੇ ਉਦੈ ਹੋਣ ਨਾਲ ਸ਼ਖ਼ਸੀਅਤ ਵਿੱਚ ਆਤਮਵਿਸ਼ਵਾਸ ਅਤੇ ਤੇਜ ਆਉਂਦਾ ਹੈ। ਗ੍ਰਹਿਆਂ ਦੀ ਸਪਸ਼ਟ ਸਥਿਤੀ ਅਗਲੇ ਪੰਨੇ ਉੱਤੇ ਦਿੱਤੀ ਗਈ ਹੈ।`
        },
        sphutaCard: {
          title: 'ਗ੍ਰਹਿ ਸਪਸ਼ਟ ਅਤੇ ਬਲਾਬਲ ਸਮੀਖਿਆ:',
          desc: 'ਵੈਦਿਕ ਜੋਤਿਸ਼ ਵਿੱਚ ਗ੍ਰਹਿਆਂ ਦੀ ਸਥਿਤੀ ਇਹ ਨਿਰਧਾਰਿਤ ਕਰਦੀ ਹੈ ਕਿ ਉਹ ਕਿਸ ਤਰ੍ਹਾਂ ਦੇ ਫਲ ਦੇਣਗੇ। ਉੱਚ ਜਾਂ ਆਪਣੀ ਰਾਸ਼ੀ ਦੇ ਗ੍ਰਹਿ ਸ਼ੁਭ ਫਲ ਦਿੰਦੇ ਹਨ; ਨੀਚ ਜਾਂ ਦੁਸ਼ਮਣ ਰਾਸ਼ੀ ਦੇ ਗ੍ਰਹਿ ਧੀਰਜ ਅਤੇ ਉਪਾਵਾਂ ਦੀ ਪ੍ਰੇਰਨਾ ਦਿੰਦੇ ਹਨ।'
        },
        insightCard: {
          title: 'ਜੋਤਿਸ਼ੀ ਦ੍ਰਿਸ਼ਟੀ:',
          desc: 'ਕੁੰਡਲੀ ਵਿੱਚ ਗ੍ਰਹਿਆਂ ਦੀ ਸਥਿਤੀ ਪਿਛਲੇ ਕਰਮਾਂ ਦਾ ਪ੍ਰਤੀਬਿੰਬ ਹੈ। ਚਾਰੇ ਪੁਰਸ਼ਾਰਥਾਂ ਦਾ ਸੰਤੁਲਨ ਰੱਖ ਕੇ ਨੇਕ ਨੀਅਤ ਨਾਲ ਉਪਾਅ ਕਰਨ ਨਾਲ ਜੀਵਨ ਵਿੱਚ ਕਾਮਯਾਬੀ ਮਿਲਦੀ ਹੈ।'
        },
        mahadasha: {
          title: 'ਵਿੰਸ਼ੋਤਰੀ ਮਹਾਦਸ਼ਾ ਅਤੇ ਸਾੜ੍ਹਸਤੀ',
          subtitle: '120 ਸਾਲ ਦਾ ਕਾਲਚੱਕਰ',
          activeSeal: 'ਸਰਗਰਮ',
          activeBadge: 'ਮੌਜੂਦਾ ਮਹਾਦਸ਼ਾ ਉੱਤੇ ਵਿਸ਼ੇਸ਼ ਮੋਹਰ',
          sadesatiTitle: 'ਸ਼ਨੀ ਸਾੜ੍ਹਸਤੀ ਚੱਕਰ'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `ਇਸ ਭਾਵ ਦੇ ਸੁਆਮੀ ${lord} ਅਤੇ ਕਾਰਕ ${karaka} ਹਨ। ਦੱਸੇ ਗਏ ਵੈਦਿਕ ਉਪਾਅ ਕਰਨ ਨਾਲ ${domain} ਦੇ ਖੇਤਰ ਵਿੱਚ ਤਰੱਕੀ ਹੁੰਦੀ ਹੈ।`
        },
        epilogue: {
          headerTitle: 'ਵੈਦਿਕ ਮਹਾਮੰਤਰ ਅਤੇ ਉਪਸੰਹਾਰ',
          mantra1Label: 'ਮਹਾਮ੍ਰਿਤੁੰਜੈ ਮੰਤਰ (ਸਿਹਤ ਅਤੇ ਸੁਰੱਖਿਆ)',
          mantra2Label: 'ਗਾਇਤਰੀ ਮੰਤਰ (ਬੁੱਧੀ ਅਤੇ ਗਿਆਨ)',
          sealBadge: 'ਪ੍ਰਮਾਣਿਤ ਜੋਤਿਸ਼',
          sealTitle: 'ਵੈਦਿਕ ਜੋਤਿਸ਼ ਬਿਊਰੋ ਮੋਹਰ',
          sealCalculations: (sys: string) => `${sys} ਪੱਧਤੀ ਅਨੁਸਾਰ ਪ੍ਰਮਾਣਿਤ`,
          refIdPrefix: 'ਹਵਾਲਾ: WMS-'
        }
      };

    case 'Odia':
      return {
        planetHeaders: {
          planet: 'ଗ୍ରହ',
          sign: 'ରାଶି',
          house: 'ଭାବ',
          dignity: 'ସ୍ଥିତି'
        },
        cardinalPoints: {
          starLord: 'ନକ୍ଷତ୍ର ପତି',
          subLord: 'ଉପ ପତି',
          nakshatra: 'ଜନ୍ମ ନକ୍ଷତ୍ର',
          moonSign: 'ଚନ୍ଦ୍ର ରାଶି'
        },
        chapterLabels: {
          chapter: 'ଅଧ୍ୟାୟ',
          part: 'ଭାଗ',
          ch1Title: 'ଜନ୍ମ ଲଗ୍ନ ଚକ୍ର ଓ ଗ୍ରହ ସ୍ଥିତି',
          ch1Part1Title: 'ଜନ୍ମ ଲଗ୍ନ ଚକ୍ର ଓ ଖଗୋଳୀୟ ନିର୍ଦ୍ଦେଶାଙ୍କ',
          ch1Part2Title: 'ଗ୍ରହ ସ୍ଫୁଟ • ନବଗ୍ରହ ସ୍ଥିତି ଓ ରାଶି ସାରଣୀ',
          ch2Title: 'ଅବକହଡ଼ା ଚକ୍ର ଓ ଜନ୍ମ ପଞ୍ଜିକା',
          ch3Title: 'ନବଗ୍ରହ ସ୍ଥିତି ଓ ଚତୁର୍ବିଧ ପୁରୁଷାର୍ଥ',
          ch4Title: 'ବିଂଶୋତ୍ତରୀ ମହାଦଶା କାଳଚକ୍ର ଓ ସାଢ଼େସାତୀ',
          epilogueTitle: 'ଉପସଂହାର ଓ ବୈଦିକ ଆଶୀର୍ବାଦ'
        },
        bhavaPillars: {
          selectHouse: 'ଭାବ ଚୟନ:',
          rashi: 'ରାଶି',
          lord: 'ଭାବାଧିପତି',
          karaka: 'କାରକ',
          anatomy: 'ଶରୀର ଅଙ୍ଗ',
          element: 'ତତ୍ତ୍ୱ',
          purushartha: 'ପୁରୁଷାର୍ଥ',
          lifeDomain: 'ଜୀବନ କ୍ଷେତ୍ର ଓ ମୁଖ୍ୟ ବିଷୟ:',
          occupyingPlanets: 'ଅବସ୍ଥିତ ଗ୍ରହ:',
          noPlanets: 'କୌଣସି ପ୍ରତ୍ୟକ୍ଷ ଗ୍ରହ ନାହାନ୍ତି; ଭାବାଧିପତିଙ୍କ ଦ୍ୱାରା ନିୟନ୍ତ୍ରିତ।',
          analysisTitle: 'ଗଭୀର ଜ୍ୟୋତିଷୀୟ ବିଶ୍ଳେଷଣ:',
          boonsTitle: 'ଶୁଭ ଫଳ ଓ ଦୈବ କୃପା:',
          cautionsTitle: 'ସତର୍କତା ଓ ଚ୍ୟାଲେଞ୍ଜ:',
          upayasTitle: 'ବୈଦିକ ଉପାୟ ଓ ମନ୍ତ୍ର:',
          counselTitle: 'କର୍ମ ସିଦ୍ଧି ପରାମର୍ଶ:',
          continuationBanner: 'ବିସ୍ତୃତ ବିବରଣୀ: ଏହି ଭାବର ଶୁଭ ଫଳ ଓ ଉପାୟ ପରବର୍ତ୍ତୀ ପୃଷ୍ଠାରେ ଦେଖନ୍ତୁ।',
          goToPart2: 'ଭାଗ ୨',
          points: 'ବିନ୍ଦୁ',
          remediesCount: 'ଉପାୟ',
          rulerLabel: 'ରାଶିପତି',
          karakaLabel: 'ସ୍ଥିର କାରକ'
        },
        navigation: {
          prevPage: 'ପୂର୍ବ ପୃଷ୍ଠା',
          nextPage: 'ପରବର୍ତ୍ତୀ ପୃଷ୍ଠା',
          pageLabel: 'ପୃଷ୍ଠା',
          ofLabel: 'ର',
          coverOption: 'ପୃଷ୍ଠା ୧: ମୁଖପୃଷ୍ଠ',
          chartOption: 'ପୃଷ୍ଠା ୨: ଜନ୍ମ ଲଗ୍ନ ଚକ୍ର',
          sphutaOption: 'ପୃଷ୍ଠା ୩: ଗ୍ରହ ସ୍ଫୁଟ ସାରଣୀ',
          panchangaOption: 'ପୃଷ୍ଠା ୪: ଅବକହଡ଼ା ଓ ପଞ୍ଜିକା',
          navagrahaOption: 'ପୃଷ୍ଠା ୫: ନବଗ୍ରହ ଓ ପୁରୁଷାର୍ଥ',
          mahadashaOption: 'ପୃଷ୍ଠା ୬: ମହାଦଶା ଓ ସାଢ଼େସାତୀ',
          epilogueOption: 'ଉପସଂହାର ଓ ମନ୍ତ୍ର'
        },
        footers: {
          bookName: 'ଜନ୍ମ କୁଣ୍ଡଳୀ ସଂହିତା',
          pagePrefix: 'ପୃଷ୍ଠା',
          coverFooter: 'ପ୍ରମାଣିତ କୁଣ୍ଡଳୀ',
          chartFooter: 'ଜନ୍ମ ଲଗ୍ନ ଚକ୍ର',
          sphutaFooter: 'ଗ୍ରହ ସ୍ଫୁଟ ସାରଣୀ',
          panchangaFooter: 'ଜନ୍ମ ପଞ୍ଜିକା',
          navagrahaFooter: 'ନବଗ୍ରହ ସ୍ଥିତି',
          mahadashaFooter: 'ମହାଦଶା ଓ ସାଢ଼େସାତୀ',
          bhavaFooter: 'ଦ୍ୱାଦଶ ଭାବ ସଂହିତା',
          epilogueFooter: 'ଶାନ୍ତି ମନ୍ତ୍ର'
        },
        cover: {
          title: 'ବୃହତ୍ ଜନ୍ମ କୁଣ୍ଡଳୀ ଗ୍ରନ୍ଥ',
          subtitle: 'ବୈଦିକ ଜନ୍ମ ପତ୍ରିକା',
          treatise: 'କର୍ମ ବିପାକ ସଂହିତା ଓ ଜୀବନ ମାର୍ଗଦର୍ଶିକା',
          nativeName: 'ଜାତକଙ୍କ ନାମ',
          dob: 'ଜନ୍ମ ତାରିଖ',
          tob: 'ଜନ୍ମ ସମୟ',
          pob: 'ଜନ୍ମ ସ୍ଥାନ',
          system: 'ପଦ୍ଧତି',
          defaultNativeName: 'ଜାତକ'
        },
        panchanga: {
          varna: '୧. ବର୍ଣ୍ଣ',
          varnaDesc: 'ଆଧ୍ୟାତ୍ମିକ ପ୍ରବୃତ୍ତି',
          vashya: '୨. ବଶ୍ୟ',
          vashyaDesc: 'ପ୍ରଭାବ ଓ ସମନ୍ୱୟ',
          yoni: '୩. ଯୋନି',
          yoniDesc: 'ସହଜ ସ୍ୱଭାବ',
          gana: '୪. ଗଣ',
          nadi: '୫. ନାଡ଼ି',
          nadiDesc: 'ସ୍ୱାସ୍ଥ୍ୟ ଊର୍ଜା',
          paya: '୬. ପାଦ',
          payaDesc: 'ମୂଳ ଶକ୍ତି',
          element: '୭. ତତ୍ତ୍ୱ',
          elementDesc: 'ମୂଳ ତତ୍ତ୍ୱ',
          tithi: '୮. ତିଥି ଓ ଯୋଗ',
          manglikTitle: 'ମାଙ୍ଗଳିକ ଦୋଷ ବିଚାର',
          manglikActive: 'ମାଙ୍ଗଳିକ ପ୍ରଭାବ ସକ୍ରିୟ',
          manglikNirdosha: 'ନିର୍ଦ୍ଦୋଷ (କୌଣସି ମାଙ୍ଗଳିକ ଦୋଷ ନାହିଁ)',
          pariharaText: 'ଦୋଷ ପରିହାର ଉପସ୍ଥିତ',
          cautionBadge: 'ସତର୍କ',
          auspiciousBadge: 'ଶୁଭ',
          luckyTitle: 'ଶୁଭ ତତ୍ତ୍ୱ',
          gemstone: 'ରତ୍ନ:',
          metal: 'ଧାତୁ:',
          color: 'ରଙ୍ଗ:',
          direction: 'ଦିଗ:'
        },
        purusharthaDetails: {
          dharmaTitle: 'ଧର୍ମ (ଭାବ ୧, ୫, ୯)',
          dharmaDesc: 'ଆତ୍ମାର ଲକ୍ଷ୍ୟ, ଧର୍ମପାଳନ ଓ ନୈତିକତା',
          arthaTitle: 'ଅର୍ଥ (ଭାବ ୨, ୬, ୧୦)',
          arthaDesc: 'ଧନ, କର୍ମଜୀବନ ଓ ଆର୍ଥିକ ସ୍ଥିରତା',
          kamaTitle: 'କାମ (ଭାବ ୩, ୭, ୧୧)',
          kamaDesc: 'ଇଚ୍ଛା, ସମ୍ପର୍କ ଓ ସ୍ନେହ',
          mokshaTitle: 'ମୋକ୍ଷ (ଭାବ ୪, ୮, ୧୨)',
          mokshaDesc: 'ମୁକ୍ତି, ଆଧ୍ୟାତ୍ମିକତା ଓ ମାନସିକ ଶାନ୍ତି'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `ଜନ୍ମ ଲଗ୍ନ ରାଶି: ${sign} (ପ୍ରଥମ ଭାବ)`,
          descTemplate: (sign: string) => `ଜନ୍ମ ଲଗ୍ନ ଶରୀର, ଆରୋଗ୍ୟ ଓ ଜୀବନ ଦୃଷ୍ଟିକୋଣର ମୂଳ ଆଧାର। ଜନ୍ମ ସମୟରେ ପୂର୍ବ ଦିଗବଳୟରେ ${sign} ରାଶି ଉଦୟ ହେତୁ ବ୍ୟକ୍ତିତ୍ୱରେ ଦୃଢ଼ତା ଓ ଆତ୍ମବିଶ୍ୱାସ ପ୍ରକାଶ ପାଏ। ଗ୍ରହମାନଙ୍କ ସ୍ଫୁଟ ସାରଣୀ ପରବର୍ତ୍ତୀ ପୃଷ୍ଠାରେ ପ୍ରଦତ୍ତ।`
        },
        sphutaCard: {
          title: 'ଗ୍ରହ ସ୍ଫୁଟ ଓ ବଳାବଳ ସମୀକ୍ଷା:',
          desc: 'ବୈଦିକ ଜ୍ୟୋତିଷରେ ଗ୍ରହଙ୍କ ଅଂଶ ଓ ଅବସ୍ଥା ତାଙ୍କ ଫଳ ପ୍ରଦାନର ଶକ୍ତି ନିର୍ଣ୍ଣୟ କରେ। ଉଚ୍ଚ ବା ସ୍ୱରାଶିରେ ଥିବା ଗ୍ରହ ଶୁଭ ଫଳ ସହଜରେ ବୃଦ୍ଧି କରନ୍ତି; ନୀଚ ବା ଶତ୍ରୁ ରାଶିସ୍ଥ ଗ୍ରହ ଧୈର୍ଯ୍ୟ ଓ ଉପାୟର ପ୍ରେରଣା ଦିଅନ୍ତି।'
        },
        insightCard: {
          title: 'ଜ୍ୟୋତିଷୀୟ ଦୃଷ୍ଟି:',
          desc: 'କୁଣ୍ଡଳୀରେ ଗ୍ରହମାନଙ୍କ ସ୍ଥିତି ସଞ୍ଚିତ କର୍ମର ପ୍ରତିବିମ୍ବ। ଚାରୋଟି ପୁରୁଷାର୍ଥର ସନ୍ତୁଳନ ରଖି ଉପାୟ ଆଚରଣ କଲେ ଜୀବନରେ ସିଦ୍ଧି ଲାଭ ହୁଏ।'
        },
        mahadasha: {
          title: 'ବିଂଶୋତ୍ତରୀ ମହାଦଶା ଓ ସାଢ଼େସାତୀ',
          subtitle: '୧୨୦ ବର୍ଷର କାଳଚକ୍ର',
          activeSeal: 'ଚାଲୁ ରହିଛି',
          activeBadge: 'ବର୍ତ୍ତମାନ ମହାଦଶା ଉପରେ ସ୍ୱତନ୍ତ୍ର ମୋହର',
          sadesatiTitle: 'ଶନି ସାଢ଼େସାତୀ ଚକ୍ର'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `ଏହି ଭାବର ଅଧିପତି ${lord} ଓ କାରକ ${karaka} ଅଟନ୍ତି। ଉକ୍ତ ବୈଦିକ ଉପାୟ ନିଷ୍ଠାର ସହ ପାଳନ କଲେ ${domain} କ୍ଷେତ୍ରରେ ଉନ୍ନତି ହୁଏ।`
        },
        epilogue: {
          headerTitle: 'ବୈଦିକ ମହାମନ୍ତ୍ର ଓ ଉପସଂହାର',
          mantra1Label: 'ମହାମୃତ୍ୟୁଞ୍ଜୟ ମନ୍ତ୍ର (ସ୍ୱାସ୍ଥ୍ୟ ଓ ସୁରକ୍ଷା)',
          mantra2Label: 'ଗାୟତ୍ରୀ ମନ୍ତ୍ର (ବୁଦ୍ଧି ଓ ତେଜ)',
          sealBadge: 'ପ୍ରମାଣିତ ଜ୍ୟୋତିଷ',
          sealTitle: 'ବୈଦିକ ଜ୍ୟୋତିଷ ପୀଠ ମୁଦ୍ରା',
          sealCalculations: (sys: string) => `${sys} ପଦ୍ଧତି ଅନୁସାରେ ପ୍ରମାଣିତ`,
          refIdPrefix: 'ସନ୍ଦର୍ଭ: WMS-'
        }
      };

    case 'Hindi':
    default:
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
          ch1Part1Title: 'जन्म लग्न चक्र एवं खगोलीय निर्देशांक',
          ch1Part2Title: 'ग्रह स्पष्ट • नवग्रह स्थिति, राशि एवं बलाबल सारिणी',
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
          remediesCount: 'उपचार',
          rulerLabel: 'राशि स्वामी',
          karakaLabel: 'स्थिर कारक'
        },
        navigation: {
          prevPage: 'पिछला पृष्ठ',
          nextPage: 'अगला पृष्ठ',
          pageLabel: 'पृष्ठ',
          ofLabel: 'कुल',
          coverOption: 'पृष्ठ १: शाही मुखपृष्ठ',
          chartOption: 'पृष्ठ २: जन्म लग्न चक्र',
          sphutaOption: 'पृष्ठ ३: ग्रह स्पष्ट एवं ग्रह तालिका',
          panchangaOption: 'पृष्ठ ४: अवकहड़ा चक्र एवं जन्म पंचांग',
          navagrahaOption: 'पृष्ठ ५: नवग्रह स्थिति एवं पुरुषार्थ',
          mahadashaOption: 'पृष्ठ ६: विंशोत्तरी महादशा एवं साढ़ेसाती',
          epilogueOption: 'उपसंहार एवं मन्त्र'
        },
        footers: {
          bookName: 'जन्म कुण्डली संहिता',
          pagePrefix: 'पृष्ठ',
          coverFooter: 'ज्योतिषपीठ प्रमाणीकरण',
          chartFooter: 'जन्म लग्न चक्र',
          sphutaFooter: 'ग्रह स्पष्ट सारिणी',
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
          system: 'सिद्धान्त',
          defaultNativeName: 'जातक'
        },
        panchanga: {
          varna: '१. वर्ण',
          varnaDesc: 'आत्मिक प्रकृति',
          vashya: '२. वश्य',
          vashyaDesc: 'प्रभाव व सामंजस्य',
          yoni: '३. योनि',
          yoniDesc: 'प्रवृत्तिमूलक स्वभाव',
          gana: '४. गण',
          nadi: '५. नाड़ी',
          nadiDesc: 'जैविक ऊर्जा व स्वास्थ्य',
          paya: '६. पाया',
          payaDesc: 'आधारभूत स्थिति',
          element: '७. तत्त्व',
          elementDesc: 'मूलभूत ऊर्जा',
          tithi: '८. पक्ष व तिथि',
          manglikTitle: 'माङ्गलिक दोष विचार',
          manglikActive: 'माङ्गलिक प्रभाव सक्रिय',
          manglikNirdosha: 'निर्दोष (कोई माङ्गलिक दोष नहीं)',
          pariharaText: 'परिहार उपस्थित',
          cautionBadge: 'सचेत',
          auspiciousBadge: 'शुभ',
          luckyTitle: 'शुभ तत्त्व सारिणी',
          gemstone: 'रत्न:',
          metal: 'धातु:',
          color: 'रंग:',
          direction: 'दिशा:'
        },
        purusharthaDetails: {
          dharmaTitle: 'धर्म (भाव १, ५, ९)',
          dharmaDesc: 'आत्मिक उद्देश्य, कर्तव्यनिष्ठा व नैतिक धर्म',
          arthaTitle: 'अर्थ (भाव २, ६, १०)',
          arthaDesc: 'धन, आजीविका व संचित कोष',
          kamaTitle: 'काम (भाव ३, ७, ११)',
          kamaDesc: 'कामना, प्रेम, अभिलाषा व सम्बंध',
          mokshaTitle: 'मोक्ष (भाव ४, ८, १२)',
          mokshaDesc: 'मुक्ति, अध्यात्म व आत्म-शांति'
        },
        lagnaCard: {
          titleTemplate: (sign: string) => `जन्म लग्न राशि: ${sign} (प्रथम भाव / लग्न केन्द्र)`,
          descTemplate: (sign: string) => `जन्म लग्न जातक के स्थूल शरीर, आरोग्य, जीवन ऊर्जा एवं दृष्टिकोण का मुख्य आधार है। जन्म समय पूर्व क्षितिज पर ${sign} राशि के उदय से व्यक्तित्व में विशिष्ट आभा, दृढ संकल्प एवं स्वाभाविक तेज का संचार होता है। संपूर्ण नवग्रहों की स्पष्ट स्थिति, राशि व बलाबल आगामी पृष्ठ पर प्रस्तुत है।`
        },
        sphutaCard: {
          title: 'ग्रह स्पष्ट एवं ग्रह बलाबल समीक्षा:',
          desc: 'वैदिक ज्योतिष में ग्रहों की स्पष्ट स्थिति एवं गरिमा यह निर्धारित करती है कि ग्रह अपने कारकतत्वों का फल किस तीव्रता से प्रदान करेंगे। उच्च अथवा स्वराशि में स्थित ग्रह शुभ फलों में सहज वृद्धि करते हैं, जबकि नीच या शत्रु राशि के ग्रह धैर्य एवं शास्त्रीय उपायों की आवश्यकता रेखांकित करते हैं।'
        },
        insightCard: {
          title: 'ज्योतिषीय दृष्टि:',
          desc: 'आपकी जन्म पत्रिका में ग्रहों की स्थिति संचित प्रारब्ध कर्मों का दर्पण है। चारों पुरुषार्थों में ग्रहों का संतुलन यह दर्शाता है कि समयबद्ध कर्तव्य पालन, नैतिक आचरण एवं शास्त्रीय उपायों द्वारा जीवन के समस्त क्षेत्रों में संतुलन व सिद्धि प्राप्त होती है।'
        },
        mahadasha: {
          title: 'विंशोत्तरी महादशा काल चक्र एवं साढ़ेसाती',
          subtitle: '१२० वर्षीय ग्रह काल चक्र',
          activeSeal: 'सक्रिय',
          activeBadge: 'सक्रिय महादशा पर विशेष मुहर',
          sadesatiTitle: 'शनि साढ़ेसाती चक्र (चन्द्र राशि अनुसार)'
        },
        counsel: {
          counselTemplate: (lord: string, karaka: string, domain: string) => `इस भाव के अधिपति ${lord} हैं एवं नैसर्गिक कारक ${karaka} हैं। उल्लिखित वैदिक उपायों का निष्ठापूर्वक पालन करने से नकारात्मक गोचर शांत होते हैं तथा ${domain} में शुभता व उन्नति की प्राप्ति होती है।`
        },
        epilogue: {
          headerTitle: 'वैदिक महामन्त्र एवं अन्तिम परामर्श',
          mantra1Label: 'महामृत्युंजय मन्त्र (आरोग्य, जीवन ऊर्जा व सुरक्षा)',
          mantra2Label: 'गायत्री मन्त्र (बौद्धिक जागरण व आत्मतेज)',
          sealBadge: 'प्रमाणित ज्योतिष',
          sealTitle: 'वैदिक ज्योतिष ब्यूरो मुहर',
          sealCalculations: (sys: string) => `${sys} सिद्धान्त अनुसार प्रमाणित`,
          refIdPrefix: 'सन्दभ संख्या: WMS-'
        }
      };
  }
};
