
import React, { useState, useEffect } from 'react';
import { getNumerologyAnalysis } from '../services/geminiService';
import { Language } from '../types';
import ReactMarkdown from 'https://esm.sh/react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface NumerologyViewProps {
  language: Language;
}

const NumerologyView: React.FC<NumerologyViewProps> = ({ language }) => {
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [numerologyData, setNumerologyData] = useState<{
    mulank: number;
    bhagyank: number;
    loshu: (number | null)[][];
  } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numerologyData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getNumerologyAnalysis(dob, numerologyData.mulank, numerologyData.bhagyank, numerologyData.loshu, language);
      setAnalysis(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Celestial numerology failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('numerology-content');
    if (!element || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#010204',
        useCORS: true,
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

      pdf.save(`Numerology_Report_2026_${dob}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <section className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700 shadow-2xl no-print">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-cinzel text-amber-400 mb-2">Numerology & Loshu Grid</h2>
          <p className="text-slate-400">Discover your Mulank (Psychic) and Bhagyank (Destiny) numbers.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-xs text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
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
                  <span className="text-[10px] uppercase font-bold text-amber-500 block mb-1">Mulank</span>
                  <span className="text-4xl font-bold text-white">{numerologyData.mulank}</span>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl text-center">
                  <span className="text-[10px] uppercase font-bold text-orange-500 block mb-1">Bhagyank</span>
                  <span className="text-4xl font-bold text-white">{numerologyData.bhagyank}</span>
                </div>
              </div>
            )}
          </div>
          <button
            disabled={loading || !dob}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50"
          >
            Get Full Prediction
          </button>
        </form>
      </section>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-12 h-12 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-cinzel tracking-widest animate-pulse text-sm">Decoding the Numbers...</p>
        </div>
      )}

      {analysis && !loading && (
        <div id="numerology-content" className="space-y-6 animate-in slide-in-from-bottom-10 duration-700 bg-[#010204] rounded-3xl p-1">
          <div className="bg-slate-800/20 p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-8 items-start justify-center">
            <div className="w-full md:w-auto p-4 bg-slate-900/40 rounded-3xl border border-white/5 flex flex-col items-center">
              <h3 className="text-lg font-cinzel text-amber-400 mb-6 text-center">Loshu Grid Analysis</h3>
              <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-2 w-full max-w-[280px]">
                <div></div>
                <div className="text-[9px] text-slate-500 text-center uppercase font-bold tracking-tighter">Thought</div>
                <div className="text-[9px] text-slate-500 text-center uppercase font-bold tracking-tighter">Will</div>
                <div className="text-[9px] text-slate-500 text-center uppercase font-bold tracking-tighter">Action</div>
                {['Mental', 'Emotional', 'Practical'].map((plane, rowIndex) => (
                  <React.Fragment key={plane}>
                    <div className="text-[9px] text-slate-500 flex items-center justify-end uppercase font-bold pr-2 leading-tight">{plane}</div>
                    {numerologyData?.loshu[rowIndex].map((num, colIndex) => (
                      <div key={`${rowIndex}-${colIndex}`} className={`aspect-square flex items-center justify-center text-2xl font-bold rounded-xl border ${num ? 'bg-amber-500/30 border-amber-500 text-amber-100' : 'bg-slate-900/80 border-slate-800/50 text-slate-800 opacity-50'}`}>
                        {num || ''}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex justify-between items-center no-print">
                <h3 className="text-xl font-cinzel text-white">Interpretations (2026)</h3>
                <button onClick={downloadPDF} disabled={exporting} className="bg-slate-700/50 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg transition-colors border border-slate-600">
                  {exporting ? 'Exporting...' : 'Save PDF'}
                </button>
              </div>
              <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 prose prose-invert prose-amber max-w-none shadow-inner">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NumerologyView;
