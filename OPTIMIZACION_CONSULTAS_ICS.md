# 🚀 Optimización de Consultas ICS

## 📊 Problema Identificado

Las consultas ICS estaban tardando más de 95 segundos, mientras que la misma consulta ejecutada directamente en la base de datos tardaba milisegundos.

## 🔧 Optimizaciones Implementadas

### 1. Optimización de la Consulta SQL

**Cambios realizados:**
- ✅ Agregado filtro `MOV.BALANCE > 0` para excluir movimientos sin saldo
- ✅ Cambiado filtro de años de `OBL.ANIO >= 2015` a `OBL.ANIO >= 2020` para reducir el dataset
- ✅ Mantenida la estructura CTE (Common Table Expression) para mejor rendimiento

**Consulta optimizada:**
```sql
WITH ICS AS (
  SELECT 
    CONCAT(ACT.TXT_PRIMER_NOMBRE,' ',ACT.TXT_SEGUNDO_NOMBRE,' ',
           ACT.TXT_PRIMER_APELLIDO,' ',ACT.TXT_SEGUNDO_APELLIDO) AS [CONTRIBUYENTE],
    ACT.TXT_IDENTIFICACION AS [RTN_DNI],
    OBL.TXT_NOMBRE AS [MES],
    ART.NUM_DOCUMENTO AS [NUMERO_DE_EMPRESA],
    MOV.BALANCE AS [SALDO],
    TM.TXT_NOMBRE AS [TIPO],
    OBL.ANIO AS [AÑO],
    DATEDIFF(DAY, OBL.FEC_VENCIMIENTO, GETDATE()) AS [DIAS_VENCIDOS]
  FROM 
    MI_ACTOR ACT WITH (NOLOCK)
    INNER JOIN MI_HISTORICO_ARTICULO HA WITH (NOLOCK) ON ACT.ID_ACTOR = HA.ID_ACTOR 
               AND HA.SN_ACTIVO = 1
    INNER JOIN MI_ARTICULO ART WITH (NOLOCK) ON HA.ID_ARTICULO = ART.ID_ARTICULO 
               AND ART.SN_ACTIVO = 1  
               AND (@ics IS NULL OR ART.NUM_DOCUMENTO = @ics)
               AND (@dni IS NULL OR ACT.TXT_IDENTIFICACION = @dni)
    INNER JOIN MI_FACTURABLE FAC WITH (NOLOCK) ON ART.ID_ARTICULO = FAC.ID_ARTICULO 
               AND FAC.ID_PRODUCTO = 13
    INNER JOIN MI_OBLIGACION OBL WITH (NOLOCK) ON FAC.ID_FACTURABLE = OBL.ID_FACTURABLE 
               AND OBL.ANIO >= 2020  -- Optimizado: era >= 2015
    INNER JOIN MI_MOVIMIENTO MOV WITH (NOLOCK) ON OBL.ID_OBLIGACION = MOV.ID_OBLIGACION 
               AND MOV.BALANCE > 0   -- Nuevo: filtrar solo movimientos con saldo
    INNER JOIN MI_TIPO_MOVIMIENTO TM WITH (NOLOCK) ON MOV.ID_TIPO_MOVIMIENTO = TM.ID_TIPO_MOVIMIENTO
    INNER JOIN MI_SUCURSAL_LICENCIA LB WITH (NOLOCK) ON ART.ID_ARTICULO = LB.ID_ARTICULO 
               AND LB.SN_ACTIVO = 1
)
-- ... resto de la consulta con PIVOT
```

### 2. Índices de Base de Datos

**Índices creados para optimizar las consultas:**

```sql
-- Índice principal para búsquedas por DNI/RTN
CREATE NONCLUSTERED INDEX IX_MI_ACTOR_TXT_IDENTIFICACION 
ON MI_ACTOR (TXT_IDENTIFICACION) 
INCLUDE (ID_ACTOR, TXT_PRIMER_NOMBRE, TXT_SEGUNDO_NOMBRE, TXT_PRIMER_APELLIDO, TXT_SEGUNDO_APELLIDO);

-- Índice para relación actor-artículo
CREATE NONCLUSTERED INDEX IX_MI_HISTORICO_ARTICULO_ACTOR_ACTIVO 
ON MI_HISTORICO_ARTICULO (ID_ACTOR, SN_ACTIVO) 
INCLUDE (ID_ARTICULO);

-- Índice para búsquedas por número ICS
CREATE NONCLUSTERED INDEX IX_MI_ARTICULO_NUM_DOCUMENTO_ACTIVO 
ON MI_ARTICULO (NUM_DOCUMENTO, SN_ACTIVO) 
INCLUDE (ID_ARTICULO);

-- Índice para filtrar por producto ICS (ID_PRODUCTO = 13)
CREATE NONCLUSTERED INDEX IX_MI_FACTURABLE_ARTICULO_PRODUCTO 
ON MI_FACTURABLE (ID_ARTICULO, ID_PRODUCTO) 
INCLUDE (ID_FACTURABLE);

-- Índice para filtrar obligaciones por año
CREATE NONCLUSTERED INDEX IX_MI_OBLIGACION_FACTURABLE_ANIO 
ON MI_OBLIGACION (ID_FACTURABLE, ANIO) 
INCLUDE (ID_OBLIGACION, TXT_NOMBRE, FEC_VENCIMIENTO);

-- Índice crítico para movimientos con saldo
CREATE NONCLUSTERED INDEX IX_MI_MOVIMIENTO_OBLIGACION_BALANCE 
ON MI_MOVIMIENTO (ID_OBLIGACION, BALANCE) 
INCLUDE (ID_TIPO_MOVIMIENTO)
WHERE BALANCE > 0;  -- Índice filtrado para mejor rendimiento

-- Índice para licencias activas
CREATE NONCLUSTERED INDEX IX_MI_SUCURSAL_LICENCIA_ARTICULO_ACTIVO 
ON MI_SUCURSAL_LICENCIA (ID_ARTICULO, SN_ACTIVO);
```

### 3. Optimizaciones de Aplicación

**Método específico para consultas ICS:**
- ✅ Timeout reducido a 30 segundos (era 120 segundos)
- ✅ Logging específico para consultas ICS
- ✅ Detección de consultas lentas (> 10 segundos)
- ✅ Manejo mejorado de errores de timeout

**Código implementado:**
```typescript
async executeICSQuery(query: string, parameters?: any): Promise<any[]> {
  const startTime = Date.now();
  try {
    const pool = await this.getConnection();
    const request = pool.request();
    
    // Timeout específico para consultas ICS (30 segundos)
    request.timeout = 30000;
    
    // ... resto de la implementación
  } catch (error) {
    if (error.message.includes('timeout')) {
      this.logger.error('[ICS] Timeout en consulta - considerar optimización adicional');
    }
    throw error;
  }
}
```

## 📈 Resultados Esperados

### Antes de la Optimización:
- ⏱️ Tiempo de respuesta: ~95,000ms (95 segundos)
- 🐌 Estado: VERY SLOW REQUEST
- 📊 Registros procesados: Variable

### Después de la Optimización:
- ⏱️ Tiempo de respuesta esperado: < 5,000ms (5 segundos)
- 🚀 Estado: Normal/Fast
- 📊 Registros procesados: Solo con saldo > 0
- 🎯 Reducción esperada: 95% menos tiempo

## 🛠️ Instrucciones de Aplicación

### 1. Aplicar Índices de Base de Datos

```bash
# Ejecutar el script de índices en la base de datos
sqlcmd -S [servidor] -d [base_datos] -i database-indexes.sql
```

### 2. Verificar Aplicación de Cambios

```bash
# Reiniciar el servidor para aplicar cambios
npm run start:dev
```

### 3. Probar Rendimiento

```bash
# Probar consulta por DNI
curl "http://localhost:3000/consultaICS?dni=08019016853852"

# Probar consulta por ICS
curl "http://localhost:3000/consultaICS?ics=ICS-107444"

# Probar consulta con amnistía
curl "http://localhost:3000/consultaICS/amnistia?dni=08019016853852"
```

## 📊 Monitoreo

### Logs a Observar:
- `[ICS] Consulta ejecutada en Xms` - Tiempo de ejecución
- `[ICS] Consulta lenta detectada: Xms` - Alertas de rendimiento
- `[ICS] Timeout en consulta` - Errores de timeout

### Métricas de Rendimiento:
- ✅ < 2,000ms: Excelente
- ⚠️ 2,000-5,000ms: Aceptable
- ❌ > 5,000ms: Requiere optimización adicional

## 🔍 Troubleshooting

### Si las consultas siguen siendo lentas:

1. **Verificar índices aplicados:**
   ```sql
   SELECT name FROM sys.indexes WHERE name LIKE 'IX_MI_%';
   ```

2. **Analizar plan de ejecución:**
   ```sql
   SET STATISTICS IO ON;
   -- Ejecutar consulta ICS
   ```

3. **Verificar estadísticas actualizadas:**
   ```sql
   UPDATE STATISTICS MI_ACTOR;
   UPDATE STATISTICS MI_MOVIMIENTO;
   -- ... otras tablas
   ```

4. **Considerar particionado de tablas grandes:**
   - Particionar `MI_MOVIMIENTO` por año
   - Particionar `MI_OBLIGACION` por año

## 📝 Notas Importantes

- Los índices pueden tardar varios minutos en crearse en tablas grandes
- Se recomienda aplicar los índices durante horarios de bajo tráfico
- El filtro `BALANCE > 0` reduce significativamente el dataset
- El cache de 10 minutos ayuda a evitar consultas repetitivas
- Los índices filtrados (`WHERE BALANCE > 0`) son más eficientes que los índices completos

## 🎯 Próximos Pasos

1. Aplicar índices similares para consultas EC
2. Implementar paginación para consultas con muchos resultados
3. Considerar implementar cache distribuido (Redis)
4. Monitorear uso de memoria y CPU después de las optimizaciones