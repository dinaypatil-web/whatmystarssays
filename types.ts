
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

export type KundaliSystem = 
  | 'kp'          // K. P. System (Krishnamurti Paddhati)
  | 'parashari'    // Classical Vedic Parashari
  | 'jaimini'      // Jaimini Astrology
  | 'lalkitab'     // Lal Kitab
  | 'nadi'         // Bhrigu Nandi Nadi
  | 'western';     // Western / Tropical

export interface MahadashaPeriod {
  planet: string;
  startYear: number | string;
  endYear: number | string;
  durationYears?: number | string;
  isCurrent?: boolean;
}

export interface SaadesatiPhase {
  phase: string;
  startYear: number | string;
  endYear: number | string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  status: 'past' | 'active' | 'upcoming';
  description?: string;
}

export interface AvakahadaDetails {
  lagnaSign: string;
  lagnaSignSanskrit: string;
  lagnaLord: string;
  lagnaNumber: number;
  lagnaElement: 'Fire' | 'Earth' | 'Air' | 'Water';
  moonSign: string;
  moonSignSanskrit: string;
  moonLord: string;
  sunSign: string;
  sunSignSanskrit: string;
  nakshatra: string;
  nakshatraSanskrit: string;
  nakshatraLord: string;
  pada: number;
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  ganaDescription: string;
  nadi: 'Adi' | 'Madhya' | 'Antya';
  nadiAyurveda: 'Vata' | 'Pitta' | 'Kapha';
  nadiDescription: string;
  yoni: string;
  yoniAnimal: string;
  varna: 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra';
  vashya: string;
  tatva: 'Agni (Fire)' | 'Prithvi (Earth)' | 'Vayu (Air)' | 'Jala (Water)';
  paya: 'Rajata (Silver)' | 'Tamra (Copper)' | 'Suvarna (Gold)' | 'Lauha (Iron)';
  payaDescription: string;
  tithi: string;
  paksha: 'Shukla' | 'Krishna';
  yoga: string;
  karana: string;
  luckyColor: string;
  luckyNumber: number;
  luckyGem: string;
  luckyMetal: string;
  luckyDay: string;
  luckyDirection: string;
  luckyDeity: string;
  manglikStatus: {
    isManglik: boolean;
    severity: 'None' | 'Anshik (Mild)' | 'Active' | 'Strong';
    marsHouse: number | null;
    hasParihara: boolean;
    pariharaReason: string;
  };
}

export interface PlanetaryPositionDetail {
  planet: string;
  planetSanskrit: string;
  icon: string;
  sign: string;
  signSanskrit: string;
  house: number;
  dignity: 'Exalted (उच्च)' | 'Moolatrikona (मूलत्रिकोण)' | 'Own Sign (स्वराशि)' | 'Friendly (मित्र)' | 'Neutral (सम)' | 'Enemy (शत्रु)' | 'Debilitated (नीच)';
  dignityColor: string;
  isRetrograde?: boolean;
  isCombust?: boolean;
  degree?: string;
}

export interface BhavaDetailedAnalysis {
  houseNumber: number;
  name: string;
  sanskritName: string;
  rashiNumber: number;
  rashiName: string;
  rashiSanskrit: string;
  rashiLord: string;
  rashiLordSanskrit: string;
  element: string;
  classification: string;
  purushartha: 'Dharma' | 'Artha' | 'Kama' | 'Moksha' | string;
  karakaPlanet: string;
  bodyParts: string;
  lifeDomain: string;
  planets: PlanetaryPositionDetail[];
  detailedAnalysis: string;
  boons: string[];
  cautions: string[];
  remedies: string[];
}

export interface ShadbalaDetail {
  planet: string;
  planetLocalized: string;
  icon: string;
  sthanaBala: number;   // Positional strength
  digBala: number;      // Directional strength
  kaalaBala: number;    // Temporal strength
  cheshtaBala: number;  // Motional strength
  naisargikaBala: number; // Natural strength
  drikBala: number;     // Aspectual strength
  totalShashtiamsas: number;
  totalRupas: number;
  requiredRupas: number;
  ratioPercent: number;
  strengthStatus: 'Exceptional' | 'Strong' | 'Sufficient' | 'Moderate' | 'Weak';
  deliveringPower: string;
}

export interface VedicYogaDetail {
  name: string;
  category: 'Raja' | 'Dhana' | 'Mahapurusha' | 'Auspicious' | 'Spiritual';
  planetsInvolved: string[];
  description: string;
  lifeImpact: string;
  isActive: boolean;
}

export interface VedicDoshaDetail {
  name: string;
  severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  isActive: boolean;
  explanation: string;
  cancellationText?: string;
  remedy: string;
}

export interface DivisionalChartDetail {
  id: 'D1' | 'D9' | 'D10' | 'D7';
  name: string;
  title: string;
  description: string;
  lagnaSign: number;
  chart: KundaliChartData;
}

export interface AntardashaDetail {
  planet: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  isCurrent: boolean;
  effectSummary: string;
}

export interface PracticalRemedyDetail {
  gemstones: {
    primary: {
      name: string;
      sanskritName: string;
      planet: string;
      carat: string;
      metal: string;
      finger: string;
      dayTime: string;
      mantra: string;
    };
    secondary?: {
      name: string;
      sanskritName: string;
      planet: string;
      metal: string;
      finger: string;
    };
  };
  mantras: Array<{
    planet: string;
    type: string;
    mantraText: string;
    repetitions: string;
    optimalTiming: string;
    rosary: string;
  }>;
  charities: Array<{
    planet: string;
    items: string;
    targetDay: string;
    recipient: string;
    karmicBenefit: string;
  }>;
}

export interface KundaliResponse {
  report: string;
  chart: KundaliChartData;
  lagnaSign: number; 
  starLord: string;
  subLord: string;
  nakshatra: string;
  moonSign: string;
  sunSign?: string;
  system?: KundaliSystem;
  mahadashas?: MahadashaPeriod[];
  saadesatiCycles?: SaadesatiPhase[];
  avakahada?: AvakahadaDetails;
  planetaryPositions?: PlanetaryPositionDetail[];
  shadbala?: ShadbalaDetail[];
  yogas?: VedicYogaDetail[];
  doshas?: VedicDoshaDetail[];
  divisionalCharts?: {
    d1: DivisionalChartDetail;
    d9: DivisionalChartDetail;
    d10: DivisionalChartDetail;
    d7: DivisionalChartDetail;
  };
  antardashas?: AntardashaDetail[];
  practicalRemedies?: PracticalRemedyDetail;
}

export interface PlanetaryTransitInfo {
  planet: string;
  planetSanskrit: string;
  icon: string;
  sign: string;
  signSanskrit: string;
  element: string;
  isRetrograde?: boolean;
  transitInfluence: string;
}

export interface AstrologerContext {
  details: BirthDetails;
  system: KundaliSystem;
  kundali?: KundaliResponse | null;
  numerology?: {
    mulank: number;
    bhagyank: number;
    namaank?: number;
    compound?: number;
    nameStatus?: string;
  };
  transits?: PlanetaryTransitInfo[];
}
