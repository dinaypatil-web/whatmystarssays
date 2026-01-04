
import { GoogleGenAI, Type } from "@google/genai";
import { BirthDetails, MatchmakingDetails, MoonSign, Timeframe, Language, ChatMessage } from "../types";
import { StorageService } from "./storageService";

// Explicitly set the temporal context to 2026
const getCurrentDate = () => {
  const now = new Date();
  const year = 2026; // Strictly enforced for predictions
  return `${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${year} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

const getTargetYear = () => 2026;

/**
 * Safe API Key retrieval. Throws descriptive error if key is missing.
 */
const getSafeApiKey = (): string => {
  try {
    const key = process.env.API_KEY;
    if (!key) {
      throw new Error("Celestial configuration (API_KEY) is missing in the environment.");
    }
    return key;
  } catch (e) {
    throw new Error("Celestial configuration inaccessible. Please ensure API_KEY is set.");
  }
};

/**
 * Robustly extracts JSON from AI response. Handles markdown blocks and trailing/leading text.
 */
const parseAIResponse = (text: string) => {
  if (!text) throw new Error("The heavens returned an empty response.");
  
  try {
    // Attempt simple parse first
    return JSON.parse(text);
  } catch (e) {
    // Fallback: extract the first JSON-like object using regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        console.error("Deep parse failed:", text);
        throw new Error("The celestial mirror returned a fractured message. Please try again.");
      }
    }
    throw new Error("Could not decipher the cosmic alignment. Response was not in expected format.");
  }
};

// Retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error?.message || "Unknown celestial error";
    console.error(`Attempt failed: ${errorMsg}`);

    // Don't retry if it's a configuration error
    if (errorMsg.includes("missing") || errorMsg.includes("inaccessible")) {
      throw error;
    }

    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const getCoordinates = async (location: string) => {
  const cacheKey = `coords_${location.toLowerCase().replace(/\s/g, '_')}`;
  const cached = StorageService.get<any>(cacheKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the precise latitude and longitude for: "${location}". Return result in pure JSON format with keys: lat (number), lng (number), formattedAddress (string).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            formattedAddress: { type: Type.STRING }
          },
          required: ["lat", "lng", "formattedAddress"]
        }
      }
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
    const targetYear = getTargetYear();
    const prompt = `As a world-renowned Vedic Astrologer, the real-time date is ${getCurrentDate()}. 
    Provide an exhaustive ${timeframe} prediction for the Moon Sign ${sign} in ${language}. 
    CRITICAL: Base your analysis solely on planetary transits for the year ${targetYear}. 
    Output strictly in JSON with keys: overview, career, health, relationships, finance, spirituality, luckyColor, luckyNumber.`;

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
            luckyNumber: { type: Type.STRING },
          },
          required: ["overview", "career", "health", "relationships", "finance", "spirituality", "luckyColor", "luckyNumber"]
        }
      }
    });
    return parseAIResponse(response.text || "{}");
  });

  const ttl = timeframe === 'daily' ? 12 : (timeframe === 'weekly' ? 48 : 168);
  StorageService.save(cacheKey, result, ttl);
  return result;
};

export const getKundaliAnalysis = async (details: BirthDetails, language: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const targetYear = getTargetYear();
    const prompt = `As a High Priest of Vedic Astrology, today is ${getCurrentDate()}.
    Generate a deep Janma Kundali report for:
    Name: ${details.name}
    Birth: ${details.dob} at ${details.tob} in ${details.location}
    
    Analysis must cover:
    1. Planetary Snapshots (Degrees & Nakshatras)
    2. Lagna & Dasha effects for the year ${targetYear}
    3. Detailed 12-house breakdown
    4. Predictions for ${targetYear} Career/Wealth/Love
    5. Specific Gemstone & Mantra remedies
    
    Language: ${language}. Markdown format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 15000 }
      }
    });
    const text = response.text;
    if (!text) throw new Error("The stars remained silent. No analysis was generated.");
    return text;
  });
};

export const askKundaliQuestion = async (
  question: string, 
  kundaliContext: string, 
  history: ChatMessage[], 
  language: Language
) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const targetYear = getTargetYear();
    const systemInstruction = `You are a Vedic Astrologer. Context Year: ${targetYear}. 
    Report context: ${kundaliContext}. 
    Answer in ${language}. Be precise and base your answer on the provided chart and 2026 transits.`;

    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: question }] }
      ],
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 8000 }
      }
    });

    return response.text || "The cosmos is currently veiled.";
  });
};

export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const targetYear = getTargetYear();
    const prompt = `Ashtakoot Milan compatibility for:
    Boy: ${details.boy.name}, ${details.boy.dob}, ${details.boy.tob}
    Girl: ${details.girl.name}, ${details.girl.dob}, ${details.girl.tob}
    Context: Year ${targetYear}
    
    Analyze all 8 Kootas and Guna score (36). Predictions for 2026 relationship stability.
    Language: ${language}. Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 5000 } }
    });
    return response.text || "";
  });
};

export const getNumerologyAnalysis = async (dob: string, mulank: number, bhagyank: number, loshu: (number | null)[][], language: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const targetYear = getTargetYear();
    const prompt = `Numerology for DOB ${dob}. Mulank ${mulank}, Bhagyank ${bhagyank}. Year context: ${targetYear}.
    Analyze traits and 2026 predictions. Language: ${language}. Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "";
  });
};

export const getPalmistryAnalysis = async (imageBase64: string, language: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: getSafeApiKey() });
    const targetYear = getTargetYear();
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: `Analyze this palm in ${language}. Focus on 2026 predictions. Detail Life/Head/Heart lines.` }
        ]
      },
      config: { thinkingConfig: { thinkingBudget: 7000 } }
    });
    return response.text || "";
  });
};
