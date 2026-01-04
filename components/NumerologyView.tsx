
import React, { useState, useEffect, useRef } from 'react';
import { getNumerologyAnalysis, askNumerologyQuestion } from '../services/geminiService';
import { Language, ChatMessage } from '../types';
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

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numerologyData) return;
    setLoading(true);
    setError(null);
    setChatHistory([]);
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
        language
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
    const elementId = 'numerology-content';
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
            clonedElement.style.padding = '20px';
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

      pdf.save(`Numerology_Life_Report_${dob}.pdf`);
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
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
          <div className="w-12 h-12 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-cinzel tracking-widest animate-pulse text-sm">Decoding the Numbers...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
          <div id="numerology-content" className="bg-[#010204] rounded-3xl p-6 border border-white/5 space-y-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-cinzel text-amber-400">Personal Numerology Report</h2>
              <button onClick={downloadPDF} disabled={exporting} className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-[10px] px-6 py-2 rounded-full font-black uppercase no-print transition-all">
                {exporting ? 'Exporting...' : 'Save Life Report'}
              </button>
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

            <div className="prose prose-invert prose-amber max-w-none prose-h3:font-cinzel prose-h3:text-amber-400 shadow-inner p-4 rounded-2xl bg-white/5 border border-white/5">
              <ReactMarkdown>{analysis}</ReactMarkdown>
              
              {chatHistory.length > 0 && (
                <div className="mt-16 pt-8 border-t border-white/10">
                  <h3 className="text-xl font-cinzel text-amber-200 mb-6">Numerical Queries & Insights</h3>
                  <div className="space-y-6">
                    {chatHistory.map((msg, idx) => (
                      <div key={idx} className="space-y-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-amber-500' : 'text-slate-500'}`}>
                          {msg.role === 'user' ? 'Question' : 'Response'}
                        </p>
                        <div className="text-slate-300 text-sm italic leading-relaxed">
                           <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-white/10 opacity-40 not-prose">
                <p className="text-[10px] italic leading-relaxed text-center">
                  Disclaimer regarding AI Generation: This application utilizes Artificial Intelligence to analyze birth data based on Vedic astrological principles. The resulting content is intended for informational, educational, and personal insight purposes only. Please be aware that AI-generated interpretations may lack the nuance of a human astrologer and may occasionally produce inconsistent results. The information provided herein should not be construed as professional advice (medical, legal, or financial) or factual prophecy. The creators assume no liability for choices made based on this algorithmic analysis.
                </p>
              </div>
            </div>
          </div>

          <section className="mirror-card rounded-[40px] p-8 md:p-12 space-y-8 no-print shadow-2xl">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-2xl">🔢</div>
               <div>
                 <h3 className="text-2xl font-cinzel text-amber-200">Numerical Consultation</h3>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Deep dive into your numbers</p>
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
                    {msg.role === 'user' ? msg.text : <ReactMarkdown>{msg.text}</ReactMarkdown>}
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
