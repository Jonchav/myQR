import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Palette, Settings, Layers, Frame, Sparkles, Type, Shield, Loader2, Home, ArrowLeft, Download } from "lucide-react";

interface QRCustomizerProps {
  settings: any;
  onChange: (settings: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onBackToHome?: () => void;
  qrCode?: string | null;
  onDownload?: () => void;
}

export function QRCustomizer({ settings, onChange, onGenerate, isGenerating, onBackToHome, qrCode, onDownload }: QRCustomizerProps) {
  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onChange(newSettings);
  };

  // Función para aplicar cambios en tiempo real
  const applyRealTimeChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onChange(newSettings);
    
    // Si hay una URL y el cambio es visual, regenerar automáticamente
    if (settings.url && onGenerate && !isGenerating) {
      const visualChanges = ['backgroundColor', 'foregroundColor', 'style', 'pattern', 'gradient', 'frame', 'size'];
      if (visualChanges.includes(key)) {
        setTimeout(() => {
          onGenerate();
        }, 300); // Delay para evitar múltiples llamadas
      }
    }
  };

  const colorPresets = [
    { name: "Clásico", bg: "#ffffff", fg: "#000000", category: "basic" },
    { name: "Azul", bg: "#f0f8ff", fg: "#1e40af", category: "basic" },
    { name: "Verde", bg: "#f0fdf4", fg: "#166534", category: "basic" },
    { name: "Morado", bg: "#faf5ff", fg: "#7c3aed", category: "basic" },
    { name: "Rojo", bg: "#fef2f2", fg: "#dc2626", category: "basic" },
    { name: "Naranja", bg: "#fff7ed", fg: "#ea580c", category: "basic" },
    { name: "Oscuro", bg: "#111827", fg: "#f9fafb", category: "basic" },
    { name: "Elegante", bg: "#f8fafc", fg: "#475569", category: "basic" },
    
    // Colores vibrantes
    { name: "Turquesa", bg: "#f0fdfa", fg: "#0f766e", category: "vibrant" },
    { name: "Rosa", bg: "#fdf2f8", fg: "#be185d", category: "vibrant" },
    { name: "Amarillo", bg: "#fefce8", fg: "#a16207", category: "vibrant" },
    { name: "Índigo", bg: "#eef2ff", fg: "#4338ca", category: "vibrant" },
    { name: "Cyan", bg: "#ecfeff", fg: "#0891b2", category: "vibrant" },
    { name: "Lime", bg: "#f7fee7", fg: "#65a30d", category: "vibrant" },
    { name: "Magenta", bg: "#fdf4ff", fg: "#c026d3", category: "vibrant" },
    { name: "Teal", bg: "#f0fdfa", fg: "#0d9488", category: "vibrant" },
    
    // Colores profesionales
    { name: "Corporativo", bg: "#f8fafc", fg: "#1e293b", category: "professional" },
    { name: "Ejecutivo", bg: "#fafafa", fg: "#374151", category: "professional" },
    { name: "Minimalista", bg: "#ffffff", fg: "#6b7280", category: "professional" },
    { name: "Tecnológico", bg: "#f1f5f9", fg: "#0f172a", category: "professional" },
    { name: "Financiero", bg: "#fefefe", fg: "#1f2937", category: "professional" },
    { name: "Médico", bg: "#f8fafc", fg: "#0369a1", category: "professional" },
    
    // Colores premium
    { name: "Oro", bg: "#fffbeb", fg: "#d97706", category: "premium" },
    { name: "Plata", bg: "#f8fafc", fg: "#64748b", category: "premium" },
    { name: "Bronce", bg: "#fef7ed", fg: "#c2410c", category: "premium" },
    { name: "Platino", bg: "#f1f5f9", fg: "#475569", category: "premium" },
    { name: "Diamante", bg: "#fafafa", fg: "#0f172a", category: "premium" },
    { name: "Esmeralda", bg: "#ecfdf5", fg: "#059669", category: "premium" },
    { name: "Rubí", bg: "#fef2f2", fg: "#dc2626", category: "premium" },
    { name: "Zafiro", bg: "#eff6ff", fg: "#2563eb", category: "premium" },
  ];

  const colorCategories = [
    { id: "basic", name: "Básicos", icon: "🎨" },
    { id: "vibrant", name: "Vibrantes", icon: "🌈" },
    { id: "professional", name: "Profesionales", icon: "💼" },
    { id: "premium", name: "Premium", icon: "💎" },
  ];

  const themeStyles = {
    moderno: {
      name: "Moderno",
      icon: "🔮",
      description: "Diseño limpio y futurista",
      colors: { bg: "#1a1a2e", fg: "#16213e" },
      gradient: "cosmic",
      pattern: "hexagon",
      frame: "modern",
      style: "rounded"
    },
    divertido: {
      name: "Divertido",
      icon: "🎉",
      description: "Colorido y alegre",
      colors: { bg: "#ff6b6b", fg: "#4ecdc4" },
      gradient: "rainbow",
      pattern: "heart",
      frame: "floral",
      style: "circle"
    },
    casual: {
      name: "Casual",
      icon: "☕",
      description: "Relajado y cómodo",
      colors: { bg: "#f7f1e3", fg: "#8b7355" },
      gradient: "none",
      pattern: "rounded",
      frame: "simple",
      style: "rounded"
    },
    minimalista: {
      name: "Minimalista",
      icon: "⚪",
      description: "Simple y elegante",
      colors: { bg: "#ffffff", fg: "#000000" },
      gradient: "none",
      pattern: "standard",
      frame: "none",
      style: "square"
    },
    corporativo: {
      name: "Corporativo",
      icon: "🏢",
      description: "Profesional y serio",
      colors: { bg: "#f8f9fa", fg: "#2c3e50" },
      gradient: "none",
      pattern: "standard",
      frame: "corporate",
      style: "square"
    },
    vintage: {
      name: "Vintage",
      icon: "🏛️",
      description: "Clásico y atemporal",
      colors: { bg: "#f4f1de", fg: "#3d405b" },
      gradient: "none",
      pattern: "diamond",
      frame: "vintage",
      style: "rounded"
    },
    geometrico: {
      name: "Geométrico",
      icon: "🔸",
      description: "Formas y patrones geométricos",
      colors: { bg: "#f1c40f", fg: "#2c3e50" },
      gradient: "none",
      pattern: "diamond",
      frame: "decorative",
      style: "square"
    },
    neon: {
      name: "Neón",
      icon: "⚡",
      description: "Colores brillantes y vibrantes",
      colors: { bg: "#0f0f23", fg: "#00ff88" },
      gradient: "neon",
      pattern: "star",
      frame: "modern",
      style: "rounded"
    },
    youtube: {
      name: "YouTube",
      icon: "▶️",
      description: "Estilo rojo vibrante",
      colors: { bg: "#ff0000", fg: "#ffffff" },
      gradient: "fire",
      pattern: "standard",
      frame: "simple",
      style: "rounded"
    },
    tech: {
      name: "Tech",
      icon: "💻",
      description: "Tecnológico y moderno",
      colors: { bg: "#0a0a0a", fg: "#00d4ff" },
      gradient: "blue",
      pattern: "hexagon",
      frame: "tech",
      style: "square"
    },
    natural: {
      name: "Natural",
      icon: "🌿",
      description: "Inspirado en la naturaleza",
      colors: { bg: "#e8f5e8", fg: "#2d5a3d" },
      gradient: "green",
      pattern: "leaf",
      frame: "floral",
      style: "rounded"
    }
  };

  const applyTheme = (themeKey: string) => {
    const theme = themeStyles[themeKey];
    if (theme) {
      const newSettings = {
        ...settings,
        backgroundColor: theme.colors.bg,
        foregroundColor: theme.colors.fg,
        gradient: theme.gradient,
        pattern: theme.pattern,
        frame: theme.frame,
        style: theme.style
      };
      onChange(newSettings);
      
      // Si hay una URL, regenerar automáticamente el QR con el nuevo tema
      if (settings.url && onGenerate) {
        setTimeout(() => {
          onGenerate();
        }, 100); // Pequeño delay para que los settings se actualicen
      }
    }
  };

  // Función para crear una vista previa visual simple del QR
  const createQRPreview = (theme: any) => {
    const patternClass = theme.pattern === "rounded" ? "rounded-sm" : 
                        theme.pattern === "heart" ? "rounded-full" : 
                        theme.pattern === "star" ? "transform rotate-45" : 
                        theme.pattern === "diamond" ? "transform rotate-45" : 
                        theme.pattern === "hexagon" ? "clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" : "";
    
    // Crear patrón más realista del QR
    const qrPattern = [
      1,1,1,0,1,1,1,
      1,0,0,0,0,0,1,
      1,0,1,1,1,0,1,
      0,0,0,1,0,0,0,
      1,1,1,0,1,1,1,
      1,0,0,0,0,0,1,
      1,1,1,1,1,1,1,
    ];

    return (
      <div 
        className="w-16 h-16 border-2 rounded-lg p-1 shadow-sm relative overflow-hidden"
        style={{ 
          backgroundColor: theme.colors.bg,
          borderColor: theme.colors.fg 
        }}
      >
        <div className="grid grid-cols-7 gap-0.5 h-full">
          {qrPattern.map((cell, i) => (
            <div
              key={i}
              className={`${patternClass} transition-all duration-200`}
              style={{
                backgroundColor: cell ? theme.colors.fg : theme.colors.bg,
                width: "100%",
                height: "100%",
                opacity: cell ? 1 : 0.3
              }}
            />
          ))}
        </div>
        
        {/* Indicador de gradiente */}
        {theme.gradient !== "none" && (
          <div 
            className="absolute inset-0 rounded-lg opacity-30"
            style={{
              background: theme.gradient === "rainbow" ? "linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)" :
                         theme.gradient === "fire" ? "linear-gradient(135deg, #ff4500, #ff6347, #ffa500)" :
                         theme.gradient === "ocean" ? "linear-gradient(135deg, #006994, #0080ff, #00bfff)" :
                         theme.gradient === "cosmic" ? "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" :
                         theme.gradient === "neon" ? "linear-gradient(135deg, #00ff88, #00d4ff, #ff00ff)" :
                         theme.gradient === "gold" ? "linear-gradient(135deg, #ffd700, #ffb347, #ff8c00)" :
                         `linear-gradient(135deg, ${theme.colors.bg}, ${theme.colors.fg})`
            }}
          />
        )}
      </div>
    );
  };

  // Función para verificar si un tema está activo
  const isThemeActive = (theme: any) => {
    return settings.backgroundColor === theme.colors.bg && 
           settings.foregroundColor === theme.colors.fg &&
           settings.gradient === theme.gradient &&
           settings.pattern === theme.pattern &&
           settings.frame === theme.frame &&
           settings.style === theme.style;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Personalización Avanzada
          </div>
          {onBackToHome && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToHome}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* URL Input Section */}
        <div className="mb-6 space-y-3 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
          <Label className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-purple-400">🔗</span>
            Ingresar Enlace
            <Badge variant="destructive" className="text-xs">Requerido</Badge>
          </Label>
          <div className="space-y-3">
            <Input
              type="url"
              placeholder="https://ejemplo.com"
              value={settings.url || ''}
              onChange={(e) => updateSetting('url', e.target.value)}
              className={`bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 ${
                !settings.url ? 'border-red-500/50' : ''
              }`}
            />
            <p className="text-sm text-gray-400">
              Ingresa la URL para generar tu código QR personalizado con todas las opciones PRO
            </p>
            {!settings.url && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span>⚠️</span>
                URL requerida para generar el código QR
              </p>
            )}
            
            {/* Generate Button */}
            <Button 
              onClick={onGenerate} 
              disabled={isGenerating || !settings.url} 
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar QR PRO
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Vista Previa PRO */}
        {qrCode && (
          <div className="mb-6 p-4 bg-gray-900/50 border border-purple-700 rounded-lg">
            <Label className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Vista Previa PRO
            </Label>
            <div className="text-center space-y-4">
              <div className="p-4 bg-gray-900 rounded-lg border-2 border-purple-800 neon-glow">
                <img 
                  src={qrCode} 
                  alt="Vista previa QR personalizado" 
                  className="mx-auto border border-gray-700 rounded-lg max-w-full h-auto shadow-2xl"
                />
              </div>
              
              {onDownload && (
                <Button 
                  onClick={onDownload}
                  className="w-full gradient-purple neon-glow"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PRO
                </Button>
              )}
            </div>
          </div>
        )}

        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="themes" className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Temas</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-1">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Colores</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-1">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Estilo</span>
            </TabsTrigger>
            <TabsTrigger value="frame" className="flex items-center gap-1">
              <Frame className="w-4 h-4" />
              <span className="hidden sm:inline">Marco</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-1">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Avanzado</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg font-semibold">Temas de Diseño</Label>
                <p className="text-sm text-muted-foreground">
                  Selecciona un tema para aplicar automáticamente colores, patrones y estilos coordinados
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(themeStyles).map(([key, theme]) => {
                  const isActive = isThemeActive(theme);
                  return (
                    <Card 
                      key={key} 
                      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${
                        isActive 
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg" 
                          : "hover:border-purple-300 dark:hover:border-purple-600"
                      }`}
                      onClick={() => applyTheme(key)}
                    >
                    <CardContent className="p-4 relative">
                      {isActive && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">{theme.icon}</div>
                        <div>
                          <h3 className="font-semibold text-base">{theme.name}</h3>
                          <p className="text-sm text-muted-foreground">{theme.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-3">
                        {createQRPreview(theme)}
                        <div className="text-xs space-y-1 flex-1">
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {theme.style}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {theme.pattern}
                            </Badge>
                          </div>
                          {theme.gradient !== "none" && (
                            <Badge variant="outline" className="text-xs">
                              {theme.gradient}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          applyTheme(key);
                        }}
                      >
                        Aplicar tema
                      </Button>
                    </CardContent>
                  </Card>
                );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Paleta de Colores Profesional</Label>
                <Accordion type="single" collapsible className="w-full">
                  {colorCategories.map((category) => (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="text-sm">
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {colorPresets.filter(p => p.category === category.id).length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                          {colorPresets
                            .filter(preset => preset.category === category.id)
                            .map((preset, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  applyRealTimeChange("backgroundColor", preset.bg);
                                  applyRealTimeChange("foregroundColor", preset.fg);
                                }}
                                className="h-12 p-2 hover:scale-105 transition-transform"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <div
                                    className="w-6 h-6 rounded border-2 shadow-sm"
                                    style={{ backgroundColor: preset.bg, borderColor: preset.fg }}
                                  />
                                  <span className="text-xs font-medium">{preset.name}</span>
                                </div>
                              </Button>
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Color de Fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => applyRealTimeChange("backgroundColor", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) => applyRealTimeChange("backgroundColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foregroundColor">Color del QR</Label>
                  <div className="flex gap-2">
                    <Input
                      id="foregroundColor"
                      type="color"
                      value={settings.foregroundColor}
                      onChange={(e) => applyRealTimeChange("foregroundColor", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.foregroundColor}
                      onChange={(e) => applyRealTimeChange("foregroundColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gradientes Premium</Label>
                <Select value={settings.gradient} onValueChange={(value) => applyRealTimeChange("gradient", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin gradiente</SelectItem>
                    <SelectItem value="blue">💙 Azul Oceánico</SelectItem>
                    <SelectItem value="purple">💜 Morado Galáctico</SelectItem>
                    <SelectItem value="green">💚 Verde Esmeralda</SelectItem>
                    <SelectItem value="sunset">🌅 Atardecer Dorado</SelectItem>
                    <SelectItem value="rainbow">🌈 Arcoíris</SelectItem>
                    <SelectItem value="fire">🔥 Fuego</SelectItem>
                    <SelectItem value="ocean">🌊 Océano Profundo</SelectItem>
                    <SelectItem value="cosmic">🌌 Cósmico</SelectItem>
                    <SelectItem value="neon">⚡ Neón</SelectItem>
                    <SelectItem value="gold">✨ Oro Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estilo del QR</Label>
                <Select value={settings.style} onValueChange={(value) => applyRealTimeChange("style", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Cuadrado</SelectItem>
                    <SelectItem value="rounded">Redondeado</SelectItem>
                    <SelectItem value="circle">Circular</SelectItem>
                    <SelectItem value="dots">Puntos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tamaño</Label>
                <Select value={settings.size} onValueChange={(value) => applyRealTimeChange("size", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeño (200px)</SelectItem>
                    <SelectItem value="medium">Mediano (300px)</SelectItem>
                    <SelectItem value="large">Grande (400px)</SelectItem>
                    <SelectItem value="xlarge">Extra Grande (500px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Patrones Avanzados</Label>
              <Select value={settings.pattern} onValueChange={(value) => applyRealTimeChange("pattern", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">◼️ Estándar</SelectItem>
                  <SelectItem value="dots">⚫ Puntos</SelectItem>
                  <SelectItem value="rounded">🔵 Redondeado</SelectItem>
                  <SelectItem value="heart">❤️ Corazón</SelectItem>
                  <SelectItem value="star">⭐ Estrella</SelectItem>
                  <SelectItem value="diamond">💎 Diamante</SelectItem>
                  <SelectItem value="hexagon">⬡ Hexágono</SelectItem>
                  <SelectItem value="triangle">🔺 Triángulo</SelectItem>
                  <SelectItem value="flower">🌸 Flor</SelectItem>
                  <SelectItem value="leaf">🍃 Hoja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="frame" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marco</Label>
                <Select value={settings.frame} onValueChange={(value) => updateSetting("frame", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin marco</SelectItem>
                    <SelectItem value="simple">📱 Simple</SelectItem>
                    <SelectItem value="decorative">🎨 Decorativo</SelectItem>
                    <SelectItem value="floral">🌸 Floral</SelectItem>
                    <SelectItem value="tech">💻 Tecnológico</SelectItem>
                    <SelectItem value="elegant">✨ Elegante</SelectItem>
                    <SelectItem value="vintage">🏛️ Vintage</SelectItem>
                    <SelectItem value="modern">🔮 Moderno</SelectItem>
                    <SelectItem value="corporate">🏢 Corporativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Borde</Label>
                <Select value={settings.border} onValueChange={(value) => updateSetting("border", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin borde</SelectItem>
                    <SelectItem value="thin">Delgado</SelectItem>
                    <SelectItem value="thick">Grueso</SelectItem>
                    <SelectItem value="double">Doble</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Logo Central</Label>
              <Select value={settings.logo} onValueChange={(value) => updateSetting("logo", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin logo</SelectItem>
                  <SelectItem value="replit">🟢 Replit</SelectItem>
                  <SelectItem value="custom">🎨 Personalizado</SelectItem>
                  <SelectItem value="star">⭐ Estrella</SelectItem>
                  <SelectItem value="heart">❤️ Corazón</SelectItem>
                  <SelectItem value="diamond">💎 Diamante</SelectItem>
                  <SelectItem value="crown">👑 Corona</SelectItem>
                  <SelectItem value="shield">🛡️ Escudo</SelectItem>
                  <SelectItem value="rocket">🚀 Cohete</SelectItem>
                  <SelectItem value="lightning">⚡ Rayo</SelectItem>
                  <SelectItem value="check">✅ Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Datos</Label>
                <Select value={settings.type} onValueChange={(value) => updateSetting("type", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="text">Texto</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Teléfono</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="wifi">WiFi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Corrección de Errores</Label>
                <Select value={settings.errorCorrection} onValueChange={(value) => updateSetting("errorCorrection", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Baja (L) - ~7%</SelectItem>
                    <SelectItem value="M">Media (M) - ~15%</SelectItem>
                    <SelectItem value="Q">Cuartil (Q) - ~25%</SelectItem>
                    <SelectItem value="H">Alta (H) - ~30%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="includeText"
                  checked={settings.includeText}
                  onCheckedChange={(checked) => updateSetting("includeText", checked)}
                />
                <Label htmlFor="includeText" className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Incluir texto debajo del QR
                </Label>
              </div>

              {settings.includeText && (
                <div className="space-y-2">
                  <Label htmlFor="textContent">Texto personalizado</Label>
                  <Input
                    id="textContent"
                    value={settings.textContent || ""}
                    onChange={(e) => updateSetting("textContent", e.target.value)}
                    placeholder="Texto que aparecerá debajo del QR"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Live Preview */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Vista Previa de Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border-2 shadow-sm"
                  style={{
                    backgroundColor: settings.backgroundColor,
                    borderColor: settings.foregroundColor,
                  }}
                />
                <span className="text-sm font-medium">Colores seleccionados</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {settings.style === "square" ? "◼️" : 
                   settings.style === "rounded" ? "🔵" : 
                   settings.style === "circle" ? "⭕" : "⚫"} {settings.style}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  📏 {settings.size}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {settings.pattern === "standard" ? "◼️" : 
                   settings.pattern === "dots" ? "⚫" : 
                   settings.pattern === "heart" ? "❤️" : "🔵"} {settings.pattern}
                </Badge>
                {settings.gradient !== "none" && (
                  <Badge variant="outline" className="text-xs">
                    🌈 {settings.gradient}
                  </Badge>
                )}
                {settings.logo !== "none" && (
                  <Badge variant="outline" className="text-xs">
                    🎨 Logo: {settings.logo}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center mt-6">
          <Button
            variant="outline"
            onClick={() => {
              onChange({
                url: settings.url,
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
              });
            }}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Restablecer Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}