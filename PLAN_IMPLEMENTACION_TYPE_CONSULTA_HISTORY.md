# Plan de Implementación: typeConsultaHistory

## Análisis de la Estructura Actual

Después de analizar el código existente, he identificado la estructura actual:

### Estructura Actual de ConsultaLog
- **consultaType**: String (EC, ICS)
- **consultaSubtype**: String (normal, amnistia)
- **parametros**: String (JSON con parámetros de consulta)
- **totalEncontrado**: Decimal (total del resultado si fue exitoso)
- **resultado**: String (SUCCESS, ERROR, NOT_FOUND)
- **userId**: String
- **createdAt**: DateTime

### Estructura Actual del Endpoint
El endpoint `/api/user-stats/users/location-history` actualmente retorna:
- **consultationStats**: Estadísticas agregadas (icsNormal, icsAmnistia, ecNormal, ecAmnistia, etc.)
- **NO incluye**: Historial detallado de cada consulta individual

## Diseño de la Nueva Estructura

### 1. Nuevo DTO: TypeConsultaHistoryDto
```typescript
export class TypeConsultaHistoryDto {
  type: 'ec' | 'ics';           // Tipo de consulta
  method: 'normal' | 'amnistia'; // Método usado
  key: string;                   // Clave consultada (DNI, clave catastral, etc.)
  total: number;                 // Total encontrado
  createdAt: Date;              // Fecha de la consulta
}
```

### 2. Actualización de UserLocationHistoryItemDto
Agregar el campo:
```typescript
typeConsultaHistory?: TypeConsultaHistoryDto[];
```

### 3. Modificación del Esquema de Base de Datos
Agregar campos al modelo ConsultaLog para extraer información clave:
- **consultaKey**: String (clave consultada extraída de parametros)
- **locationId**: String (ID de la ubicación del usuario al momento de la consulta)

## Estrategia de Implementación

### Fase 1: Modificación del Esquema de Base de Datos
1. Crear migración para agregar campos `consultaKey` y `locationId` a `ConsultaLog`
2. Actualizar el modelo Prisma

### Fase 2: Actualización del Sistema de Logging
1. Modificar `CreateConsultaLogDto` para incluir `consultaKey`
2. Actualizar `UserStatsService.logConsulta()` para extraer y guardar la clave
3. Capturar la ubicación actual del usuario al momento de la consulta

### Fase 3: Actualización de DTOs
1. Crear `TypeConsultaHistoryDto`
2. Actualizar `UserLocationHistoryItemDto` y `UserLocationHistoryResponseDto`

### Fase 4: Modificación del Servicio
1. Crear método para obtener historial de consultas por ubicación
2. Actualizar `getUserLocationHistory()` y `getAllUsersLocationHistory()`
3. Implementar lógica para agrupar consultas por ubicación y período

### Fase 5: Actualización de Controladores
1. Agregar parámetro opcional `includeConsultationHistory` a los endpoints
2. Modificar respuestas para incluir `typeConsultaHistory`

### Fase 6: Testing
1. Crear pruebas unitarias
2. Crear pruebas de integración
3. Verificar rendimiento con grandes volúmenes de datos

## Consideraciones Técnicas

### Extracción de Claves
Para extraer la clave consultada del campo `parametros` (JSON):
- **EC**: Buscar `dni` o `claveCatastral` en el JSON
- **ICS**: Buscar `ics` en el JSON

### Rendimiento
- Agregar índices en la base de datos para `consultaKey` y `locationId`
- Implementar paginación para el historial de consultas
- Considerar límite máximo de registros retornados

### Retrocompatibilidad
- Los campos nuevos son opcionales
- Los endpoints existentes siguen funcionando sin cambios
- El historial solo se incluye si se solicita explícitamente

## Ejemplo de Respuesta Final

```json
{
  "userId": "06a084a4-34dd-46d7-8ab9-fbafc4b44584",
  "username": "rcardona",
  "currentLocation": {
    "id": "31b315d9-dbdb-4bad-bbca-17dc95b1651d",
    "locationName": "MALL LAS CASCADAS",
    "consultationStats": { ... },
    "typeConsultaHistory": [
      {
        "type": "ec",
        "method": "amnistia",
        "key": "21-1448-003",
        "total": 3708.07,
        "createdAt": "2025-01-15T10:30:00Z"
      },
      {
        "type": "ics",
        "method": "normal",
        "key": "ics-006454",
        "total": 2500.00,
        "createdAt": "2025-01-15T11:15:00Z"
      }
    ]
  }
}
```

Este plan asegura una implementación gradual y segura, manteniendo la retrocompatibilidad mientras agrega la nueva funcionalidad solicitada.