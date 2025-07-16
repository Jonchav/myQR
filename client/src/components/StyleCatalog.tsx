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
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://myqr.app',
          creativeStyle: styleId,
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
        <Button
          onClick={handleManualUpdate}
          disabled={isLoading}
          size="sm"
          variant="outline"
        >
          {isLoading ? 'Actualizando...' : 'Actualizar Vista Previa'}
        </Button>
      </div>

      <div className="relative">
        {/* Flecha izquierda */}
        <button
          onClick={() => scrollContainer('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Flecha derecha */}
        <button
          onClick={() => scrollContainer('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        <div 
          id="styles-carousel"
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-8"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {styles.map((style) => (
            <div
              key={style.id}
              className={`relative flex-shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedStyle === style.id ? 'scale-110' : ''
              }`}
              onClick={() => onStyleSelect(style.id)}
            >
              <div className={`relative w-20 h-20 rounded-lg border-2 overflow-hidden ${
                selectedStyle === style.id 
                  ? 'border-purple-500 shadow-lg shadow-purple-500/25' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}>
                {previews[style.id] && (
                  <img 
                    src={previews[style.id]} 
                    alt={style.name}
                    className="w-full h-full object-cover"
                  />
                )}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
                {!previews[style.id] && !isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div className="text-xs text-gray-500 text-center">
                      Vista<br/>Previa
                    </div>
                  </div>
                )}
              </div>
              
              {selectedStyle === style.id && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-white"></div>
              )}
              
              <p className="mt-2 text-xs text-center text-gray-600 dark:text-gray-400 max-w-20 truncate">
                {style.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}