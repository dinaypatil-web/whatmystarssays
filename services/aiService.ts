import Groq from "groq-sdk";
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
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { 
          role: 'system', 
          content: `You are a professional API translation engine. Translate the following text into ${targetLanguage}. 
          CRITICAL INSTRUCTIONS:
          1. Return ONLY the translated text. No introductions, no explanations, no conversational filler.
          2. Preserve ALL markdown formatting exactly as it is (e.g. **, ###, -, etc).
          3. Preserve any underlying JSON keys if parsing JSON string, but translate the values.`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.1
    });
    
    const translated = response.choices[0]?.message?.content?.trim();
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
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const prompt = `As a Master Parashari System Astrologer, current date ${getCurrentDate()}. Provide a ${timeframe} horoscope for Moon Sign ${sign}.
    Analyze precise planetary transits and their impact on Career, Health, Relationships, and Finance.
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
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });
    const parsed = parseAIResponse(response.choices[0]?.message?.content || "{}");
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
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const prompt = `Generate a high-precision Authentic Vedic Janma Kundali chart and Parashari System "Life Map" for: ${details.name}, DOB: ${details.dob}, TOB: ${details.tob}, Place: ${details.location}.
    Current Date: ${getCurrentDate()}.
    
    CRITICAL: This is a professional-grade Life Analysis in English. You MUST include:
    1. **Parashari System Profile**: Detailed Varna, Gana, Nakshatra, and Moon Sign.
    2. **Planetary Positions Table**: Degrees, Minutes, Rashi, Nakshatra for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu.
    3. **Complete Life Report (NOT limited to current year)**:
       - **12 Bhava (House) Analysis**: Detailed impact of planets on each house for the entire life based on Parashari System.
       - **Vimshottari Dasha Timeline**: A structured list of major planetary periods throughout the user's life.
       - **Yoga & Ascendant Analysis**: A detailed report on key astrological Yogas present.
       - **Remedies & Gemstones**: Specific rituals and stones for lifetime benefit.
    
    You must return a valid JSON object matching this exact structure:
    {
      "report": "Professional Markdown string with bold headers and tables",
      "chart": { "1": ["Sun", "Moon"], "2": [], ... },
      "lagnaSign": 1, 
      "varna": "string",
      "gana": "string",
      "nakshatra": "string",
      "moonSign": "string"
    }
    The 'chart' object must have 12 keys ("1" through "12"), each containing an array of planet strings based on Authentic Vedic Kundali calculation (Lahiri Ayanamsha/Sidereal). lagnaSign is 1-12.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });
    const parsed = parseAIResponse(response.choices[0]?.message?.content || "{}");
    if (language !== 'English') {
      if (parsed.report) parsed.report = await translateText(parsed.report, language);
      if (parsed.varna) parsed.varna = await translateText(parsed.varna, language);
      if (parsed.gana) parsed.gana = await translateText(parsed.gana, language);
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
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const messages: any[] = [
      { role: 'system', content: `You are the User's Personal Parashari System Guide. Use the provided Kundali context: ${context}. Current Date: ${getCurrentDate()}. Focus on providing life-long guidance. Please provide your response entirely in English.` }
    ];
    
    history.forEach(msg => {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.text });
    });
    
    messages.push({ role: 'user', content: q });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages
    });
    const result = response.choices[0]?.message?.content || "The cosmos is currently silent.";
    return await translateText(result, lang);
  });
};

export const askNumerologyQuestion = async (q: string, dob: string, mulank: number, bhagyank: number, loshu: any, history: ChatMessage[], lang: Language) => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const context = `User DOB: ${dob}, Mulank: ${mulank}, Bhagyank: ${bhagyank}, Loshu Grid: ${JSON.stringify(loshu)}`;
    const messages: any[] = [
      { role: 'system', content: `You are a Master Numerologist. Answer questions based on Mulank, Bhagyank and Loshu Grid context: ${context}. Please provide your response entirely in English.` }
    ];
    
    history.forEach(msg => {
      messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.text });
    });
    
    messages.push({ role: 'user', content: q });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: messages
    });
    const result = response.choices[0]?.message?.content || "The numbers are currently unclear.";
    return await translateText(result, lang);
  });
};

export const getMatchmaking = async (details: MatchmakingDetails, language: Language) => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const prompt = `Traditional Parashari System Matchmaking compatibility report for ${details.boy.name} & ${details.girl.name}. 
    Provide technical Parashari scores & analysis looking at Ashtakoot (36 Guna) Milan, Mangal Dosha, Dasha combinations, and overall significators for marriage and relationship compatibility. 
    Please write the entire report exclusively in English. Return as professional Markdown.`;
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }]
    });
    const result = response.choices[0]?.message?.content || "";
    return await translateText(result, language);
  });
};

export const getNumerologyAnalysis = async (dob: string, m: number, b: number, loshu: any, lang: Language) => {
  return await withRetry(async () => {
    const groq = new Groq({ apiKey: process.env.API_KEY, dangerouslyAllowBrowser: true });
    const prompt = `Technical Numerology analysis for DOB: ${dob}. Mulank: ${m}, Bhagyank: ${b}. Interpret the Loshu grid: ${JSON.stringify(loshu)}. 
    Please write the entire analysis exclusively in English. Return as Markdown.`;
    
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }]
    });
    const result = response.choices[0]?.message?.content || "";
    return await translateText(result, lang);
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
            { type: "text", text: `Read this palm for personality, longevity, wealth, and career. Please write the entire response exclusively in English.` },
            { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64Data}` } }
          ]
        }
      ]
    });
    
    const result = response.choices[0]?.message?.content || "";
    return await translateText(result, lang);
  });
};
