import { GoogleGenAI } from "@google/genai";
import { BirthDetails, MatchmakingDetails, MoonSign, Timeframe, Language, ChatMessage, KundaliResponse } from "../types";
import { GOOGLE_TRANSLATE_LANG_MAP } from "../constants";
import { StorageService } from "./storageService";

const getCurrentDate = () => {
  const now = new Date();
  return `${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
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

const translateText = async (text: string, targetLanguage: Language): Promise<string> => {
  if (targetLanguage === 'English' || !text) return text;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: `You are a professional API translation engine. Translate the following text into ${targetLanguage}. 
        CRITICAL INSTRUCTIONS:
        1. Return ONLY the translated text. No introductions, no explanations, no conversational filler.
        2. Preserve ALL markdown formatting exactly as it is (e.g. **, ###, -, etc).
        3. Preserve any underlying JSON keys if parsing JSON string, but translate the values.`,
        temperature: 0.1
      }
    });
    
    const translated = response.text?.trim();
    return translated || text;
  } catch (err) {
    console.error("Translation logic failed", err);
    return text; // Fallback to English on error
  }
};

export const getCoordinates = async (location: string) => {
  const cacheKey = `coords_${location.toLowerCase().replace(/\s/g, '_')}`;
  const cached = StorageService.get<any>(cacheKey) || null;
  if (cached) return cached;

  const result = await withRetry(async () => {
    // Replace Gemini with Nominatim Free Geocoding API
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`, {
      headers: {
        'User-Agent': 'WhatMyStarsSaysKPSystemApp/1.0'
      }
    });
    
    if (!response.ok) throw new Error('Geocoding request failed');
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error(`Location not found: ${location}`);
    }
    
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      formattedAddress: data[0].display_name
    };
  });

  // Adding an aggressive timeout to not spam Nominatim
  await new Promise(resolve => setTimeout(resolve, 1000));
  StorageService.save(cacheKey, result, 720);
  return result;
};

export const getHoroscope = async (sign: string, timeframe: Timeframe, language: Language = 'English') => {
  const cacheKey = StorageService.getKeys.horoscope(sign, timeframe, language);
  const cached = StorageService.get<any>(cacheKey);
  if (cached) return cached;

  const result = await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `As a Master K. P. System Astrologer, current date ${getCurrentDate()}. Provide a ${timeframe} horoscope for Moon Sign ${sign}.
    Analyze precise planetary transits and their impact on Career, Health, Relationships, and Finance. You are strictly forbidden from using toxic positivity. You MUST provide harsh truths, warnings, and authentic bad predictions if the planetary math dictates it. You are an unvarnished predictor of truth.
    You must return a valid JSON object in English.
    Schema to match:
    {
      "overview": "string",
      "career": "string",
      "health": "string",
      "relationships": "string",
      "finance": "string",
      "spirituality": "string",
      "luckyColor": "string",
      "luckyNumber": "string"
    }`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const parsed = parseAIResponse(response.text || "{}");
    if (language !== 'English') {
      for (const key of Object.keys(parsed)) {
        if (typeof parsed[key] === 'string') {
          parsed[key] = await translateText(parsed[key], language);
        }
      }
    }
    return parsed;
  });

  StorageService.save(cacheKey, result, timeframe === 'daily' ? 12 : 168);
  return result;
};

export const getKundaliAnalysis = async (details: BirthDetails, language: Language): Promise<KundaliResponse> => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Generate a high-precision Authentic Vedic Janma Kundali chart and K. P. System "Life Map" for: ${details.name}, DOB: ${details.dob}, TOB: ${details.tob}, Place: ${details.location}.
    Current Date: ${getCurrentDate()}.
    
    CRITICAL: This is a professional-grade Life Analysis. DO NOT USE TOXIC POSITIVITY. You must provide truthful bad predictions, harsh realities, and exact warnings. You MUST include:
    1. **K. P. System Profile**: Detailed Star Lord, Sub Lord, Nakshatra, and Moon Sign.
    2. **Planetary Positions Table**: Degrees, Minutes, Rashi, Nakshatra, Star Lord, and Sub Lord for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
    3. **Complete Life Report (NOT limited to current year)**:
       - **12 Bhava (House) Cusp Analysis**: Detailed impact of planets and their Sub Lords on each house for the entire life based on K. P. System.
       - **Vimshottari Dasa/Bhukti/Antara (DBA) Timeline**: A structured list of major planetary periods.
       - **Shani Saadesati Analysis**: A dedicated section precisely calculating the 7.5 year transit of Saturn over the natal moon, dictating its strict timeline and harsh upcoming periods.
       - **Remedies & Gemstones**: Specific rituals and stones for lifetime benefit.
    
    You must return a valid JSON object matching this exact structure:
    {
      "report": "Professional Markdown string with bold headers and tables. Include harsh truths and Saadesati.",
      "chart": { "1": ["Sun", "Moon"], "2": [], ... },
      "lagnaSign": 1, 
      "starLord": "string",
      "subLord": "string",
      "nakshatra": "string",
      "moonSign": "string"
    }
    The 'chart' object must have 12 keys ("1" through "12"), each containing an array of planet strings based on Authentic Vedic Kundali calculation (Lahiri Ayanamsha/Sidereal). lagnaSign is 1-12.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const parsed = parseAIResponse(response.text || "{}");
    if (language !== 'English') {
      if (parsed.report) parsed.report = await translateText(parsed.report, language);
      if (parsed.starLord) parsed.starLord = await translateText(parsed.starLord, language);
      if (parsed.subLord) parsed.subLord = await translateText(parsed.subLord, language);
      if (parsed.nakshatra) parsed.nakshatra = await translateText(parsed.nakshatra, language);
      if (parsed.moonSign) parsed.moonSign = await translateText(parsed.moonSign, language);
      
      if (parsed.chart) {
        for (const house of Object.keys(parsed.chart)) {
           if (Array.isArray(parsed.chart[house])) {
             parsed.chart[house] = await Promise.all(parsed.chart[house].map((p: string) => translateText(p, language)));
           }
        }
      }
    }
    return parsed;
  });
};

export const askKundaliQuestion = async (q: string, context: string, history: ChatMessage[], lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const contents: any[] = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: q }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: `You are the User's Personal K. P. System Guide. Use the provided Kundali context: ${context}. Current Date: ${getCurrentDate()}. Focus on providing life-long guidance. DO NOT use toxic positivity, provide harsh truths and authentic bad predictions if necessary. Please provide your response entirely in English.`
      }
    });
    
    const result = response.text || "The cosmos is currently silent.";
    return await translateText(result, lang);
  });
};

export const askNumerologyQuestion = async (q: string, dob: string, mulank: number, bhagyank: number, loshu: any, history: ChatMessage[], lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const context = `User DOB: ${dob}, Mulank: ${mulank}, Bhagyank: ${bhagyank}, Loshu Grid: ${JSON.stringify(loshu)}`;
    
    const contents: any[] = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: q }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: `You are a Master Numerologist. Answer questions based on Mulank, Bhagyank and Loshu Grid context: ${context}. Please provide your response entirely in English.`
      }
    });
    const result = response.text || "The numbers are currently unclear.";
    return await translateText(result, lang);
  });
};

export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `K. P. System Matchmaking compatibility report for ${details.boy.name} & ${details.girl.name}. 
    Provide technical K. P. System scores & analysis looking at the 11th cusp sublord, 7th cusp sublord, ruling planets, DBA periods, and overall significators for marriage and relationship compatibility. 
    DO NOT use toxic positivity. You MUST provide strict warnings, bad predictions, and genuine friction points if they exist.
    Please write the entire report exclusively in English. Return as professional Markdown.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    const result = response.text || "";
    return await translateText(result, language);
  });
};

export const getNumerologyAnalysis = async (dob: string, m: number, b: number, loshu: any, lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const prompt = `Technical Numerology analysis for DOB: ${dob}. Mulank: ${m}, Bhagyank: ${b}. Interpret the Loshu grid: ${JSON.stringify(loshu)}. 
    Please write the entire analysis exclusively in English. Return as Markdown.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    const result = response.text || "";
    return await translateText(result, lang);
  });
};

export const getPalmistryAnalysis = async (image: string, lang: Language) => {
  return await withRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Convert base64 data URL to standard base64 string
    const base64Data = image.split(',')[1] || image;
    const mediaType = image.split(';')[0]?.replace('data:', '') || 'image/jpeg';
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Read this palm for personality, longevity, wealth, and career. Please write the entire response exclusively in English.` },
            { inlineData: { mimeType: mediaType, data: base64Data } }
          ]
        }
      ]
    });
    
    const result = response.text || "";
    return await translateText(result, lang);
  });
};
