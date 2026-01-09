
import { GoogleGenAI, Type } from "@google/genai";
import { BirthDetails, MatchmakingDetails, MoonSign, Timeframe, Language, ChatMessage, KundaliResponse } from "../types";
import { StorageService } from "./storageService";

const getCurrentDate = () => {
  const now = new Date();
  return `${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

const getSafeApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) throw new Error("API_KEY missing.");
  return key;
};

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
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const getCoordinates = async (location: string) => {
  const cacheKey = `coords_${location.toLowerCase().replace(/\s/g, '_')}`;
  const cached = StorageService.get<any>(cacheKey) || null;
  if (cached) return cached;

  const result = await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find lat/lng for: "${location}". Return JSON with keys: lat (number), lng (number), formattedAddress (string).`,
      config: { responseMimeType: "application/json" }
    });
    return parseAIResponse(response.text || "{}");
  });

  StorageService.save(cacheKey, result, 720);
  return result;
};

export const getHoroscope = async (sign: string, timeframe: Timeframe, language: Language = 'English') => {
  const cacheKey = StorageService.getKeys.horoscope(sign, timeframe, language);
  const cached = StorageService.get<any>(cacheKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const prompt = `As a Vedic Astrologer, current date ${getCurrentDate()}. Provide a ${timeframe} horoscope for Moon Sign ${sign} in ${language}. 
    Focus on planetary transits relevant to this timeframe.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING, description: "General summary of the period" },
            career: { type: Type.STRING, description: "Job and professional outlook" },
            health: { type: Type.STRING, description: "Physical and mental well-being" },
            relationships: { type: Type.STRING, description: "Love, family, and social life" },
            finance: { type: Type.STRING, description: "Money and investment guidance" },
            spirituality: { type: Type.STRING, description: "Inner growth and peace" },
            luckyColor: { type: Type.STRING, description: "The color for the period" },
            luckyNumber: { type: Type.STRING, description: "The number for the period" }
          },
          required: ["overview", "career", "health", "relationships", "finance", "spirituality", "luckyColor", "luckyNumber"]
        }
      }
    });
    return parseAIResponse(response.text || "{}");
  });

  StorageService.save(cacheKey, result, timeframe === 'daily' ? 12 : 168);
  return result;
};

export const getKundaliAnalysis = async (details: BirthDetails, language: Language): Promise<KundaliResponse> => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const prompt = `As a Master Vedic Astrologer, generate an extensive and detailed Life-Long Janma Kundali Analysis for: ${details.name}, DOB: ${details.dob}, TOB: ${details.tob}, Place: ${details.location}.
    Language: ${language}.
    
    The report MUST include:
    1. **Summary**: A high-level executive summary of the soul's destiny and dominant planetary influences.
    2. **Core Traits**: Psychological profile based on Lagna (Ascendant) and Moon sign.
    3. **Planetary Positions**: Degrees, Nakshatras, and their specific impacts.
    4. **The 12 Houses**: Detailed life predictions (Wealth, Siblings, Comforts, Education, Marriage, Enemies, Longevity, Luck, Career, Gains, Losses).
    5. **Mahadasha & Antardasha**: A timeline of the major planetary periods for the user's entire life.
    6. **Major Life Areas**: Future predictions for Career milestones, Marriage/Relationships, and Health across decades.
    7. **Vedic Remedies**: Gemstones, Rudraksha, Mantras, and Charity recommendations.

    You MUST return a JSON object with:
    1. "report": (string) The full analysis in professional Markdown format.
    2. "chart": (object) Map of 1 house to planets array: {"1": ["Mo"], "2": [], ...}
    3. "lagnaSign": (number) Sign index (1-12) in the 1st House.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 20000 }
      }
    });
    return parseAIResponse(response.text || "{}");
  });
};

export const askKundaliQuestion = async (q: string, context: string, history: ChatMessage[], lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const chatHistory = history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [...chatHistory, { role: 'user', parts: [{ text: q }] }],
      config: { systemInstruction: `You are the User's Personal Vedic Guide. Use the provided Kundali context: ${context}. Language: ${lang}. Current Date: ${getCurrentDate()}.` }
    });
    return response.text || "The cosmos is currently silent.";
  });
};

export const askNumerologyQuestion = async (q: string, dob: string, mulank: number, bhagyank: number, loshu: any, history: ChatMessage[], lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const chatHistory = history.map(msg => ({ role: msg.role === 'user' ? 'user' : 'model', parts: [{ text: msg.text }] }));
    const context = `User DOB: ${dob}, Mulank: ${mulank}, Bhagyank: ${bhagyank}, Loshu Grid: ${JSON.stringify(loshu)}`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [...chatHistory, { role: 'user', parts: [{ text: q }] }],
      config: { systemInstruction: `You are a Master Numerologist. Answer questions based on the provided numbers (Mulank, Bhagyank) and the Loshu Grid context: ${context}. Language: ${lang}. Current Date: ${getCurrentDate()}. Provide deep insights into name correction, career, and life paths.` }
    });
    return response.text || "The numbers are currently unclear.";
  });
};

export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const prompt = `Ashtakoot Milan compatibility report for ${details.boy.name} & ${details.girl.name}. Provide Guna scores out of 36 and detailed relationship guidance. Language: ${language}. Return as Markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || "";
  });
};

export const getNumerologyAnalysis = async (dob: string, m: number, b: number, loshu: any, lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const prompt = `Numerology analysis for DOB: ${dob}. Mulank: ${m}, Bhagyank: ${b}. Life path predictions and Loshu grid interpretations. Language: ${lang}. Return as Markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || "";
  });
};

export const getPalmistryAnalysis = async (img: string, lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const base64Data = img.split(',')[1] || img;
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [{ inlineData: { data: base64Data, mimeType: 'image/jpeg' } }, { text: `Read this palm for personality, longevity, wealth, and career. Provide specific life predictions in ${lang}.` }] }
    });
    return response.text || "";
  });
};
