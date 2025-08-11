# Guía de Despliegue para Render

## Configuración Necesaria

### Variables de Entorno Requeridas
En Render, debes configurar estas variables:

1. **DATABASE_URL** - URL de conexión PostgreSQL (automática con la base de datos de Render)
2. **SESSION_SECRET** - Clave secreta para sesiones (genera una aleatoria)
3. **PAYPAL_CLIENT_ID** - ID del cliente PayPal
4. **PAYPAL_CLIENT_SECRET** - Secreto del cliente PayPal  
5. **PAYPAL_ENVIRONMENT** - Debe ser "live" para producción
6. **STRIPE_SECRET_KEY** - Clave secreta de Stripe (opcional)
7. **VITE_STRIPE_PUBLIC_KEY** - Clave pública de Stripe (opcional)

### Archivos de Configuración
- `render.yaml` - Configuración del servicio Render
- `Procfile` - Comando de inicio para Render
- `.nvmrc` - Versión de Node.js requerida
- `render-build.sh` - Script personalizado de construcción

## Proceso de Despliegue

1. **Conecta el repositorio** a Render
2. **Configura las variables de entorno** en el panel de Render
3. **Render automáticamente ejecutará**:
   - `./render-build.sh` para la construcción
   - `npm start` para iniciar la aplicación

## Diferencias con Replit

- **Autenticación**: Usa un sistema simplificado con usuario demo
- **Puerto**: Usa `process.env.PORT` en lugar de puerto fijo 5000
- **Base de datos**: PostgreSQL gestionado por Render
- **Variables**: No depende de `REPLIT_DOMAINS` ni `REPL_ID`

## Verificación del Despliegue

La aplicación estará disponible en la URL proporcionada por Render. 
Todas las funcionalidades de QR codes y PayPal funcionarán normalmente.