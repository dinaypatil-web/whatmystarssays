import React, { useState } from 'react';
import { AvakahadaDetails } from '../types';

interface AvakahadaInfographicProps {
  avakahada: AvakahadaDetails;
  nativeName?: string;
  exportMode?: boolean;
}

const GANA_ICONS = {
  Deva: '✨',
  Manushya: '👥',
  Rakshasa: '⚡'
};

const GANA_BADGES = {
  Deva: {
    title: 'Deva Gana (देव गण)',
    subtitle: 'Satvik Harmony & Divine Wisdom',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
    score: 95
  },
  Manushya: {
    title: 'Manushya Gana (मनुष्य गण)',
    subtitle: 'Rajasik Drive & Practical Execution',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
    score: 90
  },
  Rakshasa: {
    title: 'Rakshasa Gana (राक्षस गण)',
    subtitle: 'Courageous Intuition & Fearless Authority',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
    score: 88
  }
};

const NADI_BADGES = {
  Adi: {
    element: 'Vata (Wind / वायु)',
    icon: '🌀',
    desc: 'Governs nervous system agility, quick intuition, and mental adaptability.',
    vitality: 'Dynamic Agility',
    color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/40 text-sky-200'
  },
  Madhya: {
    element: 'Pitta (Fire / अग्नि)',
    icon: '🔥',
    desc: 'Governs metabolic drive, courage, digestive fire, and executive ambition.',
    vitality: 'Executive Radiance',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-200'
  },
  Antya: {
    element: 'Kapha (Earth & Water / जल-पृथ्वी)',
    icon: '🌊',
    desc: 'Governs bodily stamina, emotional endurance, calmness, and steadfast loyalty.',
    vitality: 'Enduring Stamina',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-200'
  }
};

const PAYA_BADGES = {
  'Rajata (Silver)': {
    icon: '🥈',
    label: 'Silver Paya (रजत पाया)',
    highlight: 'Highest Auspiciousness (अति शुभ)',
    border: 'border-slate-200/40 bg-slate-200/10 text-slate-100',
    meter: 98
  },
  'Tamra (Copper)': {
    icon: '🥉',
    label: 'Copper Paya (ताम्र पाया)',
    highlight: 'Courage & Authority (शुभ फल)',
    border: 'border-orange-500/40 bg-orange-500/10 text-orange-200',
    meter: 92
  },
  'Suvarna (Gold)': {
    icon: '🥇',
    label: 'Gold Paya (स्वर्ण पाया)',
    highlight: 'Scholarly & Spiritual (विद्या लाभ)',
    border: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
    meter: 88
  },
  'Lauha (Iron)': {
    icon: '⚙️',
    label: 'Iron Paya (लौह पाया)',
    highlight: 'Karmic Mastery & Endurance (कर्म शक्ति)',
    border: 'border-blue-500/40 bg-blue-500/10 text-blue-200',
    meter: 84
  }
};

const TATVA_BADGES = {
  'Agni (Fire)': { icon: '🔥', desc: 'Courage, transformation, leadership & high energy', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  'Prithvi (Earth)': { icon: '🌿', desc: 'Stability, pragmatism, wealth accumulation & patience', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  'Vayu (Air)': { icon: '💨', desc: 'Intellect, communication, networking & versatile curiosity', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  'Jala (Water)': { icon: '💧', desc: 'Deep intuition, emotional memory, healing & creativity', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' }
};

const AvakahadaInfographic: React.FC<AvakahadaInfographicProps> = ({ avakahada, nativeName, exportMode = false }) => {
  const [activeTab, setActiveTab] = useState<'chakra' | 'doshas' | 'lucky'>('chakra');

  const ganaBadge = GANA_BADGES[avakahada.gana] || GANA_BADGES.Manushya;
  const nadiBadge = NADI_BADGES[avakahada.nadi] || NADI_BADGES.Madhya;
  const payaBadge = PAYA_BADGES[avakahada.paya] || PAYA_BADGES['Rajata (Silver)'];
  const tatvaBadge = TATVA_BADGES[avakahada.tatva] || TATVA_BADGES['Agni (Fire)'];

  return (
    <div className="space-y-6">
      {/* Infographic Header with Identity Pillars */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-amber-500/[0.08] via-purple-500/[0.05] to-amber-500/[0.08] border border-amber-500/20 rounded-[36px] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl animate-pulse">✨</span>
              <h3 className="text-xl md:text-2xl font-cinzel font-bold text-amber-300 tracking-wide">
                Avakahada Chakra & Jyotish Identity
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Authentic Vedic planetary coordinates, pranic constitution, and astrological parameters
              {nativeName ? ` for ${nativeName}` : ''}
            </p>
          </div>

          {/* Sub Navigation Pill - Hidden during export and print */}
          {!exportMode && (
            <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-2xl no-print">
              <button
                onClick={() => setActiveTab('chakra')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'chakra'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🕉️ Avakahada Grid
              </button>
              <button
                onClick={() => setActiveTab('doshas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'doshas'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛡️ Manglik & Panchanga
              </button>
              <button
                onClick={() => setActiveTab('lucky')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'lucky'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                💎 Auspicious Matrix
              </button>
            </div>
          )}
        </div>

        {/* Dual Cosmic Pillars: Lagna & Chandra */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Lagna Pillar */}
          <div className="p-4 md:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-white/[0.02] to-transparent relative group hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                Ascendant • Janma Lagna (लग्न)
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                House 1 (तनु भाव)
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-cinzel font-black text-white">
                {avakahada.lagnaSign}
              </span>
              <span className="text-sm font-semibold text-amber-300/80">
                {avakahada.lagnaSignSanskrit}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Lagna Lord (लग्नेश)</span>
                <span className="font-bold text-slate-200">👑 Lord {avakahada.lagnaLord}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Rising Element (तत्व)</span>
                <span className="font-bold text-slate-200">{tatvaBadge.icon} {avakahada.lagnaElement}</span>
              </div>
            </div>
          </div>

          {/* Moon Sign Pillar */}
          <div className="p-4 md:p-5 rounded-2xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-white/[0.02] to-transparent relative group hover:border-sky-500/50 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-400">
                Moon Sign • Janma Rashi (चंद्र राशि)
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Chandra Deva
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-cinzel font-black text-white">
                {avakahada.moonSign}
              </span>
              <span className="text-sm font-semibold text-sky-300/80">
                {avakahada.moonSignSanskrit}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Rashi Lord (राशीश)</span>
                <span className="font-bold text-slate-200">🌙 Lord {avakahada.moonLord}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Nakshatra & Pada</span>
                <span className="font-bold text-slate-200">⭐ {avakahada.nakshatra} (Pada {avakahada.pada})</span>
              </div>
            </div>
          </div>
        </div>

        {/* TAB 1: Avakahada Chakra Infographic Grid */}
        {(exportMode || activeTab === 'chakra') && (
          <div className="space-y-3">
            {exportMode && (
              <h4 className="text-sm font-cinzel font-bold text-amber-300 flex items-center gap-2 pt-2 border-t border-white/10">
                <span>🕉️</span> Avakahada Chakra (Gana, Nadi, Yoni, Paya, Varna, Vashya, Tatva)
              </h4>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
            {/* Gana Infographic Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Soul Temperament</span>
                  <span className="text-xl">{GANA_ICONS[avakahada.gana] || '✨'}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-cinzel">Gana (गण)</h4>
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${ganaBadge.badgeClass}`}>
                    {ganaBadge.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                  {avakahada.ganaDescription}
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>Natural Resonance</span>
                <span className="font-bold text-amber-300">{ganaBadge.subtitle}</span>
              </div>
            </div>

            {/* Nadi Infographic Card */}
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${nadiBadge.color} border transition-all flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pranic Constitution</span>
                  <span className="text-xl">{nadiBadge.icon}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-cinzel">Nadi (नाड़ी)</h4>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20">
                    {avakahada.nadi} Nadi • {nadiBadge.element}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                  {avakahada.nadiDescription}
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>Ayurvedic Focus</span>
                <span className="font-bold text-slate-200">{nadiBadge.vitality}</span>
              </div>
            </div>

            {/* Yoni Infographic Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Animal Archetype</span>
                  <span className="text-xl">🐾</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-cinzel">Yoni (योनि)</h4>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-500/40">
                    {avakahada.yoni} Yoni
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                  {avakahada.yoniAnimal}
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>Relational Instinct</span>
                <span className="font-bold text-purple-300">Primal Affinity</span>
              </div>
            </div>

            {/* Paya Infographic Card */}
            <div className={`p-4 rounded-2xl bg-white/[0.03] border ${payaBadge.border} transition-all flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cosmic Footing</span>
                  <span className="text-xl">{payaBadge.icon}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-cinzel">Paya (पाया)</h4>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20">
                    {payaBadge.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
                  {avakahada.payaDescription}
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <span>Fortune Index</span>
                <span className="font-bold text-amber-300">{payaBadge.highlight}</span>
              </div>
            </div>

            {/* Varna & Vashya Dual Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Social Gravity</span>
                  <span className="text-xl">🏛️</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-cinzel">Varna & Vashya (वर्ण व वश्य)</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-slate-400">Varna (Spiritual Caste):</span>
                    <span className="font-black text-amber-300">{avakahada.varna}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                    <span className="text-slate-400">Vashya (Magnetism):</span>
                    <span className="font-black text-sky-300">{avakahada.vashya}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2.5 border-t border-white/10 text-[10px] text-slate-400 leading-tight">
                Aligns subconscious life motivations and magnetic interpersonal compatibility.
              </div>
            </div>

            {/* Tatva (Elemental Wheel) */}
            <div className={`p-4 rounded-2xl ${tatvaBadge.color} transition-all flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mahabhuta Element</span>
                  <span className="text-xl">{tatvaBadge.icon}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wide font-cinzel">Tatva (तत्व)</h4>
                <div className="mt-2">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20">
                    {avakahada.tatva}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 mt-2.5 leading-relaxed">
                  {tatvaBadge.desc}
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="text-slate-300">Predominant Energy</span>
                <span className="font-bold text-white uppercase">{avakahada.tatva.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* TAB 2: Manglik & Panchanga Coordinates */}
        {(exportMode || activeTab === 'doshas') && (
          <div className="space-y-4 animate-in fade-in duration-500 pt-2">
            {exportMode && (
              <h4 className="text-sm font-cinzel font-bold text-amber-300 flex items-center gap-2 pt-2 border-t border-white/10">
                <span>🛡️</span> Kuja (Manglik) Dosha & Panchanga Coordinates
              </h4>
            )}
            {/* Manglik Shield Banner */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              !avakahada.manglikStatus.isManglik
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : avakahada.manglikStatus.hasParihara
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                  {!avakahada.manglikStatus.isManglik ? '🛡️' : avakahada.manglikStatus.hasParihara ? '✨' : '⚔️'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-cinzel font-bold text-base text-white">
                      Manglik (Kuja) Dosha Evaluation
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      !avakahada.manglikStatus.isManglik
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : avakahada.manglikStatus.hasParihara
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {!avakahada.manglikStatus.isManglik
                        ? 'Non-Manglik (पूर्णतः दोषमुक्त)'
                        : avakahada.manglikStatus.hasParihara
                        ? 'Parihara Applied (दोष शांत / निरस्त)'
                        : 'Active Manglik (मांगलिक प्रभाव)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {avakahada.manglikStatus.pariharaReason}
                  </p>
                </div>
              </div>

              {avakahada.manglikStatus.marsHouse && (
                <div className="px-4 py-2 rounded-xl bg-black/30 border border-white/10 text-center flex-shrink-0">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Mars Location</span>
                  <span className="text-sm font-bold text-amber-300">House {avakahada.manglikStatus.marsHouse}</span>
                </div>
              )}
            </div>

            {/* Panchanga Parameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-bold text-amber-500 uppercase block mb-1">Tithi (तिथि)</span>
                <span className="text-xs md:text-sm font-bold text-white block break-words leading-snug">{avakahada.tithi}</span>
                <span className="text-[10px] text-slate-500">{avakahada.paksha} Paksha</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-bold text-amber-500 uppercase block mb-1">Nitya Yoga (योग)</span>
                <span className="text-xs md:text-sm font-bold text-white block break-words leading-snug">{avakahada.yoga}</span>
                <span className="text-[10px] text-slate-500">27 Vedic Yogas</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-bold text-amber-500 uppercase block mb-1">Karana (करण)</span>
                <span className="text-xs md:text-sm font-bold text-white block break-words leading-snug">{avakahada.karana}</span>
                <span className="text-[10px] text-slate-500">Half-Tithi Period</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-bold text-amber-500 uppercase block mb-1">Sun Sign (सूर्य राशि)</span>
                <span className="text-xs md:text-sm font-bold text-white block break-words leading-snug">{avakahada.sunSign}</span>
                <span className="text-[10px] text-slate-500">{avakahada.sunSignSanskrit}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Auspicious Jyotish Matrix */}
        {(exportMode || activeTab === 'lucky') && (
          <div className="space-y-3 pt-2">
            {exportMode && (
              <h4 className="text-sm font-cinzel font-bold text-amber-300 flex items-center gap-2 pt-2 border-t border-white/10">
                <span>💎</span> Auspicious Jyotish Talisman Matrix
              </h4>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-500">
            {/* Primary Gemstone Talisman */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-white/[0.02] to-transparent border border-amber-500/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Prescriptive Gemstone</span>
                  <span className="text-2xl">💎</span>
                </div>
                <h4 className="text-base font-cinzel font-bold text-white mb-1">{avakahada.luckyGem}</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Attunes the life-force frequency of your Ascendant Lord ({avakahada.lagnaLord}) to magnetize health, vitality, and smooth career luck.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Consecration Day</span>
                <span className="font-bold text-amber-300">{avakahada.luckyDay}</span>
              </div>
            </div>

            {/* Auspicious Day & Deity */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Spiritual Alignment</span>
                  <span className="text-2xl">🪔</span>
                </div>
                <h4 className="text-base font-cinzel font-bold text-white mb-1">Ishta Devata (इष्ट देव)</h4>
                <p className="text-sm font-bold text-amber-300 mb-2">{avakahada.luckyDeity}</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Daily mantra chanting or prayer directed to this divine frequency provides swift psychic shield and obstacles removal.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Favourable Direction</span>
                <span className="font-bold text-sky-300">{avakahada.luckyDirection}</span>
              </div>
            </div>

            {/* Auspicious Palette & Number */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Energetic Palette</span>
                  <span className="text-2xl">🎨</span>
                </div>
                <h4 className="text-base font-cinzel font-bold text-white mb-1">Auspicious Colors & Number</h4>
                <p className="text-sm font-bold text-emerald-300 mb-2">{avakahada.luckyColor}</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Wearing these frequencies during negotiations, key interviews, or ceremonies harmonizes your aura.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Primary Cosmic Number</span>
                <span className="font-black text-amber-300 text-base">#{avakahada.luckyNumber}</span>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default AvakahadaInfographic;
