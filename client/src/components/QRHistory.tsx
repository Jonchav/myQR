import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { History, Trash2, RefreshCw, Eye, Edit, BarChart3, Save, X, Copy, RotateCcw, TrendingUp, PieChart, BarChart, FileSpreadsheet, Search } from "lucide-react";
import { DownloadButton } from "./DownloadButton";
import { format, subDays, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from "date-fns";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

interface QRHistoryProps {
  onEditQR?: (qr: any) => void;
}

export function QRHistory({ onEditQR }: QRHistoryProps) {
  const [selectedQR, setSelectedQR] = useState<any>(null);
  const [editingQR, setEditingQR] = useState<any>(null);
  const [newTitle, setNewTitle] = useState("");
  const [showStats, setShowStats] = useState<number | null>(null);
  const [statsRange, setStatsRange] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/qr/history"],
    retry: false,
  });

  const deleteQRMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/qr/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qr/history"] });
      toast({
        title: "QR eliminado",
        description: "El código QR ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el código QR",
        variant: "destructive",
      });
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/qr/history");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qr/history"] });
      toast({
        title: "Historial eliminado",
        description: "Todo el historial ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el historial",
        variant: "destructive",
      });
    },
  });

  const regenerateQRMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/qr/${id}/regenerate`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qr/history"] });
      toast({
        title: "QR regenerado",
        description: "El código QR ahora tiene seguimiento automático de scans",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al regenerar el código QR",
        variant: "destructive",
      });
    },
  });

  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const response = await apiRequest("PATCH", `/api/qr/${id}`, { title });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qr/history"] });
      setEditingQR(null);
      setNewTitle("");
      toast({
        title: "Título actualizado",
        description: "El título del QR ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el título",
        variant: "destructive",
      });
    },
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/qr", showStats, "stats", statsRange],
    enabled: showStats !== null,
    retry: false,
  });

  // Fetch detailed scan records for the statistics modal
  const { data: scanRecordsData, isLoading: scanRecordsLoading } = useQuery({
    queryKey: ["/api/qr", showStats, "scans"],
    enabled: showStats !== null,
    retry: false,
  });

  // Process stats data based on selected range
  const processStatsData = (stats: any) => {
    if (!stats || !stats.dailyStats) return [];
    
    const now = new Date();
    let startDate: Date;
    let labelFormat: string;
    
    switch (statsRange) {
      case "daily":
        startDate = subDays(now, 6);
        labelFormat = "dd/MM";
        break;
      case "weekly":
        startDate = subDays(now, 28);
        labelFormat = "dd/MM";
        break;
      case "monthly":
        startDate = subDays(now, 365);
        labelFormat = "MM/yyyy";
        break;
      case "yearly":
        startDate = subDays(now, 365 * 3);
        labelFormat = "yyyy";
        break;
    }
    
    return stats.dailyStats
      .filter((day: any) => new Date(day.date) >= startDate)
      .map((day: any) => ({
        date: format(new Date(day.date), labelFormat),
        count: day.count,
        fullDate: day.date
      }));
  };

  // Prepare pie chart data
  const preparePieData = (stats: any) => {
    if (!stats) return [];
    
    const total = stats.total || 0;
    const today = stats.today || 0;
    const thisWeek = (stats.thisWeek || stats.today || 0);
    const thisMonth = stats.thisMonth || 0;
    const older = Math.max(0, total - thisMonth);
    
    return [
      { name: "Hoy", value: today, fill: "#8b5cf6" },
      { name: "Esta semana", value: Math.max(0, thisWeek - today), fill: "#06b6d4" },
      { name: "Este mes", value: Math.max(0, thisMonth - thisWeek), fill: "#10b981" },
      { name: "Anteriores", value: older, fill: "#6b7280" }
    ].filter(item => item.value > 0);
  };

  const chartData = processStatsData(statsData?.stats);
  const pieData = preparePieData(statsData?.stats);
  
  const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

  // Export functions
  const exportQRStatsToExcel = async (qrId: number) => {
    try {
      const response = await fetch(`/api/qr/${qrId}/export`);
      if (!response.ok) {
        throw new Error('Error al exportar estadísticas');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-${qrId}-stats.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportación exitosa",
        description: "Estadísticas exportadas a Excel",
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar las estadísticas",
        variant: "destructive",
      });
    }
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
      a.download = `todos-qr-stats.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Exportación exitosa",
        description: "Todas las estadísticas exportadas a Excel",
      });
    } catch (error) {
      toast({
        title: "Error al exportar",
        description: "No se pudieron exportar las estadísticas",
        variant: "destructive",
      });
    }
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/qr/history"] });
    queryClient.invalidateQueries({ queryKey: ["/api/qr", showStats, "stats"] });
    toast({
      title: "Datos actualizados",
      description: "La información se ha actualizado correctamente",
    });
  };



  const startEditingTitle = (qr: any) => {
    setEditingQR(qr);
    setNewTitle(qr.title || "");
  };

  const saveTitle = () => {
    if (editingQR) {
      updateTitleMutation.mutate({ id: editingQR.id, title: newTitle });
    }
  };

  const cancelEdit = () => {
    setEditingQR(null);
    setNewTitle("");
  };

  const copyUrl = (url: string, qrId: number) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copiada",
      description: "La URL original ha sido copiada al portapapeles",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "url": return "bg-blue-900 text-blue-300";
      case "text": return "bg-green-900 text-green-300";
      case "email": return "bg-purple-900 text-purple-300";
      case "phone": return "bg-orange-900 text-orange-300";
      case "sms": return "bg-pink-900 text-pink-300";
      case "wifi": return "bg-cyan-900 text-cyan-300";
      default: return "bg-gray-800 text-gray-300";
    }
  };



  if (isLoading) {
    return (
      <Card className="gradient-card elegant-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-purple-400" />
            Historial de QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-16 h-16 rounded-lg bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-gray-800" />
                  <Skeleton className="h-3 w-1/2 bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="gradient-card elegant-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-purple-400" />
            Historial de QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="bg-red-900/20 border-red-800">
            <AlertDescription className="text-red-300">
              Error al cargar el historial. Inicia sesión para ver tu historial personal.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const qrCodes = data?.qrCodes || [];
  
  // Filter QR codes based on search query
  const filteredQRCodes = qrCodes.filter((qrCode: any) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const title = qrCode.title?.toLowerCase() || '';
    const url = qrCode.url?.toLowerCase() || '';
    const type = qrCode.type?.toLowerCase() || '';
    
    return title.includes(searchLower) || 
           url.includes(searchLower) || 
           type.includes(searchLower);
  });

  return (
    <Card className="gradient-card elegant-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-purple-400" />
            Historial de QR ({filteredQRCodes.length}{qrCodes.length !== filteredQRCodes.length ? ` de ${qrCodes.length}` : ''})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="border-purple-500 text-purple-300 hover:text-purple-200 hover:bg-purple-800/30"
              title="Actualizar Estadísticas"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            {qrCodes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportAllQRStatsToExcel}
                className="border-green-500 text-green-300 hover:text-green-200 hover:bg-green-800/30"
                title="Exportar Todos a Excel"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Todos
              </Button>
            )}
            {qrCodes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearHistoryMutation.mutate()}
                disabled={clearHistoryMutation.isPending}
                className="border-red-500 text-red-300 hover:text-red-200 hover:bg-red-800/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
        
        {/* Search input */}
        {qrCodes.length > 0 && (
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por título, URL o tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {qrCodes.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No hay códigos QR en el historial</p>
            <p className="text-sm text-gray-500">Genera tu primer código QR para verlo aquí</p>
          </div>
        ) : filteredQRCodes.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No se encontraron códigos QR que coincidan con "{searchQuery}"</p>
            <p className="text-sm text-gray-500">Intenta con otro término de búsqueda</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredQRCodes.map((qrCode: any) => (
              <div
                key={qrCode.id}
                className="flex items-center gap-4 p-4 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex-shrink-0">
                  <img
                    src={qrCode.qrDataUrl}
                    alt="QR Code"
                    className="w-16 h-16 border rounded-lg"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getTypeColor(qrCode.type)}>
                      {qrCode.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {qrCode.scanCount || 0} scans
                    </Badge>
                  </div>
                  
                  {/* Title editing */}
                  {editingQR && editingQR.id === qrCode.id ? (
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Agregar título..."
                        className="flex-1 bg-gray-700 border-gray-600 text-white text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={saveTitle}
                        disabled={updateTitleMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        className="border-red-600 text-red-300 hover:bg-red-800/30"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-purple-300 font-medium text-sm flex-1">
                        {qrCode.title || "Sin título"}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingTitle(qrCode)}
                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-800/30 p-1 h-auto border border-amber-600/50"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-sm font-medium text-gray-300 truncate">
                    {qrCode.url}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Los scans se registran automáticamente. Usa "Actualizar Estadísticas" para ver cambios.
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>
                      {format(new Date(qrCode.createdAt), "dd/MM/yyyy HH:mm")}
                    </span>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{
                          backgroundColor: qrCode.backgroundColor,
                          borderColor: qrCode.foregroundColor,
                        }}
                      />
                      <span>Colores</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyUrl(qrCode.url, qrCode.id)}
                    className="text-cyan-300 hover:text-cyan-200 hover:bg-cyan-800/30 border border-cyan-600/50"
                    title="Copiar URL original"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => regenerateQRMutation.mutate(qrCode.id)}
                    disabled={regenerateQRMutation.isPending}
                    className="text-emerald-300 hover:text-emerald-200 hover:bg-emerald-800/30 border border-emerald-600/50"
                    title="Regenerar con seguimiento automático"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportQRStatsToExcel(qrCode.id)}
                    className="text-green-300 hover:text-green-200 hover:bg-green-800/30 border border-green-600/50"
                    title="Exportar estadísticas a Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowStats(qrCode.id)}
                        className="text-violet-300 hover:text-violet-200 hover:bg-violet-800/30 border border-violet-600/50"
                      >
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Estadísticas Avanzadas del QR
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Análisis detallado del uso y rendimiento de tu código QR
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="py-4">
                        {statsLoading ? (
                          <div className="space-y-3">
                            <Skeleton className="h-4 w-full bg-gray-800" />
                            <Skeleton className="h-4 w-3/4 bg-gray-800" />
                            <Skeleton className="h-4 w-1/2 bg-gray-800" />
                          </div>
                        ) : statsData?.stats ? (
                          <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
                              <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Resumen
                              </TabsTrigger>
                              <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                                <BarChart className="w-4 h-4 mr-2" />
                                Análisis
                              </TabsTrigger>
                              <TabsTrigger value="detailed" className="text-white data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                                <Eye className="w-4 h-4 mr-2" />
                                Detallado
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="overview" className="mt-6 space-y-6">
                              {/* Summary Cards */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg p-4 border border-purple-700/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-purple-400" />
                                    <p className="text-sm text-purple-300">Total</p>
                                  </div>
                                  <p className="text-3xl font-bold text-white">{statsData.stats.total}</p>
                                </div>
                                <div className="bg-gradient-to-r from-blue-900/50 to-blue-800/50 rounded-lg p-4 border border-blue-700/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BarChart className="w-4 h-4 text-blue-400" />
                                    <p className="text-sm text-blue-300">Hoy (UTC)</p>
                                  </div>
                                  <p className="text-3xl font-bold text-white">{statsData.stats.today}</p>
                                  <p className="text-xs text-blue-300/70">Fecha UTC</p>
                                </div>
                                <div className="bg-gradient-to-r from-green-900/50 to-green-800/50 rounded-lg p-4 border border-green-700/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BarChart className="w-4 h-4 text-green-400" />
                                    <p className="text-sm text-green-300">Este mes</p>
                                  </div>
                                  <p className="text-3xl font-bold text-white">{statsData.stats.thisMonth}</p>
                                </div>
                                <div className="bg-gradient-to-r from-orange-900/50 to-orange-800/50 rounded-lg p-4 border border-orange-700/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <BarChart className="w-4 h-4 text-orange-400" />
                                    <p className="text-sm text-orange-300">Este año</p>
                                  </div>
                                  <p className="text-3xl font-bold text-white">{statsData.stats.thisYear}</p>
                                </div>
                              </div>

                              {/* Daily Breakdown */}
                              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Desglose por Día</h3>
                                <div className="space-y-2">
                                  {statsData.stats.dailyStats.length > 0 ? (
                                    statsData.stats.dailyStats.slice(-7).map((day: any, index: number) => (
                                      <div key={index} className="flex justify-between items-center p-2 bg-gray-700/50 rounded">
                                        <span className="text-gray-300">{day.date}</span>
                                        <span className="text-purple-400 font-medium">{day.count} scans</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-400">No hay datos de scans por día</p>
                                  )}
                                </div>
                              </div>

                            {/* Controls */}
                            <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-300">Rango:</label>
                                <Select value={statsRange} onValueChange={(value: any) => setStatsRange(value)}>
                                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-gray-800 border-gray-700">
                                    <SelectItem value="daily" className="text-white hover:bg-gray-700 focus:bg-gray-700">Diario</SelectItem>
                                    <SelectItem value="weekly" className="text-white hover:bg-gray-700 focus:bg-gray-700">Semanal</SelectItem>
                                    <SelectItem value="monthly" className="text-white hover:bg-gray-700 focus:bg-gray-700">Mensual</SelectItem>
                                    <SelectItem value="yearly" className="text-white hover:bg-gray-700 focus:bg-gray-700">Anual</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-300">Gráfico:</label>
                                <div className="flex gap-1">
                                  <Button
                                    variant={chartType === "bar" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setChartType("bar")}
                                    className="px-3"
                                  >
                                    <BarChart className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant={chartType === "line" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setChartType("line")}
                                    className="px-3"
                                  >
                                    <TrendingUp className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant={chartType === "pie" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setChartType("pie")}
                                    className="px-3"
                                  >
                                    <PieChart className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => showStats && exportQRStatsToExcel(showStats)}
                                  className="border-green-500 text-green-300 hover:text-green-200 hover:bg-green-800/30"
                                >
                                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                                  Exportar Excel
                                </Button>
                              </div>
                            </div>

                            {/* Charts */}
                            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                              <h3 className="text-lg font-semibold text-white mb-4">
                                Análisis de Scans - {statsRange === "daily" ? "Últimos 7 días" : 
                                                     statsRange === "weekly" ? "Últimas 4 semanas" : 
                                                     statsRange === "monthly" ? "Últimos 12 meses" : 
                                                     "Últimos 3 años"}
                              </h3>
                              
                              <div className="h-80">
                                {chartType === "bar" && (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RechartsBarChart data={chartData}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                      <XAxis dataKey="date" stroke="#9CA3AF" />
                                      <YAxis stroke="#9CA3AF" />
                                      <Tooltip 
                                        contentStyle={{ 
                                          backgroundColor: '#1F2937', 
                                          border: '1px solid #374151',
                                          borderRadius: '8px',
                                          color: '#F3F4F6'
                                        }}
                                      />
                                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </RechartsBarChart>
                                  </ResponsiveContainer>
                                )}
                                
                                {chartType === "line" && (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                      <XAxis dataKey="date" stroke="#9CA3AF" />
                                      <YAxis stroke="#9CA3AF" />
                                      <Tooltip 
                                        contentStyle={{ 
                                          backgroundColor: '#1F2937', 
                                          border: '1px solid #374151',
                                          borderRadius: '8px',
                                          color: '#F3F4F6'
                                        }}
                                      />
                                      <Line 
                                        type="monotone" 
                                        dataKey="count" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={3}
                                        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                )}
                                
                                {chartType === "pie" && (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                      <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ${value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                      >
                                        {pieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip 
                                        contentStyle={{ 
                                          backgroundColor: '#1F2937', 
                                          border: '1px solid #374151',
                                          borderRadius: '8px',
                                          color: '#F3F4F6'
                                        }}
                                      />
                                    </RechartsPieChart>
                                  </ResponsiveContainer>
                                )}
                              </div>
                            </div>
                            </TabsContent>
                            
                            <TabsContent value="analytics" className="mt-6 space-y-6">
                              {/* Controls */}
                              <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-gray-300">Rango:</label>
                                  <Select value={statsRange} onValueChange={(value: any) => setStatsRange(value)}>
                                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700">
                                      <SelectItem value="daily" className="text-white hover:bg-gray-700 focus:bg-gray-700">Diario</SelectItem>
                                      <SelectItem value="weekly" className="text-white hover:bg-gray-700 focus:bg-gray-700">Semanal</SelectItem>
                                      <SelectItem value="monthly" className="text-white hover:bg-gray-700 focus:bg-gray-700">Mensual</SelectItem>
                                      <SelectItem value="yearly" className="text-white hover:bg-gray-700 focus:bg-gray-700">Anual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <label className="text-sm text-gray-300">Gráfico:</label>
                                  <div className="flex gap-1">
                                    <Button
                                      variant={chartType === "bar" ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setChartType("bar")}
                                      className="px-3"
                                    >
                                      <BarChart className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant={chartType === "line" ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setChartType("line")}
                                      className="px-3"
                                    >
                                      <TrendingUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant={chartType === "pie" ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setChartType("pie")}
                                      className="px-3"
                                    >
                                      <PieChart className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => showStats && exportQRStatsToExcel(showStats)}
                                    className="border-green-500 text-green-300 hover:text-green-200 hover:bg-green-800/30"
                                  >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                    Exportar Excel
                                  </Button>
                                </div>
                              </div>

                              {/* Charts */}
                              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                  Análisis de Scans - {statsRange === "daily" ? "Últimos 7 días" : 
                                                       statsRange === "weekly" ? "Últimas 4 semanas" : 
                                                       statsRange === "monthly" ? "Últimos 12 meses" : 
                                                       "Últimos 3 años"}
                                </h3>
                                <div className="h-64">
                                  {statsData.stats.dailyStats.length > 0 ? (
                                    <>
                                      {chartType === "bar" && (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <RechartsBarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis 
                                              dataKey="date" 
                                              stroke="#9CA3AF" 
                                              fontSize={12}
                                              tickLine={false}
                                              axisLine={false}
                                            />
                                            <YAxis 
                                              stroke="#9CA3AF" 
                                              fontSize={12}
                                              tickLine={false}
                                              axisLine={false}
                                            />
                                            <Tooltip 
                                              contentStyle={{ 
                                                backgroundColor: '#1F2937', 
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                                color: '#F3F4F6'
                                              }}
                                            />
                                            <Bar 
                                              dataKey="count" 
                                              fill="#8b5cf6"
                                              radius={[4, 4, 0, 0]}
                                              name="Scans"
                                            />
                                          </RechartsBarChart>
                                        </ResponsiveContainer>
                                      )}
                                      
                                      {chartType === "line" && (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis 
                                              dataKey="date" 
                                              stroke="#9CA3AF" 
                                              fontSize={12}
                                              tickLine={false}
                                              axisLine={false}
                                            />
                                            <YAxis 
                                              stroke="#9CA3AF" 
                                              fontSize={12}
                                              tickLine={false}
                                              axisLine={false}
                                            />
                                            <Tooltip 
                                              contentStyle={{ 
                                                backgroundColor: '#1F2937', 
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                                color: '#F3F4F6'
                                              }}
                                            />
                                            <Line 
                                              type="monotone" 
                                              dataKey="count" 
                                              stroke="#8b5cf6" 
                                              strokeWidth={3}
                                              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                                              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
                                            />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      )}
                                      
                                      {chartType === "pie" && (
                                        <ResponsiveContainer width="100%" height="100%">
                                          <RechartsPieChart>
                                            <Pie
                                              data={pieData}
                                              cx="50%"
                                              cy="50%"
                                              labelLine={false}
                                              label={({ name, value }) => `${name}: ${value}`}
                                              outerRadius={80}
                                              fill="#8884d8"
                                              dataKey="value"
                                            >
                                              {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                              ))}
                                            </Pie>
                                            <Tooltip 
                                              contentStyle={{ 
                                                backgroundColor: '#1F2937', 
                                                border: '1px solid #374151',
                                                borderRadius: '8px',
                                                color: '#F3F4F6'
                                              }}
                                            />
                                          </RechartsPieChart>
                                        </ResponsiveContainer>
                                      )}
                                    </>
                                  ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                      <p>No hay datos suficientes para mostrar gráficos</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="detailed" className="mt-6 space-y-6">
                              {/* Detailed Scan Records */}
                              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Registros Detallados de Escaneos</h3>
                                <p className="text-xs text-gray-400 mb-4">
                                  Nota: Las estadísticas se basan en fecha UTC. Los horarios mostrados se convierten a tu zona horaria local.
                                </p>
                                {scanRecordsLoading ? (
                                  <div className="space-y-2">
                                    <Skeleton className="h-4 w-full bg-gray-700" />
                                    <Skeleton className="h-4 w-3/4 bg-gray-700" />
                                    <Skeleton className="h-4 w-1/2 bg-gray-700" />
                                  </div>
                                ) : scanRecordsData?.scans?.length > 0 ? (
                                  <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {scanRecordsData.scans.map((scan: any, index: number) => (
                                      <div key={index} className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-sm font-medium text-purple-300">
                                                {format(new Date(scan.scannedAt), "dd/MM/yyyy HH:mm:ss")}
                                              </span>
                                              <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300">
                                                Scan #{scanRecordsData.scans.length - index}
                                              </Badge>
                                            </div>
                                            {scan.userAgent && (
                                              <p className="text-xs text-gray-400 truncate">
                                                {scan.userAgent}
                                              </p>
                                            )}
                                          </div>
                                          {scan.ipAddress && (
                                            <div className="text-xs text-gray-500">
                                              IP: {scan.ipAddress}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-400">No hay registros de escaneos disponibles</p>
                                )}
                              </div>
                            </TabsContent>
                          </Tabs>
                        ) : (
                          <p className="text-gray-400">No hay estadísticas disponibles</p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {onEditQR && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditQR(qrCode)}
                      className="text-blue-300 hover:text-blue-200 hover:bg-blue-800/30 border border-blue-600/50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <DownloadButton 
                    qrDataUrl={qrCode.qrDataUrl}
                    filename={`qr-${qrCode.id}`}
                    className="text-green-300 hover:text-green-200 hover:bg-green-800/30 border border-green-600/50"
                  />
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQRMutation.mutate(qrCode.id)}
                    disabled={deleteQRMutation.isPending}
                    className="text-red-300 hover:text-red-200 hover:bg-red-800/30 border border-red-600/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}