import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Palette, Frame, Sparkles, Type, Loader2, Home, ArrowLeft, Download, X, Maximize2 } from "lucide-react";

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
      const visualChanges = ['backgroundColor', 'foregroundColor', 'style', 'pattern', 'gradient', 'frame', 'size', 'border', 'logo', 'errorCorrection', 'includeText', 'textContent', 'textPosition', 'textAlign', 'textSize', 'textColor', 'textOpacity', 'textFont', 'textShadow', 'textBold', 'textItalic', 'cardTemplate', 'cardStyle', 'margin'];
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

  // Temas predefinidos
  const themeStyles = {
    modern: {
      name: "Moderno",
      icon: "🎨",
      description: "Diseño limpio y contemporáneo",
      backgroundColor: "#ffffff",
      foregroundColor: "#000000",
      style: "rounded",
      pattern: "standard",
      gradient: "none"
    },
    vibrant: {
      name: "Vibrante",
      icon: "🌈",
      description: "Colores llamativos y energéticos",
      backgroundColor: "#ff6b6b",
      foregroundColor: "#ffffff",
      style: "rounded",
      pattern: "dots",
      gradient: "purple"
    },
    elegant: {
      name: "Elegante",
      icon: "✨",
      description: "Estilo sofisticado y profesional",
      backgroundColor: "#2c3e50",
      foregroundColor: "#ecf0f1",
      style: "square",
      pattern: "standard",
      gradient: "gold"
    },
    nature: {
      name: "Natural",
      icon: "🌿",
      description: "Inspirado en la naturaleza",
      backgroundColor: "#27ae60",
      foregroundColor: "#ffffff",
      style: "rounded",
      pattern: "flower",
      gradient: "green"
    },
    tech: {
      name: "Tecnológico",
      icon: "⚡",
      description: "Estilo futurista y digital",
      backgroundColor: "#1e3a8a",
      foregroundColor: "#60a5fa",
      style: "square",
      pattern: "hexagon",
      gradient: "blue"
    },
    minimal: {
      name: "Minimalista",
      icon: "⚪",
      description: "Simplicidad y claridad",
      backgroundColor: "#f8f9fa",
      foregroundColor: "#212529",
      style: "square",
      pattern: "standard",
      gradient: "none"
    }
  };

  const isThemeActive = (theme: any) => {
    return settings.backgroundColor === theme.backgroundColor &&
           settings.foregroundColor === theme.foregroundColor &&
           settings.style === theme.style &&
           settings.pattern === theme.pattern &&
           settings.gradient === theme.gradient;
  };

  const applyTheme = (themeKey: string) => {
    const theme = themeStyles[themeKey];
    if (theme) {
      Object.entries(theme).forEach(([key, value]) => {
        if (key !== 'name' && key !== 'icon' && key !== 'description') {
          applyRealTimeChange(key, value);
        }
      });
      
      toast({
        title: "Tema aplicado",
        description: `Se ha aplicado el tema ${theme.name}`,
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-purple-200 dark:border-purple-700">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <CardTitle className="text-xl">Personalización PRO</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onBackToHome}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Vista previa del QR */}
        {qrCode && (
          <div className="mb-6 p-4 bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
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