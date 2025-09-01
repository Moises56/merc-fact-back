# 📋 Endpoints de Consulta ICS para Angular

## 📍 Endpoints Disponibles

### 1. Consulta ICS Normal
**Endpoint:** `GET /consultaICS`

**Parámetros de consulta:**
```typescript
interface ConsultaICSParams {
  ics?: string;        // Número de empresa ICS (ej: "ICS-107444")
  dni?: string;        // DNI (13 dígitos) o RTN (14 dígitos)
}
```

**Validación:** Debe proporcionar al menos `ics` O `dni`

**Ejemplos de uso:**
```typescript
// Por número ICS
GET /consultaICS?ics=ICS-107444

// Por DNI/RTN
GET /consultaICS?dni=08019022363089

// Con ambos parámetros
GET /consultaICS?ics=ICS-107444&dni=08019022363089
```

### 2. Consulta ICS con Amnistía
**Endpoint:** `GET /consultaICS/amnistia`

**Parámetros:** Mismos que la consulta normal

**Ejemplos de uso:**
```typescript
// Por número ICS con amnistía
GET /consultaICS/amnistia?ics=ICS-107444

// Por DNI/RTN con amnistía
GET /consultaICS/amnistia?dni=08019022363089
```

## ✅ Respuestas de Éxito (200 OK)

### Estructura de Respuesta
```typescript
interface ConsultaICSResponse {
  nombre: string;                    // Nombre del contribuyente
  identidad: string;                 // RTN/DNI
  fecha: string;                     // Fecha de consulta (DD/MM/YYYY)
  hora: string;                      // Hora de consulta (HH:MM:SS a/p. m.)
  
  // Para consultas por ICS (respuesta individual)
  numeroEmpresa?: string;            // Número de empresa ICS
  mes?: string;                      // Mes de la obligación
  detallesMora?: DetalleMoraICS[];   // Detalles por año
  
  // Para consultas por DNI/RTN (respuesta agrupada)
  empresas?: PropiedadICS[];         // Array de empresas del contribuyente
  
  // Totales generales
  totalGeneral: string;              // Total formateado (ej: "L 60,477.08")
  totalGeneralNumerico: number;      // Total numérico (ej: 60477.08)
  
  // Descuento de pronto pago
  descuentoProntoPago: string;       // Descuento formateado (ej: "L 137.40")
  descuentoProntoPagoNumerico: number; // Descuento numérico (ej: 137.40)
  totalAPagar: string;               // Total después descuento (ej: "L 60,339.68")
  totalAPagarNumerico: number;       // Total numérico después descuento
  
  // Campos de amnistía
  amnistiaVigente?: boolean;         // Si la amnistía está vigente
  fechaFinAmnistia?: string | null;  // Fecha fin amnistía (DD/MM/YYYY)
  
  // Metadatos
  tipoConsulta: 'ics' | 'dni_rtn';   // Tipo de consulta realizada
  ubicacionConsulta?: string;        // Sistema de origen de la consulta
}

interface DetalleMoraICS {
  year: string;                      // Año (ej: "2024")
  impuesto: string;                  // Impuesto formateado (ej: "L 4,200.00")
  trenDeAseo: string;                // Tren de aseo formateado
  tasaBomberos: string;              // Tasa bomberos formateada
  otros: string;                     // Otros impuestos formateados
  recargo: string;                   // Recargo formateado
  total: string;                     // Total del año formateado
  dias: number;                      // Días de mora
  
  // Valores numéricos para cálculos
  impuestoNumerico: number;
  trenDeAseoNumerico: number;
  tasaBomberosNumerico: number;
  otrosNumerico: number;
  recargoNumerico: number;
  totalNumerico: number;
  
  amnistiaAplicada?: boolean;        // Si se aplicó amnistía a este año
}

interface PropiedadICS {
  numeroEmpresa: string;             // Número de empresa (ej: "ICS-006454")
  mes: string;                       // Descripción del mes/tipo
  detallesMora: DetalleMoraICS[];    // Detalles por año
  totalPropiedad: string;            // Total de esta empresa formateado
  totalPropiedadNumerico: number;    // Total de esta empresa numérico
}
```

### Ejemplo de Respuesta Exitosa (Consulta por DNI)
```json
{
  "nombre": "INVERSIONES JAS, S.A.",
  "identidad": "08019022363089",
  "fecha": "01/08/2025",
  "hora": "02:52:27 p. m.",
  "empresas": [
    {
      "numeroEmpresa": "ICS-006454",
      "mes": "Industria y Comercio 2022-4",
      "detallesMora": [
        {
          "year": "2024",
          "impuesto": "L 4,200.00",
          "trenDeAseo": "L 7,968.00",
          "tasaBomberos": "L 1,920.00",
          "otros": "L 9,009.12",
          "recargo": "L 1,370.96",
          "total": "L 24,468.08",
          "dias": 240,
          "impuestoNumerico": 4200,
          "trenDeAseoNumerico": 7968,
          "tasaBomberosNumerico": 1920,
          "otrosNumerico": 9009.12,
          "recargoNumerico": 1370.96,
          "totalNumerico": 24468.08,
          "amnistiaAplicada": true
        }
      ],
      "totalPropiedad": "L 60,477.08",
      "totalPropiedadNumerico": 60477.08
    }
  ],
  "totalGeneral": "L 60,477.08",
  "totalGeneralNumerico": 60477.08,
  "descuentoProntoPago": "L 137.40",
  "descuentoProntoPagoNumerico": 137.4,
  "totalAPagar": "L 60,339.68",
  "totalAPagarNumerico": 60339.68,
  "amnistiaVigente": true,
  "fechaFinAmnistia": "30/09/2025",
  "tipoConsulta": "dni_rtn",
  "ubicacionConsulta": "Sistema ICS"
}
```json
{
  "nombre": "INVERSIONES JAS, S.A.",
  "identidad": "08019022363089",
  "fecha": "01/08/2025",
  "hora": "02:52:27 p. m.",
  "empresas": [
    {
      "numeroEmpresa": "ICS-006454",
      "mes": "Industria y Comercio 2022-4",
      "detallesMora": [
        {
          "year": "2024",
          "impuesto": "L 4,200.00",
          "trenDeAseo": "L 7,968.00",
          "tasaBomberos": "L 1,920.00",
          "otros": "L 9,009.12",
          "recargo": "L 1,370.96",
          "total": "L 24,468.08",
          "dias": 240,
          "impuestoNumerico": 4200,
          "trenDeAseoNumerico": 7968,
          "tasaBomberosNumerico": 1920,
          "otrosNumerico": 9009.12,
          "recargoNumerico": 1370.96,
          "totalNumerico": 24468.08,
          "amnistiaAplicada": true
        }
      ],
      "totalPropiedad": "L 60,477.08",
      "totalPropiedadNumerico": 60477.08
    }
  ],
  "totalGeneral": "L 60,477.08",
  "totalGeneralNumerico": 60477.08,
  "descuentoProntoPago": "L 137.40",
  "descuentoProntoPagoNumerico": 137.4,
  "totalAPagar": "L 60,339.68",
  "totalAPagarNumerico": 60339.68,
  "amnistiaVigente": true,
  "fechaFinAmnistia": "30/09/2025",
  "tipoConsulta": "ics",
  "ubicacionConsulta": "Sistema ICS"
}
```

## ❌ Respuestas de Error

### 1. Error de Validación (400 Bad Request)
```json
{
  "message": [
    "Debe proporcionar al menos ics o dni/rtn"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 2. No se encontraron registros (404 Not Found)
```json
{
  "message": "No se encontraron registros para los parámetros proporcionados",
  "error": "Not Found",
  "statusCode": 404
}
```

### 3. Error interno del servidor (500 Internal Server Error)
```json
{
  "message": "Error interno del servidor",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

## 🔧 Servicio Angular de Ejemplo

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsultaIcsService {
  private readonly baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  // Consulta normal por ICS
  consultarPorICS(ics: string): Observable<ConsultaICSResponse> {
    const params = new HttpParams().set('ics', ics);
    return this.http.get<ConsultaICSResponse>(`${this.baseUrl}/consultaICS`, { params });
  }

  // Consulta normal por DNI/RTN
  consultarPorDNI(dni: string): Observable<ConsultaICSResponse> {
    const params = new HttpParams().set('dni', dni);
    return this.http.get<ConsultaICSResponse>(`${this.baseUrl}/consultaICS`, { params });
  }

  // Consulta con amnistía por ICS
  consultarConAmnistiaPorICS(ics: string): Observable<ConsultaICSResponse> {
    const params = new HttpParams().set('ics', ics);
    return this.http.get<ConsultaICSResponse>(`${this.baseUrl}/consultaICS/amnistia`, { params });
  }

  // Consulta con amnistía por DNI/RTN
  consultarConAmnistiaPorDNI(dni: string): Observable<ConsultaICSResponse> {
    const params = new HttpParams().set('dni', dni);
    return this.http.get<ConsultaICSResponse>(`${this.baseUrl}/consultaICS/amnistia`, { params });
  }
}
```

## 📝 Notas Importantes

1. **Validación:** Debe proporcionar al menos `ics` O `dni`, no ambos son requeridos pero al menos uno sí.

2. **Descuento de Pronto Pago:** Se aplica automáticamente si:
   - Se consulta dentro de los primeros 10 días del mes
   - Hay al menos 4 meses completos restantes en el año
   - Se aplica a los meses desde (mes actual + 4) hasta diciembre
   - Excluye "Obligación de Contrato"

3. **Amnistía:** Los endpoints con `/amnistia` aplican descuentos por amnistía tributaria vigente hasta el 30/09/2025.

4. **Formato de Moneda:** Todos los valores monetarios se devuelven formateados con "L" y también en formato numérico para cálculos.

5. **Cache:** El sistema implementa cache de 10 minutos para optimizar rendimiento.

6. **Logs:** Todas las consultas se registran con timestamp y parámetros.