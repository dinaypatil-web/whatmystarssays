
import React from 'react';
import { KundaliChartData } from '../types';

interface KundaliChartProps {
  data: KundaliChartData;
  lagnaSign: number; // The sign (1-12) for the 1st House
}

const KundaliChart: React.FC<KundaliChartProps> = ({ data, lagnaSign }) => {
  // SVG coordinates for house centers in a 400x400 diamond chart
  // North Indian Style Layout:
  // 1: Center-Top Diamond, 4: Center-Left Diamond, 7: Center-Bottom Diamond, 10: Center-Right Diamond
  // Triangles: 2, 3, 5, 6, 8, 9, 11, 12
  const houseCoords: { [key: number]: { x: number; y: number } } = {
    1: { x: 200, y: 125 },
    2: { x: 110, y: 65 },
    3: { x: 65, y: 110 },
    4: { x: 125, y: 200 },
    5: { x: 65, y: 290 },
    6: { x: 110, y: 335 },
    7: { x: 200, y: 275 },
    8: { x: 290, y: 335 },
    9: { x: 335, y: 290 },
    10: { x: 275, y: 200 },
    11: { x: 335, y: 110 },
    12: { x: 290, y: 65 },
  };

  // Coordinates for the Sign (Rashi) numbers in specific positions within each house
  const rashiCoords: { [key: number]: { x: number; y: number } } = {
    1: { x: 200, y: 175 },
    2: { x: 165, y: 105 },
    3: { x: 105, y: 165 },
    4: { x: 175, y: 200 },
    5: { x: 105, y: 235 },
    6: { x: 165, y: 295 },
    7: { x: 200, y: 225 },
    8: { x: 235, y: 295 },
    9: { x: 295, y: 235 },
    10: { x: 225, y: 200 },
    11: { x: 295, y: 165 },
    12: { x: 235, y: 105 },
  };

  const getSignForHouse = (house: number) => {
    let sign = (lagnaSign + house - 1) % 12;
    return sign === 0 ? 12 : sign;
  };

  // Helper to arrange planets in a clean grid within a house
  const renderPlanetCluster = (planets: string[], centerX: number, centerY: number) => {
    if (!planets || planets.length === 0) return null;

    return planets.map((p, idx) => {
      // Create a small grid or offset pattern based on index
      // Max 4 planets usually in a house, but could be more.
      const perRow = planets.length > 4 ? 3 : 2;
      const row = Math.floor(idx / perRow);
      const col = idx % perRow;
      
      const offsetX = (col - (Math.min(planets.length, perRow) - 1) / 2) * 28;
      const offsetY = (row - (Math.ceil(planets.length / perRow) - 1) / 2) * 22;

      return (
        <text
          key={`planet-${p}-${idx}`}
          x={centerX + offsetX}
          y={centerY + offsetY}
          fill="#fef3c7"
          fontSize="15"
          fontWeight="900"
          textAnchor="middle"
          className="chart-text-planet select-none drop-shadow-[0_2px_2px_rgba(0,0,0,1)]"
          style={{ letterSpacing: '-0.05em' }}
        >
          {p.slice(0, 2)}
        </text>
      );
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-8 bg-slate-900/60 rounded-[40px] border border-amber-500/20 shadow-2xl overflow-hidden relative group">
      {/* Decorative Ornaments */}
      <div className="absolute top-4 left-4 text-amber-500/20 text-xs">❈</div>
      <div className="absolute top-4 right-4 text-amber-500/20 text-xs">❈</div>
      <div className="absolute bottom-4 left-4 text-amber-500/20 text-xs">❈</div>
      <div className="absolute bottom-4 right-4 text-amber-500/20 text-xs">❈</div>

      <h3 className="text-amber-400 font-cinzel text-xl mb-8 tracking-[0.2em] uppercase font-bold drop-shadow-lg">
        Janma Kundali <span className="text-amber-500/50">D1</span>
      </h3>
      
      <div className="relative w-full max-w-[420px] aspect-square">
        {/* Lagna Glow Effect */}
        <div className="absolute top-[15%] left-[15%] right-[15%] bottom-[15%] bg-amber-500/5 blur-[40px] rounded-full group-hover:bg-amber-500/10 transition-all duration-700" />

        <svg viewBox="0 0 400 400" className="w-full h-full chart-svg drop-shadow-2xl">
          {/* Main Diamond Frame */}
          <rect x="0" y="0" width="400" height="400" fill="transparent" stroke="#f59e0b" strokeWidth="1" opacity="0.1" />
          
          {/* Standard North Indian Grid Lines */}
          <line x1="0" y1="0" x2="400" y2="400" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
          <line x1="400" y1="0" x2="0" y2="400" stroke="#f59e0b" strokeWidth="2" opacity="0.6" />
          
          {/* Inner Diamond (1, 4, 7, 10) */}
          <path d="M 200 0 L 0 200 L 200 400 L 400 200 Z" fill="rgba(245, 158, 11, 0.02)" stroke="#f59e0b" strokeWidth="2.5" opacity="0.8" />
          
          {/* Accent for 1st House (Lagna) */}
          <path d="M 200 0 L 100 100 L 200 200 L 300 100 Z" fill="rgba(245, 158, 11, 0.05)" />

          {/* Rashi Sign Numbers */}
          {Object.keys(houseCoords).map((h) => {
            const houseNum = parseInt(h);
            const coord = rashiCoords[houseNum];
            return (
              <text
                key={`rashi-${houseNum}`}
                x={coord.x}
                y={coord.y}
                fill="#f59e0b"
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
                className="opacity-90 chart-text-rashi font-cinzel"
              >
                {getSignForHouse(houseNum)}
              </text>
            );
          })}

          {/* Planet Placements */}
          {Object.entries(data).map(([house, planets]) => {
            const h = parseInt(house);
            const coord = houseCoords[h];
            if (!coord) return null;
            return (
              <g key={`house-group-${h}`}>
                {renderPlanetCluster(planets as string[], coord.x, coord.y)}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.3em] whitespace-nowrap">
            Ascendant: {lagnaSign} (House 1)
          </p>
        </div>
        <p className="text-[9px] text-slate-500 uppercase tracking-widest font-medium text-center opacity-60">
          Traditional North Indian Square Chart
        </p>
      </div>
    </div>
  );
};

export default KundaliChart;
