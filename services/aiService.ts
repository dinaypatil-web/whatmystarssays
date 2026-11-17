import { GoogleGenAI } from "@google/genai";
import { BirthDetails, MatchmakingDetails, Timeframe, Language, ChatMessage, KundaliResponse, KundaliSystem, PlanetaryTransitInfo } from "../types";
import { StorageService } from "./storageService";
import {
  calculateAshtakootMilan,
  calculateMoonDetails,
  calculateSunDetails,
  calculateSaadesatiPhases,
  calculateAvakahadaDetails,
  calculatePlanetaryPositions,
  ensureValidKundaliChart,
  calculateShadbala,
  calculateYogas,
  calculateDoshas,
  calculateDivisionalCharts,
  calculateAntardashas,
  calculatePracticalRemedies,
  getAuthenticMoonSign,
  getAuthenticSunSign
} from "./astrologyHelper";
import { getLocalizedPlanet, getLocalizedSign, getKundaliLocale, getSeekerPillars } from "./kundaliLocalization";
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

  // Calculate deterministic astronomical anchors to prevent hallucinations across re-runs
  const sunCalc = calculateSunDetails(details.dob, details.tob);
  const moonCalc = calculateMoonDetails(details.dob, details.tob);
  const sunContext = sunCalc
    ? `Astronomical Sun Reference: Sun in ${sunCalc.rashi.name} (${sunCalc.rashi.sanskrit}), Degree: ${sunCalc.degree}, Sidereal Longitude: ${sunCalc.siderealLongitude.toFixed(2)}°.`
    : '';
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

${sunContext}
${moonContext}
${saadesatiPromptContext}

MANDATORY DEPTH & STRUCTURE REQUIREMENTS FOR THE REPORT:
The "report" field must be an exhaustive, deeply detailed, beautifully written multi-page Markdown document written strictly and exclusively in ${language} featuring:
1. Lagna & Atmakaraka Soul Blueprint: Exhaustive multi-paragraph analysis of the Ascendant sign, physical vitality, temperament, psychological profile, and core karmic life purpose.
2. Comprehensive 12 Bhava (House-by-House) Detailed Predictions:
   - Provide an individual, deeply detailed multi-paragraph evaluation for ALL 12 HOUSES (1 to 12).
   - In EVERY house analysis, detail BOTH positive strengths/fruits and negative challenges/friction points.
   - For every challenging placement, immediately integrate constructive insights and specific Vedic remedial countermeasures.
3. Navagraha Deep Interpretation: Assessment of all 9 Grahas (Sun through Ketu) in their respective signs and houses with dignity, aspects (Drishti), and functional indications.
4. Career and Business Direction (The Seeker's Practical Blueprint):
   Must contain clear structured subsections:
   ### Path and Suitability: What career fields, industries, or roles align best with this chart (e.g., job versus entrepreneurship/business).
   ### Timing and Transitions: Favorable planetary windows for a job switch, promotion, or starting a new business venture.
   ### Stagnation or Obstacles: What causes professional delays, workplace friction, or career plateaus, and how to navigate it.
5. Relationships and Marriage Blueprint (The Seeker's Practical Blueprint):
   Must contain clear structured subsections:
   ### Marriage Timing and Type: When marriage is indicated, and what the chart suggests regarding love versus arranged marriage.
   ### Compatibility and Partner Traits: The traits, background, and temperament of prospective spouse (7th house & D9 Navamsha).
   ### Conflict Resolution: Managing recurring communication or emotional patterns in relationships.
6. Finances, Wealth and Asset Growth (The Seeker's Practical Blueprint):
   Must contain clear structured subsections:
   ### Earning and Stability Periods: Planetary periods (dashas) favoring wealth accumulation versus conservative budgeting phases.
   ### Investments and Risk: Long-term asset creation, real estate/property purchases (4th house), and speculative/market risk (5th house).
   ### Financial Risk and Wealth Protection: Practical expenditure management and protecting assets.
7. Health, Vitality and Well-being (The Seeker's Practical Blueprint):
   Must contain clear structured subsections:
   ### Vulnerable Periods: Health concerns or physical zones requiring extra care during specific planetary transits.
   ### Ayurvedic Constitution: Bio-energetic balance (Vata / Pitta / Kapha) and physical stamina.
   ### Root Causes and Remedies: Dietary adjustments, traditional remedies, and daily mental-peace practices.
8. Life Purpose, Karmic Patterns and Major Milestones (The Seeker's Practical Blueprint):
   Must contain clear structured subsections:
   ### Self-Understanding and Karmic Lessons: Personal growth blueprint, inherited karma, and spiritual evolution.
   ### Major Life Milestones: Timelines regarding foreign travel/settlement, parenthood/children, and legal resolution.
9. Major Planetary Yogas, Doshas & Gochara Transits: Raja Yogas, Dhana Yogas, Gajakesari Yoga, Manglik / Kalsarp / Pitri Rin analysis with specific classical cancellations and uplifting mitigation remedies.
10. Vimshottari Mahadasha Lifelong Timeline Table (120-Year): Complete 9-Mahadasha table with exact years, plus detailed interpretation of active Mahadasha and Antardasha detailing both favorable boons and challenging test periods with targeted planetary remedies.
11. Shani Saadesati Exact Timeline: Exact start and end dates for all 3 phases (~2.5 years each) with real-time status and reassuring, protective remedial guidance.
12. Prescriptive Classical Vedic Remedies:
   Must contain clear structured subsections:
   ### Sacred Beej Mantras: Exact mantras and daily japa counts.
   ### Auspicious Gemstones: Gemstone, metal, finger, day, and ritual.
   ### Charitable Daan & Daily Rituals: Actions designed to mitigate heavy karmic debts.

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

    // Deterministically enforce authentic astronomical Sun, Moon, and Nakshatra anchors
    if (moonCalc) {
      parsed.moonSign = moonCalc.rashi.name;
      parsed.nakshatra = moonCalc.nakshatra.name;
      parsed.starLord = moonCalc.nakshatra.lord;
    }
    if (sunCalc) {
      parsed.sunSign = sunCalc.rashi.name;
    }

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
    const candSun = sunPos ? sunPos.sign : (sunCalc?.rashi?.name || parsed.sunSign);
    parsed.sunSign = getAuthenticSunSign(candSun, details.dob, details.tob);

    const moonPos = parsed.planetaryPositions.find(p => p.planet === 'Moon');
    const candMoon = moonPos ? moonPos.sign : (moonCalc?.rashi?.name || parsed.moonSign);
    parsed.moonSign = getAuthenticMoonSign(candMoon, parsed.nakshatra, details.dob, details.tob);

    return parsed;
  });

  StorageService.save(langKey, result, -1);
  return result;
  } catch (err: any) {
    console.warn("Gemini AI API unavailable, engaging authentic Vedic astronomical engine fallback:", err);
    const fallback = generateOfflineKundali(details, language, system, exactSaadesati, moonCalc, sunCalc);
    StorageService.save(langKey, fallback, 24);
    return fallback;
  }
};

const generateOfflineKundali = (
  details: BirthDetails,
  language: Language,
  system: KundaliSystem,
  exactSaadesati: any[],
  moonCalc: any,
  sunCalc?: any
): KundaliResponse => {
  const activeSunCalc = sunCalc || calculateSunDetails(details.dob, details.tob || '12:00');
  const activeMoonCalc = moonCalc || calculateMoonDetails(details.dob, details.tob || '12:00');

  const hour = parseInt((details.tob || '12:00').split(':')[0], 10) || 12;
  const minute = parseInt((details.tob || '12:00').split(':')[1], 10) || 0;
  const sunRashiIdx = activeSunCalc ? activeSunCalc.rashiIndex : 0;
  const hoursSinceSunrise = (hour + minute / 60 - 6 + 24) % 24;
  const lagnaSign = ((sunRashiIdx + Math.floor(hoursSinceSunrise / 2)) % 12) + 1;

  const moonSignName = activeMoonCalc?.rashi.name || 'Taurus';
  const moonSignLocalized = getLocalizedSign(moonSignName, language);
  const sunSignName = activeSunCalc?.rashi.name || 'Aries';
  const nakshatraName = activeMoonCalc?.nakshatra.name || 'Rohini';
  const starLord = getLocalizedPlanet(activeMoonCalc?.nakshatra.lord || 'Moon', language);
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

  const seekerPillars = getSeekerPillars(language);

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

  // 1. Career and Business Chapter
  const careerContent = language === 'English'
    ? `### ${seekerPillars.career.pathSuitabilityTitle}
The alignment of the 10th house of Karma with the 2nd (wealth) and 11th (gains) houses indicates exceptional suitability for strategic executive leadership, specialized administration, technological architecture, financial analysis, or independent consulting. Your chart reveals strong entrepreneurial acumen balanced with organizational discipline. If choosing employment, leadership roles with autonomous decision-making yield highest growth.

### ${seekerPillars.career.timingTransitionsTitle}
Favorable windows for major career advancement, promotions, or establishing new enterprise ventures occur during the operative sub-periods (Antardashas) of the 10th and 9th house lords, as well as during Jupiter's beneficial transits over the 10th house or natal Moon. Mid-career transitions between ages 28 and 36 trigger enduring elevation.

### ${seekerPillars.career.obstaclesTitle}
Periods of perceived workplace stagnation or delay typically align with Saturn transits across natal houses or minor Dasha friction. These phases are designed to build patience, refine master skills, and weed out inefficient processes. Refrain from impulsive career exits; channel energy into skill accreditation and team mentorship.
- ${locale.bhavaPillars.boonsTitle} Executive vision, strategic endurance, and lasting institutional respect.
- ${locale.bhavaPillars.cautionsTitle} Avoid taking solitary burdens without structured team accountability.
- ${locale.bhavaPillars.upayasTitle} Install a consecrated Shree Yantra in your professional space and practice Wednesday green grain charity.`
    : language === 'Marathi'
    ? `### ${seekerPillars.career.pathSuitabilityTitle}
दशम कर्म भाव आणि द्वितीय धन भावाचा परस्पर संबंध दर्शवतो की आपल्या कुंडलीत बौद्धिक, प्रशासकीय आणि धोरणात्मक कौशल्यांना मोठे प्राधान्य आहे. व्यवस्थापन, तंत्रज्ञान, वित्त, शिक्षण, सल्लागार किंवा स्वतंत्र व्यवसाय या क्षेत्रांमध्ये आपल्याला विशेष यश आणि सन्मान मिळेल. नोकरीत असल्यास स्वायत्त निर्णय घेण्याचे अधिकार असलेली पदे आपल्यासाठी सर्वोत्तम ठरतील.

### ${seekerPillars.career.timingTransitionsTitle}
पदोन्नती, नवीन नोकरीत बदल किंवा स्वतंत्र व्यवसाय सुरू करण्यासाठी दशमेश आणि नवमेशाच्या अंतर्दशांचा काळ अत्यंत शुभ आणि फलदायी ठरतो. तसेच गुरु ग्रहाचे शुभ गोचर आपल्या व्यावसायिक प्रगतीला मोठी गती देईल. वयाच्या २८ ते ३६ व्या वर्षातील कालखंड भाग्योदयाचा महत्त्वाचा टप्पा ठरेल.

### ${seekerPillars.career.obstaclesTitle}
कामाच्या ठिकाणी तात्पुरता विलंब किंवा तणाव जाणवल्यास तो शनीच्या गोचराचा किंवा आत्मपरीक्षणाचा काळ असतो. हा काळ कौशल्ये वाढवण्यासाठी आणि भविष्यातील मोठ्या यशाची पायाभरणी करण्यासाठी वापरावा. तडकाफडकी निर्णय घेणे टाळावे.
- ${locale.bhavaPillars.boonsTitle} व्यावसायिक नेतृत्व, कायमस्वरूपी संपत्ती निर्मिती आणि समाजात मान-सन्मान.
- ${locale.bhavaPillars.cautionsTitle} भागीदारी करताना किंवा करारांवर स्वाक्षरी करताना सर्व अटी नीट तपासून घ्याव्यात.
- ${locale.bhavaPillars.upayasTitle} कार्यस्थळी श्रीयंत्राची स्थापना करावी आणि बुधवारी हिरव्या मुगाचे दान करावे.`
    : `### ${seekerPillars.career.pathSuitabilityTitle}
दशम कर्म भाव एवं द्वितीय धन भाव का संबंध यह स्पष्ट करता है कि आपकी कुंडली में रणनीतिक नेतृत्व, प्रबंधन, वित्त, शिक्षण, परामर्श एवं तकनीकी उद्यम के प्रति असाधारण क्षमता है। नौकरी में स्वतंत्र निर्णय लेने वाले उच्च पद तथा स्वतंत्र व्यापार अथवा उद्यमशीलता दोनों में आपकी स्वाभाविक प्रगति के योग हैं।

### ${seekerPillars.career.timingTransitionsTitle}
पदोन्नति, कार्यक्षेत्र में अनुकूल बदलाव अथवा नए व्यापार की शुरुआत के लिए दशमेश व नवमेश की अंतर्दशाएं तथा बृहस्पति का शुभ गोचर स्वर्णिम अवसर प्रदान करते हैं। २८ से ३६ वर्ष की आयु के मध्य जीवन में स्थायी व्यावसायिक उत्थान प्राप्त होता है।

### ${seekerPillars.career.obstaclesTitle}
कार्यक्षेत्र में आने वाला तात्कालिक ठहराव अथवा मतभेद वास्तव में आंतरिक धैर्य और रणनीतिक परिपक्वता को तराशने के लिए आते हैं। उत्तेजना में आकर कोई भी निर्णय न लें; अपनी कार्यकुशलता और नेटवर्किंग को सुदृढ़ करें।
- ${locale.bhavaPillars.boonsTitle} व्यावसायिक नेतृत्व, स्थायी प्रतिष्ठा एवं दीर्घकालिक सफलता।
- ${locale.bhavaPillars.cautionsTitle} अनियोजित अनुबंधों में बिना पूर्ण समीक्षा के कोई जोखिम न उठाएं।
- ${locale.bhavaPillars.upayasTitle} कार्यस्थल पर श्रीयंत्र स्थापित करें तथा बुधवार को मूंग दाल का दान करें।`;

  // 2. Relationships and Marriage Chapter
  const relationshipsContent = language === 'English'
    ? `### ${seekerPillars.relationships.timingTypeTitle}
The 7th house and Venus aspects suggest that marriage timing is heavily activated during the primary Dasha or Antardasha of the 7th lord, or when transiting Jupiter casts an auspicious aspect on the natal 7th house or Moon. The chart exhibits strong mutual affinity indicators where shared intellectual values and emotional maturity form the cornerstone, harmonizing elements of both personal choice and traditional family blessings.

### ${seekerPillars.relationships.partnerTraitsTitle}
Your prospective spouse is characterized by dignity, intellectual discernment, emotional sensitivity, and strong ethical grounding. They are likely to possess creative inclinations, refined aesthetic sensibilities, and a supportive, encouraging disposition toward your career ambitions.

### ${seekerPillars.relationships.conflictResolutionTitle}
Recurring communication frictions or expectations during intense transits can be easily resolved through mindful listening, transparent emotional check-ins, and avoiding pride-driven debates. Nurturing shared spiritual or travel rituals reinforces domestic serenity.
- ${locale.bhavaPillars.boonsTitle} Devoted soul connection, mutual intellectual respect, and domestic warmth.
- ${locale.bhavaPillars.cautionsTitle} Avoid bringing professional stress into personal family conversations.
- ${locale.bhavaPillars.upayasTitle} Offer sweet white rice preparation (Kheer) on Fridays and share with loved ones.`
    : language === 'Marathi'
    ? `### ${seekerPillars.relationships.timingTypeTitle}
सप्तम भाव आणि शुक्राची स्थिती दर्शवते की विवाहाचा शुभ योग सप्तमेशाच्या किंवा गुरुच्या अनुकूल गोचर काळात सक्रिय होतो. कुंडलीत परस्पर वैचारिक सामंजस्य आणि कौटुंबिक आशीर्वादांचा सुंदर मिलाफ दिसून येतो. जोडीदाराची निवड करताना वैचारिक सुसंगतता अत्यंत महत्त्वाची ठरेल.

### ${seekerPillars.relationships.partnerTraitsTitle}
आपल्या जोडीदाराचे व्यक्तिमत्त्व सुसंस्कृत, संवेदनशील, समजूतदार आणि स्वाभिमानी असेल. ते आपल्या कार्यक्षेत्राला समजून घेणारे, कौटुंबिक मूल्यांना जपणारे आणि संकटाच्या वेळी खंबीर साथ देणारे असतील.

### ${seekerPillars.relationships.conflictResolutionTitle}
नातेसंबंधात कधीही गैरसमज किंवा संवादहीनता निर्माण होऊ देऊ नका. नियमित खुला संवाद आणि एकमेकांच्या मतांचा आदर केल्याने नात्यातील गोडवा आणि जवळीक वृद्धिंगत होईल.
- ${locale.bhavaPillars.boonsTitle} सुखी गृहस्थ जीवन, कौटुंबिक ऐक्य आणि निरंतर परस्पर सहकार्य.
- ${locale.bhavaPillars.cautionsTitle} बाहेरच्या तणावाचा प्रभाव घरगुती संवादावर पडू देऊ नये.
- ${locale.bhavaPillars.upayasTitle} दर शुक्रवारी देवी लक्ष्मीची उपासना करावी आणि पांढऱ्या वस्तूंचे दान करावे.`
    : `### ${seekerPillars.relationships.timingTypeTitle}
सप्तम भाव तथा शुक्र की शुभ स्थिति इंगित करती है कि विवाह के अनुकूल योग सप्तमेश की दशा अथवा देवगुरु बृहस्पति के शुभ गोचर में बनते हैं। कुंडली में बौद्धिक सामंजस्य और पारिवारिक सौहार्द के साथ परिपक्व निर्णय लेने की प्रवृत्ति स्पष्ट है।

### ${seekerPillars.relationships.partnerTraitsTitle}
जीवनसाथी का व्यक्तित्व मर्यादित, बौद्धिक, संवेदनशील एवं उच्च नैतिक मूल्यों से संपन्न होगा। वे आपकी महत्वाकांक्षाओं का सम्मान करेंगे तथा पारिवारिक व सामाजिक प्रतिष्ठा को बढ़ाने में सहयोगी सिद्ध होंगे।

### ${seekerPillars.relationships.conflictResolutionTitle}
पारस्परिक संवाद में अहम् के टकराव से बचें। किसी भी मतभेद की स्थिति में शांत मन से वार्तालाप करने से संबंध सदैव प्रगाढ़ और माधुर्यपूर्ण बने रहते हैं।
- ${locale.bhavaPillars.boonsTitle} निष्ठावान जीवनसाथी, गृहस्थ सुख एवं पारिवारिक प्रतिष्ठा में वृद्धि।
- ${locale.bhavaPillars.cautionsTitle} कार्यक्षेत्र के मानसिक तनाव को निजी जीवन पर हावी न होने दें।
- ${locale.bhavaPillars.upayasTitle} शुक्रवार को देवी लक्ष्मी की पूजा करें तथा खीर का भोग लगाकर परिवार में बांटें।`;

  // 3. Finances and Wealth Chapter
  const financesContent = language === 'English'
    ? `### ${seekerPillars.finances.earningPeriodsTitle}
Wealth accumulation is governed by the Dhana (2nd) and Labha (11th) houses. Peak financial expansion occurs during the planetary cycles of friendly benefics, particularly Jupiter and Mercury. These phases reward strategic investments, business dividends, and executive compensation leaps.

### ${seekerPillars.finances.investmentsRiskTitle}
The 4th house and Mars/Venus alignments provide strong auspicious indications for long-term real estate, residential property acquisitions, and land holdings. Diversification into reliable long-term instruments is favored over hasty speculative day-trading. Real estate acquired after age 30 yields magnificent generational appreciation.

### ${seekerPillars.finances.wealthProtectionTitle}
The 12th house indicates occasional sudden expenditure leakages on luxury upgrades or unplanned obligations. Instituting automated monthly savings and maintaining liquid emergency reserves fully safeguards your financial empire against transit shocks.
- ${locale.bhavaPillars.boonsTitle} Sustained financial growth, multiple income channels, and asset security.
- ${locale.bhavaPillars.cautionsTitle} Refrain from signing financial guarantees or lending money without formal security.
- ${locale.bhavaPillars.upayasTitle} Donate yellow pulses on Thursdays and maintain a clean north-east zone in your home.`
    : language === 'Marathi'
    ? `### ${seekerPillars.finances.earningPeriodsTitle}
द्वितीय धन भाव आणि एकादश लाभ भावाच्या बलानुसार आपल्या जीवनात उत्पन्नाचे एकापेक्षा जास्त स्रोत निर्माण होण्याचे उत्तम योग आहेत. गुरु आणि बुध यांच्या शुभ दशाकाळात धनसंचय आणि आर्थिक भरभराट वेगाने होते.

### ${seekerPillars.finances.investmentsRiskTitle}
चतुर्थ भाव आणि मंगळाची स्थिती दर्शवते की स्थावर संपत्ती, स्वतःचे घर आणि जमीन खरेदीसाठी कुंडली अत्यंत अनुकूल आहे. तात्पुरत्या फायद्याच्या सट्टेबाजीपेक्षा दीर्घकालीन आणि सुरक्षित गुंतवणुकीला प्राधान्य द्यावे. वयाच्या ३० नंतर केलेली स्थावर गुंतवणूक उत्तम परतावा देईल.

### ${seekerPillars.finances.wealthProtectionTitle}
व्यय भावावर असणाऱ्या ग्रहांच्या प्रभावामुळे अचानक होणारे अनावश्यक खर्च टाळण्यासाठी मासिक बजेट आणि नियमित बचतीची सवय ठेवावी. कोणालाही उसने पैसे देताना योग्य खबरदारी घ्यावी.
- ${locale.bhavaPillars.boonsTitle} अखंड धनप्रवाह, स्वतःच्या घराचे स्वप्न साकार आणि आर्थिक स्थैर्य.
- ${locale.bhavaPillars.cautionsTitle} घाईघाईत किंवा कोणाच्या सांगण्यावरून धोकादायक आर्थिक निर्णय घेऊ नयेत.
- ${locale.bhavaPillars.upayasTitle} गुरुवारी हरभरा डाळीचे दान करावे आणि ईशान्य कोपरा स्वच्छ व पवित्र ठेवावा.`
    : `### ${seekerPillars.finances.earningPeriodsTitle}
द्वितीय एवं एकादश भाव की स्थिति दर्शाती है कि जीवन में धन संचय एवं एकाधिक स्रोतों से नियमित आय के मजबूत योग हैं। बृहस्पति एवं बुध की शुभ दशाओं में वित्तीय समृद्धि और व्यापारिक मुनाफे में तीव्र वृद्धि होती है।

### ${seekerPillars.finances.investmentsRiskTitle}
चतुर्थ भाव एवं मंगल-शुक्र के प्रभाव से भूमि, भवन एवं अचल संपत्ति का निर्माण अत्यंत मंगलकारी रहेगा। शेयर बाजार या सट्टेबाजी में अत्यधिक जोखिम उठाने की बजाय दीर्घकालिक व स्थिर संपत्तियों में निवेश सर्वोत्तम रहेगा।

### ${seekerPillars.finances.wealthProtectionTitle}
द्वादश भाव के प्रभाव से अप्रत्याशित खर्चों की संभावना रहती है। इसके निवारण हेतु सुनियोजित बजट बनाएं और अनावश्यक दिखावे से बचें।
- ${locale.bhavaPillars.boonsTitle} स्थायी धन संचय, भूमि-भवन का सुख एवं सुदृढ़ आर्थिक आधार।
- ${locale.bhavaPillars.cautionsTitle} बिना लिखित अनुबंध के किसी को ऋण न दें और वित्तीय गारंटी से बचें।
- ${locale.bhavaPillars.upayasTitle} गुरुवार को चने की दाल या बेसन का दान करें तथा घर का ईशान कोण स्वच्छ रखें।`;

  // 4. Health and Well-being Chapter
  const healthContent = language === 'English'
    ? `### ${seekerPillars.health.vulnerablePeriodsTitle}
Planetary configurations highlight the nervous system, digestive fire, and upper respiratory tract as sensitive somatic zones requiring conscious care. Seasonal weather transitions and stressful work sprints require extra hydration and restorative rest to prevent physical fatigue.

### ${seekerPillars.health.ayurvedaTitle}
Your natural bio-energetic constitution is anchored in a predominant Vata-Pitta disposition. Vata grants agile mental cognition and rapid ideation, while Pitta supplies metabolic drive. When balanced, this constitution confers vibrant vitality and swift healing.

### ${seekerPillars.health.lifestyleRemediesTitle}
Incorporate warm, cooked, grounding meals, minimize late-night screen time, and adopt morning breathing exercises (Anulom-Vilom and Surya Namaskar). Drinking water stored overnight in a copper vessel harmonizes cellular vitality.
- ${locale.bhavaPillars.boonsTitle} High physical resilience, quick natural recuperation, and mental agility.
- ${locale.bhavaPillars.cautionsTitle} Avoid irregular meal timings and excessive caffeine during workload peaks.
- ${locale.bhavaPillars.upayasTitle} Practice daily 15-minute meditation and Surya Namaskar at sunrise.`
    : language === 'Marathi'
    ? `### ${seekerPillars.health.vulnerablePeriodsTitle}
कुंडलीतील लग्न व षष्ठ भावानुसार पचनसंस्था, डोके व मानेचे स्नायू आणि मज्जासंस्था हे संवेदनशील अवयव आहेत. कामाचा अतिताण आणि अपुरी झोप यांमुळे शारीरिक थकवा जाणवू शकतो; यासाठी नियमित विश्रांती आवश्यक आहे.

### ${seekerPillars.health.ayurvedaTitle}
आपली नैसर्गिक प्रकृती वात-पित्त प्रधान आहे. वात दोषाने आपल्याला तीक्ष्ण विचारशक्ती दिली आहे आणि पित्त दोषाने उत्साह दिला आहे. या दोन्ही दोषांचे संतुलन राहिल्यास शरीर निरोगी आणि उत्साही राहते.

### ${seekerPillars.health.lifestyleRemediesTitle}
वेळेवर पौष्टिक जेवण, तेलकट पदार्थांवर नियंत्रण आणि सकाळी प्राणायाम केल्यास आरोग्य उत्तम राहील. तांब्याच्या भांड्यातील पाणी पिणे शरीरासाठी अत्यंत गुणकारी ठरेल.
- ${locale.bhavaPillars.boonsTitle} चांगली रोगप्रतिकारशक्ती आणि आजारातून जलद बरे होण्याची क्षमता.
- ${locale.bhavaPillars.cautionsTitle} जेवणाच्या वेळा अनियमित ठेवू नयेत आणि रात्री जागरण टाळावे.
- ${locale.bhavaPillars.upayasTitle} रोज सकाळी सूर्यनमस्कार आणि ॐ चा जप करावा.`
    : `### ${seekerPillars.health.vulnerablePeriodsTitle}
लग्न एवं षष्ठ भाव की स्थिति के अनुसार पाचन तंत्र, स्नायु तंत्र एवं सिर-नेत्र क्षेत्र अधिक संवेदनशील हैं। अत्यधिक मानसिक भागदौड़ और अनियमित दिनचर्या से शारीरिक ऊर्जा का क्षय हो सकता है।

### ${seekerPillars.health.ayurvedaTitle}
आपकी शारीरिक प्रकृति वात-पित्त प्रधान है। वात मानसिक गतिशीलता और पित्त तेजस्विता प्रदान करता है। इनका उचित संतुलन आपको दीर्घायु और निरोगी जीवन प्रदान करता है।

### ${seekerPillars.health.lifestyleRemediesTitle}
सात्विक व सुपाच्य भोजन ग्रहण करें, रात्रि जागरण से बचें तथा प्रातःकाल अनुलोम-विलोम प्राणायाम का अभ्यास करें। तांबे के पात्र में रखा जल पीना अत्यंत लाभकारी है।
- ${locale.bhavaPillars.boonsTitle} सुदृढ़ रोग प्रतिरोधक क्षमता एवं स्वाभाविक जीवन शक्ति।
- ${locale.bhavaPillars.cautionsTitle} अत्यधिक गरिष्ठ भोजन तथा क्रोध व मानसिक तनाव से बचें।
- ${locale.bhavaPillars.upayasTitle} नित्य सूर्य देव को जल अर्पित करें तथा गायत्री मंत्र का जप करें।`;

  // 5. Life Purpose and Major Milestones Chapter
  const lifePurposeContent = language === 'English'
    ? `### ${seekerPillars.lifePurpose.soulMissionTitle}
Your Atmakaraka and Lagna configuration reveal that your soul's supreme incarnation goal is mastering compassionate leadership, ethical self-reliance, and uplifting your family lineage. Transforming past-life karmic anxieties into steady wisdom is your highest dharma.

### ${seekerPillars.lifePurpose.foreignTravelTitle}
The 9th (long journeys) and 12th (foreign lands) houses show auspicious indications for foreign travel, higher learning abroad, cross-cultural collaborations, or temporary overseas relocation during major planetary periods. These journeys accelerate professional prestige.

### ${seekerPillars.lifePurpose.milestonesTitle}
The 5th house of progeny and Purva Punya (past meritorious deeds) confirms auspicious generational fulfillment, noble and accomplished children, and successful resolution of legal disputes or administrative challenges through truth and patience.
- ${locale.bhavaPillars.boonsTitle} Spiritual clarity, noble generational lineage, and global perspective.
- ${locale.bhavaPillars.cautionsTitle} Guard against cynicism during temporary karmic testing cycles.
- ${locale.bhavaPillars.upayasTitle} Support orphaned children's education and plant a peepal or banyan sapling.`
    : language === 'Marathi'
    ? `### ${seekerPillars.lifePurpose.soulMissionTitle}
आपल्या आत्मकारकाची स्थिती दर्शवते की या जन्मात आपले मुख्य ध्येय स्वावलंबन, नैतिक नेतृत्व आणि समाजाला विधायक दिशा देणे हे आहे. भूतकाळातील कर्मांचे सोने करून जीवनात आध्यात्मिक आणि व्यावहारिक संतुलन साधणे हा आपला खरा धर्म आहे.

### ${seekerPillars.lifePurpose.foreignTravelTitle}
नवम आणि द्वादश भावाच्या शुभ योगामुळे परदेश प्रवास, दूरचे तीर्थाटन आणि आंतरराष्ट्रीय संबंधांतून प्रगतीचे उत्तम योग आहेत. दूरच्या प्रवासाने आपल्या ज्ञानात आणि अनुभवात मोठी भर पडेल.

### ${seekerPillars.lifePurpose.milestonesTitle}
पंचम भावातील शुभ प्रभावामुळे सुसंस्कृत व हुशार संतान लाभेल. कायदेशीर बाबी किंवा जुने वाद असतील तर ते संयम आणि नैतिकतेने आपल्या बाजूने सुटतील.
- ${locale.bhavaPillars.boonsTitle} उच्च आध्यात्मिक प्रगती, उत्कृष्ट कौटुंबिक वारसा आणि व्यापक दृष्टी.
- ${locale.bhavaPillars.cautionsTitle} संकटाच्या वेळी निराश न होता धैर्याने पुढे जात राहावे.
- ${locale.bhavaPillars.upayasTitle} गरजू विद्यार्थ्यांच्या शिक्षणासाठी मदत करावी आणि पिंपळाच्या झाडाची सेवा करावी.`
    : `### ${seekerPillars.lifePurpose.soulMissionTitle}
आत्मकारक ग्रह की स्थिति यह दर्शाती है कि आपकी आत्मा का मुख्य उद्देश्य नैतिक नेतृत्व, आत्मिक जागरण तथा कुल की प्रतिष्ठा को नई ऊंचाइयों पर ले जाना है। पूर्वजन्म के संचित पुण्यों को लोककल्याण में लगाना आपका धर्म है।

### ${seekerPillars.lifePurpose.foreignTravelTitle}
नवम एवं द्वादश भाव के योग से विदेश यात्रा, दूरस्थ स्थानों पर कार्य तथा अंतरराष्ट्रीय संपर्कों से लाभ के प्रबल योग बनते हैं। ये यात्राएं आपके भाग्य को जागृत करेंगी।

### ${seekerPillars.lifePurpose.milestonesTitle}
पंचम भाव के प्रभाव से सुयोग्य, संस्कारी एवं प्रतिभाशाली संतान का सुख प्राप्त होगा। कानूनी व प्रशासनिक विवादों में सत्य और धैर्य से विजय प्राप्त होगी।
- ${locale.bhavaPillars.boonsTitle} आत्मिक विकास, उज्ज्वल कुल परंपरा एवं वैश्विक ख्याति।
- ${locale.bhavaPillars.cautionsTitle} अस्थायी असफलताओं से विचलित हुए बिना अपने कर्तव्य पथ पर अग्रसर रहें।
- ${locale.bhavaPillars.upayasTitle} निर्धन बच्चों की शिक्षा में सहायता करें तथा पीपल वृक्ष की सेवा करें।`;

  // 6. Prescriptive Classical Vedic Remedies Chapter
  const remediesContent = language === 'English'
    ? `### ${seekerPillars.remedies.mantrasTitle}
- Maha Mrityunjaya Mantra: Chant 108 times at dawn for health, mental clarity, and energetic shielding.
- Gayatri Mantra: Chant 24 or 108 times facing East at sunrise for cognitive illumination and administrative power.
- Navagraha Shanti: Recite Om Namo Bhagavate Vasudevaya daily for all-round peace and planetary harmony.

### ${seekerPillars.remedies.gemstonesTitle}
- Primary Auspicious Gem: Natural Yellow Sapphire (Pukhraj) or Red Coral (Moonga) set in auspicious metal, energized on an auspicious weekday morning.
- Sacred Metal: Wear gold or pure copper to ground planetary frequencies.

### ${seekerPillars.remedies.charityTitle}
- Saturday Compassion: Feed stray animals and donate black sesame or warm clothes to the underprivileged.
- Thursday Wisdom Seva: Offer bananas or yellow flowers to holy sanctuaries and support education for students in need.`
    : language === 'Marathi'
    ? `### ${seekerPillars.remedies.mantrasTitle}
- महामृत्युंजय मंत्र: दररोज सकाळी १०८ वेळा जप करावा; यामुळे आरोग्य, मानसिक शांती आणि नकारात्मकतेपासून संरक्षण मिळते.
- गायत्री मंत्र: सूर्योदयाच्या वेळी पूर्वाभिमुख बसून २४ किंवा १०८ वेळा जप करावा.
- मूल वैदिक मंत्र: ॐ नमो भगवते वासुदेवाय या मंत्राचा नियमित जप सर्व ग्रहांची अनुकूलता प्रदान करतो.

### ${seekerPillars.remedies.gemstonesTitle}
- भाग्यवान रत्न: योग्य ज्योतिषी सल्ल्याने भाग्योदयासाठी पुखराज किंवा पोवळे योग्य धातूत (सोने किंवा तांबे) धारण करावे.
- शुभ धातू: शरीरात सकारात्मक ऊर्जा टिकवण्यासाठी तांब्याचे कडे किंवा सोन्याची अंगठी अनुकूल ठरते.

### ${seekerPillars.remedies.charityTitle}
- शनिवार सेवा: गरजूंना अन्नदान करावे आणि मुक्या प्राण्यांना अन्न द्यावे.
- गुरुवार सेवा: गुरुवारी गरजू विद्यार्थ्यांना वह्या-पुस्तके दान करावीत आणि गोसेवा करावी.`
    : `### ${seekerPillars.remedies.mantrasTitle}
- महामृत्युंजय मंत्र: नित्य प्रातः १०८ बार जप करें; इससे आरोग्य, दीर्घायु एवं ग्रह बाधाओं से पूर्ण रक्षा होती है।
- गायत्री मंत्र: सूर्योदय के समय पूर्व दिशा की ओर मुख करके २४ अथवा १०८ बार जप करें।
- मूल वैदिक मंत्र: ॐ नमो भगवते वासुदेवाय का नित्य जप संपूर्ण ग्रह दोषों का शमन करता है।

### ${seekerPillars.remedies.gemstonesTitle}
- शुभ रत्न: योग्य ज्योतिषी परामर्श से पुखराज अथवा मूंगा शुभ मुहूर्त में प्राण-प्रतिष्ठा करके धारण करें।
- अनुकूल धातु: स्वर्ण अथवा शुद्ध तांबे की अंगूठी/कड़ा धारण करना ग्रह ऊर्जा को संतुलित करता है।

### ${seekerPillars.remedies.charityTitle}
- शनिवार दान: निर्धनों को भोजन, काले तिल अथवा ऊनी वस्त्रों का दान करें और श्वान की सेवा करें।
- गुरुवार सेवा: विद्यार्थियों को पठन सामग्री भेंट करें तथा गौमाता को गुड़-रोटी खिलाएं।`;

  const report = `# ${locale.chapterLabels.ch1Part1Title}
${introParagraphs[language] || introParagraphs.English}

## ${locale.footers.bhavaFooter}
${bhavaSections}

## ${seekerPillars.career.title}
${careerContent}

## ${seekerPillars.relationships.title}
${relationshipsContent}

## ${seekerPillars.finances.title}
${financesContent}

## ${seekerPillars.health.title}
${healthContent}

## ${seekerPillars.lifePurpose.title}
${lifePurposeContent}

## ${seekerPillars.remedies.title}
${remediesContent}`;

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
  const sunSignStr = getAuthenticSunSign(sunPos ? sunPos.sign : sunSignName, details.dob, details.tob);
  const moonPos = planetaryPositions.find(p => p.planet === 'Moon');
  const finalMoonSign = getAuthenticMoonSign(moonPos ? moonPos.sign : moonSignName, nakshatraName, details.dob, details.tob);


  return {
    report,
    chart,
    lagnaSign,
    starLord,
    subLord,
    nakshatra: nakshatraName,
    moonSign: finalMoonSign,
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
