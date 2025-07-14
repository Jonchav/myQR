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
      case "url": return "bg-blue-100 text-blue-800";
      case "text": return "bg-green-100 text-green-800";
      case "email": return "bg-purple-100 text-purple-800";
      case "phone": return "bg-orange-100 text-orange-800";
      case "sms": return "bg-pink-100 text-pink-800";
      case "wifi": return "bg-cyan-100 text-cyan-800";
      default: return "bg-gray-100 text-gray-800";
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de QR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Error al cargar el historial. Inicia sesión para ver tu historial personal.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const qrCodes = data?.qrCodes || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historial de QR ({qrCodes.length})
          </CardTitle>
          {qrCodes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearHistoryMutation.mutate()}
              disabled={clearHistoryMutation.isPending}
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
            <History className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No hay códigos QR en el historial</p>
            <p className="text-sm text-gray-400">Genera tu primer código QR para verlo aquí</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {qrCodes.map((qrCode: any) => (
              <div
                key={qrCode.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                  
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
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
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(qrCode)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQRMutation.mutate(qrCode.id)}
                    disabled={deleteQRMutation.isPending}
                    className="text-red-600 hover:text-red-800"
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