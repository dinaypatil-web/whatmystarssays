
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
