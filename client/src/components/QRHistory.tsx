import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { History, Eye, Copy, ExternalLink, Calendar, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface QRHistoryProps {
  onEditQR?: (qr: any) => void;
}

export function QRHistory({ onEditQR }: QRHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 20;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["qr-history", currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/qr/history?limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Error al cargar historial');
      }
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "URL copiada al portapapeles",
    });
  };

  const refreshHistory = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["qr-history"] });
      toast({
        title: "Actualizado",
        description: "Historial actualizado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el historial",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold text-white">Historial de QR</h2>
          </div>
          <Button
            onClick={refreshHistory}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="gradient-card elegant-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4 bg-gray-600" />
                  <Skeleton className="h-3 w-1/2 bg-gray-600" />
                </div>
                <Skeleton className="h-8 w-16 bg-gray-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-500/20 bg-red-500/10">
        <AlertDescription className="text-red-400">
          Error al cargar el historial: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  const qrCodes = data?.qrCodes || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Historial de QR</h2>
          {pagination && (
            <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
              {pagination.totalCount} códigos
            </Badge>
          )}
        </div>
        <Button
          onClick={refreshHistory}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {qrCodes.length === 0 ? (
        <Card className="gradient-card elegant-border">
          <CardContent className="p-8 text-center">
            <History className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No tienes códigos QR guardados aún</p>
            <p className="text-gray-500 text-sm mt-2">
              Crea tu primer código QR para verlo aquí
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {qrCodes.map((qr: any) => (
              <Card key={qr.id} className="gradient-card elegant-border hover:bg-gray-800/60 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white truncate">
                          {qr.title || new URL(qr.url).hostname}
                        </h3>
                        <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                          {qr.scanCount || qr.scans || 0} scans
                        </Badge>
                        {qr.cardStyle && qr.cardStyle !== 'none' && (
                          <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                            {qr.cardStyle}
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-400 text-sm truncate max-w-md">
                        {qr.url}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {qr.createdAt ? format(new Date(qr.createdAt), 'dd MMM yyyy', { locale: es }) : 'Fecha no disponible'}
                        </span>
                        <span>Tamaño: {qr.size || 'medium'}</span>
                        {qr.creativeStyle && qr.creativeStyle !== 'classic' && (
                          <span>Estilo: {qr.creativeStyle}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(qr.url)}
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(qr.url, '_blank')}
                        className="text-gray-400 hover:text-white hover:bg-gray-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          if (qr.qrDataUrl || qr.data) {
                            // Create a modal or popup to show the QR code
                            const newWindow = window.open('', '_blank', 'width=600,height=600');
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head>
                                    <title>QR Code - ${qr.title}</title>
                                    <style>
                                      body {
                                        margin: 0;
                                        padding: 20px;
                                        font-family: Arial, sans-serif;
                                        background: #1a1a1a;
                                        color: white;
                                        text-align: center;
                                      }
                                      img {
                                        max-width: 90%;
                                        height: auto;
                                        border-radius: 8px;
                                        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                                      }
                                      h1 {
                                        color: #a855f7;
                                        margin-bottom: 20px;
                                      }
                                      .url {
                                        color: #9ca3af;
                                        word-break: break-all;
                                        margin-top: 20px;
                                      }
                                    </style>
                                  </head>
                                  <body>
                                    <h1>${qr.title}</h1>
                                    <img src="${qr.qrDataUrl || qr.data}" alt="QR Code" />
                                    <div class="url">${qr.url}</div>
                                  </body>
                                </html>
                              `);
                              newWindow.document.close();
                            }
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginación */}
          {pagination && pagination.totalCount > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Anterior
              </Button>
              
              <span className="text-gray-400 px-4">
                Página {currentPage} de {Math.ceil(pagination.totalCount / itemsPerPage)}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasMore}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}