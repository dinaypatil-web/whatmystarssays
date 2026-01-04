
import React, { useState } from 'react';
import { BirthDetails, MatchmakingDetails, Language } from '../types';
import { getMatchmaking, getCoordinates } from '../services/geminiService';
import ReactMarkdown from 'https://esm.sh/react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [coords, setCoords] = useState<{ boy?: any, girl?: any }>({});

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

      setCoords({ boy: boyCoords, girl: girlCoords });
      const data = await getMatchmaking(enrichedDetails, language);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Celestial comparison failed. Please verify the locations and try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const elementId = 'matchmaking-content';
    const element = document.getElementById(elementId);
    if (!element || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            clonedElement.style.backgroundColor = 'white';
            clonedElement.style.color = 'black';
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

      pdf.save(`Matchmaking_Report_2026_${details.boy.name}_${details.girl.name}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {!result && !loading && (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-cinzel text-pink-400">Ashtakoot Milan (2026)</h2>
            <p className="text-slate-400">Traditional 36 Guna compatibility analysis for a blissful union.</p>
          </div>

          {error && (
            <div className="max-w-xl mx-auto p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-xs text-center animate-in zoom-in-95">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ProfileForm 
              title="Groom (Boy)" 
              details={details.boy} 
              onChange={(d) => setDetails({ ...details, boy: d })} 
              accentColor="blue"
            />
            <ProfileForm 
              title="Bride (Girl)" 
              details={details.girl} 
              onChange={(d) => setDetails({ ...details, girl: d })} 
              accentColor="pink"
            />
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
        <div className="max-w-4xl mx-auto space-y-6 animate-in zoom-in-95 duration-500">
          <div id="matchmaking-content" className="bg-[#010204] rounded-3xl p-1">
            <div className="bg-slate-800/20 p-8 rounded-3xl border border-white/10 prose prose-invert prose-rose max-w-none shadow-2xl">
              <div className="flex justify-between items-start mb-8 not-prose no-print">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-3xl mb-2">♂️</div>
                    <p className="font-cinzel text-blue-400 text-sm">{details.boy.name}</p>
                  </div>
                  <div className="text-3xl text-pink-500 animate-pulse">❤️</div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center text-3xl mb-2">♀️</div>
                    <p className="font-cinzel text-pink-400 text-sm">{details.girl.name}</p>
                  </div>
                </div>
                <button 
                  onClick={downloadPDF}
                  disabled={exporting}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-slate-600 no-print"
                >
                  {exporting ? 'Exporting...' : 'Save Report'}
                </button>
              </div>

              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
          
          <button 
            onClick={() => setResult(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2 mx-auto no-print"
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
        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Full Name</label>
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
          <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Date</label>
          <input
            required
            type="date"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-amber-500 outline-none"
            value={details.dob}
            onChange={(e) => onChange({ ...details, dob: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Time</label>
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
        <label className="text-[10px] text-slate-500 uppercase font-bold ml-1">Birth Location</label>
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

export default MatchmakingView;
