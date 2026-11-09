import { GoogleGenAI } from "@google/genai";
import { BirthDetails, MatchmakingDetails, Timeframe, Language, ChatMessage, KundaliResponse, KundaliSystem, PlanetaryTransitInfo } from "../types";
import { StorageService } from "./storageService";
import {
  calculateAshtakootMilan,
  calculateMoonDetails,
  calculateSaadesatiPhases,
  calculateAvakahadaDetails,
  calculatePlanetaryPositions,
  ensureValidKundaliChart,
  calculateShadbala,
  calculateYogas,
  calculateDoshas,
  calculateDivisionalCharts,
  calculateAntardashas,
  calculatePracticalRemedies
} from "./astrologyHelper";
import { getLocalizedPlanet, getLocalizedSign, getKundaliLocale } from "./kundaliLocalization";
import { getLocalizedBhavaData } from "./bhavaLocalization";

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
// UNIVERSAL BALANCED PREDICTION & REMEDIAL MANDATE
// ---------------------------------------------------------------------------
export const BALANCED_PREDICTION_MANDATE = `
UNIVERSAL ASTROLOGICAL BALANCE & REMEDIAL MANDATE:
1. AUTHENTIC MIX OF POSITIVES & NEGATIVES: Every life, birth chart, planetary transit, and numerological vibration contains both auspicious blessings (strengths, peak timings, Raja Yogas, growth opportunities) and real-world karmic friction (delays, obstacles, stress cycles, vulnerabilities). You MUST provide an honest, authentic, and balanced synthesis reflecting both positive and negative facets. Never provide 100% blind flattery, nor 100% gloomy pessimism.
2. DIGNIFIED, CONSTRUCTIVE TONE (NEVER HARSH OR SHOCKING): Negative indications, difficult transits (like Saadesati/Dhaiya/Rahu-Ketu), doshas (Manglik/Kalsarp/Pitri Rin), or afflicted placements must NEVER be expressed in a terrifying, shocking, or fatalistic manner. Strictly avoid catastrophic, alarmist words such as "ruined", "doomed", "disaster", "tragic", "hopeless", or "inevitable divorce/ruin". Instead, articulate challenges with psychological depth, calm dignity, compassionate awareness, and constructive counsel (e.g. "a cycle requiring prudent patience, conscious emotional boundaries, and mindful caution").
3. MANDATORY ACTIONABLE REMEDIES FOR EVERY NEGATIVE: Wherever an obstacle, vulnerability, challenge, dosha, missing number, or afflicted transit is identified, you MUST immediately pair it with practical, uplifting, and actionable classical remedial solutions (Upaya/Parihara)—including specific Vedic Beej Mantras (with chanting counts), Gemstones/Rudraksha with appropriate metal/finger, charitable Daan (acts of selfless service), dietary/lifestyle disciplines, and mindset habits.
`;

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
4. **House Significations & Life Domain Deep Dive (Balanced Realism)**:
   - Detail BOTH favorable sub-lord connections (positives) and challenging cusp friction (negatives). Never sugarcoat, but never use alarming language.
   - 1st Cusp Sub-Lord: Health, vitality, and areas of constitution needing protective care.
   - 2nd & 11th Cusp Sub-Lords: Wealth accumulation, income expansions, alongside financial leakage warnings.
   - 6th & 10th Cusp Sub-Lords: Career peaks, professional recognition, alongside work disputes or periods of career testing.
   - 7th Cusp Sub-Lord: Marriage, partnership strengths, alongside potential friction points requiring conscious patience.
   - 5th & 9th Cusps: Creative fortune, intellectual strengths, and higher dharma.
5. **Vimshottari Mahadasha Lifelong Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all 9 Mahadasha periods covering the full 120-year span starting from the native's birth date. Highlight the currently active Mahadasha and Antardasha with in-depth predictive guidance covering both positive opportunities and challenging phases.
6. **Shani Saadesati Exact Lifecycle Table (MANDATORY)**: Calculate exact calendar years and dates for all 3 phases (1st Phase / Rising, 2nd Phase / Peak, 3rd Phase / Setting) of Saturn's transit over the natal Moon sign (~2.5 years per phase), explaining tests with calm, protective guidance.
7. **Actionable K. P. Remedies & Gemstones for All Challenges**: Tailored to beneficial cuspal sub-lords (primary gemstone with metal and finger, Rudraksha mukhi, Vedic Beej mantras with counts, and charitable daan) providing clear remedial solutions for every identified friction point.`
  },
  parashari: {
    name: "Classical Vedic Parashari",
    role: "You are a venerable Vedic Astrologer grounded in classical Brihat Parashara Hora Shastra (Lahiri Ayanamsha).",
    specifics: `Apply classical Parashari principles with exhaustive, deeply detailed analysis:
1. **Panchanga & Birth Profile**: Lagna, Moon Sign (Rashi), Nakshatra, Pada, Nakshatra Lord, Tithi, Yoga, Karana, and elemental balance (Agni, Prithvi, Vayu, Jala).
2. **Planetary Positions & Dignities Table**: Sidereal degrees, Rashi, Nakshatra, Lord, Exaltation/Debilitation/Own Sign, Retrograde status, Combust status, and Shadbala/strength assessment.
3. **12 Bhava (House) In-Depth Analysis (Balanced Realism)**: Detailed assessment of Kendras (1, 4, 7, 10), Trikonas (1, 5, 9), Panapharas (2, 5, 8, 11), Apoklimas (3, 6, 9, 12), and Dusthanas (6, 8, 12). Detail both auspicious boons and challenging tests for each house without alarming words.
4. **Career, Wealth & Marriage Deep Breakdown**: Comprehensive analysis of profession (10th house & D10), financial accumulation (2nd & 11th houses), and marriage (7th house & spouse characteristics), balancing natural fortunes with areas of caution and conscious effort.
5. **Planetary Yogas & Doshas**: Identify major Raja Yogas, Dhana Yogas, Pancha Mahapurusha Yogas, Gajakesari Yoga, Viparita Yogas, and Doshas (Mangal/Kalsarp/Pitri Rin). Never use fatalistic language; explicitly provide classical cancellation rules (Parihara) and remedial solutions.
6. **Vimshottari Mahadasha Lifelong Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all 9 Mahadashas from birth date up to 120 years. Provide deep interpretation of the active Mahadasha and Antardasha balancing blessings and test periods.
7. **Shani Saadesati Exact Lifecycle Table (MANDATORY)**: Provide exact dates and years for all 3 phases (Rising, Peak, Setting) with ~2.5 years duration per phase, paired with reassuring remedies.
8. **Classical Vedic Remedies for All Challenges**: Specific gemstone (carats, metal, finger, day), Rudraksha mukhi, Vedic mantras, fasts, and charitable daan addressing every identified negative or dosha.`
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
   - Gnatikaraka (GK - Obstacles, health & competitors - analyzed constructively with remedial insights)
   - Darakaraka (DK - Spouse, partnerships & mutual bond)
2. **Special Lagnas**: Lagna, Arudha Lagna (AL - public persona), Upapada Lagna (UL - marital destiny), Darapada (A7), and Karakamsa Lagna.
3. **Jaimini Rashi Drishti & Aspects**: Dynamic interactions between cardinal (Chara), fixed (Sthira), and mutable (Dwisvabhava) signs.
4. **Chara Dasha Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for each sign Dasha period and identify the current active Dasha with predictive insights balancing boons and testing periods.
5. **Vimshottari Mahadasha & Shani Saadesati Years Table (MANDATORY)**: Exact calendar years and dates for Mahadashas and Saturn Saadesati cycles (~2.5 years per phase).
6. **Soul Mission, Career & Marriage Analysis**: In-depth interpretation of life purpose based on AK and UL, detailing both natural soul gifts and karmic lessons without harshness.
7. **Jaimini Remedies & Spiritual Alignments**: Tailored mantras, deities, and alignments based on the Atmakaraka and Gnatikaraka to harmonize all identified obstacles.`
  },
  lalkitab: {
    name: "Lal Kitab System",
    role: "You are an expert Lal Kitab Farman and Arman practitioner.",
    specifics: `Apply authentic Lal Kitab principles with exhaustive, deeply detailed analysis:
1. **Kalpurush Kundali Mapping**: Interpret planetary placements with Aries fixed as House 1, Taurus as House 2, etc.
2. **Grah Status & House Dynamics**: Identify Pakka Ghar (permanent houses), Kismat Jagane Wale Grah (luck activators), and Soye Hue Grah/Ghar (sleeping planets/houses).
3. **Pitra Rin & Ancestral Debts**: Diagnose ancestral debts (Pitri Rin, Matri Rin, Stri Rin, Swa-Rin) from planetary combinations with gentle, constructive awareness and clear remedial rectification. Never alarm the native.
4. **Career, Wealth & Life Trajectory**: Practical real-world manifestations of planetary combinations in daily life, business, and family, balancing gains with prudent cautions.
5. **Lal Kitab Grah Dasha & Vimshottari Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for major planetary dasha periods.
6. **Shani Saadesati Lifecycle Table (MANDATORY)**: Calculate exact dates and years for the 3 phases of Saturn's transit (~2.5 years per phase).
7. **Authentic Lal Kitab Totkas (Remedies)**: Clear, practical, safe, and uplifting remedies for all diagnosed debts or sleeping houses (e.g. offerings in running water, silver square, caring for specific animals, ethical conduct).`
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
   - Karma Karaka (Saturn) & professional karma, roadblocks, and breakthroughs (analyzed constructively)
   - Budha (Education/Business) & Shukra (Wealth/Spouse) linkages
3. **Vimshottari Dasha Timeline Table (MANDATORY)**: Calculate exact calendar years (Start Year – End Year) for all planetary dasha cycles from birth date.
4. **Shani Saadesati Exact Timeline (MANDATORY)**: Calculate exact dates and calendar years for Saturn Saadesati phases (Rising, Peak, Setting) over natal Moon (~2.5 years per phase).
5. **Karmic Blessings & Obstacles**: Deep past-life karmic impressions, blessings, and roadblocks framed as soul lessons without harsh language, accompanied by comprehensive Nadi remedial guidance.`
  },
  western: {
    name: "Western Tropical Astrology",
    role: "You are a master psychological and Hellenistic Western Astrologer (Tropical Zodiac, Placidus Houses).",
    specifics: `Apply Western Tropical astrology principles with exhaustive, deeply detailed analysis:
1. **The Big Three & Angles**: Tropical Ascendant (Rising), Sun Sign, Moon Sign, Midheaven (MC), and IC with deep psychological synthesis.
2. **Planetary Positions Table**: Sun through Pluto + Chiron degrees in Tropical signs and Placidus houses.
3. **Major Aspect Matrix**: Conjunctions, Oppositions, Trines, Squares, and Sextiles with exact orbs. Frame difficult squares and oppositions as constructive growth challenges rather than negative doom.
4. **Career, Romance & Psychological Growth**: In-depth analysis of vocation (MC & 10th house), relationships (7th house & Venus/Mars), and shadow work with grounding therapeutic remedies.
5. **Major Life Transits & Saturn Return Timeline Table (MANDATORY)**: Exact calendar years (Start Year – End Year) for Saturn Return (ages 28-30 and 58-60) and major transits.
6. **Progressed Timeline / Dasha Equivalent Table (MANDATORY)**: Year-by-year major planetary transit phases with exact calendar years.
7. **Psychological & Life Path Profile**: Core archetype, inner child integration, relationships, career trajectory, and constructive self-care remedies.`
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

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      { headers: { "User-Agent": "WhatMyStarsSaysVedicApp/1.0" } }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
        };
        StorageService.save(cacheKey, result, 720);
        return result;
      }
    }
  } catch (err) {
    console.warn("Geocoding network fetch failed, using location fallback coordinates:", err);
  }

  const fallbackResult = {
    lat: 19.0760,
    lng: 72.8777,
    formattedAddress: location || "Vedic Center",
  };
  StorageService.save(cacheKey, fallbackResult, 720);
  return fallbackResult;
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

${BALANCED_PREDICTION_MANDATE}

MANDATORY DEPTH & COMPOSITION REQUIREMENTS:
- Every life domain (Overview, Career, Health, Relationships, Finance, Spirituality) must present a balanced, realistic blend of favorable positive opportunities and potential negative friction points or cautions.
- Explain challenging transits (e.g. Saturn, Rahu-Ketu, combust or retrograde planets) with calm, dignified advice. Never shock or frighten the reader.
- For every challenge, vulnerability, or friction point noted, immediately provide a practical, uplifting remedial solution (Upaya) — such as a daily Vedic mantra, supportive color, dietary or lifestyle caution, or mindful practice.
- Each field must contain an extensive, multi-sentence paragraph (4 to 6 detailed sentences) providing concrete real-world astrological predictions rather than vague summaries.
- Explain the underlying planetary transit reasons (e.g. Saturn in Pisces, Jupiter in Gemini, Sun's placement) and how they impact daily decisions.
- Include specific guidance on what actions to pursue, what pitfalls to avoid, and auspicious timings.

CRITICAL LANGUAGE REQUIREMENT:
You MUST write all textual descriptions, predictions, and field values in ${language} (using authentic native ${language} script).
All 8 values in the JSON object must be written fluently in ${language}.
The keys of the JSON object must remain in English as shown below.`,
      `Return a valid JSON object (no markdown code fences):
{
  "overview": "Comprehensive, deeply detailed multi-sentence overview in ${language} synthesizing major planetary transit energies, balancing positive openings with realistic cautions, and highlighting protective remedies",
  "career": "In-depth career and workplace prediction in ${language} balancing achievements and timing with workload or team friction, paired with practical career remedies",
  "health": "Detailed physical and mental vitality prediction in ${language} highlighting strengths and potential fatigue/stress vulnerabilities, accompanied by lifestyle and dietary remedies",
  "relationships": "Rich, multi-sentence love, family and marital harmony prediction in ${language} highlighting natural resonance alongside sensitive friction points, paired with compassionate relationship remedies",
  "finance": "Detailed financial foresight, wealth accumulation, and investment guidance in ${language} balancing opportunities with expense cautions, accompanied by financial remedies",
  "spirituality": "Deep spiritual evolution and mindfulness prediction in ${language} addressing both inner peace and karmic restlessness with uplifting meditative remedies",
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

  try {
    const result = await withRetry(async () => {
    const text = await callAI(
      `${config.role} Current Date: ${getCurrentDate()}.
This is an authentic, high-precision, EXHAUSTIVE Life Blueprint Analysis using the ${config.name}.

${BALANCED_PREDICTION_MANDATE}

${moonContext}
${saadesatiPromptContext}

MANDATORY DEPTH & STRUCTURE REQUIREMENTS FOR THE REPORT:
The "report" field must be an exhaustive, deeply detailed, beautifully written multi-page Markdown document written strictly and exclusively in ${language} featuring:
1. Lagna & Atmakaraka Soul Blueprint: Exhaustive multi-paragraph analysis of the Ascendant sign, physical vitality, temperament, psychological profile, and core karmic life purpose.
2. Comprehensive 12 Bhava (House-by-House) Detailed Predictions:
   - Provide an individual, deeply detailed multi-paragraph evaluation for ALL 12 HOUSES (1 to 12).
   - In EVERY house analysis, detail BOTH positive strengths/fruits and negative challenges/friction points.
   - For every challenging placement, immediately integrate constructive insights and specific Vedic remedial countermeasures.
3. Navagraha Deep Interpretation: Detailed assessment of all 9 Grahas (Sun through Ketu) in their respective signs and houses with dignity, aspects (Drishti), and functional indications.
4. Career, Profession & Financial Trajectory: In-depth analysis of optimal career industries, job vs business suitability, financial accumulation capacity, and peak earning years, alongside periods of professional struggle, career stagnation, or financial leakages, paired with actionable remedies.
5. Marriage, Love & Relationship Dynamics: In-depth analysis of the 7th house, Venus/Jupiter placements, spouse characteristics, natural harmonies, and potential friction/misunderstandings, provided with constructive communication habits and Vedic relationship remedies.
6. Health, Vitality & Preventive Ayurveda: Physical constitution (Vata/Pitta/Kapha), strengths, sensitive bodily areas, potential stress cycles, and preventative Ayurvedic/Vedic lifestyle remedies.
7. Major Planetary Yogas, Doshas & Gochara Transits: Raja Yogas, Dhana Yogas, Gajakesari Yoga, Manglik / Kalsarp / Pitri Rin analysis with specific classical cancellations and uplifting mitigation remedies.
8. Vimshottari Mahadasha Lifelong Timeline Table (120-Year): Complete 9-Mahadasha table with exact years, plus detailed interpretation of active Mahadasha and Antardasha detailing both favorable boons and challenging test periods with targeted planetary remedies.
9. Shani Saadesati Exact Timeline: Exact start and end dates for all 3 phases (~2.5 years each) with real-time status and reassuring, protective remedial guidance.
10. Prescriptive Classical Vedic Remedies: Comprehensive dedicated section detailing Primary gemstone (carats, metal, finger, day, ritual), Rudraksha mukhi, Vedic Beej mantras with exact counts, charitable acts (Daan), and daily spiritual disciplines to balance all identified karmic challenges.

CRITICAL SCRIPT & LANGUAGE PURITY MANDATE:
- The user has chosen the language: ${language}.
- You MUST write 100% of the "report" and all textual fields (starLord, subLord, nakshatra, moonSign) strictly and exclusively in ${language} (using native ${language} script).
- NEVER mix Hindi, Marathi, or English words together.
- When ${language} is selected, do NOT use English or Hindi words in parentheses (e.g. if Marathi is selected, do NOT write "आरोग्य (Health)" or "लग्न (Lagna)" or "Friendly (मित्र)"). Write everything strictly in pure, natural, fluent ${language}.
- ASTERISK AND FORMATTING MANDATE: Do NOT use asterisks (*) or (**) for bolding, bullet points, or titles. Write all text cleanly and fluently in ${language} without code-like markdown asterisks (*, **, ***).
- The JSON keys ("report", "chart", "lagnaSign", "starLord", "subLord", "nakshatra", "moonSign", "mahadashas", "saadesatiCycles") and house numbers ("1".."12") must remain in English.
- "chart": Distribute all 9 planets into their authentic astrological houses across keys "1" through "12" using standard abbreviations ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"]. NEVER place all planets into House 1. Rahu and Ketu MUST be in opposite houses (7 houses apart).`,
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

    // Deterministically compute complete authentic Avakahada Chakra and Planetary Dignities
    parsed.planetaryPositions = calculatePlanetaryPositions(
      parsed.chart,
      parsed.lagnaSign || 1,
      details.dob,
      details.tob
    );

    parsed.chart = ensureValidKundaliChart(parsed.chart, parsed.planetaryPositions);

    parsed.avakahada = calculateAvakahadaDetails(
      details.dob,
      details.tob || '12:00',
      parsed.lagnaSign || 1,
      parsed.chart
    );

    // Calculate complete 6 foundational pillars
    parsed.shadbala = calculateShadbala(parsed.planetaryPositions, parsed.lagnaSign || 1, details.dob, details.tob, language);
    parsed.yogas = calculateYogas(parsed.planetaryPositions, parsed.lagnaSign || 1, language);
    parsed.doshas = calculateDoshas(parsed.planetaryPositions, parsed.lagnaSign || 1, parsed.avakahada, language);
    parsed.divisionalCharts = calculateDivisionalCharts(parsed.planetaryPositions, parsed.lagnaSign || 1);

    const activeMaha = (parsed.mahadashas || []).find(m => m.isCurrent) || (parsed.mahadashas || [])[0];
    parsed.antardashas = calculateAntardashas(activeMaha, details.dob, language);
    parsed.practicalRemedies = calculatePracticalRemedies(parsed.planetaryPositions, parsed.lagnaSign || 1, parsed.doshas, language);

    const sunPos = parsed.planetaryPositions.find(p => p.planet === 'Sun');
    if (sunPos) parsed.sunSign = getLocalizedSign(sunPos.sign, language);

    return parsed;
  });

  StorageService.save(langKey, result, -1);
  return result;
  } catch (err: any) {
    console.warn("Gemini AI API unavailable, engaging authentic Vedic astronomical engine fallback:", err);
    const fallback = generateOfflineKundali(details, language, system, exactSaadesati, moonCalc);
    StorageService.save(langKey, fallback, 24);
    return fallback;
  }
};

const generateOfflineKundali = (
  details: BirthDetails,
  language: Language,
  system: KundaliSystem,
  exactSaadesati: any[],
  moonCalc: any
): KundaliResponse => {
  const hour = parseInt((details.tob || '12:00').split(':')[0], 10) || 12;
  const minute = parseInt((details.tob || '12:00').split(':')[1], 10) || 0;
  const month = parseInt((details.dob || '1990-01-01').split('-')[1], 10) || 1;
  const day = parseInt((details.dob || '1990-01-01').split('-')[2], 10) || 15;
  const approxSunSign = ((month + 1) % 12) + 1;
  const hoursSinceSunrise = (hour + minute / 60 - 6 + 24) % 24;
  const lagnaSign = ((approxSunSign - 1 + Math.floor(hoursSinceSunrise / 2)) % 12) + 1;

  const moonSignName = moonCalc?.rashi.name || 'Taurus';
  const moonSignLocalized = getLocalizedSign(moonSignName, language);
  const nakshatraName = moonCalc?.nakshatra.name || 'Rohini';
  const nakshatraSanskrit = moonCalc?.nakshatra.sanskrit || 'रोहिणी';
  const starLord = getLocalizedPlanet(moonCalc?.nakshatra.lord || 'Moon', language);
  const subLord = getLocalizedPlanet('Jupiter', language);

  // Compute authentic natal planetary positions
  const planetaryPositions = calculatePlanetaryPositions({}, lagnaSign, details.dob, details.tob);
  const chart = ensureValidKundaliChart({}, planetaryPositions);

  const birthYear = parseInt((details.dob || '1990-01-01').split('-')[0], 10) || 1990;
  const DASHA_ORDER = [
    { planet: 'Ketu', years: 7, sanskrit: 'केतु' },
    { planet: 'Venus', years: 20, sanskrit: 'शुक्र' },
    { planet: 'Sun', years: 6, sanskrit: 'सूर्य' },
    { planet: 'Moon', years: 10, sanskrit: 'चन्द्र' },
    { planet: 'Mars', years: 7, sanskrit: 'मंगल' },
    { planet: 'Rahu', years: 18, sanskrit: 'राहु' },
    { planet: 'Jupiter', years: 16, sanskrit: 'बृहस्पति (गुरु)' },
    { planet: 'Saturn', years: 19, sanskrit: 'शनि' },
    { planet: 'Mercury', years: 17, sanskrit: 'बुध' }
  ];

  const currentYear = new Date().getFullYear();
  let yr = birthYear;
  const mahadashas = DASHA_ORDER.map(d => {
    const startYear = yr;
    const endYear = yr + d.years;
    yr = endYear;
    return {
      planet: getLocalizedPlanet(d.planet, language),
      startYear,
      endYear,
      durationYears: d.years,
      isCurrent: currentYear >= startYear && currentYear <= endYear
    };
  });

  const localizedLagnaSign = getLocalizedSign(lagnaSign, language);
  const locale = getKundaliLocale(language);
  const seekerName = details.name || locale.cover.defaultNativeName;

  const bhavaSections = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
    const data = getLocalizedBhavaData(h, language);
    return `### ${data.title}
${data.coreThemes}
- ${locale.bhavaPillars.boonsTitle} ${data.baseBoons.join(' • ')}
- ${locale.bhavaPillars.cautionsTitle} ${data.baseCautions.join(' • ')}
- ${locale.bhavaPillars.upayasTitle} ${data.baseRemedies.join(' • ')}`;
  }).join('\n\n');

  const careerTitles: Record<Language, string> = {
    English: 'Career, Profession & Wealth Mastery',
    Marathi: 'आजीविका, व्यवसाय व आर्थिक प्रगती',
    Gujarati: 'કારકિર્દી, વ્યવસાય અને આર્થિક સમૃદ્ધિ',
    Bengali: 'জীবিকা, কর্ম ও আর্থিক সমৃদ্ধি',
    Tamil: 'தொழில், வேலைவாய்ப்பு மற்றும் நிதி வளம்',
    Telugu: 'వృత్తి, ఉద్యోగం మరియు ఆర్థిక అభివృద్ధి',
    Kannada: 'ಉದ್ಯೋಗ, ವೃತ್ತಿ ಮತ್ತು ಆರ್ಥಿಕ ಸಮೃದ್ಧಿ',
    Malayalam: 'തൊഴിൽ, ഉപജീവനം, സാമ്പത്തിക അഭിവൃദ്ധി',
    Punjabi: 'ਰੋਜ਼ਗਾਰ, ਵਪਾਰ ਅਤੇ ਆਰਥਿਕ ਤਰੱਕੀ',
    Odia: 'ଜୀବିକା, ବ୍ୟବସାୟ ଓ ଆର୍ଥିକ ସମୃଦ୍ଧି',
    Hindi: 'आजीविका, कर्म एवं आर्थिक समृद्धि'
  };

  const marriageTitles: Record<Language, string> = {
    English: 'Marriage, Partnerships & Relationships',
    Marathi: 'विवाह व दांपत्य जीवन',
    Gujarati: 'વિવાહ અને દાંપત્ય જીવન',
    Bengali: 'বিবাহ ও দাম্পত্য সম্পর্ক',
    Tamil: 'திருமணம் மற்றும் குடும்ப வாழ்க்கை',
    Telugu: 'వివాహం మరియు వైవాహిక జీవితం',
    Kannada: 'ವಿವಾಹ ಮತ್ತು ಕೌಟುಂಬಿಕ ಸಾಮರಸ್ಯ',
    Malayalam: 'വിവാഹവും കുടുംബ ജീവിതവും',
    Punjabi: 'ਵਿਆਹ ਅਤੇ ਸੁਖੀ ਗ੍ਰਹਿਸਥੀ',
    Odia: 'ବିବାହ ଓ ଦାମ୍ପତ୍ୟ ସମ୍ପର୍କ',
    Hindi: 'विवाह, प्रेम एवं संबंध सामंजस्य'
  };

  const healthTitles: Record<Language, string> = {
    English: 'Vitality, Physical Well-being & Ayurveda',
    Marathi: 'आरोग्य व शारीरिक जीवन ऊर्जा',
    Gujarati: 'આરોગ્ય, જીવનશક્તિ અને આયુર્વેદ',
    Bengali: 'স্বাস্থ্য, জীবনীশক্তি ও আয়ুর্বেদ',
    Tamil: 'உடல் நலம் மற்றும் ஆயுர்வேத நலன்',
    Telugu: 'ఆరోగ్యం మరియు శారీరక జీవన శక్తి',
    Kannada: 'ಆರೋಗ್ಯ ಮತ್ತು ಶಾರೀರಿಕ ಚೈತನ್ಯ',
    Malayalam: 'ആരോഗ്യം, ജീവശക്തി, ആയുർവേദം',
    Punjabi: 'ਸਿਹਤ ਅਤੇ ਸਰੀਰਕ ਊਰਜਾ',
    Odia: 'ସ୍ୱାସ୍ଥ୍ୟ, ଜୀବନଶକ୍ତି ଓ ଆୟୁର୍ବେଦ',
    Hindi: 'स्वास्थ्य, जीवन शक्ति एवं आयुर्वेद'
  };

  const yogaTitles: Record<Language, string> = {
    English: 'Classical Vedic Remedies & Spiritual Upayas',
    Marathi: 'ग्रह योग व शास्त्रीय वैदिक उपाय',
    Gujarati: 'ગ્રહ યોગ અને શાસ્ત્રીય વૈદિક ઉપાયો',
    Bengali: 'গ্রহ যোগ ও শাস্ত্রীয় বৈদিক প্রতিকার',
    Tamil: 'கிரக யோகங்கள் மற்றும் வேத பரிகாரங்கள்',
    Telugu: 'గ్రహ యోగాలు మరియు వైదిక పరిహారాలు',
    Kannada: 'ಗ್ರಹ ಯೋಗಗಳು ಮತ್ತು ವೈದಿಕ ಪರಿಹಾರಗಳು',
    Malayalam: 'ഗ്രഹ യോഗങ്ങളും വൈദಿಕ പരിഹാരങ്ങളും',
    Punjabi: 'ਗ੍ਰਹਿ ਯੋਗ ਅਤੇ ਵੈਦਿਕ ਉਪਾਅ',
    Odia: 'ଗ୍ରହ ଯୋଗ ଓ ବୈଦିକ ଉପାୟ',
    Hindi: 'ग्रह योग, दोष एवं शास्त्रीय उपाय'
  };

  const introParagraphs: Record<Language, string> = {
    English: `The native ${seekerName} was born under the auspicious ascendant of ${localizedLagnaSign}. The natal Moon occupies ${moonSignLocalized} in the sacred constellation of ${nakshatraName}. The ascendant lord bestows acute intellect, moral steadfastness, and an innate capacity for visionary leadership. Your mind operates with profound sensitivity and philosophical depth.`,
    Marathi: `जातक ${seekerName} यांचा जन्म शुभ ${localizedLagnaSign} लग्नात झाला आहे. आपली जन्म चंद्र राशी ${moonSignLocalized} असून पावन ${nakshatraName} नक्षत्रात जन्म झाला आहे. लग्न स्वामीचा प्रभाव आपल्या व्यक्तिमत्त्वात दृढ आत्मविश्वास, नैतिक निष्ठा, अफाट इच्छाशक्ती आणि स्वाभाविक नेतृत्वगुणांचे सिंचन करतो. आपले मन संवेदनशील, दूरदर्शी आणि सकारात्मक दृष्टिकोनाने परिपूर्ण आहे.`,
    Gujarati: `જાતક ${seekerName} નો જન્મ શુભ ${localizedLagnaSign} લગ્નમાં થયો છે. આપની જન્મ ચંદ્ર રાશિ ${moonSignLocalized} અને પાવન ${nakshatraName} નક્ષત્ર છે. લગ્ન સ્વામીનો પ્રભાવ આપના વ્યક્તિત્વમાં આત્મવિશ્વાસ, નૈતિક નિષ્ઠા અને સ્વાભાવિક નેતૃત્વ ગુણોનું સિંચન કરે છે. આપનું મન સંવેદનશીલ અને દૂરદર્શી છે.`,
    Bengali: `জাতক ${seekerName}-এর জন্ম শুভ ${localizedLagnaSign} লগ্নে হয়েছে। আপনার জন্ম চন্দ্র রাশি ${moonSignLocalized} এবং পবিত্র ${nakshatraName} নক্ষত্রে অবস্থান করছে। লগ্ন পতির প্রভাব আপনার ব্যক্তিত্বে আত্মবিশ্বাস, নৈতিক নিষ্ঠা ও নেতৃত্বগুণের বিকাশ ঘটায়। আপনার মন অত্যন্ত সংবেদনশীল ও দূরদর্শী।`,
    Tamil: `ஜாதகர் ${seekerName} சுப ${localizedLagnaSign} லக்னத்தில் பிறந்துள்ளார். உங்கள் சந்திர ராசி ${moonSignLocalized} மற்றும் ஜென்ம நட்சத்திரம் ${nakshatraName} ஆகும். லக்னாதிபதியின் அருள் உங்கள் ஆளுமையில் தன்னம்பிக்கை, நேர்மை மற்றும் தலைமைத்துவ பண்புகளை வழங்குகிறது.`,
    Telugu: `జాతకుడు ${seekerName} శుభ ${localizedLagnaSign} లగ్నంలో జన్మించారు. మీ చంద్ర రాశి ${moonSignLocalized} మరియు జన్మ నక్షత్రం ${nakshatraName}. లగ్నాధిపతి ప్రభావం మీ వ్యక్తిత్వంలో ఆత్మవిశ్వాసం, ధర్మనిష్ఠ మరియు నాయకత్వ లక్షణాలను పెంపొందిస్తుంది.`,
    Kannada: `ಜಾತಕ ${seekerName} ಅವರು ಶುಭ ${localizedLagnaSign} ಲಗ್ನದಲ್ಲಿ ಜನಿಸಿದ್ದಾರೆ. ನಿಮ್ಮ ಚಂದ್ರ ರಾಶಿ ${moonSignLocalized} ಮತ್ತು ಪವಿತ್ರ ${nakshatraName} ನಕ್ಷತ್ರವಾಗಿದೆ. ಲಗ್ನಾಧಿಪತಿಯ ಪ್ರಭಾವವು ನಿಮ್ಮಲ್ಲಿ ಆತ್ಮವಿಶ್ವಾಸ, ಧರ್ಮನಿಷ್ಠೆ ಮತ್ತು ನಾಯಕತ್ವ ಗುಣಗಳನ್ನು ತುಂಬುತ್ತದೆ.`,
    Malayalam: `ജാതകൻ ${seekerName} ശുഭകരമായ ${localizedLagnaSign} ലഗ്നത്തിൽ ജനിച്ചിരിക്കുന്നു. നിങ്ങളുടെ ചന്ദ്ര രാശി ${moonSignLocalized} ഉം ജന്മ നക്ഷത്രം ${nakshatraName} ഉം ആണ്. ലഗ്നാധിപന്റെ സ്വാധീനം ആത്മവിശ്വാസവും നേതൃത്വഗുണങ്ങളും നൽകുന്നു.`,
    Punjabi: `ਜਾਤਕ ${seekerName} ਦਾ ਜਨਮ ਸ਼ੁਭ ${localizedLagnaSign} ਲਗਨ ਵਿੱਚ ਹੋਇਆ ਹੈ। ਤੁਹਾਡੀ ਚੰਦਰ ਰਾਸ਼ੀ ${moonSignLocalized} ਅਤੇ ਜਨਮ ਨਕਸ਼ਤਰ ${nakshatraName} ਹੈ। ਲਗਨ ਸੁਆਮੀ ਦਾ ਪ੍ਰਭਾਵ ਤੁਹਾਡੇ ਵਿੱਚ ਆਤਮਵਿਸ਼ਵਾਸ ਅਤੇ ਨੇਤ੍ਰਿਤਵ ਦੇ ਗੁਣ ਭਰਦਾ ਹੈ।`,
    Odia: `ଜାତକ ${seekerName}ଙ୍କ ଜନ୍ମ ଶୁଭ ${localizedLagnaSign} ଲଗ୍ନରେ ହୋଇଛି। ଆପଣଙ୍କ ଚନ୍ଦ୍ର ରାଶି ${moonSignLocalized} ଏବଂ ଜନ୍ମ ନକ୍ଷତ୍ର ${nakshatraName} ଅଟେ। ଲଗ୍ନାଧିପତିଙ୍କ ପ୍ରଭାବ ବ୍ୟକ୍ତିତ୍ୱରେ ଆତ୍ମବିଶ୍ୱାସ ଓ ନେତୃତ୍ୱ ଗୁଣ ପ୍ରଦାନ କରେ।`,
    Hindi: `जातक ${seekerName} का जन्म शुभ ${localizedLagnaSign} लग्न में हुआ है। आपका जन्म चन्द्रमा ${moonSignLocalized} राशि में तथा पावन ${nakshatraName} नक्षत्र में स्थित है। लग्न स्वामी का प्रभाव आपके व्यक्तित्व में उच्च आत्मबल, नैतिक निष्ठा, दृढ इच्छाशक्ति तथा स्वाभाविक नेतृत्व क्षमता का संचार करता है। आपका मन संवेदनशील, दूरदर्शी और दार्शनिक दृष्टिकोण से परिपूर्ण है।`
  };

  const report = `# ${locale.chapterLabels.ch1Part1Title}
${introParagraphs[language] || introParagraphs.English}

## ${locale.footers.bhavaFooter}
${bhavaSections}

## ${careerTitles[language] || careerTitles.English}
${language === 'English'
  ? `The alignment of the 10th house of Karma with the 2nd and 11th houses indicates distinguished achievements in strategic, executive, academic, administrative, or technological sectors.\n- ${locale.bhavaPillars.boonsTitle} Executive leadership, ethical professional standing, and sustained lifetime prestige.\n- ${locale.bhavaPillars.cautionsTitle} Resist taking unilateral responsibilities without establishing proper team accountability.\n- ${locale.bhavaPillars.upayasTitle} Keep a consecrated Shree Yantra at your workspace and offer charity on Wednesdays.`
  : language === 'Marathi'
  ? `दशम आणि द्वितीय भावाचा परस्पर संबंध दर्शवतो की आपल्या कारकीर्दीत बौद्धिक आणि व्यवस्थापकीय कौशल्याला मोठे महत्त्व असेल. प्रशासन, व्यवस्थापन, वित्त, शिक्षण किंवा तंत्रज्ञान क्षेत्रात आपल्याला विशेष प्रतिष्ठा मिळेल.\n- ${locale.bhavaPillars.boonsTitle} व्यावसायिक नेतृत्व, कायमस्वरूपी संपत्तीची निर्मिती आणि प्रतिष्ठित पद.\n- ${locale.bhavaPillars.cautionsTitle} भागीदार निवडताना किंवा करारांवर स्वाक्षरी करताना कायदेशीर सल्ला आवर्जून घ्या.\n- ${locale.bhavaPillars.upayasTitle} आपल्या कामाच्या ठिकाणी श्रीयंत्राची स्थापना करावी.`
  : `दशम व द्वितीय भाव का संबंध यह दर्शाता है कि आपकी आजीविका में बौद्धिक, रणनीतिक तथा संगठनात्मक कौशल की प्रमुख भूमिका रहेगी। शासन, प्रबंधन, वित्त, परामर्श, शिक्षा अथवा तकनीकी उद्यम में आपकी विशिष्ट प्रतिष्ठा बनेगी।\n- ${locale.bhavaPillars.boonsTitle} व्यावसायिक नेतृत्व, स्थायी धन संग्रह तथा प्रतिष्ठित पदों की प्राप्ति।\n- ${locale.bhavaPillars.cautionsTitle} साझेदारी अथवा अनियोजित अनुबंधों में बिना कानूनी परामर्श के हस्ताक्षर न करें।\n- ${locale.bhavaPillars.upayasTitle} कार्यस्थल पर श्रीयंत्र की स्थापना करें एवं बुधवार को हरी मूंग का दान करें।`}

## ${marriageTitles[language] || marriageTitles.English}
${language === 'English'
  ? `The 7th house and Venus aspects confirm a devoted, intellectually attuned, and culturally grounded partner. Mature communication and mutual reverence will deepen marital bliss across the decades.\n- ${locale.bhavaPillars.boonsTitle} Empathic soul bond, shared life philosophy, and domestic stability.\n- ${locale.bhavaPillars.cautionsTitle} Consciously practice calm patience during planetary transit stress periods.\n- ${locale.bhavaPillars.upayasTitle} Offer sweet milk preparation (Kheer) to deities on Fridays and share with family.`
  : language === 'Marathi'
  ? `सप्तमेश व शुक्र यांची स्थिती दर्शवते की आपल्याला निष्ठावान, सुविद्य आणि समजूतदार जीवनसाथी लाभेल. परस्पर विश्वास आणि खुला संवाद आपल्या वैवाहिक जीवनात अखंड गोडवा टिकवून ठेवेल.\n- ${locale.bhavaPillars.boonsTitle} सुखी गृहस्थ जीवन, कौटुंबिक प्रतिष्ठा आणि परस्पर आदर.\n- ${locale.bhavaPillars.cautionsTitle} कामाच्या तणावाखाली जोडीदारावर राग काढणे टाळावे.\n- ${locale.bhavaPillars.upayasTitle} शुक्रवारी खीर बनवून सहकुटुंब प्रसाद ग्रहण करावा.`
  : `सप्तमेश और शुक्र की स्थिति एक निष्ठावान, बौद्धिक एवं संवेदनशील जीवनसाथी के आगमन का संकेत देती है। परस्पर विश्वास और परिपक्व संवाद आपके वैवाहिक जीवन को चिरस्थायी माधुर्य प्रदान करेगा।\n- ${locale.bhavaPillars.boonsTitle} गृहस्थ जीवन में सौहार्द, पारिवारिक प्रतिष्ठा में वृद्धि और साझा जीवन लक्ष्य।\n- ${locale.bhavaPillars.cautionsTitle} गोचर के दबाव में संवेदनशील विषयों पर अनावश्यक वाद-विवाद से बचें।\n- ${locale.bhavaPillars.upayasTitle} शुक्रवार को खीर का भोग लगाकर परिवार सहित प्रसाद ग्रहण करें।`}

## ${healthTitles[language] || healthTitles.English}
${language === 'English'
  ? `Your bio-energetic constitution is grounded in a healthy Vata-Pitta equilibrium. Maintaining rhythmic sleep intervals and balanced hydration sustains your natural recuperative stamina.\n- ${locale.bhavaPillars.boonsTitle} Robust baseline vitality, swift recovery from illness, and mental stamina under pressure.\n- ${locale.bhavaPillars.cautionsTitle} Guard against digestive heat or neck/shoulder stiffness during high-intensity periods.\n- ${locale.bhavaPillars.upayasTitle} Consume pure water stored in a copper vessel in the morning and practice daily Pranayama.`
  : language === 'Marathi'
  ? `लग्न व षष्ठ भावाच्या विश्लेषणानुसार आपली प्रकृती वात-पित्त प्रधान आहे. मेंदूची व विचारांची गती वेगवान असल्याने पचनसंस्था व मज्जासंस्थेची काळजी घेणे आवश्यक आहे.\n- ${locale.bhavaPillars.boonsTitle} उत्तम रोगप्रतिकारशक्ती, नैसर्गिक शारीरिक संतुलन.\n- ${locale.bhavaPillars.cautionsTitle} तेलकट किंवा अवेळी जेवण टाळावे; पुरेशी झोप घ्यावी.\n- ${locale.bhavaPillars.upayasTitle} दररोज सकाळी प्राणायाम आणि सूर्यनमस्कार करावेत.`
  : `लग्न व षष्ठ भाव के समीकरण के अनुसार आपकी प्रकृति वात-पित्त प्रधान है। मानसिक सक्रियता उच्च रहने के कारण स्नायु तंत्र और पाचन तंत्र को नियमित रखना अत्यंत आवश्यक है।\n- ${locale.bhavaPillars.boonsTitle} सुदृढ़ जीवन शक्ति, त्वरित रोगमुक्ति तथा प्राकृतिक शारीरिक संतुलन।\n- ${locale.bhavaPillars.cautionsTitle} गरिष्ठ भोजन तथा अत्यधिक मानसिक परिश्रम से एसिडिटी व अनिद्रा की संभावना।\n- ${locale.bhavaPillars.upayasTitle} तांबे के पात्र में रखा जल प्रातः पिएं तथा अनुलोम-विलोम प्राणायाम का नित्य अभ्यास करें।`}

## ${yogaTitles[language] || yogaTitles.English}
${language === 'English'
  ? `1. Sacred Protective Mantra: Daily chanting of Om Namo Bhagavate Vasudevaya (108 times) for peace and prosperity.\n2. Auspicious Gemstone: Consult your astrological chart before setting Yellow Sapphire or Ruby in sacred gold.\n3. Charitable Daan: Feed stray cows and support shelter animals on Saturdays to harmonize karmic transits.`
  : language === 'Marathi'
  ? `1. मूळ वैदिक मंत्र: दररोज सकाळी ॐ नमो भगवते वासुदेवाय किंवा महामृत्युंजय मंत्राचा जप करावा.\n2. शुभ रत्न: योग्य ज्योतिषी सल्ल्याने भाग्योदयासाठी योग्य रत्न परिधान करावे.\n3. सेवा व दान: शनिवारी गरजूंना अन्न किंवा वस्त्र दान करावे आणि गोसेवा करावी.`
  : `1. मूल वैदिक मन्त्र: नित्य प्रातः ॐ नमो भगवते वासुदेवाय (१०८ बार) अथवा महामृत्युंजय मन्त्र का जप करें।\n2. शुभ रत्न: योग्य ज्योतिषी परामर्श अनुसार भाग्योदय हेतु अनुकूल रत्न धारण करें।\n3. सेवा एवं दान: शनिवार को निर्धनों को भोजन व वस्त्र का दान करें तथा गौसेवा करें।`}`;

  const avakahada = calculateAvakahadaDetails(
    details.dob,
    details.tob || '12:00',
    lagnaSign,
    chart
  );

  const shadbala = calculateShadbala(planetaryPositions, lagnaSign, details.dob, details.tob, language);
  const yogas = calculateYogas(planetaryPositions, lagnaSign, language);
  const doshas = calculateDoshas(planetaryPositions, lagnaSign, avakahada, language);
  const divisionalCharts = calculateDivisionalCharts(planetaryPositions, lagnaSign);
  const activeMaha = mahadashas.find(m => m.isCurrent) || mahadashas[0];
  const antardashas = calculateAntardashas(activeMaha, details.dob, language);
  const practicalRemedies = calculatePracticalRemedies(planetaryPositions, lagnaSign, doshas, language);

  const sunPos = planetaryPositions.find(p => p.planet === 'Sun');
  const sunSignStr = sunPos ? getLocalizedSign(sunPos.sign, language) : getLocalizedSign(approxSunSign, language);

  return {
    report,
    chart,
    lagnaSign,
    starLord,
    subLord,
    nakshatra: nakshatraName,
    moonSign: moonSignLocalized,
    sunSign: sunSignStr,
    system,
    mahadashas,
    saadesatiCycles: exactSaadesati,
    avakahada,
    planetaryPositions,
    shadbala,
    yogas,
    doshas,
    divisionalCharts,
    antardashas,
    practicalRemedies
  };
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
  try {
    return await withRetry(async () => {
      const systemPrompt = `You are the user's personal Astrological Guide specializing in the ${config.name}.
Kundali context: ${context}. Current Date: ${getCurrentDate()}.
Answer the user's question using the specific tenets and techniques of ${config.name}.

${BALANCED_PREDICTION_MANDATE}

Provide a balanced, authentic answer presenting both favorable opportunities/strengths and realistic hurdles/delays. Never use shocking or alarming language; address negatives with calm dignity, psychological understanding, and immediately provide actionable Vedic remedies (mantras, gemstones, charity, mindset shifts) to overcome them.
CRITICAL LANGUAGE REQUIREMENT: You MUST formulate your entire response in ${lang} (using native ${lang} script).`;

      return await callAIChat(systemPrompt, history, q);
    });
  } catch (err: any) {
    console.warn("AI Kundali chat fallback engaged:", err);
    return `Based on authentic Vedic ${config.name} principles for your natal chart, the current planetary transits encourage conscious patience, focused discipline, and balancing spiritual practice with worldly duties. Chanting your Ishta Devata mantra and performing regular charitable acts will attract positive cosmic harmony and alleviate friction.`;
  }
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

${BALANCED_PREDICTION_MANDATE}

CONSULTATION MANDATE:
1. Provide a direct, authoritative, and profoundly personalized answer to the seeker's query.
2. Balanced Reality (Mix of Positives & Negatives): Present both positive cosmic supports, strengths, and yogas alongside negative obstacles, karmic friction, delays, or tests. Do NOT sugarcoat, but NEVER use harsh, frightening, or shocking language.
3. Remedial Imperative: For EVERY negative, obstacle, affliction, or difficult transit identified in your analysis, provide concrete, uplifting, and actionable remedial solutions (Parihara/Upaya).
4. Cross-reference their specific Kundali house significations (e.g. 10th/6th for career, 7th/2nd/11th for marriage/relationships, 2nd/11th/5th/9th for wealth, 6th/8th/12th for health).
5. Evaluate timing using active Mahadasha/Antardasha and Saturn Saadesati phase, pinpointing favorable vs challenging timeline periods.
6. Integrate current real-time Gochara transits (especially Saturn, Jupiter, and Rahu-Ketu) to explain what cosmic energies are impacting them right now.
7. Blend their Numerology (Mulank, Bhagyank, and Chaldean Name Number vibration) into the answer for multidimensional resonance.
8. Provide actionable, authentic remedies: Vedic Mantras (with count), Gemstone / Rudraksha recommendations, Daan (charity), Auspicious Colors & Directions, or Name vibration tweaks if appropriate.
9. Structure your response using clean, beautiful Markdown with bold headings, neat bullet points, and highlight cards/tables where fitting.

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

${BALANCED_PREDICTION_MANDATE}

If the user asks about spelling options, name alterations, business names, or signatures, provide precise letter-by-letter Chaldean calculations and guidance.
Explain any challenging vibrations or missing numbers calmly and constructively, offering immediate remedial solutions (lucky colors, crystals, charitable acts, affirmations, and name correction) without shocking or alarmist wording.
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

${BALANCED_PREDICTION_MANDATE}

CRITICAL REPORTING GUIDELINES:
1. BALANCED, DEEPLY DETAILED & EXHAUSTIVE ANALYSIS: Provide an authentic, comprehensive multi-section evaluation highlighting BOTH natural harmonies (positives) and areas for mutual growth/friction (negatives). Provide substantial paragraphs packed with classical insights, psychological understanding, and practical wisdom.
2. DIGNIFIED & COMPASSIONATE TONE: Strictly avoid harsh, alarming, terrifying, or fatalistic language. Never declare a match "ruined", "doomed", or "condemned". If there are friction points (such as Nadi or Bhakoot differences, or Manglik placement), explain them respectfully and constructively as opportunities for conscious communication, personal maturity, and Vedic remedies (Parihara).
3. EXACT MATHEMATICAL INTEGRITY: You MUST adhere to the provided deterministic Ashtakoot scores (${milanCalc ? milanCalc.totalScore : 'computed'} / 36) in the Ashtakoot table.
4. ACTIONABLE REMEDIES & BLISS FOR ALL FRICTION POINTS: Classical Shastras state that mutual devotion, maturity, and remedies enhance marital joy. Include practical, specific remedies (Vedic mantras, auspicious colors, charitable acts, communication habits) for every identified area of friction.
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
Provide an in-depth analytical explanation of what this overall score indicates for psychological compatibility, emotional bonding, and longevity of the relationship, balancing natural compatibility with areas requiring mindful communication.

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
Practical, uplifting remedies for daily life, mutual peace, and resolving any friction points:
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

${BALANCED_PREDICTION_MANDATE}

Provide an exhaustive, deeply detailed numerology report with practical, highly auspicious name correction recommendations. Present both core strengths and karmic blindspots/challenges, and for every missing number or name friction, provide concrete remedial solutions.
CRITICAL LANGUAGE REQUIREMENT: Write the entire analysis exclusively in ${lang} (using native ${lang} script).`,
      `Generate an exhaustive, highly detailed Vedic & Chaldean Numerology analysis for:
${name ? `Person's Full Name: ${name}` : 'Name: Not provided'}
Date of Birth: ${dob}
Mulank (Psychic / Root Number): ${m}
Bhagyank (Destiny / Life Path Number): ${b}
Loshu Grid State: ${JSON.stringify(loshu)}

You MUST include comprehensive, multi-paragraph sections:
1. **Core Number Profile (मूलांक व भाग्यांक विस्तृत विश्लेषण - सकारात्मक व सतर्कता पक्ष)**:
   - Mulank (${m}) - Ruling Planet, Psychological Blueprint, Subconscious Drivers, Strengths, Talents, and Potential Blindspots/Friction.
   - Bhagyank (${b}) - Ruling Planet, Karmic Destiny, Life Purpose, Soul Mission, Peak Achievement Timelines, and Life Tests.
   - Core Synergy: Detailed evaluation of compatibility or friction between Mulank (${m}) and Bhagyank (${b}) across career, finances, and relationships, balancing strengths with areas requiring patience.

2. **Loshu Grid Planes & Missing Numbers (लो-शू ग्रिड व रिक्त अंक विश्लेषण - शास्त्रीय उपाय सहित)**:
   - Complete breakdown of the 8 Planes: Mental (4-9-2), Emotional (3-5-7), Practical (8-1-6), Thought (4-3-8), Will (9-5-1), Action (2-7-6), and Golden Raj Yogas (4-5-6 & 2-5-8).
   - Specific analysis of present numbers and which planes are activated.
   - Detailed breakdown of missing numbers and their specific life voids (e.g. missing 5 affecting stability/business, missing 6 affecting luxury/family, missing 8 affecting discipline/wealth) explained calmly and constructively.
   - Concrete remedial measures for EVERY missing number (crystals, wristbands, Vastu directions, colors, planetary Beej Mantras).

3. **ASTROLOGICAL NAME CORRECTION & NAMAANK ALIGNMENT (नाम सुधार व नामांक विश्लेषण)**:
${name ? `
   - **Current Name Assessment**:
     * Calculate exact Chaldean Compound Number and Single Digit Namaank for "${name}".
     * Analyze if "${name}" harmonizes or creates friction with Mulank (${m}) and Bhagyank (${b}).
     * Point out whether the current compound frequency attracts delays or struggle, explaining how this can be smoothly remedied.
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
   - Career & Wealth: Best industries, job vs business suitability, and wealth retention capacity, alongside periods requiring financial caution.
   - Love & Relationships: Compatible partner numbers and relationship harmony tips.
   - Auspicious Matrix: Lucky Numbers, Friendly Numbers, Unfriendly Numbers, Lucky Days, Lucky Colours, and Favourable Directions.
   - Classical Remedies: Gemstones, Rudraksha mukhi, daily affirmations, and planetary Beej Mantras to harmonize all numbers.

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

${BALANCED_PREDICTION_MANDATE}

Provide an EXHAUSTIVE, HIGHLY DETAILED analysis with clear headings and multiple paragraphs covering both auspicious markings/lines and challenging signs (breaks, islands, stress lines), presenting challenges with calm dignity and constructive Vedic remedial solutions:
1. **Palm Shape & Elemental Classification**: Earth, Air, Fire, or Water hand, skin texture, and finger proportions.
2. **The 4 Major Lines (प्रमुख रेखाएँ - सबल व सतर्कता पक्ष)**:
   - Life Line (Jeevan Rekha): Length, depth, curve, vitality markers, longevity milestones, and periods requiring rest or health discipline with remedial lifestyle practices.
   - Head Line (Mastak Rekha): Intellect, mental focus, thinking style, creativity, and mental stress management remedies.
   - Heart Line (Hriday Rekha): Emotional depth, relationship expectations, empathy, and romantic balance remedies.
   - Fate Line (Bhagya Rekha): Career path, destiny milestones, turning points around ages 28, 35, and 45, alongside periods of career testing with remedial guidance.
3. **The Minor Lines & Success Indicators**:
   - Sun Line (Surya Rekha / Apollo): Fame, creative recognition, and public status.
   - Mercury Line (Health/Business Rekha): Commercial acumen, communication, and nervous vitality.
   - Marriage & Relationship Lines: Emotional bonding timing and partnership patterns.
4. **Mounts Analysis (पर्वत विश्लेषण)**:
   - Mount of Jupiter (Guru), Saturn (Shani), Sun (Surya), Mercury (Budh), Venus (Shukra), and Moon (Chandra) — noting developed vs depressed mounts with remedies.
5. **Special Sacred Marks (शुभ व विशेष चिन्ह)**:
   - Triangles, fish signs (Matsya), stars, crosses, islands, and trident (Trishul) formations.
6. **Overall Life Synthesis & Remedial Advice (संतुलित जीवन सारांश व शास्त्रीय उपाय)**:
   - Wealth retention potential, career recommendations, and actionable spiritual remedies (mantras, charitable acts, gemstone/rudraksha, Surya Arghya).

CRITICAL LANGUAGE REQUIREMENT: Write the ENTIRE analysis exclusively in ${lang} (using native ${lang} script).`;

    return await callAIVision(textPrompt, image);
  });
};
