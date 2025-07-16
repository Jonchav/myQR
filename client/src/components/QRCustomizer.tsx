import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Palette, Frame, Sparkles, Loader2, Home, ArrowLeft, Download, X, Maximize2 } from "lucide-react";

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
        
        // Para cambios de color y patrones, usar un delay más corto para mayor responsividad
        const delay = ['backgroundColor', 'foregroundColor', 'pattern', 'style'].includes(key) ? 50 : 
                     key === 'textContent' ? 200 : 100;
        window.qrRegenerateTimeout = setTimeout(() => {
          onGenerate();
        }, delay);
      }
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
          
          {/* Colors and Patterns - MOVED TO FIRST POSITION */}
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
                      <SelectItem value="dots">⚫ Puntos (Mejora de brillo)</SelectItem>
                      <SelectItem value="rounded">🔵 Redondeado (Mejora de saturación)</SelectItem>
                      <SelectItem value="heart">❤️ Corazón (Tono cálido)</SelectItem>
                      <SelectItem value="star">⭐ Estrella (Tono dorado)</SelectItem>
                      <SelectItem value="diamond">💎 Diamante (Tono frío)</SelectItem>
                      <SelectItem value="hexagon">⬡ Hexágono (Tono púrpura)</SelectItem>
                      <SelectItem value="flower">🌸 Flor (Tono suave)</SelectItem>
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
                      <SelectItem value="dots">⚫ Puntos Suaves</SelectItem>
                      <SelectItem value="rounded">🔵 Redondeado Suave</SelectItem>
                      <SelectItem value="circle">⭕ Circular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              

            </CardContent>
          </Card>

          {/* Card Style Selection */}
          <Card className="border-purple-200 dark:border-purple-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Frame className="w-5 h-5 text-purple-500" />
                Estilo de Tarjeta
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona el estilo visual para tu QR
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Estilo de tarjeta</Label>
                <Select value={settings.cardStyle} onValueChange={(value) => applyRealTimeChange("cardStyle", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimalist">🎨 Minimalista</SelectItem>
                    <SelectItem value="modern_gradient">🌈 Degradado</SelectItem>
                    <SelectItem value="neon_waves">💫 Neón</SelectItem>
                    <SelectItem value="organic_flow">🌊 Ondas</SelectItem>
                    <SelectItem value="geometric">🔷 Geométrico</SelectItem>
                    <SelectItem value="corporate">💼 Corporativo</SelectItem>
                    <SelectItem value="creative_burst">🕹️ Retro</SelectItem>
                    <SelectItem value="abstract_art">🌿 Natural</SelectItem>
                    <SelectItem value="elegant_lines">⚡ Tecnológico</SelectItem>
                    <SelectItem value="vibrant_blocks">✨ Lujo</SelectItem>
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