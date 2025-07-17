import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, RotateCcw, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


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
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/stats/dashboard'] });
    toast({
      title: "Datos actualizados",
      description: "La información se ha actualizado correctamente",
    });
  };

  const exportAllQRStatsToExcel = async () => {
    try {
      const response = await fetch('/api/qr/export/all');
      if (!response.ok) {
        throw new Error('Error al exportar todas las estadísticas');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-stats.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportación exitosa",
        description: "Estadísticas del dashboard exportadas a Excel",
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar las estadísticas",
        variant: "destructive",
      });
    }
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

  // Calculate max scans for Y-axis ticks
  const maxScans = Math.max(...chartData.map(d => d.scans), 1);
  const yAxisTicks = Array.from({length: maxScans + 1}, (_, i) => i);

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card className="gradient-card elegant-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Estadísticas del Dashboard
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                className="border-purple-500 text-purple-300 hover:text-purple-200 hover:bg-purple-800/30"
                title="Actualizar Dashboard"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportAllQRStatsToExcel}
                className="border-green-500 text-green-300 hover:text-green-200 hover:bg-green-800/30"
                title="Exportar Dashboard a Excel"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
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
                  <YAxis 
                    tick={{ fill: '#9CA3AF' }} 
                    tickFormatter={(value) => Math.round(value).toString()}
                    domain={[0, maxScans]}
                    allowDecimals={false}
                    type="number"
                    ticks={yAxisTicks}
                  />
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

      {/* QR Codes Rankings */}
      {topQRCodes.length > 0 && (
        <Card className="gradient-card elegant-border">
          <CardHeader>
            <CardTitle className="text-white">Ranking de QR Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topQRCodes.slice(0, 10).map((qr, index) => (
                <div key={qr.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-white font-medium">{qr.title || `QR ${qr.id}`}</p>
                      <p className="text-gray-400 text-sm">{qr.url.length > 50 ? qr.url.substring(0, 50) + "..." : qr.url}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{qr.totalScans}</p>
                    <p className="text-gray-400 text-sm">scans</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}