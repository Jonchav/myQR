# 🔑 Configuración SESSION_SECRET para Render

## Error Identificado
```
Error: secret option required for sessions
```

## Solución: Agregar SESSION_SECRET a Render

### 1. Accede a tu Dashboard de Render
- Ve a https://render.com/dashboard
- Selecciona tu servicio `myqr`

### 2. Agrega la Variable de Entorno
- Ve a la pestaña "Environment"
- Haz clic en "Add Environment Variable"
- Agrega:
  - **Key**: `SESSION_SECRET`
  - **Value**: `rGq3Sf6pyPCqXGlt8mJYuscSePgmIKXrnPmVEHuW1a4=`

### 3. Variables de Entorno Requeridas para Render

Asegúrate de tener configuradas estas variables:

```
SESSION_SECRET=rGq3Sf6pyPCqXGlt8mJYuscSePgmIKXrnPmVEHuW1a4=
DATABASE_URL=[automática de Render]
NODE_ENV=production
PAYPAL_ENVIRONMENT=live
```

### 4. Redesplegar
Después de agregar SESSION_SECRET, Render automáticamente redespliegue la aplicación.

## ⚠️ Importante
- Nunca compartas el SESSION_SECRET públicamente
- Esta clave se usa para firmar las sesiones de usuario de forma segura
- Es única para tu aplicación

## 🚀 Después de agregar SESSION_SECRET
Tu aplicación debería iniciarse correctamente sin el error "secret option required for sessions".