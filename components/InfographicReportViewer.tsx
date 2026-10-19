import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface InfographicReportViewerProps {
  reportText: string;
  title?: string;
  accentColor?: 'amber' | 'emerald' | 'sky' | 'rose' | 'purple';
}

interface ReportSection {
  id: string;
  title: string;
  cleanTitle: string;
  icon: string;
  content: string;
  strengths: string[];
  cautions: string[];
  remedies: string[];
}

const SECTION_ICONS: Record<string, string> = {
  panchanga: '🕉️',
  birth: '🕉️',
  profile: '📜',
  overview: '✨',
  planetary: '🪐',
  graha: '🪐',
  house: '🏛️',
  bhava: '🏛️',
  career: '💼',
  profession: '💼',
  finance: '💰',
  wealth: '💰',
  marriage: '💖',
  love: '💖',
  relationship: '💖',
  health: '🩺',
  vitality: '🌿',
  yoga: '⚡',
  dosha: '🛡️',
  dasha: '⏳',
  mahadasha: '⏳',
  saadesati: '🪐',
  remedy: '🪔',
  remedies: '🪔',
  upaya: '🪔',
  gemstone: '💎',
  mantra: '📿',
  ashtakoot: '💑',
  milan: '💑',
  compatibility: '🤝',
  loshu: '🔢',
  number: '🔢',
  name: '✍️',
  correction: '🔮'
};

const getIconForTitle = (title: string): string => {
  const clean = title.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (clean.includes(key)) return icon;
  }
  return '✨';
};

const InfographicReportViewer: React.FC<InfographicReportViewerProps> = ({
  reportText,
  title,
  accentColor = 'amber'
}) => {
  const [viewMode, setViewMode] = useState<'infographic' | 'classic'>('infographic');
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  // Parse markdown into structured sections
  const sections: ReportSection[] = useMemo(() => {
    if (!reportText) return [];

    const lines = reportText.split('\n');
    const parsedSections: ReportSection[] = [];
    let currentTitle = 'Executive Overview';
    let currentContent: string[] = [];

    const flush = () => {
      const contentStr = currentContent.join('\n').trim();
      if (contentStr || parsedSections.length === 0) {
        // Scan for strengths, cautions, and remedies
        const strengths: string[] = [];
        const cautions: string[] = [];
        const remedies: string[] = [];

        const bulletLines = contentStr.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('*') || l.includes('**'));
        for (const line of bulletLines) {
          const lower = line.toLowerCase();
          if (
            (lower.includes('remedy') || lower.includes('upaya') || lower.includes('mantra') || lower.includes('gemstone') || lower.includes('daan') || lower.includes('उपाय')) &&
            remedies.length < 3
          ) {
            remedies.push(line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim());
          } else if (
            (lower.includes('caution') || lower.includes('delay') || lower.includes('challenge') || lower.includes('stress') || lower.includes('vulnerab') || lower.includes('hurdle') || lower.includes('सतर्क')) &&
            cautions.length < 3
          ) {
            cautions.push(line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim());
          } else if (
            (lower.includes('favor') || lower.includes('strength') || lower.includes('boon') || lower.includes('gain') || lower.includes('success') || lower.includes('bless') || lower.includes('सफल') || lower.includes('शुभ')) &&
            strengths.length < 3
          ) {
            strengths.push(line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '').trim());
          }
        }

        const clean = currentTitle.replace(/^[#\d\.\s\-\*]+/, '').trim() || 'Cosmic Synthesis';
        parsedSections.push({
          id: `sec-${parsedSections.length}-${clean.slice(0, 10).toLowerCase().replace(/\s/g, '-')}`,
          title: currentTitle,
          cleanTitle: clean,
          icon: getIconForTitle(clean),
          content: contentStr,
          strengths,
          cautions,
          remedies
        });
      }
      currentContent = [];
    };

    for (const line of lines) {
      if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
        flush();
        currentTitle = line.replace(/^[#]+\s*/, '').trim();
      } else {
        currentContent.push(line);
      }
    }
    flush();

    return parsedSections.filter(s => s.content.length > 0 || s.cleanTitle !== 'Executive Overview');
  }, [reportText]);

  // Set active section to the first section on load
  const activeSection = useMemo(() => {
    if (sections.length === 0) return null;
    return sections.find(s => s.id === activeSectionId) || sections[0];
  }, [sections, activeSectionId]);

  if (!reportText) return null;

  return (
    <div className="space-y-6">
      {/* Top Infographic Controller Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 font-cinzel">
              {title || 'Interactive Astrological Synthesis'}
            </h4>
            <p className="text-[10px] text-slate-400">
              {sections.length} Infographic chapters decoded • Multi-dimensional Vedic analysis
            </p>
          </div>
        </div>

        {/* View Switcher: Infographic vs Classic */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 border border-white/10 rounded-xl no-print">
          <button
            onClick={() => setViewMode('infographic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'infographic'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>✨</span>
            <span>Infographic View</span>
          </button>
          <button
            onClick={() => setViewMode('classic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'classic'
                ? 'bg-white/15 text-slate-100 border border-white/20 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📜</span>
            <span>Classic Document</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE: CLASSIC PRINT/DOCUMENT VIEW */}
      {viewMode === 'classic' && (
        <div className="p-6 md:p-10 bg-white/[0.02] border border-white/10 rounded-[32px] prose prose-invert prose-amber max-w-none prose-h1:font-cinzel prose-h2:font-cinzel prose-h2:text-amber-400 prose-h3:text-amber-200 prose-p:text-slate-300 leading-relaxed text-sm md:text-base animate-in fade-in duration-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportText}</ReactMarkdown>
        </div>
      )}

      {/* VIEW MODE: INFOGRAPHIC INTERACTIVE REPORT VIEW */}
      {viewMode === 'infographic' && sections.length > 0 && activeSection && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Section Navigation Ribbon */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar p-2 bg-black/40 border border-white/10 rounded-2xl">
            {sections.map((sec) => {
              const isSelected = (activeSection?.id === sec.id);
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/20 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                      : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.07] border border-transparent'
                  }`}
                >
                  <span className="text-base">{sec.icon}</span>
                  <span className="truncate max-w-[160px]">{sec.cleanTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Active Section Infographic Card */}
          <div className="p-6 md:p-10 bg-[#010204] border border-amber-500/20 rounded-[36px] shadow-2xl relative overflow-hidden backdrop-blur-2xl space-y-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] pointer-events-none rounded-full" />

            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  {activeSection.icon}
                </span>
                <div>
                  <h3 className="text-xl md:text-2xl font-cinzel font-bold text-amber-300">
                    {activeSection.cleanTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Infographic breakdown & targeted astrological guidance
                  </p>
                </div>
              </div>

              {/* Progress pill indicator */}
              <span className="text-[11px] font-mono text-slate-400 px-3 py-1 rounded-full bg-white/5 border border-white/10 self-start sm:self-center">
                Chapter {sections.findIndex(s => s.id === activeSection.id) + 1} of {sections.length}
              </span>
            </div>

            {/* Infographic Key Highlights Scanner (Strengths, Cautions, Remedies) */}
            {(activeSection.strengths.length > 0 || activeSection.cautions.length > 0 || activeSection.remedies.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Auspicious Opportunities */}
                {activeSection.strengths.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-300 tracking-wider mb-2">
                        <span>🌟</span>
                        <span>Favorable Boons & Strengths</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-emerald-100/90 leading-relaxed">
                        {activeSection.strengths.map((st, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 mt-0.5">•</span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Key Auspicious Advantage
                    </div>
                  </div>
                )}

                {/* 2. Mindful Tests / Cautions */}
                {activeSection.cautions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-300 tracking-wider mb-2">
                        <span>⚠️</span>
                        <span>Mindful Cautions & Growth Tests</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-amber-100/90 leading-relaxed">
                        {activeSection.cautions.map((ca, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 mt-0.5">•</span>
                            <span>{ca}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-amber-500/20 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Areas for Prudent Patience
                    </div>
                  </div>
                )}

                {/* 3. Actionable Remedies */}
                {activeSection.remedies.length > 0 && (
                  <div className="p-4 rounded-2xl bg-purple-500/[0.08] border border-purple-500/30 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-purple-300 tracking-wider mb-2">
                        <span>🪔</span>
                        <span>Actionable Vedic Upayas</span>
                      </div>
                      <ul className="space-y-1.5 text-xs text-purple-100/90 leading-relaxed">
                        {activeSection.remedies.map((re, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-purple-400 mt-0.5">•</span>
                            <span>{re}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      Practical Harmonization
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formatted Markdown Content */}
            <div className="prose prose-invert prose-amber max-w-none prose-h1:font-cinzel prose-h2:font-cinzel prose-h2:text-amber-400 prose-h3:text-amber-200 prose-p:text-slate-300 leading-relaxed text-sm md:text-base border-t border-white/5 pt-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {activeSection.content}
              </ReactMarkdown>
            </div>

            {/* Quick Next / Previous Chapter Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10 text-xs">
              {(() => {
                const curIdx = sections.findIndex(s => s.id === activeSection.id);
                const prev = sections[curIdx - 1];
                const next = sections[curIdx + 1];

                return (
                  <>
                    {prev ? (
                      <button
                        onClick={() => setActiveSectionId(prev.id)}
                        className="flex items-center gap-2 text-slate-400 hover:text-amber-300 transition-colors font-bold"
                      >
                        <span>← Previous: {prev.cleanTitle}</span>
                      </button>
                    ) : <div />}

                    {next ? (
                      <button
                        onClick={() => setActiveSectionId(next.id)}
                        className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-bold ml-auto"
                      >
                        <span>Next: {next.cleanTitle} →</span>
                      </button>
                    ) : <div />}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfographicReportViewer;
