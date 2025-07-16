import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface StyleCatalogProps {
  onStyleSelect: (style: string) => void;
  selectedStyle: string;
  isGenerating?: boolean;
}

export function StyleCatalog({ onStyleSelect, selectedStyle, isGenerating }: StyleCatalogProps) {
  const [previewImages, setPreviewImages] = useState<{ [key: string]: string }>({});
  const [loadingPreviews, setLoadingPreviews] = useState<{ [key: string]: boolean }>({});
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);

  const creativeStyles = [
    {
      id: "classic",
      name: "Clásico",
      description: "QR tradicional en blanco y negro",
      previewColors: ["#000000", "#ffffff"]
    },
    {
      id: "multicolor_blocks",
      name: "Bloques Multicolor",
      description: "Bloques de colores vibrantes como un mosaico",
      previewColors: ["#FF4757", "#5352ED", "#2ED573", "#FFA726"]
    },
    {
      id: "rainbow_gradient",
      name: "Gradiente Arcoíris",
      description: "Transición suave de colores del arcoíris",
      previewColors: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF"]
    },
    {
      id: "neon_cyber",
      name: "Neón Cibernético",
      description: "Colores neón brillantes estilo cyberpunk",
      previewColors: ["#00FFFF", "#FF00FF", "#00FF00", "#FFFF00"]
    },
    {
      id: "forest_nature",
      name: "Bosque Natural",
      description: "Tonos verdes naturales y orgánicos",
      previewColors: ["#228B22", "#32CD32", "#90EE90", "#006400"]
    },
    {
      id: "ocean_waves",
      name: "Ondas Oceánicas",
      description: "Azules profundos como el océano",
      previewColors: ["#0077BE", "#0099CC", "#00BFFF", "#1E90FF"]
    },
    {
      id: "sunset_fire",
      name: "Fuego del Atardecer",
      description: "Rojos, naranjas y amarillos ardientes",
      previewColors: ["#FF4500", "#FF6347", "#FFA500", "#FFD700"]
    },
    {
      id: "purple_galaxy",
      name: "Galaxia Púrpura",
      description: "Tonos púrpuras y violetas espaciales",
      previewColors: ["#8A2BE2", "#9370DB", "#9400D3", "#8B008B"]
    },
    {
      id: "mint_fresh",
      name: "Menta Fresca",
      description: "Verdes menta y turquesas refrescantes",
      previewColors: ["#00FA9A", "#40E0D0", "#48D1CC", "#20B2AA"]
    },
    {
      id: "golden_luxury",
      name: "Lujo Dorado",
      description: "Dorados y amarillos elegantes",
      previewColors: ["#FFD700", "#FFA500", "#FF8C00", "#DAA520"]
    },
    {
      id: "cherry_blossom",
      name: "Flor de Cerezo",
      description: "Rosas suaves y blancos delicados",
      previewColors: ["#FFB6C1", "#FFC0CB", "#FFCCCB", "#FFE4E1"]
    },
    {
      id: "electric_blue",
      name: "Azul Eléctrico",
      description: "Azules intensos y energéticos",
      previewColors: ["#0000FF", "#0080FF", "#00BFFF", "#1E90FF"]
    },
    {
      id: "autumn_leaves",
      name: "Hojas de Otoño",
      description: "Marrones, naranjas y rojos otoñales",
      previewColors: ["#8B4513", "#A0522D", "#CD853F", "#D2691E"]
    },
    {
      id: "monochrome_red",
      name: "Monocromático Rojo",
      description: "Diferentes tonos de rojo intenso",
      previewColors: ["#DC143C", "#B22222", "#FF0000", "#FF6347"]
    },
    {
      id: "pastel_dream",
      name: "Sueño Pastel",
      description: "Colores pasteles suaves y relajantes",
      previewColors: ["#FFB3BA", "#BAFFC9", "#BAE1FF", "#FFFFBA"]
    }
  ];

  const generateAllPreviews = async () => {
    setIsGeneratingPreviews(true);
    
    for (const style of creativeStyles) {
      if (!previewImages[style.id] && !loadingPreviews[style.id]) {
        setLoadingPreviews(prev => ({ ...prev, [style.id]: true }));
        
        try {
          const response = await fetch('/api/qr/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: 'https://example.com',
              creativeStyle: style.id,
              size: 'small',
              backgroundColor: '#ffffff',
              foregroundColor: '#000000',
              style: 'square',
              pattern: 'standard',
              frame: 'none',
              gradient: 'none',
              border: 'none',
              logo: 'none',
              type: 'url',
              includeText: false,
              errorCorrection: 'M',
              cardTemplate: 'none',
              cardStyle: 'none',
              margin: 50
            })
          });

          const data = await response.json();
          if (data.success) {
            setPreviewImages(prev => ({ ...prev, [style.id]: data.qrCode }));
          }
        } catch (error) {
          console.error('Error generating preview for', style.id, ':', error);
        } finally {
          setLoadingPreviews(prev => ({ ...prev, [style.id]: false }));
        }
      }
    }
    
    setIsGeneratingPreviews(false);
  };

  // Generar vista previa para todos los estilos al cargar
  useEffect(() => {
    generateAllPreviews();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Estilos Creativos</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={generateAllPreviews}
          disabled={isGeneratingPreviews}
        >
          {isGeneratingPreviews ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            'Actualizar Vista Previa'
          )}
        </Button>
      </div>

      {/* Carrete horizontal */}
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
          {creativeStyles.map(style => (
            <div
              key={style.id}
              className={`flex-shrink-0 w-32 cursor-pointer transition-all duration-200 ${
                selectedStyle === style.id
                  ? 'scale-105'
                  : 'hover:scale-102'
              }`}
              onClick={() => onStyleSelect(style.id)}
            >
              <Card className={`${
                selectedStyle === style.id
                  ? 'ring-2 ring-primary shadow-lg bg-primary/5'
                  : 'hover:shadow-md'
              }`}>
                <CardContent className="p-3 space-y-2">
                  {/* Preview Area */}
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                    {previewImages[style.id] ? (
                      <img
                        src={previewImages[style.id]}
                        alt={`Preview ${style.name}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : loadingPreviews[style.id] ? (
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : (
                      <div className="grid grid-cols-2 gap-1 w-full h-full p-2">
                        {style.previewColors.map((color, index) => (
                          <div
                            key={index}
                            className="rounded-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Style Info */}
                  <div className="text-center">
                    <h5 className="font-medium text-sm truncate">{style.name}</h5>
                    <p className="text-xs text-muted-foreground truncate">
                      {style.description.split(' ').slice(0, 3).join(' ')}...
                    </p>
                  </div>

                  {/* Selected Indicator */}
                  {selectedStyle === style.id && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full border-2 border-white shadow-sm" />
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Style Info */}
      {selectedStyle && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <div>
              <h4 className="font-medium text-sm">
                {creativeStyles.find(s => s.id === selectedStyle)?.name}
              </h4>
              <p className="text-xs text-muted-foreground">
                {creativeStyles.find(s => s.id === selectedStyle)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}