import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";

export default function Subscription() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            myQR - Ahora Completamente Gratis
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Todas las características premium ahora están disponibles sin costo
          </p>
        </div>
        
        {/* Features showcase */}
        <div className="mt-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">¿Qué Incluye myQR?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-purple-600">Generación Básica</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Generación de QR ilimitada</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Descarga en múltiples formatos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Colores personalizados</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-purple-600">Personalización</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Estilos creativos vibrantes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Gradientes y efectos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Tarjetas personalizadas</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg text-purple-600">Análisis</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Historial completo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Estadísticas geográficas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>Exportación a Excel</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Call to action */}
        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl text-purple-600">
                ¡Empieza a crear QR codes ahora!
              </CardTitle>
              <CardDescription className="text-lg">
                Sin límites, sin pagos, sin restricciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6"
                onClick={() => window.location.href = '/'}
              >
                <Crown className="w-5 h-5 mr-2" />
                Ir al Generador de QR
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}