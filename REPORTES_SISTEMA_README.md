# 📊 Sistema de Reportes - Mer-Fact-Back

## 🎯 Resumen Ejecutivo

El sistema de reportes de Mer-Fact-Back proporciona análisis completos de datos financieros y operacionales para mercados y locales. Incluye 4 tipos de reportes especializados con múltiples formatos de salida y filtros avanzados.

## 🏗️ Arquitectura del Sistema

```
📦 Sistema de Reportes
├── 🎯 Endpoint Principal: POST /api/reportes/generar
├── 🔐 Autenticación: JWT via Cookies
├── 📊 4 Tipos de Reportes
├── 🎨 3 Formatos de Salida
└── 🔍 Filtros Dinámicos
```

## 📋 Tipos de Reportes Disponibles

### 1. 💰 REPORTE FINANCIERO
**Propósito**: Análisis financiero completo con métricas de recaudación

**Incluye**:
- ✅ Total recaudado y promedio por factura
- ✅ Distribución por estados de facturas
- ✅ Análisis por mercado con totales y locales activos
- ✅ Métricas de eficiencia de cobro

**Ideal para**: CFO, Gerencia Financiera, Control de Gestión

### 2. ⚙️ REPORTE OPERACIONAL
**Propósito**: Métricas operacionales y de rendimiento del sistema

**Incluye**:
- ✅ Estadísticas de facturas y actividad
- ✅ Mercados y locales activos
- ✅ Rendimiento diario y eficiencia
- ✅ Indicadores clave de desempeño

**Ideal para**: Gerencia Operacional, IT, Administración

### 3. 🏢 REPORTE POR MERCADO
**Propósito**: Análisis detallado agrupado por mercado

**Incluye**:
- ✅ Performance individual de cada mercado
- ✅ Recaudación y cantidad de facturas por mercado
- ✅ Número de locales activos por mercado
- ✅ Comparativas entre mercados

**Ideal para**: Administradores de Mercado, Supervisores Zonales

### 4. 🏪 REPORTE POR LOCAL
**Propósito**: Análisis granular a nivel de local comercial

**Incluye**:
- ✅ Performance individual de cada local
- ✅ Recaudación específica por local
- ✅ Estado de facturas por local
- ✅ Identificación de locales con mejor/peor rendimiento

**Ideal para**: Administradores de Locales, Cobradores

## 🎛️ Configuración de Reportes

### Períodos Disponibles
- **MENSUAL**: Análisis del mes actual o específico
- **ANUAL**: Análisis del año actual o específico

### Formatos de Salida
- **JSON**: Para consumo en aplicaciones web/móviles
- **PDF**: Para impresión y presentaciones
- **EXCEL**: Para análisis adicional y manipulación de datos

### Filtros Disponibles
- **📅 Rango de Fechas**: fechaInicio y fechaFin (opcional)
- **🏢 Mercados Específicos**: Array de IDs de mercados (opcional)
- **🏪 Locales Específicos**: Array de IDs de locales (opcional)

## 🚀 Guía de Implementación Frontend

### 1. Instalación y Setup

```bash
# Si usas npm
npm install axios date-fns

# Si usas yarn
yarn add axios date-fns
```

### 2. Configuración Básica

```typescript
// Copiar el archivo reportes-frontend-helpers.ts a tu proyecto
import { ReportesService, useReportes } from './utils/reportes-frontend-helpers';

// Configurar la URL base
const reportesService = new ReportesService('/api/reportes');
```

### 3. Implementación en React

```jsx
import React, { useState } from 'react';
import { useReportes, TIPOS_REPORTE, PERIODOS_REPORTE } from './utils/reportes-frontend-helpers';

function ComponenteReportes() {
  const { loading, error, data, generarReporte } = useReportes();
  const [filtros, setFiltros] = useState({
    tipo: 'FINANCIERO',
    periodo: 'MENSUAL'
  });

  const handleGenerar = async () => {
    await generarReporte(filtros);
  };

  return (
    <div>
      {/* UI para seleccionar filtros */}
      <button onClick={handleGenerar} disabled={loading}>
        {loading ? 'Generando...' : 'Generar Reporte'}
      </button>
      
      {/* Mostrar resultados */}
      {data && <ReporteResultados data={data} />}
    </div>
  );
}
```

### 4. Implementación en Angular

```typescript
// reporte.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  constructor(private http: HttpClient) {}

  generarReporte(request: any): Observable<any> {
    return this.http.post('/api/reportes/generar', request, {
      withCredentials: true // Para incluir cookies JWT
    });
  }
}
```

### 5. Implementación en Vue.js

```javascript
// composables/useReportes.js
import { ref } from 'vue';

export function useReportes() {
  const loading = ref(false);
  const data = ref(null);
  const error = ref(null);

  const generarReporte = async (filtros) => {
    loading.value = true;
    try {
      const response = await fetch('/api/reportes/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(filtros)
      });
      data.value = await response.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return { loading, data, error, generarReporte };
}
```

## 🔧 API Reference Rápida

### Request Básico
```http
POST /api/reportes/generar
Content-Type: application/json
Cookie: jwt=your_jwt_token

{
  "tipo": "FINANCIERO",
  "periodo": "MENSUAL"
}
```

### Response Ejemplo
```json
{
  "success": true,
  "metadata": {
    "tipo": "FINANCIERO",
    "periodo": {
      "inicio": "2024-01-01T00:00:00.000Z",
      "fin": "2024-01-31T23:59:59.999Z"
    },
    "formato": "JSON",
    "tiempo_procesamiento": "1.23s",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "usuario": "admin"
  },
  "filtros_aplicados": {
    "mercados": [],
    "locales": []
  },
  "data": {
    "resumen": {
      "total_recaudado": 15750.50,
      "total_facturas": 125,
      "promedio_factura": 126.00
    }
  }
}
```

## 🎨 Componentes UI Sugeridos

### 1. Selector de Tipo de Reporte
```jsx
<select value={tipo} onChange={handleTipoChange}>
  <option value="FINANCIERO">📊 Reporte Financiero</option>
  <option value="OPERACIONAL">⚙️ Reporte Operacional</option>
  <option value="MERCADO">🏢 Por Mercado</option>
  <option value="LOCAL">🏪 Por Local</option>
</select>
```

### 2. Tarjetas de Resumen
```jsx
<div className="reporte-cards">
  <Card>
    <h3>💰 Total Recaudado</h3>
    <span className="amount">L. {formatearMoneda(data.resumen.total_recaudado)}</span>
  </Card>
  <Card>
    <h3>📄 Total Facturas</h3>
    <span className="count">{data.resumen.total_facturas}</span>
  </Card>
</div>
```

### 3. Tabla de Resultados
```jsx
<table className="reporte-table">
  <thead>
    <tr>
      <th>Mercado</th>
      <th>Recaudación</th>
      <th>Facturas</th>
      <th>Locales</th>
    </tr>
  </thead>
  <tbody>
    {data.por_mercado.map(mercado => (
      <tr key={mercado.mercado_id}>
        <td>{mercado.nombre_mercado}</td>
        <td>{formatearMoneda(mercado.total_recaudado)}</td>
        <td>{mercado.total_facturas}</td>
        <td>{mercado.total_locales}</td>
      </tr>
    ))}
  </tbody>
</table>
```

## 🔒 Consideraciones de Seguridad

### Autenticación
- ✅ **JWT obligatorio**: Todos los endpoints requieren autenticación
- ✅ **Cookies httpOnly**: Token seguro contra XSS
- ✅ **Expiración**: Tokens con tiempo de vida limitado

### Autorización
- ✅ **Validación de roles**: Solo usuarios autorizados pueden generar reportes
- ✅ **Filtros de acceso**: Los usuarios solo ven datos de sus mercados/locales asignados
- ✅ **Audit trail**: Todos los reportes generados se registran

### Protección de Datos
- ✅ **Validación estricta**: Todos los parámetros son validados
- ✅ **Rate limiting**: Protección contra abuso de la API
- ✅ **Sanitización**: Prevención de inyecciones SQL

## 📈 Optimización y Performance

### Caching
- ✅ **Cache de consultas**: Resultados similares se cachean temporalmente
- ✅ **Optimización de queries**: Consultas SQL optimizadas con índices
- ✅ **Paginación**: Para reportes con muchos registros

### Escalabilidad
- ✅ **Procesamiento asíncrono**: Para reportes grandes
- ✅ **Streaming de datos**: Para archivos PDF/Excel grandes
- ✅ **Compresión**: Respuestas JSON comprimidas con gzip

## 🐛 Troubleshooting Común

### Error: "property should not exist"
**Solución**: Verificar que el DTO tenga las validaciones correctas
```typescript
@IsEnum(TipoReporte)
tipo: TipoReporte;
```

### Error: 401 Unauthorized
**Solución**: Verificar que las cookies JWT se están enviando
```javascript
credentials: 'include' // En fetch
withCredentials: true  // En axios
```

### Error: 500 Internal Server Error
**Solución**: Verificar logs del servidor y conexión a base de datos

### Reporte vacío
**Solución**: Verificar filtros de fecha y disponibilidad de datos

## 📞 Soporte y Contacto

- **Documentación técnica**: `REPORTES_API_DOCUMENTATION.md`
- **Ejemplos JSON**: `reportes-api-examples.json`
- **Helpers Frontend**: `reportes-frontend-helpers.ts`
- **Testing**: Postman Collection incluida

---

**🎉 ¡El sistema de reportes está listo para producción!** 

Todos los endpoints han sido probados y validados. La documentación está completa y los helpers de frontend están disponibles para acelerar el desarrollo.

**Próximos pasos recomendados**:
1. 🎨 Implementar interfaces de usuario usando los helpers proporcionados
2. 📊 Agregar gráficos y visualizaciones de datos
3. 📱 Adaptar para dispositivos móviles
4. 🔔 Configurar notificaciones para reportes programados
5. 📧 Implementar envío automático de reportes por email
