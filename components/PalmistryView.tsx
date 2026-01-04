
import React, { useState, useRef, useEffect } from 'react';
import { getPalmistryAnalysis } from '../services/geminiService';
import { Language } from '../types';
import ReactMarkdown from 'https://esm.sh/react-markdown';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PalmistryViewProps {
  language: Language;
}

const PalmistryView: React.FC<PalmistryViewProps> = ({ language }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Please allow camera access to scan your palm.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePalm = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const result = await getPalmistryAnalysis(image, language);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try a clearer image.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    const element = document.getElementById('palm-content');
    if (!element || exporting) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0f172a',
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Palmistry_Analysis.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {!analysis && (
        <section className="bg-slate-800/40 p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-8 animate-in fade-in duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-cinzel text-amber-400">Digital Palmistry</h2>
            <p className="text-slate-400">The secrets of your life are etched in your palms. Scan your right hand (or left if dominant) for insights.</p>
          </div>

          {!image && !cameraActive ? (
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={startCamera}
                className="flex-1 max-w-xs bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white font-bold py-6 px-8 rounded-2xl transition-all shadow-xl flex flex-col items-center gap-2"
              >
                <span className="text-4xl">📸</span>
                <span>Open Camera</span>
              </button>
              <label className="flex-1 max-w-xs bg-slate-700 hover:bg-slate-600 text-white font-bold py-6 px-8 rounded-2xl transition-all shadow-xl flex flex-col items-center gap-2 cursor-pointer border border-slate-600">
                <span className="text-4xl">📁</span>
                <span>Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          ) : cameraActive ? (
            <div className="relative max-w-lg mx-auto overflow-hidden rounded-3xl border-4 border-amber-500/30">
              <video ref={videoRef} autoPlay playsInline className="w-full aspect-[3/4] object-cover" />
              <div className="absolute inset-0 border-[2px] border-dashed border-white/20 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-64 border-2 border-amber-500/50 rounded-full opacity-30"></div>
              </div>
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                <button 
                  onClick={stopCamera}
                  className="bg-slate-900/80 text-white px-6 py-3 rounded-xl font-bold backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={capturePhoto}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                  Capture
                </button>
              </div>
            </div>
          ) : image && (
            <div className="space-y-6 flex flex-col items-center animate-in zoom-in-95">
              <div className="relative max-w-sm rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-500/20">
                <img src={image} alt="Palm Preview" className="w-full h-auto" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-4 right-4 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                >
                  ✕
                </button>
              </div>
              <button 
                onClick={analyzePalm}
                disabled={loading}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-900 font-bold py-4 px-12 rounded-2xl transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? 'Reading Lines...' : 'Start Chiromancy Reading'}
              </button>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </section>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl animate-pulse">🔮</div>
          </div>
          <p className="text-amber-200 font-cinzel text-xl">Peering into the Soul's Map...</p>
        </div>
      )}

      {analysis && !loading && (
        <div id="palm-content" className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
           <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-8 items-start">
             <div className="w-full md:w-64 space-y-4 no-print">
                <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
                  <img src={image!} alt="Your Palm" className="w-full h-auto" />
                </div>
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-center">
                   <p className="text-[10px] text-amber-500/60 uppercase font-bold">Image Scanned</p>
                   <p className="text-slate-400 text-xs italic">High resolution spectral capture</p>
                </div>
             </div>

             <div className="flex-1 space-y-4 w-full">
                <div className="flex justify-between items-center no-print">
                   <h2 className="text-2xl font-cinzel text-amber-400">Palmistry Revelation</h2>
                   <button 
                     onClick={downloadPDF}
                     disabled={exporting}
                     className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg transition-colors border border-slate-600 disabled:opacity-50"
                   >
                     {exporting ? 'Generating...' : 'Save Report'}
                   </button>
                </div>
                <div className="bg-slate-900/60 p-8 rounded-3xl border border-slate-800 prose prose-invert prose-amber max-w-none shadow-inner leading-relaxed">
                   <ReactMarkdown>{analysis}</ReactMarkdown>
                </div>
             </div>
           </div>
           
           <button 
            onClick={() => setAnalysis(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-2 mx-auto no-print"
          >
            <span>↺</span> Perform another reading
          </button>
        </div>
      )}
    </div>
  );
};

export default PalmistryView;
