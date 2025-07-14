import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Palette, Settings, Layers, Frame, Sparkles, Type, Shield } from "lucide-react";

interface QRCustomizerProps {
  settings: any;
  onChange: (settings: any) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function QRCustomizer({ settings, onChange, onGenerate, isGenerating }: QRCustomizerProps) {
  const updateSetting = (key: string, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const colorPresets = [
    { name: "Clásico", bg: "#ffffff", fg: "#000000" },
    { name: "Azul", bg: "#f0f8ff", fg: "#1e40af" },
    { name: "Verde", bg: "#f0fdf4", fg: "#166534" },
    { name: "Morado", bg: "#faf5ff", fg: "#7c3aed" },
    { name: "Rojo", bg: "#fef2f2", fg: "#dc2626" },
    { name: "Naranja", bg: "#fff7ed", fg: "#ea580c" },
    { name: "Oscuro", bg: "#111827", fg: "#f9fafb" },
    { name: "Elegante", bg: "#f8fafc", fg: "#475569" },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Personalización Avanzada
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
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
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Avanzado</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Presets de Color</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {colorPresets.map((preset, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSetting("backgroundColor", preset.bg);
                        updateSetting("foregroundColor", preset.fg);
                      }}
                      className="h-10 p-2"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: preset.bg, borderColor: preset.fg }}
                        />
                        <span className="text-xs">{preset.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Color de Fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting("backgroundColor", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.backgroundColor}
                      onChange={(e) => updateSetting("backgroundColor", e.target.value)}
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
                      onChange={(e) => updateSetting("foregroundColor", e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={settings.foregroundColor}
                      onChange={(e) => updateSetting("foregroundColor", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gradiente</Label>
                <Select value={settings.gradient} onValueChange={(value) => updateSetting("gradient", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin gradiente</SelectItem>
                    <SelectItem value="blue">Azul</SelectItem>
                    <SelectItem value="purple">Morado</SelectItem>
                    <SelectItem value="green">Verde</SelectItem>
                    <SelectItem value="sunset">Atardecer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estilo del QR</Label>
                <Select value={settings.style} onValueChange={(value) => updateSetting("style", value)}>
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
                <Select value={settings.size} onValueChange={(value) => updateSetting("size", value)}>
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
              <Label>Patrón</Label>
              <Select value={settings.pattern} onValueChange={(value) => updateSetting("pattern", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Estándar</SelectItem>
                  <SelectItem value="dots">Puntos</SelectItem>
                  <SelectItem value="rounded">Redondeado</SelectItem>
                  <SelectItem value="heart">Corazón</SelectItem>
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
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="decorative">Decorativo</SelectItem>
                    <SelectItem value="floral">Floral</SelectItem>
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
              <Label>Logo</Label>
              <Select value={settings.logo} onValueChange={(value) => updateSetting("logo", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin logo</SelectItem>
                  <SelectItem value="replit">Replit</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
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

        <div className="flex gap-2 mt-6">
          <Button onClick={onGenerate} disabled={isGenerating} className="flex-1">
            {isGenerating ? "Generando..." : "Generar QR"}
          </Button>
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
          >
            Restablecer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}