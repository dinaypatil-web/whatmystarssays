
import { Language } from "../types";

const CACHE_PREFIX = 'jyotish_cache_';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number; // TTL in milliseconds
}

export const StorageService = {
  /**
   * Saves data to local storage with a specific TTL
   */
  save: <T>(key: string, data: T, ttlHours: number = 24) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: ttlHours * 60 * 60 * 1000
    };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  },

  /**
   * Retrieves data if it exists and hasn't expired
   */
  get: <T>(key: string): T | null => {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      const isExpired = Date.now() - entry.timestamp > entry.expiry;
      
      if (isExpired && entry.expiry !== -1) { // -1 means infinite TTL
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
    horoscope: (sign: string, timeframe: string, lang: Language) => `horo_${sign}_${timeframe}_${lang}`,
    kundali: (name: string, dob: string, lang: Language) => `kundali_${name.trim().toLowerCase()}_${dob}_${lang}`,
    match: (bName: string, gName: string, lang: Language) => `match_${bName.trim().toLowerCase()}_${gName.trim().toLowerCase()}_${lang}`,
    numerology: (dob: string, lang: Language) => `num_${dob}_${lang}`,
    userSign: () => 'user_preferred_moonsign',
    profiles: () => 'user_saved_profiles'
  },

  setUserSign: (sign: string) => localStorage.setItem(CACHE_PREFIX + 'pref_sign', sign),
  getUserSign: () => localStorage.getItem(CACHE_PREFIX + 'pref_sign'),

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
    const raw = localStorage.getItem(CACHE_PREFIX + 'user_profiles');
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
