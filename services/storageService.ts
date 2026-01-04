
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
    kundali: (name: string, dob: string, lang: Language) => `kundali_${name}_${dob}_${lang}`,
    match: (bName: string, gName: string, lang: Language) => `match_${bName}_${gName}_${lang}`,
    numerology: (dob: string, lang: Language) => `num_${dob}_${lang}`,
    userSign: () => 'user_preferred_moonsign'
  },

  setUserSign: (sign: string) => localStorage.setItem(CACHE_PREFIX + 'pref_sign', sign),
  getUserSign: () => localStorage.getItem(CACHE_PREFIX + 'pref_sign')
};
