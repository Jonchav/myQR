import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Palette, Settings, Layers, Frame, Sparkles, Type, Shield, Loader2, Home, ArrowLeft, Download, X, Maximize2 } from "lucide-react";

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
  const { toast } = useToast();

  
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
      const visualChanges = ['backgroundColor', 'foregroundColor', 'style', 'pattern', 'gradient', 'frame', 'size', 'border', 'logo', 'errorCorrection', 'includeText', 'textContent', 'textPosition', 'textAlign', 'textSize', 'textColor', 'textOpacity', 'textFont', 'textShadow', 'textBold', 'textItalic', 'cardTemplate', 'cardStyle'];
      if (visualChanges.includes(key)) {
        // Usar debounce para evitar múltiples llamadas
        clearTimeout(window.qrRegenerateTimeout);
        
        // Para textContent, usar un delay más corto para mayor responsividad
        const delay = key === 'textContent' ? 300 : 150;
        
        window.qrRegenerateTimeout = setTimeout(() => {
          onGenerate();
        }, delay);
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
            <div className="space-y-2">
              <p className="text-sm text-gray-400">
                Ingresa la URL para generar tu código QR personalizado con todas las opciones PRO
              </p>
              <p className="text-xs text-purple-300 bg-purple-900/20 px-2 py-1 rounded">
                💡 Los cambios de personalización se aplicarán automáticamente después de generar el QR inicial
              </p>
            </div>
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
              ) : qrCode ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Aplicar Cambios
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
          <div className="mb-6 p-3 bg-gray-900/50 border border-purple-700 rounded-lg">
            <Label className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Vista Previa PRO
            </Label>
            <div className="text-center space-y-3">
              <div className="p-2 bg-gray-900 rounded-lg border-2 border-purple-800 neon-glow">
                <img 
                  src={qrCode} 
                  alt="Vista previa QR personalizado" 
                  className="mx-auto border border-gray-700 rounded-lg max-w-[280px] h-auto shadow-lg"
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

        {/* Unified Customization Interface */}
        <div className="space-y-6">
          
          {/* Templates Section */}
          <Card className="border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Frame className="w-5 h-5 text-purple-500" />
                Plantillas Rápidas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona una plantilla optimizada para redes sociales
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(themeStyles).map(([key, theme]) => {
                  const isActive = isThemeActive(theme);
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                        isActive 
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg" 
                          : "border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600"
                      }`}
                      onClick={() => applyTheme(key)}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{theme.icon}</div>
                        <div className="text-xs font-medium">{theme.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Size and Social Media Dimensions */}
          <Card className="border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-purple-500" />
                Tamaño y Dimensiones
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configura el tamaño y margen según la red social
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tamaño del QR</Label>
                  <Select value={settings.size} onValueChange={(value) => applyRealTimeChange("size", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">📱 Pequeño (800px)</SelectItem>
                      <SelectItem value="medium">💻 Mediano (1200px)</SelectItem>
                      <SelectItem value="large">🖥️ Grande (1600px)</SelectItem>
                      <SelectItem value="xlarge">📺 Extra Grande (2000px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Formato Red Social</Label>
                  <Select value={settings.cardTemplate} onValueChange={(value) => applyRealTimeChange("cardTemplate", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">🔳 Sin formato especial</SelectItem>
                      <SelectItem value="instagram_post">📸 Instagram Post (1080x1080)</SelectItem>
                      <SelectItem value="instagram_story">📱 Instagram Story (1080x1920)</SelectItem>
                      <SelectItem value="facebook_post">👥 Facebook Post (1200x630)</SelectItem>
                      <SelectItem value="twitter_post">🐦 Twitter Post (1200x675)</SelectItem>
                      <SelectItem value="linkedin_post">💼 LinkedIn Post (1200x627)</SelectItem>
                      <SelectItem value="youtube_thumbnail">🎥 YouTube Thumbnail (1280x720)</SelectItem>
                      <SelectItem value="tiktok_video">🎵 TikTok Video (1080x1920)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Margin Control */}
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Margen del QR</span>
                  <span className="text-sm text-muted-foreground">{settings.margin || 150}px</span>
                </Label>
                <div className="px-3">
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={settings.margin || 150}
                    onChange={(e) => applyRealTimeChange("margin", parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-purple"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>50px</span>
                    <span>300px</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors and Patterns */}
          <Card className="border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                Colores y Patrones
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Personaliza los colores y patrones del QR
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color de Fondo</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => applyRealTimeChange("backgroundColor", e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.backgroundColor}
                      onChange={(e) => applyRealTimeChange("backgroundColor", e.target.value)}
                      placeholder="#ffffff"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Color del QR</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.foregroundColor}
                      onChange={(e) => applyRealTimeChange("foregroundColor", e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={settings.foregroundColor}
                      onChange={(e) => applyRealTimeChange("foregroundColor", e.target.value)}
                      placeholder="#000000"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patrón Avanzado</Label>
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
                      <SelectItem value="flower">🌸 Flor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Estilo del QR</Label>
                  <Select value={settings.style} onValueChange={(value) => applyRealTimeChange("style", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="square">◼️ Cuadrado Clásico</SelectItem>
                      <SelectItem value="rounded">🔵 Redondeado Suave</SelectItem>
                      <SelectItem value="circle">⭕ Circular</SelectItem>
                      <SelectItem value="dots">⚫ Puntos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text and Creative Cards */}
          <Card className="border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="w-5 h-5 text-purple-500" />
                Texto y Tarjetas Creativas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Añade texto personalizado y selecciona estilo de tarjeta
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Switch
                    checked={settings.includeText}
                    onCheckedChange={(checked) => applyRealTimeChange("includeText", checked)}
                  />
                  <span>Incluir texto en la tarjeta</span>
                </Label>
              </div>
              
              {settings.includeText && (
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="space-y-2">
                    <Label>Texto personalizado</Label>
                    <Input
                      value={settings.textContent || ""}
                      onChange={(e) => applyRealTimeChange("textContent", e.target.value)}
                      placeholder="Ej: Escanea para más información"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      {(settings.textContent || "").length}/50 caracteres
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Posición del texto</Label>
                      <Select value={settings.textPosition} onValueChange={(value) => applyRealTimeChange("textPosition", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">🔝 Arriba</SelectItem>
                          <SelectItem value="center">🎯 Centro</SelectItem>
                          <SelectItem value="bottom">⬇️ Abajo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Alineación</Label>
                      <Select value={settings.textAlign} onValueChange={(value) => applyRealTimeChange("textAlign", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">⬅️ Izquierda</SelectItem>
                          <SelectItem value="center">🎯 Centro</SelectItem>
                          <SelectItem value="right">➡️ Derecha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fuente</Label>
                      <Select value={settings.textFont} onValueChange={(value) => applyRealTimeChange("textFont", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                          <SelectItem value="Impact">Impact</SelectItem>
                          <SelectItem value="Courier New">Courier New</SelectItem>
                          <SelectItem value="Trebuchet MS">Trebuchet MS</SelectItem>
                          <SelectItem value="Palatino">Palatino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Color del texto</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.textColor}
                          onChange={(e) => applyRealTimeChange("textColor", e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={settings.textColor}
                          onChange={(e) => applyRealTimeChange("textColor", e.target.value)}
                          placeholder="#000000"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span>Tamaño de fuente</span>
                        <span className="text-sm text-muted-foreground">{settings.textSize}px</span>
                      </Label>
                      <div className="px-3">
                        <input
                          type="range"
                          min="12"
                          max="48"
                          step="1"
                          value={settings.textSize}
                          onChange={(e) => applyRealTimeChange("textSize", parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-purple"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>12px</span>
                          <span>48px</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span>Opacidad</span>
                        <span className="text-sm text-muted-foreground">{settings.textOpacity}%</span>
                      </Label>
                      <div className="px-3">
                        <input
                          type="range"
                          min="25"
                          max="100"
                          step="5"
                          value={settings.textOpacity}
                          onChange={(e) => applyRealTimeChange("textOpacity", parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-purple"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>25%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Label className="flex items-center gap-2">
                      <Switch
                        checked={settings.textBold}
                        onCheckedChange={(checked) => applyRealTimeChange("textBold", checked)}
                      />
                      <span>Negrita</span>
                    </Label>
                    
                    <Label className="flex items-center gap-2">
                      <Switch
                        checked={settings.textItalic}
                        onCheckedChange={(checked) => applyRealTimeChange("textItalic", checked)}
                      />
                      <span>Cursiva</span>
                    </Label>
                    
                    <Label className="flex items-center gap-2">
                      <Switch
                        checked={settings.textShadow}
                        onCheckedChange={(checked) => applyRealTimeChange("textShadow", checked)}
                      />
                      <span>Sombra</span>
                    </Label>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Estilo de tarjeta</Label>
                <Select value={settings.cardStyle} onValueChange={(value) => applyRealTimeChange("cardStyle", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">🎨 Minimalista</SelectItem>
                    <SelectItem value="gradient">🌈 Degradado</SelectItem>
                    <SelectItem value="neon">💫 Neón</SelectItem>
                    <SelectItem value="waves">🌊 Ondas</SelectItem>
                    <SelectItem value="geometric">🔷 Geométrico</SelectItem>
                    <SelectItem value="corporate">💼 Corporativo</SelectItem>
                    <SelectItem value="retro">🕹️ Retro</SelectItem>
                    <SelectItem value="nature">🌿 Natural</SelectItem>
                    <SelectItem value="tech">⚡ Tecnológico</SelectItem>
                    <SelectItem value="luxury">✨ Lujo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
                  <Select value={settings.cardStyle || "modern_gradient"} onValueChange={(value) => applyRealTimeChange("cardStyle", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern_gradient">🌈 Gradiente Moderno</SelectItem>
                      <SelectItem value="neon_waves">⚡ Ondas Neón</SelectItem>
                      <SelectItem value="geometric">🔷 Geométrico</SelectItem>
                      <SelectItem value="organic_flow">🌊 Flujo Orgánico</SelectItem>
                      <SelectItem value="minimalist">⚪ Minimalista</SelectItem>
                      <SelectItem value="abstract_art">🎨 Arte Abstracto</SelectItem>
                      <SelectItem value="corporate">🏢 Corporativo</SelectItem>
                      <SelectItem value="creative_burst">✨ Explosión Creativa</SelectItem>
                      <SelectItem value="elegant_lines">📐 Líneas Elegantes</SelectItem>
                      <SelectItem value="vibrant_blocks">🎯 Bloques Vibrantes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Configuración de texto para tarjetas */}
              {settings.cardTemplate && settings.cardTemplate !== "none" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">Texto de la Tarjeta</h4>
                    <Switch
                      id="includeText"
                      checked={settings.includeText}
                      onCheckedChange={(checked) => applyRealTimeChange("includeText", checked)}
                    />
                  </div>

                  {settings.includeText && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="textContent">Texto personalizado</Label>
                        <Input
                          id="textContent"
                          value={settings.textContent || ""}
                          onChange={(e) => applyRealTimeChange("textContent", e.target.value)}
                          placeholder="Ej: SCAN ME, Escaneáme, ¡Prueba esto!"
                          maxLength={50}
                        />
                      </div>

                      {/* Estilos de texto predefinidos */}
                      <div className="space-y-2">
                        <Label>Estilos predefinidos</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: "SCAN ME", style: "Clásico", settings: { textContent: "SCAN ME", textFont: "Arial", textBold: true, textSize: 40, textColor: "#ffffff", textShadow: true } },
                            { name: "Escaneáme", style: "Español", settings: { textContent: "Escaneáme", textFont: "Georgia", textBold: true, textSize: 36, textColor: "#ffffff", textShadow: true } },
                            { name: "¡Prueba esto!", style: "Divertido", settings: { textContent: "¡Prueba esto!", textFont: "Impact", textBold: true, textSize: 32, textColor: "#ffff00", textShadow: true } },
                            { name: "Tap to scan", style: "Moderno", settings: { textContent: "Tap to scan", textFont: "Helvetica", textBold: false, textSize: 28, textColor: "#ffffff", textShadow: true } },
                          ].map((preset) => (
                            <Button
                              key={preset.name}
                              variant="outline"
                              size="sm"
                              className="h-auto p-2 text-xs"
                              onClick={() => {
                                Object.entries(preset.settings).forEach(([key, value]) => {
                                  applyRealTimeChange(key, value);
                                });
                              }}
                            >
                              <div className="text-center">
                                <div className="font-medium">{preset.name}</div>
                                <div className="text-xs text-gray-400">{preset.style}</div>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Posición del texto</Label>
                          <Select value={settings.textPosition || "bottom"} onValueChange={(value) => applyRealTimeChange("textPosition", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">⬆️ Arriba del QR</SelectItem>
                              <SelectItem value="bottom">⬇️ Abajo del QR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Estilo de fuente</Label>
                          <Select value={settings.textFont || "Arial"} onValueChange={(value) => applyRealTimeChange("textFont", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial - Moderna</SelectItem>
                              <SelectItem value="Helvetica">Helvetica - Profesional</SelectItem>
                              <SelectItem value="Georgia">Georgia - Elegante</SelectItem>
                              <SelectItem value="Impact">Impact - Impactante</SelectItem>
                              <SelectItem value="Verdana">Verdana - Legible</SelectItem>
                              <SelectItem value="Trebuchet MS">Trebuchet - Creativa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tamaño del texto</Label>
                          <Select value={settings.textSize?.toString() || "40"} onValueChange={(value) => applyRealTimeChange("textSize", parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="24">24px - Pequeño</SelectItem>
                              <SelectItem value="32">32px - Mediano</SelectItem>
                              <SelectItem value="40">40px - Grande</SelectItem>
                              <SelectItem value="48">48px - Muy grande</SelectItem>
                              <SelectItem value="56">56px - Extra grande</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="textColor">Color del texto</Label>
                          <div className="flex gap-2">
                            <Input
                              id="textColor"
                              type="color"
                              value={settings.textColor || "#ffffff"}
                              onChange={(e) => applyRealTimeChange("textColor", e.target.value)}
                              className="w-12 h-10 p-1"
                            />
                            <Input
                              value={settings.textColor || "#ffffff"}
                              onChange={(e) => applyRealTimeChange("textColor", e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="textBold"
                            checked={settings.textBold || false}
                            onCheckedChange={(checked) => applyRealTimeChange("textBold", checked)}
                          />
                          <Label htmlFor="textBold" className="text-sm">
                            Texto en negrita
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="textShadow"
                            checked={settings.textShadow || false}
                            onCheckedChange={(checked) => applyRealTimeChange("textShadow", checked)}
                          />
                          <Label htmlFor="textShadow" className="text-sm">
                            Sombra de texto
                          </Label>
                        </div>
                      </div>

                      {/* Vista previa en tiempo real estilo Canva */}
                      <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-600 rounded-lg">
                        <p className="text-xs text-gray-300 mb-3 font-medium">Vista previa en tiempo real</p>
                        <div className="relative min-h-[80px] bg-gray-700/50 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
                          {/* Fondo simulado de tarjeta */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 opacity-30"></div>
                          
                          {/* Texto como aparecerá en el QR */}
                          <div className="relative z-10 text-center px-4">
                            <span 
                              style={{
                                color: settings.textColor || "#ffffff",
                                fontSize: `${Math.max((settings.textSize || 40) * 0.4, 16)}px`,
                                fontFamily: settings.textFont || "Arial",
                                fontWeight: settings.textBold ? "bold" : "600",
                                textShadow: settings.textShadow ? "3px 3px 6px rgba(0,0,0,0.8)" : "none",
                                display: "inline-block",
                                padding: "8px 16px",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                borderRadius: "8px",
                                letterSpacing: "0.5px"
                              }}
                            >
                              {settings.textContent || "SCAN ME"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Vista previa de dimensiones */}
              {settings.cardTemplate && settings.cardTemplate !== "none" && (
                <div className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">📏 Información de Formato</h4>
                  <div className="text-xs text-gray-400 space-y-1">
                    {settings.cardTemplate === "instagram_post" && <p>• Formato cuadrado perfecto para feeds de Instagram</p>}
                    {settings.cardTemplate === "instagram_story" && <p>• Formato vertical para Stories e Instagram/Facebook</p>}
                    {settings.cardTemplate === "facebook_post" && <p>• Formato horizontal optimizado para Facebook</p>}
                    {settings.cardTemplate === "facebook_story" && <p>• Formato vertical para Stories de Facebook</p>}
                    {settings.cardTemplate === "twitter_post" && <p>• Formato horizontal para Twitter/X</p>}
                    {settings.cardTemplate === "linkedin_post" && <p>• Formato profesional para LinkedIn</p>}
                    {settings.cardTemplate === "youtube_thumbnail" && <p>• Formato horizontal para miniaturas de YouTube</p>}
                    {settings.cardTemplate === "tiktok_video" && <p>• Formato vertical para TikTok</p>}
                    <p>• El QR se posiciona automáticamente en el centro</p>
                    <p>• Texto personalizable con alto contraste</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estilo del QR</Label>
                <Select value={settings.style} onValueChange={(value) => applyRealTimeChange("style", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">◼️ Cuadrado Clásico</SelectItem>
                    <SelectItem value="rounded">🔵 Redondeado Suave</SelectItem>
                    <SelectItem value="circle">⭕ Circular Moderno</SelectItem>
                    <SelectItem value="dots">⚫ Puntos Elegantes</SelectItem>
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
                    <SelectItem value="small">📱 Pequeño (200px)</SelectItem>
                    <SelectItem value="medium">💻 Mediano (300px)</SelectItem>
                    <SelectItem value="large">🖥️ Grande (400px)</SelectItem>
                    <SelectItem value="xlarge">📺 Extra Grande (500px)</SelectItem>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marco Decorativo</Label>
                <Select value={settings.frame} onValueChange={(value) => applyRealTimeChange("frame", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin marco</SelectItem>
                    <SelectItem value="simple">📱 Simple</SelectItem>
                    <SelectItem value="elegant">✨ Elegante</SelectItem>
                    <SelectItem value="modern">🔮 Moderno</SelectItem>
                    <SelectItem value="tech">💻 Tecnológico</SelectItem>
                    <SelectItem value="corporate">🏢 Corporativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Borde</Label>
                <Select value={settings.border} onValueChange={(value) => applyRealTimeChange("border", value)}>
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