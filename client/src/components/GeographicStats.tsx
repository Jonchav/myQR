import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, BarChart3, MapPin } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

interface CountryData {
  country: string;
  scanCount: number;
}

interface CityData {
  city: string;
  count: number;
}

interface GeographicStatsProps {
  data: CountryData[];
}

const GeographicStats: React.FC<GeographicStatsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'countries' | 'cities'>('countries');

  // Get city data
  const { data: cityData, isLoading: isCityLoading } = useQuery<{ success: boolean; data: CityData[] }>({
    queryKey: ['/api/stats/cities'],
    queryFn: async () => {
      const response = await fetch('/api/stats/cities');
      if (!response.ok) throw new Error('Failed to fetch city stats');
      return response.json();
    },
  });

  // Get country names
  const countryNames: { [key: string]: string } = {
    'US': 'Estados Unidos',
    'CA': 'Canadá',
    'MX': 'México',
    'BR': 'Brasil',
    'AR': 'Argentina',
    'GB': 'Reino Unido',
    'FR': 'Francia',
    'DE': 'Alemania',
    'IT': 'Italia',
    'ES': 'España',
    'RU': 'Rusia',
    'CN': 'China',
    'JP': 'Japón',
    'KR': 'Corea del Sur',
    'IN': 'India',
    'AU': 'Australia',
    'ZA': 'Sudáfrica',
    'EG': 'Egipto',
    'NG': 'Nigeria',
    'TR': 'Turquía'
  };

  const getCountryName = (code: string) => {
    return countryNames[code] || code;
  };

  // Get max values for bar sizing
  const maxCountryScans = Math.max(...data.map(d => d.scanCount), 1);
  const maxCityScans = Math.max(...(cityData?.data || []).map(d => d.count), 1);

  return (
    <Card className="gradient-card elegant-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Globe className="w-5 h-5 text-blue-400" />
          Estadísticas Geográficas
        </CardTitle>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('countries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'countries'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Países
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'cities'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Ciudades
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'countries' ? (
          <div className="space-y-4">
            {/* Countries Bar Chart */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Scans por País (Top 10)
              </h3>
              <div className="space-y-3">
                {data.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-20 text-xs text-gray-400 truncate flex-shrink-0">
                      {getCountryName(item.country)}
                    </div>
                    <div className="flex-1 bg-gray-700/50 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${(item.scanCount / maxCountryScans) * 100}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {item.scanCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Countries Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Total Países</div>
                <div className="text-lg font-bold text-purple-400">{data.length}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Total Scans</div>
                <div className="text-lg font-bold text-green-400">
                  {data.reduce((sum, item) => sum + item.scanCount, 0)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Promedio</div>
                <div className="text-lg font-bold text-yellow-400">
                  {data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.scanCount, 0) / data.length) : 0}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cities Bar Chart */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Scans por Ciudad (Top 10)
              </h3>
              {isCityLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(cityData?.data || []).slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-24 text-xs text-gray-400 truncate flex-shrink-0">
                        {item.city}
                      </div>
                      <div className="flex-1 bg-gray-700/50 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${(item.count / maxCityScans) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Cities Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Total Ciudades</div>
                <div className="text-lg font-bold text-purple-400">{cityData?.data?.length || 0}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Total Scans</div>
                <div className="text-lg font-bold text-green-400">
                  {(cityData?.data || []).reduce((sum, item) => sum + item.count, 0)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Promedio</div>
                <div className="text-lg font-bold text-yellow-400">
                  {(cityData?.data?.length || 0) > 0 
                    ? Math.round((cityData?.data || []).reduce((sum, item) => sum + item.count, 0) / (cityData?.data?.length || 1)) 
                    : 0
                  }
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeographicStats;