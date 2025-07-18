# API de Reportes - Documentación Completa

## Endpoint Principal
```
POST /api/reportes/generar
```

## Autenticación Requerida
- JWT Token en cookies (`access_token`)
- Rol: `ADMIN` o `USER`

## Estructura del Request

### Headers
```http
Content-Type: application/json
Cookie: access_token=<jwt_token>
```

### Body Base
```typescript
interface GenerarReporteRequest {
  tipo: 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL';
  periodo: 'MENSUAL' | 'ANUAL';
  fechaInicio?: string;    // ISO Date string (opcional)
  fechaFin?: string;       // ISO Date string (opcional)
  mercados?: string[];     // Array de IDs de mercados (opcional)
  locales?: string[];      // Array de IDs de locales (opcional)
  formato?: 'JSON' | 'PDF' | 'EXCEL'; // Formato de salida (opcional, default: JSON)
}
```

## Tipos de Reportes

### 1. REPORTE FINANCIERO
Proporciona análisis financiero completo de facturas y recaudación.

#### Request Example
```bash
curl -X POST "http://localhost:3000/api/reportes/generar" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "tipo": "FINANCIERO",
    "periodo": "MENSUAL",
    "mercados": ["uuid-mercado-1", "uuid-mercado-2"],
    "formato": "JSON"
  }'
```

#### Response Structure
```typescript
interface ReporteFinancieroResponse {
  success: true;
  data: {
    resumen: {
      total_recaudado: number;     // Total en dinero recaudado
      total_facturas: number;      // Cantidad total de facturas
      promedio_factura: number;    // Promedio por factura
    };
    por_estado: {
      [estado: string]: {
        cantidad: number;          // Cantidad de facturas
        monto: number;            // Monto total del estado
      }
    };
    por_mercado: Array<{
      mercado_id: string;
      nombre_mercado: string;
      total_recaudado: number;
      total_facturas: number;
      facturas_pagadas: number;
      total_locales: number;
    }>;
  };
  metadata: MetadataResponse;
  filtros_aplicados: FiltrosAplicados;
}
```

#### Response Example
```json
{
  "success": true,
  "data": {
    "resumen": {
      "total_recaudado": 6480,
      "total_facturas": 27,
      "promedio_factura": 240
    },
    "por_estado": {
      "PAGADA": {
        "cantidad": 7,
        "monto": 1395
      },
      "PENDIENTE": {
        "cantidad": 20,
        "monto": 5085
      }
    },
    "por_mercado": [
      {
        "mercado_id": "4604695e-b177-44b8-93c3-3fa5f90a8263",
        "nombre_mercado": "Mercado Zonal Belén",
        "total_recaudado": 750,
        "total_facturas": 3,
        "facturas_pagadas": 0,
        "total_locales": 1277
      }
    ]
  },
  "metadata": {
    "tipo": "FINANCIERO",
    "periodo": {
      "inicio": "2025-07-01T06:00:00.000Z",
      "fin": "2025-07-31T06:00:00.000Z"
    },
    "formato": "JSON",
    "tiempo_procesamiento": "1988ms",
    "timestamp": "2025-07-18T21:06:34.152Z",
    "usuario": "mougrind"
  },
  "filtros_aplicados": {
    "mercados": [],
    "locales": []
  }
}
```

### 2. REPORTE OPERACIONAL
Proporciona métricas operacionales y de rendimiento del sistema.

#### Request Example
```bash
curl -X POST "http://localhost:3000/api/reportes/generar" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "tipo": "OPERACIONAL",
    "periodo": "ANUAL"
  }'
```

#### Response Structure
```typescript
interface ReporteOperacionalResponse {
  success: true;
  data: {
    estadisticas: {
      total_facturas: number;      // Total de facturas en el período
      mercados_activos: number;    // Mercados con actividad
      locales_activos: number;     // Locales con actividad
    };
    rendimiento: {
      facturas_hoy: number;        // Facturas creadas hoy
      eficiencia: 'ALTA' | 'MEDIA' | 'BAJA'; // Clasificación de eficiencia
    };
  };
  metadata: MetadataResponse;
  filtros_aplicados: FiltrosAplicados;
}
```

#### Response Example
```json
{
  "success": true,
  "data": {
    "estadisticas": {
      "total_facturas": 27,
      "mercados_activos": 5,
      "locales_activos": 13
    },
    "rendimiento": {
      "facturas_hoy": 0,
      "eficiencia": "BAJA"
    }
  },
  "metadata": {
    "tipo": "OPERACIONAL",
    "periodo": {
      "inicio": "2025-07-01T06:00:00.000Z",
      "fin": "2025-07-31T06:00:00.000Z"
    },
    "formato": "JSON",
    "tiempo_procesamiento": "125ms",
    "timestamp": "2025-07-18T21:06:18.089Z",
    "usuario": "mougrind"
  },
  "filtros_aplicados": {
    "mercados": [],
    "locales": []
  }
}
```

### 3. REPORTE POR MERCADO
Proporciona análisis detallado agrupado por mercado.

#### Request Example
```bash
curl -X POST "http://localhost:3000/api/reportes/generar" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "tipo": "MERCADO",
    "periodo": "MENSUAL",
    "mercados": ["uuid-mercado-específico"]
  }'
```

#### Response Structure
```typescript
interface ReporteMercadoResponse {
  success: true;
  data: {
    mercados: Array<{
      mercado_id: string;
      nombre_mercado: string;
      total_recaudado: number;     // Total recaudado en el mercado
      total_facturas: number;      // Cantidad de facturas del mercado
      facturas_pagadas: number;    // Facturas pagadas en el mercado
      total_locales: number;       // Cantidad de locales en el mercado
    }>;
  };
  metadata: MetadataResponse;
  filtros_aplicados: FiltrosAplicados;
}
```

### 4. REPORTE POR LOCAL
Proporciona análisis detallado a nivel de local individual.

#### Request Example
```bash
curl -X POST "http://localhost:3000/api/reportes/generar" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "tipo": "LOCAL",
    "periodo": "MENSUAL",
    "locales": ["uuid-local-1", "uuid-local-2"]
  }'
```

#### Response Structure
```typescript
interface ReporteLocalResponse {
  success: true;
  data: {
    locales: Array<{
      id: string;
      numero_local: string;
      nombre_local: string;
      mercado: string;             // Nombre del mercado
      total_facturas: number;      // Facturas del local
      total_recaudado: number;     // Total recaudado del local
      facturas_pagadas: number;    // Facturas pagadas del local
    }>;
  };
  metadata: MetadataResponse;
  filtros_aplicados: FiltrosAplicados;
}
```

## Estructuras Comunes

### Metadata Response
```typescript
interface MetadataResponse {
  tipo: 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL';
  periodo: {
    inicio: string;              // ISO Date string
    fin: string;                 // ISO Date string
  };
  formato: 'JSON' | 'PDF' | 'EXCEL';
  tiempo_procesamiento: string; // Ej: "125ms"
  timestamp: string;            // ISO Date string
  usuario: string;              // Username del usuario autenticado
}
```

### Filtros Aplicados
```typescript
interface FiltrosAplicados {
  mercados: string[];           // Array de IDs de mercados filtrados
  locales: string[];            // Array de IDs de locales filtrados
}
```

## Manejo de Errores

### Error de Validación (400)
```json
{
  "message": [
    "Tipo debe ser: FINANCIERO, OPERACIONAL, MERCADO o LOCAL",
    "property ano should not exist"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error de Autenticación (401)
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### Error del Servidor (500)
```json
{
  "success": false,
  "error": "Error interno del servidor",
  "timestamp": "2025-07-18T21:06:18.089Z"
}
```

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200    | Reporte generado exitosamente |
| 400    | Error de validación en los parámetros |
| 401    | No autenticado o token inválido |
| 403    | Sin permisos para generar reportes |
| 500    | Error interno del servidor |

## Filtros Avanzados

### Por Fecha Personalizada
```json
{
  "tipo": "FINANCIERO",
  "periodo": "MENSUAL",
  "fechaInicio": "2025-06-01T00:00:00.000Z",
  "fechaFin": "2025-06-30T23:59:59.000Z"
}
```

### Por Mercados Específicos
```json
{
  "tipo": "OPERACIONAL",
  "periodo": "ANUAL",
  "mercados": [
    "4604695e-b177-44b8-93c3-3fa5f90a8263",
    "866595cc-c500-4eec-a625-92dee38bc244"
  ]
}
```

### Por Locales Específicos
```json
{
  "tipo": "LOCAL",
  "periodo": "MENSUAL",
  "locales": [
    "00069D3C-B1A2-45A9-8EB0-CBAE695775DA",
    "005380B2-35EA-4A0F-B8A9-15C2634ED928"
  ]
}
```

## Ejemplos de Uso para Frontend

### React/TypeScript Example
```typescript
interface ReporteRequest {
  tipo: 'FINANCIERO' | 'OPERACIONAL' | 'MERCADO' | 'LOCAL';
  periodo: 'MENSUAL' | 'ANUAL';
  fechaInicio?: string;
  fechaFin?: string;
  mercados?: string[];
  locales?: string[];
  formato?: 'JSON' | 'PDF' | 'EXCEL';
}

const generarReporte = async (request: ReporteRequest) => {
  try {
    const response = await fetch('/api/reportes/generar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Para incluir cookies
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generando reporte:', error);
    throw error;
  }
};

// Uso
const reporte = await generarReporte({
  tipo: 'FINANCIERO',
  periodo: 'MENSUAL',
  mercados: ['uuid-mercado-1']
});
```

### JavaScript Vanilla Example
```javascript
async function generarReporte(tipoReporte, periodo, filtros = {}) {
  const requestBody = {
    tipo: tipoReporte,
    periodo: periodo,
    ...filtros
  };

  try {
    const response = await fetch('/api/reportes/generar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (data.success) {
      return data;
    } else {
      throw new Error(data.error || 'Error generando reporte');
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Ejemplos de uso
generarReporte('FINANCIERO', 'MENSUAL')
  .then(data => console.log('Reporte financiero:', data));

generarReporte('OPERACIONAL', 'ANUAL', { 
  mercados: ['uuid-1', 'uuid-2'] 
})
  .then(data => console.log('Reporte operacional:', data));
```

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren autenticación JWT via cookies
2. **Permisos**: Solo usuarios con rol `ADMIN` o `USER` pueden generar reportes
3. **Filtros**: Los filtros de `mercados` y `locales` son opcionales y se aplican como AND
4. **Fechas**: Si no se especifican `fechaInicio` y `fechaFin`, se usa el mes actual por defecto
5. **Performance**: Los reportes pueden tomar tiempo según la cantidad de datos
6. **Límites**: No hay límites específicos, pero se recomienda usar filtros para mejorar performance

## Endpoints Adicionales

### Configuración de Reportes
```
GET /api/reportes/configuracion
```
Devuelve la configuración disponible para reportes (mercados disponibles, tipos de reporte, etc.)

### Test de Conexión
```
GET /api/reportes/test
```
Endpoint de prueba para verificar conectividad y autenticación.
