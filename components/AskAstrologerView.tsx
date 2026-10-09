import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BirthDetails, 
  Language, 
  ChatMessage, 
  KundaliResponse, 
  KundaliSystem, 
  PlanetaryTransitInfo 
} from '../types';
import { 
  getCoordinates, 
  getKundaliAnalysis, 
  askAstrologerConsultation 
} from '../services/aiService';
import { StorageService } from '../services/storageService';
import { KUNDALI_SYSTEMS } from '../constants';
import { 
  calculateNumerology, 
  calculateNameNumber, 
  checkNameCompatibility, 
  getCurrentPlanetaryTransits,
  getZodiacSignFromDOB
} from '../services/astrologyHelper';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AskAstrologerViewProps {
  language: Language;
}

// Preset life queries grouped by domain
const QUERY_PRESETS = [
  {
    category: '💼 Career & Success',
    queries: [
      'When will I get a job promotion or favorable career breakthrough?',
      'Am I better suited for business/entrepreneurship or a stable job?',
      'What career field aligns best with my 10th house and planetary lords?',
    ],
  },
  {
    category: '❤️ Marriage & Relationships',
    queries: [
      'When is the auspicious timing for my marriage according to my 7th house?',
      'What will my future spouse be like, and from which direction?',
      'How to resolve misunderstandings and attract marital harmony?',
    ],
  },
  {
    category: '💰 Wealth & Finances',
    queries: [
      'What are my financial prospects and wealth timing in this Dasha?',
      'Is this period favorable for property, gold, or stock investments?',
      'How to activate my Dhana Yogas and overcome money leakages?',
    ],
  },
  {
    category: '🪐 Shani & Planetary Transits',
    queries: [
      'How is the current transit of Saturn (Shani Gochara) impacting me?',
      'Am I in Shani Saadesati or Dhaiya, and what are the exact remedies?',
      'How does the current Jupiter & Rahu transit affect my chart right now?',
    ],
  },
  {
    category: '🔢 Name & Numerology',
    queries: [
      'Does my current name spelling vibrate harmoniously with my Mulank & Bhagyank?',
      'What is my single and compound Chaldean Namaank, and how can I boost it?',
      'Which missing Loshu grid numbers need activation through lifestyle remedies?',
    ],
  },
  {
    category: '✈️ Relocation & Health',
    queries: [
      'Do my 9th and 12th houses favor foreign travel or overseas settlement?',
      'Which health precautions or dietary cautions are indicated by my planets?',
      'What are the most powerful gemstones, rudraksha, and daily mantras for me?',
    ],
  },
];

const AskAstrologerView: React.FC<AskAstrologerViewProps> = ({ language }) => {
  // Profiles from local storage
  const [profiles, setProfiles] = useState<BirthDetails[]>(StorageService.getProfiles());

  // Active native birth details
  const [details, setDetails] = useState<BirthDetails>(() => {
    const existing = StorageService.getProfiles();
    if (existing.length > 0) {
      return existing[0];
    }
    return {
      name: '',
      dob: '',
      tob: '12:00',
      location: '',
    };
  });

  const [system, setSystem] = useState<KundaliSystem>('kp');
  const [saveProfileCheckbox, setSaveProfileCheckbox] = useState(true);
  const [isProfileAccordionOpen, setIsProfileAccordionOpen] = useState(false);
  const [showCosmicInspector, setShowCosmicInspector] = useState(false);

  // Astrological Data State
  const [kundaliData, setKundaliData] = useState<KundaliResponse | null>(null);
  const [kundaliLoading, setKundaliLoading] = useState(false);
  const [currentTransits, setCurrentTransits] = useState<PlanetaryTransitInfo[]>([]);

  // Chat Consultation State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Compute real-time transits on mount
  useEffect(() => {
    const transits = getCurrentPlanetaryTransits();
    setCurrentTransits(transits);
  }, []);

  // Compute Numerology data dynamically from details
  const numerologyData = useMemo(() => {
    return calculateNumerology(details.dob);
  }, [details.dob]);

  // Compute Chaldean Name number dynamically from name
  const nameData = useMemo(() => {
    return calculateNameNumber(details.name);
  }, [details.name]);

  // Check Name compatibility with Mulank & Bhagyank
  const nameCompatibility = useMemo(() => {
    if (!nameData || !numerologyData) return null;
    return checkNameCompatibility(nameData.single, numerologyData.mulank, numerologyData.bhagyank);
  }, [nameData, numerologyData]);

  // Approximate Sun sign from DOB
  const sunSign = useMemo(() => {
    return getZodiacSignFromDOB(details.dob);
  }, [details.dob]);

  // Fetch or retrieve cached Kundali when profile changes
  useEffect(() => {
    if (details.name.trim() && details.dob && details.location.trim()) {
      let isMounted = true;
      const fetchOrCheckKundali = async () => {
        const langKey = StorageService.getKeys.kundali(details.name, details.dob, language, system);
        const cached = StorageService.get<KundaliResponse>(langKey);
        if (cached) {
          if (isMounted) setKundaliData({ ...cached, system });
          return;
        }

        // Fetch Kundali in the background to furnish rich chart context
        try {
          if (isMounted) setKundaliLoading(true);
          const locationData = await getCoordinates(details.location);
          const enrichedDetails = {
            ...details,
            latitude: locationData.lat,
            longitude: locationData.lng,
          };
          const analysis = await getKundaliAnalysis(enrichedDetails, language, system);
          if (isMounted) setKundaliData(analysis);
        } catch (e) {
          console.warn("Background Kundali preparation note:", e);
        } finally {
          if (isMounted) setKundaliLoading(false);
        }
      };

      fetchOrCheckKundali();
      return () => { isMounted = false; };
    } else {
      setKundaliData(null);
    }
  }, [details.name, details.dob, details.location, language, system]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, consultationLoading]);

  // Profile Selector Handler
  const handleSelectProfile = (profile: BirthDetails) => {
    setDetails({
      name: profile.name,
      dob: profile.dob,
      tob: profile.tob || '12:00',
      location: profile.location || '',
      latitude: profile.latitude,
      longitude: profile.longitude,
    });
    setError(null);
  };

  // Form submission / profile save
  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!details.name.trim() || !details.dob) {
      setError('Please provide at least a Name and Date of Birth to proceed.');
      return;
    }
    setError(null);
    if (saveProfileCheckbox) {
      StorageService.saveProfile(details);
      setProfiles(StorageService.getProfiles());
    }
    setIsProfileAccordionOpen(false);
  };

  // Handle Asking Query
  const handleAsk = async (queryText?: string) => {
    const q = (queryText || userQuery).trim();
    if (!q) return;

    if (!details.name.trim() || !details.dob) {
      setError('Please provide your Name and Date of Birth so the Astrologer can calibrate your chart!');
      setIsProfileAccordionOpen(true);
      return;
    }

    setError(null);
    setUserQuery('');
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: q }];
    setChatHistory(newHistory);
    setConsultationLoading(true);

    try {
      // Auto-save profile if opted
      if (saveProfileCheckbox && details.name && details.dob) {
        StorageService.saveProfile(details);
        setProfiles(StorageService.getProfiles());
      }

      // Ensure coordinates if location provided
      let enrichedDetails = { ...details };
      if (details.location && (!details.latitude || !details.longitude)) {
        try {
          const loc = await getCoordinates(details.location);
          enrichedDetails.latitude = loc.lat;
          enrichedDetails.longitude = loc.lng;
        } catch {
          // Non-blocking fallback
        }
      }

      const numData = numerologyData ? {
        mulank: numerologyData.mulank,
        bhagyank: numerologyData.bhagyank,
        namaank: nameData?.single || null,
        compound: nameData?.compound || null,
        presentNumbers: numerologyData.presentNumbers,
        missingNumbers: numerologyData.missingNumbers,
      } : null;

      const answer = await askAstrologerConsultation(
        q,
        enrichedDetails,
        system,
        chatHistory,
        language,
        kundaliData,
        numData,
        currentTransits
      );

      setChatHistory([...newHistory, { role: 'model', text: answer }]);
    } catch (err: any) {
      console.error('Astrologer query error:', err);
      const errMessage = err?.message || 'The cosmic connection was temporarily obscured. Please verify your internet or try again.';
      setChatHistory([
        ...newHistory,
        { 
          role: 'model', 
          text: `⚠️ **Astrological Oracle Notice**: ${errMessage}\n\n*Please ensure your birth details are accurate or re-submit your query.*` 
        }
      ]);
    } finally {
      setConsultationLoading(false);
    }
  };

  // Copy answer to clipboard
  const copyAnswer = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Text-To-Speech Read-Aloud
  const toggleSpeech = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for clean audio
    const plainText = text.replace(/[*#_`>|-]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // Export consultation to PDF
  const downloadPDF = async () => {
    const element = printAreaRef.current;
    if (!element || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0a0d14',
        useCORS: true,
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${details.name ? details.name.replace(/\s+/g, '_') : 'Seeker'}_Astrologer_Consultation.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error('PDF export failed', e);
      alert('Could not export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* =========================================================================
          HERO & HEADER BANNER
      ========================================================================== */}
      <div className="text-center space-y-4 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <span>🔮</span>
          <span>Personal AI Vedic Astrologer & Oracle</span>
          <span>⚡</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-cinzel font-bold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-orange-100 to-amber-300 drop-shadow-[0_2px_12px_rgba(251,191,36,0.35)]">
            Ask the Astrologer!!!
          </span>
        </h1>

        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
          Ask any life query and receive bespoke cosmic counsel synthesizing your <span className="text-amber-300 font-semibold">Janma Kundali</span>, <span className="text-amber-300 font-semibold">Real-time Planetary Transits (Gochara)</span>, <span className="text-amber-300 font-semibold">Vimshottari Dasha</span>, and <span className="text-amber-300 font-semibold">Vedic & Chaldean Numerology</span>.
        </p>
      </div>

      {/* =========================================================================
          QUICK PROFILE SELECTOR & NATIVE BLUEPRINT RIBBON
      ========================================================================== */}
      <div className="mirror-card rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <h2 className="text-xs uppercase tracking-[0.25em] font-black text-amber-400">
                Seeker Profile & Cosmic Alignment
              </h2>
              <p className="text-slate-300 text-sm font-semibold">
                {details.name ? details.name : 'No profile loaded'} 
                {details.dob && <span className="text-slate-400 font-normal"> • Born {details.dob}</span>}
                {details.location && <span className="text-slate-400 font-normal"> • {details.location}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsProfileAccordionOpen(!isProfileAccordionOpen)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>{isProfileAccordionOpen ? '▲ Hide Details' : '✏️ Edit / Change Profile'}</span>
            </button>

            <button
              onClick={() => setShowCosmicInspector(!showCosmicInspector)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span>🪐</span>
              <span>{showCosmicInspector ? 'Close Inspector' : 'View Cosmic Transits'}</span>
            </button>
          </div>
        </div>

        {/* Saved Profiles Quick Pills */}
        {profiles.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-slate-500 font-bold uppercase tracking-wider whitespace-nowrap text-[10px]">
              Saved Profiles:
            </span>
            {profiles.map((p) => {
              const isSelected = details.name.toLowerCase() === p.name.toLowerCase() && details.dob === p.dob;
              return (
                <button
                  key={`${p.name}-${p.dob}`}
                  onClick={() => handleSelectProfile(p)}
                  className={`px-3.5 py-1.5 rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                  }`}
                >
                  <span>✨</span>
                  <span>{p.name}</span>
                  {p.dob && <span className="opacity-70 text-[10px]">({p.dob.split('-')[0]})</span>}
                </button>
              );
            })}
          </div>
        )}

        {/* Live Cosmic Metrics Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2 text-xs">
          {/* Mulank */}
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Mulank (Psychic)</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-amber-300">
              <span className="text-base">{numerologyData?.mulankPlanet?.icon || '🔢'}</span>
              <span className="text-sm font-cinzel">{numerologyData?.mulank ?? '—'}</span>
            </div>
            <span className="text-[9px] text-slate-500 truncate mt-0.5">
              {numerologyData?.mulankPlanet?.planet.split(' ')[0] || 'Day number'}
            </span>
          </div>

          {/* Bhagyank */}
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Bhagyank (Destiny)</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-amber-300">
              <span className="text-base">{numerologyData?.bhagyankPlanet?.icon || '🌟'}</span>
              <span className="text-sm font-cinzel">{numerologyData?.bhagyank ?? '—'}</span>
            </div>
            <span className="text-[9px] text-slate-500 truncate mt-0.5">
              {numerologyData?.bhagyankPlanet?.planet.split(' ')[0] || 'Life path'}
            </span>
          </div>

          {/* Namaank */}
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Namaank (Name)</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-amber-300">
              <span className="text-base">{nameData?.planetInfo?.icon || '✍️'}</span>
              <span className="text-sm font-cinzel">
                {nameData ? `${nameData.single} (${nameData.compound})` : '—'}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 truncate mt-0.5">
              {nameCompatibility ? nameCompatibility.label : 'Chaldean sum'}
            </span>
          </div>

          {/* Sun/Moon Sign */}
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Zodiac Sun Sign</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-amber-300">
              <span className="text-base">{sunSign?.icon || '☀️'}</span>
              <span className="text-sm font-cinzel truncate">{sunSign?.name || '—'}</span>
            </div>
            <span className="text-[9px] text-slate-500 truncate mt-0.5">
              {sunSign?.sanskrit || 'Tropical/Sidereal'}
            </span>
          </div>

          {/* Kundali Lagna & Moon */}
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Kundali Lagna & Rashi</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-amber-300">
              <span className="text-base">📜</span>
              <span className="text-xs truncate">
                {kundaliData?.moonSign ? kundaliData.moonSign : kundaliLoading ? 'Calculating...' : 'Pending'}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 truncate mt-0.5">
              {kundaliData ? `Lagna #${kundaliData.lagnaSign}` : 'From Kundali'}
            </span>
          </div>

          {/* Current Saturn Transit (Gochara) */}
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Shani Gochara (Transit)</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-sky-300">
              <span className="text-base">🪐</span>
              <span className="text-xs font-semibold">
                {currentTransits.find(t => t.planet === 'Saturn')?.sign || 'Pisces'}
              </span>
            </div>
            <span className="text-[9px] text-slate-500 truncate mt-0.5">
              Current Saturn position
            </span>
          </div>
        </div>

        {/* Collapsible Profile Edit Form */}
        {isProfileAccordionOpen && (
          <form onSubmit={handleSaveProfile} className="pt-4 border-t border-white/10 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={details.dob}
                  onChange={(e) => setDetails({ ...details, dob: e.target.value })}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Time of Birth
                </label>
                <input
                  type="time"
                  value={details.tob}
                  onChange={(e) => setDetails({ ...details, tob: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Birth Location / City
                </label>
                <input
                  type="text"
                  value={details.location}
                  onChange={(e) => setDetails({ ...details, location: e.target.value })}
                  placeholder="e.g. Mumbai, India"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Astrological System of Reference
                </label>
                <select
                  value={system}
                  onChange={(e) => setSystem(e.target.value as KundaliSystem)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-amber-300 focus:ring-1 focus:ring-amber-500 outline-none"
                >
                  {KUNDALI_SYSTEMS.map((sys) => (
                    <option key={sys.id} value={sys.id}>
                      {sys.icon} {sys.name} ({sys.tradition})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={saveProfileCheckbox}
                    onChange={(e) => setSaveProfileCheckbox(e.target.checked)}
                    className="accent-amber-500 rounded cursor-pointer"
                  />
                  <span>Save to my profiles</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleSaveProfile()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* =========================================================================
          COSMIC INSPECTOR (CURRENT PLANETARY TRANSITS & NATAL BLUEPRINT)
      ========================================================================== */}
      {showCosmicInspector && (
        <div className="mirror-card rounded-3xl p-6 border border-amber-500/20 bg-slate-950/80 backdrop-blur-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌌</span>
              <h3 className="font-cinzel font-bold text-amber-300 text-base md:text-lg">
                Real-Time Planetary Transits (Gochara) & Astrological Engine
              </h3>
            </div>
            <button
              onClick={() => setShowCosmicInspector(false)}
              className="text-slate-400 hover:text-white text-xs uppercase tracking-widest font-black"
            >
              ✕ Close
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The Astrologer automatically correlates your query with these live sidereal planetary transits against your natal Lagna and Moon sign:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {currentTransits.map((transit) => (
              <div 
                key={transit.planet}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{transit.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-200">{transit.planetSanskrit}</h4>
                      <p className="text-[10px] text-amber-400 font-semibold">{transit.signSanskrit}</p>
                    </div>
                  </div>
                  {transit.isRetrograde && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      Retrograde (वक्री)
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  {transit.transitInfluence}
                </p>
              </div>
            ))}
          </div>

          {/* Loshu Grid Blueprint */}
          {numerologyData && (
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px]">
                  Loshu Grid Cosmic Planes ({details.dob})
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Present digits: <span className="text-emerald-300 font-bold">{numerologyData.presentNumbers.join(', ')}</span> • Missing voids: <span className="text-rose-400 font-bold">{numerologyData.missingNumbers.join(', ') || 'None'}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-2 bg-black/40 rounded-xl border border-white/10">
                {numerologyData.loshu.flat().map((num, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold ${
                      num ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 text-slate-700'
                    }`}
                  >
                    {num || '—'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          ERROR ALERT
      ========================================================================== */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3 animate-fadeIn">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* =========================================================================
          QUICK ASTROLOGICAL QUERY CHIPS (LIFE DOMAINS)
      ========================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
            <span>✨</span>
            <span>Curated Astrological Queries (Click to Ask Directly):</span>
          </span>
          {chatHistory.length > 0 && (
            <button
              onClick={() => setChatHistory([])}
              className="text-[10px] text-slate-500 hover:text-amber-400 uppercase font-black tracking-widest transition-colors"
            >
              Clear Conversation
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {QUERY_PRESETS.flatMap(cat => cat.queries).slice(0, 8).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              disabled={consultationLoading}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-200 border border-white/10 hover:border-amber-500/40 text-xs font-medium whitespace-nowrap transition-all shadow-sm active:scale-95 disabled:opacity-50 text-left flex items-center gap-2"
            >
              <span className="text-amber-400">✦</span>
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          CONSULTATION CHAT & ORACLE FEED
      ========================================================================== */}
      <div 
        ref={printAreaRef}
        id="astrologer-consultation-area"
        className="mirror-card rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl space-y-8 min-h-[420px] flex flex-col justify-between"
      >
        {/* Welcome Empty State */}
        {chatHistory.length === 0 && !consultationLoading && (
          <div className="py-16 text-center space-y-6 max-w-lg mx-auto">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-4xl shadow-[0_0_30px_rgba(245,158,11,0.2)] animate-pulse">
              🔮
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-cinzel font-bold text-slate-200">
                The Astrologer Awaits Your Query
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Type your question below or click any of the curated prompts above. The oracle will examine your <span className="text-amber-300 font-semibold">{system.toUpperCase()} Kundali</span>, active <span className="text-amber-300 font-semibold">Mahadasha</span>, <span className="text-amber-300 font-semibold">Chaldean Namaank</span>, and <span className="text-amber-300 font-semibold">Real-time Gochara Transits</span> to furnish comprehensive guidance.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">💼 Career Timing</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">❤️ Marriage Prospect</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">💰 Wealth Growth</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">🪐 Shani Saadesati</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5">🔢 Name Correction</span>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="space-y-8 flex-grow">
          {chatHistory.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {/* Astrologer Avatar */}
                {!isUser && (
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shrink-0 shadow-lg shadow-amber-500/20 border border-amber-300/40">
                    🧙‍♂️
                  </div>
                )}

                <div className={`max-w-3xl space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Sender Label & Actions Header */}
                  <div className={`flex items-center gap-3 text-[10px] uppercase tracking-widest font-black ${
                    isUser ? 'justify-end text-slate-400' : 'text-amber-400'
                  }`}>
                    <span>{isUser ? `Seeker (${details.name || 'You'})` : 'Astrologer Oracle'}</span>
                    
                    {!isUser && (
                      <div className="flex items-center gap-2 no-print">
                        {/* Audio Speak */}
                        <button
                          onClick={() => toggleSpeech(msg.text, index)}
                          className="hover:text-amber-300 transition-colors p-1"
                          title="Read aloud"
                        >
                          {speakingIndex === index ? '⏹️ Stop' : '🔊 Listen'}
                        </button>

                        {/* Copy */}
                        <button
                          onClick={() => copyAnswer(msg.text, index)}
                          className="hover:text-amber-300 transition-colors p-1"
                          title="Copy reading"
                        >
                          {copiedIndex === index ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message Bubble Card */}
                  <div
                    className={`rounded-3xl p-5 md:p-6 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 rounded-tr-sm shadow-md'
                        : 'bg-[#060911]/90 text-slate-200 border border-white/10 rounded-tl-sm shadow-xl space-y-4'
                    }`}
                  >
                    {isUser ? (
                      <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="prose prose-invert max-w-none text-slate-300 text-xs md:text-sm leading-relaxed prose-headings:font-cinzel prose-headings:text-amber-300 prose-headings:font-bold prose-strong:text-amber-200 prose-table:border-collapse prose-th:bg-white/10 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-white/10">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-xl shrink-0">
                    👤
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Animation */}
          {consultationLoading && (
            <div className="flex gap-4 justify-start animate-fadeIn">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shrink-0 animate-bounce">
                🧙‍♂️
              </div>
              <div className="bg-[#060911]/90 border border-amber-500/30 rounded-3xl rounded-tl-sm p-6 text-sm text-slate-300 space-y-3 max-w-md shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="font-cinzel font-bold text-amber-300 text-xs tracking-wider">
                    Consulting Celestial Spheres...
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Synthesizing Janma Kundali houses, Vimshottari Mahadasha timeline, real-time Gochara transits, and Chaldean vibration for <span className="text-amber-200 font-semibold">{details.name || 'Seeker'}</span>...
                </p>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse w-3/4 rounded-full" />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Footer Toolbar: PDF Export and Disclaimer */}
        {chatHistory.length > 0 && (
          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 no-print text-xs">
            <button
              onClick={downloadPDF}
              disabled={exporting}
              className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold uppercase tracking-wider text-[10px] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{exporting ? '⏳ Generating PDF...' : '📥 Download Consultation PDF'}</span>
            </button>

            <span className="text-[10px] text-slate-500 italic text-center sm:text-right">
              Powered by Astrological AI Synthesis • Language: {language}
            </span>
          </div>
        )}
      </div>

      {/* =========================================================================
          QUERY INPUT CONSOLE
      ========================================================================== */}
      <div className="mirror-card rounded-3xl p-4 md:p-6 border border-white/10 shadow-2xl space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-3"
        >
          <div className="relative">
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              rows={3}
              placeholder={
                details.name
                  ? `Ask the Astrologer anything for ${details.name}... (e.g. When will my financial fortunes improve? Is foreign travel indicated?)`
                  : 'Enter your query here... (Shift+Enter for newline)'
              }
              className="w-full bg-[#060911]/90 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all resize-none font-medium leading-relaxed"
            />

            <div className="absolute right-3 bottom-3 flex items-center gap-2">
              <button
                type="submit"
                disabled={!userQuery.trim() || consultationLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
              >
                <span>{consultationLoading ? 'Analyzing...' : 'Ask Astrologer'}</span>
                <span>⚡</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <div className="flex items-center gap-3">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-mono text-[10px]">Enter</kbd> to submit</span>
              <span>•</span>
              <span className="text-amber-400/80">Delivers in {language}</span>
            </div>
            <span>Profile: {details.name || 'Seeker'}</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskAstrologerView;
