import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StyleCatalogProps {
  onStyleSelect: (style: string) => void;
  selectedStyle: string;
  isGenerating?: boolean;
}

export function StyleCatalog({ onStyleSelect, selectedStyle, isGenerating }: StyleCatalogProps) {
  const [previews, setPreviews] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const styles = [
    // Estilos originales mejorados
    { id: 'classic', name: 'Clásico', colors: ['#000000'] },
    { id: 'vibrant_rainbow', name: 'Arcoíris Vibrante', colors: ['#D12982'] },
    { id: 'neon_cyber', name: 'Neón Cyber', colors: ['#00AAAA'] },
    { id: 'electric_blue', name: 'Azul Eléctrico', colors: ['#0056B3'] },
    { id: 'sunset_fire', name: 'Fuego del Atardecer', colors: ['#E6931A'] },
    { id: 'forest_nature', name: 'Bosque Natural', colors: ['#228B22'] },
    { id: 'ocean_waves', name: 'Ondas del Océano', colors: ['#0047AB'] },
    { id: 'multicolor_blocks', name: 'Bloques Multicolor', colors: ['#6A1B9A'] },
    { id: 'purple_galaxy', name: 'Galaxia Púrpura', colors: ['#5D1A8B'] },
    { id: 'golden_sunset', name: 'Atardecer Dorado', colors: ['#DAA520'] },
    { id: 'mint_fresh', name: 'Menta Fresca', colors: ['#00C572'] },
    { id: 'coral_reef', name: 'Arrecife de Coral', colors: ['#FF5722'] },
    { id: 'volcano_red', name: 'Rojo Volcánico', colors: ['#B71C1C'] },
    { id: 'autumn_leaves', name: 'Hojas de Otoño', colors: ['#8B4513'] },
    { id: 'monochrome_red', name: 'Rojo Monocromático', colors: ['#B71C1C'] },
    { id: 'pastel_dream', name: 'Sueño Pastel', colors: ['#FF8A95'] },
    
    // 20 nuevos estilos creativos
    { id: 'cosmic_purple', name: 'Púrpura Cósmico', colors: ['#4A148C'] },
    { id: 'laser_green', name: 'Verde Láser', colors: ['#2E7D32'] },
    { id: 'neon_pink', name: 'Rosa Neón', colors: ['#C2185B'] },
    { id: 'electric_yellow', name: 'Amarillo Eléctrico', colors: ['#F57F17'] },
    { id: 'deep_ocean', name: 'Océano Profundo', colors: ['#006064'] },
    { id: 'royal_blue', name: 'Azul Real', colors: ['#1A237E'] },
    { id: 'emerald_shine', name: 'Brillo Esmeralda', colors: ['#00695C'] },
    { id: 'crimson_wave', name: 'Ola Carmesí', colors: ['#B71C1C'] },
    { id: 'cyber_orange', name: 'Naranja Cyber', colors: ['#E65100'] },
    { id: 'mystic_violet', name: 'Violeta Místico', colors: ['#6A1B9A'] },
    { id: 'arctic_blue', name: 'Azul Ártico', colors: ['#0277BD'] },
    { id: 'jade_matrix', name: 'Matriz Jade', colors: ['#2E7D32'] },
    { id: 'ruby_fire', name: 'Fuego Rubí', colors: ['#C62828'] },
    { id: 'sapphire_glow', name: 'Brillo Zafiro', colors: ['#1565C0'] },
    { id: 'bronze_metal', name: 'Metal Bronce', colors: ['#8D6E63'] },
    { id: 'silver_chrome', name: 'Cromo Plateado', colors: ['#546E7A'] },
    { id: 'magenta_burst', name: 'Explosión Magenta', colors: ['#AD1457'] },
    { id: 'teal_storm', name: 'Tormenta Turquesa', colors: ['#00796B'] },
    { id: 'amber_lightning', name: 'Rayo Ámbar', colors: ['#FF8F00'] },
    { id: 'indigo_depth', name: 'Profundidad Índigo', colors: ['#303F9F'] },
    { id: 'lime_electric', name: 'Lima Eléctrico', colors: ['#689F38'] },
    { id: 'rose_gold', name: 'Oro Rosa', colors: ['#D81B60'] },
    { id: 'steel_blue', name: 'Azul Acero', colors: ['#37474F'] },
    { id: 'neon_turquoise', name: 'Turquesa Neón', colors: ['#00838F'] },
    { id: 'plasma_red', name: 'Rojo Plasma', colors: ['#D32F2F'] },
    { id: 'galaxy_green', name: 'Verde Galaxia', colors: ['#388E3C'] },
    { id: 'cyber_magenta', name: 'Magenta Cyber', colors: ['#8E24AA'] },
    { id: 'electric_teal', name: 'Turquesa Eléctrico', colors: ['#00695C'] },
    { id: 'laser_blue', name: 'Azul Láser', colors: ['#1976D2'] },
    { id: 'neon_lime', name: 'Lima Neón', colors: ['#8BC34A'] },
    { id: 'digital_purple', name: 'Púrpura Digital', colors: ['#7B1FA2'] },
    { id: 'chrome_yellow', name: 'Amarillo Cromo', colors: ['#FBC02D'] },
    { id: 'matrix_green', name: 'Verde Matrix', colors: ['#4CAF50'] },
    { id: 'fire_orange', name: 'Naranja Fuego', colors: ['#F57C00'] },
    { id: 'ice_blue', name: 'Azul Hielo', colors: ['#0288D1'] },
    { id: 'toxic_green', name: 'Verde Tóxico', colors: ['#558B2F'] }
  ];

  const generateQRPreview = async (styleId: string) => {
    try {
      const response = await fetch('/api/qr/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          creativeStyle: styleId,
          size: 'small',
          backgroundColor: '#ffffff',
          foregroundColor: '#000000'
        }),
      });

      const data = await response.json();
      if (data.success) {
        return data.preview;
      }
    } catch (error) {
      console.error('Error generating QR preview:', error);
    }
    return null;
  };

  const generateAllPreviews = async () => {
    setIsLoading(true);
    const newPreviews: { [key: string]: string } = {};
    
    // Generate previews in batches of 4 to avoid overwhelming the server
    for (let i = 0; i < styles.length; i += 4) {
      const batch = styles.slice(i, i + 4);
      const batchPromises = batch.map(style => generateQRPreview(style.id));
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

  // Generate previews on component mount
  useEffect(() => {
    generateAllPreviews();
  }, []);

  const handleManualUpdate = () => {
    generateAllPreviews();
  };

  const scrollContainer = (direction: 'left' | 'right') => {
    const container = document.getElementById('styles-carousel');
    if (container) {
      const scrollAmount = 240; // Ancho aproximado de 3 elementos
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Estilos Creativos</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollContainer('left')}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollContainer('right')}
            disabled={isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative">
        <div 
          id="styles-carousel"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {styles.map((style) => (
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
                        generateQRPreview(style.id);
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
                    className="w-16 h-16 rounded-lg mb-2 bg-gradient-to-br flex items-center justify-center"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${style.colors[0]}, ${style.colors[1] || style.colors[0]})`
                    }}
                  >
                    <div className="text-white text-xs font-bold text-center">Vista<br/>Previa</div>
                  </div>
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
    </div>
  );
}