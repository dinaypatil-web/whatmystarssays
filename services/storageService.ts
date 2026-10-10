
import { Language, KundaliSystem } from "../types";

const LEGACY_CACHE_PREFIX = 'jyotish_cache_';
const CACHE_PREFIX = 'jyotish_v5_';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number; // TTL in milliseconds
}

export const StorageService = {
  /**
   * Saves data to local storage with a specific TTL
   * ttlHours = -1 means infinite TTL (never expires)
   */
  save: <T>(key: string, data: T, ttlHours: number = 24) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: ttlHours === -1 ? -1 : ttlHours * 60 * 60 * 1000
    };
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (e) {
      console.warn("StorageService save failed (possibly quota exceeded)", e);
    }
  },

  /**
   * Retrieves data if it exists and hasn't expired
   */
  get: <T>(key: string): T | null => {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      // -1 means infinite TTL, never expires
      if (entry.expiry === -1) {
        return entry.data;
      }
      const isExpired = Date.now() - entry.timestamp > entry.expiry;
      
      if (isExpired) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch (e) {
      return null;
    }
  },

  /**
   * Specific keys for the app
   */
  getKeys: {
    // Prediction cache keys — language-aware
    horoscope: (sign: string, timeframe: string, lang: Language) => `horo_${sign.toLowerCase()}_${timeframe}_${lang}`,
    kundali: (name: string, dob: string, tobOrLang: string | Language = '', langOrSys: Language | KundaliSystem = 'English', system: KundaliSystem = 'kp') => {
      // Backwards compatible signature support:
      // Old: (name, dob, lang, system)
      // New: (name, dob, tob, lang, system)
      if (typeof langOrSys === 'string' && ['kp', 'parashari', 'jaimini', 'lalkitab', 'nadi', 'western'].includes(langOrSys)) {
        const lang = tobOrLang as Language;
        const sys = langOrSys as KundaliSystem;
        return `kundali_${name.trim().toLowerCase()}_${dob}_${lang}_${sys}`;
      }
      const tob = String(tobOrLang || '').trim();
      const lang = (langOrSys || 'English') as Language;
      return `kundali_${name.trim().toLowerCase()}_${dob}_${tob}_${lang}_${system}`;
    },
    match: (bName: string, gName: string, lang: Language = 'English', bDob: string = '', bTob: string = '', gDob: string = '', gTob: string = '') => {
      const bStr = bName.trim().toLowerCase();
      const gStr = gName.trim().toLowerCase();
      const bD = bDob ? `_${bDob.trim()}_${(bTob || '').trim()}` : '';
      const gD = gDob ? `_${gDob.trim()}_${(gTob || '').trim()}` : '';
      return `match_${bStr}${bD}_${gStr}${gD}_${lang}`;
    },
    numerology: (dob: string, lang: Language, name: string = '') => `num_${dob}_${lang}_${name.trim().toLowerCase().replace(/\s+/g, '_')}`,
    userSign: () => 'user_preferred_moonsign',
    profiles: () => 'user_saved_profiles'
  },

  setUserSign: (sign: string) => localStorage.setItem(CACHE_PREFIX + 'pref_sign', sign),
  getUserSign: () => localStorage.getItem(CACHE_PREFIX + 'pref_sign') || localStorage.getItem(LEGACY_CACHE_PREFIX + 'pref_sign'),

  /**
   * Saves a user profile for quick re-entry
   */
  saveProfile: (profile: { name: string; dob: string; tob: string; location: string }) => {
    if (!profile.name || !profile.dob) return;
    const profiles = StorageService.getProfiles();
    const existingIndex = profiles.findIndex(p => p.name.toLowerCase() === profile.name.toLowerCase());
    
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    
    localStorage.setItem(CACHE_PREFIX + 'user_profiles', JSON.stringify(profiles));
  },

  /**
   * Retrieves all saved profiles
   */
  getProfiles: (): { name: string; dob: string; tob: string; location: string }[] => {
    const raw = localStorage.getItem(CACHE_PREFIX + 'user_profiles') || localStorage.getItem(LEGACY_CACHE_PREFIX + 'user_profiles');
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Deletes a specific profile
   */
  deleteProfile: (name: string) => {
    const profiles = StorageService.getProfiles().filter(p => p.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(CACHE_PREFIX + 'user_profiles', JSON.stringify(profiles));
  }
};
