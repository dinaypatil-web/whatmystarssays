
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

export interface KundaliChartData {
  [houseNumber: number]: string[]; // House 1-12 mapped to array of planet names
}

export interface KundaliResponse {
  report: string;
  chart: KundaliChartData;
  lagnaSign: number; 
  varna: string;
  gana: string;
  nakshatra: string;
  moonSign: string;
}
