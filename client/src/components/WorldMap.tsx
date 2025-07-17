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
          {/* Simplified world map SVG */}
          <svg
            viewBox="0 0 800 400"
            className="w-full h-64 bg-gray-800/30 rounded-lg border border-gray-700/50"
          >
            {/* World map background */}
            <defs>
              <pattern id="worldPattern" patternUnits="userSpaceOnUse" width="20" height="20">
                <rect width="20" height="20" fill="#374151" opacity="0.1"/>
                <circle cx="10" cy="10" r="1" fill="#6B7280" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="800" height="400" fill="url(#worldPattern)"/>
            
            {/* Continental shapes (simplified) */}
            {/* North America */}
            <path d="M50,80 L250,60 L280,120 L300,180 L200,200 L100,160 Z" 
                  fill="#4B5563" stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
            
            {/* South America */}
            <path d="M250,220 L320,200 L350,300 L320,380 L280,360 L260,280 Z" 
                  fill="#4B5563" stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
            
            {/* Europe */}
            <path d="M450,80 L550,70 L560,120 L500,140 L440,120 Z" 
                  fill="#4B5563" stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
            
            {/* Africa */}
            <path d="M480,160 L580,150 L590,280 L540,340 L480,320 L470,240 Z" 
                  fill="#4B5563" stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
            
            {/* Asia */}
            <path d="M580,60 L750,50 L780,160 L720,200 L600,180 L570,120 Z" 
                  fill="#4B5563" stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
            
            {/* Australia */}
            <path d="M720,300 L780,290 L790,330 L740,340 Z" 
                  fill="#4B5563" stroke="#6B7280" strokeWidth="1" opacity="0.6"/>
            
            {/* Country markers */}
            {Object.entries(countryPositions).map(([code, position]) => {
              const scanCount = countryMap.get(code) || 0;
              if (scanCount === 0) return null;
              
              const radius = Math.max(4, Math.min(12, scanCount * 2));
              const colorIntensity = getColorIntensity(scanCount);
              
              return (
                <g key={code}>
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={radius}
                    className={`${colorIntensity} stroke-white`}
                    strokeWidth="2"
                    opacity="0.8"
                  />
                  <text
                    x={position.x}
                    y={position.y - radius - 5}
                    textAnchor="middle"
                    className="text-xs font-medium fill-white"
                  >
                    {scanCount}
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