
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
  const [exporting, setExporting] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const fetchHoroscope = async () => {
    setLoading(true);
    try {
      const data = await getHoroscope(selectedSign, timeframe, language);
      setPrediction(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoroscope();
  }, [selectedSign, timeframe, language]);

  const setAsPreferred = () => {
    StorageService.setUserSign(selectedSign);
    alert(`${selectedSign} set as home sign for background updates!`);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('horoscope-content');
    if (!element || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#020617',
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${selectedSign}_${timeframe}_Report.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12 px-2 md:px-0">
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-6 gap-3 md:gap-4">
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
            <span className="text-[8px] md:text-[10px] text-amber-500/50 italic">{sign.moonSign}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mirror-card p-4 md:p-6 rounded-2xl">
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
          {(['daily', 'weekly', 'monthly'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                timeframe === tf
                  ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
        <button 
          onClick={setAsPreferred}
          className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-500/60 hover:text-amber-400 transition-colors flex items-center gap-2"
        >
          Set {selectedSign} as Home 🏠
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-12 h-12 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-cinzel tracking-widest animate-pulse uppercase text-sm">Consulting the Stars...</p>
        </div>
      ) : prediction ? (
        <div id="horoscope-content" className="space-y-8">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-2xl md:text-4xl font-cinzel text-amber-100">{selectedSign} {timeframe} Reading</h2>
            <button 
              onClick={downloadPDF}
              disabled={exporting}
              className="bg-white/5 hover:bg-white/10 text-white text-[10px] px-5 py-2.5 rounded-full flex items-center gap-2 transition-all border border-white/10 disabled:opacity-50"
            >
              {exporting ? 'Processing...' : '📥 Save Reading'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="col-span-1 md:col-span-2 mirror-card p-6 md:p-10 rounded-[32px] border-amber-500/10">
              <h3 className="text-xl md:text-2xl font-cinzel text-amber-400 mb-6 flex items-center gap-3">
                <span className="opacity-60">✨</span> Cosmic Overview
              </h3>
              <p className="text-slate-300 leading-relaxed text-lg md:text-xl font-light italic opacity-90">"{prediction.overview}"</p>
            </div>

            <Card title="Career & Prosperity" content={prediction.career + " " + prediction.finance} icon="💎" />
            <Card title="Vitality & Health" content={prediction.health} icon="🌱" />
            <Card title="Soul & Relations" content={prediction.relationships} icon="🧿" />
            <Card title="Spirit & Growth" content={prediction.spirituality} icon="🕉️" />

            <div className="col-span-1 md:col-span-2 flex flex-wrap gap-6 justify-center mirror-card p-6 rounded-2xl border-amber-500/10">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Auspicious Color</span>
                <span className="font-bold text-amber-400 text-lg">{prediction.luckyColor}</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-white/10"></div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Divine Number</span>
                <span className="font-bold text-amber-400 text-lg">{prediction.luckyNumber}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const Card: React.FC<{ title: string; content: string; icon: string }> = ({ title, content, icon }) => (
  <div className="mirror-card p-6 md:p-8 rounded-[32px] hover:border-amber-500/30">
    <h3 className="text-lg md:text-xl font-cinzel text-slate-100 mb-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span> {title}
    </h3>
    <p className="text-slate-400 leading-relaxed text-sm md:text-base opacity-80">{content}</p>
  </div>
);

export default HoroscopeView;
