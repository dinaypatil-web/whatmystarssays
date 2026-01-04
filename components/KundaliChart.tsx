
import React from 'react';
import { KundaliChartData } from '../types';

interface KundaliChartProps {
  data: KundaliChartData;
  lagnaSign: number; // The sign (1-12) for the 1st House
}

const KundaliChart: React.FC<KundaliChartProps> = ({ data, lagnaSign }) => {
  // SVG coordinates for house centers in a 400x400 diamond chart
  const houseCoords: { [key: number]: { x: number; y: number } } = {
    1: { x: 200, y: 140 },
    2: { x: 130, y: 70 },
    3: { x: 70, y: 130 },
    4: { x: 140, y: 200 },
    5: { x: 70, y: 270 },
    6: { x: 130, y: 330 },
    7: { x: 200, y: 260 },
    8: { x: 270, y: 330 },
    9: { x: 330, y: 270 },
    10: { x: 260, y: 200 },
    11: { x: 330, y: 130 },
    12: { x: 270, y: 70 },
  };

  // Coordinates for the Sign (Rashi) numbers in the corners of each house
  const rashiCoords: { [key: number]: { x: number; y: number } } = {
    1: { x: 200, y: 185 },
    2: { x: 155, y: 110 },
    3: { x: 110, y: 155 },
    4: { x: 185, y: 200 },
    5: { x: 110, y: 245 },
    6: { x: 155, y: 290 },
    7: { x: 200, y: 215 },
    8: { x: 245, y: 290 },
    9: { x: 290, y: 245 },
    10: { x: 215, y: 200 },
    11: { x: 290, y: 155 },
    12: { x: 245, y: 110 },
  };

  const getSignForHouse = (house: number) => {
    let sign = (lagnaSign + house - 1) % 12;
    return sign === 0 ? 12 : sign;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 bg-black/40 rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
      <h3 className="text-amber-400 font-cinzel text-lg mb-6 tracking-widest uppercase">Janma Kundali (D1)</h3>
      <div className="relative w-full max-w-[400px] aspect-square">
        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(251,191,36,0.2)] chart-svg">
          {/* Main Frame */}
          <rect x="0" y="0" width="400" height="400" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.3" className="chart-border" />
          
          {/* Internal House Lines (North Indian Style) */}
          <line x1="0" y1="0" x2="400" y2="400" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" className="chart-line" />
          <line x1="400" y1="0" x2="0" y2="400" stroke="#f59e0b" strokeWidth="1.5" opacity="0.4" className="chart-line" />
          
          <line x1="200" y1="0" x2="0" y2="200" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" className="chart-line" />
          <line x1="200" y1="0" x2="400" y2="200" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" className="chart-line" />
          <line x1="0" y1="200" x2="200" y2="400" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" className="chart-line" />
          <line x1="400" y1="200" x2="200" y2="400" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" className="chart-line" />

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
                fontSize="12"
                textAnchor="middle"
                className="font-bold opacity-80 chart-text-rashi"
              >
                {getSignForHouse(houseNum)}
              </text>
            );
          })}

          {/* Planets Placements */}
          {Object.entries(data).map(([house, planets]) => {
            const h = parseInt(house);
            const coord = houseCoords[h];
            if (!coord) return null;

            const planetArray = planets as string[];

            return (
              <g key={`house-${h}`}>
                {planetArray.map((p, idx) => {
                  // Offset planets if multiple exist in one house for clarity
                  const offsetX = (idx % 2 === 0 ? -1 : 1) * 20 * Math.floor(idx / 2 + 0.5);
                  const offsetY = Math.floor(idx / 2) * 18;
                  
                  return (
                    <text
                      key={`planet-${h}-${idx}`}
                      x={coord.x + offsetX}
                      y={coord.y + offsetY}
                      fill="#fef3c7"
                      fontSize="16"
                      textAnchor="middle"
                      className="font-black tracking-tighter drop-shadow-md chart-text-planet select-none animate-in fade-in zoom-in duration-500"
                    >
                      {p}
                    </text>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-4 text-[10px] text-slate-500 uppercase tracking-widest font-black text-center max-w-[280px]">
        Ascendant: {lagnaSign} (Lagna in Center Diamond)
      </p>
    </div>
  );
};

export default KundaliChart;
