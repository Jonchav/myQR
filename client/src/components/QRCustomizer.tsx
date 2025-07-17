import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Palette, Frame, Sparkles, Loader2, Home, ArrowLeft, X, Maximize2, Upload } from "lucide-react";
import { StyleCatalog } from "./StyleCatalog";
import { CardStyleCatalog } from "./CardStyleCatalog";

interface QRCustomizerProps {
  settings: any;
  onChange: (settings: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onBackToHome?: () => void;
  qrCode?: string | null;
}

export function QRCustomizer({ settings, onChange, onGenerate, isGenerating, onBackToHome, qrCode }: QRCustomizerProps) {
  const { toast } = useToast();
  
  // Función para manejar la carga de imágenes
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Verificar tamaño del archivo (15MB máximo)
    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 15MB para procesamiento óptimo",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive"
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      applyRealTimeChange("customBackgroundImage", result);
      toast({
        title: "Imagen cargada",
        description: "Haz clic en 'Aplicar cambios' para usar la imagen",
      });
    };
    reader.readAsDataURL(file);
  };
  
  // Función para eliminar imagen personalizada
  const removeCustomImage = () => {
    applyRealTimeChange("customBackgroundImage", null);
    toast({
      title: "Imagen eliminada",
      description: "Se ha eliminado la imagen de fondo personalizada",
    });
  };

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onChange(newSettings);
  };

  // Función para aplicar cambios en tiempo real
  const applyRealTimeChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    onChange(newSettings);
    
    // No regenerar automáticamente - solo actualizar configuración
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Personalización PRO
          </CardTitle>
          <div className="flex items-center gap-2">
            {onBackToHome && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToHome}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            )}

          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Preview */}
        <div className="w-full max-w-[280px] mx-auto">
          {qrCode ? (
            <div className="relative">
              <img
                src={qrCode}
                alt="QR Code"
                className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              />
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Vista previa del QR</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
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
                      value={settings.backgroundColor === "transparent" ? "#ffffff" : settings.backgroundColor}
                      onChange={(e) => applyRealTimeChange("backgroundColor", e.target.value)}
                      className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      disabled={settings.backgroundColor === "transparent"}
                    />
                    <Input
                      type="text"
                      value={settings.backgroundColor}
                      onChange={(e) => applyRealTimeChange("backgroundColor", e.target.value)}
                      placeholder="#ffffff"
                      className="font-mono text-sm"
                      disabled={settings.backgroundColor === "transparent"}
                    />
                    <Button
                      variant={settings.backgroundColor === "transparent" ? "default" : "outline"}
                      size="sm"
                      onClick={() => applyRealTimeChange("backgroundColor", settings.backgroundColor === "transparent" ? "#ffffff" : "transparent")}
                      className="px-3 py-2 h-10 whitespace-nowrap"
                      title={settings.backgroundColor === "transparent" ? "Usar color sólido" : "Usar transparente"}
                    >
                      {settings.backgroundColor === "transparent" ? (
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-transparent border border-gray-400 rounded-sm bg-gradient-to-br from-white to-gray-200" style={{
                            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                          }} />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 bg-transparent border border-gray-400 rounded-sm" style={{
                            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                          }} />
                        </div>
                      )}
                    </Button>
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
              
              <div className="col-span-full space-y-3">
                <StyleCatalog 
                  selectedStyle={settings.creativeStyle || "classic"}
                  onStyleSelect={(style) => applyRealTimeChange("creativeStyle", style)}
                  isGenerating={isGenerating}
                />
              </div>
              
              <div className="col-span-full space-y-3">
                <CardStyleCatalog 
                  selectedStyle={settings.cardStyle || "minimalist"}
                  onStyleSelect={(style) => {
                    // Si cambiamos de custom_image a otra opción, resetear la imagen
                    if (settings.cardStyle === "custom_image" && style !== "custom_image") {
                      applyRealTimeChange("customBackgroundImage", null);
                    }
                    applyRealTimeChange("cardStyle", style);
                  }}
                  isGenerating={isGenerating}
                />
                
                {/* Imagen de fondo personalizada - solo se muestra cuando se selecciona "custom_image" */}
                {settings.cardStyle === "custom_image" && (
                  <div className="space-y-2 mt-4">
                    <Label>Imagen de fondo personalizada</Label>
                    <p className="text-xs text-muted-foreground">
                      Sube una imagen como fondo de la tarjeta (máximo 15MB)
                    </p>
                    
                    {settings.customBackgroundImage ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <img 
                            src={settings.customBackgroundImage} 
                            alt="Imagen de fondo personalizada" 
                            className="w-full h-24 object-cover rounded border border-purple-200 dark:border-purple-700"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={removeCustomImage}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Imagen cargada correctamente
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="cursor-pointer">
                          <div className="border-2 border-dashed border-purple-300 dark:border-purple-600 rounded-lg p-4 text-center hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                            <Upload className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                            <p className="text-sm text-purple-600 dark:text-purple-400">
                              Haz clic para subir imagen
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, GIF hasta 15MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patrón Decorativo</Label>
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
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label className="text-sm">Nota sobre Estilos</Label>
                  <p className="text-xs text-muted-foreground">
                    Los estilos creativos añaden colores múltiples y esquinas distintivas manteniendo la funcionalidad del QR
                  </p>
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


        </div>
        
        {/* Botón universal para aplicar cambios */}
        <div className="mt-6 pt-4 border-t border-purple-200 dark:border-purple-700">
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando QR personalizado...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Aplicar cambios
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Haz clic para aplicar todas las personalizaciones seleccionadas
          </p>
        </div>
      </CardContent>
    </Card>
  );
}