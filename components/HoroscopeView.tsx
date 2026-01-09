import React, { useState, useEffect } from 'react';
import { ZODIAC_SIGNS } from '../constants';
import { Timeframe, PredictionResult, Language } from '../types';
import { getHoroscope } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface HoroscopeViewProps {
  language: Language;
}

const HoroscopeView: React.FC<HoroscopeViewProps> = ({ language }) => {
  const [selectedSign, setSelectedSign] = useState(StorageService.getUserSign() || ZODIAC_SIGNS[0].name);
  const [timeframe, setTimeframe] = useState<Timeframe>('daily');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const fetchHoroscope = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHoroscope(selectedSign, timeframe, language);
      setPrediction(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "The stars are currently clouded. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoroscope();
  }, [selectedSign, timeframe, language]);

  const setAsPreferred = () => {
    StorageService.setUserSign(selectedSign);
    alert(`${selectedSign} set as home sign!`);
  };

  const downloadPDF = async () => {
    const elementId = 'horoscope-report-area';
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

      pdf.save(`${selectedSign}_Horoscope_${timeframe}_2026.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12 px-2 md:px-0">
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-6 gap-3 md:gap-4 no-print">
        {ZODIAC_SIGNS.map((sign) => (
          <button
            key={sign.name}
            onClick={() => setSelectedSign(sign.name)}
            className={`flex flex-col items-center p-3 md:p-4 rounded-2xl border transition-all active:scale-95 ${
              selectedSign === sign.name
                ? 'bg-amber-500/20 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <span className="text-2xl md:text-3xl mb-1 drop-shadow-lg">{sign.symbol}</span>
            <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-300">{sign.name}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mirror-card p-4 md:p-6 rounded-2xl no-print">
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['daily', 'weekly', 'monthly'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                timeframe === tf
                  ? 'bg-amber-500 text-slate-900 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <button onClick={setAsPreferred} className="text-[10px] uppercase font-black tracking-widest text-amber-500/60 flex items-center gap-2">
          Set Home 🏠
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-12 h-12 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-cinzel tracking-widest animate-pulse text-sm">Synchronizing with 2026 Transits...</p>
        </div>
      )}

      {error && !loading && (
        <div className="mirror-card p-10 rounded-3xl border-red-500/30 text-center animate-in zoom-in-95">
          <div className="text-4xl mb-4">🌑</div>
          <h3 className="text-xl font-cinzel text-red-200 mb-2">Mirror Obscured</h3>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button onClick={fetchHoroscope} className="glossy-button px-8 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest">
            Try Again
          </button>
        </div>
      )}

      {prediction && !loading && !error && (
        <div id="horoscope-report-area" className="space-y-8 bg-[#010204] rounded-[40px] p-6 border border-white/5 animate-in slide-in-from-bottom-8 duration-1000">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-2xl md:text-3xl font-cinzel text-amber-100">{selectedSign} {timeframe} Reading</h2>
            <button 
              onClick={downloadPDF}
              disabled={exporting}
              className="bg-white/5 hover:bg-white/10 text-white text-[10px] px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/10 disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : 'Save Full Reading'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2 mirror-card p-8 rounded-[32px] border-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.05)]">
              <h3 className="text-lg font-cinzel text-amber-400 mb-4 flex items-center gap-3">
                <span className="opacity-60">🔮</span> Cosmic Overview (2026)
              </h3>
              <p className="text-slate-200 leading-relaxed text-lg font-light italic">{prediction.overview}</p>
            </div>
            <ResultCard title="Career" content={prediction.career} icon="💼" />
            <ResultCard title="Finance" content={prediction.finance} icon="💰" />
            <ResultCard title="Health" content={prediction.health} icon="🩺" />
            <ResultCard title="Relationships" content={prediction.relationships} icon="💍" />
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 opacity-60">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2 text-center">Disclaimer regarding AI Generation</p>
            <p className="text-[10px] leading-relaxed text-slate-500 font-medium italic text-center max-w-2xl mx-auto">
              This application utilizes Artificial Intelligence to analyze astrological data. The content is for informational, educational, and personal insight purposes only. AI interpretations may lack the nuance of a human astrologer. This should not be construed as professional medical, legal, or financial advice.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const ResultCard = ({ title, content, icon }: { title: string; content: string; icon: string }) => (
  <div className="mirror-card p-6 rounded-[28px] border-white/5 hover:border-amber-500/20 transition-all duration-500">
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xl">{icon}</span>
      <h4 className="text-sm font-black uppercase tracking-widest text-amber-200/80">{title}</h4>
    </div>
    <p className="text-slate-400 text-sm leading-relaxed opacity-90">{content}</p>
  </div>
);

export default HoroscopeView;