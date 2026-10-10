
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BirthDetails, Language, ChatMessage, KundaliResponse, KundaliSystem, MahadashaPeriod, SaadesatiPhase } from '../types';
import { getCoordinates, getKundaliAnalysis, askKundaliQuestion } from '../services/aiService';
import { StorageService } from '../services/storageService';
import { KUNDALI_SYSTEMS } from '../constants';
import KundaliChart from './KundaliChart';
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
  const currentYear = new Date().getFullYear();
  const start = parseInt(String(cycle.startYear), 10);
  const end = parseInt(String(cycle.endYear), 10);
  let status = cycle.status?.toLowerCase();
  if (!status && !isNaN(start) && !isNaN(end)) {
    if (currentYear < start) status = 'upcoming';
    else if (currentYear > end) status = 'past';
    else status = 'active';
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
    if (analysis.saadesatiCycles && analysis.saadesatiCycles.length > 0) return analysis.saadesatiCycles;
    return extractSaadesatiFromReport(analysis.report);
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
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.width = '1024px';
            clonedElement.style.backgroundColor = 'white';
            clonedElement.style.color = 'black';
            clonedElement.style.padding = '40px';
            clonedElement.style.borderRadius = '0px';
            clonedElement.style.border = 'none';

            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el: any) => {
              el.style.backgroundColor = 'transparent';
              el.style.color = 'black';
              el.style.backgroundImage = 'none';
              el.style.borderColor = '#dddddd';
              el.style.boxShadow = 'none';
              el.style.textShadow = 'none';
              
              if (el.classList.contains('prose-invert')) {
                el.classList.remove('prose-invert');
              }

              if (el.tagName.toLowerCase() === 'svg') {
                el.style.filter = 'none';
                const svgParts = el.querySelectorAll('line, rect, text, path');
                svgParts.forEach((part: any) => {
                  part.setAttribute('stroke', 'black');
                  if (part.tagName.toLowerCase() === 'text' || part.tagName.toLowerCase() === 'path') {
                    part.setAttribute('fill', 'black');
                    part.style.fill = 'black';
                  }
                  part.style.stroke = 'black';
                });
              }
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Full_Life_Report_${details.name}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 px-2 md:px-0">
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
        <div className="space-y-6 animate-in fade-in duration-1000">
          {/* Quick System Switcher Toolbar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-2 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
            <span className="text-[10px] font-black text-amber-500/80 uppercase tracking-widest whitespace-nowrap pl-2">
              System:
            </span>
            {KUNDALI_SYSTEMS.map((sys) => {
              const isSelected = system === sys.id;
              return (
                <button
                  key={sys.id}
                  onClick={() => setSystem(sys.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <span>{sys.icon}</span>
                  <span>{sys.name}</span>
                </button>
              );
            })}
          </div>

          <div id="kundali-report-area" className="bg-[#010204] rounded-[40px] border border-amber-500/10 overflow-hidden shadow-[0_0_100px_rgba(251,191,36,0.05)]">
            <div className="p-6 md:p-10 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-b from-white/5 to-transparent">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-3xl font-cinzel text-amber-400">Life Map Report: {details.name}</h2>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                    {KUNDALI_SYSTEMS.find(s => s.id === system)?.icon} {KUNDALI_SYSTEMS.find(s => s.id === system)?.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-1">📅 {details.dob}</span> 
                  <span className="flex items-center gap-1">⏰ {details.tob}</span> 
                  <span className="flex items-center gap-1">📍 {details.location}</span>
                </div>
              </div>
              <button onClick={downloadPDF} disabled={exporting} className="bg-white/10 hover:bg-white/20 text-white text-[10px] px-8 py-3 rounded-full border border-white/10 no-print transition-all font-black uppercase tracking-widest">
                {exporting ? 'Processing...' : 'Save Full Life Report'}
              </button>
            </div>

            {/* Dedicated Planetary Timeline Cards: Vimshottari Mahadasha & Shani Saadesati */}
            {(displayMahadashas.length > 0 || displaySaadesati.length > 0) && (
              <div className="p-6 md:p-10 border-b border-white/10 bg-gradient-to-b from-amber-500/[0.04] to-transparent space-y-8">
                {/* Mahadasha Timeline */}
                {displayMahadashas.length > 0 && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-lg md:text-xl font-cinzel font-bold text-amber-300 flex items-center gap-2">
                          <span>⏳</span> Vimshottari Mahadasha Timeline (120-Year Cycle)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Exact planetary period calendar years calculated from birth Nakshatra
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                          Current Dasha Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-3">
                      {displayMahadashas.map((dasha, idx) => {
                        const isCurrent = isDashaActive(dasha);
                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                              isCurrent
                                ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/50'
                                : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                            }`}
                          >
                            {isCurrent && (
                              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-md tracking-wider">
                                Active
                              </div>
                            )}
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-lg">{getPlanetIcon(dasha.planet)}</span>
                                {dasha.durationYears && (
                                  <span className="text-[10px] font-mono font-semibold text-slate-400">
                                    {dasha.durationYears}y
                                  </span>
                                )}
                              </div>
                              <div className={`font-cinzel font-bold text-sm truncate ${isCurrent ? 'text-amber-200' : 'text-slate-200'}`}>
                                {dasha.planet}
                              </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-white/10">
                              <div className={`font-mono font-bold text-xs ${isCurrent ? 'text-amber-300' : 'text-slate-300'}`}>
                                {dasha.startYear} – {dasha.endYear}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Calendar Years
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Shani Saadesati Phases */}
                {displaySaadesati.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-lg md:text-xl font-cinzel font-bold text-amber-300 flex items-center gap-2">
                          <span>🪐</span> Shani Saadesati Timeline (Saturn 7.5-Year Transit)
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Three 2.5-year phases relative to Natal Moon ({analysis.moonSign || 'Chandra'})
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {displaySaadesati.map((cycle, idx) => {
                        const statusBadge = getSaadesatiBadge(cycle);
                        return (
                          <div
                            key={idx}
                            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                              statusBadge.type === 'active'
                                ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/40'
                                : statusBadge.type === 'upcoming'
                                ? 'bg-sky-500/10 border-sky-500/30'
                                : 'bg-white/[0.03] border-white/10'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusBadge.classes}`}>
                                  {statusBadge.label}
                                </span>
                                <span className="font-mono font-bold text-sm text-amber-300">
                                  {cycle.startYear} – {cycle.endYear}
                                </span>
                              </div>
                              <h4 className="font-cinzel font-bold text-base text-slate-100 mb-1">
                                {cycle.phase}
                              </h4>
                              {cycle.description && (
                                <p className="text-xs text-slate-300/90 leading-relaxed mt-2">
                                  {cycle.description}
                                </p>
                              )}
                            </div>
                            <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              <span>Transit Duration</span>
                              <span className="text-slate-300">~2.5 Years</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 p-6 md:p-12">
              <div className="lg:col-span-5 space-y-8">
                <KundaliChart data={analysis.chart} lagnaSign={analysis.lagnaSign} />
                
                <div className="grid grid-cols-2 gap-4 p-6 bg-amber-500/5 border border-amber-500/10 rounded-[32px]">
                   <KPSummaryItem label="Star Lord" value={analysis.starLord} icon="⭐" />
                   <KPSummaryItem label="Sub Lord" value={analysis.subLord} icon="🔮" />
                   <KPSummaryItem label="Nakshatra" value={analysis.nakshatra} icon="✨" />
                   <KPSummaryItem label="Moon Sign" value={analysis.moonSign} icon="🌙" />
                </div>

                <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[32px] no-print">
                   <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                     <span className="text-lg">✨</span> Chart Legend
                   </h4>
                   <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[11px] text-slate-400 font-medium">
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Su</span> <span className="text-slate-200">Sun (Surya)</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Mo</span> <span className="text-slate-200">Moon (Chandra)</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Ma</span> <span className="text-slate-200">Mars (Mangal)</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Me</span> <span className="text-slate-200">Mercury (Budh)</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Ju</span> <span className="text-slate-200">Jupiter (Guru)</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Ve</span> <span className="text-slate-200">Venus (Shukra)</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Sa</span> <span className="text-slate-200">Saturn (Shani)</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Ra</span> <span className="text-slate-200">Rahu</span></div>
                      <div className="flex justify-between border-b border-white/5 pb-1"><span>Ke</span> <span className="text-slate-200">Ketu</span></div>
                   </div>
                </div>
              </div>
              <div className="lg:col-span-7 prose prose-invert prose-amber max-w-none prose-h1:font-cinzel prose-h2:font-cinzel prose-h2:text-amber-400 prose-h3:text-amber-200 prose-p:text-slate-300 leading-relaxed text-sm md:text-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{typeof analysis.report === 'string' ? analysis.report : JSON.stringify(analysis.report)}</ReactMarkdown>
                
                {chatHistory.length > 0 && (
                  <div className="mt-16 pt-8 border-t border-white/10">
                    <h3 className="text-xl font-cinzel text-amber-200 mb-6">Celestial Queries & Insights</h3>
                    <div className="space-y-6">
                      {chatHistory.map((msg, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${msg.role === 'user' ? 'text-amber-500' : 'text-slate-400'}`}>
                            {msg.role === 'user' ? 'Question' : 'Counsel'}
                          </p>
                          <div className="text-slate-300 text-sm leading-relaxed">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-16 pt-8 border-t border-white/10 opacity-60">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">Disclaimer regarding AI Generation</p>
                   <p className="text-[10px] leading-relaxed text-slate-500 font-medium italic">
                      This application translates celestial planetary transits and natal charts based on authentic {KUNDALI_SYSTEMS.find(s => s.id === system)?.name} principles. The astrological insights provide balanced, authentic life guidance for self-reflection and spiritual growth. Consult a qualified Vedic astrologer for major life decisions.
                   </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mirror-card rounded-[40px] p-8 md:p-12 space-y-8 no-print shadow-2xl">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-2xl">🔮</div>
               <div>
                 <h3 className="text-2xl font-cinzel text-amber-200">
                   {KUNDALI_SYSTEMS.find(s => s.id === system)?.name} Consultation
                 </h3>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                   Ask detailed questions based on your {KUNDALI_SYSTEMS.find(s => s.id === system)?.name} chart
                 </p>
               </div>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto space-y-6 pr-4 no-scrollbar border-y border-white/5 py-6">
              {chatHistory.length === 0 && (
                <div className="text-center py-10 text-slate-600 text-sm italic font-light">
                  "How will my career progress during my Jupiter Mahadasha?" • "When is my next Sade Sati cycle starting?"
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-amber-600/20 border border-amber-500/30 text-amber-50 rounded-tr-none shadow-lg' 
                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none prose prose-invert prose-sm'
                  }`}>
                    {msg.role === 'user' ? msg.text : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2 items-center text-amber-500/50 text-[10px] font-black uppercase tracking-[0.2em]">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-75" />
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150" />
                  Consulting the Akashic records...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAskQuestion} className="flex gap-4">
              <input 
                value={userQuery} 
                onChange={(e) => setUserQuery(e.target.value)} 
                type="text" 
                placeholder="Seek deeper lifetime insights..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:ring-1 focus:ring-amber-500 outline-none text-white transition-all placeholder-slate-700 font-medium" 
              />
              <button 
                disabled={chatLoading || !userQuery.trim()} 
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-10 rounded-2xl text-xs uppercase transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                Query
              </button>
            </form>
          </section>

          <button onClick={() => setAnalysis(null)} className="text-slate-600 hover:text-amber-500 mx-auto block no-print text-[10px] font-black uppercase tracking-[0.5em] transition-all py-8">
            ↺ Reset and Cast New Chart
          </button>
        </div>
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
