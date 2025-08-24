import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, QrCode, Link, CheckCircle, AlertCircle, RefreshCw, Settings, User, LogOut, Moon, Sun, History, Palette, Sparkles, Shield, Crown, Clock, TrendingUp, Calendar, Eye } from "lucide-react";
import { QRCustomizer } from "@/components/QRCustomizer";
import { DownloadButton } from "@/components/DownloadButton";
import StatsAndHistory from "@/components/StatsAndHistory";
import { useTheme } from "@/components/ThemeProvider";
import PayPalPlans from "@/components/PayPalPlans";

export default function Home() {
  const [url, setUrl] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
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
    // Text fields removed
    errorCorrection: "M",
    // Configuración por defecto para tarjeta personalizada
    cardTemplate: "none",
    cardStyle: "modern_gradient",
    // Text configuration removed
    margin: 150,
    customBackgroundImage: null,
    qrPosition: "center",
  });

  // Update URL in settings when input changes
  useEffect(() => {
    setQrSettings(prev => ({ ...prev, url }));
  }, [url]);

  // Activate card configuration when switching to customize tab
  useEffect(() => {
    if (activeTab === "customize") {
      setQrSettings(prev => ({
        ...prev,
        cardTemplate: "none",
        cardStyle: "modern_gradient",
        backgroundColor: "#ffffff",
        foregroundColor: "#5b21b6",
        style: "square",
        pattern: "standard",
      }));
    }
  }, [activeTab]);

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
      console.log("🔄 Generando QR con configuración:", settingsToUse);
      // Text logging removed
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
      errorCorrection: "M",
      cardTemplate: "none",
      cardStyle: "modern_gradient",
      margin: 150,
      customBackgroundImage: null,
      qrPosition: "center"
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
      margin: qrData.margin || 150,
      qrPosition: qrData.qrPosition || "center",
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Generador de Códigos QR</p>
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
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center vibrant-pulse">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {(user as any)?.firstName || (user as any)?.email || "Usuario"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href="/api/auth/logout" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      <LogOut className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground vibrant-pulse color-glow" asChild>
                  <a href="/api/auth/google">Iniciar Sesión con Google</a>
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
              Personalizar
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600">
              <TrendingUp className="w-4 h-4" />
              Dashboard
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
                              className="mx-auto border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-w-[600px] w-full h-auto"
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
            {!isAuthenticated ? (
              <div className="max-w-3xl mx-auto">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Palette className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-blue-700 dark:text-blue-300">
                      Personalización Completa
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Accede a herramientas de personalización y seguimiento de estadísticas
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                            <Palette className="w-4 h-4 text-blue-600" />
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Colores y Estilos</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Personaliza colores, patrones y efectos visuales
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white">Seguimiento de Scans</h3>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Monitorea cuántas veces se escanean tus códigos
                        </p>
                      </div>
                    </div>

                    {/* Pricing Plans */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white">
                        Planes de Suscripción
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Weekly Plan */}
                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                          <div className="text-center">
                            <h4 className="font-semibold text-emerald-700 dark:text-emerald-300">Plan Semanal</h4>
                            <div className="mt-2">
                              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$0.99</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">/semana</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Perfecto para proyectos cortos
                            </p>
                          </div>
                        </div>

                        {/* Monthly Plan */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 relative">
                          <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            Más Popular
                          </div>
                          <div className="text-center">
                            <h4 className="font-semibold text-blue-700 dark:text-blue-300">Plan Mensual</h4>
                            <div className="mt-2">
                              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">$2.15</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">/mes</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Ideal para uso continuo
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-center">
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                          asChild
                        >
                          <a href="/api/login">
                            <User className="w-4 h-4 mr-2" />
                            Iniciar Sesión para Comenzar
                          </a>
                        </Button>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          3 días de prueba gratuita incluidos
                        </p>
                      </div>
                      
                      <div className="border-t pt-4">
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-3">
                          O paga directamente con PayPal
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Plan Semanal:</span>
                            <div id="paypal-weekly-button" className="paypal-button-container"></div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Plan Mensual:</span>
                            <div id="paypal-monthly-button" className="paypal-button-container"></div>
                          </div>
                        </div>
                        <PayPalPlans onPaymentSuccess={(planType) => {
                          toast({
                            title: "Pago exitoso",
                            description: `Tu suscripción ${planType === 'weekly' ? 'semanal' : 'mensual'} ha sido activada correctamente.`,
                          });
                        }} />
                      </div>
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



          <TabsContent value="stats" className="mt-8">
            {!isAuthenticated ? (
              <div className="max-w-2xl mx-auto">
                <Card className="border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/50 dark:to-slate-900/50">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-800 dark:text-gray-200">
                      Seguimiento de Estadísticas
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Monitorea el rendimiento de tus códigos QR con datos detallados
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Features List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">Número total de escaneos por código QR</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">Historial completo de códigos generados</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">Gráficos de rendimiento por fecha</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-700 dark:text-gray-300">Ranking de códigos más populares</span>
                      </div>
                    </div>

                    <div className="text-center">
                      <Button 
                        className="w-full bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white"
                        asChild
                      >
                        <a href="/api/login">
                          <User className="w-4 h-4 mr-2" />
                          Iniciar Sesión para Ver Estadísticas
                        </a>
                      </Button>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Funcionalidad incluida en todos los planes
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <StatsAndHistory onEditQR={handleEditQR} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
