import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";

interface CountryData {
  country: string;
  scanCount: number;
}

interface WorldMapProps {
  data: CountryData[];
}

// Simplified world map with major countries
const WorldMap: React.FC<WorldMapProps> = ({ data }) => {
  // Create a map of country codes to scan counts
  const countryMap = new Map();
  data.forEach(item => {
    countryMap.set(item.country, item.scanCount);
  });

  // Get max scan count for color intensity
  const maxScans = Math.max(...data.map(d => d.scanCount), 1);

  // Get color intensity based on scan count
  const getColorIntensity = (scanCount: number) => {
    const intensity = scanCount / maxScans;
    if (intensity === 0) return 'fill-gray-600';
    if (intensity <= 0.25) return 'fill-blue-400';
    if (intensity <= 0.5) return 'fill-blue-500';
    if (intensity <= 0.75) return 'fill-blue-600';
    return 'fill-blue-700';
  };

  // Country positions for markers (simplified)
  const countryPositions: { [key: string]: { x: number; y: number; name: string } } = {
    'US': { x: 200, y: 120, name: 'Estados Unidos' },
    'CA': { x: 150, y: 80, name: 'Canadá' },
    'MX': { x: 180, y: 160, name: 'México' },
    'BR': { x: 320, y: 280, name: 'Brasil' },
    'AR': { x: 300, y: 360, name: 'Argentina' },
    'GB': { x: 480, y: 100, name: 'Reino Unido' },
    'FR': { x: 500, y: 120, name: 'Francia' },
    'DE': { x: 520, y: 100, name: 'Alemania' },
    'IT': { x: 520, y: 140, name: 'Italia' },
    'ES': { x: 460, y: 140, name: 'España' },
    'RU': { x: 600, y: 80, name: 'Rusia' },
    'CN': { x: 700, y: 140, name: 'China' },
    'JP': { x: 760, y: 160, name: 'Japón' },
    'KR': { x: 740, y: 150, name: 'Corea del Sur' },
    'IN': { x: 650, y: 180, name: 'India' },
    'AU': { x: 750, y: 320, name: 'Australia' },
    'ZA': { x: 540, y: 320, name: 'Sudáfrica' },
    'EG': { x: 540, y: 180, name: 'Egipto' },
    'NG': { x: 500, y: 220, name: 'Nigeria' },
    'TR': { x: 560, y: 140, name: 'Turquía' },
  };

  return (
    <Card className="gradient-card elegant-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Globe className="w-5 h-5 text-blue-400" />
          Scans por País
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* World map SVG */}
          <svg
            viewBox="0 0 900 450"
            className="w-full h-80 bg-gray-900/50 rounded-lg border border-gray-700/50"
          >
            {/* World map background */}
            <defs>
              <pattern id="worldPattern" patternUnits="userSpaceOnUse" width="30" height="30">
                <rect width="30" height="30" fill="#1F2937" opacity="0.5"/>
                <circle cx="15" cy="15" r="0.5" fill="#374151" opacity="0.7"/>
              </pattern>
              <radialGradient id="scanGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.8"/>
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4"/>
              </radialGradient>
            </defs>
            <rect width="900" height="450" fill="url(#worldPattern)"/>
            
            {/* More detailed world map */}
            {/* North America */}
            <path d="M50,100 Q100,60 150,80 Q200,50 250,70 Q300,60 350,100 Q380,140 350,180 Q300,200 250,190 Q200,200 150,190 Q100,180 70,150 Q50,125 50,100 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.7"/>
            
            {/* South America */}
            <path d="M280,240 Q320,230 340,260 Q360,300 350,340 Q340,380 320,400 Q300,420 280,400 Q260,380 250,340 Q240,300 250,260 Q260,240 280,240 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.7"/>
            
            {/* Europe */}
            <path d="M450,80 Q500,70 550,80 Q580,90 590,120 Q580,140 550,150 Q500,160 450,150 Q420,140 410,120 Q420,100 450,80 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.7"/>
            
            {/* Africa */}
            <path d="M480,180 Q520,170 560,180 Q590,200 600,240 Q590,280 570,320 Q550,360 520,370 Q490,360 470,320 Q450,280 460,240 Q470,200 480,180 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.7"/>
            
            {/* Asia */}
            <path d="M600,70 Q650,60 700,70 Q750,80 800,90 Q820,120 810,150 Q780,180 750,190 Q700,200 650,190 Q600,180 580,150 Q570,120 590,90 Q600,70 600,70 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.7"/>
            
            {/* Australia */}
            <path d="M750,320 Q780,310 810,320 Q830,340 820,360 Q800,380 780,370 Q760,360 750,340 Q740,320 750,320 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.7"/>
            
            {/* Country markers with enhanced styling */}
            {Object.entries(countryPositions).map(([code, position]) => {
              const scanCount = countryMap.get(code) || 0;
              if (scanCount === 0) return null;
              
              const radius = Math.max(6, Math.min(16, Math.sqrt(scanCount) * 3));
              const colorIntensity = getColorIntensity(scanCount);
              
              return (
                <g key={code}>
                  {/* Outer glow effect */}
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={radius + 4}
                    fill="url(#scanGradient)"
                    opacity="0.3"
                  />
                  {/* Main marker */}
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={radius}
                    className={`${colorIntensity} stroke-white`}
                    strokeWidth="2"
                    opacity="0.9"
                  />
                  {/* Scan count text */}
                  <text
                    x={position.x}
                    y={position.y + 1}
                    textAnchor="middle"
                    className="text-xs font-bold fill-white"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {scanCount}
                  </text>
                  {/* Country label */}
                  <text
                    x={position.x}
                    y={position.y - radius - 8}
                    textAnchor="middle"
                    className="text-xs font-medium fill-gray-200"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {countryPositions[code]?.name || code}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-gray-300">Pocos scans</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Moderados</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              <span className="text-gray-300">Muchos</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <div className="w-3 h-3 bg-blue-700 rounded-full"></div>
              <span className="text-gray-300">Máximo</span>
            </div>
          </div>
        </div>
        
        {/* Country list */}
        {data.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Top Países por Scans</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {data.slice(0, 6).map((item, index) => (
                <div key={item.country} className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                  <span className="text-sm text-gray-300">
                    {countryPositions[item.country]?.name || item.country}
                  </span>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {item.scanCount}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay datos de geolocalización disponibles</p>
            <p className="text-sm mt-1">Los scans aparecerán aquí cuando se registren desde diferentes países</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorldMap;