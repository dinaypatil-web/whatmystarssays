
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getNumerologyAnalysis, askNumerologyQuestion } from '../services/aiService';
import { Language, ChatMessage } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StorageService } from '../services/storageService';
import { BirthDetails } from '../types';

const CHALDEAN_MAP: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

const PLANET_NUMBER_DATA: Record<number, { planet: string; icon: string; traits: string }> = {
  1: { planet: 'Sun (Surya)', icon: '☀️', traits: 'Leadership, Authority, Fame' },
  2: { planet: 'Moon (Chandra)', icon: '🌙', traits: 'Intuition, Creativity, Diplomacy' },
  3: { planet: 'Jupiter (Guru)', icon: '♃', traits: 'Wisdom, Expansion, Honor' },
  4: { planet: 'Rahu', icon: '☊', traits: 'Innovation, Strategy, Ambition' },
  5: { planet: 'Mercury (Budh)', icon: '☿', traits: 'Commerce, Communication, Quick Luck' },
  6: { planet: 'Venus (Shukra)', icon: '♀', traits: 'Luxury, Harmony, Popularity' },
  7: { planet: 'Ketu', icon: '☋', traits: 'Intuition, Deep Research, Mysticism' },
  8: { planet: 'Saturn (Shani)', icon: '🪐', traits: 'Discipline, Karma, Perseverance' },
  9: { planet: 'Mars (Mangal)', icon: '♂️', traits: 'Courage, Energy, High Drive' },
};

const calculateNameNumber = (fullName: string) => {
  if (!fullName) return null;
  const cleanName = fullName.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanName) return null;

  let compound = 0;
  for (const char of cleanName) {
    compound += CHALDEAN_MAP[char] || 0;
  }

  const sumDigits = (num: number): number => {
    let sum = num.toString().split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    return sum > 9 ? sumDigits(sum) : sum;
  };

  const single = sumDigits(compound);

  return {
    compound,
    single,
    planetInfo: PLANET_NUMBER_DATA[single] || { planet: 'Cosmic Vibration', icon: '✨', traits: 'Harmonious Flow' }
  };
};

const checkNameCompatibility = (namaank: number, mulank: number, bhagyank: number) => {
  const FRIENDLY_MAP: Record<number, number[]> = {
    1: [1, 2, 3, 5, 9],
    2: [1, 2, 3, 5],
    3: [1, 2, 3, 5, 9],
    4: [1, 5, 6, 7],
    5: [1, 2, 3, 5, 6],
    6: [1, 5, 6, 7],
    7: [1, 2, 4, 5],
    8: [3, 5, 6],
    9: [1, 2, 3, 5],
  };

  const ENEMY_MAP: Record<number, number[]> = {
    1: [6, 8],
    2: [4, 8, 9],
    3: [6],
    4: [2, 4, 8, 9],
    5: [],
    6: [3],
    7: [8, 9],
    8: [1, 2, 4, 8, 9],
    9: [4, 6, 7, 8],
  };

  const isMulankEnemy = ENEMY_MAP[mulank]?.includes(namaank);
  const isBhagyankEnemy = ENEMY_MAP[bhagyank]?.includes(namaank);

  if (isMulankEnemy || isBhagyankEnemy) {
    return {
      status: 'conflict',
      label: '⚠️ Vibration Friction',
      badgeClass: 'bg-red-500/20 text-red-300 border-red-500/40',
      description: 'Your current name frequency clashes with birth energies, which can attract unnecessary delays or resistance. Name correction is strongly recommended.',
    };
  }

  const isMulankFriendly = FRIENDLY_MAP[mulank]?.includes(namaank);
  const isBhagyankFriendly = FRIENDLY_MAP[bhagyank]?.includes(namaank);

  if (isMulankFriendly && isBhagyankFriendly) {
    return {
      status: 'excellent',
      label: '🌟 Highly Harmonious',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Your name frequency resonates smoothly with both your Psychic and Destiny numbers, accelerating your natural luck and progress.',
    };
  }

  return {
    status: 'neutral',
    label: '⚖️ Balanced Resonance',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Your current name is workable, but adjusting spelling to a master compound frequency (such as 24, 32, 37, 42) can unlock higher prosperity.',
  };
};

interface NumerologyViewProps {
  language: Language;
}

const NumerologyView: React.FC<NumerologyViewProps> = ({ language }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [testName, setTestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [numerologyData, setNumerologyData] = useState<{
    mulank: number;
    bhagyank: number;
    loshu: (number | null)[][];
  } | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [profiles, setProfiles] = useState<BirthDetails[]>(StorageService.getProfiles());

  const nameData = useMemo(() => calculateNameNumber(name), [name]);
  const testNameData = useMemo(() => calculateNameNumber(testName), [testName]);

  const compatibility = useMemo(() => {
    if (!nameData || !numerologyData) return null;
    return checkNameCompatibility(nameData.single, numerologyData.mulank, numerologyData.bhagyank);
  }, [nameData, numerologyData]);

  const handleProfileSelect = (profileName: string) => {
    const profile = profiles.find(p => p.name === profileName);
    if (profile) {
      setName(profile.name);
      setDob(profile.dob);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, chatLoading]);

  const calculateNumerology = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    const day = parts[2];

    const sumDigits = (num: number): number => {
      let sum = num.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
      return sum > 9 ? sumDigits(sum) : sum;
    };

    const mulank = sumDigits(parseInt(day));
    const fullSum = dateStr.replace(/-/g, '').split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    const bhagyank = sumDigits(fullSum);

    const digits = dateStr.replace(/-/g, '').split('').map(Number);
    const gridLayout = [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6]
    ];

    const loshu = gridLayout.map(row => 
      row.map(num => digits.includes(num) ? num : null)
    );

    return { mulank, bhagyank, loshu };
  };

  useEffect(() => {
    const data = calculateNumerology(dob);
    setNumerologyData(data);
  }, [dob]);

  // Automatically refresh Numerology analysis when language changes
  useEffect(() => {
    if (analysis && numerologyData && dob) {
      const reloadLanguage = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await getNumerologyAnalysis(dob, numerologyData.mulank, numerologyData.bhagyank, numerologyData.loshu, language, name);
          setAnalysis(result);
        } catch (err: any) {
          console.error("Numerology language reload failed", err);
        } finally {
          setLoading(false);
        }
      };
      reloadLanguage();
    }
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numerologyData) return;
    setLoading(true);
    setError(null);
    setChatHistory([]);
    try {
      const result = await getNumerologyAnalysis(dob, numerologyData.mulank, numerologyData.bhagyank, numerologyData.loshu, language, name);
      setAnalysis(result);
      if (name.trim()) {
        StorageService.saveProfile({ name: name.trim(), dob, tob: '', location: '' });
        setProfiles(StorageService.getProfiles());
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Celestial numerology failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || !numerologyData || chatLoading) return;

    const currentQuery = userQuery;
    setUserQuery('');
    setChatHistory(prev => [...prev, { role: 'user', text: currentQuery }]);
    setChatLoading(true);

    try {
      const response = await askNumerologyQuestion(
        currentQuery, 
        dob, 
        numerologyData.mulank, 
        numerologyData.bhagyank, 
        numerologyData.loshu, 
        chatHistory, 
        language,
        name
      );
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', text: "The numbers were obscured." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = async () => {
    const elementId = 'numerology-report-area';
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

      pdf.save(`Full_Numerology_Report_${name ? name.trim().replace(/\s+/g, '_') + '_' : ''}${dob}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {!analysis && !loading && (
        <section className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700 shadow-2xl no-print">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-cinzel text-amber-400 mb-2">Numerology, Loshu & Name Correction</h2>
            <p className="text-slate-400">Discover your Mulank, Bhagyank, and harmonized Chaldean Name spelling.</p>
          </div>

          <div className="max-w-md mx-auto mb-8">
             <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[10px] font-black text-amber-500/70 uppercase tracking-[0.3em]">Quick Load Saved Profile 📂</span>
             </div>
             <select 
               onChange={(e) => handleProfileSelect(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none hover:bg-slate-800 transition-all text-sm"
             >
               <option value="">Select a saved profile...</option>
               {profiles.map(p => (
                 <option key={p.name} value={p.name}>{p.name} ({p.dob})</option>
               ))}
             </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-xs text-center">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <span>✍️</span> Full Name (for Name Correction)
                  </label>
                  <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                    Chaldean Namaank
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Rohan Sharma (or your current spelling)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none text-white text-base placeholder-slate-600"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {nameData && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{nameData.planetInfo.icon}</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Namaank</span>
                      <span className="text-sm font-black text-amber-300">
                        Number {nameData.single} <span className="text-xs font-mono text-slate-400 font-normal">(Compound {nameData.compound})</span>
                      </span>
                    </div>
                  </div>
                  {compatibility && (
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${compatibility.badgeClass}`}>
                      {compatibility.label}
                    </span>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Select Date of Birth</label>
                <input
                  required
                  type="date"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 outline-none text-white text-lg"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              {numerologyData && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">Mulank (Psychic)</span>
                    <span className="text-4xl font-bold text-white">{numerologyData.mulank}</span>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl text-center">
                    <span className="text-[10px] uppercase font-bold text-orange-500 block mb-1">Bhagyank (Destiny)</span>
                    <span className="text-4xl font-bold text-white">{numerologyData.bhagyank}</span>
                  </div>
                </div>
              )}
            </div>
            <button
              disabled={loading || !dob}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 font-cinzel tracking-wider text-base"
            >
              Calculate Numbers & Name Corrections
            </button>
          </form>
        </section>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-12 h-12 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-cinzel tracking-widest animate-pulse text-sm">Decoding the Numbers & Calculating Name Vibrations...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
          <div id="numerology-report-area" className="bg-[#010204] rounded-[40px] p-8 border border-white/5 space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-3xl font-cinzel text-amber-400">
                  Numerology & Name Correction Report
                </h2>
                {name && (
                  <p className="text-sm text-slate-300 font-medium mt-1">
                    Casted for: <span className="text-amber-200 font-bold">{name}</span> (DOB: {dob})
                  </p>
                )}
              </div>
              <button onClick={downloadPDF} disabled={exporting} className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] px-6 py-2.5 rounded-full font-black uppercase no-print transition-all tracking-wider shadow-lg">
                {exporting ? 'Processing...' : 'Save Full Report'}
              </button>
            </div>

            {/* Name Correction & Vibration Center */}
            <div className="p-6 md:p-8 bg-gradient-to-b from-amber-500/10 via-amber-500/[0.03] to-transparent rounded-[32px] border border-amber-500/20 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-xl font-cinzel font-bold text-amber-300 flex items-center gap-2">
                    <span>🔮</span> Name Correction & Namaank Vibration (Chaldean)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Align your name spelling to activate career growth, wealth, and destiny synergy
                  </p>
                </div>
                {nameData && compatibility && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${compatibility.badgeClass}`}>
                    {compatibility.label}
                  </span>
                )}
              </div>

              {/* Current Name Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Name</p>
                  <p className="text-base font-bold text-white truncate">{name || 'Name Not Provided'}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Natal Spelling Analyzed</p>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Namaank (Name Number)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-300">
                      {nameData ? nameData.single : '—'}
                    </span>
                    {nameData && (
                      <span className="text-xs font-mono text-slate-400 font-bold">
                        (Compound: {nameData.compound})
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {nameData ? `${nameData.planetInfo.icon} ${nameData.planetInfo.planet}` : 'Chaldean System'}
                  </p>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Energy Synergy</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {compatibility ? compatibility.description : 'Enter your name to evaluate compatibility with Mulank & Bhagyank.'}
                  </p>
                </div>
              </div>

              {/* Interactive Name Vibration Tester */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-400 flex items-center gap-1.5">
                    <span>⚡</span> Test Alternate Spelling / Correction in Real-Time
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Live Chaldean Engine</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-8">
                    <input
                      type="text"
                      placeholder="Type any modified spelling (e.g. add extra 'A', 'E', or middle initial)..."
                      className="w-full bg-slate-900/90 border border-amber-500/30 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-1 focus:ring-amber-500 outline-none placeholder-slate-600 font-medium"
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-4">
                    {testNameData ? (
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{testNameData.planetInfo.icon}</span>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Single / Compound</span>
                            <span className="text-sm font-black text-amber-300">
                              {testNameData.single} <span className="text-xs font-mono text-slate-400">({testNameData.compound})</span>
                            </span>
                          </div>
                        </div>
                        {numerologyData && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${checkNameCompatibility(testNameData.single, numerologyData.mulank, numerologyData.bhagyank).badgeClass}`}>
                            {checkNameCompatibility(testNameData.single, numerologyData.mulank, numerologyData.bhagyank).label.split(' ')[1] || 'Match'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic p-2 text-center">
                        Try modifying letters above to test vibration
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/5 flex flex-col items-center">
                <h3 className="text-lg font-cinzel text-amber-400 mb-6 text-center">Loshu Grid Analysis</h3>
                <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-3 w-full max-w-[320px]">
                  <div></div>
                  <div className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-tight">Thought</div>
                  <div className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-tight">Will</div>
                  <div className="text-[10px] text-slate-500 text-center uppercase font-bold tracking-tight">Action</div>
                  {['Mental', 'Emotional', 'Practical'].map((plane, rowIndex) => (
                    <React.Fragment key={plane}>
                      <div className="text-[10px] text-slate-500 flex items-center justify-end uppercase font-bold pr-3 leading-tight text-right">{plane}</div>
                      {numerologyData?.loshu[rowIndex].map((num, colIndex) => (
                        <div key={`${rowIndex}-${colIndex}`} className={`aspect-square flex items-center justify-center text-3xl font-black rounded-xl border-2 ${num ? 'bg-amber-500/30 border-amber-500 text-amber-100' : 'bg-slate-900/80 border-slate-800/50 text-slate-800 opacity-20'}`}>
                          {num || ''}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-center">
                    <p className="text-[10px] uppercase font-black text-amber-500 mb-1">Mulank (Psychic)</p>
                    <p className="text-4xl font-black text-white">{numerologyData?.mulank}</p>
                  </div>
                  <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl text-center">
                    <p className="text-[10px] uppercase font-black text-orange-500 mb-1">Bhagyank (Destiny)</p>
                    <p className="text-4xl font-black text-white">{numerologyData?.bhagyank}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="prose prose-invert prose-amber max-w-none prose-h3:font-cinzel prose-h3:text-amber-400 p-6 rounded-2xl bg-white/5 border border-white/5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
              
              {chatHistory.length > 0 && (
                <div className="mt-16 pt-8 border-t border-white/10">
                  <h3 className="text-xl font-cinzel text-amber-200 mb-6">Numerical Queries & Insights</h3>
                  <div className="space-y-6">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${msg.role === 'user' ? 'text-amber-500' : 'text-slate-400'}`}>
                          {msg.role === 'user' ? 'Question' : 'Response'}
                        </p>
                        <div className="text-slate-300 text-sm italic leading-relaxed">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-white/10 opacity-60 not-prose">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">Disclaimer regarding AI Generation</p>
                <p className="text-[10px] leading-relaxed text-slate-500 font-medium italic">
                  This application uses Artificial Intelligence to analyze birth and name vibration data based on classical Vedic & Chaldean numerology principles. The resulting recommendations and spelling options are intended for energetic alignment and personal insight.
                </p>
              </div>
            </div>
          </div>

          <section className="mirror-card rounded-[40px] p-8 md:p-12 space-y-8 no-print shadow-2xl">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-2xl">🔢</div>
               <div>
                 <h3 className="text-2xl font-cinzel text-amber-200">Numerical & Name Consultation</h3>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Ask questions about your destiny, spelling options, or signatures</p>
               </div>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto space-y-6 pr-4 no-scrollbar border-y border-white/5 py-6">
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
                  Calculating the vibration...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAskQuestion} className="flex gap-4">
              <input 
                value={userQuery} 
                onChange={(e) => setUserQuery(e.target.value)} 
                type="text" 
                placeholder="Ask about your destiny, name correction, or grid..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:ring-1 focus:ring-amber-500 outline-none text-white transition-all placeholder-slate-700 font-medium" 
              />
              <button 
                disabled={chatLoading || !userQuery.trim()} 
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-10 rounded-2xl text-xs uppercase transition-all shadow-xl active:scale-95 disabled:opacity-50"
              >
                Seek
              </button>
            </form>
          </section>

          <button onClick={() => setAnalysis(null)} className="text-slate-500 hover:text-amber-500 mx-auto block no-print text-[10px] font-black uppercase tracking-widest transition-colors py-8">
            ↺ Calculate New Numbers
          </button>
        </div>
      )}
    </div>
  );
};

export default NumerologyView;
