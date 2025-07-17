import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, BarChart3, MapPin, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CountryData {
  country: string;
  scanCount: number;
}

interface IPData {
  ipAddress: string;
  country: string;
  scanCount: number;
}

interface GeographicStatsProps {
  data: CountryData[];
}

const GeographicStats: React.FC<GeographicStatsProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'countries' | 'ips'>('countries');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get IP data
  const { data: ipData, isLoading: isIPLoading } = useQuery<{ success: boolean; data: IPData[] }>({
    queryKey: ['/api/stats/ips'],
    queryFn: async () => {
      const response = await fetch('/api/stats/ips');
      if (!response.ok) throw new Error('Failed to fetch IP stats');
      return response.json();
    },
  });

  // Delete history function
  const handleDeleteHistory = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todo el historial de scans? Esta acción no se puede deshacer.')) {
      try {
        await apiRequest('DELETE', '/api/qr/history');
        
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ['/api/stats/countries'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats/ips'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats/dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['/api/qr/history'] });
        
        toast({
          title: "Historial eliminado",
          description: "Se ha eliminado todo el historial de scans correctamente.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el historial. Inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    }
  };

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
  const maxIPScans = Math.max(...(ipData?.data || []).map(d => d.scanCount), 1);

  return (
    <Card className="gradient-card elegant-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Globe className="w-5 h-5 text-blue-400" />
            Estadísticas Geográficas
          </CardTitle>
          <Button
            onClick={handleDeleteHistory}
            variant="outline"
            size="sm"
            className="bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar Historial
          </Button>
        </div>
        
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
            onClick={() => setActiveTab('ips')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'ips'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            IPs
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
                        <span className="text-xs font-medium text-white drop-shadow-lg">
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
            {/* IPs Bar Chart */}
            <div className="bg-gray-800/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Scans por IP (Top 10)
              </h3>
              {isIPLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {(ipData?.data || []).slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-32 text-xs text-gray-400 truncate flex-shrink-0">
                        {item.ipAddress}
                      </div>
                      <div className="w-8 text-xs text-gray-500 flex-shrink-0">
                        {getCountryName(item.country)}
                      </div>
                      <div className="flex-1 bg-gray-700/50 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${(item.scanCount / maxIPScans) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white drop-shadow-lg">
                            {item.scanCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* IPs Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Total IPs</div>
                <div className="text-lg font-bold text-purple-400">{ipData?.data?.length || 0}</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Total Scans</div>
                <div className="text-lg font-bold text-green-400">
                  {(ipData?.data || []).reduce((sum, item) => sum + item.scanCount, 0)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="text-xs text-gray-400">Promedio</div>
                <div className="text-lg font-bold text-yellow-400">
                  {(ipData?.data?.length || 0) > 0 
                    ? Math.round((ipData?.data || []).reduce((sum, item) => sum + item.scanCount, 0) / (ipData?.data?.length || 1)) 
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