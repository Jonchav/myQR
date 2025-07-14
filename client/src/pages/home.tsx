import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, QrCode, Link, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const generateQRMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/qr/generate", { url });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setQrCode(data.qrCode);
        setGeneratedUrl(data.url);
        setError(null);
        setShowSuccess(true);
        toast({
          title: "¡Éxito!",
          description: "Código QR generado exitosamente",
        });
      } else {
        setError(data.error || "Error al generar el código QR");
        setShowSuccess(false);
      }
    },
    onError: (error: any) => {
      setError(error.message || "Error al generar el código QR");
      setShowSuccess(false);
    },
  });

  const handleGenerate = () => {
    if (!url.trim()) {
      setError("Por favor, ingresa una URL");
      return;
    }

    try {
      new URL(url);
      setError(null);
      generateQRMutation.mutate(url);
    } catch {
      setError("Por favor, ingresa una URL válida (debe comenzar con http:// o https://)");
    }
  };

  const handleDownload = () => {
    if (!qrCode) return;

    const link = document.createElement("a");
    link.download = "codigo-qr.png";
    link.href = qrCode;
    link.click();
  };

  const handleReset = () => {
    setUrl("");
    setQrCode(null);
    setGeneratedUrl(null);
    setError(null);
    setShowSuccess(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Generador QR</h1>
                <p className="text-sm text-gray-600">Crea códigos QR desde cualquier enlace</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ingresa tu enlace</CardTitle>
                <p className="text-sm text-gray-600">Introduce la URL para generar tu código QR</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url-input">URL o enlace</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://ejemplo.com"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError(null);
                      setShowSuccess(false);
                    }}
                    onKeyPress={handleKeyPress}
                    className="transition-colors duration-200"
                  />
                </div>
                
                <Button 
                  onClick={handleGenerate}
                  disabled={generateQRMutation.isPending}
                  className="w-full"
                >
                  {generateQRMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    "Generar código QR"
                  )}
                </Button>
                
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {showSuccess && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      ¡Código QR generado exitosamente!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Features List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Características</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    "Generación instantánea",
                    "Alta calidad de imagen",
                    "Descarga fácil",
                    "Gratis y sin límites"
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Display Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-center">Tu código QR</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {/* QR Code Container */}
                <div className="mb-6">
                  {qrCode ? (
                    <div className="space-y-4">
                      <img 
                        src={qrCode} 
                        alt="Código QR generado" 
                        className="mx-auto border rounded-lg"
                      />
                      
                      {/* QR Info */}
                      <Alert className="bg-blue-50 border-blue-200">
                        <Link className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">
                          <span className="font-medium">Enlace:</span>{" "}
                          <span className="font-mono text-sm break-all">{generatedUrl}</span>
                        </AlertDescription>
                      </Alert>

                      {/* Download Button */}
                      <Button 
                        onClick={handleDownload}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar QR
                      </Button>

                      {/* Reset Button */}
                      <Button 
                        onClick={handleReset}
                        variant="outline"
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Generar nuevo código
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">El código QR aparecerá aquí</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tips Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consejos de uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  {[
                    "Asegúrate de que la URL sea válida y esté completa",
                    "Prueba el código QR antes de imprimirlo o compartirlo",
                    "Mantén un buen contraste al imprimir el código"
                  ].map((tip, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 text-xs font-bold">{index + 1}</span>
                      </div>
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2024 Generador QR. Hecho con ❤️ para facilitar la creación de códigos QR.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
