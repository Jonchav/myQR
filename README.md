# myQR - QR Code Generator

Una aplicación web completa para generar códigos QR personalizables con integración de pagos PayPal.

## 🚀 Características

- **Generación de QR**: Códigos QR personalizables con múltiples estilos
- **Seguimiento de escaneos**: Sistema de análisis con geolocalización
- **Integración PayPal**: Planes de suscripción ($0.99 semanal, $2.15 mensual)
- **Historial completo**: Gestión y análisis de códigos QR generados
- **Descarga múltiple**: PNG, JPG, SVG, PDF, DOCX

## 📋 Requisitos

- Node.js 20+
- PostgreSQL
- Cuentas PayPal/Stripe (para pagos)

## 🛠️ Instalación Local

```bash
# Clonar repositorio
git clone [tu-repo]
cd myqr

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Configurar base de datos
npm run db:push

# Iniciar desarrollo
npm run dev
```

## 🚀 Despliegue en Render

### Variables de Entorno
```
DATABASE_URL=postgresql://...
SESSION_SECRET=tu_clave_secreta
PAYPAL_CLIENT_ID=tu_paypal_client_id
PAYPAL_CLIENT_SECRET=tu_paypal_secret
PAYPAL_ENVIRONMENT=live
NODE_ENV=production
```

### Archivos de Configuración
- `render.yaml` - Configuración del servicio
- `render-build.sh` - Script de construcción
- `Procfile` - Comando de inicio
- `.nvmrc` - Versión Node.js

## 📚 Documentación

- [Guía de Despliegue](DEPLOYMENT.md)
- [Arquitectura del Sistema](replit.md)

## 🔧 Tecnologías

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express.js, PostgreSQL
- **QR Generation**: qrcode, sharp
- **Pagos**: PayPal SDK, Stripe
- **Autenticación**: Sesiones simples
- **Base de datos**: Drizzle ORM

## 📄 Licencia

MIT License