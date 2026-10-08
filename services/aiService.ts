import { GoogleGenAI } from "@google/genai";
import { BirthDetails, MatchmakingDetails, Timeframe, Language, ChatMessage, KundaliResponse, KundaliSystem } from "../types";
import { StorageService } from "./storageService";

// ---------------------------------------------------------------------------
// ACTIVE GEMINI MODELS & MULTI-KEY ROTATION
// ---------------------------------------------------------------------------
// Models ordered by priority:
// 1. gemini-3.5-flash-lite (high throughput, free-tier friendly)
// 2. gemini-3.8-flash (official GA model recommended by Google)
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];

// Multi-key rotation — add up to 3 free Gemini keys on Vercel:
//   VITE_API_KEY, VITE_API_KEY_2, VITE_API_KEY_3
const GEMINI_KEYS = [
  process.env.API_KEY,
  process.env.API_KEY_2,
  process.env.API_KEY_3,
].filter(Boolean) as string[];

let _keyIndex = 0;
const getCurrentKey = () => {
  if (GEMINI_KEYS.length === 0)
    throw new Error("Gemini API key is missing. Add VITE_API_KEY to your Vercel environment variables.");
  return GEMINI_KEYS[_keyIndex % GEMINI_KEYS.length];
};
const rotateKey = () => { _keyIndex = (_keyIndex + 1) % Math.max(GEMINI_KEYS.length, 1); };

const isQuotaError = (err: any) =>
  String(err).includes("429") ||
  String(err).includes("RESOURCE_EXHAUSTED") ||
  String(err).includes("quota");

const isNotFoundError = (err: any) =>
  String(err).includes("404") ||
  String(err).includes("NOT_FOUND") ||
  String(err).includes("not found");

// Cap chat history to 10 messages to prevent runaway token usage
const MAX_HISTORY_MESSAGES = 10;

const getCurrentDate = () => {
  const now = new Date();
  return `${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

// ---------------------------------------------------------------------------
// KUNDALI SYSTEM CONFIGURATIONS
// ---------------------------------------------------------------------------
export const KUNDALI_SYSTEM_PROMPTS: Record<KundaliSystem, {
  name: string;
  role: string;
  specifics: string;
}> = {
  kp: {
    name: "K. P. System (Krishnamurti Paddhati)",
    role: "You are a master K. P. System Astrologer (Krishnamurti Paddhati, Placidus house division, KP Ayanamsha).",
    specifics: `Apply authentic K. P. Astrology principles:
1. **K. P. Profile**: Lagna, Moon Sign, Nakshatra, Pada, Star Lord, Sub Lord, and 4 Ruling Planets (Lagna Lord, Moon Star Lord, Moon Rashi Lord, Day Lord).
2. **K. P. Planetary Table**: Sidereal planetary positions with Star Lord and Sub Lord for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
3. **12 Cuspal Sub-Lords Table**: Degrees, Sign, Star Lord, and Cuspal Sub-Lord for Cusps 1 through 12 (Placidus system).
4. **House Significations & Event Analysis**:
   - 1st Cusp Sub-Lord (Health, Longevity, General Nature)
   - 2nd & 11th Cusp Sub-Lords (Wealth, Financial Gains)
   - 7th Cusp Sub-Lord (Marriage & Partnerships)
   - 10th Cusp Sub-Lord (Career & Profession)
5. **Vimshottari Mahadasha Lifelong Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all 9 Mahadasha periods covering the full 120-year span starting from the native's birth date. Highlight the currently active Mahadasha and Antardasha.
6. **Shani Saadesati Lifecycle Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all 3 phases (1st Phase / Rising, 2nd Phase / Peak, 3rd Phase / Setting) of Saturn's transit over the natal Moon sign. State clearly whether the native is in a Past, Currently Active, or Upcoming Saadesati period.
7. **K. P. Remedies & Gemstones** based on beneficial cuspal significators.`
  },
  parashari: {
    name: "Classical Vedic Parashari",
    role: "You are a venerable Vedic Astrologer grounded in classical Brihat Parashara Hora Shastra (Lahiri Ayanamsha).",
    specifics: `Apply classical Parashari principles:
1. **Panchanga & Birth Profile**: Lagna, Moon Sign (Rashi), Nakshatra, Pada, Nakshatra Lord, Tithi, Yoga, Karana.
2. **Planetary Positions Table**: Sidereal degrees, Rashi, Nakshatra, Lord, Exaltation/Debilitation/Own Sign, Retrograde status, Combust status.
3. **12 Bhava (House) In-Depth Analysis**: Detailed assessment of Kendras (1, 4, 7, 10), Trikonas (1, 5, 9), and Dusthanas (6, 8, 12).
4. **Planetary Yogas**: Identify major Raja Yogas, Dhana Yogas, Pancha Mahapurusha Yogas, Gajakesari Yoga, Viparita Yogas, and Doshas (Mangal/Kalsarp).
5. **Vimshottari Mahadasha Lifelong Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year, e.g., 1995 – 2015) for all 9 Mahadashas from birth date up to 120 years. State the currently active Mahadasha and Antardasha with predictive dates.
6. **Shani Saadesati Lifecycle Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all 3 phases (1st Phase / Rising, 2nd Phase / Peak, 3rd Phase / Setting). State clearly if Saadesati is Past, Currently Active, or Upcoming.
7. **Classical Vedic Remedies**: Mantras, gemstones, fasts, and daan (charity).`
  },
  jaimini: {
    name: "Jaimini Astrology System",
    role: "You are an authority on Jaimini Upadesha Sutras and Maharishi Jaimini astrology.",
    specifics: `Apply authentic Jaimini principles:
1. **7 Chara Karakas Table**:
   - Atmakaraka (AK - Soul Planet)
   - Amatyakaraka (AmK - Career & Intellect)
   - Bhratrikaraka (BK - Siblings & Gurus)
   - Matrikaraka (MK - Mother & Property)
   - Putrakaraka (PK - Children & Creativity)
   - Gnatikaraka (GK - Obstacles & Enemies)
   - Darakaraka (DK - Spouse & Partnerships)
2. **Special Lagnas**: Lagna, Arudha Lagna (AL), Upapada Lagna (UL), Darapada (A7), and Karakamsa Lagna.
3. **Jaimini Rashi Drishti**: Aspects between cardinal, fixed, and mutable signs.
4. **Chara Dasha Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for each sign Dasha period and identify the current active Dasha.
5. **Vimshottari Mahadasha & Shani Saadesati Years Table (MANDATORY)**: Provide the exact calendar year ranges for the native's Mahadashas and Saturn Saadesati transit cycles.
6. **Soul Mission & Marriage Analysis** based on AK and UL.
7. **Jaimini Remedies & Spiritual Alignments** tailored to the Atmakaraka.`
  },
  lalkitab: {
    name: "Lal Kitab System",
    role: "You are an expert Lal Kitab Farman and Arman practitioner.",
    specifics: `Apply authentic Lal Kitab principles:
1. **Kalpurush Kundali Mapping**: Interpret planetary placements with Aries fixed as House 1, Taurus as House 2, etc.
2. **Grah Status**: Identify Pakka Ghar (permanent houses), Kismat Jagane Wale Grah (luck activators), and Soye Hue Grah/Ghar (sleeping planets/houses).
3. **Pitra Rin & Ancestral Debts**: Diagnose ancestral debts (Pitri Rin, Matri Rin, Stri Rin, Swa-Rin) from planetary combinations.
4. **Lal Kitab Grah Dasha & Vimshottari Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for major planetary dasha periods.
5. **Shani Saadesati / Saturn Cycle Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for the 3 phases of Saturn's transit.
6. **Authentic Lal Kitab Totkas (Remedies)**: Clear, practical, safe remedies (e.g. offerings in running water, silver square, caring for specific animals).`
  },
  nadi: {
    name: "Bhrigu Nandi Nadi",
    role: "You are an initiate in classical Bhrigu Nandi Nadi and Tamil Nadi astrology.",
    specifics: `Apply authentic Nadi astrology principles:
1. **Planetary Directional Connections**:
   - Dharma Triad (1-5-9 signs / directions)
   - Artha Triad (2-6-10 signs)
   - Kama Triad (3-7-11 signs)
   - Moksha Triad (4-8-12 signs)
2. **Karakatwa Linkages**:
   - Jeeva Karaka (Jupiter) & its relationships to other planets (Soul journey)
   - Karma Karaka (Saturn) & professional karma
   - Budha (Education/Business) & Shukra (Wealth/Spouse) linkages
3. **Vimshottari Dasha Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all planetary dasha cycles from birth date.
4. **Shani Saadesati & Double Transit Timeline (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for Saturn Saadesati phases (Rising, Peak, Setting) over natal Moon.
5. **Karmic Blessings & Obstacles** with Nadi remedial guidance.`
  },
  western: {
    name: "Western Tropical Astrology",
    role: "You are a master psychological and Hellenistic Western Astrologer (Tropical Zodiac, Placidus Houses).",
    specifics: `Apply Western Tropical astrology principles:
1. **The Big Three & Angles**: Tropical Ascendant (Rising), Sun Sign, Moon Sign, Midheaven (MC), and IC.
2. **Planetary Positions Table**: Sun through Pluto + Chiron degrees in Tropical signs and Placidus houses.
3. **Major Aspect Matrix**: Conjunctions, Oppositions, Trines, Squares, and Sextiles with exact orbs.
4. **Major Life Transits & Saturn Return Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for major Saturn transit cycles (Saturn Return at age 28-30 and 58-60) and Saturn over natal Moon.
5. **Progressed Timeline / Dasha Equivalent Table (MANDATORY)**: Provide the year-by-year major planetary transit phases with exact calendar years.
6. **Psychological & Life Path Profile**: Core archetype, Shadow work, relationships, and career trajectory.`
  }
};

// ---------------------------------------------------------------------------
// GEMINI CORE HELPERS
// ---------------------------------------------------------------------------
interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
}

const buildGeminiClient = () => new GoogleGenAI({ apiKey: getCurrentKey() });

/**
 * Executes a Gemini action with automatic model failover and API key rotation.
 * 1. Tries the primary model (gemini-3.5-flash-lite).
 * 2. If 404/NOT_FOUND, falls back to gemini-3.8-flash immediately.
 * 3. If 429/quota exceeded, rotates through available API keys.
 */
const executeWithGemini = async <T>(
  action: (ai: GoogleGenAI, model: string) => Promise<T>
): Promise<T> => {
  let lastErr: any;
  for (const model of GEMINI_MODELS) {
    const keyAttempts = Math.max(GEMINI_KEYS.length, 1);
    for (let attempt = 0; attempt < keyAttempts; attempt++) {
      try {
        const ai = buildGeminiClient();
        return await action(ai, model);
      } catch (err: any) {
        lastErr = err;
        if (isNotFoundError(err)) {
          console.warn(`Model ${model} not available, switching to next candidate model...`);
          break; // Move immediately to next model
        }
        if (isQuotaError(err) && GEMINI_KEYS.length > 1) {
          console.warn(`Gemini key [${_keyIndex}] quota hit on ${model}, rotating to next key...`);
          rotateKey();
          continue;
        }
        if (isQuotaError(err)) {
          // Single key quota exhausted on this model, attempt next model before giving up
          break;
        }
        throw err;
      }
    }
  }
  throw lastErr;
};

/** Text-only request with model failover and key rotation */
const callAI = async (systemPrompt: string, userPrompt: string, jsonMode = false): Promise<string> => {
  return executeWithGemini(async (ai, model) => {
    const messages: GeminiMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: "user", parts: [{ text: systemPrompt }] });
      messages.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions precisely." }] });
    }
    messages.push({ role: "user", parts: [{ text: userPrompt }] });

    const chat = ai.chats.create({ model, history: messages.slice(0, -1) } as any);
    const response = await chat.sendMessage({ message: messages[messages.length - 1].parts as any });

    let text = response.text ?? "";
    if (!text) throw new Error("Empty response from Gemini.");
    if (jsonMode) text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    return text;
  });
};

/** Multi-turn chat with model failover and key rotation */
const callAIChat = async (systemPrompt: string, history: ChatMessage[], userQuestion: string): Promise<string> => {
  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);
  return executeWithGemini(async (ai, model) => {
    const messages: GeminiMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: "user", parts: [{ text: systemPrompt }] });
      messages.push({ role: "model", parts: [{ text: "Understood. Ready to assist." }] });
    }
    for (const msg of trimmedHistory) {
      messages.push({ role: msg.role === "user" ? "user" : "model", parts: [{ text: msg.text }] });
    }
    messages.push({ role: "user", parts: [{ text: userQuestion }] });

    const chat = ai.chats.create({ model, history: messages.slice(0, -1) } as any);
    const response = await chat.sendMessage({ message: messages[messages.length - 1].parts as any });

    const text = response.text ?? "";
    if (!text) throw new Error("Empty response from Gemini.");
    return text;
  });
};

/** Vision request with model failover and key rotation */
const callAIVision = async (textPrompt: string, imageDataUrl: string): Promise<string> => {
  const mimeType = imageDataUrl.split(";")[0].replace("data:", "") || "image/jpeg";
  const base64Data = imageDataUrl.split(",")[1] || imageDataUrl;
  return executeWithGemini(async (ai, model) => {
    const chat = ai.chats.create({ model, history: [] } as any);
    const response = await chat.sendMessage({
      message: [
        { text: textPrompt },
        { inlineData: { mimeType, data: base64Data } },
      ] as any,
    });
    const text = response.text ?? "";
    if (!text) throw new Error("Empty response from Gemini.");
    return text;
  });
};

// ---------------------------------------------------------------------------
// UTILS
// ---------------------------------------------------------------------------
const parseAIResponse = (text: string) => {
  if (!text) throw new Error("Empty response.");
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return JSON.parse(text);
  } catch (e) {
    console.error("Parse failed", text);
    throw new Error("Decoding failed.");
  }
};

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// TRANSLATION HELPER (Direct & Native Script)
// ---------------------------------------------------------------------------
export const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (targetLanguage === "English" || !text) return text;
  try {
    const translated = await callAI(
      `You are an expert translator specializing in Vedic astrology.
Translate the following text accurately and fluently into ${targetLanguage} (using native ${targetLanguage} script).
Rules:
1. Return ONLY the translated text — no preamble or commentary.
2. Preserve ALL markdown formatting (headings, bullet points, bold text, tables).
3. Naturally translate astrological and spiritual terms into appropriate ${targetLanguage} equivalents.`,
      text
    );
    return translated.trim() || text;
  } catch (err) {
    console.error("Translation helper error", err);
    return text;
  }
};

// ---------------------------------------------------------------------------
// GEOCODING (OpenStreetMap — no AI key needed)
// ---------------------------------------------------------------------------
export const getCoordinates = async (location: string) => {
  const cacheKey = `coords_${location.toLowerCase().replace(/\s/g, "_")}`;
  const cached = StorageService.get<any>(cacheKey) || null;
  if (cached) return cached;

  const result = await withRetry(async () => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { "User-Agent": "WhatMyStarsSaysVedicApp/1.0" } }
    );

    if (!response.ok) throw new Error("Geocoding request failed");
    const data = await response.json();

    if (!data || data.length === 0) throw new Error(`Location not found: ${location}`);

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      formattedAddress: data[0].display_name,
    };
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));
  StorageService.save(cacheKey, result, 720);
  return result;
};

// ---------------------------------------------------------------------------
// HOROSCOPE
// Generates directly in target language in a single efficient call
// ---------------------------------------------------------------------------
export const getHoroscope = async (sign: string, timeframe: Timeframe, language: Language = "English") => {
  const ttl = timeframe === "daily" ? 12 : 168;
  const langKey = StorageService.getKeys.horoscope(sign, timeframe, language);
  const cached = StorageService.get<any>(langKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    const text = await callAI(
      `You are a Master Vedic Astrologer (Parashari system, Lahiri Ayanamsha). Current date: ${getCurrentDate()}.
Provide a ${timeframe} horoscope for Moon Sign / Rashi: ${sign}.
Analyze precise sidereal planetary transits (Career, Health, Relationships, Finance) using classical Vedic principles.
DO NOT use toxic positivity — provide harsh truths when planetary math dictates it.

CRITICAL LANGUAGE REQUIREMENT:
You MUST write all textual descriptions, predictions, and field values in ${language} (using authentic native ${language} script).
All 8 values in the JSON object must be written fluently in ${language}.
The keys of the JSON object must remain in English as shown below.`,
      `Return a valid JSON object (no markdown code fences):
{
  "overview": "Detailed overview written in ${language}",
  "career": "Career prediction written in ${language}",
  "health": "Health prediction written in ${language}",
  "relationships": "Relationships prediction written in ${language}",
  "finance": "Finance prediction written in ${language}",
  "spirituality": "Spirituality prediction written in ${language}",
  "luckyColor": "Lucky color in ${language}",
  "luckyNumber": "Lucky number string"
}`,
      true // jsonMode
    );
    return parseAIResponse(text);
  });

  StorageService.save(langKey, result, ttl);
  return result;
};

// ---------------------------------------------------------------------------
// KUNDALI
// Generates directly in target language in a single efficient call using the chosen system
// ---------------------------------------------------------------------------
export const getKundaliAnalysis = async (
  details: BirthDetails,
  language: Language,
  system: KundaliSystem = 'kp'
): Promise<KundaliResponse> => {
  const config = KUNDALI_SYSTEM_PROMPTS[system] || KUNDALI_SYSTEM_PROMPTS.kp;
  const langKey = StorageService.getKeys.kundali(details.name, details.dob, language, system);
  const cached = StorageService.get<KundaliResponse>(langKey);
  if (cached) return { ...cached, system };

  const result = await withRetry(async () => {
    const text = await callAI(
      `${config.role} Current Date: ${getCurrentDate()}.
This is an authentic, high-precision Life Analysis using the ${config.name}. DO NOT use toxic positivity — provide truthful predictions and harsh realities when planetary math demands it.

CRITICAL LANGUAGE REQUIREMENT:
You MUST write the entire "report" and all textual descriptions (starLord, subLord, nakshatra, moonSign) in ${language} (using native ${language} script).
The JSON keys ("report", "chart", "lagnaSign", "starLord", "subLord", "nakshatra", "moonSign", "mahadashas", "saadesatiCycles") and house numbers ("1".."12") must remain in English.`,
      `Generate a complete Janma Kundali Life Analysis in the ${config.name} for:
Name: ${details.name}
DOB: ${details.dob}
TOB: ${details.tob}
Place: ${details.location}

${config.specifics}

Return ONLY a valid JSON object (no markdown code fences):
{
  "report": "Professional Markdown string in ${language} with bold headers and tables detailing the ${config.name} analysis. MUST include a prominent Vimshottari Mahadasha Table with exact start and end years (e.g. 1995-2015) and a Shani Saadesati Table with exact years for 1st, 2nd, and 3rd phases.",
  "chart": { "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": [], "11": [], "12": [] },
  "lagnaSign": 1,
  "starLord": "string in ${language}",
  "subLord": "string in ${language}",
  "nakshatra": "string in ${language}",
  "moonSign": "string in ${language}",
  "mahadashas": [
    {
      "planet": "Planet Name in ${language}",
      "startYear": "YYYY",
      "endYear": "YYYY",
      "durationYears": 16,
      "isCurrent": false
    }
  ],
  "saadesatiCycles": [
    {
      "phase": "1st Phase (Rising) / 2nd Phase (Peak) / 3rd Phase (Setting)",
      "startYear": "YYYY",
      "endYear": "YYYY",
      "status": "past",
      "description": "Short explanation in ${language}"
    }
  ]
}
Chart keys must be "1" through "12" with planet name arrays. lagnaSign is 1-12.`,
      true // jsonMode
    );
    const parsed = parseAIResponse(text) as KundaliResponse;
    parsed.system = system;
    return parsed;
  });

  StorageService.save(langKey, result, -1);
  return result;
};

// ---------------------------------------------------------------------------
// KUNDALI CHAT
// ---------------------------------------------------------------------------
export const askKundaliQuestion = async (
  q: string,
  context: string,
  history: ChatMessage[],
  lang: Language,
  system: KundaliSystem = 'kp'
) => {
  const config = KUNDALI_SYSTEM_PROMPTS[system] || KUNDALI_SYSTEM_PROMPTS.kp;
  return await withRetry(async () => {
    const systemPrompt = `You are the user's personal Astrological Guide specializing in the ${config.name}.
Kundali context: ${context}. Current Date: ${getCurrentDate()}.
Answer the user's question using the specific tenets and techniques of ${config.name}.
DO NOT use toxic positivity — give harsh truths when planetary math demands it.
CRITICAL LANGUAGE REQUIREMENT: You MUST formulate your entire response in ${lang} (using native ${lang} script).`;

    return await callAIChat(systemPrompt, history, q);
  });
};

// ---------------------------------------------------------------------------
// NUMEROLOGY CHAT
// ---------------------------------------------------------------------------
export const askNumerologyQuestion = async (
  q: string,
  dob: string,
  mulank: number,
  bhagyank: number,
  loshu: any,
  history: ChatMessage[],
  lang: Language
) => {
  return await withRetry(async () => {
    const context = `DOB: ${dob}, Mulank: ${mulank}, Bhagyank: ${bhagyank}, Loshu Grid: ${JSON.stringify(loshu)}`;
    const systemPrompt = `You are a Master Vedic Numerologist. Answer questions based on: ${context}.
CRITICAL LANGUAGE REQUIREMENT: You MUST formulate your entire response in ${lang} (using native ${lang} script).`;

    return await callAIChat(systemPrompt, history, q);
  });
};

// ---------------------------------------------------------------------------
// MATCHMAKING
// Generates directly in target language in a single efficient call
// ---------------------------------------------------------------------------
export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  const langKey = StorageService.getKeys.match(details.boy.name, details.girl.name, language);
  const cached = StorageService.get<string>(langKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    return await callAI(
      `You are a master Vedic astrology matchmaking expert (Parashari, Lahiri Ayanamsha). DO NOT use toxic positivity — provide strict warnings and genuine risk factors.
CRITICAL LANGUAGE REQUIREMENT: Write the entire compatibility analysis and report exclusively in ${language} (using native ${language} script).`,
      `Vedic Kundali Milan (Compatibility) for ${details.boy.name} & ${details.girl.name}.
Perform classical Ashtakoot Gun Milan (36-point), plus:
- Mangal Dosha analysis for both parties
- Navamsa chart compatibility
- 7th house lord analysis
- Venus and Jupiter placement compatibility
- Dasha period overlaps for marriage timing
Return as professional Markdown in ${language}.`
    );
  });

  StorageService.save(langKey, result, -1);
  return result;
};

// ---------------------------------------------------------------------------
// NUMEROLOGY ANALYSIS
// Generates directly in target language in a single efficient call
// ---------------------------------------------------------------------------
export const getNumerologyAnalysis = async (dob: string, m: number, b: number, loshu: any, lang: Language) => {
  const langKey = StorageService.getKeys.numerology(dob, lang);
  const cached = StorageService.get<string>(langKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    return await callAI(
      `You are a Master Vedic Numerologist. Provide detailed, accurate analysis.
CRITICAL LANGUAGE REQUIREMENT: Write the entire analysis exclusively in ${lang} (using native ${lang} script).`,
      `Vedic Numerology analysis for DOB: ${dob}.
Mulank (Psychic Number): ${m}
Bhagyank (Destiny Number): ${b}
Loshu Grid: ${JSON.stringify(loshu)}

Include:
- Deep character and personality analysis (Mulank)
- Life path and destiny analysis (Bhagyank)
- Planes of expression from Loshu Grid (absent numbers and impacts)
- Lucky numbers, colours, gemstones, and directions
- Compatible and challenging periods
- Name correction recommendations if applicable
Return as structured Markdown in ${lang}.`
    );
  });

  StorageService.save(langKey, result, -1);
  return result;
};

// ---------------------------------------------------------------------------
// PALMISTRY
// (Not cached — image-based, each upload is unique)
// ---------------------------------------------------------------------------
export const getPalmistryAnalysis = async (image: string, lang: Language) => {
  return await withRetry(async () => {
    const textPrompt = `Analyze this palm using classical Vedic palmistry principles. Provide a detailed reading covering:
- Life Line (Jeevan Rekha): longevity and vitality
- Head Line (Mastak Rekha): intellect and thinking style
- Heart Line (Hriday Rekha): emotions and relationships
- Fate Line (Bhagya Rekha): career and destiny
- Mount analysis: Jupiter, Saturn, Apollo, Mercury, Venus, Moon
- Special marks: crosses, stars, triangles, islands and their Vedic significance
- Overall assessment: wealth potential, health warnings, spiritual development
CRITICAL LANGUAGE REQUIREMENT: Write the ENTIRE analysis exclusively in ${lang} (using native ${lang} script).`;

    return await callAIVision(textPrompt, image);
  });
};
