import { GoogleGenAI } from "@google/genai";
import { BirthDetails, MatchmakingDetails, Timeframe, Language, ChatMessage, KundaliResponse } from "../types";
import { StorageService } from "./storageService";

// ---------------------------------------------------------------------------
// CONFIG — Active Gemini Models & Multi-Key Rotation
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
// TRANSLATION
// Translates text into target language while preserving Vedic/Sanskrit nouns.
// Uses compact system prompt to minimise tokens.
// ---------------------------------------------------------------------------
const TRANSLATION_SYSTEM = (lang: Language) =>
  `Translate the following text into ${lang}. Rules:
1. Return ONLY the translated text — no preamble or commentary.
2. Preserve ALL markdown formatting (**, ###, -, tables, etc.).
3. Keep these terms untranslated: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu, all Nakshatra names, all Rashi names, Vimshottari, Mahadasha, Antardasha, Lagna, Ascendant, Ayanamsha, Lahiri.`;

const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (targetLanguage === "English" || !text) return text;
  try {
    const translated = await callAI(TRANSLATION_SYSTEM(targetLanguage), text);
    return translated.trim() || text;
  } catch (err) {
    console.error("Translation failed", err);
    return text; // graceful degradation — return English rather than crashing
  }
};

// ---------------------------------------------------------------------------
// GEOCODING (OpenStreetMap — no AI key needed, unchanged)
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
// Strategy: Generate canonical English base once → cache → translate on demand
// ---------------------------------------------------------------------------
export const getHoroscope = async (sign: string, timeframe: Timeframe, language: Language = "English") => {
  const ttl = timeframe === "daily" ? 12 : 168;

  // 1. Check translated cache
  const langKey = StorageService.getKeys.horoscope(sign, timeframe, language);
  const cachedTranslation = StorageService.get<any>(langKey);
  if (cachedTranslation) return cachedTranslation;

  // 2. Check English base cache
  const baseKey = StorageService.getKeys.horoscopeBase(sign, timeframe);
  let englishBase = StorageService.get<any>(baseKey);

  // 3. Generate English base if missing
  if (!englishBase) {
    englishBase = await withRetry(async () => {
      const text = await callAI(
        `You are a Master Vedic Astrologer (Parashari system, Lahiri Ayanamsha). Current date: ${getCurrentDate()}.
Provide a ${timeframe} horoscope for Moon Sign / Rashi: ${sign}.
Analyze precise sidereal planetary transits (Career, Health, Relationships, Finance) using classical Vedic principles.
DO NOT use toxic positivity — provide harsh truths when planetary math dictates it. Respond in English only.`,
        `Return a valid JSON object (no markdown code fences):
{
  "overview": "string",
  "career": "string",
  "health": "string",
  "relationships": "string",
  "finance": "string",
  "spirituality": "string",
  "luckyColor": "string",
  "luckyNumber": "string"
}`,
        true // jsonMode
      );
      return parseAIResponse(text);
    });

    StorageService.save(baseKey, englishBase, ttl);
  }

  // 4. If English requested, we're done
  if (language === "English") {
    StorageService.save(langKey, englishBase, ttl);
    return englishBase;
  }

  // 5. Translate from canonical English base
  const translated = { ...englishBase };
  for (const key of Object.keys(translated)) {
    if (typeof translated[key] === "string") {
      translated[key] = await translateText(translated[key], language);
    }
  }

  StorageService.save(langKey, translated, ttl);
  return translated;
};

// ---------------------------------------------------------------------------
// KUNDALI
// ---------------------------------------------------------------------------
export const getKundaliAnalysis = async (details: BirthDetails, language: Language): Promise<KundaliResponse> => {
  // 1. Check translated cache
  const langKey = StorageService.getKeys.kundali(details.name, details.dob, language);
  const cachedTranslation = StorageService.get<KundaliResponse>(langKey);
  if (cachedTranslation) return cachedTranslation;

  // 2. Check English base cache
  const baseKey = StorageService.getKeys.kundaliBase(details.name, details.dob);
  let englishBase = StorageService.get<KundaliResponse>(baseKey);

  // 3. Generate English base if missing
  if (!englishBase) {
    englishBase = await withRetry(async () => {
      const text = await callAI(
        `You are a professional Vedic astrologer (Parashari system, Lahiri Ayanamsha). Current Date: ${getCurrentDate()}.
This is a high-precision Janma Kundali analysis. DO NOT use toxic positivity — provide truthful predictions and harsh realities when planetary math demands it. Respond in English only.`,
        `Generate a complete Vedic Janma Kundali for:
Name: ${details.name}
DOB: ${details.dob}
TOB: ${details.tob}
Place: ${details.location}

Include:
1. Lagna, Moon Sign, Nakshatra, Pada, Nakshatra Lord
2. Sidereal Planetary Positions Table (degrees, Rashi, Nakshatra, Lord, Dispositor)
3. 12 Bhava (House) Analysis
4. Vimshottari Dasha/Antardasha Timeline
5. Shani Saadesati Analysis
6. Vedic Remedies & Gemstones

Return ONLY a valid JSON object (no markdown code fences):
{
  "report": "Professional Markdown string with bold headers and tables. Include Saadesati analysis.",
  "chart": { "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [], "10": [], "11": [], "12": [] },
  "lagnaSign": 1,
  "starLord": "string",
  "subLord": "string",
  "nakshatra": "string",
  "moonSign": "string"
}
Chart keys must be "1" through "12" with planet name arrays. lagnaSign is 1-12.`,
        true // jsonMode
      );
      return parseAIResponse(text) as KundaliResponse;
    });

    StorageService.save(baseKey, englishBase, -1);
  }

  // 4. If English, return directly
  if (language === "English") {
    StorageService.save(langKey, englishBase, -1);
    return englishBase;
  }

  // 5. Translate from canonical English base
  const translated: KundaliResponse = { ...englishBase };
  if (translated.report) translated.report = await translateText(translated.report, language);
  if (translated.starLord) translated.starLord = await translateText(translated.starLord, language);
  if (translated.subLord) translated.subLord = await translateText(translated.subLord, language);
  if (translated.nakshatra) translated.nakshatra = await translateText(translated.nakshatra, language);
  if (translated.moonSign) translated.moonSign = await translateText(translated.moonSign, language);

  StorageService.save(langKey, translated, -1);
  return translated;
};

// ---------------------------------------------------------------------------
// KUNDALI CHAT
// ---------------------------------------------------------------------------
export const askKundaliQuestion = async (
  q: string,
  context: string,
  history: ChatMessage[],
  lang: Language
) => {
  return await withRetry(async () => {
    const systemPrompt = `You are the user's personal Vedic Astrology Guide (Parashari system, Lahiri Ayanamsha).
Kundali context: ${context}. Current Date: ${getCurrentDate()}.
Provide life guidance based on authentic Vedic astrology. DO NOT use toxic positivity — give harsh truths when planetary math demands it. Respond in English only.`;

    const result = await callAIChat(systemPrompt, history, q);
    return await translateText(result, lang);
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
    const systemPrompt = `You are a Master Vedic Numerologist. Answer questions based on: ${context}. Respond in English only.`;

    const result = await callAIChat(systemPrompt, history, q);
    return await translateText(result, lang);
  });
};

// ---------------------------------------------------------------------------
// MATCHMAKING
// Strategy: Generate canonical English base once → cache → translate on demand
// ---------------------------------------------------------------------------
export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  // 1. Check translated cache
  const langKey = StorageService.getKeys.match(details.boy.name, details.girl.name, language);
  const cachedTranslation = StorageService.get<string>(langKey);
  if (cachedTranslation) return cachedTranslation;

  // 2. Check English base
  const baseKey = StorageService.getKeys.matchBase(details.boy.name, details.girl.name);
  let englishBase = StorageService.get<string>(baseKey);

  // 3. Generate English base if missing
  if (!englishBase) {
    englishBase = await withRetry(async () => {
      return await callAI(
        `You are a master Vedic astrology matchmaking expert (Parashari, Lahiri Ayanamsha). DO NOT use toxic positivity — provide strict warnings and genuine risk factors. Respond in English only.`,
        `Vedic Kundali Milan (Compatibility) for ${details.boy.name} & ${details.girl.name}.
Perform classical Ashtakoot Gun Milan (36-point), plus:
- Mangal Dosha analysis for both parties
- Navamsa chart compatibility
- 7th house lord analysis
- Venus and Jupiter placement compatibility
- Dasha period overlaps for marriage timing
Return as professional Markdown.`
      );
    });

    StorageService.save(baseKey, englishBase, -1);
  }

  // 4. Translate if needed
  const result = await translateText(englishBase, language);
  StorageService.save(langKey, result, -1);
  return result;
};

// ---------------------------------------------------------------------------
// NUMEROLOGY ANALYSIS
// Strategy: Generate canonical English base once → cache → translate on demand
// ---------------------------------------------------------------------------
export const getNumerologyAnalysis = async (dob: string, m: number, b: number, loshu: any, lang: Language) => {
  // 1. Check translated cache
  const langKey = StorageService.getKeys.numerology(dob, lang);
  const cachedTranslation = StorageService.get<string>(langKey);
  if (cachedTranslation) return cachedTranslation;

  // 2. Check English base
  const baseKey = StorageService.getKeys.numerologyBase(dob);
  let englishBase = StorageService.get<string>(baseKey);

  // 3. Generate English base if missing
  if (!englishBase) {
    englishBase = await withRetry(async () => {
      return await callAI(
        `You are a Master Vedic Numerologist. Provide detailed, accurate analysis. Respond in English only.`,
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
Return as structured Markdown.`
      );
    });

    StorageService.save(baseKey, englishBase, -1);
  }

  // 4. Translate if needed
  const result = await translateText(englishBase, lang);
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
Write the ENTIRE response in English.`;

    const result = await callAIVision(textPrompt, image);
    return await translateText(result, lang);
  });
};
