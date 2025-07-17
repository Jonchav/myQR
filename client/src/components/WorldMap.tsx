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

  // Country positions for markers (based on realistic world map coordinates)
  const countryPositions: { [key: string]: { x: number; y: number; name: string } } = {
    'US': { x: 230, y: 160, name: 'Estados Unidos' },
    'CA': { x: 200, y: 120, name: 'Canadá' },
    'MX': { x: 220, y: 200, name: 'México' },
    'BR': { x: 350, y: 280, name: 'Brasil' },
    'AR': { x: 330, y: 360, name: 'Argentina' },
    'GB': { x: 480, y: 140, name: 'Reino Unido' },
    'FR': { x: 495, y: 160, name: 'Francia' },
    'DE': { x: 510, y: 140, name: 'Alemania' },
    'IT': { x: 515, y: 170, name: 'Italia' },
    'ES': { x: 470, y: 170, name: 'España' },
    'RU': { x: 620, y: 120, name: 'Rusia' },
    'CN': { x: 680, y: 180, name: 'China' },
    'JP': { x: 720, y: 180, name: 'Japón' },
    'KR': { x: 700, y: 175, name: 'Corea del Sur' },
    'IN': { x: 620, y: 200, name: 'India' },
    'AU': { x: 720, y: 320, name: 'Australia' },
    'ZA': { x: 530, y: 320, name: 'Sudáfrica' },
    'EG': { x: 530, y: 200, name: 'Egipto' },
    'NG': { x: 490, y: 240, name: 'Nigeria' },
    'TR': { x: 540, y: 170, name: 'Turquía' },
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
            
            {/* Realistic world map based on actual geographic coordinates */}
            {/* North America */}
            <path d="M90,90 L150,70 L180,80 L220,75 L260,85 L300,95 L340,110 L370,130 L380,150 L375,170 L365,185 L350,195 L330,200 L310,195 L290,185 L270,175 L250,165 L230,155 L210,145 L190,135 L170,125 L150,115 L130,105 L110,95 L90,90 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
            {/* Greenland */}
            <path d="M380,60 L400,65 L415,75 L420,90 L415,105 L400,115 L385,120 L370,115 L365,100 L370,85 L380,70 L380,60 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
            {/* South America */}
            <path d="M310,240 L320,230 L330,235 L340,245 L350,260 L360,275 L365,290 L370,305 L375,320 L370,335 L365,350 L355,365 L345,380 L335,390 L325,395 L315,390 L305,385 L295,375 L290,365 L285,355 L290,345 L295,335 L300,325 L305,315 L310,305 L315,295 L320,285 L315,275 L310,265 L305,255 L310,245 L310,240 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
            {/* Europe */}
            <path d="M450,100 L470,95 L490,100 L510,105 L530,110 L550,115 L570,120 L585,130 L595,140 L590,150 L585,160 L575,165 L565,170 L555,172 L545,170 L535,168 L525,165 L515,162 L505,159 L495,155 L485,150 L475,145 L465,140 L460,130 L455,120 L450,110 L450,100 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
            {/* Africa */}
            <path d="M480,160 L500,155 L520,160 L540,170 L560,180 L575,195 L585,210 L590,225 L595,240 L600,255 L595,270 L590,285 L585,300 L575,315 L565,330 L555,345 L545,360 L535,370 L525,375 L515,370 L505,365 L495,360 L485,355 L475,350 L465,345 L460,340 L455,335 L460,325 L465,315 L470,305 L475,295 L480,285 L485,275 L480,265 L475,255 L470,245 L475,235 L480,225 L485,215 L490,205 L485,195 L480,185 L475,175 L480,165 L480,160 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
            {/* Asia */}
            <path d="M600,90 L630,85 L660,90 L690,95 L720,100 L750,105 L780,110 L810,115 L830,125 L840,140 L845,155 L840,170 L835,180 L825,190 L810,195 L795,198 L780,200 L765,198 L750,196 L735,194 L720,191 L705,188 L690,185 L675,181 L660,177 L645,173 L630,168 L620,158 L615,148 L610,138 L608,128 L610,118 L615,108 L620,98 L615,88 L600,90 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
            {/* India */}
            <path d="M615,190 L625,185 L635,190 L645,195 L655,200 L665,210 L670,220 L675,230 L672,240 L668,248 L664,256 L658,262 L650,265 L642,268 L634,267 L626,265 L618,263 L612,258 L608,252 L604,246 L603,238 L605,230 L607,222 L610,214 L613,206 L616,198 L615,190 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
            {/* China */}
            <path d="M665,160 L685,155 L705,160 L725,165 L745,170 L765,175 L780,180 L795,185 L805,195 L810,205 L815,215 L812,225 L805,232 L798,239 L788,243 L778,245 L768,247 L758,246 L748,244 L738,242 L728,239 L718,236 L708,233 L698,229 L690,224 L682,219 L676,212 L672,204 L668,196 L667,187 L668,178 L669,169 L671,160 L675,153 L679,146 L684,141 L690,138 L696,135 L702,134 L708,135 L714,136 L720,139 L665,160 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
            {/* Australia */}
            <path d="M720,300 L740,295 L760,300 L780,305 L800,310 L815,320 L825,335 L835,350 L830,365 L820,375 L810,385 L795,390 L780,388 L765,386 L750,380 L735,374 L720,368 L710,358 L705,345 L700,332 L702,318 L708,308 L714,298 L720,295 L720,300 Z" 
                  fill="#374151" stroke="#4B5563" strokeWidth="1" opacity="0.8"/>
            
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