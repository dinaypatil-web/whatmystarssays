
import React from 'react';
import { Language } from './types';

export const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈', moonSign: 'Mesha' },
  { name: 'Taurus', symbol: '♉', moonSign: 'Vrishabha' },
  { name: 'Gemini', symbol: '♊', moonSign: 'Mithuna' },
  { name: 'Cancer', symbol: '♋', moonSign: 'Karka' },
  { name: 'Leo', symbol: '♌', moonSign: 'Simha' },
  { name: 'Virgo', symbol: '♍', moonSign: 'Kanya' },
  { name: 'Libra', symbol: '♎', moonSign: 'Tula' },
  { name: 'Scorpio', symbol: '♏', moonSign: 'Vrishchika' },
  { name: 'Sagittarius', symbol: '♐', moonSign: 'Dhanu' },
  { name: 'Capricorn', symbol: '♑', moonSign: 'Makara' },
  { name: 'Aquarius', symbol: '♒', moonSign: 'Kumbha' },
  { name: 'Pisces', symbol: '♓', moonSign: 'Meena' },
];

export const NAV_ITEMS = [
  { id: 'horoscope', label: 'Horoscope', icon: '✨' },
  { id: 'kundali', label: 'My Kundali', icon: '📜' },
  { id: 'palmistry', label: 'Palmistry', icon: '✋' },
  { id: 'numerology', label: 'Numerology', icon: '🔢' },
  { id: 'matchmaking', label: 'Matchmaking', icon: '❤️' },
];

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'हिन्दी' },
  { value: 'Marathi', label: 'मराठी' },
  { value: 'Bengali', label: 'বাংলা' },
  { value: 'Telugu', label: 'తెలుగు' },
  { value: 'Tamil', label: 'தமிழ்' },
  { value: 'Gujarati', label: 'ગુજરાતી' },
  { value: 'Kannada', label: 'ಕನ್ನಡ' },
  { value: 'Malayalam', label: 'മലയാളം' },
  { value: 'Punjabi', label: 'ਪੰਜਾਬੀ' },
  { value: 'Odia', label: 'ଓଡ଼ିଆ' },
];

export const GOOGLE_TRANSLATE_LANG_MAP: Record<Language, string> = {
  English: 'en',
  Hindi: 'hi',
  Marathi: 'mr',
  Bengali: 'bn',
  Telugu: 'te',
  Tamil: 'ta',
  Gujarati: 'gu',
  Kannada: 'kn',
  Malayalam: 'ml',
  Punjabi: 'pa',
  Odia: 'or',
};

import { KundaliSystem } from './types';

export interface KundaliSystemOption {
  id: KundaliSystem;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  tradition: string;
}

export const KUNDALI_SYSTEMS: KundaliSystemOption[] = [
  {
    id: 'kp',
    name: 'K. P. System',
    tagline: 'Krishnamurti Paddhati',
    description: 'Precision Placidus cusps, Cuspal Sub-Lords, Star Lords, Ruling Planets, and accurate event timing.',
    icon: '⚡',
    tradition: 'Modern Vedic Stellar'
  },
  {
    id: 'parashari',
    name: 'Parashari Vedic',
    tagline: 'Brihat Parashara Hora Shastra',
    description: 'Classical 12 Bhavas, planetary Yogas, Drishti, Navamsha (D9), and Vimshottari Mahadasha timeline.',
    icon: '📜',
    tradition: 'Classical Vedic'
  },
  {
    id: 'jaimini',
    name: 'Jaimini System',
    tagline: 'Jaimini Upadesha Sutras',
    description: '7 Chara Karakas (Atmakaraka, Amatyakaraka), Arudha Lagna (AL), Upapada (UL), and Chara Dasha.',
    icon: '✨',
    tradition: 'Sutra System'
  },
  {
    id: 'lalkitab',
    name: 'Lal Kitab',
    tagline: 'Red Book Astrology',
    description: 'Kalpurush natural zodiac houses, Ancestral Debts (Rin), sleeping planets, and practical remedies (Totkas).',
    icon: '📕',
    tradition: 'Folk Vedic'
  },
  {
    id: 'nadi',
    name: 'Bhrigu Nandi Nadi',
    tagline: 'Nadi Astrology',
    description: 'Planetary linkages via directional trines (1-5-9), Jeeva (Jupiter) & Karma (Saturn) combinations.',
    icon: '🔱',
    tradition: 'Tamil / Classical Nadi'
  },
  {
    id: 'western',
    name: 'Western Tropical',
    tagline: 'Tropical Zodiac & Aspects',
    description: 'Sayana zodiac, Major aspects (Trine, Square, Opposition, Sextile), and Placidus psychological analysis.',
    icon: '🧭',
    tradition: 'Western Hellenistic'
  }
];
