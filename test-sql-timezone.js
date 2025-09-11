const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSQLServerTimezone() {
  try {
    console.log('🔍 Verificando configuración de zona horaria de SQL Server...');
    
    // Obtener la zona horaria del servidor SQL Server
    const timezoneQuery = `
      SELECT 
        SYSDATETIMEOFFSET() as server_datetime_with_offset,
        GETDATE() as server_local_datetime,
        GETUTCDATE() as server_utc_datetime,
        DATEDIFF(HOUR, GETUTCDATE(), GETDATE()) as timezone_offset_hours
    `;
    
    const result = await prisma.$queryRawUnsafe(timezoneQuery);
    
    console.log('📊 Información de zona horaria del servidor SQL:');
    console.log('   - Fecha/hora con offset:', result[0].server_datetime_with_offset);
    console.log('   - Fecha/hora local del servidor:', result[0].server_local_datetime);
    console.log('   - Fecha/hora UTC del servidor:', result[0].server_utc_datetime);
    console.log('   - Offset de zona horaria (horas):', result[0].timezone_offset_hours);
    
    // Verificar si el offset es -6 (Honduras)
    if (result[0].timezone_offset_hours === -6) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: El servidor SQL Server está configurado en zona horaria UTC-6 (Honduras)');
      console.log('   Esto explica por qué los timestamps se guardan en hora local en lugar de UTC');
      console.log('\n📋 EXPLICACIÓN DEL PROBLEMA:');
      console.log('   1. JavaScript envía fecha en UTC: 2025-09-10T21:13:07.000Z');
      console.log('   2. SQL Server interpreta esta fecha como hora LOCAL (Honduras)');
      console.log('   3. SQL Server guarda: 2025-09-10T21:13:07.000 (sin conversión)');
      console.log('   4. Al leer desde la DB, se muestra como: 2025-09-10 21:13:07');
      console.log('   5. Pero la hora real en Honduras era: 15:13:07 (21:13 - 6 horas)');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   - Opción 1: Configurar SQL Server para usar UTC');
      console.log('   - Opción 2: Ajustar las fechas antes de enviarlas a la DB');
      console.log('   - Opción 3: Usar DATETIMEOFFSET en lugar de DATETIME');
    } else {
      console.log('ℹ️  El servidor SQL Server tiene un offset de', result[0].timezone_offset_hours, 'horas');
    }
    
    // Demostrar el problema con fechas
    console.log('\n🕐 DEMOSTRACIÓN DEL PROBLEMA:');
    const now = new Date();
    const hondurasTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
    
    console.log('   - Hora actual UTC:', now.toISOString());
    console.log('   - Hora actual Honduras:', hondurasTime.toISOString().replace('Z', '') + ' (hora local)');
    console.log('   - Si enviamos la hora UTC a SQL Server configurado en Honduras:');
    console.log('     * SQL Server recibe:', now.toISOString());
    console.log('     * SQL Server guarda como hora local:', now.toISOString().replace('Z', ''));
    console.log('     * Diferencia con la hora real de Honduras: 6 horas adelantado');
    
  } catch (error) {
    console.error('❌ Error al verificar zona horaria:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSQLServerTimezone();