# Guía de Uso - Colección Insomnia Sistema de Logs y Estadísticas

## 📋 Importación de la Colección

1. **Abrir Insomnia**
2. **Importar archivo**: `Insomnia_Sistema_Logs_Estadisticas.json`
3. **Configurar variables de entorno**:
   - `baseUrl`: `http://localhost:3000` (ya configurado)
   - ✅ **NO necesitas configurar tokens** - Las cookies se manejan automáticamente

## 🔑 Configuración de Autenticación con HTTP-Only Cookies

### Paso 1: Realizar Login

**📁 Carpeta: 🔐 Autenticación**

1. **Login ADMIN**: Usuario `admin` / `admin`
2. **Login USER-ADMIN**: Usuario `useradmin` / `admin123`
3. **Login USER**: Usuario `jperez` / `admin123`

### Paso 2: Autenticación Automática con Cookies HTTP-Only

✅ **El sistema usa SOLO cookies HTTP-only para máxima seguridad**

- Las cookies se guardan automáticamente después del login
- Las cookies se envían automáticamente en cada request
- No necesitas configurar headers `Authorization`
- Los tokens NO aparecen en la respuesta por seguridad

**Ejemplo de respuesta de login (segura):**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": "f199d049-f069-4a94-9ab3-5cd9fcac0c03",
    "correo": "mougrind@amdc.hn",
    "username": "mougrind",
    "nombre": "Mou",
    "apellido": "Grind",
    "role": "ADMIN"
  }
}
```

**🔒 Ventajas de Seguridad:**
- Tokens en cookies HTTP-only no son accesibles desde JavaScript
- Protección contra ataques XSS
- Auto-renovación transparente cada 15 minutos
- No hay riesgo de exposición de tokens en logs o respuestas

**⚠️ Importante**: Los tokens `access_token` y `refresh_token` se establecen automáticamente como cookies HTTP-only y NO aparecen en la respuesta.

## 🧪 Secuencia de Pruebas Recomendada

### 1. Autenticación Inicial
```
1.1 → Login ADMIN
1.2 → ✅ Las cookies se configuran automáticamente
```

### 2. Verificar Estado Inicial
```
2.1 → Mis Estadísticas (debería mostrar 0 consultas)
2.2 → Estadísticas Generales (ADMIN)
2.3 → Logs de Consultas (debería estar vacío o con datos de prueba)
```

### 3. Realizar Consultas con Logging
```
3.1 → EC - Consulta Normal (Con Logging)
      • claveCatastral: 23-0799-005
      • dni: 0101195401184
      • Resultado esperado: L 15,440.95

3.2 → EC - Consulta Amnistía (Con Logging)
      • Mismos parámetros
      • Verifica logging diferente (tipo AMNISTIA)

3.3 → ICS - Consulta Normal (Con Logging)
      • ics: ICS-006454
      • dni: 08019022363089
      • Resultado esperado: L 68,438.73

3.4 → ICS - Consulta Amnistía (Con Logging)
      • Mismos parámetros
      • Verifica logging diferente (tipo AMNISTIA)
```

### 4. Verificar Logs Generados
```
4.1 → Mis Estadísticas (debería mostrar incremento)
4.2 → Logs de Consultas (debería mostrar nuevos registros)
4.3 → Estadísticas Generales (incremento en totales)
```

### 5. Gestión de Ubicaciones
```
5.1 → Asignar Ubicación a Usuario
      • locationName: "Oficina Central"
      • description: "Oficina principal..."

5.2 → Estadísticas por Ubicación
      • Verifica datos por ubicación asignada
```

### 6. Pruebas por Rol

#### Como USER-ADMIN:
```
6.1 → Login USER-ADMIN
6.2 → EC - Consulta Normal ✅ (debería funcionar)
6.3 → ICS - Consulta Normal ✅ (debería funcionar)
6.4 → Mis Estadísticas ✅ (debería funcionar)
6.5 → Estadísticas Generales ❌ (debería fallar - 403)
```

#### Como USER:
```
6.6 → Login USER
6.7 → EC - Consulta Normal ✅ (debería funcionar)
6.8 → ICS - Consulta Normal ✅ (debería funcionar)
6.9 → Mis Estadísticas ✅ (debería funcionar)
6.10 → Estadísticas Generales ❌ (debería fallar - 403)
6.11 → Logs de Consultas ❌ (debería fallar - 403)
```

### 7. Gestión de Sesiones
```
7.1 → Para cambiar de usuario, hacer login con credenciales diferentes
7.2 → Las cookies anteriores se sobrescriben automáticamente
7.3 → No necesitas "logout" manual para cambiar de usuario
```

## 📊 Datos de Prueba Incluidos

### Usuarios de Prueba:
- **admin** / **admin** → Rol: ADMIN
- **useradmin** / **admin123** → Rol: USER-ADMIN
- **jperez** / **admin123** → Rol: USER

### Datos Reales para Consultas:
- **EC**: clave `23-0799-005`, dni `0101195401184` → L 15,440.95
- **ICS**: ics `ICS-006454`, dni `08019022363089` → L 68,438.73

### Ubicaciones de Prueba:
- Oficina Central
- Sucursal Norte
- Punto de Atención Sur

## 🎯 Puntos de Verificación

### ✅ Logging Automático:
- Cada consulta EC/ICS debe generar un log automáticamente
- Los logs deben capturar parámetros, resultado y duración
- Los tipos de consulta (NORMAL/AMNISTIA) deben diferenciarse

### ✅ Control de Acceso por Rol:
- **ADMIN**: Acceso completo
- **USER-ADMIN**: Solo consultas EC/ICS y estadísticas propias
- **USER**: Solo consultas y estadísticas propias

### ✅ Estadísticas en Tiempo Real:
- Las estadísticas deben actualizarse inmediatamente después de cada consulta
- Los contadores por tipo (EC/ICS, NORMAL/AMNISTIA) deben ser precisos

### ✅ Gestión de Ubicaciones:
- Los usuarios pueden asignarse ubicaciones
- Las estadísticas pueden filtrarse por ubicación

## 🔧 Solución de Problemas

### Error 401 - Unauthorized:
- Asegúrate de haber hecho login primero
- Verifica que las cookies estén habilitadas en Insomnia
- Si sigues teniendo problemas, haz login nuevamente

### Error 403 - Forbidden:
- Verificar que el usuario tenga el rol adecuado para el endpoint
- USER-ADMIN no puede acceder a estadísticas generales
- USER no puede acceder a logs de consultas

### Error 500 - Server Error:
- Verificar que el servidor esté corriendo en `localhost:3000`
- Verificar logs del servidor para más detalles

### No se generan logs:
- Verificar que las consultas se hagan a endpoints `/auth` (no a los originales)
- Verificar en logs del servidor los mensajes del interceptor

### Cookies no se guardan:
- En Insomnia, verificar que "Send cookies" y "Store cookies" estén habilitados
- Verificar que el servidor esté respondiendo con Set-Cookie headers

## 📈 Métricas a Observar

1. **Contadores por Usuario**: Incremento después de cada consulta
2. **Contadores por Tipo**: EC vs ICS
3. **Contadores por Subtipo**: NORMAL vs AMNISTIA
4. **Totales del Sistema**: Suma de todas las consultas
5. **Distribución por Ubicación**: Agrupación geográfica
6. **Logs Detallados**: Parámetros, resultados y tiempos de respuesta
