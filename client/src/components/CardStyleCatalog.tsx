import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CardStyleCatalogProps {
  onStyleSelect: (style: string) => void;
  selectedStyle: string;
  isGenerating?: boolean;
}

export function CardStyleCatalog({ onStyleSelect, selectedStyle, isGenerating }: CardStyleCatalogProps) {
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const cardStyles = [
    { id: 'modern_gradient', name: 'Gradiente Moderno', colors: ['#667eea', '#764ba2'] },
    { id: 'neon_glow', name: 'Resplandor Neón', colors: ['#00f5ff', '#0099ff'] },
    { id: 'sunset_card', name: 'Tarjeta Atardecer', colors: ['#ff6b6b', '#ffa500'] },
    { id: 'forest_green', name: 'Verde Bosque', colors: ['#134e5e', '#71b280'] },
    { id: 'ocean_blue', name: 'Azul Océano', colors: ['#667db6', '#0082c8'] },
    { id: 'purple_haze', name: 'Neblina Púrpura', colors: ['#8360c3', '#2ebf91'] },
    { id: 'golden_hour', name: 'Hora Dorada', colors: ['#ffd89b', '#19547b'] },
    { id: 'coral_reef', name: 'Arrecife Coral', colors: ['#ff8a80', '#ff5722'] },
    { id: 'mint_chocolate', name: 'Chocolate Menta', colors: ['#4ecdc4', '#44a08d'] },
    { id: 'volcanic_red', name: 'Rojo Volcánico', colors: ['#c31432', '#240b36'] },
    { id: 'arctic_ice', name: 'Hielo Ártico', colors: ['#76b852', '#8dc26f'] },
    { id: 'cyber_punk', name: 'Cyber Punk', colors: ['#ff00ff', '#00ffff'] },
    { id: 'royal_purple', name: 'Púrpura Real', colors: ['#7b4397', '#dc2430'] },
    { id: 'emerald_city', name: 'Ciudad Esmeralda', colors: ['#11998e', '#38ef7d'] },
    { id: 'fire_storm', name: 'Tormenta de Fuego', colors: ['#f12711', '#f5af19'] },
    { id: 'midnight_blue', name: 'Azul Medianoche', colors: ['#2c3e50', '#4a6741'] },
    { id: 'rose_gold', name: 'Oro Rosa', colors: ['#ed4264', '#ffedbc'] },
    { id: 'electric_lime', name: 'Lima Eléctrico', colors: ['#a8e6cf', '#dcedc1'] },
    { id: 'cosmic_purple', name: 'Púrpura Cósmico', colors: ['#667eea', '#764ba2'] },
    { id: 'tropical_sunset', name: 'Atardecer Tropical', colors: ['#ff9a9e', '#fecfef'] },
    { id: 'deep_space', name: 'Espacio Profundo', colors: ['#434343', '#000000'] },
    { id: 'rainbow_burst', name: 'Explosión Arcoíris', colors: ['#ff6b6b', '#4ecdc4'] },
    { id: 'silver_chrome', name: 'Cromo Plateado', colors: ['#bdc3c7', '#2c3e50'] },
    { id: 'aqua_marine', name: 'Aguamarina', colors: ['#1de9b6', '#00bcd4'] },
    { id: 'magenta_dream', name: 'Sueño Magenta', colors: ['#ff0084', '#33001b'] },
    { id: 'jade_forest', name: 'Bosque Jade', colors: ['#00c9ff', '#92fe9d'] },
    { id: 'copper_bronze', name: 'Bronce Cobre', colors: ['#b79891', '#94716b'] },
    { id: 'neon_night', name: 'Noche Neón', colors: ['#0f0f23', '#ff006e'] },
    { id: 'pearl_white', name: 'Blanco Perla', colors: ['#f7f7f7', '#e3e3e3'] },
    { id: 'galaxy_swirl', name: 'Remolino Galaxia', colors: ['#667eea', '#764ba2'] }
  ];

  const generateCardPreview = async (cardStyleId: string) => {
    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://myqr.app',
          cardStyle: cardStyleId,
          creativeStyle: 'classic',
          size: 'small',
          backgroundColor: '#ffffff',
          foregroundColor: '#000000'
        }),
      });

      const data = await response.json();
      if (data.success) {
        return data.qrCode;
      }
    } catch (error) {
      console.error('Error generating card preview:', error);
    }
    return null;
  };

  const generateAllPreviews = async () => {
    setIsLoading(true);
    const newPreviews: { [key: string]: string } = {};
    
    // Generate previews in batches of 5 to avoid overwhelming the server
    for (let i = 0; i < cardStyles.length; i += 5) {
      const batch = cardStyles.slice(i, i + 5);
      const batchPromises = batch.map(style => generateCardPreview(style.id));
      const batchResults = await Promise.all(batchPromises);
      
      batch.forEach((style, index) => {
        if (batchResults[index]) {
          newPreviews[style.id] = batchResults[index];
        }
      });
    }
    
    setPreviews(newPreviews);
    setIsLoading(false);
  };

  const regeneratePreview = async (styleId: string) => {
    const preview = await generateCardPreview(styleId);
    if (preview) {
      setPreviews(prev => ({
        ...prev,
        [styleId]: preview
      }));
    }
  };

  useEffect(() => {
    generateAllPreviews();
  }, []);

  const scrollLeft = () => {
    const container = document.getElementById('card-styles-container');
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    const container = document.getElementById('card-styles-container');
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Estilos de Tarjeta
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateAllPreviews}
            disabled={isLoading}
          >
            {isLoading ? 'Generando...' : 'Actualizar'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollLeft}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={scrollRight}
            disabled={isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div
          id="card-styles-container"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cardStyles.map((style) => (
            <div
              key={style.id}
              className={`relative flex-shrink-0 w-32 h-32 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                selectedStyle === style.id
                  ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20 transform scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-102'
              }`}
              onClick={() => onStyleSelect(style.id)}
            >
              {previews[style.id] ? (
                <div className="relative w-full h-full">
                  <img
                    src={previews[style.id]}
                    alt={style.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        regeneratePreview(style.id);
                      }}
                      className="text-xs"
                    >
                      Regenerar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-3">
                  <div 
                    className="w-16 h-16 rounded-lg mb-2 bg-gradient-to-br"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${style.colors[0]}, ${style.colors[1]})`
                    }}
                  />
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">
                      {style.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Indicador de selección */}
              {selectedStyle === style.id && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              )}

              {/* Nombre del estilo */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 rounded-b-lg">
                <p className="text-center truncate">{style.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            Generando vistas previas...
          </div>
        </div>
      )}
    </div>
  );
}