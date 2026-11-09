import React, { useState, useMemo, useRef } from 'react';
import {
  BirthDetails,
  Language,
  ChatMessage,
  KundaliResponse,
  KundaliSystem,
  MahadashaPeriod,
  SaadesatiPhase,
  AvakahadaDetails,
  PlanetaryPositionDetail,
  BhavaDetailedAnalysis,
  ShadbalaDetail,
  VedicYogaDetail,
  VedicDoshaDetail,
  DivisionalChartDetail,
  AntardashaDetail,
  PracticalRemedyDetail
} from '../types';
import { KUNDALI_SYSTEMS } from '../constants';
import {
  ensureValidKundaliChart,
  calculate12BhavasDetailedAnalysis,
  RASHI_NAMES_EN,
  calculateShadbala,
  calculateYogas,
  calculateDoshas,
  calculateDivisionalCharts,
  calculateAntardashas,
  calculatePracticalRemedies
} from '../services/astrologyHelper';
import KundaliChart from './KundaliChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  getKundaliLocale,
  getLocalizedPlanet,
  getLocalizedSign,
  getLocalizedHouse,
  getLocalizedDignity,
  getLocalizedPaya,
  getLocalizedElement,
  getLocalizedPurushartha,
  stripAsterisksAndMarkdown,
  SUN_SIGN_TRANSLATIONS,
  LAGNA_TRANSLATIONS
} from '../services/kundaliLocalization';

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
  // Active selected Varga for Section 5 (Divisional Charts: D9, D10, D7)
  const [selectedVarga, setSelectedVarga] = useState<'D9' | 'D10' | 'D7'>('D9');
  // PDF Generation State
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Localization bundle based on user-selected language
  const locale = useMemo(() => getKundaliLocale(language), [language]);

  // Sun position and Sun Sign display
  const sunPosition = useMemo(() => {
    return planetaryPositionsData.find(p => p.planet === 'Sun');
  }, [planetaryPositionsData]);

  const sunSignDisplay = useMemo(() => {
    if (analysis.sunSign) return getLocalizedSign(analysis.sunSign, language);
    if (sunPosition) return getLocalizedSign(sunPosition.sign, language);
    return getLocalizedSign('Aries', language);
  }, [analysis.sunSign, sunPosition, language]);

  // Compute 12 Bhavas exhaustive Vedic analysis
  const bhavasDetailed: BhavaDetailedAnalysis[] = useMemo(() => {
    return calculate12BhavasDetailedAnalysis(
      analysis.lagnaSign || 1,
      planetaryPositionsData,
      language
    );
  }, [analysis.lagnaSign, planetaryPositionsData, language]);

  // Shadbala calculation
  const shadbalaData = useMemo(() => {
    if (analysis.shadbala && analysis.shadbala.length > 0) return analysis.shadbala;
    return calculateShadbala(planetaryPositionsData, analysis.lagnaSign || 1, details.dob, details.tob, language);
  }, [analysis.shadbala, planetaryPositionsData, analysis.lagnaSign, details, language]);

  // Vedic Yogas calculation
  const yogasData = useMemo(() => {
    if (analysis.yogas && analysis.yogas.length > 0) return analysis.yogas;
    return calculateYogas(planetaryPositionsData, analysis.lagnaSign || 1, language);
  }, [analysis.yogas, planetaryPositionsData, analysis.lagnaSign, language]);

  // Vedic Doshas calculation
  const doshasData = useMemo(() => {
    if (analysis.doshas && analysis.doshas.length > 0) return analysis.doshas;
    return calculateDoshas(planetaryPositionsData, analysis.lagnaSign || 1, avakahadaData, language);
  }, [analysis.doshas, planetaryPositionsData, analysis.lagnaSign, avakahadaData, language]);

  // Divisional Charts calculation
  const divisionalChartsData = useMemo(() => {
    if (analysis.divisionalCharts) return analysis.divisionalCharts;
    return calculateDivisionalCharts(planetaryPositionsData, analysis.lagnaSign || 1);
  }, [analysis.divisionalCharts, planetaryPositionsData, analysis.lagnaSign]);

  // Active Mahadasha & Antardasha calculation
  const activeMahadasha = useMemo(() => {
    return displayMahadashas.find(m => m.isCurrent) || displayMahadashas[0];
  }, [displayMahadashas]);

  const antardashasData = useMemo(() => {
    if (analysis.antardashas && analysis.antardashas.length > 0) return analysis.antardashas;
    return calculateAntardashas(activeMahadasha, details.dob, language);
  }, [analysis.antardashas, activeMahadasha, details.dob, language]);

  // Practical Remedies calculation
  const practicalRemediesData = useMemo(() => {
    if (analysis.practicalRemedies) return analysis.practicalRemedies;
    return calculatePracticalRemedies(planetaryPositionsData, analysis.lagnaSign || 1, doshasData, language);
  }, [analysis.practicalRemedies, planetaryPositionsData, analysis.lagnaSign, doshasData, language]);

  // Parse markdown report into structured chapters
  const parsedChapters: ParsedChapter[] = useMemo(() => {
    const reportText = typeof analysis.report === 'string' ? analysis.report : JSON.stringify(analysis.report);
    if (!reportText) return [];

    const lines = reportText.split('\n');
    const chapters: ParsedChapter[] = [];
    let curTitle = locale.chapterLabels.ch1Title;
    let curLines: string[] = [];

    const flush = () => {
      const rawContent = curLines.join('\n').trim();
      const content = stripAsterisksAndMarkdown(rawContent);
      if (content || chapters.length === 0) {
        const clean = stripAsterisksAndMarkdown(curTitle.replace(/^[#\d\.\s\-\*]+/, '').trim()) || 
          locale.bhavaPillars.analysisTitle;
        
        // Scan for strengths, cautions, remedies without asterisks
        const strengths: string[] = [];
        const cautions: string[] = [];
        const remedies: string[] = [];
        const bLines = rawContent.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || /^\d+\./.test(l.trim()));

        for (const line of bLines) {
          const lower = line.toLowerCase();
          const cleanLine = stripAsterisksAndMarkdown(line.replace(/^[-*\d\.]+\s*/, '').trim());
          if ((lower.includes('remedy') || lower.includes('upaya') || lower.includes('mantra') || lower.includes('gemstone') || lower.includes('उपाय') || lower.includes('मन्त्र') || lower.includes('मंत्र') || lower.includes('दान')) && remedies.length < 3) {
            remedies.push(cleanLine);
          } else if ((lower.includes('caution') || lower.includes('delay') || lower.includes('challenge') || lower.includes('stress') || lower.includes('सतर्क') || lower.includes('चुनौती') || lower.includes('बाधा') || lower.includes('कठिनाई')) && cautions.length < 3) {
            cautions.push(cleanLine);
          } else if ((lower.includes('favor') || lower.includes('strength') || lower.includes('boon') || lower.includes('gain') || lower.includes('शुभ') || lower.includes('वरदान') || lower.includes('लाभ') || lower.includes('सफलता')) && strengths.length < 3) {
            strengths.push(cleanLine);
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
  }, [analysis.report, language]);

  // Dynamic AI chapters cleanly paginated so overflowing text flows across pages!
  const aiPages = useMemo(() => {
    const pages: Array<{
      chapter: ParsedChapter;
      part: 1 | 2;
      totalParts: 1 | 2;
      content: string;
      cleanTitle: string;
      icon: string;
      strengths: string[];
      cautions: string[];
      remedies: string[];
    }> = [];

    parsedChapters.forEach((ch) => {
      const cleanContent = stripAsterisksAndMarkdown(ch.content);
      const isOverflowing = cleanContent.length > 900 || (ch.strengths.length + ch.cautions.length + ch.remedies.length > 3);

      if (isOverflowing && cleanContent.length > 600) {
        // Find a paragraph or newline break near the midpoint
        const paragraphs = cleanContent.split('\n\n');
        const midpoint = Math.ceil(paragraphs.length / 2);
        const part1Content = paragraphs.slice(0, midpoint).join('\n\n');
        const part2Content = paragraphs.slice(midpoint).join('\n\n');

        pages.push({
          chapter: ch,
          part: 1,
          totalParts: 2,
          content: part1Content,
          cleanTitle: ch.cleanTitle,
          icon: ch.icon,
          strengths: ch.strengths,
          cautions: ch.cautions,
          remedies: []
        });

        pages.push({
          chapter: ch,
          part: 2,
          totalParts: 2,
          content: part2Content,
          cleanTitle: ch.cleanTitle,
          icon: ch.icon,
          strengths: [],
          cautions: [],
          remedies: ch.remedies
        });
      } else {
        pages.push({
          chapter: ch,
          part: 1,
          totalParts: 1,
          content: cleanContent,
          cleanTitle: ch.cleanTitle,
          icon: ch.icon,
          strengths: ch.strengths,
          cautions: ch.cautions,
          remedies: ch.remedies
        });
      }
    });

    return pages;
  }, [parsedChapters]);

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
      const isDetailedOverflowing =
        b.detailedAnalysis.length > 240 ||
        b.planets.length > 0 ||
        (b.boons.length + b.cautions.length + b.remedies.length) >= 5;

      const houseDisplayName = `${getLocalizedHouse(b.houseNumber, language)}: ${b.name} (${getLocalizedSign(b.rashiName, language)})`;

      if (isDetailedOverflowing) {
        // Part 1: Cosmic Coordinates & Deep Astrological Narrative
        pages.push({
          bhava: b,
          part: 1,
          totalParts: 2,
          pageTitle: `${houseDisplayName} • ${locale.bhavaPillars.analysisTitle.replace(':', '')}`,
          chapterNumber
        });
        // Part 2: Added page to cleanly accommodate Boons, Cautions & Vedic Upayas
        pages.push({
          bhava: b,
          part: 2,
          totalParts: 2,
          pageTitle: `${houseDisplayName} • ${locale.bhavaPillars.boonsTitle.replace(':', '')}`,
          chapterNumber
        });
      } else {
        // Fits comfortably on 1 dedicated page
        pages.push({
          bhava: b,
          part: 1,
          totalParts: 1,
          pageTitle: houseDisplayName,
          chapterNumber
        });
      }
    });

    return pages;
  }, [bhavasDetailed, language, locale]);

  // Page index offsets matching the 6 Sacred Pillars:
  // Page 0: Royal Book Cover (Page 1)
  // Page 1: Pillar 1 (Part 1) - Core Astronomical Framework (Lagna, Rashi, Surya Rashi, Nakshatra, D1 Diamond Chart) (Page 2)
  // Page 2: Pillar 1 (Part 2) - Planetary Positions (Navagraha Sphuta: degrees, retrograde/combust, dignities) (Page 3)
  // Page 3: Astrological Foundations - Avakahada Chakra & Birth Panchanga (Page 4)
  // Pages 4 .. (4 + bhavaPages.length - 1): Pillar 2 - Life Domains (The 12 Bhavas/Houses - each house on dedicated separate page)
  // Page dashaPageIdx: Pillar 3 - Cosmic Timing (Vimshottari Mahadasha + Active Antardashas Table + Shani Sade Sati)
  // Page shadbalaPageIdx: Pillar 4 (Part 1) - Karmic Blueprint & Strengths (Nakshatras & Shadbala 6-fold Strengths Table)
  // Page yogasPageIdx: Pillar 4 (Part 2) - Karmic Blueprint & Strengths (Classical Vedic Yogas & Karmic Doshas)
  // Page vargasPageIdx: Pillar 5 - Divisional Charts (Vargas: D9 Navamsha, D10 Dashamsha, D7 Saptamsha interactive chart)
  // Page remediesPageIdx: Pillar 6 - Practical Remedies (Upayas: Gemstones, Mantra & Japa, Charity & Rituals)
  // Pages aiChaptersStartPage .. (totalPages - 2): Dynamic AI Chapters (Synthesized Life Predictions)
  // Page totalPages - 1: Epilogue, Vedic Mantras & Certified Astrological Seal
  const bhavaStartPage = 4;
  const dashaPageIdx = bhavaStartPage + bhavaPages.length;
  const shadbalaPageIdx = dashaPageIdx + 1;
  const yogasPageIdx = shadbalaPageIdx + 1;
  const vargasPageIdx = yogasPageIdx + 1;
  const remediesPageIdx = vargasPageIdx + 1;
  const aiChaptersStartPage = remediesPageIdx + 1;
  const totalPages = aiChaptersStartPage + Math.max(1, aiPages.length) + 1;

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
                {locale.cover.title}
              </h1>
              <h2 className="text-xs sm:text-base font-cinzel tracking-[0.25em] font-bold mt-2 uppercase text-stone-700 dark:text-amber-200/90">
                {locale.cover.subtitle}
              </h2>
              <p className="text-xs sm:text-sm font-devanagari text-amber-700/80 dark:text-amber-200/70 max-w-lg mx-auto tracking-wide mt-1">
                {locale.cover.treatise}
              </p>
              <div className="w-28 sm:w-48 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-3"></div>
            </div>

            {/* Native Name Royal Plaque */}
            <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 shadow-lg relative bg-gradient-to-b from-amber-500/10 to-amber-500/5">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400 block mb-1">
                {locale.cover.nativeName}
              </span>
              <div className="text-xl sm:text-3xl font-cinzel font-black tracking-wider text-amber-900 dark:text-amber-100">
                {stripAsterisksAndMarkdown(details.name) || locale.cover.defaultNativeName}
              </div>
            </div>

            {/* Birth Details Grid Cartouche */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-2xl mx-auto text-left text-xs">
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">📅 {locale.cover.dob}</span>
                <span className="font-mono font-bold text-xs">{details.dob || '—'}</span>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">⏰ {locale.cover.tob}</span>
                <span className="font-mono font-bold text-xs">{details.tob || '—'}</span>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">📍 {locale.cover.pob}</span>
                <span className="break-words block font-semibold text-xs leading-snug" title={details.location}>{details.location || '—'}</span>
              </div>
              <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                <span className="text-[9px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">🌌 {locale.cover.system}</span>
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
            <span>{locale.footers.coverFooter}</span>
            <span>{locale.footers.pagePrefix} 1</span>
            <span>{locale.footers.bookName}</span>
          </div>
        </div>
      );
    }

    // Page 1 (Book Page 2): Janma Kundali Chart & Astral Coordinates
    if (pageIdx === 1) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.sixPillars.pillar1Title} • {locale.chapterLabels.part} 1
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                {locale.chapterLabels.ch1Part1Title} • {locale.sixPillars.pillar1Subtitle}
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {KUNDALI_SYSTEMS.find(s => s.id === system)?.name}
            </span>
          </div>

          {/* Chart & Core Coordinates Grid */}
          <div className="space-y-3.5 my-auto overflow-y-auto max-h-[600px] no-scrollbar pr-1">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* North Indian Diamond Chart */}
              <div className="md:col-span-7 flex justify-center p-2.5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20">
                <div className="scale-95 sm:scale-100 transform origin-center">
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

              {/* Four Core Astronomical Pillars: Lagna, Moon Sign, Sun Sign, Nakshatra */}
              <div className="md:col-span-5 grid grid-cols-2 gap-2 text-xs">
                {/* 1. Lagna (Ascendant) */}
                <div className={`p-2.5 rounded-xl border ${cardBgClass} flex flex-col justify-between`}>
                  <div>
                    <span className="text-lg block mb-0.5">🌅</span>
                    <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">
                      {locale.cardinalPoints.lagna}
                    </span>
                    <span className="font-bold text-xs mt-0.5 block text-amber-900 dark:text-amber-100">
                      {getLocalizedSign(RASHI_NAMES_EN[(analysis.lagnaSign || 1) - 1], language)}
                    </span>
                  </div>
                  <p className="text-[9px] text-stone-600 dark:text-slate-400 mt-1 leading-snug line-clamp-3">
                    {locale.sixPillars.lagnaDef}
                  </p>
                </div>

                {/* 2. Rashi (Moon Sign) */}
                <div className={`p-2.5 rounded-xl border ${cardBgClass} flex flex-col justify-between`}>
                  <div>
                    <span className="text-lg block mb-0.5">🌙</span>
                    <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">
                      {locale.cardinalPoints.moonSign}
                    </span>
                    <span className="font-bold text-xs mt-0.5 block text-amber-900 dark:text-amber-100">
                      {getLocalizedSign(analysis.moonSign || 'Taurus', language)}
                    </span>
                  </div>
                  <p className="text-[9px] text-stone-600 dark:text-slate-400 mt-1 leading-snug line-clamp-3">
                    {locale.sixPillars.rashiDef}
                  </p>
                </div>

                {/* 3. Surya Rashi (Sun Sign) */}
                <div className={`p-2.5 rounded-xl border ${cardBgClass} flex flex-col justify-between`}>
                  <div>
                    <span className="text-lg block mb-0.5">☀️</span>
                    <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">
                      {locale.cardinalPoints.sunSign}
                    </span>
                    <span className="font-bold text-xs mt-0.5 block text-amber-900 dark:text-amber-100">
                      {sunSignDisplay}
                    </span>
                  </div>
                  <p className="text-[9px] text-stone-600 dark:text-slate-400 mt-1 leading-snug line-clamp-3">
                    {locale.sixPillars.sunSignDef}
                  </p>
                </div>

                {/* 4. Janma Nakshatra */}
                <div className={`p-2.5 rounded-xl border ${cardBgClass} flex flex-col justify-between`}>
                  <div>
                    <span className="text-lg block mb-0.5">✨</span>
                    <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">
                      {locale.cardinalPoints.nakshatra}
                    </span>
                    <span className="font-bold text-xs mt-0.5 block text-amber-900 dark:text-amber-100">
                      {stripAsterisksAndMarkdown(analysis.nakshatra) || 'Rohini'}
                    </span>
                  </div>
                  <p className="text-[9px] text-stone-600 dark:text-slate-400 mt-1 leading-snug line-clamp-3">
                    {locale.sixPillars.nakshatrasDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Ascendant Lagna Foundation Card */}
            <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] text-xs leading-relaxed text-stone-700 dark:text-slate-300">
              <strong className="text-amber-600 dark:text-amber-400 block mb-1 text-xs font-devanagari font-bold">
                {locale.lagnaCard.titleTemplate(getLocalizedSign(RASHI_NAMES_EN[(analysis.lagnaSign || 1) - 1], language))}
              </strong>
              <p className="leading-relaxed">
                {locale.lagnaCard.descTemplate(getLocalizedSign(RASHI_NAMES_EN[(analysis.lagnaSign || 1) - 1], language))}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.bookName}</span>
            <span>— {locale.footers.pagePrefix} 2 —</span>
            <span>{locale.footers.chartFooter}</span>
          </div>
        </div>
      );
    }

    // Page 2 (Book Page 3): Graha Sphuta (Complete Planetary Positions & Dignities Table)
    if (pageIdx === 2) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.sixPillars.pillar1Title} • {locale.chapterLabels.part} 2
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                {locale.chapterLabels.ch1Part2Title} • Navagraha Sphuta
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Precise Degrees & Dignities
            </span>
          </div>

          {/* Graha Sphuta Full Table & Planetary Dignity Matrix */}
          <div className="space-y-3.5 my-auto overflow-y-auto max-h-[600px] no-scrollbar pr-1">
            {planetaryPositionsData.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border-2 border-amber-500/30 bg-amber-500/[0.02] shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-amber-500/30 bg-amber-500/10 font-cinzel text-amber-900 dark:text-amber-300">
                      <th className="py-2.5 px-3 font-bold">{locale.planetHeaders.planet}</th>
                      <th className="py-2.5 px-2 font-bold">Degree (अंश)</th>
                      <th className="py-2.5 px-3 font-bold">{locale.planetHeaders.sign}</th>
                      <th className="py-2.5 px-2 font-bold">{locale.planetHeaders.house}</th>
                      <th className="py-2.5 px-2 font-bold">Motion / Avastha</th>
                      <th className="py-2.5 px-3 font-bold text-right">{locale.planetHeaders.dignity}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/15">
                    {planetaryPositionsData.map((pos) => {
                      const planetDisplay = getLocalizedPlanet(pos.planet, language);
                      const signDisplay = getLocalizedSign(pos.sign, language);
                      const houseDisplay = getLocalizedHouse(pos.house, language);
                      const dignityDisplay = getLocalizedDignity(pos.dignity, language);

                      return (
                        <tr key={pos.planet} className="hover:bg-amber-500/10 transition-colors">
                          <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                            <span className="text-base">{pos.icon}</span>
                            <span className="font-bold">{planetDisplay}</span>
                          </td>
                          <td className="py-2 px-2 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            {pos.degree || '15° 00\''}
                          </td>
                          <td className="py-2 px-3 font-medium">{signDisplay}</td>
                          <td className="py-2 px-2 font-mono font-bold">{houseDisplay}</td>
                          <td className="py-2 px-2">
                            {pos.isRetrograde ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                ℞ Vakri (Retrograde)
                              </span>
                            ) : pos.isCombust ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                🔥 Asta (Combust)
                              </span>
                            ) : (
                              <span className="text-[10px] opacity-75 font-mono">Margi (Direct)</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 border border-amber-500/30">
                              {dignityDisplay}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-xs opacity-75">Compiling Planetary Positions...</div>
            )}

            {/* Planetary Dispositions Insight Card */}
            <div className="p-3.5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] text-xs leading-relaxed text-stone-700 dark:text-slate-300 space-y-1">
              <strong className="text-amber-600 dark:text-amber-400 block text-xs font-devanagari font-bold">
                {locale.sphutaCard.title}
              </strong>
              <p className="text-[11px] leading-relaxed">
                {locale.sixPillars.planetaryDef}
              </p>
              <p className="text-[10px] text-stone-500 dark:text-slate-400">
                {locale.sphutaCard.desc}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.bookName}</span>
            <span>— {locale.footers.pagePrefix} 3 —</span>
            <span>{locale.footers.sphutaFooter}</span>
          </div>
        </div>
      );
    }

    // Page 3 (Book Page 4): Avakahada Chakra & Birth Panchanga
    if (pageIdx === 3) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-4 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.chapterLabels.chapter} 2 • Chapter II
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                {locale.chapterLabels.ch2Title}
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
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{locale.panchanga.varna}</span>
                  <p className="font-bold text-sm mt-0.5">{stripAsterisksAndMarkdown(avakahadaData.varna)}</p>
                  <p className="text-[9px] opacity-75">{locale.panchanga.varnaDesc}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{locale.panchanga.vashya}</span>
                  <p className="font-bold text-sm mt-0.5">{stripAsterisksAndMarkdown(avakahadaData.vashya)}</p>
                  <p className="text-[9px] opacity-75">{locale.panchanga.vashyaDesc}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{locale.panchanga.yoni}</span>
                  <p className="font-bold text-sm mt-0.5">{stripAsterisksAndMarkdown(avakahadaData.yoni, language)}{language === 'English' && avakahadaData.yoniAnimal ? ` (${stripAsterisksAndMarkdown(avakahadaData.yoniAnimal).split(' - ')[0]})` : ''}</p>
                  <p className="text-[9px] opacity-75">{locale.panchanga.yoniDesc}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{locale.panchanga.gana}</span>
                  <p className="font-bold text-sm mt-0.5">{stripAsterisksAndMarkdown(avakahadaData.gana, language)}</p>
                  <p className="text-[9px] opacity-85 leading-snug break-words">{language === 'English' ? stripAsterisksAndMarkdown(avakahadaData.ganaDescription) : ''}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{locale.panchanga.nadi}</span>
                  <p className="font-bold text-sm mt-0.5">{stripAsterisksAndMarkdown(avakahadaData.nadi, language)}{language === 'English' && avakahadaData.nadiAyurveda ? ` (${stripAsterisksAndMarkdown(avakahadaData.nadiAyurveda).split(' - ')[0]})` : ''}</p>
                  <p className="text-[9px] opacity-75">{locale.panchanga.nadiDesc}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{locale.panchanga.paya}</span>
                  <p className="font-bold text-sm mt-0.5">{getLocalizedPaya(avakahadaData.paya, language)}</p>
                  <p className="text-[9px] opacity-75">{locale.panchanga.payaDesc}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{locale.panchanga.element}</span>
                  <p className="font-bold text-sm mt-0.5">{getLocalizedElement(avakahadaData.tatva, language)}</p>
                  <p className="text-[9px] opacity-75">{locale.panchanga.elementDesc}</p>
                </div>
                <div className={`p-3 rounded-xl border ${cardBgClass}`}>
                  <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{locale.panchanga.tithi}</span>
                  <p className="font-bold text-sm mt-0.5">{stripAsterisksAndMarkdown(avakahadaData.paksha, language)} {stripAsterisksAndMarkdown(avakahadaData.tithi, language)}</p>
                  <p className="text-[9px] opacity-75">{language === 'English' ? 'Yoga:' : 'योग:'} {stripAsterisksAndMarkdown(avakahadaData.yoga, language)}</p>
                </div>
              </div>

              {/* Manglik Dosha Verification Cartouche */}
              <div className={`p-3.5 rounded-2xl border ${cardBgClass} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">🛡️</span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider block text-amber-700 dark:text-amber-300">
                      {locale.panchanga.manglikTitle}
                    </span>
                    <p className="text-[11px] opacity-80 break-words leading-snug">
                      {avakahadaData.manglikStatus.isManglik 
                        ? `${locale.panchanga.manglikActive} (${avakahadaData.manglikStatus.severity})`
                        : locale.panchanga.manglikNirdosha}
                      {avakahadaData.manglikStatus.hasParihara && ` • ${locale.panchanga.pariharaText}`}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase flex-shrink-0 ${
                  avakahadaData.manglikStatus.isManglik ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {avakahadaData.manglikStatus.isManglik ? locale.panchanga.cautionBadge : locale.panchanga.auspiciousBadge}
                </span>
              </div>

              {/* Sacred Lucky Matrix */}
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04]">
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 mb-2">
                  {locale.panchanga.luckyTitle}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">{locale.panchanga.gemstone}</span> <strong className="break-words block leading-snug">{stripAsterisksAndMarkdown(avakahadaData.luckyGem)}</strong></div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">{locale.panchanga.metal}</span> <strong className="break-words block leading-snug">{stripAsterisksAndMarkdown(avakahadaData.luckyMetal)}</strong></div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">{locale.panchanga.color}</span> <strong className="break-words block leading-snug">{stripAsterisksAndMarkdown(avakahadaData.luckyColor)}</strong></div>
                  <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10"><span className="text-[9px] text-stone-500 dark:text-slate-400 block font-bold">{locale.panchanga.direction}</span> <strong className="break-words block leading-snug">{stripAsterisksAndMarkdown(avakahadaData.luckyDirection)}</strong></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs opacity-75">Avakahada details compiling...</div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.panchangaFooter}</span>
            <span>— {locale.footers.pagePrefix} 4 —</span>
            <span>{locale.footers.bookName}</span>
          </div>
        </div>
      );
    }

    // Pages 4 .. (4 + bhavaPages.length - 1): DEDICATED SEPARATE PAGES FOR EACH BHAVA (Pillar 2: Life Domains)
    // If details overflow from a single page, an extra continuation page (Part 2) is automatically inserted.
    if (pageIdx >= bhavaStartPage && pageIdx < dashaPageIdx) {
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
                <span>{locale.chapterLabels.chapter} {chapterNumber}</span>
                {totalParts > 1 && (
                  <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono text-[8px] font-bold">
                    {locale.chapterLabels.part} {part}/{totalParts}
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
              {locale.bhavaPillars.selectHouse}
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
                  title={`${b.name}`}
                >
                  <span>{getLocalizedHouse(b.houseNumber, language)}</span>
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
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">{locale.bhavaPillars.rashi}</span>
                    <span className="font-bold text-xs leading-snug block">{getLocalizedSign(bhava.rashiName, language)}</span>
                    <span className="text-[8px] text-stone-500 dark:text-slate-400">Sign #{bhava.rashiNumber}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">{locale.bhavaPillars.lord}</span>
                    <span className="font-bold text-xs leading-snug block">{getLocalizedPlanet(bhava.rashiLord, language)}</span>
                    <span className="text-[8px] text-stone-500 dark:text-slate-400">{locale.bhavaPillars.rulerLabel}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">{locale.bhavaPillars.karaka}</span>
                    <span className="font-bold text-xs leading-snug block">{getLocalizedPlanet(bhava.karakaPlanet, language)}</span>
                    <span className="text-[8px] text-stone-500 dark:text-slate-400">{locale.bhavaPillars.karakaLabel}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                    <span className="text-[8px] uppercase tracking-wider block font-bold text-amber-600 dark:text-amber-400">{locale.bhavaPillars.anatomy}</span>
                    <span className="font-semibold text-[10px] leading-tight block truncate" title={bhava.bodyParts}>{stripAsterisksAndMarkdown(bhava.bodyParts)}</span>
                    <span className="text-[8px] text-stone-500 dark:text-slate-400">{bhava.element}</span>
                  </div>
                </div>

                {/* Life Domain / Karakatva Overview */}
                <div className="p-2.5 rounded-xl bg-amber-500/[0.03] border border-amber-500/15 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏛️</span>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                        {locale.bhavaPillars.lifeDomain}
                      </span>
                      <p className="text-[11px] font-medium text-stone-700 dark:text-slate-300 leading-snug">
                        {stripAsterisksAndMarkdown(bhava.lifeDomain)}
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
                    <span>{locale.bhavaPillars.occupyingPlanets}</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                    {hasPlanets ? (
                      bhava.planets.map(p => (
                        <span key={p.planet} className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                          <span>{p.icon}</span>
                          <span>{getLocalizedPlanet(p.planet, language)}</span>
                          <span className="text-[8px] opacity-75">({getLocalizedDignity(p.dignity, language)})</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-stone-500 dark:text-slate-400 italic">
                        {locale.bhavaPillars.noPlanets}
                      </span>
                    )}
                  </div>
                </div>

                {/* Detailed Astrological Narrative (100% Free of Asterisks) */}
                <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-amber-500/15 space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>📜</span>
                    <span>{locale.bhavaPillars.analysisTitle}</span>
                  </h4>
                  <div className="text-xs leading-relaxed text-stone-800 dark:text-slate-200 whitespace-pre-line font-serif sm:text-[13px]">
                    {stripAsterisksAndMarkdown(bhava.detailedAnalysis)}
                  </div>
                </div>

                {/* Continuation Callout for Overflowed Content (Part 2) */}
                {totalParts > 1 ? (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                    <span className="text-[10px] font-medium flex items-center gap-1.5">
                      <span>✨</span>
                      <span>{locale.bhavaPillars.continuationBanner}</span>
                    </span>
                    <button
                      onClick={() => setCurrentPage(pageIdx + 1)}
                      className="px-2 py-1 rounded-lg bg-amber-500 text-amber-950 text-[10px] font-bold hover:bg-amber-400 transition-all flex items-center gap-0.5 flex-shrink-0 ml-2"
                    >
                      <span>{locale.bhavaPillars.goToPart2}</span>
                      <span>›</span>
                    </button>
                  </div>
                ) : (
                  /* Single Page Mode: Compact 3 Pillars */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                        🌟 {locale.bhavaPillars.boonsTitle}
                      </span>
                      <ul className="text-[10px] space-y-1">
                        {bhava.boons.map((b, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-emerald-500 flex-shrink-0">•</span>
                            <span className="leading-tight">{stripAsterisksAndMarkdown(b)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 block mb-1">
                        ⚠️ {locale.bhavaPillars.cautionsTitle}
                      </span>
                      <ul className="text-[10px] space-y-1">
                        {bhava.cautions.map((c, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-amber-500 flex-shrink-0">•</span>
                            <span className="leading-tight">{stripAsterisksAndMarkdown(c)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 block mb-1">
                        🪔 {locale.bhavaPillars.upayasTitle}
                      </span>
                      <ul className="text-[10px] space-y-1">
                        {bhava.remedies.map((r, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-purple-500 flex-shrink-0">•</span>
                            <span className="leading-tight">{stripAsterisksAndMarkdown(r)}</span>
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
                        {pageTitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25">
                      {locale.bhavaPillars.lord}: <strong>{getLocalizedPlanet(bhava.rashiLord, language)}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25">
                      {locale.bhavaPillars.karaka}: <strong>{getLocalizedPlanet(bhava.karakaPlanet, language)}</strong>
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
                        <span>{locale.bhavaPillars.boonsTitle}</span>
                      </span>
                      <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">
                        {bhava.boons.length} {locale.bhavaPillars.points}
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-stone-800 dark:text-slate-200">
                      {bhava.boons.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/15">
                          <span className="text-emerald-500 font-bold flex-shrink-0">✓</span>
                          <span className="leading-snug">{stripAsterisksAndMarkdown(b)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cautions */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>{locale.bhavaPillars.cautionsTitle}</span>
                      </span>
                      <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400">
                        {bhava.cautions.length} {locale.bhavaPillars.points}
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-stone-800 dark:text-slate-200">
                      {bhava.cautions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 bg-amber-500/5 p-2 rounded-xl border border-amber-500/15">
                          <span className="text-amber-500 font-bold flex-shrink-0">!</span>
                          <span className="leading-snug">{stripAsterisksAndMarkdown(c)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Upayas */}
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <span>🪔</span>
                        <span>{locale.bhavaPillars.upayasTitle}</span>
                      </span>
                      <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">
                        {bhava.remedies.length} {locale.bhavaPillars.remediesCount}
                      </span>
                    </div>
                    <ul className="text-xs space-y-1.5 text-stone-800 dark:text-slate-200">
                      {bhava.remedies.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 bg-purple-500/5 p-2 rounded-xl border border-purple-500/15">
                          <span className="text-purple-500 font-bold flex-shrink-0">🪔</span>
                          <span className="leading-snug">{stripAsterisksAndMarkdown(r)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Astrological Synthesis & Divine Guidance */}
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] text-xs leading-relaxed text-stone-700 dark:text-slate-300">
                  <strong className="text-amber-600 dark:text-amber-400 block mb-0.5 text-[11px]">
                    {locale.bhavaPillars.counselTitle}
                  </strong>
                  {locale.counsel.counselTemplate(getLocalizedPlanet(bhava.rashiLord, language), getLocalizedPlanet(bhava.karakaPlanet, language), stripAsterisksAndMarkdown(bhava.lifeDomain))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.bhavaFooter}</span>
            <span>— {locale.footers.pagePrefix} {pageIdx + 1} —</span>
            <span>{getLocalizedHouse(bhava.houseNumber, language)} {totalParts > 1 ? `(${locale.chapterLabels.part} ${part}/${totalParts})` : ''}</span>
          </div>
        </div>
      );
    }

    // Page dashaPageIdx: Pillar 3 — Cosmic Timing (Dasha Systems)
    if (pageIdx === dashaPageIdx) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.sixPillars.pillar3Title}
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                {locale.mahadasha.title} • {locale.sixPillars.pillar3Subtitle}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              Vimshottari 120Y
            </span>
          </div>

          <div className="space-y-3.5 my-auto overflow-y-auto max-h-[600px] no-scrollbar pr-1">
            {/* Philosophical Framework Definition */}
            <div className="p-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-xs text-stone-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-amber-700 dark:text-amber-300 block mb-1 font-bold">
                ⏳ {locale.sixPillars.pillar3Title}
              </strong>
              <p>{locale.sixPillars.vimshottariDesc}</p>
            </div>

            {/* 120-Year Vimshottari Mahadasha 9 Major Planetary Cycles */}
            {displayMahadashas.length > 0 && (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-1.5 flex items-center justify-between">
                  <span>⏳ 120-Year Mahadasha Planetary Cycle</span>
                  <span className="text-[9px] font-normal text-stone-500 dark:text-slate-400">
                    {locale.mahadasha.activeBadge}
                  </span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5">
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
                        <span className="text-[10px] font-bold block break-words leading-tight">
                          {getLocalizedPlanet(dasha.planet, language)}
                        </span>
                        <span className="text-[9px] font-mono text-amber-700 dark:text-amber-300 block whitespace-nowrap">
                          {dasha.startYear}–{dasha.endYear}
                        </span>
                        {isCurrent && (
                          <span className="text-[8px] uppercase tracking-widest font-black text-amber-900 dark:text-amber-200 block bg-amber-400/30 rounded mt-0.5">
                            {locale.mahadasha.activeSeal}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Mahadasha's Antardashas Sub-Periods Table */}
            {antardashasData.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span>🔮</span>
                    <span>{locale.sixPillars.antardashaTitle} ({getLocalizedPlanet(activeMahadasha?.planet || 'Sun', language)} Mahadasha)</span>
                  </h4>
                  <span className="text-[9px] font-mono text-amber-700 dark:text-amber-300 font-bold">
                    9 Sub-Periods
                  </span>
                </div>
                <p className="text-[10px] text-stone-600 dark:text-slate-400 leading-snug">
                  {locale.sixPillars.antardashaDesc}
                </p>
                <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-black/5 dark:bg-white/5">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold">
                        <th className="py-1.5 px-3">Sub-Period (Antardasha)</th>
                        <th className="py-1.5 px-3">Start Date</th>
                        <th className="py-1.5 px-3">End Date</th>
                        <th className="py-1.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-500/10">
                      {antardashasData.map((ad, idx) => (
                        <tr key={idx} className={ad.isCurrent ? 'bg-amber-500/15 font-bold' : 'hover:bg-amber-500/5'}>
                          <td className="py-1.5 px-3 flex items-center gap-1.5">
                            <span>{getPlanetIcon(ad.planet)}</span>
                            <span>{getLocalizedPlanet(ad.planet, language)}</span>
                          </td>
                          <td className="py-1.5 px-3 font-mono text-[10px]">{ad.startDate}</td>
                          <td className="py-1.5 px-3 font-mono text-[10px]">{ad.endDate}</td>
                          <td className="py-1.5 px-3 text-right">
                            {ad.isCurrent ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                Active Now
                              </span>
                            ) : (
                              <span className="text-[9px] opacity-60">{ad.durationMonths} Months</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Shani Sade Sati 3-Phase Transit Timeline */}
            {displaySaadesati.length > 0 && (
              <div className="pt-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <span>🪐</span>
                  <span>{locale.mahadasha.sadesatiTitle}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {displaySaadesati.map((cycle, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl border ${cardBgClass} flex flex-col justify-between`}>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            {cycle.status || 'Transit'}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {cycle.startDate && cycle.endDate ? `${cycle.startDate}–${cycle.endDate}` : `${cycle.startYear}–${cycle.endYear}`}
                          </span>
                        </div>
                        <h5 className="font-bold text-xs">{stripAsterisksAndMarkdown(cycle.phase)}</h5>
                        {cycle.description && (
                          <p className="text-[10px] opacity-85 mt-1 leading-relaxed break-words">
                            {stripAsterisksAndMarkdown(cycle.description)}
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
            <span>{locale.footers.mahadashaFooter}</span>
            <span>— {locale.footers.pagePrefix} {pageIdx + 1} —</span>
            <span>{locale.sixPillars.pillar3Title}</span>
          </div>
        </div>
      );
    }

    // Page shadbalaPageIdx: Pillar 4 (Part 1) — Karmic Blueprint & Strengths (Nakshatras & Shadbala Table)
    if (pageIdx === shadbalaPageIdx) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.sixPillars.pillar4Title} • {locale.chapterLabels.part} 1
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                {locale.sixPillars.shadbalaTitle} & {locale.cardinalPoints.nakshatra}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              Shadbala Granth
            </span>
          </div>

          <div className="space-y-3.5 my-auto overflow-y-auto max-h-[600px] no-scrollbar pr-1">
            {/* Nakshatras (Lunar Mansions) Core Psychology & Destiny Nuance */}
            <div className="p-3.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>Janma Nakshatra: {stripAsterisksAndMarkdown(analysis.nakshatra)} ({stripAsterisksAndMarkdown(avakahadaData?.nakshatra || 'Rohini')})</span>
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold">
                  27 Lunar Mansions
                </span>
              </div>
              <p className="text-xs leading-relaxed text-stone-700 dark:text-slate-300">
                {locale.sixPillars.nakshatrasDesc}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10">
                  <span className="text-[9px] opacity-75 uppercase block font-bold text-amber-600 dark:text-amber-400">Star Lord</span>
                  <span className="font-bold">{getLocalizedPlanet(analysis.starLord || 'Moon', language)}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10">
                  <span className="text-[9px] opacity-75 uppercase block font-bold text-amber-600 dark:text-amber-400">Sub Lord</span>
                  <span className="font-bold">{getLocalizedPlanet(analysis.subLord || 'Jupiter', language)}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10">
                  <span className="text-[9px] opacity-75 uppercase block font-bold text-amber-600 dark:text-amber-400">Gana</span>
                  <span className="font-bold">{stripAsterisksAndMarkdown(avakahadaData?.gana, language) || 'Deva'}</span>
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/10">
                  <span className="text-[9px] opacity-75 uppercase block font-bold text-amber-600 dark:text-amber-400">Yoni</span>
                  <span className="font-bold">{stripAsterisksAndMarkdown(avakahadaData?.yoni, language) || 'Gaja'}</span>
                </div>
              </div>
            </div>

            {/* Shadbala (Six-fold Mathematical Strength Table) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span>⚖️</span>
                    <span>{locale.sixPillars.shadbalaTitle}</span>
                  </h4>
                  <p className="text-[10px] text-stone-600 dark:text-slate-400 mt-0.5">
                    {locale.sixPillars.shadbalaDesc}
                  </p>
                </div>
              </div>

              {shadbalaData.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border-2 border-amber-500/30 bg-amber-500/[0.02] shadow-sm">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold">
                        <th className="py-2 px-3">Graha</th>
                        <th className="py-2 px-2 text-center" title="Sthana Bala (Positional Strength)">Sthana</th>
                        <th className="py-2 px-2 text-center" title="Dig Bala (Directional Strength)">Dig</th>
                        <th className="py-2 px-2 text-center" title="Kaala Bala (Temporal Strength)">Kaala</th>
                        <th className="py-2 px-2 text-center" title="Cheshta Bala (Motional Strength)">Cheshta</th>
                        <th className="py-2 px-2 text-center" title="Naisargika Bala (Natural Strength)">Naisargika</th>
                        <th className="py-2 px-2 text-center" title="Drik Bala (Aspectual Strength)">Drik</th>
                        <th className="py-2 px-2 text-center font-bold">Total / Req</th>
                        <th className="py-2 px-3 text-right">Potency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-500/15">
                      {shadbalaData.map((sb) => (
                        <tr key={sb.planet} className="hover:bg-amber-500/10 transition-colors">
                          <td className="py-1.5 px-3 font-semibold flex items-center gap-1.5">
                            <span>{getPlanetIcon(sb.planet)}</span>
                            <span>{getLocalizedPlanet(sb.planet, language)}</span>
                          </td>
                          <td className="py-1.5 px-2 text-center font-mono text-[10px]">{sb.sthanaBala}</td>
                          <td className="py-1.5 px-2 text-center font-mono text-[10px]">{sb.digBala}</td>
                          <td className="py-1.5 px-2 text-center font-mono text-[10px]">{sb.kaalaBala}</td>
                          <td className="py-1.5 px-2 text-center font-mono text-[10px]">{sb.cheshtaBala}</td>
                          <td className="py-1.5 px-2 text-center font-mono text-[10px]">{sb.naisargikaBala}</td>
                          <td className="py-1.5 px-2 text-center font-mono text-[10px]">{sb.drikBala}</td>
                          <td className="py-1.5 px-2 text-center font-mono font-bold text-[10px]">
                            {sb.totalRupas} / {sb.requiredRupas} ({sb.ratioPercent}%)
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              sb.strengthStatus === 'Exceptional' || sb.strengthStatus === 'Strong'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : sb.strengthStatus === 'Sufficient' || sb.strengthStatus === 'Moderate'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}>
                              {sb.deliveringPower}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs opacity-75">Compiling Shadbala six-fold mathematical matrices...</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.bookName}</span>
            <span>— {locale.footers.pagePrefix} {pageIdx + 1} —</span>
            <span>{locale.sixPillars.shadbalaTitle}</span>
          </div>
        </div>
      );
    }

    // Page yogasPageIdx: Pillar 4 (Part 2) — Karmic Blueprint & Strengths (Classical Vedic Yogas & Karmic Doshas)
    if (pageIdx === yogasPageIdx) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.sixPillars.pillar4Title} • {locale.chapterLabels.part} 2
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                {locale.sixPillars.yogasTitle} & {locale.sixPillars.doshasTitle}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              Yoga & Dosha
            </span>
          </div>

          <div className="space-y-3.5 my-auto overflow-y-auto max-h-[600px] no-scrollbar pr-1">
            {/* Special Planetary Combinations (Vedic Yogas) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span>👑</span>
                  <span>{locale.sixPillars.yogasTitle}</span>
                </h4>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {yogasData.filter(y => y.isActive).length} Formed
                </span>
              </div>
              <p className="text-[10px] text-stone-600 dark:text-slate-400 leading-snug">
                {locale.sixPillars.yogasDesc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {yogasData.slice(0, 6).map((yoga, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      yoga.isActive
                        ? 'bg-amber-500/[0.06] border-amber-500/40 shadow-sm'
                        : 'bg-black/5 dark:bg-white/5 border-amber-500/10 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-amber-800 dark:text-amber-200 text-xs">
                          {stripAsterisksAndMarkdown(yoga.name)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          yoga.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-stone-500/20 text-stone-400 border border-stone-500/30'
                        }`}>
                          {yoga.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-700 dark:text-slate-300 leading-snug">
                        {stripAsterisksAndMarkdown(yoga.description)}
                      </p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-amber-500/15 flex items-center justify-between text-[9px] text-amber-700 dark:text-amber-300">
                      <span>Planets: {yoga.planetsInvolved.join(', ')}</span>
                      <span className="font-medium italic">{stripAsterisksAndMarkdown(yoga.lifeImpact)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Planetary Afflictions & Karmic Debts (Doshas) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>{locale.sixPillars.doshasTitle}</span>
                </h4>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                  Classical Parihara Check
                </span>
              </div>
              <p className="text-[10px] text-stone-600 dark:text-slate-400 leading-snug">
                {locale.sixPillars.doshasDesc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {doshasData.map((dosha, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                      dosha.isActive
                        ? 'bg-orange-500/[0.06] border-orange-500/30'
                        : 'bg-emerald-500/[0.05] border-emerald-500/25'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-amber-900 dark:text-amber-100">
                          {stripAsterisksAndMarkdown(dosha.name)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          dosha.isActive
                            ? dosha.cancellationText
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {dosha.cancellationText ? 'Parihara Cancelled' : dosha.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-700 dark:text-slate-300 leading-snug">
                        {stripAsterisksAndMarkdown(dosha.explanation)}
                      </p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-amber-500/15 text-[9px] text-amber-800 dark:text-amber-200">
                      <strong>Remedy / Upaya:</strong> {stripAsterisksAndMarkdown(dosha.remedy)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.bookName}</span>
            <span>— {locale.footers.pagePrefix} {pageIdx + 1} —</span>
            <span>{locale.sixPillars.yogasTitle}</span>
          </div>
        </div>
      );
    }

    // Page vargasPageIdx: Pillar 5 — Divisional Charts (Vargas: D9 Navamsha, D10 Dashamsha, D7 Saptamsha)
    if (pageIdx === vargasPageIdx) {
      const activeVargaKey = selectedVarga.toLowerCase() as 'd9' | 'd10' | 'd7';
      const activeVargaDetail = divisionalChartsData[activeVargaKey] || divisionalChartsData.d9;

      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.sixPillars.pillar5Title}
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                {activeVargaDetail.name} ({selectedVarga}) • {locale.sixPillars.pillar5Subtitle}
              </h3>
            </div>
            {/* Interactive Varga Selector Tabs */}
            <div className="flex items-center gap-1 bg-amber-500/10 p-1 rounded-xl border border-amber-500/30">
              {(['D9', 'D10', 'D7'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVarga(v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedVarga === v
                      ? 'bg-amber-500 text-amber-950 font-black shadow-sm'
                      : 'text-stone-700 dark:text-slate-300 hover:bg-amber-500/20'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5 my-auto overflow-y-auto max-h-[600px] no-scrollbar pr-1">
            {/* Varga Purpose & Description Card */}
            <div className="p-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-xs text-stone-700 dark:text-slate-300 leading-relaxed">
              <div className="flex items-center justify-between mb-1">
                <strong className="text-amber-700 dark:text-amber-300 text-xs font-bold">
                  🏛️ {activeVargaDetail.name} ({activeVargaDetail.id}) — {activeVargaDetail.title}
                </strong>
                <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold">
                  Microscopic Divisional Analysis
                </span>
              </div>
              <p>{stripAsterisksAndMarkdown(activeVargaDetail.description)}</p>
            </div>

            {/* Divisional North Indian Diamond Chart & Planetary Positions in Varga */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Diamond Chart of the Selected Varga */}
              <div className="md:col-span-7 flex justify-center p-3 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20">
                <div className="scale-95 sm:scale-100 transform origin-center">
                  <KundaliChart
                    data={activeVargaDetail.chart}
                    lagnaSign={activeVargaDetail.lagnaSign}
                  />
                </div>
              </div>

              {/* Planetary Placements in this Varga */}
              <div className="md:col-span-5 space-y-2">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Planetary Placements in {selectedVarga}
                </h4>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {planetaryPositionsData.slice(0, 8).map((p) => {
                    const houseInVarga = Object.entries(activeVargaDetail.chart).find(([_, planets]) =>
                      (planets as string[]).some(pl => pl.toLowerCase().includes(p.planet.toLowerCase()))
                    )?.[0] || '1';

                    return (
                      <div key={p.planet} className={`p-2 rounded-xl border ${cardBgClass} flex items-center gap-1.5`}>
                        <span className="text-base">{p.icon}</span>
                        <div>
                          <span className="font-bold text-[11px] block">{getLocalizedPlanet(p.planet, language)}</span>
                          <span className="text-[9px] opacity-75">{getLocalizedHouse(parseInt(houseInVarga, 10), language)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/15 text-[10px] text-stone-600 dark:text-slate-400 leading-snug">
                  {selectedVarga === 'D9' && locale.sixPillars.d9Desc}
                  {selectedVarga === 'D10' && locale.sixPillars.d10Desc}
                  {selectedVarga === 'D7' && locale.sixPillars.d7Desc}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.bookName}</span>
            <span>— {locale.footers.pagePrefix} {pageIdx + 1} —</span>
            <span>{locale.sixPillars.pillar5Title} ({selectedVarga})</span>
          </div>
        </div>
      );
    }

    // Page remediesPageIdx: Pillar 6 — Practical Remedies (Upayas: Gemstones, Mantra & Japa, Charity & Rituals)
    if (pageIdx === remediesPageIdx) {
      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-3 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.sixPillars.pillar6Title}
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass}`}>
                {locale.sixPillars.pillar6Subtitle}
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              Vedic Upayas
            </span>
          </div>

          <div className="space-y-3.5 my-auto overflow-y-auto max-h-[600px] no-scrollbar pr-1">
            {/* Philosophical Framework */}
            <div className="p-3 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-xs text-stone-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-amber-700 dark:text-amber-300 block mb-1 font-bold">
                🪔 Vedic Karma Transformation
              </strong>
              <p>
                Vedic astrology is anchored in the concept of transforming one's karma through conscious, disciplined effort. Actionable remedies balance celestial frequencies and mitigate karmic afflictions.
              </p>
            </div>

            {/* 3 Core Remedy Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
              {/* Gemstone Recommendations */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
                    <span>💎</span>
                    <span>{locale.sixPillars.gemstonesTitle}</span>
                  </h4>
                  <p className="text-[10px] text-stone-600 dark:text-slate-400 leading-snug">
                    {locale.sixPillars.gemstonesDesc}
                  </p>
                  <div className="space-y-1.5 mt-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Primary Gemstone</span>
                      <strong className="text-xs block">{practicalRemediesData.gemstones.primary.name} ({practicalRemediesData.gemstones.primary.sanskritName})</strong>
                      <span className="text-[9px] opacity-75">
                        {practicalRemediesData.gemstones.secondary ? `Substitute: ${practicalRemediesData.gemstones.secondary.name}` : `Planet: ${practicalRemediesData.gemstones.primary.planet}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-emerald-500/15">
                        <span className="opacity-75 block">Weight</span>
                        <strong>{practicalRemediesData.gemstones.primary.carat}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-emerald-500/15">
                        <span className="opacity-75 block">Metal</span>
                        <strong>{practicalRemediesData.gemstones.primary.metal}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-emerald-500/15">
                        <span className="opacity-75 block">Finger</span>
                        <strong>{practicalRemediesData.gemstones.primary.finger}</strong>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-emerald-500/15">
                        <span className="opacity-75 block">Auspicious Day</span>
                        <strong>{practicalRemediesData.gemstones.primary.dayTime}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-emerald-500/20 text-[9px] italic">
                  <strong>Mantra:</strong> {practicalRemediesData.gemstones.primary.mantra}
                </div>
              </div>

              {/* Mantra & Japa */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <span>🕉️</span>
                    <span>{locale.sixPillars.mantraTitle}</span>
                  </h4>
                  <p className="text-[10px] text-stone-600 dark:text-slate-400 leading-snug">
                    {locale.sixPillars.mantraDesc}
                  </p>
                  <div className="space-y-1.5 mt-2">
                    {practicalRemediesData.mantras.slice(0, 2).map((m, mIdx) => (
                      <div key={mIdx} className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400 block">{m.type} ({m.planet})</span>
                        <strong className="text-[11px] block">{m.mantraText}</strong>
                        <span className="text-[9px] opacity-75">{m.repetitions} • {m.optimalTiming}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-amber-500/20 text-[9px] flex items-center justify-between">
                  <span>Count: 108 Repetitions</span>
                  <span className="font-bold">Mala: {practicalRemediesData.mantras[0]?.rosary || 'Rudraksha / Tulsi'}</span>
                </div>
              </div>

              {/* Charity (Daan) & Rituals */}
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                    <span>🕊️</span>
                    <span>{locale.sixPillars.charityTitle}</span>
                  </h4>
                  <p className="text-[10px] text-stone-600 dark:text-slate-400 leading-snug">
                    {locale.sixPillars.charityDesc}
                  </p>
                  <div className="space-y-1.5 mt-2">
                    {practicalRemediesData.charities.slice(0, 2).map((c, cIdx) => (
                      <div key={cIdx} className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <span className="text-[9px] uppercase font-bold text-purple-600 dark:text-purple-400 block">{c.planet} Daan • {c.targetDay}</span>
                        <span className="text-[11px] font-semibold block">{c.items}</span>
                        <span className="text-[9px] opacity-75">Recipient: {c.recipient}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-black/5 dark:bg-white/5 border border-purple-500/20 text-[9px]">
                  <strong>Karmic Benefit:</strong> {practicalRemediesData.charities[0]?.karmicBenefit || 'Mitigates malefic planetary affliction'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.bookName}</span>
            <span>— {locale.footers.pagePrefix} {pageIdx + 1} —</span>
            <span>{locale.sixPillars.pillar6Title}</span>
          </div>
        </div>
      );
    }

    // Dynamic AI Life Chapters (Following dedicated Bhava pages)
    // Long chapters cleanly flow across pages without inner scrollbar or truncation!
    const aiOffset = pageIdx - aiChaptersStartPage;
    if (aiOffset >= 0 && aiOffset < aiPages.length) {
      const ap = aiPages[aiOffset];
      const chapterNumber = bhavaPages.length + 5 + Math.floor(aiOffset / 2) + 1;

      return (
        <div className="relative h-full flex flex-col justify-between p-6 sm:p-10 select-none">
          <BookBorderFlourish theme={bookTheme} />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2 mb-4 pt-2">
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                {locale.chapterLabels.chapter} {chapterNumber} {ap.totalParts > 1 ? `• ${locale.chapterLabels.part} ${ap.part}/${ap.totalParts}` : ''}
              </span>
              <h3 className={`text-base sm:text-xl font-devanagari font-bold ${textTitleClass} flex items-center gap-2`}>
                <span>{ap.icon}</span>
                <span>{stripAsterisksAndMarkdown(ap.cleanTitle)}</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              {locale.footers.bookName}
            </span>
          </div>

          {/* Chapter Content & Highlights */}
          <div className="space-y-4 my-auto text-xs leading-relaxed text-stone-800 dark:text-slate-200">
            {/* Highlights Grid (Strengths, Cautions, Remedies) */}
            {(ap.strengths.length > 0 || ap.cautions.length > 0 || ap.remedies.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ap.strengths.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 block mb-1">
                      🌟 {locale.bhavaPillars.boonsTitle}
                    </span>
                    <ul className="text-[10px] space-y-1">
                      {ap.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-emerald-500">•</span>
                          <span>{stripAsterisksAndMarkdown(s)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {ap.cautions.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 block mb-1">
                      ⚠️ {locale.bhavaPillars.cautionsTitle}
                    </span>
                    <ul className="text-[10px] space-y-1">
                      {ap.cautions.map((c, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-amber-500">•</span>
                          <span>{stripAsterisksAndMarkdown(c)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {ap.remedies.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30">
                    <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 block mb-1">
                      🪔 {locale.bhavaPillars.upayasTitle}
                    </span>
                    <ul className="text-[10px] space-y-1">
                      {ap.remedies.map((r, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-purple-500">•</span>
                          <span>{stripAsterisksAndMarkdown(r)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Markdown Chapter Text without Asterisks */}
            <div className={`p-4 rounded-2xl border ${cardBgClass} prose prose-sm dark:prose-invert leading-relaxed text-xs`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{stripAsterisksAndMarkdown(ap.content)}</ReactMarkdown>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4">
            <span>{locale.footers.bookName}</span>
            <span>— {locale.footers.pagePrefix} {pageIdx + 1} —</span>
            <span className="break-words">{stripAsterisksAndMarkdown(ap.cleanTitle)}</span>
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
            {locale.chapterLabels.epilogueTitle}
          </span>
          <h3 className={`text-xl sm:text-2xl font-devanagari font-bold mt-1 ${textTitleClass}`}>
            {locale.epilogue.headerTitle}
          </h3>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2"></div>
        </div>

        {/* Sacred Mantras & Colophon */}
        <div className="space-y-4 my-auto max-w-lg mx-auto">
          {/* Maha Mrityunjaya Mantra */}
          <div className={`p-4 rounded-2xl border ${cardBgClass}`}>
            <span className="text-[9px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 block mb-1">
              {locale.epilogue.mantra1Label}
            </span>
            <p className="font-devanagari text-sm font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
              ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्।<br />
              उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय माऽमृतात्॥
            </p>
          </div>

          {/* Gayatri Mantra */}
          <div className={`p-4 rounded-2xl border ${cardBgClass}`}>
            <span className="text-[9px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 block mb-1">
              {locale.epilogue.mantra2Label}
            </span>
            <p className="font-devanagari text-sm font-bold text-amber-800 dark:text-amber-200 leading-relaxed">
              ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्॥
            </p>
          </div>

          {/* Astrological Verification Seal */}
          <div className="p-4 rounded-2xl border-2 border-amber-500/40 bg-amber-500/[0.05] flex items-center justify-around">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500 flex items-center justify-center font-devanagari text-xs font-black text-amber-700 dark:text-amber-300 text-center px-1">
              {locale.epilogue.sealBadge}
            </div>
            <div className="text-left">
              <h5 className="font-cinzel font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                {locale.epilogue.sealTitle}
              </h5>
              <p className="text-[10px] text-stone-500 dark:text-slate-400">
                {locale.epilogue.sealCalculations(KUNDALI_SYSTEMS.find(s => s.id === system)?.name || 'Vedic')}
              </p>
              <p className="text-[9px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                {locale.epilogue.refIdPrefix}{Date.now().toString().slice(-6)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-amber-500/20 pt-2 text-[10px] font-mono text-stone-500 dark:text-slate-400 px-4 flex items-center justify-between">
          <span>{locale.footers.epilogueFooter}</span>
          <span>— {locale.footers.pagePrefix} {totalPages} —</span>
          <span>{locale.footers.bookName}</span>
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
                <span>{locale.navigation.prevPage}</span>
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
                  <option value={0}>Page 1: {locale.navigation.coverOption}</option>
                  <option value={1}>Page 2: {locale.sixPillars.pillar1Title} • {locale.cardinalPoints.lagna} & {locale.cardinalPoints.moonSign}</option>
                  <option value={2}>Page 3: {locale.sixPillars.pillar1Title} • {locale.planetHeaders.planet} Sphuta</option>
                  <option value={3}>Page 4: {locale.navigation.panchangaOption}</option>
                  {bhavaPages.map((bp, bpIdx) => (
                    <option key={`bhava-pg-${bpIdx}`} value={bhavaStartPage + bpIdx}>
                      Page {bhavaStartPage + bpIdx + 1}: {getLocalizedHouse(bp.bhava.houseNumber, language)} ({getLocalizedSign(bp.bhava.rashiName, language)}) {bp.totalParts > 1 ? `[${bp.part}/2]` : ''}
                    </option>
                  ))}
                  <option value={dashaPageIdx}>Page {dashaPageIdx + 1}: {locale.sixPillars.pillar3Title}</option>
                  <option value={shadbalaPageIdx}>Page {shadbalaPageIdx + 1}: {locale.sixPillars.pillar4Title} (Part 1) • {locale.sixPillars.shadbalaTitle}</option>
                  <option value={yogasPageIdx}>Page {yogasPageIdx + 1}: {locale.sixPillars.pillar4Title} (Part 2) • {locale.sixPillars.yogasTitle}</option>
                  <option value={vargasPageIdx}>Page {vargasPageIdx + 1}: {locale.sixPillars.pillar5Title}</option>
                  <option value={remediesPageIdx}>Page {remediesPageIdx + 1}: {locale.sixPillars.pillar6Title}</option>
                  {aiPages.map((ap, idx) => (
                    <option key={`ai-pg-${idx}`} value={aiChaptersStartPage + idx}>
                      Page {aiChaptersStartPage + idx + 1}: {ap.cleanTitle} {ap.totalParts > 1 ? `[${ap.part}/2]` : ''}
                    </option>
                  ))}
                  <option value={totalPages - 1}>Page {totalPages}: {locale.navigation.epilogueOption}</option>
                </select>
              </div>

              <button
                onClick={handleNext}
                disabled={currentPage >= totalPages - 2}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <span>{locale.navigation.nextPage}</span>
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
