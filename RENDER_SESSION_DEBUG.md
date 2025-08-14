# 🔍 Debug de Sesiones en Render

## Problema Actual
El login funciona en el backend pero el frontend no detecta la autenticación.

## Posibles Causas

### 1. Cookies en Producción
- **sameSite**: Necesario para navegadores modernos
- **secure**: Debe ser `true` en HTTPS (Render)
- **httpOnly**: Correcto para seguridad

### 2. Session Store
- **PostgreSQL**: Usando `connect-pg-simple`
- **DATABASE_URL**: Debe estar configurada en Render
- **Tabla sessions**: Debe existir en la base de datos

### 3. Session TTL
- **Configurado**: 7 días
- **Cookie maxAge**: 7 días
- **Store TTL**: 7 días

## Cambios Aplicados

### 1. SameSite Policy
```javascript
cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  maxAge: sessionTtl,
  sameSite: 'lax', // NUEVO
}
```

### 2. Session Save Forzado
```javascript
req.session.save((err) => {
  if (err) {
    console.error("Session save error:", err);
    return res.status(500).json({ message: "Session save failed" });
  }
  console.log("Session saved successfully, redirecting");
  res.redirect("/");
});
```

## Para Debug en Render

### Verificar logs:
1. `"Session saved successfully, redirecting"`
2. `"Session save error"` (si aparece, indica problema de DB)
3. Verificar que DATABASE_URL esté configurada
4. Comprobar que la tabla `sessions` exista

### Test manual:
1. Login → debe mostrar "Session saved successfully"
2. Refresh página → `/api/auth/user` debe retornar usuario
3. Si falla, verificar cookies en DevTools