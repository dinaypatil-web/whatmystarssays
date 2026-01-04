
import { GoogleGenAI, Type } from "@google/genai";
import { BirthDetails, MatchmakingDetails, MoonSign, Timeframe, Language, ChatMessage } from "../types";
import { StorageService } from "./storageService";

// Helper to initialize GoogleGenAI client
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Explicitly set the temporal context to 2026 as per user requirement
const getCurrentDate = () => {
  const now = new Date();
  // Overriding display logic if system year is behind
  const year = now.getFullYear() < 2026 ? 2026 : now.getFullYear();
  return `${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${year} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

const getTargetYear = () => {
  const now = new Date();
  return now.getFullYear() < 2026 ? 2026 : now.getFullYear();
};

// Retry helper with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
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
  const cached = StorageService.get<any>(cacheKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Find the precise latitude and longitude for the city/location: "${location}". Return result in JSON format.`,
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
    return JSON.parse(response.text || "{}");
  });

  StorageService.save(cacheKey, result, 720);
  return result;
};

export const getHoroscope = async (sign: string, timeframe: Timeframe, language: Language = 'English') => {
  const cacheKey = StorageService.getKeys.horoscope(sign, timeframe, language);
  const cached = StorageService.get<any>(cacheKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    const ai = getAI();
    const targetYear = getTargetYear();
    const prompt = `As a professional Vedic Astrologer, the current time is ${getCurrentDate()} (Year: ${targetYear}). 
    Provide an extremely detailed ${timeframe} prediction for the Moon Sign (Rashi) ${sign} in ${language}. 
    CRITICAL: Analyze the planetary transits (Gochar) specifically for the year ${targetYear}. 
    Include: Overview, Career, Health, Relationships, Finance, Spirituality, Lucky Color, Lucky Number. JSON format only.`;

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
    return JSON.parse(response.text || "{}");
  });

  const ttl = timeframe === 'daily' ? 12 : (timeframe === 'weekly' ? 48 : 168);
  StorageService.save(cacheKey, result, ttl);
  return result;
};

export const getKundaliAnalysis = async (details: BirthDetails, language: Language) => {
  return await withRetry(async () => {
    const ai = getAI();
    const targetYear = getTargetYear();
    const prompt = `As a high-ranking Vedic Astrology expert (Jyotish Acharya), today is ${getCurrentDate()} (Year: ${targetYear}).
    Generate a massive and highly detailed Janma Kundali report for:
    Name: ${details.name}
    Birth Date: ${details.dob}
    Time: ${details.tob}
    Location: ${details.location} (Lat: ${details.latitude}, Lng: ${details.longitude})
    
    Please provide an exhaustive analysis:
    1. **Planetary Snapshot**:Technical placements (Sign, Degree, House, Nakshatra) for all 9 planets.
    2. **Lagna Analysis**: Rising sign lord and its impact.
    3. **Bhava Analysis**: Interpretation of all 12 houses focusing on Career, Finance, and Marriage.
    4. **Vimshottari Dasha**: Current Mahadasha and Antardasha sequence.
    5. **Transits (Gochar) 2026**: How the transits of Rahu, Saturn, and Jupiter in the year ${targetYear} impact this native.
    6. **Divine Remedies**: Customized Mantras and Upayas.
    
    Style: Professional, mystical, and authoritative. Language: ${language}. Use clean Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 15000 }
      }
    });
    return response.text || "";
  });
};

export const askKundaliQuestion = async (
  question: string, 
  kundaliContext: string, 
  history: ChatMessage[], 
  language: Language
) => {
  return await withRetry(async () => {
    const ai = getAI();
    const targetYear = getTargetYear();
    const systemInstruction = `You are a world-class Vedic Astrologer. Today is ${getCurrentDate()} (Year: ${targetYear}).
    You have generated a Kundali for a user. Here is the report context:
    --- KUNDALI START ---
    ${kundaliContext}
    --- KUNDALI END ---
    
    Answer follow-up questions specifically based on their chart and the transits of the year ${targetYear}.
    Refer back to specific planetary dashas and yogas mentioned in the context.
    IMPORTANT: Answer in the ${language} language.`;

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

    return response.text || "The stars are veiled at the moment. Please try again.";
  });
};

export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  return await withRetry(async () => {
    const ai = getAI();
    const targetYear = getTargetYear();
    const prompt = `Perform an Ashtakoot Milan compatibility analysis for:
    Boy: ${details.boy.name}, ${details.boy.dob}, ${details.boy.tob}, ${details.boy.location}
    Girl: ${details.girl.name}, ${details.girl.dob}, ${details.girl.tob}, ${details.girl.location}
    Current Year: ${targetYear}
    
    Include:
    1. Guna Milan score out of 36.
    2. Detailed analysis of all 8 Kootas.
    3. Manglik & Nadi Dosha analysis.
    4. Future relationship prospects for ${targetYear} and beyond.
    
    Language: ${language}. Markdown format.`;

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
    const ai = getAI();
    const targetYear = getTargetYear();
    const prompt = `Analyze birth date: ${dob}. Current Date: ${getCurrentDate()} (Year: ${targetYear}).
    Mulank: ${mulank}, Bhagyank: ${bhagyank}, Loshu Grid: ${JSON.stringify(loshu)}.
    Provide predictions for the native in the year ${targetYear}. Language: ${language}. Markdown format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || "";
  });
};

export const getPalmistryAnalysis = async (imageBase64: string, language: Language) => {
  return await withRetry(async () => {
    const ai = getAI();
    const targetYear = getTargetYear();
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: `As a professional Chiromancer, analyze this palm image in ${language}. Detail Life, Head, Heart lines, and mounts. Today is ${getCurrentDate()} (Year: ${targetYear}). Provide predictions relevant to the year ${targetYear}.` }
        ]
      },
      config: { thinkingConfig: { thinkingBudget: 7000 } }
    });
    return response.text || "";
  });
};
