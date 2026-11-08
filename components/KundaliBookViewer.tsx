import React, { useState, useMemo, useRef } from 'react';
import { BirthDetails, Language, ChatMessage, KundaliResponse, KundaliSystem, MahadashaPeriod, SaadesatiPhase, AvakahadaDetails, PlanetaryPositionDetail, BhavaDetailedAnalysis } from '../types';
import { KUNDALI_SYSTEMS } from '../constants';
import { ensureValidKundaliChart, calculate12BhavasDetailedAnalysis } from '../services/astrologyHelper';
import KundaliChart from './KundaliChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface KundaliBookViewerProps {
  details: BirthDetails;
  system: KundaliSystem;
  analysis: KundaliResponse;
  avakahadaData: AvakahadaDetails | null;
  planetaryPositionsData: PlanetaryPositionDetail[];
  displayMahadashas: MahadashaPeriod[];
  displaySaadesati: SaadesatiPhase[];
  language: Language;
  onReset: () => void;
  chatHistory: ChatMessage[];
  userQuery: string;
  setUserQuery: (q: string) => void;
  chatLoading: boolean;
  onAskQuestion: (e: React.FormEvent) => void;
  onSwitchSystem?: (sys: KundaliSystem) => void;
}

interface ParsedChapter {
  id: string;
  title: string;
  cleanTitle: string;
  icon: string;
  content: string;
  strengths: string[];
  cautions: string[];
  remedies: string[];
}

const PLANET_ICONS: Record<string, string> = {
  Sun: '☀️', Surya: '☀️',
  Moon: '🌙', Chandra: '🌙',
  Mars: '♂️', Mangal: '♂️',
  Mercury: '☿', Budh: '☿',
  Jupiter: '♃', Guru: '♃',
  Venus: '♀', Shukra: '♀',
  Saturn: '🪐', Shani: '🪐',
  Rahu: '☊', Ketu: '☋',
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

/* Traditional Ornate Vedic Book Corner & Border Flourishes */
const BookBorderFlourish: React.FC<{ theme: 'parchment' | 'velvet' }> = ({ theme }) => {
  const strokeColor = theme === 'parchment' ? '#b45309' : '#f59e0b';
  const fillGold = theme === 'parchment' ? '#d97706' : '#fbbf24';

  return (
    <div className="absolute inset-0 pointer-events-none p-3 sm:p-5 select-none z-10">
      {/* Outer Golden Border */}
      <div 
        className="w-full h-full rounded-2xl sm:rounded-3xl relative border"
        style={{ borderColor: strokeColor, borderWidth: '2px', borderStyle: 'solid' }}
      >
        {/* Inner Thin Inset Border */}
        <div 
          className="absolute inset-1 sm:inset-2 rounded-xl sm:rounded-2xl border"
          style={{ borderColor: strokeColor, borderWidth: '1px', borderStyle: 'dashed', opacity: 0.6 }}
        />

        {/* Top Left Corner Flourish */}
        <svg className="absolute -top-1 -left-1 w-8 h-8 sm:w-12 sm:h-12" viewBox="0 0 48 48" fill="none">
          <path d="M4 24C4 12.9543 12.9543 4 24 4" stroke={strokeColor} strokeWidth="2.5" />
          <path d="M8 24C8 15.1634 15.1634 8 24 8" stroke={fillGold} strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="24" cy="4" r="3" fill={fillGold} />
          <circle cx="4" cy="24" r="3" fill={fillGold} />
          <circle cx="12" cy="12" r="3.5" fill={fillGold} />
        </svg>

        {/* Top Right Corner Flourish */}
        <svg className="absolute -top-1 -right-1 w-8 h-8 sm:w-12 sm:h-12" viewBox="0 0 48 48" fill="none">
          <path d="M44 24C44 12.9543 35.0457 4 24 4" stroke={strokeColor} strokeWidth="2.5" />
          <path d="M40 24C40 15.1634 32.8366 8 24 8" stroke={fillGold} strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="24" cy="4" r="3" fill={fillGold} />
          <circle cx="44" cy="24" r="3" fill={fillGold} />
          <circle cx="36" cy="12" r="3.5" fill={fillGold} />
        </svg>

        {/* Bottom Left Corner Flourish */}
        <svg className="absolute -bottom-1 -left-1 w-8 h-8 sm:w-12 sm:h-12" viewBox="0 0 48 48" fill="none">
          <path d="M4 24C4 35.0457 12.9543 44 24 44" stroke={strokeColor} strokeWidth="2.5" />
          <path d="M8 24C8 32.8366 15.1634 40 24 40" stroke={fillGold} strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="24" cy="44" r="3" fill={fillGold} />
          <circle cx="4" cy="24" r="3" fill={fillGold} />
          <circle cx="12" cy="36" r="3.5" fill={fillGold} />
        </svg>

        {/* Bottom Right Corner Flourish */}
        <svg className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-12 sm:h-12" viewBox="0 0 48 48" fill="none">
          <path d="M44 24C44 35.0457 35.0457 44 24 44" stroke={strokeColor} strokeWidth="2.5" />
          <path d="M40 24C40 32.8366 32.8366 40 24 40" stroke={fillGold} strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="24" cy="44" r="3" fill={fillGold} />
          <circle cx="44" cy="24" r="3" fill={fillGold} />
          <circle cx="36" cy="36" r="3.5" fill={fillGold} />
        </svg>

        {/* Top Header Motif */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
          style={{
            backgroundColor: theme === 'parchment' ? '#f5eedb' : '#0a0d18',
            color: fillGold,
            border: `1px solid ${strokeColor}`
          }}
        >
          <span>✦</span>
          <span>ॐ</span>
          <span>✦</span>
        </div>

        {/* Bottom Footer Motif */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
          style={{
            backgroundColor: theme === 'parchment' ? '#f5eedb' : '#0a0d18',
            color: fillGold,
            border: `1px solid ${strokeColor}`
          }}
        >
          <span>⚜</span>
          <span>शुभम् भवतु</span>
          <span>⚜</span>
        </div>
      </div>
    </div>
  );
};

export const KundaliBookViewer: React.FC<KundaliBookViewerProps> = ({
  details,
  system,
  analysis,
  avakahadaData,
  planetaryPositionsData,
  displayMahadashas,
  displaySaadesati,
  language,
  onReset,
  chatHistory,
  userQuery,
  setUserQuery,
  chatLoading,
  onAskQuestion,
  onSwitchSystem,
}) => {
  // Reading Mode: 'spread' (open 2-page book spread) vs 'scroll' (continuous manuscript)
  const [readingMode, setReadingMode] = useState<'spread' | 'scroll'>('spread');
  // Book Theme: 'parchment' (antique gold & ivory paper) vs 'velvet' (midnight indigo velvet)
  const [bookTheme, setBookTheme] = useState<'parchment' | 'velvet'>('parchment');
  // Current active page index (0 to totalPages - 1)
  const [currentPage, setCurrentPage] = useState<number>(0);
  // Active selected house for the 12 Bhava in-depth codex (1 to 12)
  const [selectedBhava, setSelectedBhava] = useState<number>(1);
  // PDF Generation State
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Compute 12 Bhavas exhaustive Vedic analysis
  const bhavasDetailed: BhavaDetailedAnalysis[] = useMemo(() => {
    return calculate12BhavasDetailedAnalysis(
      analysis.lagnaSign || 1,
      planetaryPositionsData,
      language
    );
  }, [analysis.lagnaSign, planetaryPositionsData, language]);

  // Parse markdown report into structured chapters
  const parsedChapters: ParsedChapter[] = useMemo(() => {
    const reportText = typeof analysis.report === 'string' ? analysis.report : JSON.stringify(analysis.report);
    if (!reportText) return [];

    const lines = reportText.split('\n');
    const chapters: ParsedChapter[] = [];
    let curTitle = 'Cosmic Personality & Soul Blueprint';
    let curLines: string[] = [];

    const flush = () => {
      const content = curLines.join('\n').trim();
      if (content || chapters.length === 0) {
        const clean = curTitle.replace(/^[#\d\.\s\-\*]+/, '').trim() || 'Astrological Synthesis';
        
        // Scan for strengths, cautions, remedies
        const strengths: string[] = [];
        const cautions: string[] = [];
        const remedies: string[] = [];
        const bLines = content.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*'));

        for (const line of bLines) {
          const lower = line.toLowerCase();
          if ((lower.includes('remedy') || lower.includes('upaya') || lower.includes('mantra') || lower.includes('gemstone') || lower.includes('उपाय') || lower.includes('मन्त्र') || lower.includes('मंत्र') || lower.includes('दान')) && remedies.length < 3) {
            remedies.push(line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim());
          } else if ((lower.includes('caution') || lower.includes('delay') || lower.includes('challenge') || lower.includes('stress') || lower.includes('सतर्क') || lower.includes('चुनौती') || lower.includes('बाधा') || lower.includes('कठिनाई')) && cautions.length < 3) {
            cautions.push(line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim());
          } else if ((lower.includes('favor') || lower.includes('strength') || lower.includes('boon') || lower.includes('gain') || lower.includes('शुभ') || lower.includes('वरदान') || lower.includes('लाभ') || lower.includes('सफलता')) && strengths.length < 3) {
            strengths.push(line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim());
          }
        }

        const lowerClean = clean.toLowerCase();
        let icon = '📜';
        if (lowerClean.includes('career') || lowerClean.includes('karma') || lowerClean.includes('कर्म') || lowerClean.includes('व्यवसाय') || lowerClean.includes('दशम भाव')) {
          icon = '💼';
        } else if (lowerClean.includes('marriage') || lowerClean.includes('love') || lowerClean.includes('विवाह') || lowerClean.includes('दाम्पत्य') || lowerClean.includes('सप्तम भाव')) {
          icon = '💖';
        } else if (lowerClean.includes('wealth') || lowerClean.includes('finance') || lowerClean.includes('धन') || lowerClean.includes('सम्पत्ति') || lowerClean.includes('द्वितीय भाव') || lowerClean.includes('एकादश भाव')) {
          icon = '💰';
        } else if (lowerClean.includes('health') || lowerClean.includes('vitality') || lowerClean.includes('स्वास्थ्य') || lowerClean.includes('आरोग्य') || lowerClean.includes('आयुर्वेद') || lowerClean.includes('षष्ठ भाव')) {
          icon = '🩺';
        } else if (lowerClean.includes('remed') || lowerClean.includes('upaya') || lowerClean.includes('उपाय') || lowerClean.includes('मन्त्र')) {
          icon = '🪔';
        } else if (lowerClean.includes('overview') || lowerClean.includes('lagna') || lowerClean.includes('लग्न') || lowerClean.includes('प्रथम भाव')) {
          icon = '☀️';
        } else if (lowerClean.includes('भाग्य') || lowerClean.includes('dharma') || lowerClean.includes('नवम भाव')) {
          icon = '🕉️';
        } else if (lowerClean.includes('सुख') || lowerClean.includes('चतुर्थ भाव')) {
          icon = '🏡';
        } else if (lowerClean.includes('पुत्र') || lowerClean.includes('बुद्धि') || lowerClean.includes('पंचम भाव')) {
          icon = '💡';
        }

        chapters.push({
          id: `chap-${chapters.length}`,
          title: curTitle,
          cleanTitle: clean,
          icon,
          content,
          strengths,
          cautions,
          remedies
        });
      }
      curLines = [];
    };

    for (const l of lines) {
      if (l.startsWith('# ') || l.startsWith('## ') || l.startsWith('### ')) {
        flush();
        curTitle = l.replace(/^[#]+\s*/, '').trim();
      } else {
        curLines.push(l);
      }
    }
    flush();

    return chapters;
  }, [analysis.report]);

  // Dedicated Separate Pages for Each of the 12 Bhavas.
  // If details overflow from a single page, an additional page is automatically added to accommodate it.
  const bhavaPages = useMemo(() => {
    const pages: Array<{
      bhava: BhavaDetailedAnalysis;
      part: 1 | 2;
      totalParts: 1 | 2;
      pageTitle: string;
      chapterNumber: number;
    }> = [];

    bhavasDetailed.forEach((b, bIdx) => {
      const chapterNumber = bIdx + 5; // e.g. House 1 is Chapter 5, House 12 is Chapter 16
      // If detailed analysis is substantial or has resident planets or full 9-point pillars,
      // it cleanly spans across 2 dedicated pages so nothing is cramped or clipped.
      const isDetailedOverflowing =
        b.detailedAnalysis.length > 240 ||
        b.planets.length > 0 ||
        (b.boons.length + b.cautions.length + b.remedies.length) >= 5;

      if (isDetailedOverflowing) {
        // Part 1: Cosmic Coordinates & Deep Astrological Narrative
        pages.push({
          bhava: b,
          part: 1,
          totalParts: 2,
          pageTitle: `${b.sanskritName} • स्वरूप एवं विश्लेषण`,
          chapterNumber
        });
        // Part 2: Added page to cleanly accommodate Boons, Cautions & Vedic Upayas
        pages.push({
          bhava: b,
          part: 2,
          totalParts: 2,
          pageTitle: `${b.sanskritName} • फलकथन एवं वैदिक उपाय`,
          chapterNumber
        });
      } else {
        // Fits comfortably on 1 dedicated page
        pages.push({
          bhava: b,
          part: 1,
          totalParts: 1,
          pageTitle: b.sanskritName,
          chapterNumber
        });
      }
    });

    return pages;
  }, [bhavasDetailed]);

  // Page index offsets:
  // Page 0: Royal Book Cover
  // Page 1: Janma Kundali Chart & Graha Sphuta
  // Page 2: Avakahada Chakra & Birth Panchanga
  // Page 3: Navagraha Matrix & Purushartha Life Pillars
  // Page 4: Vimshottari Mahadasha Timeline & Shani Sade Sati
  // Pages 5 .. (5 + bhavaPages.length - 1): Separate Dedicated Pages for each Bhava!
  // Pages (5 + bhavaPages.length) .. : Dynamic AI Chapters
  // Last Page: Epilogue, Vedic Mantras & Certified Seal
  const bhavaStartPage = 5;
  const aiChaptersStartPage = bhavaStartPage + bhavaPages.length;
  const totalPages = aiChaptersStartPage + Math.max(1, parsedChapters.length) + 1;

  // Jump to next spread or page
  const handleNext = () => {
    if (readingMode === 'spread') {
      setCurrentPage((prev) => Math.min(prev + 2, totalPages - (totalPages % 2 === 0 ? 2 : 1)));
    } else {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
    }
  };

  // Jump to prev spread or page
  const handlePrev = () => {
    if (readingMode === 'spread') {
      setCurrentPage((prev) => Math.max(prev - 2, 0));
    } else {
      setCurrentPage((prev) => Math.max(prev - 1, 0));
    }
  };

  // Dedicated High-Fidelity Book-Style PDF Generator
  const downloadBookPDF = async () => {
    if (pdfGenerating) return;
    setPdfGenerating(true);
    setPdfStatus('Initiating Sacred Vedic Book compilation...');

    const originalScrollX = window.scrollX;
    const originalScrollY = window.scrollY;

    try {
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 200));

      // Target the container that holds all rendered book pages in dedicated print layout
      const printContainer = document.getElementById('kundali-book-pdf-container');
      if (!printContainer) throw new Error('PDF book container not found in DOM.');

      const pageElements = printContainer.querySelectorAll('.book-pdf-page');
      if (pageElements.length === 0) throw new Error('No book pages found.');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i] as HTMLElement;
        setPdfStatus(`Binding Book Page ${i + 1} of ${pageElements.length}...`);

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: bookTheme === 'parchment' ? '#faf6ed' : '#05070e',
          windowWidth: 1050,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      }

      setPdfStatus('Finalizing Astrological Life Book...');
      await new Promise(r => setTimeout(r, 250));

      const safeNative = (details.name || 'Jataka').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`Vedic_Janma_Kundali_Book_${safeNative}.pdf`);
    } catch (err: any) {
      console.error('Book PDF export failed:', err);
      alert('Could not complete Book PDF export. Please try using standard print (Ctrl+P).');
    } finally {
      window.scrollTo(originalScrollX, originalScrollY);
      setPdfGenerating(false);
      setPdfStatus('');
    }
  };

  // Helper theme classes
  const isParchment = bookTheme === 'parchment';
  const pageBgClass = isParchment ? 'book-page-parchment' : 'book-page-velvet';
  const textTitleClass = isParchment ? 'text-amber-950' : 'text-amber-200';
  const textSubClass = isParchment ? 'text-stone-700' : 'text-slate-300';
  const textMutedClass = isParchment ? 'text-amber-900/70' : 'text-slate-400';
  const cardBgClass = isParchment ? 'bg-amber-900/[0.04] border-amber-900/20' : 'bg-white/[0.03] border-white/10';
  const goldHeadingClass = isParchment ? 'text-amber-900' : 'text-amber-400';

  // Render Page Content by Page Number
  const renderBookPage = (pageIdx: number, isPdfMode: boolean = false) => {
    // Page 0: Royal Book Cover
    if (pageIdx === 0) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none text-center">
          <BookBorderFlourish theme={bookTheme} />

          {/* Top Sanskrit Invocation */}
          <div className="pt-4 sm:pt-6">
            <p className="font-devanagari text-xs sm:text-sm tracking-[0.3em] font-bold text-amber-600 dark:text-amber-400 uppercase">
              ॥ श्री गणेशाय नमः ॥ • ॥ ॐ गं गणपतये नमः ॥
            </p>
            <p className="text-[10px] tracking-[0.25em] text-stone-500 dark:text-slate-500 uppercase mt-1 font-cinzel">
              Authentic Vedic Astrological Granth
            </p>
          </div>

          {/* Majestic Center Mandala & Book Title */}
          <div className="my-auto py-6 sm:py-8 space-y-4 sm:space-y-6">
            {/* Sacred Sun-Moon Zodiac Mandala */}
            <div className="relative w-28 h-28 sm:w-40 sm:h-40 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-500/40 animate-spin" style={{ animationDuration: '40s' }}></div>
              <div className="absolute inset-2 rounded-full border border-dashed border-amber-500/60 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-5 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/10 flex items-center justify-center text-4xl sm:text-6xl shadow-inner">
                ☀️
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-devanagari font-black tracking-wide text-amber-700 dark:text-amber-300 drop-shadow-sm">
                वृहत् जन्म कुण्डली ग्रन्थ
              </h1>
              <h2 className="text-xs sm:text-base font-cinzel tracking-[0.25em] font-bold mt-2 uppercase text-stone-700 dark:text-amber-200/90">
                Vedic Janma Patrika • Life Destiny Codex
              </h2>
              <div className="w-28 sm:w-48 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-3"></div>
            </div>

            {/* Native Name Royal Plaque */}
            <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 shadow-lg relative bg-gradient-to-b from-amber-500/10 to-amber-500/5">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 block mb-1">
                जातकाभिधान (Name of Native)
              </span>
              <div className="text-xl sm:text-3xl font-cinzel font-black tracking-wider text-amber-900 dark:text-amber-100">
                {details.name || 'Jataka (Seeker)'}
              </div>
            </div>

            {/* Birth Details Grid Cartouche */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-2xl mx-auto text-left text-xs">
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">📅 जन्म तिथि</span>
                <span className="font-mono font-bold text-xs">{details.dob || '—'}</span>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">⏰ जन्म समय</span>
                <span className="font-mono font-bold text-xs">{details.tob || '—'}</span>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">📍 जन्म स्थान</span>
                <span className="break-words block font-semibold text-xs leading-snug" title={details.location}>{details.location || '—'}</span>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">🌌 सिद्धान्त</span>
                <span className="break-words block font-semibold text-xs leading-snug">{KUNDALI_SYSTEMS.find(s => s.id === system)?.name}</span>
              </div>
            </div>

            {/* Classical Sanskrit Shloka */}
            <div className="max-w-md mx-auto pt-2">
              <p className="font-devanagari text-xs sm:text-sm italic text-stone-600 dark:text-amber-300/80 leading-relaxed">
                "ग्रहाधीनं जगत्सर्वं ग्रहाधीना नराधिपाः।<br />
                कालधीनाश्च ते सर्वे यस्माद् ग्रहबलाबलम्॥"
              </p>
              <p className="text-[9px] uppercase tracking-wider text-stone-500 dark:text-slate-500 mt-1">
                — फलदीपिका (Phaladeepika)
              </p>
            </div>
          </div>

          {/* Bottom Stamp & Seal */}
          <div className="pb-4 sm:pb-6 flex items-center justify-between border-t border-amber-500/20 pt-3 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>श्री ज्योतिषपीठ प्रमाणीकरण</span>
            <span>पृष्ठ १ • मुखपृष्ठ</span>
            <span>संस्करणीय ग्रन्थ</span>
          </div>
        </div>
      );
    }

    // Page 1: Janma Kundali Chart & Graha Sphuta
    if (pageIdx === 1) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-4 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                अध्याय १ • Chapter I
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                जन्म लग्न चक्र एवं ग्रह स्पष्ट (Chart & Sphutas)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {KUNDALI_SYSTEMS.find(s => s.id === system)?.name}
            </span>
          </div>

          {/* Chart & Core Sphuta Grid */}
          <div className="space-y-4 my-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* North Indian Diamond Chart */}
              <div className="md:col-span-7 flex justify-center p-3 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20">
                <div className="scale-90 sm:scale-100 transform origin-center">
                  <KundaliChart
                    data={ensureValidKundaliChart(analysis.chart, planetaryPositionsData)}
                    lagnaSign={analysis.lagnaSign || 1}
                    onSelectHouse={(h) => {
                      setSelectedBhava(h);
                      const targetIdx = bhavaPages.findIndex(bp => bp.bhava.houseNumber === h);
                      if (targetIdx !== -1) {
                        setCurrentPage(bhavaStartPage + targetIdx);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Four Cardinal Coordinates */}
              <div className="md:col-span-5 grid grid-cols-2 gap-2 text-xs">
                <div className={`p-3 rounded-xl border ${cardBgClass} text-center`}>
                  <span className="text-base block mb-0.5">⭐</span>
                  <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">Star Lord</span>
                  <span className="font-bold text-xs">{analysis.starLord || 'Surya'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass} text-center`}>
                  <span className="text-base block mb-0.5">🔮</span>
                  <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">Sub Lord</span>
                  <span className="font-bold text-xs">{analysis.subLord || 'Guru'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass} text-center`}>
                  <span className="text-base block mb-0.5">✨</span>
                  <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">Nakshatra</span>
                  <span className="font-bold text-xs">{analysis.nakshatra || 'Rohini'}</span>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass} text-center`}>
                  <span className="text-base block mb-0.5">🌙</span>
                  <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">Moon Sign</span>
                  <span className="font-bold text-xs">{analysis.moonSign || 'Taurus'}</span>
                </div>
              </div>
            </div>

            {/* Graha Sphuta Position Table */}
            {planetaryPositionsData.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-amber-500/[0.02]">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-amber-500/20 bg-amber-500/10 font-cinzel text-amber-800 dark:text-amber-300">
                      <th className="py-1.5 px-3">ग्रह (Planet)</th>
                      <th className="py-1.5 px-3">राशि (Sign)</th>
                      <th className="py-1.5 px-3">भाव (House)</th>
                      <th className="py-1.5 px-3">स्थिति (Dignity)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10">
                    {planetaryPositionsData.map((pos) => {
                      const isHindi = language === 'Hindi';
                      const cleanSanskrit = pos.planetSanskrit.replace(/•|\(|\)/g, ' ').replace(/\s+/g, ' ').trim();
                      const sanskritHindiWord = cleanSanskrit.match(/[\u0900-\u097F]+/)?.[0] || pos.planet;
                      const sanskritRomanWord = cleanSanskrit.match(/[a-zA-Z]+/)?.[0] || pos.planet;

                      const planetDisplay = isHindi
                        ? `${sanskritHindiWord} (${pos.planet})`
                        : `${pos.planet} (${sanskritHindiWord || sanskritRomanWord})`;

                      const cleanSignSanskrit = (pos.signSanskrit || '').replace(/•|\(|\)/g, ' ').replace(/\s+/g, ' ').trim();
                      const signDisplay = isHindi
                        ? `${cleanSignSanskrit || pos.sign} (${pos.sign})`
                        : `${pos.sign}${cleanSignSanskrit ? ` (${cleanSignSanskrit})` : ''}`;

                      const houseDisplay = isHindi
                        ? `भाव ${pos.house} (H${pos.house})`
                        : `House ${pos.house}`;

                      return (
                        <tr key={pos.planet} className="hover:bg-amber-500/5">
                          <td className="py-1 px-3 font-semibold flex items-center gap-1.5">
                            <span>{pos.icon}</span>
                            <span>{planetDisplay}</span>
                          </td>
                          <td className="py-1 px-3">{signDisplay}</td>
                          <td className="py-1 px-3 font-mono font-bold">{houseDisplay}</td>
                          <td className="py-1 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30">
                              {pos.dignity}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>वृहत् जन्म कुण्डली ग्रन्थ</span>
            <span>— पृष्ठ २ —</span>
            <span>जन्म लग्न चक्र</span>
          </div>
        </div>
      );
    }

    // Page 2: Avakahada Chakra & Birth Panchanga
    if (pageIdx === 2) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-4 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                अध्याय २ • Chapter II
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                अवकहड़ा चक्र एवं अष्टकूट पंचांग (8 Cosmic Pillars)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              Panchanga Granth
            </span>
          </div>

          {/* Avakahada 8 Cosmic Pillars */}
          {avakahadaData ? (
            <div className="space-y-4 my-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">१. वर्ण (Varna)</span>
                  <p className="font-bold text-sm mt-0.5">{avakahadaData.varna}</p>
                  <p className="text-[9px] opacity-75">Spiritual Temperament</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">२. वश्य (Vashya)</span>
                  <p className="font-bold text-sm mt-0.5">{avakahadaData.vashya}</p>
                  <p className="text-[9px] opacity-75">Dominance & Alignment</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">३. योनि (Yoni)</span>
                  <p className="font-bold text-sm mt-0.5">{avakahadaData.yoni} ({avakahadaData.yoniAnimal})</p>
                  <p className="text-[9px] opacity-75">Instinctive Nature</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">४. गण (Gana)</span>
                  <p className="font-bold text-sm mt-0.5">{avakahadaData.gana} Gana</p>
                  <p className="text-[9px] opacity-85 leading-snug break-words">{avakahadaData.ganaDescription}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">५. नाड़ी (Nadi)</span>
                  <p className="font-bold text-sm mt-0.5">{avakahadaData.nadi} ({avakahadaData.nadiAyurveda})</p>
                  <p className="text-[9px] opacity-75">Bio-Energetic Pulse</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">६. पाया (Paya)</span>
                  <p className="font-bold text-sm mt-0.5">{avakahadaData.paya}</p>
                  <p className="text-[9px] opacity-75">Foundational Leg</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">७. तत्व (Tatva)</span>
                  <p className="font-bold text-sm mt-0.5">{avakahadaData.tatva}</p>
                  <p className="text-[9px] opacity-75">Elemental Core</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">८. पक्ष / तिथि (Panchang)</span>
                  <p className="font-bold text-sm mt-0.5">{avakahadaData.paksha} {avakahadaData.tithi}</p>
                  <p className="text-[9px] opacity-75">Yoga: {avakahadaData.yoga}</p>
                </div>
              </div>

              {/* Manglik Dosha Verification Cartouche */}
              <div className={`p-3.5 rounded-2xl border ${cardBgClass} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">🛡️</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block text-amber-700 dark:text-amber-300">
                      माङ्गलिक दोष विचार (Manglik Assessment)
                    </span>
                    <p className="text-[11px] opacity-80 break-words leading-snug">
                      Status: {avakahadaData.manglikStatus.isManglik ? `Active (${avakahadaData.manglikStatus.severity})` : 'Nir-dosha (No Manglik Affliction)'}
                      {avakahadaData.manglikStatus.hasParihara && ' • Parihara (Nullification) Present'}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase flex-shrink-0 ${
                  avakahadaData.manglikStatus.isManglik ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {avakahadaData.manglikStatus.isManglik ? 'Caution' : 'Auspicious'}
                </span>
              </div>

              {/* Sacred Lucky Matrix */}
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04]">
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 mb-2">
                  शुभ तत्त्व सारिणी (Sacred Vedic Lucky Matrix)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">रत्न (Gemstone):</span> <strong className="break-words block leading-snug">{avakahadaData.luckyGem}</strong></div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">धातु (Metal):</span> <strong className="break-words block leading-snug">{avakahadaData.luckyMetal}</strong></div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">शुभ वार (Day):</span> <strong className="break-words block leading-snug">{avakahadaData.luckyDay}</strong></div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">शुभ दिशा (Direction):</span> <strong className="break-words block leading-snug">{avakahadaData.luckyDirection}</strong></div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">शुभ अंक (Number):</span> <strong className="break-words block leading-snug">{avakahadaData.luckyNumber}</strong></div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">शुभ रंग (Color):</span> <strong className="break-words block leading-snug">{avakahadaData.luckyColor}</strong></div>
                  <div className="col-span-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">इष्ट देव (Ishta Devata):</span> <strong className="break-words block leading-snug">{avakahadaData.luckyDeity}</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs opacity-75">Avakahada details compiling...</div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>अवकहड़ा चक्र</span>
            <span>— पृष्ठ ३ —</span>
            <span>अष्टकूट पंचांग</span>
          </div>
        </div>
      );
    }

    // Page 3: Navagraha Matrix & Purushartha Life Pillars
    if (pageIdx === 3) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-4 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                अध्याय ३ • Chapter III
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                नवग्रह प्रभाव एवं ४ पुरुषार्थ (Grahas & Purusharthas)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              Navagraha Matrix
            </span>
          </div>

          <div className="space-y-4 my-auto">
            {/* 4 Purushartha Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xl">🕉️</span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">धर्म</span>
                </div>
                <h4 className="font-bold text-xs mt-1">Dharma (H 1,5,9)</h4>
                <p className="text-[9px] opacity-75 mt-0.5">Soul purpose & moral code</p>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xl">💰</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">अर्थ</span>
                </div>
                <h4 className="font-bold text-xs mt-1">Artha (H 2,6,10)</h4>
                <p className="text-[9px] opacity-75 mt-0.5">Wealth, career & resources</p>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xl">💖</span>
                  <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400">काम</span>
                </div>
                <h4 className="font-bold text-xs mt-1">Kama (H 3,7,11)</h4>
                <p className="text-[9px] opacity-75 mt-0.5">Desires, love & kinship</p>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xl">🌊</span>
                  <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">मोक्ष</span>
                </div>
                <h4 className="font-bold text-xs mt-1">Moksha (H 4,8,12)</h4>
                <p className="text-[9px] opacity-75 mt-0.5">Liberation & inner silence</p>
              </div>
            </div>

            {/* Navagraha 9 Planetary Disposition Cards */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {planetaryPositionsData.slice(0, 9).map((pos) => {
                const isHindi = language === 'Hindi';
                const cleanSanskrit = pos.planetSanskrit.replace(/•|\(|\)/g, ' ').replace(/\s+/g, ' ').trim();
                const sanskritHindiWord = cleanSanskrit.match(/[\u0900-\u097F]+/)?.[0] || pos.planet;
                const nameDisplay = isHindi ? `${sanskritHindiWord} (${pos.planet})` : `${pos.planet}`;
                const cleanSignSanskrit = (pos.signSanskrit || '').replace(/•|\(|\)/g, ' ').replace(/\s+/g, ' ').trim();
                const signDisplay = isHindi && cleanSignSanskrit
                  ? `${cleanSignSanskrit} • भाव ${pos.house}`
                  : `${pos.sign} • H${pos.house}`;

                return (
                  <div key={pos.planet} className={`p-2.5 rounded-xl border ${cardBgClass} flex items-center gap-2`}>
                    <span className="text-xl flex-shrink-0">{pos.icon}</span>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs break-words block leading-snug">{nameDisplay}</span>
                      <span className="text-[9px] opacity-80 break-words block leading-snug">{signDisplay}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] text-xs leading-relaxed text-stone-700 dark:text-slate-300">
              <strong className="text-amber-600 dark:text-amber-400 block mb-1">ज्योतिषीय दृष्टि (Astrological Insight):</strong>
              The planetary dispositions in your Janma Kundali reflect the accumulated Prarabdha Karma. The alignment of Grahas across the four Purusharthas indicates that conscious spiritual action (Upaya) and dedicated effort can harmonize all planetary transits.
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>नवग्रह स्थिति</span>
            <span>— पृष्ठ ४ —</span>
            <span>पुरुषार्थ ग्रन्थ</span>
          </div>
        </div>
      );
    }

    // Page 4: Vimshottari Mahadasha Timeline & Shani Sade Sati
    if (pageIdx === 4) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-4 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                अध्याय ४ • Chapter IV
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                विंशोत्तरी महादशा काल चक्र एवं साढ़ेसाती
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              120-Year Timeline
            </span>
          </div>

          <div className="space-y-4 my-auto">
            {/* 120-Year Vimshottari Mahadasha Chronological Table */}
            {displayMahadashas.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-2 flex items-center justify-between">
                  <span>⏳ विंशोत्तरी महादशा चक्र (120-Year Planetary Cycles)</span>
                  <span className="text-[9px] font-normal text-stone-500 dark:text-slate-400">Current Dasha Marked with Royal Seal</span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 sm:gap-2">
                  {displayMahadashas.map((dasha, idx) => {
                    const isCurrent = isDashaActive(dasha);
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isCurrent
                            ? 'bg-amber-500/25 border-amber-500 shadow-md ring-1 ring-amber-400 font-bold'
                            : cardBgClass
                        }`}
                      >
                        <span className="text-base block">{getPlanetIcon(dasha.planet)}</span>
                        <span className="text-[10px] font-bold block break-words leading-tight">{dasha.planet}</span>
                        <span className="text-[9px] font-mono text-amber-700 dark:text-amber-300 block whitespace-nowrap">
                          {dasha.startYear}–{dasha.endYear}
                        </span>
                        {isCurrent && (
                          <span className="text-[8px] uppercase tracking-widest font-black text-amber-900 dark:text-amber-200 block bg-amber-400/30 rounded mt-0.5">
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shani Sade Sati 3-Phase Transit Timeline */}
            {displaySaadesati.length > 0 && (
              <div className="pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                  <span>🪐</span>
                  <span>शनि साढ़ेसाती चक्र (Saturn 7.5-Year Transit Relative to Moon)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {displaySaadesati.map((cycle, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${cardBgClass} flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            {cycle.status || 'Transit'}
                          </span>
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                            {cycle.startDate && cycle.endDate ? `${cycle.startDate}–${cycle.endDate}` : `${cycle.startYear}–${cycle.endYear}`}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs">{cycle.phase}</h5>
                        {cycle.description && (
                          <p className="text-[10px] opacity-90 mt-1 leading-relaxed break-words">
                            {cycle.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>महादशा एवं साढ़ेसाती</span>
            <span>— पृष्ठ ५ —</span>
            <span>कालचक्र संहिता</span>
          </div>
        </div>
      );
    }

    // Pages 5 .. (5 + bhavaPages.length - 1): DEDICATED SEPARATE PAGES FOR EACH BHAVA
    // If details overflow from a single page, an extra continuation page (Part 2) is automatically inserted.
    if (pageIdx >= bhavaStartPage && pageIdx < aiChaptersStartPage) {
      const bhavaPageIdx = pageIdx - bhavaStartPage;
      const { bhava, part, totalParts, pageTitle, chapterNumber } = bhavaPages[bhavaPageIdx];
      const hasPlanets = bhava.planets.length > 0;

      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-2 pt-1">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span>अध्याय {chapterNumber} • CHAPTER {chapterNumber}</span>
                {totalParts > 1 && (
                  <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono text-[8px] font-bold">
                    भाग {part}/{totalParts}
                  </span>
                )}
              </span>
              <h3 className={`text-base sm:text-lg font-devanagari font-bold ${textTitleClass}`}>
                {pageTitle}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                {bhava.classification.split('(')[0]?.trim()}
              </span>
              <span className="text-[9px] font-mono text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full border border-sky-500/30 hidden sm:inline">
                {bhava.purushartha.split('(')[0]?.trim()}
              </span>
            </div>
          </div>

          {/* 12-House Quick Mini Navigator */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 border-b border-amber-500/10 mb-2">
            <span className="text-[8px] font-mono font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mr-1 flex-shrink-0">
              भाव चयन:
            </span>
            {bhavasDetailed.map((b) => {
              const isThisHouse = b.houseNumber === bhava.houseNumber;
              const targetIdx = bhavaPages.findIndex(bp => bp.bhava.houseNumber === b.houseNumber);
              const hasP = b.planets.length > 0;
              return (
                <button
                  key={b.houseNumber}
                  onClick={() => {
                    setSelectedBhava(b.houseNumber);
                    if (targetIdx !== -1) {
                      setCurrentPage(bhavaStartPage + targetIdx);
                    }
                  }}
                  className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${
                    isThisHouse
                      ? 'bg-amber-500 text-amber-950 font-black shadow-sm ring-1 ring-amber-400 scale-105'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-stone-700 dark:text-slate-300'
                  }`}
                  title={`${b.sanskritName} (${b.name})`}
                >
                  <span>भाव {b.houseNumber}</span>
                  {hasP && <span className="ml-0.5 text-[8px] opacity-80">🪐</span>}
                </button>
              );
            })}
          </div>

          {/* Page Content Body */}
          <div className="space-y-2.5 my-auto overflow-y-auto max-h-[580px] no-scrollbar pr-1">
            {/* PART 1 or SINGLE PAGE: Celestial Coordinates, Occupant Grahas & Exhaustive Analysis */}
            {part === 1 && (
              <>
                {/* 4 Core Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">राशि (Sign)</span>
                    <span className="font-bold text-xs leading-snug block">{bhava.rashiSanskrit}</span>
                    <span className="text-[8px] text-stone-500 dark:text-slate-400">Sign #{bhava.rashiNumber}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">भावेश (Lord)</span>
                    <span className="font-bold text-xs leading-snug block">{bhava.rashiLordSanskrit}</span>
                    <span className="text-[8px] text-stone-500 dark:text-slate-400">Ruler Planet</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">स्थिर कारक (Karaka)</span>
                    <span className="font-bold text-xs leading-snug block">{bhava.karakaPlanet}</span>
                    <span className="text-[8px] text-stone-500 dark:text-slate-400">Natural Significator</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">शरीर अंग (Anatomy)</span>
                    <span className="font-semibold text-[10px] leading-tight block truncate" title={bhava.bodyParts}>{bhava.bodyParts}</span>
                    <span className="text-[8px] text-stone-500 dark:text-slate-400">{bhava.element}</span>
                  </div>
                </div>

                {/* Life Domain / Karakatva Overview */}
                <div className="p-2.5 rounded-xl bg-amber-500/[0.03] border border-amber-500/15 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏛️</span>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                        जीवन क्षेत्र एवं कारकत्व (Life Domain & Significations):
                      </span>
                      <p className="text-[11px] font-medium text-stone-700 dark:text-slate-300 leading-snug">
                        {bhava.lifeDomain}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 flex-shrink-0">
                    {bhava.purushartha}
                  </span>
                </div>

                {/* Occupying Grahas in this Bhava */}
                <div className="p-2.5 rounded-xl bg-amber-500/[0.03] border border-amber-500/15 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 flex-shrink-0">
                    <span>🪐</span>
                    <span>स्थित ग्रह (Occupying Grahas):</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    {hasPlanets ? (
                      bhava.planets.map(p => (
                        <span key={p.planet} className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                          <span>{p.icon}</span>
                          <span>{p.planet}</span>
                          <span className="text-[8px] opacity-75">({p.dignity.split(' ')[0]})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-stone-500 dark:text-slate-400 italic">
                        कोई प्रत्यक्ष ग्रह स्थित नहीं (संपूर्ण प्रभाव भावेश {bhava.rashiLordSanskrit} एवं दृष्टियों पर आधारित)
                      </span>
                    )}
                  </div>
                </div>

                {/* Detailed Astrological Narrative */}
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-amber-500/15 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>📜</span>
                    <span>गहन ज्योतिषीय विश्लेषण (In-depth Astrological Synthesis):</span>
                  </h4>
                  <div className="text-xs leading-relaxed text-stone-800 dark:text-slate-200 whitespace-pre-line font-serif sm:text-[13px]">
                    {bhava.detailedAnalysis}
                  </div>
                </div>

                {/* Continuation Callout for Overflowed Content (Part 2) */}
                {totalParts > 1 ? (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                    <span className="text-[10px] font-medium flex items-center gap-1.5">
                      <span>✨</span>
                      <span>विस्तृत विवरण जारी: इस भाव के <strong>शुभ फल</strong>, <strong>सतर्कता</strong> एवं <strong>वैदिक उपाय</strong> आगामी पृष्ठ पर देखें।</span>
                    </span>
                    <button
                      onClick={() => setCurrentPage(pageIdx + 1)}
                      className="px-2 py-1 rounded-lg bg-amber-500 text-amber-950 text-[10px] font-bold hover:bg-amber-400 transition-all flex items-center gap-0.5 flex-shrink-0 ml-2"
                    >
                      <span>भाग २</span>
                      <span>›</span>
                    </button>
                  </div>
                ) : (
                  /* Single Page Mode: Compact 3 Pillars */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                        🌟 शुभ फल (Boons)
                      </span>
                      <ul className="text-[10px] space-y-1">
                        {bhava.boons.map((b, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-emerald-500 flex-shrink-0">•</span>
                            <span className="leading-tight">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 block mb-1">
                        ⚠️ सतर्कता (Cautions)
                      </span>
                      <ul className="text-[10px] space-y-1">
                        {bhava.cautions.map((c, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-amber-500 flex-shrink-0">•</span>
                            <span className="leading-tight">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 block mb-1">
                        🪔 वैदिक उपाय (Upayas)
                      </span>
                      <ul className="text-[10px] space-y-1">
                        {bhava.remedies.map((r, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-purple-500 flex-shrink-0">•</span>
                            <span className="leading-tight">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* PART 2: Continuation Page for Boons, Cautions, Upayas & Divine Guidance */}
            {part === 2 && (
              <>
                {/* Bhava Context Anchor Bar */}
                <div className="p-2.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏛️</span>
                    <div>
                      <span className="font-bold text-amber-700 dark:text-amber-300 text-xs">
                        {bhava.sanskritName} • भाव {bhava.houseNumber}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-slate-400 ml-2">
                        ({bhava.name})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25">
                      भावेश: <strong>{bhava.rashiLordSanskrit}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25">
                      कारक: <strong>{bhava.karakaPlanet}</strong>
                    </span>
                  </div>
                </div>

                {/* 3 Full-Column Pillars of Karmic Manifestation */}
                <div className="space-y-3">
                  {/* Boons */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <span>🌟</span>
                        <span>शुभ फल एवं ग्रह कृपा (Favorable Boons & Cosmic Blessings):</span>
                      </span>
                      <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                        {bhava.boons.length} बिंदु
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-stone-800 dark:text-slate-200">
                      {bhava.boons.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/15">
                          <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
                          <span className="leading-snug">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cautions */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>सतर्कता एवं चुनौतियाँ (Mindful Cautions & Vulnerabilities):</span>
                      </span>
                      <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400">
                        {bhava.cautions.length} बिंदु
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-stone-800 dark:text-slate-200">
                      {bhava.cautions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-xl border border-amber-500/15">
                          <span className="text-amber-500 font-bold flex-shrink-0">!</span>
                          <span className="leading-snug">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Upayas */}
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <span>🪔</span>
                        <span>वैदिक उपाय, मन्त्र एवं अनुष्ठान (Actionable Upayas & Mantras):</span>
                      </span>
                      <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">
                        {bhava.remedies.length} उपचार
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-stone-800 dark:text-slate-200">
                      {bhava.remedies.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 bg-purple-500/5 p-2 rounded-xl border border-purple-500/15">
                          <span className="text-purple-500 font-bold flex-shrink-0">🪔</span>
                          <span className="leading-snug">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Astrological Synthesis & Divine Guidance */}
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] text-xs leading-relaxed text-stone-700 dark:text-slate-300">
                  <strong className="text-amber-600 dark:text-amber-400 block mb-0.5 text-[11px]">
                    कर्म सिद्धि परामर्श (Karmic Fruition Counsel):
                  </strong>
                  इस {bhava.sanskritName} के अधिपति {bhava.rashiLordSanskrit} हैं एवं नैसर्गिक कारक {bhava.karakaPlanet} हैं। उल्लिखित वैदिक उपायों का निष्ठापूर्वक पालन करने से नकारात्मक गोचर शांत होते हैं तथा {bhava.lifeDomain} में शुभता व उन्नति की प्राप्ति होती है।
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>द्वादश भाव विस्तृत संहिता</span>
            <span>— पृष्ठ {pageIdx + 1} —</span>
            <span>भाव {bhava.houseNumber} {totalParts > 1 ? `(भाग ${part}/${totalParts})` : 'विश्लेषण'}</span>
          </div>
        </div>
      );
    }

    // Dynamic AI Life Chapters (Following dedicated Bhava pages)
    const chapterOffset = pageIdx - aiChaptersStartPage;
    if (chapterOffset >= 0 && chapterOffset < parsedChapters.length) {
      const chapter = parsedChapters[chapterOffset];
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-4 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                अध्याय {bhavaPages.length + 5 + chapterOffset} • Chapter {bhavaPages.length + 5 + chapterOffset}
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass} flex items-center gap-2`}>
                <span>{chapter.icon}</span>
                <span>{chapter.cleanTitle}</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              Vedic Life Predictions
            </span>
          </div>

          {/* Chapter Content & Highlights */}
          <div className="space-y-4 my-auto text-xs leading-relaxed text-stone-800 dark:text-slate-200">
            {/* Highlights Grid (Strengths, Cautions, Remedies) */}
            {(chapter.strengths.length > 0 || chapter.cautions.length > 0 || chapter.remedies.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {chapter.strengths.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                      🌟 Favorable Boons
                    </span>
                    <ul className="text-[10px] space-y-1">
                      {chapter.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-500">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {chapter.cautions.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 block mb-1">
                      ⚠️ Mindful Cautions
                    </span>
                    <ul className="text-[10px] space-y-1">
                      {chapter.cautions.map((c, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-amber-500">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {chapter.remedies.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 block mb-1">
                      🪔 Vedic Upayas
                    </span>
                    <ul className="text-[10px] space-y-1">
                      {chapter.remedies.map((r, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-purple-500">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Markdown Chapter Text */}
            <div className={`p-4 rounded-2xl border ${cardBgClass} max-h-[460px] xl:max-h-[540px] overflow-y-auto no-scrollbar prose prose-sm dark:prose-invert leading-relaxed text-xs`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{chapter.content}</ReactMarkdown>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>जीवन फलकथन</span>
            <span>— पृष्ठ {pageIdx + 1} —</span>
            <span className="break-words">{chapter.cleanTitle}</span>
          </div>
        </div>
      );
    }

    // Last Page: Epilogue, Vedic Mantras & Astrological Colophon
    return (
      <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none text-center">
        <BookBorderFlourish theme={bookTheme} />

        {/* Header */}
        <div className="pt-2">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            उपसंहार एवं आशीर्वाद • Epilogue & Sacred Blessings
          </span>
          <h3 className={`text-xl sm:text-2xl font-devanagari font-bold mt-1 ${textTitleClass}`}>
            वैदिक महामन्त्र एवं अन्तिम परामर्श
          </h3>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2"></div>
        </div>

        {/* Sacred Mantras & Colophon */}
        <div className="space-y-4 my-auto max-w-lg mx-auto">
          {/* Maha Mrityunjaya Mantra */}
          <div className={`p-4 rounded-2xl border ${cardBgClass}`}>
            <span className="text-[9px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 block mb-1">
              महामृत्युंजय मन्त्र (Life Vitality & Protection)
            </span>
            <p className="font-devanagari text-sm font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
              ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।<br />
              उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्॥
            </p>
          </div>

          {/* Gayatri Mantra */}
          <div className={`p-4 rounded-2xl border ${cardBgClass}`}>
            <span className="text-[9px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 block mb-1">
              गायत्री मन्त्र (Intellectual Illumination)
            </span>
            <p className="font-devanagari text-sm font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
              ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥
            </p>
          </div>

          {/* Astrological Verification Seal */}
          <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-500/[0.05] flex items-center justify-around">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500 flex items-center justify-center font-devanagari text-xs font-black text-amber-700 dark:text-amber-300">
              प्रमाणित<br />ज्योतिष
            </div>
            <div className="text-left">
              <h5 className="font-cinzel font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Vedic Astrology Bureau Seal
              </h5>
              <p className="text-[10px] text-stone-500 dark:text-slate-400">
                Cast under {KUNDALI_SYSTEMS.find(s => s.id === system)?.name} Calculations
              </p>
              <p className="text-[9px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                Ref ID: WMS-{Date.now().toString().slice(-6)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4 flex items-center justify-between">
          <span>श्री ज्योतिषपीठ</span>
          <span>— अन्तिम पृष्ठ ({totalPages}) —</span>
          <span>ॐ शान्तिः शान्तिः शान्तिः</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Book Control & Aesthetics Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-black/40 border border-amber-500/20 backdrop-blur-2xl shadow-xl no-print">
        {/* Book Title & Active System */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shadow-md">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-cinzel font-bold text-amber-200">
                {details.name}'s Janma Kundali Life Book
              </h2>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {KUNDALI_SYSTEMS.find(s => s.id === system)?.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive Book Presentation • {totalPages} Illuminated Pages
            </p>
          </div>
        </div>

        {/* View Mode & Theme Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reading Mode Switcher */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setReadingMode('spread')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                readingMode === 'spread'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Open Book Two-Page Spread"
            >
              <span>📖</span>
              <span className="hidden sm:inline">Book Spread</span>
            </button>
            <button
              onClick={() => setReadingMode('scroll')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                readingMode === 'scroll'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Continuous Scroll Manuscript"
            >
              <span>📜</span>
              <span className="hidden sm:inline">Continuous</span>
            </button>
          </div>

          {/* Theme Switcher: Antique Parchment vs Midnight Velvet */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setBookTheme('parchment')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                bookTheme === 'parchment'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Royal Antique Parchment (स्वर्ण पत्र)"
            >
              <span>📜</span>
              <span className="text-[11px]">Parchment</span>
            </button>
            <button
              onClick={() => setBookTheme('velvet')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold transition-all ${
                bookTheme === 'velvet'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Midnight Celestial Velvet (नील ग्रन्थ)"
            >
              <span>🌌</span>
              <span className="text-[11px]">Velvet</span>
            </button>
          </div>

          {/* Download Book PDF Button */}
          <button
            onClick={downloadBookPDF}
            disabled={pdfGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95"
            title="Download this entire Kundali in genuine book style (Page-by-Page A4)"
          >
            <span>{pdfGenerating ? '⏳' : '📥'}</span>
            <span>{pdfGenerating ? 'Binding Book PDF...' : 'Download Book PDF'}</span>
          </button>

          {/* Browser Print Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all"
            title="Print or Save via Browser (Ctrl+P)"
          >
            <span>🖨️</span>
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* PDF Generation Progress Modal */}
      {pdfGenerating && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center animate-pulse flex items-center justify-center gap-3 text-xs text-amber-200 font-bold uppercase tracking-wider">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>{pdfStatus}</span>
        </div>
      )}

      {/* MAIN INTERACTIVE BOOK CONTAINER */}
      <div id="kundali-report-area" className="relative">
        {/* SPREAD MODE: REAL OPEN TWO-PAGE BOOK */}
        {readingMode === 'spread' && (
          <div className="space-y-4">
            {/* Book Spine & Dual Page Spread */}
            <div className="relative rounded-[32px] sm:rounded-[40px] p-2 sm:p-5 bg-gradient-to-r from-[#1c1209] via-[#3d240d] to-[#1c1209] border-4 border-amber-600/40 shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden">
              {/* Center Ribbon Bookmark */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-12 bg-gradient-to-b from-red-600 to-amber-700 shadow-md rounded-b-md z-30 pointer-events-none opacity-90 hidden md:block">
                <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[8px] border-b-[#1c1209]"></div>
              </div>

              {/* Book Spread Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 relative">
                {/* Left Page */}
                <div className={`relative min-h-[660px] xl:min-h-[760px] rounded-2xl sm:rounded-3xl border border-amber-500/30 shadow-2xl ${pageBgClass} book-spine-left overflow-hidden transition-all duration-500`}>
                  {renderBookPage(currentPage)}
                </div>

                {/* Right Page (Next Page in Sequence) */}
                <div className={`relative min-h-[660px] xl:min-h-[760px] rounded-2xl sm:rounded-3xl border border-amber-500/30 shadow-2xl ${pageBgClass} book-spine-right overflow-hidden transition-all duration-500 hidden md:block`}>
                  {currentPage + 1 < totalPages ? (
                    renderBookPage(currentPage + 1)
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center select-none opacity-60">
                      <span className="text-5xl mb-4">🕉️</span>
                      <h4 className="font-cinzel font-bold text-lg">Finis Astrologica</h4>
                      <p className="text-xs max-w-xs mt-2 italic">
                        All celestial chapters of this Janma Patrika have been transcribed. May your journey be illumined with wisdom and peace.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Book Flip Navigation Toolbar */}
            <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-black/40 border border-white/10 no-print">
              <button
                onClick={handlePrev}
                disabled={currentPage === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <span>‹</span>
                <span>Previous Page</span>
              </button>

              {/* Chapter / Page Quick Jump */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-300 font-bold hidden sm:inline">
                  Page {currentPage + 1} & {Math.min(currentPage + 2, totalPages)} of {totalPages}
                </span>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(parseInt(e.target.value, 10))}
                  className="bg-black/60 border border-amber-500/30 text-amber-200 text-xs rounded-xl px-3 py-2 outline-none font-medium cursor-pointer"
                >
                  <option value={0}>Page 1: Royal Book Cover</option>
                  <option value={1}>Page 2: Janma Kundali & Chart</option>
                  <option value={2}>Page 3: Avakahada & Panchanga</option>
                  <option value={3}>Page 4: Navagraha & Purushartha</option>
                  <option value={4}>Page 5: Vimshottari Mahadasha & Sade Sati</option>
                  {bhavaPages.map((bp, bpIdx) => (
                    <option key={`bhava-pg-${bpIdx}`} value={bhavaStartPage + bpIdx}>
                      Page {bhavaStartPage + bpIdx + 1}: भाव {bp.bhava.houseNumber} ({bp.bhava.rashiSanskrit}) {bp.totalParts > 1 ? `[भाग ${bp.part}/2]` : ''}
                    </option>
                  ))}
                  {parsedChapters.map((ch, idx) => (
                    <option key={ch.id} value={aiChaptersStartPage + idx}>
                      Page {aiChaptersStartPage + idx + 1}: {ch.cleanTitle}
                    </option>
                  ))}
                  <option value={totalPages - 1}>Page {totalPages}: Epilogue & Mantras</option>
                </select>
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage >= totalPages - 2}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <span>Next Page</span>
                <span>›</span>
              </button>
            </div>
          </div>
        )}

        {/* SCROLL MODE: CONTINUOUS ILLUMINATED MANUSCRIPT */}
        {readingMode === 'scroll' && (
          <div className="space-y-8">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <div
                key={idx}
                className={`relative min-h-[700px] rounded-3xl border-2 border-amber-500/40 shadow-2xl ${pageBgClass} overflow-hidden`}
              >
                {renderBookPage(idx)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DEDICATED OFF-SCREEN / PRINT CONTAINER FOR EXACT A4 PDF BOOK GENERATION */}
      <div 
        id="kundali-book-pdf-container" 
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '1050px',
          pointerEvents: 'none',
          opacity: 1
        }}
      >
        {Array.from({ length: totalPages }).map((_, idx) => (
          <div
            key={idx}
            className={`book-pdf-page relative ${pageBgClass}`}
            style={{
              width: '1050px',
              height: '1485px',
              padding: '0',
              boxSizing: 'border-box',
              overflow: 'hidden',
              marginBottom: '20px'
            }}
          >
            {renderBookPage(idx, true)}
          </div>
        ))}
      </div>

      {/* Astrologer Consultation Section (Below the Book) */}
      <section className="mirror-card rounded-[36px] p-6 sm:p-10 space-y-6 no-print shadow-2xl mt-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-2xl border border-amber-500/30">
            🔮
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-cinzel text-amber-200">
              {KUNDALI_SYSTEMS.find(s => s.id === system)?.name} Consultation & Guidance
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Ask deep questions regarding this Janma Kundali Life Book
            </p>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 no-scrollbar border-y border-white/5 py-4">
          {chatHistory.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs italic">
              "How will my career progress during my active Mahadasha?" • "What remedies will harmonize my 7th house?"
            </div>
          )}
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-600/25 border border-amber-500/40 text-amber-50 rounded-tr-none'
                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none prose prose-invert prose-sm'
                }`}
              >
                {msg.role === 'user' ? msg.text : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex gap-2 items-center text-amber-500/60 text-[10px] font-black uppercase tracking-[0.2em]">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-75" />
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150" />
              Consulting the Akashic records...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={onAskQuestion} className="flex gap-3">
          <input
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            type="text"
            placeholder="Seek deeper insights from this Janma Kundali..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs sm:text-sm focus:ring-1 focus:ring-amber-500 outline-none text-white transition-all placeholder-slate-700 font-medium"
          />
          <button
            disabled={chatLoading || !userQuery.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-6 sm:px-8 rounded-2xl text-xs uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50"
          >
            Query
          </button>
        </form>
      </section>

      {/* Reset & New Chart Button */}
      <button
        onClick={onReset}
        className="text-slate-500 hover:text-amber-400 mx-auto block no-print text-[10px] font-black uppercase tracking-[0.4em] transition-all py-6"
      >
        ↺ Cast New Janma Kundali
      </button>
    </div>
  );
};

export default KundaliBookViewer;
