import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, Calendar, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface QRCodeStats {
  id: number;
  url: string;
  title: string;
  createdAt: string;
  totalScans: number;
}

interface DashboardStats {
  topQRCodes: QRCodeStats[];
  totalStats: {
    totalQRCodes: number;
    totalScans: number;
  };
}

export default function StatsDashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const { data, isLoading, error } = useQuery<{ success: boolean; data: DashboardStats }>({
    queryKey: ['/api/stats/dashboard', appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);
      
      const response = await fetch(`/api/stats/dashboard?${params}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    },
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setAppliedFilters({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="gradient-card elegant-border">
        <CardContent className="p-6">
          <div className="text-center text-red-400">
            Error al cargar las estadísticas. Inténtalo de nuevo.
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.data;
  const topQRCodes = stats?.topQRCodes || [];
  const totalStats = stats?.totalStats || { totalQRCodes: 0, totalScans: 0 };

  // Prepare chart data
  const chartData = topQRCodes.slice(0, 10).map(qr => ({
    name: qr.title || `QR ${qr.id}`,
    scans: qr.totalScans,
    url: qr.url.length > 30 ? qr.url.substring(0, 30) + "..." : qr.url
  }));

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="gradient-card elegant-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Estadísticas del Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium text-gray-300">
                Fecha Inicio
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium text-gray-300">
                Fecha Fin
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-800/50 border-gray-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleApplyFilters}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
              >
                Filtrar
              </Button>
              <Button 
                onClick={handleClearFilters}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="gradient-card elegant-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total QR Codes</p>
                <p className="text-2xl font-bold text-white">{totalStats.totalQRCodes}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Eye className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="gradient-card elegant-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">Total Scans</p>
                <p className="text-2xl font-bold text-white">{totalStats.totalScans}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="gradient-card elegant-border">
          <CardHeader>
            <CardTitle className="text-white">Top 10 QR Codes por Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }}
                    formatter={(value: any, name: any) => [value, 'Scans']}
                    labelFormatter={(label) => `QR Code: ${label}`}
                  />
                  <Bar dataKey="scans" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top QR Codes Table */}
      <Card className="gradient-card elegant-border">
        <CardHeader>
          <CardTitle className="text-white">QR Codes con Más Scans</CardTitle>
        </CardHeader>
        <CardContent>
          {topQRCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No hay QR codes en el rango de fechas seleccionado
            </div>
          ) : (
            <div className="space-y-3">
              {topQRCodes.map((qr, index) => (
                <div key={qr.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-full">
                      <span className="text-sm font-bold text-purple-400">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {qr.title || `QR Code ${qr.id}`}
                      </h3>
                      <p className="text-sm text-gray-400 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {qr.url.length > 50 ? qr.url.substring(0, 50) + "..." : qr.url}
                      </p>
                      <p className="text-xs text-gray-500">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        Creado: {format(new Date(qr.createdAt), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {qr.totalScans} scans
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}