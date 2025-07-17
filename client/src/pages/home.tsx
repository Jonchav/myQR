import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, QrCode, Link, CheckCircle, AlertCircle, RefreshCw, Settings, User, LogOut, Moon, Sun, History, Palette, Sparkles, Shield, Crown, Clock } from "lucide-react";
import { QRCustomizer } from "@/components/QRCustomizer";
import { QRHistory } from "@/components/QRHistory";
import { DownloadButton } from "@/components/DownloadButton";
import { useTheme } from "@/components/ThemeProvider";

export default function Home() {
  const [url, setUrl] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isProActive, trialAvailable, plan, status } = useSubscription();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  // QR Settings with defaults
  const [qrSettings, setQrSettings] = useState({
    url: "",
    backgroundColor: "#ffffff",
    foregroundColor: "#000000",
    style: "square",
    size: "medium",
    pattern: "standard",
    frame: "none",
    gradient: "none",
    border: "none",
    logo: "none",
    type: "url",
    includeText: false,
    textContent: "",
    errorCorrection: "M",
    // Configuración por defecto para tarjeta PRO
    cardTemplate: "none",
    cardStyle: "modern_gradient",
    textPosition: "bottom",
    textAlign: "center",
    textSize: 24,
    textColor: "#ffffff",
    textOpacity: 100,
    textFont: "Arial",
    textShadow: false,
    textBold: true,
    textItalic: false,
    margin: 150,
    customBackgroundImage: null,
    qrPosition: "center",
  });

  // Update URL in settings when input changes
  useEffect(() => {
    setQrSettings(prev => ({ ...prev, url }));
  }, [url]);

  // Activate PRO card configuration when switching to customize tab
  useEffect(() => {
    if (activeTab === "customize" && isProActive) {
      setQrSettings(prev => ({
        ...prev,
        includeText: false,
        textContent: "",
        cardTemplate: "none",
        cardStyle: "modern_gradient",
        backgroundColor: "#ffffff",
        foregroundColor: "#5b21b6",
        style: "square",
        pattern: "standard",
      }));
    }
  }, [activeTab, isProActive]);

  const generateQRMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await apiRequest("POST", "/api/qr/generate", settings);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setQrCode(data.qrCode);
        setGeneratedUrl(data.url);
        setError(null);
        setShowSuccess(true);
        queryClient.invalidateQueries({ queryKey: ["/api/qr/history"] });
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
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sesión expirada",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
        return;
      }
      setError(error.message || "Error al generar el código QR");
      setShowSuccess(false);
    },
  });

  const handleGenerate = () => {
    // Use URL from settings if available, otherwise use the basic URL field
    const urlToUse = qrSettings.url || url;
    
    if (!urlToUse.trim()) {
      setError("Por favor, ingresa una URL");
      return;
    }

    try {
      new URL(urlToUse);
      setError(null);
      const settingsToUse = { ...qrSettings, url: urlToUse };
      generateQRMutation.mutate(settingsToUse);
    } catch {
      setError("Por favor, ingresa una URL válida (debe comenzar con http:// o https://)");
    }
  };



  const handleReset = () => {
    setUrl("");
    setQrCode(null);
    setGeneratedUrl(null);
    setError(null);
    setShowSuccess(false);
    setQrSettings({
      url: "",
      backgroundColor: "#ffffff",
      foregroundColor: "#000000",
      style: "square",
      size: "medium",
      pattern: "standard",
      frame: "none",
      gradient: "none",
      border: "none",
      logo: "none",
      type: "url",
      includeText: false,
      textContent: "",
      errorCorrection: "M",
      cardTemplate: "none",
      cardStyle: "modern_gradient",
      textPosition: "bottom",
      textAlign: "center",
      textSize: 24,
      textColor: "#ffffff",
      textOpacity: 100,
      textFont: "Arial",
      textShadow: false,
      textBold: true,
      textItalic: false,
      margin: 150,
      customBackgroundImage: null, // Reset imagen personalizada
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGenerate();
    }
  };

  const handleSettingsChange = (newSettings: any) => {
    setQrSettings(newSettings);
    // Sync the URL state with the settings
    if (newSettings.url !== url) {
      setUrl(newSettings.url);
    }
  };

  const handleEditQR = (qrData: any) => {
    setUrl(qrData.url);
    setQrSettings({
      url: qrData.url,
      backgroundColor: qrData.backgroundColor || "#ffffff",
      foregroundColor: qrData.foregroundColor || "#000000",
      style: qrData.style || "square",
      size: qrData.size || "medium",
      pattern: qrData.pattern || "standard",
      frame: qrData.frame || "none",
      gradient: qrData.gradient || "none",
      border: qrData.border || "none",
      logo: qrData.logo || "none",
      type: qrData.type || "url",
      includeText: qrData.includeText || false,
      textContent: qrData.textContent || "",
      errorCorrection: qrData.errorCorrection || "M",
      cardTemplate: qrData.cardTemplate || "none",
      cardStyle: qrData.cardStyle || "modern_gradient",
      customBackgroundImage: qrData.customBackgroundImage || null,
    });
    setActiveTab("generate");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen qr-pattern-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-600" />
          <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen qr-pattern-bg">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center vibrant-pulse color-glow">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  my<span className="text-primary vibrant-pulse">QR</span>
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generador Profesional</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  {/* Subscription Status */}
                  {isProActive ? (
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-600 text-white">
                        <Crown className="w-3 h-3 mr-1" />
                        PRO {plan}
                      </Badge>
                    </div>
                  ) : trialAvailable ? (
                    <Button size="sm" variant="outline" className="text-purple-600 border-purple-600 hover:bg-purple-50" asChild>
                      <a href="/subscription">
                        <Clock className="w-4 h-4 mr-1" />
                        Prueba 3 días gratis
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" asChild>
                      <a href="/subscription">
                        <Crown className="w-4 h-4 mr-1" />
                        Upgrade PRO
                      </a>
                    </Button>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center vibrant-pulse">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.firstName || user?.email || "Usuario"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/api/logout" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      <LogOut className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground vibrant-pulse color-glow" asChild>
                  <a href="/api/login">Iniciar Sesión</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <TabsTrigger value="generate" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600">
              <QrCode className="w-4 h-4" />
              Generar
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600">
              <Palette className="w-4 h-4" />
              Personalizar PRO
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600">
              <History className="w-4 h-4" />
              Historial PRO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">Ingresa tu enlace</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Introduce la URL para generar tu código QR
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url-input" className="text-gray-700 dark:text-gray-300">URL o enlace</Label>
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
                        className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500 transition-colors duration-200"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleGenerate}
                      disabled={generateQRMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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
                      <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700 dark:text-green-400">
                          ¡Código QR generado exitosamente!
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Features List */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">Características</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        "Generación instantánea",
                        "Alta calidad de imagen", 
                        "Descarga fácil",
                        "Historial personal"
                      ].map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* QR Display Section */}
              <div className="space-y-6">
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-lg text-center text-gray-900 dark:text-white">Tu código QR</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      {qrCode ? (
                        <div className="space-y-4">
                          {/* QR Code Display */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <img 
                              src={qrCode} 
                              alt="Código QR generado" 
                              className="mx-auto border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-[280px] w-full h-auto"
                            />
                          </div>
                          
                          <Alert className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700">
                            <Link className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <AlertDescription className="text-gray-700 dark:text-gray-300">
                              <span className="font-medium">Enlace:</span>{" "}
                              <span className="font-mono text-sm break-all text-emerald-700 dark:text-emerald-300">{generatedUrl}</span>
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <DownloadButton 
                                qrDataUrl={qrCode}
                                filename="qr-code"
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                              />
                              <Button 
                                onClick={handleReset}
                                variant="outline"
                                className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Nuevo
                              </Button>
                            </div>
                            
                            {/* PRO Customization CTA */}
                            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                                      <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
                                        Personalización PRO
                                      </h3>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Colores, estilos, logos y más
                                      </p>
                                    </div>
                                  </div>
                                  <Badge className="bg-amber-400 text-amber-900 border-0">
                                    PRO
                                  </Badge>
                                </div>
                                <Button 
                                  onClick={() => setActiveTab("customize")}
                                  className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                                  size="sm"
                                >
                                  <Sparkles className="w-4 h-4 mr-2" />
                                  Personalizar PRO
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-64 bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <QrCode className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">
                              El código QR aparecerá aquí
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customize" className="mt-8">
            {!isAuthenticated || !isProActive ? (
              <div className="max-w-2xl mx-auto">
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Palette className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">
                      Personalización PRO
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Desbloquea colores personalizados, estilos únicos, logos y patrones avanzados
                    </p>
                  </CardHeader>
                  <CardContent className="text-center space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Palette className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                          Colores Personalizados
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Combina colores de fondo y primer plano únicos para tu marca
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                          Estilos Avanzados
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Patrones circulares, marcos decorativos y efectos especiales
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                          Logos y Branding
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Añade tu logo y elementos de marca profesionales
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {!isAuthenticated ? (
                        <>
                          <Button 
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            asChild
                          >
                            <a href="/api/login">
                              <User className="w-4 h-4 mr-2" />
                              Iniciar Sesión para PRO
                            </a>
                          </Button>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Inicia sesión para acceder a las funciones PRO
                          </p>
                        </>
                      ) : (
                        <>
                          <Button 
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            asChild
                          >
                            <a href="/subscription">
                              <Crown className="w-4 h-4 mr-2" />
                              {trialAvailable ? "Probar 3 días gratis" : "Upgrade a PRO"}
                            </a>
                          </Button>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {trialAvailable ? "Prueba gratuita por 3 días, cancela cuando quieras" : "Desbloquea todas las funciones PRO"}
                          </p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <QRCustomizer
                  settings={qrSettings}
                  onChange={handleSettingsChange}
                  onGenerate={handleGenerate}
                  isGenerating={generateQRMutation.isPending}
                  onBackToHome={() => setActiveTab("generate")}
                  qrCode={qrCode}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-8">
            {!isAuthenticated || !isProActive ? (
              <Card className="max-w-2xl mx-auto bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-purple-700 dark:text-purple-300">
                    Historial PRO
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Accede a tu historial de códigos QR, estadísticas detalladas y exportación a Excel
                  </p>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        Historial Completo
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Accede a todos tus códigos QR generados con fechas y detalles
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        Estadísticas Avanzadas
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Análisis detallado de escaneos con gráficos y métricas
                      </p>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        Exportación Excel
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Exporta datos y estadísticas a archivos Excel profesionales
                      </p>
                    </div>
                </div>
                
                <div className="space-y-4">
                  {!isAuthenticated ? (
                    <>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        asChild
                      >
                        <a href="/api/login">
                          <User className="w-4 h-4 mr-2" />
                          Iniciar Sesión para PRO
                        </a>
                      </Button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Inicia sesión para acceder a las funciones PRO
                      </p>
                    </>
                  ) : (
                    <>
                      <Button 
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        asChild
                      >
                        <a href="/subscription">
                          <Crown className="w-4 h-4 mr-2" />
                          {trialAvailable ? "Probar 3 días gratis" : "Upgrade a PRO"}
                        </a>
                      </Button>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {trialAvailable ? "Prueba gratuita por 3 días, cancela cuando quieras" : "Desbloquea todas las funciones PRO"}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
            ) : (
              <div className="max-w-4xl mx-auto">
                <QRHistory onEditQR={handleEditQR} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
