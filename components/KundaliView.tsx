
import React, { useState, useRef, useEffect } from 'react';
import { BirthDetails, Language, ChatMessage, KundaliResponse } from '../types';
import { getCoordinates, getKundaliAnalysis, askKundaliQuestion } from '../services/geminiService';
import KundaliChart from './KundaliChart';
import ReactMarkdown from 'https://esm.sh/react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<KundaliResponse | null>(null);
  
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
      const result = await getKundaliAnalysis(enrichedDetails, language);
      setAnalysis(result);
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
      const response = await askKundaliQuestion(currentQuery, analysis.report, chatHistory, language);
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
            <h2 className="text-3xl md:text-5xl font-cinzel text-amber-100 mb-4 tracking-tight">Vedic Life Analysis</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">Decode your entire life journey, from personality traits to Vimshottari Mahadashas, lifetime Saadesati timelines, and house interpretations.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-200 text-xs text-center">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <InputField label="Full Name" value={details.name} onChange={(v) => setDetails({ ...details, name: v })} />
              <InputField label="Birth Place" placeholder="City, State" value={details.location} onChange={(v) => setDetails({ ...details, location: v })} />
              <InputField label="Birth Date" type="date" value={details.dob} onChange={(v) => setDetails({ ...details, dob: v })} />
              <InputField label="Birth Time" type="time" value={details.tob} onChange={(v) => setDetails({ ...details, tob: v })} />
            </div>
            <button disabled={loading} className="w-full glossy-button text-white font-bold py-4 rounded-2xl text-lg tracking-widest uppercase font-cinzel shadow-2xl">
              Generate Life Map
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
          <p className="text-2xl font-cinzel text-amber-200 tracking-widest text-center">Constructing your 120-year Life Map...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-12 animate-in fade-in duration-1000">
          <div id="kundali-report-area" className="bg-[#010204] rounded-[40px] border border-amber-500/10 overflow-hidden shadow-[0_0_100px_rgba(251,191,36,0.05)]">
            <div className="p-6 md:p-10 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-b from-white/5 to-transparent">
              <div>
                <h2 className="text-3xl font-cinzel text-amber-400">Life Map Report: {details.name}</h2>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 p-6 md:p-12">
              <div className="lg:col-span-5 space-y-8">
                <KundaliChart data={analysis.chart} lagnaSign={analysis.lagnaSign} />
                
                <div className="grid grid-cols-2 gap-4 p-6 bg-amber-500/5 border border-amber-500/10 rounded-[32px]">
                   <VedicSummaryItem label="Varna" value={analysis.varna} icon="📿" />
                   <VedicSummaryItem label="Gana" value={analysis.gana} icon="🛡️" />
                   <VedicSummaryItem label="Nakshatra" value={analysis.nakshatra} icon="✨" />
                   <VedicSummaryItem label="Moon Sign" value={analysis.moonSign} icon="🌙" />
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
                <ReactMarkdown>{analysis.report}</ReactMarkdown>
                
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
                             <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-16 pt-8 border-t border-white/10 opacity-60">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-2">Disclaimer regarding AI Generation</p>
                   <p className="text-[10px] leading-relaxed text-slate-500 font-medium italic">
                    This application utilizes Artificial Intelligence to analyze birth data based on Vedic astrological principles. The resulting content is intended for informational, educational, and personal insight purposes only. Please be aware that AI-generated interpretations may lack the nuance of a human astrologer and may occasionally produce inconsistent results. The information provided herein should not be construed as professional advice (medical, legal, or financial) or factual prophecy. The creators assume no liability for choices made based on this algorithmic analysis.
                   </p>
                </div>
              </div>
            </div>
          </div>

          <section className="mirror-card rounded-[40px] p-8 md:p-12 space-y-8 no-print shadow-2xl">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-2xl">🔮</div>
               <div>
                 <h3 className="text-2xl font-cinzel text-amber-200">Celestial Consultation</h3>
                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Ask detailed questions about your lifetime Mahadashas or Saadesati</p>
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
                    {msg.role === 'user' ? msg.text : <ReactMarkdown>{msg.text}</ReactMarkdown>}
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

const VedicSummaryItem = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
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
