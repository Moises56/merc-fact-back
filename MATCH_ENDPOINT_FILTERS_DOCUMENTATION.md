# Documentación de Filtros - Endpoint Match

## Endpoint: `/api/user-stats/match`

### Descripción
El endpoint de match compara las consultas exitosas del sistema con los pagos registrados en la base de datos RECAUDO. A partir del **19 de agosto de 2025**, la aplicación comenzó a operar, por lo que solo se consideran válidas las consultas realizadas desde esa fecha.

### Filtros Disponibles

#### 1. Filtros para Pagos en RECAUDO

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `startDate` | string (YYYY-MM-DD) | No | Fecha de inicio para filtrar pagos en RECAUDO |
| `endDate` | string (YYYY-MM-DD) | No | Fecha de fin para filtrar pagos en RECAUDO |
| `year` | string | No | Año específico para filtrar pagos en RECAUDO |

#### 2. Filtros para Consultas del Sistema

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `consultaType` | string | No | Tipo de consulta: "EC" o "ICS" |
| `consultaStartDate` | string (YYYY-MM-DD) | No | Fecha de inicio para filtrar consultas (por defecto: 19 agosto 2025) |
| `consultaEndDate` | string (YYYY-MM-DD) | No | Fecha de fin para filtrar consultas |

### Comportamiento por Defecto

- **Consultas**: Solo se incluyen consultas desde el **19 de agosto de 2025** en adelante
- **Pagos**: Si no se especifica filtro, se usa el año actual
- **Tipo de Consulta**: Si no se especifica, se incluyen tanto EC como ICS

### Ejemplos de Uso

#### 1. Filtrar solo consultas EC del último mes
```http
GET /api/user-stats/match?consultaType=EC&consultaStartDate=2025-08-19&consultaEndDate=2025-09-19
```

#### 2. Filtrar consultas ICS con pagos de un año específico
```http
GET /api/user-stats/match?consultaType=ICS&year=2025
```

#### 3. Filtrar por rango de fechas específico para ambos (consultas y pagos)
```http
GET /api/user-stats/match?consultaStartDate=2025-08-19&consultaEndDate=2025-12-31&startDate=2025-08-19&endDate=2025-12-31
```

#### 4. Solo consultas desde fecha de operación (comportamiento por defecto)
```http
GET /api/user-stats/match
```

### Respuesta del Endpoint

La respuesta incluye:
- `totalConsultasAnalizadas`: Número total de consultas SUCCESS procesadas
- `totalMatches`: Número de matches encontrados entre consultas y pagos
- `totalPagosMedianteApp`: Número de pagos realizados mediante la aplicación (después de la consulta)
- `totalPagosPrevios`: Número de pagos realizados antes de la consulta
- `sumaTotalEncontrado`: Suma de todos los `totalEncontrado` de las consultas
- `sumaTotalPagado`: Suma de todos los pagos encontrados en RECAUDO
- `sumaTotalPagadoMedianteApp`: Suma de pagos realizados mediante la aplicación
- `sumaTotalPagosPrevios`: Suma de pagos realizados antes de consultar
- `periodoConsultado`: Descripción del período analizado
- `matches`: Array con los detalles de cada match encontrado

### Clasificación de Pagos

El sistema ahora clasifica automáticamente los pagos en dos categorías:

1. **Pago mediante aplicación** (`pago_mediante_app`):
   - El usuario consultó y luego pagó
   - Se considera cuando `totalEncontrado > 0` O cuando la fecha de pago es posterior a la fecha de consulta

2. **Pago previo a consulta** (`pago_previo_consulta`):
   - El usuario ya había pagado antes de consultar
   - Se identifica cuando `totalEncontrado = 0` Y la fecha de pago es anterior o igual a la fecha de consulta

Cada match incluye:
- `tipoPago`: Tipo de pago ('pago_mediante_app' o 'pago_previo_consulta')
- `esPagoMedianteApp`: Boolean que indica si fue pago mediante la aplicación

```json
{
  "totalConsultasAnalizadas": 150,
  "totalMatches": 45,
  "totalPagosMedianteApp": 30,
  "totalPagosPrevios": 15,
  "sumaTotalEncontrado": 125000.50,
  "sumaTotalPagado": 98000.25,
  "sumaTotalPagadoMedianteApp": 75000.00,
  "sumaTotalPagosPrevios": 23000.25,
  "periodoConsultado": "Pagos: Año 2025 | Consultas: desde 19 agosto 2025 (Tipo: EC)",
  "matches": [...]
}
```

### Consideraciones para el Frontend

1. **Fecha Mínima**: El frontend debe validar que `consultaStartDate` no sea anterior al 19 de agosto de 2025
2. **Validación de Fechas**: Asegurar que `startDate` <= `endDate` y `consultaStartDate` <= `consultaEndDate`
3. **Tipos de Consulta**: Usar un dropdown con opciones "EC", "ICS" y "Todos"
4. **Valores por Defecto**: 
   - `consultaStartDate`: 2025-08-19
   - `year`: Año actual
   - `consultaType`: Todos (no enviar parámetro)

### Autenticación

- **Requerida**: JWT Token válido
- **Roles**: ADMIN o USER_ADMIN
- **Header**: `Authorization: Bearer <token>`

### Códigos de Respuesta

- `200`: Éxito
- `401`: No autorizado (token inválido o faltante)
- `403`: Prohibido (rol insuficiente)
- `400`: Parámetros inválidos
- `500`: Error interno del servidor