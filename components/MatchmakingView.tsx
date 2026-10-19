
import React, { useState, useEffect, useMemo } from 'react';
import { BirthDetails, MatchmakingDetails, Language } from '../types';
import { getMatchmaking, getCoordinates } from '../services/aiService';
import { calculateAshtakootMilan } from '../services/astrologyHelper';
import InfographicReportViewer from './InfographicReportViewer';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { StorageService } from '../services/storageService';

interface MatchmakingViewProps {
  language: Language;
}

const MatchmakingView: React.FC<MatchmakingViewProps> = ({ language }) => {
  const initialBirthDetails: BirthDetails = { name: '', dob: '', tob: '', location: '' };
  const [details, setDetails] = useState<MatchmakingDetails>({
    boy: { ...initialBirthDetails },
    girl: { ...initialBirthDetails }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<BirthDetails[]>(StorageService.getProfiles());

  const milanData = useMemo(() => {
    if (!details.boy.dob || !details.girl.dob) return null;
    return calculateAshtakootMilan(details.boy, details.girl);
  }, [details.boy, details.girl]);

  const handleProfileSelect = (side: 'boy' | 'girl', name: string) => {
    const profile = profiles.find(p => p.name === name);
    if (profile) {
      setDetails(prev => ({
        ...prev,
        [side]: { ...profile }
      }));
    }
  };

  // Automatically refresh Matchmaking report when language changes
  useEffect(() => {
    if (result && details.boy.name && details.girl.name && details.boy.location && details.girl.location) {
      const reloadLanguage = async () => {
        setLoading(true);
        setError(null);
        try {
          const [boyCoords, girlCoords] = await Promise.all([
            getCoordinates(details.boy.location),
            getCoordinates(details.girl.location)
          ]);
          const enrichedDetails: MatchmakingDetails = {
            boy: { ...details.boy, latitude: boyCoords.lat, longitude: boyCoords.lng },
            girl: { ...details.girl, latitude: girlCoords.lat, longitude: girlCoords.lng }
          };
          const data = await getMatchmaking(enrichedDetails, language);
          setResult(data);
        } catch (err: any) {
          console.error("Matchmaking language reload failed", err);
        } finally {
          setLoading(false);
        }
      };
      reloadLanguage();
    }
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const [boyCoords, girlCoords] = await Promise.all([
        getCoordinates(details.boy.location),
        getCoordinates(details.girl.location)
      ]);

      const enrichedDetails: MatchmakingDetails = {
        boy: { ...details.boy, latitude: boyCoords.lat, longitude: boyCoords.lng },
        girl: { ...details.girl, latitude: girlCoords.lat, longitude: girlCoords.lng }
      };

      const data = await getMatchmaking(enrichedDetails, language);
      setResult(data);
      
      // Save both profiles
      StorageService.saveProfile(details.boy);
      StorageService.saveProfile(details.girl);
      setProfiles(StorageService.getProfiles());
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Celestial comparison failed. Please verify the locations and try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const elementId = 'matchmaking-report-area';
    const element = document.getElementById(elementId);
    if (!element || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        // Force desktop layout during capture
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

      pdf.save(`Matchmaking_Report_${details.boy.name}_${details.girl.name}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 px-2 md:px-0">
      {!result && !loading && (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-cinzel text-pink-400">K. P. System Matchmaking (2026)</h2>
            <p className="text-slate-400">Advanced K. P. System compatibility analysis for a blissful union.</p>
          </div>

          {error && (
            <div className="max-w-xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-xs text-center animate-in zoom-in-95">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <ProfileSelector profiles={profiles} onSelect={(name) => handleProfileSelect('boy', name)} side="boy" />
              <ProfileForm 
                title="Groom (Boy)" 
                details={details.boy} 
                onChange={(d) => setDetails({ ...details, boy: d })} 
                accentColor="blue"
              />
            </div>
            <div className="space-y-4">
              <ProfileSelector profiles={profiles} onSelect={(name) => handleProfileSelect('girl', name)} side="girl" />
              <ProfileForm 
                title="Bride (Girl)" 
                details={details.girl} 
                onChange={(d) => setDetails({ ...details, girl: d })} 
                accentColor="pink"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              disabled={loading}
              className="px-12 py-4 bg-gradient-to-r from-pink-600 to-rose-700 hover:from-pink-500 hover:to-rose-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-rose-900/30 disabled:opacity-50 flex items-center gap-3 active:scale-95"
            >
              Check Match Compatibility
            </button>
          </div>
        </form>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-12 h-12 border-4 border-pink-500/10 border-t-pink-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-cinzel tracking-widest animate-pulse text-sm">Synchronizing Life Paths...</p>
        </div>
      )}

      {result && !loading && (
        <div className="max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
          <div id="matchmaking-report-area" className="bg-[#010204] rounded-3xl border border-white/5 space-y-8 overflow-hidden p-6 md:p-10">
            {/* Top Couple Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b border-white/10 pb-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-lg">♂️</div>
                  <p className="font-cinzel text-blue-300 text-sm font-bold">{details.boy.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Groom • वर</p>
                </div>
                <div className="text-3xl text-pink-500 animate-pulse">❤️</div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-pink-500/20 border border-pink-500/30 rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-lg">♀️</div>
                  <p className="font-cinzel text-pink-300 text-sm font-bold">{details.girl.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Bride • कन्या</p>
                </div>
              </div>
              <button 
                onClick={downloadPDF}
                disabled={exporting}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-6 py-2.5 rounded-full font-bold uppercase transition-colors border border-white/10 no-print"
              >
                {exporting ? 'Processing...' : 'Save Full Report'}
              </button>
            </div>

            {/* 1. Ashtakoot Milan 36-Point Infographic Speedometer & Verdict */}
            {milanData && (
              <div className="p-6 md:p-8 bg-gradient-to-r from-pink-500/10 via-purple-500/5 to-pink-500/10 border border-pink-500/20 rounded-[32px] space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-pink-400 block mb-1">
                      Ashtakoot Gun Milan (36-Point Vedic Score)
                    </span>
                    <h3 className="text-xl md:text-2xl font-cinzel font-bold text-white">
                      {milanData.verdictLabel}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Calculated from authentic sidereal Moon positions, Nakshatra Padas, and classical Parihara rules
                    </p>
                  </div>

                  {/* Circular Score Gauge */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-black/50 border-2 border-pink-500/40 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.25)]">
                      <span className="text-3xl font-black font-cinzel text-pink-200">
                        {milanData.totalScore}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Out of 36</span>
                    </div>
                  </div>
                </div>

                {/* 2. 8 Kootas Visual Progress Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {Object.entries(milanData.kootas).map(([key, koota]) => {
                    const pct = Math.round((koota.obtainedScore / koota.maxScore) * 100);
                    const isFull = pct === 100;

                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          isFull
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : koota.pariharaApplied
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-white/[0.03] border-white/10'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase truncate">
                              {koota.name.split(' ')[0]}
                            </span>
                            {koota.pariharaApplied && (
                              <span className="text-[8px] font-bold px-1 rounded bg-amber-500/20 text-amber-300">
                                Parihara
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-black font-cinzel text-white">
                            {koota.obtainedScore} <span className="text-[10px] text-slate-400 font-normal">/ {koota.maxScore}</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-white/10">
                          <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isFull ? 'bg-emerald-400' : koota.pariharaApplied ? 'bg-amber-400' : 'bg-pink-400'
                              }`}
                              style={{ width: `${Math.max(pct, 10)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3. Groom vs Bride Avakahada Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-black/40 border border-blue-500/25 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                      Groom ({details.boy.name}) Celestial Identity
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400">Moon Sign:</span> <span className="font-bold text-white">{milanData.boyMoon?.rashi.name}</span></div>
                      <div><span className="text-slate-400">Nakshatra:</span> <span className="font-bold text-white">{milanData.boyMoon?.nakshatra.name}</span></div>
                      <div><span className="text-slate-400">Gana:</span> <span className="font-bold text-amber-300">{milanData.boyMoon?.nakshatra.gana}</span></div>
                      <div><span className="text-slate-400">Nadi:</span> <span className="font-bold text-sky-300">{milanData.boyMoon?.nakshatra.nadi}</span></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-pink-500/25 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-400 block">
                      Bride ({details.girl.name}) Celestial Identity
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-400">Moon Sign:</span> <span className="font-bold text-white">{milanData.girlMoon?.rashi.name}</span></div>
                      <div><span className="text-slate-400">Nakshatra:</span> <span className="font-bold text-white">{milanData.girlMoon?.nakshatra.name}</span></div>
                      <div><span className="text-slate-400">Gana:</span> <span className="font-bold text-amber-300">{milanData.girlMoon?.nakshatra.gana}</span></div>
                      <div><span className="text-slate-400">Nadi:</span> <span className="font-bold text-sky-300">{milanData.girlMoon?.nakshatra.nadi}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Infographic Report Viewer for Compatibility Report */}
            <InfographicReportViewer 
              reportText={result} 
              title={`Kundali Milan Synthesis: ${details.boy.name} & ${details.girl.name}`} 
              accentColor="rose"
            />

            <div className="mt-8 pt-6 border-t border-white/10 opacity-60 not-prose">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2 text-center">Disclaimer regarding AI Generation</p>
              <p className="text-[10px] leading-relaxed text-slate-500 font-medium italic text-center max-w-2xl mx-auto">
                This compatibility analysis is synthesized using authentic Vedic Ashtakoot Milan and astrological parameters. The insights are designed to support mutual understanding, emotional harmony, and conscious relationship planning.
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setResult(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2 mx-auto no-print text-xs uppercase font-bold tracking-widest py-4"
          >
            <span>↺</span> Perform another match
          </button>
        </div>
      )}
    </div>
  );
};

const ProfileForm: React.FC<{ 
  title: string; 
  details: BirthDetails; 
  onChange: (d: BirthDetails) => void;
  accentColor: 'blue' | 'pink';
}> = ({ title, details, onChange, accentColor }) => (
  <div className={`bg-slate-800/40 p-6 rounded-2xl border transition-all ${accentColor === 'blue' ? 'border-blue-500/20 hover:border-blue-500/40' : 'border-pink-500/20 hover:border-pink-500/40'}`}>
    <h3 className={`text-xl font-cinzel mb-6 flex items-center gap-2 ${accentColor === 'blue' ? 'text-blue-400' : 'text-pink-400'}`}>
      <span>{accentColor === 'blue' ? '♂️' : '♀️'}</span> {title}
    </h3>
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 tracking-widest">Full Name</label>
        <input
          required
          placeholder="e.g. Aryan Khan"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          value={details.name}
          onChange={(e) => onChange({ ...details, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 tracking-widest">Date</label>
          <input
            required
            type="date"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
            value={details.dob}
            onChange={(e) => onChange({ ...details, dob: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 tracking-widest">Time</label>
          <input
            required
            type="time"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
            value={details.tob}
            onChange={(e) => onChange({ ...details, tob: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1 tracking-widest">Birth Location</label>
        <input
          required
          placeholder="City, State"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
          value={details.location}
          onChange={(e) => onChange({ ...details, location: e.target.value })}
        />
      </div>
    </div>
  </div>
);

const ProfileSelector = ({ profiles, onSelect, side }: { profiles: BirthDetails[], onSelect: (name: string) => void, side: string }) => (
  <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
    <div className="flex items-center justify-between mb-2 px-1">
      <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-[0.3em]">Load {side === 'boy' ? 'Boy' : 'Girl'} Profile 📂</span>
    </div>
    <select 
      onChange={(e) => onSelect(e.target.value)}
      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none hover:bg-slate-800 transition-all text-xs"
    >
      <option value="">Select a saved profile...</option>
      {profiles.map(p => (
        <option key={p.name} value={p.name}>{p.name}</option>
      ))}
    </select>
  </div>
);

export default MatchmakingView;
