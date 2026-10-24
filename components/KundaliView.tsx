
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BirthDetails, Language, ChatMessage, KundaliResponse, KundaliSystem, MahadashaPeriod, SaadesatiPhase } from '../types';
import { getCoordinates, getKundaliAnalysis, askKundaliQuestion } from '../services/aiService';
import { StorageService } from '../services/storageService';
import { calculateMoonDetails, calculateSaadesatiPhases, calculateAvakahadaDetails, calculatePlanetaryPositions } from '../services/astrologyHelper';
import { KUNDALI_SYSTEMS } from '../constants';
import KundaliChart from './KundaliChart';
import KundaliBookViewer from './KundaliBookViewer';
import AvakahadaInfographic from './AvakahadaInfographic';
import PlanetaryInfographicMatrix from './PlanetaryInfographicMatrix';
import InfographicReportViewer from './InfographicReportViewer';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PLANET_ICONS: Record<string, string> = {
  Sun: '☀️',
  Surya: '☀️',
  Moon: '🌙',
  Chandra: '🌙',
  Mars: '♂️',
  Mangal: '♂️',
  Mercury: '☿',
  Budh: '☿',
  Jupiter: '♃',
  Guru: '♃',
  Venus: '♀',
  Shukra: '♀',
  Saturn: '🪐',
  Shani: '🪐',
  Rahu: '☊',
  Ketu: '☋',
};

const getPlanetIcon = (planet: string = ''): string => {
  const p = planet.toLowerCase();
  for (const [key, icon] of Object.entries(PLANET_ICONS)) {
    if (p.includes(key.toLowerCase())) return icon;
  }
  return '✨';
};

const isDashaActive = (dasha: MahadashaPeriod): boolean => {
  if (dasha.isCurrent !== undefined) return Boolean(dasha.isCurrent);
  const currentYear = new Date().getFullYear();
  const start = parseInt(String(dasha.startYear), 10);
  const end = parseInt(String(dasha.endYear), 10);
  if (!isNaN(start) && !isNaN(end)) {
    return currentYear >= start && currentYear <= end;
  }
  return false;
};

const getSaadesatiBadge = (cycle: SaadesatiPhase) => {
  const now = Date.now();
  let status = cycle.status?.toLowerCase();
  
  if (cycle.startDate && cycle.endDate) {
    const startMs = new Date(cycle.startDate).getTime();
    const endMs = new Date(cycle.endDate).getTime();
    if (!isNaN(startMs) && !isNaN(endMs)) {
      if (now < startMs) status = 'upcoming';
      else if (now > endMs) status = 'past';
      else status = 'active';
    }
  } else {
    const currentYear = new Date().getFullYear();
    const start = parseInt(String(cycle.startYear), 10);
    const end = parseInt(String(cycle.endYear), 10);
    if (!status && !isNaN(start) && !isNaN(end)) {
      if (currentYear < start) status = 'upcoming';
      else if (currentYear > end) status = 'past';
      else status = 'active';
    }
  }

  if (status === 'active') {
    return {
      type: 'active',
      label: '⚡ Active Now',
      classes: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
    };
  }
  if (status === 'upcoming') {
    return {
      type: 'upcoming',
      label: '⏳ Upcoming',
      classes: 'bg-sky-400/20 text-sky-300 border-sky-400/40',
    };
  }
  return {
    type: 'past',
    label: '✓ Completed',
    classes: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
  };
};

const extractDashaFromReport = (report: string): MahadashaPeriod[] => {
  if (!report) return [];
  const periods: MahadashaPeriod[] = [];
  const currentYear = new Date().getFullYear();

  // Pattern 1: Table row e.g. | Saturn (Shani) | 2011 – 2030 | 19 Years | Active |
  const tableRegex = /\|\s*([^|\n]+?)\s*\|\s*(\d{4})\s*[-–—]\s*(\d{4})\s*\|\s*([^|\n]*?)\s*\|/g;
  let match;
  while ((match = tableRegex.exec(report)) !== null) {
    const planetRaw = match[1].trim();
    if (/planet|graha|dasha|nakshatra|system|house/i.test(planetRaw)) continue;
    const startYear = parseInt(match[2], 10);
    const endYear = parseInt(match[3], 10);
    const durationMatch = match[4].match(/(\d+)/);
    const duration = durationMatch ? parseInt(durationMatch[1], 10) : endYear - startYear;
    periods.push({
      planet: planetRaw,
      startYear,
      endYear,
      durationYears: duration,
      isCurrent: currentYear >= startYear && currentYear <= endYear,
    });
  }

  // Pattern 2: Bullet points e.g. - **Saturn / Shani**: 2011 – 2030 (19 years)
  if (periods.length === 0) {
    const bulletRegex = /[-*]\s*\*\*([^*]+?)\*\*[:\s]+(\d{4})\s*[-–—]\s*(\d{4})(?:[^(]*\(([^)]+)\))?/g;
    while ((match = bulletRegex.exec(report)) !== null) {
      const planetRaw = match[1].trim();
      if (/phase|saadesati|sade\s*sati|overview|analysis/i.test(planetRaw)) continue;
      const startYear = parseInt(match[2], 10);
      const endYear = parseInt(match[3], 10);
      const durStr = match[4] || '';
      const durMatch = durStr.match(/(\d+)/);
      const duration = durMatch ? parseInt(durMatch[1], 10) : endYear - startYear;
      periods.push({
        planet: planetRaw,
        startYear,
        endYear,
        durationYears: duration,
        isCurrent: currentYear >= startYear && currentYear <= endYear,
      });
    }
  }

  return periods;
};

const extractSaadesatiFromReport = (report: string): SaadesatiPhase[] => {
  if (!report) return [];
  const phases: SaadesatiPhase[] = [];
  const currentYear = new Date().getFullYear();

  // Pattern 1: Table row
  const tableRegex = /\|\s*([^|\n]*(?:Phase|चरण|Shani|Rising|Peak|Setting|उदय|शिखर|अस्त)[^|\n]*)\s*\|\s*(\d{4})\s*[-–—]\s*(\d{4})\s*\|([^|\n]*)\|/gi;
  let match;
  while ((match = tableRegex.exec(report)) !== null) {
    const phaseName = match[1].trim();
    if (/status|table|phase\s*name/i.test(phaseName)) continue;
    const startYear = parseInt(match[2], 10);
    const endYear = parseInt(match[3], 10);
    const desc = match[4]?.trim() || '';
    let status: 'past' | 'active' | 'upcoming' = 'past';
    if (currentYear < startYear) status = 'upcoming';
    else if (currentYear >= startYear && currentYear <= endYear) status = 'active';
    phases.push({
      phase: phaseName,
      startYear,
      endYear,
      status,
      description: desc,
    });
  }

  // Pattern 2: Bullet points
  if (phases.length === 0) {
    const bulletRegex = /[-*]\s*\*\*([^*]+?(?:Phase|चरण|Rising|Peak|Setting|उदय|शिखर|अस्त)[^*]*)\*\*[:\s]+(\d{4})\s*[-–—]\s*(\d{4})[:\s-–]*(.*)/gi;
    while ((match = bulletRegex.exec(report)) !== null) {
      const phaseName = match[1].trim();
      const startYear = parseInt(match[2], 10);
      const endYear = parseInt(match[3], 10);
      const desc = match[4]?.trim() || '';
      let status: 'past' | 'active' | 'upcoming' = 'past';
      if (currentYear < startYear) status = 'upcoming';
      else if (currentYear >= startYear && currentYear <= endYear) status = 'active';
      phases.push({
        phase: phaseName,
        startYear,
        endYear,
        status,
        description: desc,
      });
    }
  }

  return phases;
};

interface KundaliViewProps {
  language: Language;
}

const KundaliView: React.FC<KundaliViewProps> = ({ language }) => {
  const [details, setDetails] = useState<BirthDetails>({
    name: '',
    dob: '',
    tob: '',
    location: '',
  });
  const [system, setSystem] = useState<KundaliSystem>('kp');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<KundaliResponse | null>(null);
  const [profiles, setProfiles] = useState<BirthDetails[]>(StorageService.getProfiles());
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const displayMahadashas = useMemo(() => {
    if (!analysis) return [];
    if (analysis.mahadashas && analysis.mahadashas.length > 0) return analysis.mahadashas;
    return extractDashaFromReport(analysis.report);
  }, [analysis]);

  const displaySaadesati = useMemo(() => {
    if (!analysis) return [];

    // Derive Moon Sign reference to compute or verify exact 2.5-year phases
    const moonSign = analysis.moonSign || (details.dob ? calculateMoonDetails(details.dob, details.tob)?.rashi.name : '');
    const calculatedPhases = moonSign ? calculateSaadesatiPhases(moonSign, new Date(), language) : [];

    if (analysis.saadesatiCycles && analysis.saadesatiCycles.length > 0) {
      // Detect if years were corrupted by AI hallucination (e.g. single phase having > 4 year span)
      const hasCorruptedSpan = analysis.saadesatiCycles.some(c => {
        const diff = Math.abs(Number(c.endYear) - Number(c.startYear));
        return diff > 4 || diff === 0 || isNaN(diff);
      });

      if (hasCorruptedSpan || !analysis.saadesatiCycles[0]?.startDate) {
        if (calculatedPhases.length > 0) {
          return calculatedPhases.map((calc, idx) => ({
            ...calc,
            description: analysis.saadesatiCycles?.[idx]?.description || calc.description
          }));
        }
      }
      return analysis.saadesatiCycles;
    }

    if (calculatedPhases.length > 0) return calculatedPhases;
    return extractSaadesatiFromReport(analysis.report);
  }, [analysis, details, language]);

  const avakahadaData = useMemo(() => {
    if (!analysis) return null;
    if (analysis.avakahada) return analysis.avakahada;
    return calculateAvakahadaDetails(
      details.dob,
      details.tob || '12:00',
      analysis.lagnaSign || 1,
      analysis.chart
    );
  }, [analysis, details]);

  const planetaryPositionsData = useMemo(() => {
    if (!analysis) return [];
    if (analysis.planetaryPositions && analysis.planetaryPositions.length > 0) {
      return analysis.planetaryPositions;
    }
    return calculatePlanetaryPositions(
      analysis.chart,
      analysis.lagnaSign || 1
    );
  }, [analysis]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, chatLoading]);

  // Automatically refresh Kundali analysis when language or system changes
  useEffect(() => {
    if (analysis && details.name && details.dob && details.location) {
      const reloadKundali = async () => {
        setLoading(true);
        setError(null);
        try {
          const locationData = await getCoordinates(details.location);
          const enrichedDetails = {
            ...details,
            latitude: locationData.lat,
            longitude: locationData.lng,
          };
          const result = await getKundaliAnalysis(enrichedDetails, language, system);
          setAnalysis(result);
        } catch (err: any) {
          console.error("Kundali reload failed", err);
          setError(err.message || "Failed to update Kundali analysis.");
        } finally {
          setLoading(false);
        }
      };
      reloadKundali();
    }
  }, [language, system]);

  const handleProfileSelect = (name: string) => {
    const profile = profiles.find(p => p.name === name);
    if (profile) {
      setDetails(profile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setChatHistory([]);
    try {
      const locationData = await getCoordinates(details.location);
      const enrichedDetails = {
        ...details,
        latitude: locationData.lat,
        longitude: locationData.lng,
      };
      const result = await getKundaliAnalysis(enrichedDetails, language, system);
      setAnalysis(result);
      StorageService.saveProfile(details);
      setProfiles(StorageService.getProfiles());
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Celestial connection failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || !analysis || chatLoading) return;

    const currentQuery = userQuery;
    setUserQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: currentQuery }]);
    setChatLoading(true);

    try {
      const response = await askKundaliQuestion(currentQuery, analysis.report, chatHistory, language, system);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', text: "The astral connection was interrupted." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = async () => {
    const elementId = 'kundali-report-area';
    const element = document.getElementById(elementId);
    if (!element || exporting) return;

    setExporting(true);
    // Crucial: wait for React to re-render in exportMode so all sections, tabs, and chapters are mounted into the DOM
    await new Promise(resolve => setTimeout(resolve, 350));

    const prevScrollX = window.scrollX;
    const prevScrollY = window.scrollY;

    try {
      // Temporarily scroll to top so html2canvas captures from (0,0) without scroll clipping
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#07090e',
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        windowWidth: 1200,
        windowHeight: element.scrollHeight + 500,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.width = '1200px';
            clonedElement.style.maxWidth = '1200px';
            clonedElement.style.height = 'auto';
            clonedElement.style.maxHeight = 'none';
            clonedElement.style.overflow = 'visible';

            // Hide UI buttons and interactive chrome
            const noPrint = clonedElement.querySelectorAll('.no-print, button, form');
            noPrint.forEach((el: any) => {
              el.style.display = 'none';
            });

            // Expand all scrollable containers
            const scrollables = clonedElement.querySelectorAll('*');
            scrollables.forEach((el: any) => {
              const style = window.getComputedStyle(el);
              if (style.overflow === 'hidden' || style.overflowY === 'auto' || style.overflowX === 'auto') {
                el.style.overflow = 'visible';
                el.style.maxHeight = 'none';
              }
            });
          }
        }
      });

      // Restore user's previous scroll position
      window.scrollTo(prevScrollX, prevScrollY);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add Page 1
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add remaining pages sequentially
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeName = (details.name || 'Kundali').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Full_Kundali_Life_Map_${safeName}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      window.scrollTo(prevScrollX, prevScrollY);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-20 px-2 md:px-0">
      {!analysis && !loading && (
        <section className="mirror-card p-6 md:p-12 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-5xl font-cinzel text-amber-100 mb-4 tracking-tight">Vedic Janma Kundali Analysis</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">Decode your entire life journey, from personality traits to Vimshottari Mahadashas, lifetime timelines, and house interpretations.</p>
          </div>

          <div className="max-w-3xl mx-auto mb-8">
             <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.3em]">Load Saved Profile 📂</span>
             </div>
             <select 
               onChange={(e) => handleProfileSelect(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none hover:bg-white/10 transition-all font-medium text-sm"
               value={details.name}
             >
               <option value="" className="bg-slate-900">Select a saved profile...</option>
               {profiles.map(p => (
                 <option key={p.name} value={p.name} className="bg-slate-900">{p.name}</option>
               ))}
             </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-xs text-center">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <InputField label="Full Name" value={details.name} onChange={(v: string) => setDetails({ ...details, name: v })} />
              <InputField label="Birth Place" placeholder="City, State" value={details.location} onChange={(v: string) => setDetails({ ...details, location: v })} />
              <InputField label="Birth Date" type="date" value={details.dob} onChange={(v: string) => setDetails({ ...details, dob: v })} />
              <InputField label="Birth Time" type="time" value={details.tob} onChange={(v: string) => setDetails({ ...details, tob: v })} />
            </div>

            {/* Astrology System Selector */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black text-amber-500/80 uppercase tracking-[0.25em] flex items-center gap-1.5">
                  <span>🌌</span> Select Kundali System
                </label>
                <span className="text-[10px] text-amber-300/80 font-bold tracking-wider">
                  {KUNDALI_SYSTEMS.find(s => s.id === system)?.name}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {KUNDALI_SYSTEMS.map((sys) => {
                  const isSelected = system === sys.id;
                  return (
                    <button
                      key={sys.id}
                      type="button"
                      onClick={() => setSystem(sys.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xl">{sys.icon}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 text-slate-500'
                        }`}>
                          {sys.tradition}
                        </span>
                      </div>
                      <div className="font-cinzel font-bold text-sm text-slate-200 group-hover:text-amber-200 transition-colors">
                        {sys.name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {sys.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button disabled={loading} className="w-full glossy-button text-white font-bold py-4 rounded-2xl text-lg tracking-widest uppercase font-cinzel shadow-2xl">
              Generate Life Map ({KUNDALI_SYSTEMS.find(s => s.id === system)?.name})
            </button>
          </form>
        </section>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">☀️</div>
          </div>
          <p className="text-2xl font-cinzel text-amber-200 tracking-widest text-center">
            Constructing {KUNDALI_SYSTEMS.find(s => s.id === system)?.name} Life Map...
          </p>
        </div>
      )}

      {analysis && !loading && (
        <KundaliBookViewer
          details={details}
          system={system}
          analysis={analysis}
          avakahadaData={avakahadaData}
          planetaryPositionsData={planetaryPositionsData}
          displayMahadashas={displayMahadashas}
          displaySaadesati={displaySaadesati}
          language={language}
          onReset={() => setAnalysis(null)}
          chatHistory={chatHistory}
          userQuery={userQuery}
          setUserQuery={setUserQuery}
          chatLoading={chatLoading}
          onAskQuestion={handleAskQuestion}
          onSwitchSystem={(sys) => setSystem(sys)}
        />
      )}
    </div>
  );
};

const KPSummaryItem = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="flex flex-col items-center justify-center p-3 text-center">
    <span className="text-lg mb-1">{icon}</span>
    <p className="text-[9px] uppercase font-black text-amber-500/60 tracking-widest">{label}</p>
    <p className="text-xs font-bold text-slate-200 mt-0.5">{value}</p>
  </div>
);

const InputField = ({ label, value, onChange, type = 'text', placeholder }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.3em] ml-1">{label}</label>
    <input 
      required 
      type={type} 
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/15 rounded-2xl px-6 py-4 text-white focus:ring-1 focus:ring-amber-500 outline-none hover:bg-white/10 transition-all placeholder-slate-800 font-medium" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);

export default KundaliView;
