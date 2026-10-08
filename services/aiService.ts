import { GoogleGenAI } from "@google/genai";
import { BirthDetails, MatchmakingDetails, Timeframe, Language, ChatMessage, KundaliResponse } from "../types";
import { StorageService } from "./storageService";

// ---------------------------------------------------------------------------
// ✅ DUAL-PROVIDER CONFIG
// Primary:  Gemini Flash 2.0  (Google AI — 1,000,000 tokens/day FREE)
// Fallback: OpenRouter        (google/gemma-4-31b-it:free — ~200 req/day)
// ---------------------------------------------------------------------------
const GEMINI_MODEL       = "gemini-2.0-flash";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL   = "google/gemma-4-31b-it:free";

const PLACEHOLDER_KEY = "sk-or-paste-your-key-here";
const getOpenRouterKey = () => {
  const key = process.env.OPENROUTER_API_KEY || "";
  return key === PLACEHOLDER_KEY ? "" : key;
};
const getGeminiKey = () => process.env.API_KEY || "";

// Chat-history trimming — cap at 10 messages (5 user+assistant pairs)
const MAX_HISTORY_MESSAGES = 10;

const getCurrentDate = () => {
  const now = new Date();
  return `${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} ${now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

// ---------------------------------------------------------------------------
// PRIMARY: Gemini Flash 2.0
// ---------------------------------------------------------------------------
interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
}

const callGemini = async (
  messages: GeminiMessage[],
  opts: { jsonMode?: boolean } = {}
): Promise<string> => {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new Error("GEMINI_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  const history = messages.slice(0, -1);
  const lastMsg = messages[messages.length - 1];

  const chat = ai.chats.create({ model: GEMINI_MODEL, history } as any);
  const response = await chat.sendMessage({ message: lastMsg.parts as any });

  let text = response.text ?? "";
  if (!text) throw new Error("Empty response from Gemini.");
  // Strip markdown code fences Gemini sometimes adds around JSON
  if (opts.jsonMode) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return text;
};

// ---------------------------------------------------------------------------
// FALLBACK: OpenRouter
// ---------------------------------------------------------------------------
interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
}

const callOpenRouter = async (
  messages: OpenRouterMessage[],
  opts: { jsonMode?: boolean; model?: string } = {}
): Promise<string> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error(
      "OpenRouter API key is missing. Please add OPENROUTER_API_KEY=sk-or-... to your .env file. Get a free key at https://openrouter.ai/"
    );
  }

  const model = opts.model || OPENROUTER_MODEL;
  const body: any = { model, messages };
  if (opts.jsonMode) body.response_format = { type: "json_object" };

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://whatmystarssays.app",
      "X-Title": "What My Stars Says",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 401) throw new Error("Invalid or missing OpenRouter API key.");
    if (response.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  if (!text) throw new Error("Empty response from OpenRouter.");
  return text;
};

// ---------------------------------------------------------------------------
// UNIFIED AI CALL  (Gemini primary → OpenRouter fallback)
// ---------------------------------------------------------------------------
const isQuotaError = (err: any) =>
  err?.message === "GEMINI_KEY_MISSING" ||
  String(err).includes("quota") ||
  String(err).includes("429") ||
  String(err).includes("RESOURCE_EXHAUSTED");

/** Text-only request */
const callAI = async (systemPrompt: string, userPrompt: string, jsonMode = false): Promise<string> => {
  try {
    const messages: GeminiMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: "user",  parts: [{ text: systemPrompt }] });
      messages.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions precisely." }] });
    }
    messages.push({ role: "user", parts: [{ text: userPrompt }] });
    return await callGemini(messages, { jsonMode });
  } catch (err: any) {
    if (!isQuotaError(err)) throw err;
    console.warn("Gemini unavailable, falling back to OpenRouter:", err?.message);
  }
  // Fallback
  const orMessages: OpenRouterMessage[] = [];
  if (systemPrompt) orMessages.push({ role: "system", content: systemPrompt });
  orMessages.push({ role: "user", content: userPrompt });
  return callOpenRouter(orMessages, { jsonMode });
};

/** Multi-turn chat request — history trimmed to MAX_HISTORY_MESSAGES */
const callAIChat = async (systemPrompt: string, history: ChatMessage[], userQuestion: string): Promise<string> => {
  const trimmedHistory = history.slice(-MAX_HISTORY_MESSAGES);
  try {
    const messages: GeminiMessage[] = [];
    if (systemPrompt) {
      messages.push({ role: "user",  parts: [{ text: systemPrompt }] });
      messages.push({ role: "model", parts: [{ text: "Understood. Ready to assist." }] });
    }
    for (const msg of trimmedHistory) {
      messages.push({ role: msg.role === "user" ? "user" : "model", parts: [{ text: msg.text }] });
    }
    messages.push({ role: "user", parts: [{ text: userQuestion }] });
    return await callGemini(messages);
  } catch (err: any) {
    if (!isQuotaError(err)) throw err;
    console.warn("Gemini chat unavailable, falling back to OpenRouter:", err?.message);
  }
  // Fallback
  const orMessages: OpenRouterMessage[] = [];
  if (systemPrompt) orMessages.push({ role: "system", content: systemPrompt });
  for (const msg of trimmedHistory) {
    orMessages.push({ role: msg.role === "user" ? "user" : "assistant", content: msg.text });
  }
  orMessages.push({ role: "user", content: userQuestion });
  return callOpenRouter(orMessages);
};

/** Vision request (Palmistry) */
const callAIVision = async (textPrompt: string, imageDataUrl: string): Promise<string> => {
  const mimeType = imageDataUrl.split(";")[0].replace("data:", "") || "image/jpeg";
  const base64Data = imageDataUrl.split(",")[1] || imageDataUrl;
  try {
    const apiKey = getGeminiKey();
    if (!apiKey) throw new Error("GEMINI_KEY_MISSING");
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({ model: GEMINI_MODEL, history: [] } as any);
    const response = await chat.sendMessage({
      message: [{ text: textPrompt }, { inlineData: { mimeType, data: base64Data } }] as any,
    });
    return response.text ?? "";
  } catch (err: any) {
    if (!isQuotaError(err)) throw err;
    console.warn("Gemini vision unavailable, falling back to OpenRouter:", err?.message);
  }
  // Fallback
  const imageUrl = imageDataUrl.startsWith("data:") ? imageDataUrl : `data:image/jpeg;base64,${imageDataUrl}`;
  return callOpenRouter([
    { role: "user", content: [{ type: "text", text: textPrompt }, { type: "image_url", image_url: { url: imageUrl } }] },
  ], { model: OPENROUTER_MODEL });
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
// Gemini Flash is natively multimodal; OpenRouter used as fallback.
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
