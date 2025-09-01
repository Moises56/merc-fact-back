# Historial de Ubicaciones de Usuarios

## Descripción General

Este documento describe la implementación del sistema de historial de ubicaciones de usuarios, que permite mantener un registro completo de todas las ubicaciones asignadas a los usuarios a lo largo del tiempo, incluso cuando cambian de ubicación múltiples veces.

## Problema Resuelto

Anteriormente, el sistema solo mantenía la ubicación activa actual de cada usuario. Cuando se asignaba una nueva ubicación, la anterior se marcaba como inactiva pero no se proporcionaba una forma fácil de consultar el historial completo de ubicaciones.

## Funcionalidades Implementadas

### 1. Nuevos DTOs

#### `UserLocationHistoryItemDto`
Representa un elemento individual del historial de ubicaciones:
- **id**: Identificador único de la asignación
- **locationName**: Nombre de la ubicación
- **locationCode**: Código de la ubicación (opcional)
- **description**: Descripción de la ubicación (opcional)
- **isActive**: Indica si es la ubicación actual
- **assignedAt**: Fecha de asignación
- **assignedBy**: Usuario que realizó la asignación
- **assignedByUsername**: Nombre de usuario que realizó la asignación
- **createdAt**: Fecha de creación del registro
- **updatedAt**: Fecha de última actualización
- **durationDays**: Duración en días que estuvo asignada (calculado)
- **deactivatedAt**: Fecha cuando se desactivó (calculado)

#### `UserLocationHistoryResponseDto`
Respuesta completa del historial de un usuario:
- **userId**: ID del usuario
- **username**: Nombre de usuario
- **nombre**: Nombre del usuario
- **apellido**: Apellido del usuario
- **currentLocation**: Ubicación actual (si existe)
- **locationHistory**: Array con todo el historial
- **totalLocations**: Total de ubicaciones asignadas
- **firstAssignedAt**: Fecha de primera asignación
- **lastAssignedAt**: Fecha de última asignación

#### `GetUserLocationHistoryDto`
Parámetros de consulta para filtrar el historial:
- **userId**: ID del usuario (opcional)
- **activeOnly**: Solo ubicaciones activas (default: false)
- **sortOrder**: Orden de clasificación (asc/desc, default: desc)
- **limit**: Límite de resultados (default: 50)
- **page**: Página para paginación (default: 1)

### 2. Nuevos Endpoints

#### `GET /api/user-stats/user/:userId/location-history`
**Descripción**: Obtiene el historial completo de ubicaciones de un usuario específico.

**Parámetros**:
- `userId` (path): ID del usuario
- `activeOnly` (query, opcional): Mostrar solo ubicaciones activas
- `sortOrder` (query, opcional): Orden de clasificación (asc/desc)
- `limit` (query, opcional): Límite de resultados por página
- `page` (query, opcional): Número de página

**Respuesta**: `UserLocationHistoryResponseDto`

**Ejemplo de uso**:
```bash
# Obtener historial completo de un usuario
curl -X GET "http://localhost:3000/api/user-stats/user/123/location-history" \
  -H "Authorization: Bearer <token>"

# Obtener solo ubicaciones activas
curl -X GET "http://localhost:3000/api/user-stats/user/123/location-history?activeOnly=true" \
  -H "Authorization: Bearer <token>"

# Obtener historial paginado
curl -X GET "http://localhost:3000/api/user-stats/user/123/location-history?limit=10&page=1" \
  -H "Authorization: Bearer <token>"
```

#### `GET /api/user-stats/users/location-history`
**Descripción**: Obtiene el historial de ubicaciones de todos los usuarios del sistema.

**Parámetros**:
- `activeOnly` (query, opcional): Mostrar solo usuarios con ubicaciones activas
- `sortOrder` (query, opcional): Orden de clasificación (asc/desc)
- `limit` (query, opcional): Límite de resultados por página
- `page` (query, opcional): Número de página

**Respuesta**: Array de `UserLocationHistoryResponseDto`

**Ejemplo de uso**:
```bash
# Obtener historial de todos los usuarios
curl -X GET "http://localhost:3000/api/user-stats/users/location-history" \
  -H "Authorization: Bearer <token>"

# Obtener solo usuarios con ubicaciones activas
curl -X GET "http://localhost:3000/api/user-stats/users/location-history?activeOnly=true" \
  -H "Authorization: Bearer <token>"
```

### 3. Mejoras en el Método de Asignación

El método `assignUserLocation` ha sido mejorado con:

#### Transacciones de Base de Datos
- Uso de `$transaction` para garantizar consistencia
- Desactivación atómica de ubicación anterior y creación de nueva

#### Logging Mejorado
- Log detallado de cambios de ubicación
- Log estructurado para auditoría: `HISTORIAL_UBICACION`
- Información de ubicación anterior y nueva
- Timestamp preciso de cambios

#### Manejo de Errores
- Mejor captura y logging de errores
- Información contextual en mensajes de error

## Ejemplos de Respuesta

### Historial de Usuario Individual
```json
{
  "userId": "123",
  "username": "juan.perez",
  "nombre": "Juan",
  "apellido": "Pérez",
  "currentLocation": {
    "id": "loc-456",
    "locationName": "Oficina Central",
    "locationCode": "OFC-001",
    "isActive": true,
    "assignedAt": "2024-01-15T10:00:00Z",
    "assignedBy": "admin",
    "durationDays": 30
  },
  "locationHistory": [
    {
      "id": "loc-456",
      "locationName": "Oficina Central",
      "locationCode": "OFC-001",
      "isActive": true,
      "assignedAt": "2024-01-15T10:00:00Z",
      "assignedBy": "admin",
      "durationDays": 30
    },
    {
      "id": "loc-123",
      "locationName": "Sucursal Norte",
      "locationCode": "SUC-001",
      "isActive": false,
      "assignedAt": "2024-01-01T08:00:00Z",
      "assignedBy": "supervisor",
      "durationDays": 14,
      "deactivatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "totalLocations": 2,
  "firstAssignedAt": "2024-01-01T08:00:00Z",
  "lastAssignedAt": "2024-01-15T10:00:00Z"
}
```

## Casos de Uso

### 1. Auditoría de Ubicaciones
- Rastrear todos los cambios de ubicación de un usuario
- Identificar patrones de movilidad
- Generar reportes de asignaciones históricas

### 2. Análisis de Duración
- Calcular tiempo promedio en cada ubicación
- Identificar ubicaciones temporales vs permanentes
- Optimizar asignaciones futuras

### 3. Reportes Administrativos
- Generar reportes de movilidad por período
- Analizar rotación de personal por ubicación
- Identificar usuarios con múltiples cambios

### 4. Compliance y Regulaciones
- Mantener registro completo para auditorías
- Cumplir con requisitos de trazabilidad
- Documentar cambios organizacionales

## Consideraciones de Rendimiento

### Optimizaciones Implementadas
- Consultas eficientes con `include` para evitar N+1
- Paginación para manejar grandes volúmenes de datos
- Cálculos de duración en memoria para mejor rendimiento
- Índices en campos de consulta frecuente

### Recomendaciones
- Usar paginación para consultas de múltiples usuarios
- Implementar caché para consultas frecuentes
- Considerar archivado de datos históricos muy antiguos

## Seguridad

### Autenticación y Autorización
- Endpoints protegidos con guards de roles
- Solo usuarios ADMIN y USER_ADMIN pueden acceder
- Validación de permisos en cada consulta

### Logging de Auditoría
- Registro estructurado de todos los cambios
- Información de usuario que realiza cambios
- Timestamps precisos para trazabilidad

## Pruebas

### Casos de Prueba Recomendados
1. **Historial de usuario existente**: Verificar respuesta correcta
2. **Usuario sin ubicaciones**: Manejar caso vacío
3. **Usuario inexistente**: Error 404 apropiado
4. **Paginación**: Verificar límites y páginas
5. **Filtros**: Probar activeOnly y sortOrder
6. **Cálculo de duraciones**: Verificar precisión
7. **Transacciones**: Probar consistencia en asignaciones

### Comandos de Prueba
```bash
# Prueba básica de historial
npm run test -- --testNamePattern="location history"

# Prueba de endpoints
npm run test:e2e -- --testNamePattern="user-stats"
```

## Monitoreo

### Métricas Importantes
- Tiempo de respuesta de consultas de historial
- Número de consultas por usuario
- Errores en asignaciones de ubicación
- Volumen de datos históricos

### Logs a Monitorear
- `HISTORIAL_UBICACION`: Cambios de ubicación
- Errores en consultas de historial
- Transacciones fallidas

## Futuras Mejoras

### Corto Plazo
1. **Cache Redis**: Implementar caché para consultas frecuentes
2. **Exportación**: Permitir exportar historial a CSV/Excel
3. **Filtros avanzados**: Por rango de fechas, tipo de ubicación

### Largo Plazo
1. **Dashboard visual**: Gráficos de movilidad de usuarios
2. **Alertas**: Notificaciones por cambios frecuentes
3. **Análisis predictivo**: Predecir próximos cambios
4. **Integración**: Conectar con sistemas de HR/nómina

## Notas Técnicas

### Base de Datos
- No se requieren cambios en el esquema existente
- Aprovecha la estructura actual de `UserLocation`
- Mantiene compatibilidad con funcionalidad existente

### Compatibilidad
- Totalmente compatible con endpoints existentes
- No afecta funcionalidad actual
- Extensión no disruptiva del sistema

### Rollback
- Los nuevos endpoints pueden deshabilitarse sin afectar el sistema
- Los cambios en `assignUserLocation` son retrocompatibles
- Fácil reversión si es necesario