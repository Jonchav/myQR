import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Sparkles, Palette, Shield, Zap, Users, Star, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">QR Pro</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Generador Profesional</p>
              </div>
            </div>
            <Button asChild>
              <a href="/api/login">
                Iniciar Sesión
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Badge variant="outline" className="mb-6">
          <Sparkles className="w-4 h-4 mr-2" />
          Características Avanzadas
        </Badge>
        
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
          Genera Códigos QR
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Profesionales</span>
        </h2>
        
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
          Crea códigos QR personalizados con opciones avanzadas de diseño, colores, estilos y marcos. 
          Perfecto para empresas, marketing y uso personal.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <a href="/api/login">
              Comenzar Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </Button>
          <Button size="lg" variant="outline">
            Ver Características
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Características Principales
          </h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Todas las herramientas que necesitas para crear códigos QR profesionales
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Palette className="w-8 h-8 text-blue-500 mb-2" />
              <CardTitle>Personalización Avanzada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Personaliza colores, estilos, patrones y marcos. Más de 20 opciones de diseño disponibles.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Zap className="w-8 h-8 text-green-500 mb-2" />
              <CardTitle>Generación Instantánea</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Genera códigos QR al instante con alta calidad y múltiples formatos de salida.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Shield className="w-8 h-8 text-purple-500 mb-2" />
              <CardTitle>Múltiples Tipos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Soporte para URLs, texto, email, teléfono, SMS y configuraciones WiFi.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Users className="w-8 h-8 text-orange-500 mb-2" />
              <CardTitle>Historial Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Guarda y gestiona todos tus códigos QR en un historial organizado y privado.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Star className="w-8 h-8 text-yellow-500 mb-2" />
              <CardTitle>Alta Calidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Genera códigos QR en alta resolución, perfectos para impresión y uso digital.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <QrCode className="w-8 h-8 text-indigo-500 mb-2" />
              <CardTitle>Fácil de Usar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Interfaz intuitiva y fácil de usar. Genera tu primer QR en menos de 30 segundos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            ¿Listo para crear códigos QR profesionales?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Únete a miles de usuarios que ya confían en nuestra plataforma
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="/api/login">
              Comenzar Ahora - Es Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">QR Pro</span>
          </div>
          <p className="text-gray-400">
            &copy; 2024 QR Pro. Hecho con ❤️ para facilitar la creación de códigos QR profesionales.
          </p>
        </div>
      </footer>
    </div>
  );
}