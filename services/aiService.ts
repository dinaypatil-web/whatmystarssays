import { GoogleGenAI } from "@google/genai";
import { BirthDetails, MatchmakingDetails, Timeframe, Language, ChatMessage, KundaliResponse, KundaliSystem, PlanetaryTransitInfo } from "../types";
import { StorageService } from "./storageService";
import { calculateAshtakootMilan, calculateMoonDetails, calculateSaadesatiPhases } from "./astrologyHelper";

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
    specifics: `Apply authentic K. P. Astrology principles with exhaustive, deeply detailed analysis:
1. **K. P. Profile & 4 Ruling Planets**: Lagna, Moon Sign, Nakshatra, Pada, Star Lord, Sub Lord, and 4 Ruling Planets (Lagna Lord, Moon Star Lord, Moon Rashi Lord, Day Lord) with deep psychological synthesis.
2. **Complete K. P. Planetary Table**: Sidereal planetary positions with Star Lord and Sub Lord for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu, detailing degrees, houses, and functional significations.
3. **12 Cuspal Sub-Lords Table**: Degrees, Sign, Star Lord, and Cuspal Sub-Lord for Cusps 1 through 12 (Placidus system).
4. **House Significations & Life Domain Deep Dive**:
   - 1st Cusp Sub-Lord: Health, longevity, vitality, and core temperament.
   - 2nd & 11th Cusp Sub-Lords: Wealth accumulation, sources of income, financial expansion, and material gains.
   - 6th & 10th Cusp Sub-Lords: Career, profession, business vs service, professional recognition, and peak success timing.
   - 7th Cusp Sub-Lord: Marriage, spouse nature, partnership durability, and relationship harmony.
   - 5th & 9th Cusps: Intellect, creative talents, higher learning, and spiritual fortune.
5. **Vimshottari Mahadasha Lifelong Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all 9 Mahadasha periods covering the full 120-year span starting from the native's birth date. Highlight the currently active Mahadasha and Antardasha with in-depth predictive guidance.
6. **Shani Saadesati Exact Lifecycle Table (MANDATORY)**: Calculate exact calendar years and dates for all 3 phases (1st Phase / Rising, 2nd Phase / Peak, 3rd Phase / Setting) of Saturn's transit over the natal Moon sign (~2.5 years per phase).
7. **Actionable K. P. Remedies & Gemstones**: Tailored to beneficial cuspal sub-lords (primary gemstone with metal and finger, Rudraksha mukhi, Vedic Beej mantras with counts, and charitable daan).`
  },
  parashari: {
    name: "Classical Vedic Parashari",
    role: "You are a venerable Vedic Astrologer grounded in classical Brihat Parashara Hora Shastra (Lahiri Ayanamsha).",
    specifics: `Apply classical Parashari principles with exhaustive, deeply detailed analysis:
1. **Panchanga & Birth Profile**: Lagna, Moon Sign (Rashi), Nakshatra, Pada, Nakshatra Lord, Tithi, Yoga, Karana, and elemental balance (Agni, Prithvi, Vayu, Jala).
2. **Planetary Positions & Dignities Table**: Sidereal degrees, Rashi, Nakshatra, Lord, Exaltation/Debilitation/Own Sign, Retrograde status, Combust status, and Shadbala/strength assessment.
3. **12 Bhava (House) In-Depth Analysis**: Detailed assessment of Kendras (1, 4, 7, 10), Trikonas (1, 5, 9), Panapharas (2, 5, 8, 11), Apoklimas (3, 6, 9, 12), and Dusthanas (6, 8, 12).
4. **Career, Wealth & Marriage Deep Breakdown**: Comprehensive analysis of profession (10th house & D10 overview), financial accumulation (2nd & 11th houses), and marriage (7th house & spouse characteristics).
5. **Planetary Yogas & Doshas**: Identify major Raja Yogas, Dhana Yogas, Pancha Mahapurusha Yogas, Gajakesari Yoga, Viparita Yogas, and Doshas (Mangal/Kalsarp) with specific cancellation rules (Parihara).
6. **Vimshottari Mahadasha Lifelong Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all 9 Mahadashas from birth date up to 120 years. Provide deep interpretation of the active Mahadasha and Antardasha.
7. **Shani Saadesati Exact Lifecycle Table (MANDATORY)**: Provide exact dates and years for all 3 phases (Rising, Peak, Setting) with ~2.5 years duration per phase.
8. **Classical Vedic Remedies**: Specific gemstone (carats, metal, finger, day), Rudraksha mukhi, Vedic mantras, fasts, and charitable daan.`
  },
  jaimini: {
    name: "Jaimini Astrology System",
    role: "You are an authority on Jaimini Upadesha Sutras and Maharishi Jaimini astrology.",
    specifics: `Apply authentic Jaimini principles with exhaustive, deeply detailed analysis:
1. **7 Chara Karakas Table**:
   - Atmakaraka (AK - Soul Planet & spiritual purpose)
   - Amatyakaraka (AmK - Career, intellect & status)
   - Bhratrikaraka (BK - Siblings, courage & mentors)
   - Matrikaraka (MK - Mother, happiness & domestic peace)
   - Putrakaraka (PK - Children, education & creativity)
   - Gnatikaraka (GK - Obstacles, health & competitors)
   - Darakaraka (DK - Spouse, partnerships & mutual bond)
2. **Special Lagnas**: Lagna, Arudha Lagna (AL - public persona), Upapada Lagna (UL - marital destiny), Darapada (A7), and Karakamsa Lagna.
3. **Jaimini Rashi Drishti & Aspects**: Dynamic interactions between cardinal (Chara), fixed (Sthira), and mutable (Dwisvabhava) signs.
4. **Chara Dasha Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for each sign Dasha period and identify the current active Dasha with predictive insights.
5. **Vimshottari Mahadasha & Shani Saadesati Years Table (MANDATORY)**: Exact calendar years and dates for Mahadashas and Saturn Saadesati cycles (~2.5 years per phase).
6. **Soul Mission, Career & Marriage Analysis**: In-depth interpretation of life purpose based on AK and UL.
7. **Jaimini Remedies & Spiritual Alignments**: Tailored mantras, deities, and alignments based on the Atmakaraka.`
  },
  lalkitab: {
    name: "Lal Kitab System",
    role: "You are an expert Lal Kitab Farman and Arman practitioner.",
    specifics: `Apply authentic Lal Kitab principles with exhaustive, deeply detailed analysis:
1. **Kalpurush Kundali Mapping**: Interpret planetary placements with Aries fixed as House 1, Taurus as House 2, etc.
2. **Grah Status & House Dynamics**: Identify Pakka Ghar (permanent houses), Kismat Jagane Wale Grah (luck activators), and Soye Hue Grah/Ghar (sleeping planets/houses).
3. **Pitra Rin & Ancestral Debts**: Diagnose ancestral debts (Pitri Rin, Matri Rin, Stri Rin, Swa-Rin) from planetary combinations and provide remedial rectification.
4. **Career, Wealth & Life Trajectory**: Practical real-world manifestations of planetary combinations in daily life, business, and family.
5. **Lal Kitab Grah Dasha & Vimshottari Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for major planetary dasha periods.
6. **Shani Saadesati Lifecycle Table (MANDATORY)**: Calculate exact dates and years for the 3 phases of Saturn's transit (~2.5 years per phase).
7. **Authentic Lal Kitab Totkas (Remedies)**: Clear, practical, safe remedies (e.g. offerings in running water, silver square, caring for specific animals, ethical conduct).`
  },
  nadi: {
    name: "Bhrigu Nandi Nadi",
    role: "You are an initiate in classical Bhrigu Nandi Nadi and Tamil Nadi astrology.",
    specifics: `Apply authentic Nadi astrology principles with exhaustive, deeply detailed analysis:
1. **Planetary Directional Connections**:
   - Dharma Triad (1-5-9 signs / East)
   - Artha Triad (2-6-10 signs / South)
   - Kama Triad (3-7-11 signs / West)
   - Moksha Triad (4-8-12 signs / North)
2. **Karakatwa Linkages & Life Narrative**:
   - Jeeva Karaka (Jupiter) & its relationships to other planets (Soul journey & vitality)
   - Karma Karaka (Saturn) & professional karma, roadblocks, and breakthroughs
   - Budha (Education/Business) & Shukra (Wealth/Spouse) linkages
3. **Vimshottari Dasha Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all planetary dasha cycles from birth date.
4. **Shani Saadesati Exact Timeline (MANDATORY)**: Calculate exact dates and calendar years for Saturn Saadesati phases (Rising, Peak, Setting) over natal Moon (~2.5 years per phase).
5. **Karmic Blessings & Obstacles**: Deep past-life karmic impressions, blessings, and Nadi remedial guidance.`
  },
  western: {
    name: "Western Tropical Astrology",
    role: "You are a master psychological and Hellenistic Western Astrologer (Tropical Zodiac, Placidus Houses).",
    specifics: `Apply Western Tropical astrology principles with exhaustive, deeply detailed analysis:
1. **The Big Three & Angles**: Tropical Ascendant (Rising), Sun Sign, Moon Sign, Midheaven (MC), and IC with deep psychological synthesis.
2. **Planetary Positions Table**: Sun through Pluto + Chiron degrees in Tropical signs and Placidus houses.
3. **Major Aspect Matrix**: Conjunctions, Oppositions, Trines, Squares, and Sextiles with exact orbs and psychological dynamics.
4. **Career, Romance & Psychological Growth**: In-depth analysis of vocation (MC & 10th house), relationships (7th house & Venus/Mars), and shadow work.
5. **Major Life Transits & Saturn Return Timeline Table (MANDATORY)**: Exact calendar years (Start Year – End Year) for Saturn Return (ages 28-30 and 58-60) and major transits.
6. **Progressed Timeline / Dasha Equivalent Table (MANDATORY)**: Year-by-year major planetary transit phases with exact calendar years.
7. **Psychological & Life Path Profile**: Core archetype, inner child integration, relationships, and career trajectory.`
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

/** Text-only request with model failover, key rotation, and low temperature for consistency */
const callAI = async (systemPrompt: string, userPrompt: string, jsonMode = false, temperature = 0.2): Promise<string> => {
  return executeWithGemini(async (ai, model) => {
    const messages: GeminiMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: "user", parts: [{ text: systemPrompt }] });
      messages.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions precisely." }] });
    }
    messages.push({ role: "user", parts: [{ text: userPrompt }] });

    const chat = ai.chats.create({
      model,
      config: { temperature },
      history: messages.slice(0, -1)
    } as any);
    const response = await chat.sendMessage({ message: messages[messages.length - 1].parts as any });

    let text = response.text ?? "";
    if (!text) throw new Error("Empty response from Gemini.");
    if (jsonMode) text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    return text;
  });
};

/** Multi-turn chat with model failover and key rotation */
const callAIChat = async (systemPrompt: string, history: ChatMessage[], userQuestion: string, temperature = 0.3): Promise<string> => {
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

    const chat = ai.chats.create({
      model,
      config: { temperature },
      history: messages.slice(0, -1)
    } as any);
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
    const chat = ai.chats.create({
      model,
      config: { temperature: 0.2 },
      history: []
    } as any);
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
Provide an EXHAUSTIVE, HIGHLY DETAILED ${timeframe} horoscope for Moon Sign / Rashi: ${sign}.
Analyze precise sidereal planetary transits (Career, Health, Relationships, Finance, Spirituality) using classical Vedic principles.
Provide a balanced, authentic, and constructive Vedic horoscope. Highlight favorable opportunities and positive momentum, while explaining any challenging transits with practical, dignified, and uplifting remedies.

MANDATORY DEPTH REQUIREMENTS:
- Each field must contain an extensive, multi-sentence paragraph (4 to 6 detailed sentences) providing concrete real-world astrological predictions rather than vague summaries.
- Explain the underlying planetary transit reasons (e.g. Saturn in Pisces, Jupiter in Gemini, Sun's placement) and how they impact daily decisions.
- Include specific guidance on what actions to pursue, what pitfalls to avoid, and auspicious timings.

CRITICAL LANGUAGE REQUIREMENT:
You MUST write all textual descriptions, predictions, and field values in ${language} (using authentic native ${language} script).
All 8 values in the JSON object must be written fluently in ${language}.
The keys of the JSON object must remain in English as shown below.`,
      `Return a valid JSON object (no markdown code fences):
{
  "overview": "Comprehensive, deeply detailed multi-sentence overview in ${language} synthesizing major planetary transit energies",
  "career": "In-depth career, workplace and business prediction in ${language} with concrete guidance and opportunities",
  "health": "Detailed physical and mental vitality prediction in ${language} with lifestyle and stamina advice",
  "relationships": "Rich, multi-sentence love, family and marital harmony prediction in ${language}",
  "finance": "Detailed financial foresight, wealth accumulation, investments and expense caution in ${language}",
  "spirituality": "Deep spiritual evolution, mindfulness and karmic reflection prediction in ${language}",
  "luckyColor": "Lucky color in ${language} with astrological reason",
  "luckyNumber": "Lucky number string with vibrational explanation"
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
  const langKey = StorageService.getKeys.kundali(details.name, details.dob, details.tob, language, system);
  const cached = StorageService.get<KundaliResponse>(langKey);
  if (cached) return { ...cached, system };

  // Calculate deterministic astronomical moon anchor to prevent hallucinations across re-runs
  const moonCalc = calculateMoonDetails(details.dob, details.tob);
  const moonContext = moonCalc
    ? `Astronomical Moon Reference: Moon in ${moonCalc.rashi.name} (${moonCalc.rashi.sanskrit}), Nakshatra: ${moonCalc.nakshatra.name} (${moonCalc.nakshatra.sanskrit}), Pada ${moonCalc.pada}, Sidereal Longitude: ${moonCalc.siderealLongitude.toFixed(2)}°.`
    : '';

  // Calculate deterministic Saadesati phases (each phase is ~2.5 years / 30 months, NOT 7 years!)
  const exactSaadesati = moonCalc
    ? calculateSaadesatiPhases(moonCalc.rashiIndex, new Date(), language)
    : calculateSaadesatiPhases(0, new Date(), language);

  const saadesatiPromptContext = `
MANDATORY SHANI SAADESATI TIMELINE (EACH PHASE LASTS ~2.5 YEARS / 30 MONTHS):
- 1st Phase (Rising): ${exactSaadesati[0]?.startDate} – ${exactSaadesati[0]?.endDate} (${exactSaadesati[0]?.startYear} – ${exactSaadesati[0]?.endYear}, Status: ${exactSaadesati[0]?.status})
- 2nd Phase (Peak): ${exactSaadesati[1]?.startDate} – ${exactSaadesati[1]?.endDate} (${exactSaadesati[1]?.startYear} – ${exactSaadesati[1]?.endYear}, Status: ${exactSaadesati[1]?.status})
- 3rd Phase (Setting): ${exactSaadesati[2]?.startDate} – ${exactSaadesati[2]?.endDate} (${exactSaadesati[2]?.startYear} – ${exactSaadesati[2]?.endYear}, Status: ${exactSaadesati[2]?.status})
CRITICAL: Do NOT add 7 years to any single phase! Each phase lasts approximately 2.5 years. The 3 phases combined equal 7.5 years.`;

  const result = await withRetry(async () => {
    const text = await callAI(
      `${config.role} Current Date: ${getCurrentDate()}.
This is an authentic, high-precision, EXHAUSTIVE Life Blueprint Analysis using the ${config.name}. Maintain a balanced, insightful, and compassionate approach: clearly delineate strengths, yogas, and growth opportunities alongside genuine karmic challenges and remedies, without fatalism or harsh wording.

${moonContext}
${saadesatiPromptContext}

MANDATORY DEPTH & STRUCTURE REQUIREMENTS FOR THE REPORT:
The "report" field must be an extensive, beautifully written multi-page Markdown document in ${language} featuring:
1. **Panchanga & Birth Profile Summary Table**: Lagna, Moon Sign, Sun Sign, Nakshatra, Pada, Star Lord, Sub Lord, Deities, Elements.
2. **Sidereal Planetary Positions & Dignities Table**: Complete table of all 9 planets with degrees, sign, nakshatra, house, and dignity status.
3. **Comprehensive 12 Bhava (House) Deep Analysis**: Multi-paragraph evaluation covering Kendra houses (1, 4, 7, 10), Trikona houses (1, 5, 9), and wealth/growth houses.
4. **Career, Profession & Financial Trajectory**: In-depth analysis of optimal career industries, job vs business suitability, financial accumulation capacity, and peak earning years.
5. **Marriage, Love & Relationship Dynamics**: In-depth analysis of the 7th house, Venus/Jupiter placements, spouse characteristics, and long-term partnership harmony.
6. **Health, Vitality & Preventive Astrology**: Physical constitution (Vata/Pitta/Kapha), sensitive bodily areas, and daily lifestyle practices.
7. **Major Planetary Yogas, Doshas & Gochara Transits**: Raja Yogas, Dhana Yogas, Gajakesari Yoga, Manglik / Kalsarp analysis with mitigations.
8. **Vimshottari Mahadasha Lifelong Timeline Table (120-Year)**: Complete 9-Mahadasha table with exact years, plus detailed interpretation of active Mahadasha and Antardasha.
9. **Shani Saadesati Exact Timeline**: Exact start and end dates for all 3 phases (~2.5 years each) with real-time status and guidance.
10. **Prescriptive Classical Vedic Remedies**: Primary gemstone (carats, metal, finger, day, ritual), Rudraksha mukhi, Vedic Beej mantras with counts, and charitable acts (Daan).

CRITICAL LANGUAGE REQUIREMENT:
You MUST write the entire "report" and all textual descriptions (starLord, subLord, nakshatra, moonSign) in ${language} (using native ${language} script).
The JSON keys ("report", "chart", "lagnaSign", "starLord", "subLord", "nakshatra", "moonSign", "mahadashas", "saadesatiCycles") and house numbers ("1".."12") must remain in English.`,
      `Generate an exhaustive, highly detailed Janma Kundali Life Map Analysis in the ${config.name} for:
Name: ${details.name}
DOB: ${details.dob}
TOB: ${details.tob}
Place: ${details.location}

${config.specifics}

Return ONLY a valid JSON object (no markdown code fences):
{
  "report": "Exhaustive, deeply detailed professional Markdown string in ${language} with bold headers and comprehensive tables detailing the complete ${config.name} analysis.",
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
      "phase": "1st Phase (Rising)",
      "startDate": "${exactSaadesati[0]?.startDate}",
      "endDate": "${exactSaadesati[0]?.endDate}",
      "startYear": ${exactSaadesati[0]?.startYear},
      "endYear": ${exactSaadesati[0]?.endYear},
      "duration": "~2.5 Years",
      "status": "${exactSaadesati[0]?.status}",
      "description": "Short explanation in ${language}"
    },
    {
      "phase": "2nd Phase (Peak)",
      "startDate": "${exactSaadesati[1]?.startDate}",
      "endDate": "${exactSaadesati[1]?.endDate}",
      "startYear": ${exactSaadesati[1]?.startYear},
      "endYear": ${exactSaadesati[1]?.endYear},
      "duration": "~2.5 Years",
      "status": "${exactSaadesati[1]?.status}",
      "description": "Short explanation in ${language}"
    },
    {
      "phase": "3rd Phase (Setting)",
      "startDate": "${exactSaadesati[2]?.startDate}",
      "endDate": "${exactSaadesati[2]?.endDate}",
      "startYear": ${exactSaadesati[2]?.startYear},
      "endYear": ${exactSaadesati[2]?.endYear},
      "duration": "~2.5 Years",
      "status": "${exactSaadesati[2]?.status}",
      "description": "Short explanation in ${language}"
    }
  ]
}
Chart keys must be "1" through "12" with planet name arrays. lagnaSign is 1-12.`,
      true // jsonMode
    );
    const parsed = parseAIResponse(text) as KundaliResponse;
    parsed.system = system;

    // Anchor saadesatiCycles to exact mathematical dates and ~2.5 year durations
    parsed.saadesatiCycles = exactSaadesati.map((exact, idx) => ({
      ...exact,
      description: parsed.saadesatiCycles?.[idx]?.description || exact.description
    }));

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
Address challenges candidly and constructively, pairing any friction with practical Vedic remedies and supportive guidance without harsh or alarming language.
CRITICAL LANGUAGE REQUIREMENT: You MUST formulate your entire response in ${lang} (using native ${lang} script).`;

    return await callAIChat(systemPrompt, history, q);
  });
};

// ---------------------------------------------------------------------------
// ASK THE ASTROLOGER - MULTI-DIMENSIONAL SYNTHESIS CONSULTATION
// ---------------------------------------------------------------------------
export const askAstrologerConsultation = async (
  query: string,
  details: BirthDetails,
  system: KundaliSystem,
  history: ChatMessage[],
  lang: Language,
  kundaliData?: KundaliResponse | null,
  numerologyData?: {
    mulank: number;
    bhagyank: number;
    namaank?: number | null;
    compound?: number | null;
    presentNumbers?: number[];
    missingNumbers?: number[];
  } | null,
  transits?: PlanetaryTransitInfo[]
) => {
  const config = KUNDALI_SYSTEM_PROMPTS[system] || KUNDALI_SYSTEM_PROMPTS.kp;

  // Build structured transit context
  const transitsSummary = transits && transits.length > 0
    ? transits.map(t => `- ${t.planetSanskrit || t.planet} is currently in ${t.signSanskrit || t.sign}${t.isRetrograde ? ' (Retrograde / वक्री)' : ''}: ${t.transitInfluence}`).join('\n')
    : 'Saturn transits Pisces, Jupiter transits Gemini, Rahu transits Aquarius, Ketu transits Leo.';

  // Build Kundali context
  let kundaliContext = 'Natal chart dynamically synthesized from birth details.';
  if (kundaliData) {
    const activeDasha = kundaliData.mahadashas?.find(m => m.isCurrent);
    const activeSaadesati = kundaliData.saadesatiCycles?.find(s => s.status === 'active');
    kundaliContext = `
Lagna (Ascendant): Sign #${kundaliData.lagnaSign}
Moon Sign (Rashi): ${kundaliData.moonSign || 'Derived from coordinates'}
Nakshatra: ${kundaliData.nakshatra || 'Calculated'}
Star Lord: ${kundaliData.starLord || 'N/A'}, Sub Lord: ${kundaliData.subLord || 'N/A'}
Active Mahadasha: ${activeDasha ? `${activeDasha.planet} (${activeDasha.startYear} - ${activeDasha.endYear})` : 'Calculated'}
Shani Saadesati: ${activeSaadesati ? `${activeSaadesati.phase} (${activeSaadesati.startYear} - ${activeSaadesati.endYear})` : 'Calculated'}`;
  }

  // Build Numerology context
  let numerologyContext = 'Vedic & Chaldean Numerology calculated.';
  if (numerologyData) {
    numerologyContext = `
Mulank (Psychic/Driver Number): ${numerologyData.mulank}
Bhagyank (Destiny/Life Path Number): ${numerologyData.bhagyank}
Namaank (Chaldean Single Digit): ${numerologyData.namaank ?? 'N/A'}
Chaldean Compound Number: ${numerologyData.compound ?? 'N/A'}
Loshu Grid Present Numbers: ${numerologyData.presentNumbers?.join(', ') || 'N/A'}
Loshu Grid Missing Numbers: ${numerologyData.missingNumbers?.join(', ') || 'None'}`;
  }

  return await withRetry(async () => {
    const systemPrompt = `You are 'Ask the Astrologer!!!', a world-revered Master Vedic Astrologer, Krishnamurti Paddhati (K.P.) Sub-Lord Authority, Classical Parashari Acharya, and Chaldean Numerology Sage.
Current Date & Time: ${getCurrentDate()}.

NATIVE'S VERIFIED PROFILE:
- Full Name: ${details.name || 'Seeker'}
- Date of Birth: ${details.dob}
- Time of Birth: ${details.tob || '12:00 PM (Approximate)'}
- Location: ${details.location || 'Not provided'}
- Primary Astrological Tradition: ${config.name}

SYNTHESIZED NATAL KUNDALI BLUEPRINT:
${kundaliContext}

SYNTHESIZED VEDIC & CHALDEAN NUMEROLOGY:
${numerologyContext}

REAL-TIME CURRENT PLANETARY TRANSITS (GOCHARA) AS OF ${getCurrentDate()}:
${transitsSummary}

CONSULTATION MANDATE:
1. Provide a direct, authoritative, and profoundly personalized answer to the seeker's query.
2. Cross-reference their specific Kundali house significations (e.g. 10th/6th for career, 7th/2nd/11th for marriage/relationships, 2nd/11th/5th/9th for wealth, 6th/8th/12th for health).
3. Evaluate the timing using their active Mahadasha/Antardasha and Saturn Saadesati phase, pinpointing favorable vs challenging timeline periods.
4. Integrate current real-time Gochara transits (especially Saturn, Jupiter, and Rahu-Ketu) to explain what cosmic energies are impacting them right now.
5. Blend their Numerology (Mulank, Bhagyank, and Chaldean Name Number vibration) into the answer for multidimensional resonance.
6. Balanced & Compassionate Counsel: Present strengths, blessings, and opportunities clearly alongside karmic challenges or delays. Never use harsh or alarming language; explain challenges constructively and provide clear, reassuring remedies.
7. Always provide actionable, authentic remedies: Vedic Mantras, Gemstone / Rudraksha recommendations, Daan (charity), Auspicious Colors & Directions, or Name vibration tweaks if appropriate.
8. Structure your response using clean, beautiful Markdown with bold headings, neat bullet points, and highlight cards/tables where fitting.

CRITICAL LANGUAGE REQUIREMENT:
You MUST formulate your ENTIRE consultation response in ${lang} (using authentic native ${lang} script).
Do not output in English unless the chosen language is English.`;

    return await callAIChat(systemPrompt, history, query);
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
  lang: Language,
  name: string = ''
) => {
  return await withRetry(async () => {
    const context = `${name ? `Name: ${name}, ` : ''}DOB: ${dob}, Mulank: ${mulank}, Bhagyank: ${bhagyank}, Loshu Grid: ${JSON.stringify(loshu)}`;
    const systemPrompt = `You are a Master Vedic & Chaldean Numerologist specializing in destiny, Namaank, and Name Correction. Answer questions based on: ${context}.
If the user asks about spelling options, name alterations, business names, or signatures, provide precise letter-by-letter Chaldean calculations and guidance.
CRITICAL LANGUAGE REQUIREMENT: You MUST formulate your entire response in ${lang} (using native ${lang} script).`;

    return await callAIChat(systemPrompt, history, q);
  });
};

// ---------------------------------------------------------------------------
// MATCHMAKING
// Generates directly in target language in a single efficient call
// ---------------------------------------------------------------------------
export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  const langKey = StorageService.getKeys.match(
    details.boy.name,
    details.girl.name,
    language,
    details.boy.dob,
    details.boy.tob,
    details.girl.dob,
    details.girl.tob
  );
  const cached = StorageService.get<string>(langKey);
  if (cached) return cached;

  // Calculate deterministic Ashtakoot Milan and Moon parameters
  const milanCalc = calculateAshtakootMilan(details.boy, details.girl);

  const milanFoundation = milanCalc ? `
DETERMINISTIC VEDIC ASHTAKOOT MILAN FOUNDATION:
- Groom (${details.boy.name}): Moon in ${milanCalc.boyMoon?.rashi.name} (${milanCalc.boyMoon?.rashi.sanskrit}), Nakshatra: ${milanCalc.boyMoon?.nakshatra.name} (Pada ${milanCalc.boyMoon?.pada}), Lord: ${milanCalc.boyMoon?.rashi.lord}, Varna: ${milanCalc.boyMoon?.rashi.varna}, Nadi: ${milanCalc.boyMoon?.nakshatra.nadi}
- Bride (${details.girl.name}): Moon in ${milanCalc.girlMoon?.rashi.name} (${milanCalc.girlMoon?.rashi.sanskrit}), Nakshatra: ${milanCalc.girlMoon?.nakshatra.name} (Pada ${milanCalc.girlMoon?.pada}), Lord: ${milanCalc.girlMoon?.rashi.lord}, Varna: ${milanCalc.girlMoon?.rashi.varna}, Nadi: ${milanCalc.girlMoon?.nakshatra.nadi}

OFFICIAL ASHTAKOOT SCORES (TOTAL: ${milanCalc.totalScore} / 36):
1. Varna Koota: ${milanCalc.kootas.varna.obtainedScore} / 1 (${milanCalc.kootas.varna.notes})
2. Vashya Koota: ${milanCalc.kootas.vashya.obtainedScore} / 2 (${milanCalc.kootas.vashya.notes})
3. Tara Koota: ${milanCalc.kootas.tara.obtainedScore} / 3 (${milanCalc.kootas.tara.notes})
4. Yoni Koota: ${milanCalc.kootas.yoni.obtainedScore} / 4 (${milanCalc.kootas.yoni.notes})
5. Graha Maitri: ${milanCalc.kootas.grahaMaitri.obtainedScore} / 5 (${milanCalc.kootas.grahaMaitri.notes})
6. Gana Koota: ${milanCalc.kootas.gana.obtainedScore} / 6 (${milanCalc.kootas.gana.notes})
7. Bhakoot Koota: ${milanCalc.kootas.bhakoot.obtainedScore} / 7 (${milanCalc.kootas.bhakoot.notes})
8. Nadi Koota: ${milanCalc.kootas.nadi.obtainedScore} / 8 (${milanCalc.kootas.nadi.notes})

AUTHENTIC VERDICT: ${milanCalc.verdict} (${milanCalc.verdictLabel})
` : '';

  const result = await withRetry(async () => {
    return await callAI(
      `You are a master Vedic astrology matchmaking expert (Classical Parashari & Ashtakoot Milan, Lahiri Ayanamsha).
CRITICAL REPORTING GUIDELINES:
1. BALANCED, DEEPLY DETAILED & EXHAUSTIVE ANALYSIS: Provide an authentic, comprehensive multi-section evaluation highlighting BOTH natural harmonies and areas for mutual growth. Provide substantial paragraphs packed with classical insights, psychological understanding, and practical wisdom.
2. DIGNIFIED & COMPASSIONATE TONE: Strictly avoid harsh, alarming, terrifying, or fatalistic language. Never declare a match "ruined" or "condemned". If there are friction points (such as Nadi or Bhakoot differences, or Manglik placement), explain them respectfully and constructively as opportunities for conscious communication, personal maturity, and Vedic remedies (Parihara).
3. EXACT MATHEMATICAL INTEGRITY: You MUST adhere to the provided deterministic Ashtakoot scores (${milanCalc ? milanCalc.totalScore : 'computed'} / 36) in the Ashtakoot table.
4. ACTIONABLE REMEDIES & BLISS: Classical Shastras state that mutual devotion, maturity, and remedies enhance marital joy. Include practical remedies (Vedic mantras, auspicious colors, charitable acts, communication habits).
CRITICAL LANGUAGE REQUIREMENT: Write the entire compatibility analysis and report exclusively in ${language} (using native ${language} script).`,
      `Generate an exhaustive, deeply detailed Vedic Kundali Milan (Compatibility Analysis) for ${details.boy.name} & ${details.girl.name}.
Birth Information:
- Groom (${details.boy.name}): DOB ${details.boy.dob}, TOB ${details.boy.tob || '12:00'}, Place: ${details.boy.location}
- Bride (${details.girl.name}): DOB ${details.girl.dob}, TOB ${details.girl.tob || '12:00'}, Place: ${details.girl.location}

${milanFoundation}

Generate a comprehensive, beautifully structured report in Markdown featuring substantial depth in every section:
# 💑 Vedic Kundali Milan Report: ${details.boy.name} & ${details.girl.name}

## 1. 🌟 Ashtakoot Gun Milan Summary Table (अष्टकूट गुण मिलान)
Present a complete Markdown table with columns:
| Koota (कूट) | Area (क्षेत्र) | Max Points | Obtained Points | Status & Classical Notes |
Detail all 8 Kootas: Varna (1), Vashya (2), Tara (3), Yoni (4), Graha Maitri (5), Gana (6), Bhakoot (7), Nadi (8).
Show the final Total Score: **${milanCalc ? milanCalc.totalScore : ''} / 36** with the official verdict.
Provide an in-depth analytical explanation of what this overall score indicates for psychological compatibility, emotional bonding, and longevity of the relationship.

## 2. 💖 Pillars of Natural Harmony & Strengths (प्राकृतिक सामंजस्य व सबल पक्ष)
Detailed multi-paragraph exploration of:
- Emotional resonance and mental bonding (Graha Maitri & Moon sign interplay).
- Sexual, biological and intimate harmony (Yoni Koota compatibility).
- Shared spiritual purpose, mutual respect, and family values (Varna & Vashya alignment).

## 3. 🤝 Mindful Growth Areas & Compassionate Navigation (सचेत संवाद व सामंजस्य के बिंदु)
Explain areas where differing temperaments or astrological placements call for conscious patience, communication, and emotional support (e.g. Gana temperament differences or Bhakoot/Nadi considerations). Express these constructively with practical guidance, never harshly.

## 4. 🔥 Mangal Dosha & Navamsa Synthesis (मांगलिक विश्लेषण व नवांश सामंजस्य)
- Balanced assessment of Mars (Mangal) energy for both charts (Houses 1, 2, 4, 7, 8, 12).
- Detailed evaluation of classical cancellations (Parihara) such as mutual Mars placement, beneficial Jupiter/Venus aspect, or age maturity.
- Navamsa (D9) chart overview for marital durability and soul compatibility.

## 5. 🪐 Planetary Placements & Marital Timing (7th House, Venus & Jupiter)
- 7th House (Kalatra Bhava) analysis for both charts: lord placement, aspects, and relationship stamina.
- Venus (Shukra - Karaka of love, romance, and sensual harmony) analysis.
- Jupiter (Guru - Karaka of divine grace, marital wisdom, and family prosperity) analysis.

## 6. 🪔 Vedic Remedies & Rituals for Marital Bliss (वैवाहिक सुख हेतु शास्त्रीय उपाय)
Practical, uplifting remedies for daily life and mutual peace:
- Auspicious Vedic mantras (Gauri Shankar Mantra, Maha Mrityunjaya Mantra) with recommended counts.
- Favourable gemstones, auspicious colors, and charitable acts (Daan).
- Daily communication habits and relationship mindfulness rituals.

Return as professional Markdown in ${language}.`,
      false, // jsonMode
      0.2 // low temperature for consistent quality
    );
  });

  StorageService.save(langKey, result, -1);
  return result;
};

// ---------------------------------------------------------------------------
// NUMEROLOGY ANALYSIS
// Generates directly in target language in a single efficient call
// ---------------------------------------------------------------------------
export const getNumerologyAnalysis = async (
  dob: string,
  m: number,
  b: number,
  loshu: any,
  lang: Language,
  name: string = ''
) => {
  const langKey = StorageService.getKeys.numerology(dob, lang, name);
  const cached = StorageService.get<string>(langKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    return await callAI(
      `You are a Master Vedic and Chaldean Numerologist specializing in Astrological Name Correction, Namaank Alignment, and Destiny Rectification.
Provide an exhaustive, deeply detailed numerology report with practical, highly auspicious name correction recommendations.
CRITICAL LANGUAGE REQUIREMENT: Write the entire analysis exclusively in ${lang} (using native ${lang} script).`,
      `Generate an exhaustive, highly detailed Vedic & Chaldean Numerology analysis for:
${name ? `Person's Full Name: ${name}` : 'Name: Not provided'}
Date of Birth: ${dob}
Mulank (Psychic / Root Number): ${m}
Bhagyank (Destiny / Life Path Number): ${b}
Loshu Grid State: ${JSON.stringify(loshu)}

You MUST include comprehensive, multi-paragraph sections:
1. **Core Number Profile (मूलांक व भाग्यांक विस्तृत विश्लेषण)**:
   - Mulank (${m}) - Ruling Planet, Psychological Blueprint, Subconscious Drivers, Strengths, Talents, and Potential Blindspots.
   - Bhagyank (${b}) - Ruling Planet, Karmic Destiny, Life Purpose, Soul Mission, and Peak Achievement Timelines.
   - Core Synergy: Detailed evaluation of compatibility or friction between Mulank (${m}) and Bhagyank (${b}) across career, finances, and relationships.

2. **Loshu Grid Planes & Missing Numbers (लो-शू ग्रिड व रिक्त अंक विश्लेषण)**:
   - Complete breakdown of the 8 Planes: Mental (4-9-2), Emotional (3-5-7), Practical (8-1-6), Thought (4-3-8), Will (9-5-1), Action (2-7-6), and Golden Raj Yogas (4-5-6 & 2-5-8).
   - Specific analysis of present numbers and which planes are activated.
   - Detailed breakdown of missing numbers and their specific life voids (e.g. missing 5 affecting stability/business, missing 6 affecting luxury/family, missing 8 affecting discipline/wealth).
   - Concrete remedial measures for missing numbers (crystals, wristbands, Vastu directions, colors).

3. **ASTROLOGICAL NAME CORRECTION & NAMAANK ALIGNMENT (नाम सुधार व नामांक विश्लेषण)**:
${name ? `
   - **Current Name Assessment**:
     * Calculate exact Chaldean Compound Number and Single Digit Namaank for "${name}".
     * Analyze if "${name}" harmonizes or creates friction with Mulank (${m}) and Bhagyank (${b}).
     * Point out whether the current compound frequency attracts delays, struggle, or smooth success.
   - **3 to 4 AUSPICIOUS NAME CORRECTION OPTIONS (अति-शुभ सुधारात्मक नाम विकल्प)**:
     Provide 3 to 4 concrete, phonetically natural, and socially easy-to-use spelling variations (e.g., adding a specific vowel like 'A' or 'E', repeating a consonant, or adjusting middle initials).
     For EACH proposed spelling, present a clear table or breakdown:
     * **Altered Spelling**: (e.g., "Rohaan Sharma", "Rohan K. Sharma", etc.)
     * **New Chaldean Compound Number & Single Digit**: (Target auspicious vibrations like 1, 5, or 6 with compound numbers such as 19, 23, 24, 32, 37, 41, 42, 46, 51).
     * **Ruling Planet & Energetic Benefit**: (e.g., Sun for authority, Mercury for business/wealth, Venus for luxury and relationships).
     * **Specific Life Improvements**: (How this exact vibration rectifies missing Loshu grid numbers and removes blocks).
   - **Daily Name Activation Ritual (नाम ऊर्जा सक्रियण विधि)**:
     * How to activate the new vibration without legal document changes (writing the corrected name 21 or 108 times daily in green/blue ink).
     * Signature optimization guidelines (slanting upwards at 45 degrees, never crossing or cutting through the name).
     * Practical tips for social media, business cards, and email signatures.
` : `
   - Ideal Target Namaank (Name Numbers) compatible with Mulank ${m} and Bhagyank ${b}.
   - Golden compound numbers to aim for (such as 19, 23, 24, 32, 37, 41, 42).
   - Rules for selecting an auspicious business or personal name.
`}

4. **Life Domain Predictions & Auspicious Matrix (जीवन भविष्यफल व शुभ तालिका)**:
   - Career & Wealth: Best industries, job vs business suitability, and wealth retention capacity.
   - Love & Relationships: Compatible partner numbers and relationship harmony tips.
   - Auspicious Matrix: Lucky Numbers, Friendly Numbers, Unfriendly Numbers, Lucky Days, Lucky Colours, and Favourable Directions.
   - Classical Remedies: Gemstones, Rudraksha mukhi, daily affirmations, and planetary Beej Mantras.

Return as beautifully formatted, exhaustive Markdown with bold titles, clean tables, and bullet points in ${lang}.`
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
    const textPrompt = `Analyze this palm image with master-level Vedic Palmistry (Hasta Rekha Shastra) and Western chirology.
Provide an EXHAUSTIVE, HIGHLY DETAILED analysis with clear headings and multiple paragraphs covering:
1. **Palm Shape & Elemental Classification**: Earth, Air, Fire, or Water hand, skin texture, and finger proportions.
2. **The 4 Major Lines (प्रमुख रेखाएँ)**:
   - Life Line (Jeevan Rekha): Length, depth, curve, vitality, vitality markers, and longevity milestones.
   - Head Line (Mastak Rekha): Intellect, mental focus, thinking style, creativity, and stress threshold.
   - Heart Line (Hriday Rekha): Emotional depth, relationship expectations, empathy, and romantic nature.
   - Fate Line (Bhagya Rekha): Career path, destiny milestones, turning points around ages 28, 35, and 45.
3. **The Minor Lines & Success Indicators**:
   - Sun Line (Surya Rekha / Apollo): Fame, creative recognition, and public status.
   - Mercury Line (Health/Business Rekha): Commercial acumen, communication, and nervous vitality.
   - Marriage & Relationship Lines: Emotional bonding timing and partnership patterns.
4. **Mounts Analysis (पर्वत विश्लेषण)**:
   - Mount of Jupiter (Guru), Saturn (Shani), Sun (Surya), Mercury (Budh), Venus (Shukra), and Moon (Chandra).
5. **Special Sacred Marks (शुभ व विशेष चिन्ह)**:
   - Triangles, fish signs (Matsya), stars, crosses, islands, and trident (Trishul) formations.
6. **Overall Life Synthesis & Remedial Advice**:
   - Wealth retention potential, career recommendations, and actionable spiritual remedies.

CRITICAL LANGUAGE REQUIREMENT: Write the ENTIRE analysis exclusively in ${lang} (using native ${lang} script).`;

    return await callAIVision(textPrompt, image);
  });
};
