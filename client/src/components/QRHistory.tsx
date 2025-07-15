import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { History, Download, Trash2, RefreshCw, Eye, Edit } from "lucide-react";
import { format } from "date-fns";

interface QRHistoryProps {
  onEditQR?: (qr: any) => void;
}

export function QRHistory({ onEditQR }: QRHistoryProps) {
  const [selectedQR, setSelectedQR] = useState<any>(null);
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

  const handleDownload = (qrCode: any) => {
    const link = document.createElement("a");
    link.download = `qr-${qrCode.id}.png`;
    link.href = qrCode.qrDataUrl;
    link.click();
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

  const getStyleDisplay = (style: string) => {
    switch (style) {
      case "square": return "Cuadrado";
      case "rounded": return "Redondeado";
      case "circle": return "Circular";
      case "dots": return "Puntos";
      default: return style;
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

  return (
    <Card className="gradient-card elegant-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-purple-400" />
            Historial de QR ({qrCodes.length})
          </CardTitle>
          {qrCodes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {qrCodes.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No hay códigos QR en el historial</p>
            <p className="text-sm text-gray-500">Genera tu primer código QR para verlo aquí</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {qrCodes.map((qrCode: any) => (
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
                    <Badge variant="outline" className="text-xs">
                      {getStyleDisplay(qrCode.style)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {qrCode.size}
                    </Badge>
                  </div>
                  
                  <p className="text-sm font-medium text-gray-300 truncate">
                    {qrCode.url}
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
                  {onEditQR && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditQR(qrCode)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(qrCode)}
                    className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQRMutation.mutate(qrCode.id)}
                    disabled={deleteQRMutation.isPending}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
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