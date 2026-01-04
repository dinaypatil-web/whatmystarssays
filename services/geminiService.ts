
import { GoogleGenAI, Type } from "@google/genai";
import { BirthDetails, MatchmakingDetails, MoonSign, Timeframe, Language, ChatMessage } from "../types";
import { StorageService } from "./storageService";

// Helper to initialize GoogleGenAI client
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Get dynamic real-time date and year for the prompt
const getCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  }) + ` (Current Year: ${now.getFullYear()})`;
};

const getPromptYear = () => new Date().getFullYear();

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
      contents: `Find the precise latitude and longitude for: "${location}". Return JSON format.`,
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
    const currentYear = getPromptYear();
    const prompt = `As a professional Vedic Astrologer, today's real-time date is ${getCurrentDate()}. 
    Provide an extremely detailed ${timeframe} prediction for the Moon Sign (Rashi) ${sign} in ${language}. 
    Analyze the current planetary transits (Gochar) for ${currentYear} and the immediate upcoming year ${currentYear + 1}.
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
    const currentYear = getPromptYear();
    const prompt = `As a legendary Vedic Astrology expert (Jyotish Mahacharya), today is ${getCurrentDate()}.
    Generate an exhaustive and highly detailed Janma Kundali report for:
    Name: ${details.name}
    Birth Date: ${details.dob}
    Time: ${details.tob}
    Location: ${details.location} (Lat: ${details.latitude}, Lng: ${details.longitude})
    
    Please provide a massive, deep report including:
    1. **Celestial Snapshot**: Technical details of all 9 planets + Ascendant (Sign, Degree, House, Nakshatra, Pada).
    2. **Lagna Analysis**: Exhaustive look at the rising sign and its lord's placement.
    3. **Bhava Analysis (12 Houses)**: Detailed interpretation of EVERY house, focusing on Health, Career, Wealth, and Marriage.
    4. **Dasha Analysis**: Current Vimshottari Mahadasha, Antardasha, and Pratyantardasha. Explain their effects in ${currentYear} and ${currentYear + 1}.
    5. **Yoga & Dosha**: Identify Gajakesari, Panch Mahapurush, Kaal Sarp, Manglik, Sade Sati, etc.
    6. **Current Transits (Gochar)**: How Rahu/Ketu, Saturn, and Jupiter transits in ${currentYear} affect this specific chart.
    7. **Divine Remedies**: Customized Mantras, Gemstones, and Charities.
    
    Style: Professional, mystical, and authoritative. Language: ${language}. Use clean Markdown with clear hierarchies.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 12000 }
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
    const currentYear = getPromptYear();
    const systemInstruction = `You are a world-class Vedic Astrologer. Today is ${getCurrentDate()}.
    You have generated a Kundali for a user. Here is the report content for context:
    --- KUNDALI START ---
    ${kundaliContext}
    --- KUNDALI END ---
    
    Answer the user's follow-up questions specifically based on their chart and the transits of ${currentYear}-${currentYear + 1}.
    Always refer to the specific planetary positions and dashas mentioned in the context.
    Be precise, empathetic, and professional. 
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
        thinkingConfig: { thinkingBudget: 6000 }
      }
    });

    return response.text || "I am unable to consult the stars at this moment.";
  });
};

export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  return await withRetry(async () => {
    const ai = getAI();
    const currentYear = getPromptYear();
    const prompt = `Ashtakoot Milan compatibility analysis for:
    Boy: ${details.boy.name}, ${details.boy.dob}, ${details.boy.tob}, ${details.boy.location}
    Girl: ${details.girl.name}, ${details.girl.dob}, ${details.girl.tob}, ${details.girl.location}
    Today's Real-time Date: ${getCurrentDate()}
    
    Provide:
    1. Guna Milan score (out of 36).
    2. Deep analysis of 8 Kootas (Varna, Vashya, Tara, Yoni, Maitri, Gana, Bhakut, Nadi).
    3. Manglik & Nadi Dosha considerations.
    4. Future prospects for the couple in ${currentYear} and ${currentYear + 1}.
    
    Language: ${language}. Format in Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { thinkingConfig: { thinkingBudget: 4000 } }
    });
    return response.text || "";
  });
};

export const getNumerologyAnalysis = async (dob: string, mulank: number, bhagyank: number, loshu: (number | null)[][], language: Language) => {
  return await withRetry(async () => {
    const ai = getAI();
    const currentYear = getPromptYear();
    const prompt = `Analyze birth date: ${dob}. Today's Date: ${getCurrentDate()}.
    Mulank: ${mulank}, Bhagyank: ${bhagyank}, Loshu Grid: ${JSON.stringify(loshu)}.
    Provide deep character traits and exhaustive predictions for the year ${currentYear}. Language: ${language}. Markdown format.`;

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
    const currentYear = getPromptYear();
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    const mimeType = imageBase64.split(';')[0].split(':')[1] || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: `As a professional Chiromancer, analyze this palm image in ${language}. Detail Life, Head, Heart lines, and mounts. Today is ${getCurrentDate()}. Provide predictions relevant to ${currentYear}.` }
        ]
      },
      config: { thinkingConfig: { thinkingBudget: 6000 } }
    });
    return response.text || "";
  });
};
