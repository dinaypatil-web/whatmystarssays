import Groq from "groq-sdk";
import { BirthDetails, MatchmakingDetails, MoonSign, Timeframe, Language, ChatMessage, KundaliResponse } from "../types";
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
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const prompt = `As a Master K. P. System Astrologer, current date ${getCurrentDate()}. Provide a ${timeframe} horoscope for Moon Sign ${sign}.
    CRITICAL: The HOROSCOPE CONTENT MUST BE ENTIRELY IN ${language.toUpperCase()}.
    Analyze precise planetary transits and their impact on Career, Health, Relationships, and Finance.
    You must return a valid JSON object. ALL string values inside the JSON MUST be translated into ${language}.
    Schema to match (keys must remain exactly as shown, but values must be in ${language}):
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
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });
    return parseAIResponse(response.choices[0]?.message?.content || "{}");
  });

  StorageService.save(cacheKey, result, timeframe === 'daily' ? 12 : 168);
  return result;
};

export const getKundaliAnalysis = async (details: BirthDetails, language: Language): Promise<KundaliResponse> => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const prompt = `Generate a high-precision Authentic Vedic Janma Kundali chart and K. P. System "Life Map" for: ${details.name}, DOB: ${details.dob}, TOB: ${details.tob}, Place: ${details.location}.
    Current Date: ${getCurrentDate()}.
    
    CRITICAL LANGUAGE INSTRUCTION: The entire "report" and all textual string values MUST be written exclusively in ${language.toUpperCase()}. Do not use English for the report content.
    
    CRITICAL: This is a professional-grade Life Analysis. You MUST include:
    1. **K. P. System Profile**: Detailed Star Lord, Sub Lord, Nakshatra, and Moon Sign.
    2. **Planetary Positions Table**: Degrees, Minutes, Rashi, Nakshatra, Star Lord, and Sub Lord for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
    3. **Complete Life Report (NOT limited to current year)**:
       - **12 Bhava (House) Cusp Analysis**: Detailed impact of planets and their Sub Lords on each house for the entire life based on K. P. System.
       - **Vimshottari Dasa/Bhukti/Antara (DBA) Timeline**: A structured list of major planetary periods throughout the user's life, interpreted via K. P. rules.
       - **Ruling Planets & Significators Analysis**: A detailed report on the ruling planets at time of birth and key event significators.
       - **Remedies & Gemstones**: Specific rituals and stones for lifetime benefit.
    
    You must return a valid JSON object matching this exact structure:
    {
      "report": "Professional Markdown string with bold headers and tables",
      "chart": { "1": ["Sun", "Moon"], "2": [], ... },
      "lagnaSign": 1, 
      "starLord": "string",
      "subLord": "string",
      "nakshatra": "string",
      "moonSign": "string"
    }
    The 'chart' object must have 12 keys ("1" through "12"), each containing an array of planet strings based on Authentic Vedic Kundali calculation (Lahiri Ayanamsha/Sidereal). lagnaSign is 1-12.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });
    return parseAIResponse(response.choices[0]?.message?.content || "{}");
  });
};

export const askKundaliQuestion = async (q: string, context: string, history: ChatMessage[], lang: Language) => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const messages: any[] = [
      { role: 'system', content: `You are the User's Personal K. P. System Guide. Use the provided Kundali context: ${context}. Current Date: ${getCurrentDate()}. Focus on providing life-long guidance. CRITICAL: You MUST reply entirely in ${lang.toUpperCase()}.` }
    ];
    
    history.forEach(msg => {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.text });
    });
    
    messages.push({ role: 'user', content: q });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages
    });
    return response.choices[0]?.message?.content || "The cosmos is currently silent.";
  });
};

export const askNumerologyQuestion = async (q: string, dob: string, mulank: number, bhagyank: number, loshu: any, history: ChatMessage[], lang: Language) => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const context = `User DOB: ${dob}, Mulank: ${mulank}, Bhagyank: ${bhagyank}, Loshu Grid: ${JSON.stringify(loshu)}`;
    const messages: any[] = [
      { role: 'system', content: `You are a Master Numerologist. Answer questions based on Mulank, Bhagyank and Loshu Grid context: ${context}. CRITICAL: You MUST reply exclusively in ${lang.toUpperCase()}.` }
    ];
    
    history.forEach(msg => {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.text });
    });
    
    messages.push({ role: 'user', content: q });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages
    });
    return response.choices[0]?.message?.content || "The numbers are currently unclear.";
  });
};

export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const prompt = `K. P. System Matchmaking compatibility report for ${details.boy.name} & ${details.girl.name}. 
    Provide technical K. P. System scores & analysis looking at the 11th cusp sublord, 7th cusp sublord, ruling planets, DBA periods, and overall significators for marriage and relationship compatibility. 
    CRITICAL: You MUST write the entire report exclusively in ${language.toUpperCase()}. Return as professional Markdown.`;
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0]?.message?.content || "";
  });
};

export const getNumerologyAnalysis = async (dob: string, m: number, b: number, loshu: any, lang: Language) => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const prompt = `Technical Numerology analysis for DOB: ${dob}. Mulank: ${m}, Bhagyank: ${b}. Interpret the Loshu grid: ${JSON.stringify(loshu)}. 
    CRITICAL: You MUST write the entire analysis exclusively in ${lang.toUpperCase()}. Return as Markdown.`;
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0]?.message?.content || "";
  });
};

export const getPalmistryAnalysis = async (image: string, lang: Language) => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    
    // Convert base64 data URL to standard base64 string
    // "data:image/jpeg;base64,/9j/4AAQ..." -> "/9j/4AAQ..."
    const base64Data = image.split(',')[1] || image;
    const mediaType = image.split(';')[0]?.replace('data:', '') || 'image/jpeg';
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-11b-vision-preview', // Llama 3.2 vision model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Read this palm for personality, longevity, wealth, and career. CRITICAL: You MUST write the entire response exclusively in ${lang.toUpperCase()}.` },
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64Data}` } }
          ]
        }
      ]
    });
    
    return response.choices[0]?.message?.content || "";
  });
};
