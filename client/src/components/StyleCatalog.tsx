import { useState } from "react";
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

  const creativeStyles = [
    {
      id: "classic",
      name: "Clásico",
      description: "QR tradicional en blanco y negro",
      category: "Básico"
    },
    {
      id: "multicolor_blocks",
      name: "Bloques Multicolor",
      description: "Bloques de colores vibrantes como un mosaico",
      category: "Colorido"
    },
    {
      id: "rainbow_gradient",
      name: "Gradiente Arcoíris",
      description: "Transición suave de colores del arcoíris",
      category: "Colorido"
    },
    {
      id: "neon_cyber",
      name: "Neón Cibernético",
      description: "Colores neón brillantes estilo cyberpunk",
      category: "Moderno"
    },
    {
      id: "forest_nature",
      name: "Bosque Natural",
      description: "Tonos verdes naturales y orgánicos",
      category: "Naturaleza"
    },
    {
      id: "ocean_waves",
      name: "Ondas Oceánicas",
      description: "Azules profundos como el océano",
      category: "Naturaleza"
    },
    {
      id: "sunset_fire",
      name: "Fuego del Atardecer",
      description: "Rojos, naranjas y amarillos ardientes",
      category: "Cálido"
    },
    {
      id: "purple_galaxy",
      name: "Galaxia Púrpura",
      description: "Tonos púrpuras y violetas espaciales",
      category: "Cósmico"
    },
    {
      id: "mint_fresh",
      name: "Menta Fresca",
      description: "Verdes menta y turquesas refrescantes",
      category: "Fresco"
    },
    {
      id: "golden_luxury",
      name: "Lujo Dorado",
      description: "Dorados y amarillos elegantes",
      category: "Elegante"
    },
    {
      id: "cherry_blossom",
      name: "Flor de Cerezo",
      description: "Rosas suaves y blancos delicados",
      category: "Delicado"
    },
    {
      id: "electric_blue",
      name: "Azul Eléctrico",
      description: "Azules intensos y energéticos",
      category: "Energético"
    },
    {
      id: "autumn_leaves",
      name: "Hojas de Otoño",
      description: "Marrones, naranjas y rojos otoñales",
      category: "Estacional"
    },
    {
      id: "monochrome_red",
      name: "Monocromático Rojo",
      description: "Diferentes tonos de rojo intenso",
      category: "Monocromático"
    },
    {
      id: "pastel_dream",
      name: "Sueño Pastel",
      description: "Colores pasteles suaves y relajantes",
      category: "Suave"
    }
  ];

  const generatePreview = async (styleId: string) => {
    if (previewImages[styleId] || loadingPreviews[styleId]) return;

    setLoadingPreviews(prev => ({ ...prev, [styleId]: true }));

    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          creativeStyle: styleId,
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
        setPreviewImages(prev => ({ ...prev, [styleId]: data.qrCode }));
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setLoadingPreviews(prev => ({ ...prev, [styleId]: false }));
    }
  };

  const categories = [...new Set(creativeStyles.map(style => style.category))];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Catálogo de Estilos Creativos</h3>
        <p className="text-sm text-muted-foreground">
          Selecciona un estilo para personalizar tu QR code
        </p>
      </div>

      {categories.map(category => (
        <div key={category} className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground border-b pb-1">
            {category}
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {creativeStyles
              .filter(style => style.category === category)
              .map(style => (
                <Card
                  key={style.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedStyle === style.id
                      ? 'ring-2 ring-primary shadow-md'
                      : 'hover:shadow-sm'
                  }`}
                  onClick={() => onStyleSelect(style.id)}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Preview Area */}
                    <div 
                      className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden"
                      onClick={(e) => {
                        e.stopPropagation();
                        generatePreview(style.id);
                      }}
                    >
                      {previewImages[style.id] ? (
                        <img
                          src={previewImages[style.id]}
                          alt={`Preview ${style.name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : loadingPreviews[style.id] ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      ) : (
                        <div className="text-center">
                          <div className="w-12 h-12 bg-muted rounded-lg mb-2 mx-auto flex items-center justify-center">
                            <div className="w-8 h-8 bg-current rounded opacity-20"></div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Click para vista previa
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Style Info */}
                    <div className="space-y-1">
                      <h5 className="font-medium text-sm">{style.name}</h5>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {style.description}
                      </p>
                    </div>

                    {/* Selected Badge */}
                    {selectedStyle === style.id && (
                      <Badge variant="default" className="text-xs">
                        Seleccionado
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Apply Button */}
      <div className="text-center pt-4">
        <Button
          onClick={() => onStyleSelect(selectedStyle)}
          disabled={isGenerating}
          className="w-full max-w-md"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            'Aplicar Estilo Seleccionado'
          )}
        </Button>
      </div>
    </div>
  );
}