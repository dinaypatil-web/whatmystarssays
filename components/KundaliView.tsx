
import React, { useState, useRef, useEffect } from 'react';
import { BirthDetails, Language, ChatMessage } from '../types';
import { getCoordinates, getKundaliAnalysis, askKundaliQuestion } from '../services/geminiService';
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
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  
  // Chat state
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
    } catch (error) {
      console.error(error);
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
      const response = await askKundaliQuestion(currentQuery, analysis, chatHistory, language);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', text: "The heavens are clouded. Please try again later." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('kundali-report');
    if (!element || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#010204',
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Loop for multi-page reports
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Divine_Report_2026_${details.name}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 px-2 md:px-0">
      {!analysis && (
        <section className="mirror-card p-6 md:p-12 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-5xl font-cinzel text-amber-100 mb-4 tracking-tight">Divine Chart Analysis</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base">Enter your birth details to reveal the cosmic alignment of 2026.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <InputField 
                label="Full Name" 
                placeholder="Enter your name" 
                value={details.name} 
                onChange={(v) => setDetails({ ...details, name: v })} 
              />
              <InputField 
                label="Birth City" 
                placeholder="City, State" 
                value={details.location} 
                onChange={(v) => setDetails({ ...details, location: v })} 
              />
              <InputField 
                label="Date of Birth" 
                type="date" 
                value={details.dob} 
                onChange={(v) => setDetails({ ...details, dob: v })} 
              />
              <InputField 
                label="Time of Birth" 
                type="time" 
                value={details.tob} 
                onChange={(v) => setDetails({ ...details, tob: v })} 
              />
            </div>

            <button
              disabled={loading}
              className="w-full glossy-button text-white font-bold py-4 md:py-5 rounded-2xl transition-all disabled:opacity-50 text-base md:text-lg tracking-widest uppercase font-cinzel"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Reading the Heavens...</span>
                </div>
              ) : 'Invoke Celestial Secrets'}
            </button>
          </form>
        </section>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 space-y-8">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🕉️</div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-2xl font-cinzel text-amber-200">Aligning Planetary Transits</p>
            <p className="text-slate-500 text-sm italic">Synchronizing 2026 ephemeris data...</p>
          </div>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div id="kundali-report" className="bg-[#010204] rounded-[40px] overflow-hidden border border-amber-500/10">
            <div className="bg-white/5 p-6 md:p-10 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-cinzel text-amber-400 drop-shadow-md">{details.name}'s Deep Analysis</h2>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-xs text-slate-400 font-medium">
                  <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">{details.dob}</span>
                  <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">{details.tob}</span>
                  <span className="bg-white/5 px-3 py-1 rounded-full border border-white/5">{details.location}</span>
                </div>
              </div>
              <button 
                onClick={downloadPDF}
                disabled={exporting}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-6 py-3 rounded-full transition-all border border-white/10 no-print flex items-center gap-2"
              >
                {exporting ? 'Generating...' : '📥 Export Insights'}
              </button>
            </div>

            <div className="p-6 md:p-12 prose prose-invert prose-amber max-w-none prose-headings:font-cinzel prose-headings:text-amber-100 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-amber-200">
               <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </div>

          {/* Interactive Consultation Q&A */}
          <section className="mirror-card rounded-[40px] p-6 md:p-10 space-y-6 no-print">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-2xl border border-amber-500/20">🔮</div>
              <div>
                <h3 className="text-xl font-cinzel text-amber-200">Consult the Stars Directly</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ask about Wealth, Health, or Karma</p>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-6 pr-2 scroll-smooth no-scrollbar">
              {chatHistory.length === 0 && (
                <div className="text-center py-16 text-slate-500 space-y-6">
                  <p className="italic text-sm">The cosmos awaits your specific inquiry...</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {['My career in 2026?', 'Best gemstones for me?', 'Marriage prospects?', 'Health precautions?'].map(q => (
                      <button 
                        key={q} 
                        onClick={() => setUserQuery(q)}
                        className="text-[11px] bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 transition-all active:scale-95"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl ${
                    msg.role === 'user' 
                      ? 'bg-amber-600/20 border border-amber-500/30 text-amber-50 rounded-tr-none' 
                      : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-5 rounded-3xl rounded-tl-none flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAskQuestion} className="flex gap-3 pt-6 border-t border-white/5">
              <input
                type="text"
                placeholder="Seek answers from the astral plane..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm md:text-base focus:ring-1 focus:ring-amber-500 outline-none text-white placeholder-slate-600 transition-all"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
              <button
                disabled={chatLoading || !userQuery.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-black px-8 rounded-2xl transition-all disabled:opacity-30 shadow-xl active:scale-95 uppercase text-xs tracking-tighter"
              >
                Query
              </button>
            </form>
          </section>

          <div className="flex justify-center pb-12">
            <button 
              onClick={() => {
                setAnalysis(null);
                setChatHistory([]);
              }}
              className="text-slate-500 hover:text-amber-500/60 transition-all flex items-center gap-2 no-print text-xs uppercase font-bold tracking-widest"
            >
              <span>↺</span> Generate Different Chart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const InputField: React.FC<{ label: string; placeholder?: string; type?: string; value: string; onChange: (v: string) => void }> = ({ label, placeholder, type = 'text', value, onChange }) => (
  <div className="space-y-3">
    <label className="text-xs font-bold text-amber-500/60 uppercase tracking-widest ml-1">{label}</label>
    <input
      required
      type={type}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-amber-500 outline-none text-white transition-all hover:bg-white/10 placeholder-slate-600"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export default KundaliView;
