
import React from 'react';
import { NAV_ITEMS, LANGUAGES } from '../constants';
import { Language } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, language, setLanguage }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-7xl mx-auto px-4 md:px-8">
      <header className="py-6 md:py-10 flex flex-col items-center gap-8 sticky top-0 bg-[#010409]/90 backdrop-blur-3xl z-50 border-b border-white/5">
        <div 
          className="flex flex-col items-center gap-2 group cursor-pointer transition-all active:scale-95" 
          onClick={() => setActiveTab('horoscope')}
        >
          <div className="relative">
             <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
             <h1 className="text-3xl md:text-5xl font-cinzel font-bold text-center relative z-10">
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-orange-100 to-amber-200 drop-shadow-[0_2px_10px_rgba(251,191,36,0.3)]">
                 What my Stars Says!!!
               </span>
             </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-amber-500/50" />
            <span className="text-[10px] md:text-xs uppercase tracking-[0.5em] text-amber-500/80 font-black text-center">
              Mirror of Celestial Truth
            </span>
            <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-between">
          <nav className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-500 whitespace-nowrap ${
                  activeTab === item.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative group w-full sm:w-auto">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full bg-white/5 border border-white/10 text-slate-300 text-xs px-5 py-2.5 rounded-xl focus:ring-1 focus:ring-amber-500 outline-none appearance-none pr-10 cursor-pointer hover:bg-white/10 transition-all backdrop-blur-md font-bold uppercase tracking-widest"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value} className="bg-slate-900">
                    {lang.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-amber-500">
                🌐
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow py-10 relative">
        <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-40 -right-40 w-96 h-96 bg-orange-600/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative z-10">
          {children}
        </div>
      </main>

      <footer className="py-12 border-t border-white/5 text-center bg-black/20 backdrop-blur-lg">
        <div className="flex justify-center flex-wrap gap-4 mb-8 text-[10px] uppercase tracking-[0.3em] font-black text-slate-600">
          {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map((s, i) => (
            <React.Fragment key={s}>
              <span className="hover:text-amber-500 transition-all cursor-default hover:scale-110">{s}</span>
              {i < 11 && <span className="opacity-10">|</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="max-w-3xl mx-auto mb-10 px-4">
          <p className="text-[9px] leading-relaxed text-slate-500 font-medium italic">
            Disclaimer regarding AI Generation: This application utilizes Artificial Intelligence to analyze birth data based on Vedic astrological principles. The resulting content is intended for informational, educational, and personal insight purposes only. Please be aware that AI-generated interpretations may lack the nuance of a human astrologer and may occasionally produce inconsistent results. The information provided herein should not be construed as professional advice (medical, legal, or financial) or factual prophecy. The creators assume no liability for choices made based on this algorithmic analysis.
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.5em] font-black text-amber-500/40">
            WHAT MY STARS SAYS!!!
          </p>
          <p className="text-[8px] uppercase tracking-[0.2em] font-medium text-slate-700">
            Powered by Celestial AI Logic • Real-time Vedic Transits
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
