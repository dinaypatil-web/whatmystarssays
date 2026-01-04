
export interface BirthDetails {
  name: string;
  dob: string;
  tob: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface MatchmakingDetails {
  boy: BirthDetails;
  girl: BirthDetails;
}

export type Language = 
  | 'English' | 'Hindi' | 'Bengali' | 'Marathi' | 'Telugu' 
  | 'Tamil' | 'Gujarati' | 'Kannada' | 'Odia' | 'Malayalam' | 'Punjabi';

export type MoonSign = 
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' 
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio' 
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type Timeframe = 'daily' | 'weekly' | 'monthly';

export interface PredictionResult {
  overview: string;
  career: string;
  health: string;
  relationships: string;
  finance: string;
  spirituality: string;
  luckyColor: string;
  luckyNumber: string;
}

export interface KundaliAnalysis {
  chartData: string; // Base64 or Description
  planetsPositions: string;
  detailedAnalysis: string;
  remedies: string;
}
