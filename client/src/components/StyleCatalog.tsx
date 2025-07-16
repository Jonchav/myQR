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
    { id: 'classic', name: 'Clásico', colors: ['#000000'] },
    { id: 'vibrant_rainbow', name: 'Arcoíris Vibrante', colors: ['#FF0080', '#FF4080', '#FF6080', '#FF8080'] },
    { id: 'neon_cyber', name: 'Neón Cyber', colors: ['#00FFFF', '#40FFFF', '#80FFFF', '#B0FFFF'] },
    { id: 'electric_blue', name: 'Azul Eléctrico', colors: ['#007BFF', '#4095FF', '#80AFFF', '#B0C9FF'] },
    { id: 'sunset_fire', name: 'Fuego del Atardecer', colors: ['#FFA500', '#FFB540', '#FFC580', '#FFD5B0'] },
    { id: 'forest_nature', name: 'Bosque Natural', colors: ['#00FF00', '#40FF40', '#80FF80', '#B0FFB0'] },
    { id: 'ocean_waves', name: 'Ondas del Océano', colors: ['#0064FF', '#4084FF', '#80A4FF', '#B0C4FF'] },
    { id: 'multicolor_blocks', name: 'Bloques Multicolor', colors: ['#9400D3', '#A440E3', '#B480F3', '#C4B0FF'] },
    { id: 'purple_galaxy', name: 'Galaxia Púrpura', colors: ['#8A2BE2', '#9A4BF2', '#AA6BFF', '#BA8BFF'] },
    { id: 'golden_sunset', name: 'Atardecer Dorado', colors: ['#FFD700', '#FFE140', '#FFEB80', '#FFF5B0'] },
    { id: 'mint_fresh', name: 'Menta Fresca', colors: ['#00FA9A', '#40E0D0', '#48D1CC', '#20B2AA'] },
    { id: 'coral_reef', name: 'Arrecife de Coral', colors: ['#FF7F50', '#FFB347', '#FFA07A', '#FF6347'] },
    { id: 'volcano_red', name: 'Rojo Volcánico', colors: ['#DC143C', '#B22222', '#FF0000', '#8B0000'] },
    { id: 'autumn_leaves', name: 'Hojas de Otoño', colors: ['#8B4513', '#A0522D', '#CD853F', '#D2691E'] },
    { id: 'monochrome_red', name: 'Rojo Monocromático', colors: ['#DC143C', '#B22222', '#FF0000', '#FF6347'] },
    { id: 'pastel_dream', name: 'Sueño Pastel', colors: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA'] }
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