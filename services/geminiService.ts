
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
    const prompt = `As a Master Vedic Astrologer, current date ${getCurrentDate()}. Provide a ${timeframe} horoscope for Moon Sign ${sign} in ${language}. 
    Analyze precise planetary transits and their impact on Career, Health, Relationships, and Finance.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            career: { type: Type.STRING },
            health: { type: Type.STRING },
            relationships: { type: Type.STRING },
            finance: { type: Type.STRING },
            spirituality: { type: Type.STRING },
            luckyColor: { type: Type.STRING },
            luckyNumber: { type: Type.STRING }
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
    const prompt = `Generate a high-precision, technical Janma Kundali "Life Map" for: ${details.name}, DOB: ${details.dob}, TOB: ${details.tob}, Place: ${details.location}.
    Language: ${language}. Current Date: ${getCurrentDate()}.
    
    CRITICAL: This is a professional-grade Life Analysis. You MUST include:
    1. **Vedic Profile**: Detailed Varna, Gana, Nakshatra, and Moon Sign.
    2. **Planetary Positions Table**: Degrees, Minutes, Rashi, and Nakshatra for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
    3. **Complete Life Report (NOT limited to current year)**:
       - **12 House Analysis**: Detailed impact of planets on each house for the entire life.
       - **Vimshottari Mahadasha Timeline**: A structured list of major planetary periods (Dasha) and their durations throughout the user's life.
       - **Comprehensive Shani Sade Sati Analysis**: A detailed timeline of all three phases of Sade Sati (past, current, and future cycles) based on birth Moon Sign and Saturn transits.
       - **Remedies & Gemstones**: Specific rituals and stones for lifetime benefit.
    
    Return a JSON object:
    - "report": (Professional Markdown string with bold headers and tables)
    - "chart": (object) {"1": ["Planets"], ...}
    - "lagnaSign": (number 1-12)
    - "varna": (string)
    - "gana": (string)
    - "nakshatra": (string)
    - "moonSign": (string)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 25000 }
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
      config: { systemInstruction: `You are the User's Personal Vedic Guide. Use the provided Kundali context: ${context}. Language: ${lang}. Current Date: ${getCurrentDate()}. Focus on providing life-long guidance.` }
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
      config: { systemInstruction: `You are a Master Numerologist. Answer questions based on Mulank, Bhagyank and Loshu Grid context: ${context}. Language: ${lang}.` }
    });
    return response.text || "The numbers are currently unclear.";
  });
};

export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const prompt = `Ashtakoot Milan compatibility report (36 Guna) for ${details.boy.name} & ${details.girl.name}. 
    Provide technical Guna scores (Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakoot, Nadi) and detailed relationship compatibility. 
    Language: ${language}. Return as professional Markdown.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || "";
  });
};

export const getNumerologyAnalysis = async (dob: string, m: number, b: number, loshu: any, lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const prompt = `Technical Numerology analysis for DOB: ${dob}. Mulank: ${m}, Bhagyank: ${b}. Interpret the Loshu grid: ${JSON.stringify(loshu)}. 
    Language: ${lang}. Return as Markdown.`;
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
      contents: { parts: [{ inlineData: { data: base64Data, mimeType: 'image/jpeg' } }, { text: `Read this palm for personality, longevity, wealth, and career in ${lang}.` }] }
    });
    return response.text || "";
  });
};
