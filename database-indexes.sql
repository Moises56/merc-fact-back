-- Índices optimizados para mejorar el rendimiento del dashboard
-- Ejecutar estos comandos en SQL Server Management Studio

-- 1. Índice compuesto para consultas de facturas por estado y fecha
CREATE NONCLUSTERED INDEX IX_Facturas_Estado_FechaPago_Monto
ON facturas (estado, fecha_pago)
INCLUDE (monto, localId, createdAt)
WITH (ONLINE = ON, FILLFACTOR = 90);

-- 2. Índice para consultas de facturas por local
CREATE NONCLUSTERED INDEX IX_Facturas_LocalId_Estado
ON facturas (localId, estado)
INCLUDE (monto, fecha_pago, createdAt)
WITH (ONLINE = ON, FILLFACTOR = 90);

-- 3. Índice para consultas de locales activos
CREATE NONCLUSTERED INDEX IX_Locales_EstadoLocal_MercadoId
ON locales (estado_local, mercadoId)
INCLUDE (nombre_local, numero_local)
WITH (ONLINE = ON, FILLFACTOR = 95);

-- 4. Índice para mercados activos
CREATE NONCLUSTERED INDEX IX_Mercados_IsActive
ON mercados (isActive)
INCLUDE (nombre_mercado)
WITH (ONLINE = ON, FILLFACTOR = 95);

-- 5. Índice para usuarios activos
CREATE NONCLUSTERED INDEX IX_Users_IsActive
ON users (isActive)
INCLUDE (email, nombre)
WITH (ONLINE = ON, FILLFACTOR = 95);

-- 6. Índice para consultas de facturas por año/mes
CREATE NONCLUSTERED INDEX IX_Facturas_CreatedAt_Estado
ON facturas (createdAt, estado)
INCLUDE (monto, localId)
WITH (ONLINE = ON, FILLFACTOR = 90);

-- 7. Índice para optimizar JOINs entre facturas y locales
CREATE NONCLUSTERED INDEX IX_Facturas_LocalId_Include
ON facturas (localId)
INCLUDE (estado, monto, fecha_pago, createdAt)
WITH (ONLINE = ON, FILLFACTOR = 90);

-- 8. Índice para optimizar JOINs entre locales y mercados
CREATE NONCLUSTERED INDEX IX_Locales_MercadoId_Include
ON locales (mercadoId)
INCLUDE (estado_local, nombre_local, numero_local)
WITH (ONLINE = ON, FILLFACTOR = 95);

-- 9. Índice para consultas de auditoría (si existe tabla AuditLog)
-- Descomentar si la tabla existe
/*
CREATE NONCLUSTERED INDEX IX_AuditLog_CreatedAt_Action
ON AuditLog (createdAt, action)
INCLUDE (entityType, entityId, userId)
WITH (ONLINE = ON, FILLFACTOR = 90);
*/

-- 10. Estadísticas para optimizar el plan de consultas
UPDATE STATISTICS facturas WITH FULLSCAN;
UPDATE STATISTICS locales WITH FULLSCAN;
UPDATE STATISTICS mercados WITH FULLSCAN;
UPDATE STATISTICS users WITH FULLSCAN;

-- Verificar que los índices se crearon correctamente
SELECT 
    i.name AS IndexName,
    t.name AS TableName,
    i.type_desc AS IndexType,
    i.fill_factor AS FillFactor,
    s.user_seeks AS UserSeeks,
    s.user_scans AS UserScans,
    s.user_lookups AS UserLookups,
    s.user_updates AS UserUpdates
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
LEFT JOIN sys.dm_db_index_usage_stats s ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE t.name IN ('facturas', 'locales', 'mercados', 'users')
    AND i.name LIKE 'IX_%'
ORDER BY t.name, i.name;

-- Índices específicos para optimizar consultas ICS
-- Estos índices mejoran significativamente el rendimiento de las consultas de estado de cuenta

-- Índice para MI_ACTOR (tabla principal de contribuyentes)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MI_ACTOR_TXT_IDENTIFICACION')
CREATE NONCLUSTERED INDEX IX_MI_ACTOR_TXT_IDENTIFICACION 
ON MI_ACTOR (TXT_IDENTIFICACION) 
INCLUDE (ID_ACTOR, TXT_PRIMER_NOMBRE, TXT_SEGUNDO_NOMBRE, TXT_PRIMER_APELLIDO, TXT_SEGUNDO_APELLIDO);

-- Índice para MI_HISTORICO_ARTICULO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MI_HISTORICO_ARTICULO_ACTOR_ACTIVO')
CREATE NONCLUSTERED INDEX IX_MI_HISTORICO_ARTICULO_ACTOR_ACTIVO 
ON MI_HISTORICO_ARTICULO (ID_ACTOR, SN_ACTIVO) 
INCLUDE (ID_ARTICULO);

-- Índice para MI_ARTICULO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MI_ARTICULO_NUM_DOCUMENTO_ACTIVO')
CREATE NONCLUSTERED INDEX IX_MI_ARTICULO_NUM_DOCUMENTO_ACTIVO 
ON MI_ARTICULO (NUM_DOCUMENTO, SN_ACTIVO) 
INCLUDE (ID_ARTICULO);

-- Índice para MI_FACTURABLE
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MI_FACTURABLE_ARTICULO_PRODUCTO')
CREATE NONCLUSTERED INDEX IX_MI_FACTURABLE_ARTICULO_PRODUCTO 
ON MI_FACTURABLE (ID_ARTICULO, ID_PRODUCTO) 
INCLUDE (ID_FACTURABLE);

-- Índice para MI_OBLIGACION
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MI_OBLIGACION_FACTURABLE_ANIO')
CREATE NONCLUSTERED INDEX IX_MI_OBLIGACION_FACTURABLE_ANIO 
ON MI_OBLIGACION (ID_FACTURABLE, ANIO) 
INCLUDE (ID_OBLIGACION, TXT_NOMBRE, FEC_VENCIMIENTO);

-- Índice para MI_MOVIMIENTO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MI_MOVIMIENTO_OBLIGACION_BALANCE')
CREATE NONCLUSTERED INDEX IX_MI_MOVIMIENTO_OBLIGACION_BALANCE 
ON MI_MOVIMIENTO (ID_OBLIGACION, BALANCE) 
INCLUDE (ID_TIPO_MOVIMIENTO)
WHERE BALANCE > 0;

-- Índice para MI_SUCURSAL_LICENCIA
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MI_SUCURSAL_LICENCIA_ARTICULO_ACTIVO')
CREATE NONCLUSTERED INDEX IX_MI_SUCURSAL_LICENCIA_ARTICULO_ACTIVO 
ON MI_SUCURSAL_LICENCIA (ID_ARTICULO, SN_ACTIVO);

-- Actualizar estadísticas después de crear los índices
UPDATE STATISTICS MI_ACTOR;
UPDATE STATISTICS MI_HISTORICO_ARTICULO;
UPDATE STATISTICS MI_ARTICULO;
UPDATE STATISTICS MI_FACTURABLE;
UPDATE STATISTICS MI_OBLIGACION;
UPDATE STATISTICS MI_MOVIMIENTO;
UPDATE STATISTICS MI_SUCURSAL_LICENCIA;
UPDATE STATISTICS MI_TIPO_MOVIMIENTO;

-- Consulta para monitorear el rendimiento de los índices
SELECT 
    OBJECT_NAME(s.object_id) AS TableName,
    i.name AS IndexName,
    s.user_seeks + s.user_scans + s.user_lookups AS TotalReads,
    s.user_updates AS TotalWrites,
    CASE 
        WHEN s.user_updates > 0 
        THEN (s.user_seeks + s.user_scans + s.user_lookups) / CAST(s.user_updates AS FLOAT)
        ELSE s.user_seeks + s.user_scans + s.user_lookups
    END AS ReadWriteRatio
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) IN ('facturas', 'locales', 'mercados', 'users')
    AND i.name IS NOT NULL
ORDER BY TotalReads DESC;

-- Consulta para identificar índices no utilizados (ejecutar después de un tiempo)
/*
SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    'DROP INDEX ' + i.name + ' ON ' + OBJECT_NAME(i.object_id) AS DropStatement
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats s ON i.object_id = s.object_id AND i.index_id = s.index_id
WHERE OBJECT_NAME(i.object_id) IN ('facturas', 'locales', 'mercados', 'users')
    AND i.name IS NOT NULL
    AND i.name LIKE 'IX_%'
    AND (s.user_seeks IS NULL OR s.user_seeks = 0)
    AND (s.user_scans IS NULL OR s.user_scans = 0)
    AND (s.user_lookups IS NULL OR s.user_lookups = 0)
ORDER BY TableName, IndexName;
*/