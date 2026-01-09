
import React, { useState } from 'react';
import { KundaliChartData } from '../types';

interface KundaliChartProps {
  data: KundaliChartData;
  lagnaSign: number; // The sign (1-12) for the 1st House
}

const PLANET_SYMBOLS: { [key: string]: string } = {
  'Sun': '☉',
  'Moon': '☽',
  'Mars': '♂',
  'Mercury': '☿',
  'Jupiter': '♃',
  'Venus': '♀',
  'Saturn': '♄',
  'Rahu': '☊',
  'Ketu': '☋',
  'Su': '☉',
  'Mo': '☽',
  'Ma': '♂',
  'Me': '☿',
  'Ju': '♃',
  'Ve': '♀',
  'Sa': '♄',
  'Ra': '☊',
  'Ke': '☋',
};

const HOUSE_NAMES: { [key: number]: string } = {
  1: 'Lagna (Ascendant)',
  2: 'Dhana (Wealth)',
  3: 'Sahaja (Siblings)',
  4: 'Sukha (Happiness)',
  5: 'Putra (Children)',
  6: 'Ari (Enemies)',
  7: 'Yuvati (Partnership)',
  8: 'Randhra (Longevity)',
  9: 'Bhagya (Fortune)',
  10: 'Karma (Career)',
  11: 'Labha (Gains)',
  12: 'Vyaya (Losses)',
};

const KundaliChart: React.FC<KundaliChartProps> = ({ data, lagnaSign }) => {
  const [hoveredHouse, setHoveredHouse] = useState<number | null>(null);

  // SVG coordinates for house centers in a 400x400 diamond chart
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

  const rashiCoords: { [key: number]: { x: number; y: number } } = {
    1: { x: 200, y: 185 },
    2: { x: 175, y: 115 },
    3: { x: 115, y: 175 },
    4: { x: 185, y: 200 },
    5: { x: 115, y: 225 },
    6: { x: 175, y: 285 },
    7: { x: 200, y: 215 },
    8: { x: 225, y: 285 },
    9: { x: 285, y: 225 },
    10: { x: 215, y: 200 },
    11: { x: 285, y: 175 },
    12: { x: 225, y: 115 },
  };

  // SVG Path definitions for interactivity
  const housePaths: { [key: number]: string } = {
    1: "M 200 0 L 100 100 L 200 200 L 300 100 Z",
    2: "M 0 0 L 200 0 L 100 100 Z",
    3: "M 0 0 L 0 200 L 100 100 Z",
    4: "M 0 200 L 100 100 L 200 200 L 100 300 Z",
    5: "M 0 200 L 0 400 L 100 300 Z",
    6: "M 0 400 L 200 400 L 100 300 Z",
    7: "M 200 400 L 100 300 L 200 200 L 300 300 Z",
    8: "M 200 400 L 400 400 L 300 300 Z",
    9: "M 400 200 L 400 400 L 300 300 Z",
    10: "M 400 200 L 300 300 L 200 200 L 300 100 Z",
    11: "M 400 0 L 400 200 L 300 100 Z",
    12: "M 200 0 L 400 0 L 300 100 Z",
  };

  const getSignForHouse = (house: number) => {
    let sign = (lagnaSign + house - 1) % 12;
    return sign === 0 ? 12 : sign;
  };

  const renderPlanetCluster = (planets: string[], centerX: number, centerY: number) => {
    if (!planets || planets.length === 0) return null;

    return planets.map((p, idx) => {
      const perRow = planets.length > 4 ? 3 : 2;
      const row = Math.floor(idx / perRow);
      const col = idx % perRow;
      
      const offsetX = (col - (Math.min(planets.length, perRow) - 1) / 2) * 28;
      const offsetY = (row - (Math.ceil(planets.length / perRow) - 1) / 2) * 22;

      const symbol = PLANET_SYMBOLS[p] || p.slice(0, 2);

      return (
        <g key={`planet-${p}-${idx}`} transform={`translate(${centerX + offsetX}, ${centerY + offsetY})`}>
          <text
            fill="#fef3c7"
            fontSize="18"
            fontWeight="900"
            textAnchor="middle"
            className="select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            {symbol}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-900 via-slate-900 to-black rounded-[50px] border border-amber-500/30 shadow-2xl overflow-hidden relative group">
      {/* Ornate corners */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-amber-500/20 rounded-tl-3xl" />
      <div className="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-amber-500/20 rounded-tr-3xl" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-amber-500/20 rounded-bl-3xl" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-amber-500/20 rounded-br-3xl" />

      <div className="flex flex-col items-center mb-6">
        <h3 className="text-amber-400 font-cinzel text-2xl tracking-[0.2em] uppercase font-bold drop-shadow-lg mb-1">
          Janma Kundali <span className="text-amber-500/40 text-sm">Vedic</span>
        </h3>
        <p className="text-[10px] text-amber-500/60 font-black uppercase tracking-[0.4em]">Celestial Blueprint</p>
      </div>
      
      <div className="relative w-full max-w-[440px] aspect-square">
        {/* Central Glow */}
        <div className="absolute top-[20%] left-[20%] right-[20%] bottom-[20%] bg-amber-500/10 blur-[80px] rounded-full group-hover:bg-amber-500/20 transition-all duration-1000" />

        <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="houseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#f59e0b', stopOpacity: 0.1 }} />
              <stop offset="100%" style={{ stopColor: '#f59e0b', stopOpacity: 0.02 }} />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>

          {/* House Backgrounds & Interactive Areas */}
          {Object.entries(housePaths).map(([id, path]) => (
            <path
              key={`house-path-${id}`}
              d={path}
              className={`transition-all duration-500 cursor-pointer ${hoveredHouse === parseInt(id) ? 'fill-amber-500/20' : 'fill-transparent'}`}
              onMouseEnter={() => setHoveredHouse(parseInt(id))}
              onMouseLeave={() => setHoveredHouse(null)}
            />
          ))}

          {/* North Indian Grid Structure */}
          <line x1="0" y1="0" x2="400" y2="400" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
          <line x1="400" y1="0" x2="0" y2="400" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
          
          {/* Main Structural Diamonds */}
          <path d="M 200 0 L 0 200 L 200 400 L 400 200 Z" fill="none" stroke="#f59e0b" strokeWidth="2.5" opacity="0.8" filter="url(#glow)" />
          <rect x="0" y="0" width="400" height="400" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.3" />

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
                fontWeight="900"
                textAnchor="middle"
                className="opacity-90 font-cinzel pointer-events-none"
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
              <g key={`house-group-${h}`} className="pointer-events-none">
                {renderPlanetCluster(planets as string[], coord.x, coord.y)}
              </g>
            );
          })}
        </svg>

        {/* Hover Information Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-500 ${hoveredHouse ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-amber-500/50 shadow-2xl">
             <p className="text-amber-400 font-cinzel text-sm uppercase tracking-widest font-bold">
               {hoveredHouse ? `${hoveredHouse}${getOrdinal(hoveredHouse)} House: ${HOUSE_NAMES[hoveredHouse]}` : ''}
             </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-5 gap-3 w-full opacity-60">
        {Object.entries(PLANET_SYMBOLS).slice(0, 9).map(([name, sym]) => (
          <div key={name} className="flex flex-col items-center">
            <span className="text-amber-200 text-lg mb-0.5">{sym}</span>
            <span className="text-[7px] uppercase font-black tracking-widest text-slate-400">{name.slice(0,3)}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.4em] whitespace-nowrap">
            Ascendant Sign: {lagnaSign}
          </p>
        </div>
      </div>
    </div>
  );
};

const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

export default KundaliChart;
