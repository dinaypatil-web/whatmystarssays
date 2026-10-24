import React from 'react';
import { PlanetaryPositionDetail, KundaliChartData } from '../types';

interface PlanetaryInfographicMatrixProps {
  planetaryPositions: PlanetaryPositionDetail[];
  chartData: KundaliChartData;
}

const PURUSHARTHA_MAP = {
  dharma: {
    title: 'Dharma (धर्म • 1, 5, 9)',
    subtitle: 'Purpose, Soul Alignment & Integrity',
    houses: [1, 5, 9],
    icon: '🕉️',
    gradient: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-200'
  },
  artha: {
    title: 'Artha (अर्थ • 2, 6, 10)',
    subtitle: 'Wealth, Vocation & Material Resources',
    houses: [2, 6, 10],
    icon: '💰',
    gradient: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-200'
  },
  kama: {
    title: 'Kama (काम • 3, 7, 11)',
    subtitle: 'Desires, Partnerships & Expansion',
    houses: [3, 7, 11],
    icon: '💖',
    gradient: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-200'
  },
  moksha: {
    title: 'Moksha (मोक्ष • 4, 8, 12)',
    subtitle: 'Inner Peace, Intuition & Liberation',
    houses: [4, 8, 12],
    icon: '🌊',
    gradient: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-200'
  }
};

const PlanetaryInfographicMatrix: React.FC<PlanetaryInfographicMatrixProps> = ({
  planetaryPositions,
  chartData
}) => {
  // Calculate planets per Purushartha
  const purusharthaCounts = {
    dharma: 0,
    artha: 0,
    kama: 0,
    moksha: 0
  };

  for (const pos of planetaryPositions) {
    if ([1, 5, 9].includes(pos.house)) purusharthaCounts.dharma++;
    else if ([2, 6, 10].includes(pos.house)) purusharthaCounts.artha++;
    else if ([3, 7, 11].includes(pos.house)) purusharthaCounts.kama++;
    else if ([4, 8, 12].includes(pos.house)) purusharthaCounts.moksha++;
  }

  const totalPlanets = planetaryPositions.length || 9;

  return (
    <div className="space-y-6">
      {/* Planetary Dignity Matrix Grid */}
      <div className="p-6 md:p-8 bg-white/[0.02] border border-white/10 rounded-[36px] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4 mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-cinzel font-bold text-amber-300 flex items-center gap-2">
              <span>🪐</span> Navagraha Planetary Dignity Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact house placements, signs, and Vedic planetary dignities across all 9 Grahas
            </p>
          </div>
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 uppercase tracking-widest font-black">
            9 Grahas Analyzed
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          {planetaryPositions.map((pos) => (
            <div
              key={pos.planet}
              className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 hover:bg-white/[0.06] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xl group-hover:scale-110 transition-transform">{pos.icon}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                    H{pos.house}
                  </span>
                </div>
                <div className="font-cinzel font-bold text-xs text-white break-words">
                  {pos.planet}
                </div>
                <div className="text-[10px] text-slate-400 break-words leading-tight">
                  {pos.sign}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-white/10">
                <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border break-words w-full text-center ${pos.dignityColor}`}>
                  {pos.dignity.split(' ')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 4 Purusharthas (Life Quadrants / 12 Bhavas) */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-amber-400 font-cinzel flex items-center gap-2">
                <span>⚖️</span> 4 Purushartha Life Pillars (Quadrant Energy Balance)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Distribution of planetary energy across the four sacred aims of human existence
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Object.entries(PURUSHARTHA_MAP).map(([key, pillar]) => {
              const count = purusharthaCounts[key as keyof typeof purusharthaCounts];
              const pct = Math.round((count / totalPlanets) * 100);

              return (
                <div
                  key={key}
                  className={`p-4 rounded-2xl bg-gradient-to-br ${pillar.gradient} border flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg">{pillar.icon}</span>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-full bg-white/10">
                        {count} {count === 1 ? 'Graha' : 'Grahas'} ({pct}%)
                      </span>
                    </div>
                    <h5 className="font-cinzel font-bold text-xs text-white">{pillar.title}</h5>
                    <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      {pillar.subtitle}
                    </p>
                  </div>

                  <div className="mt-3 pt-2">
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-700 rounded-full"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanetaryInfographicMatrix;
