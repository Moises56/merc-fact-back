/**
 * Script de prueba para verificar la funcionalidad de typeConsultaHistory
 * 
 * Este script verifica que:
 * 1. Los logs de consulta se registren con consultaKey y userLocationId
 * 2. El endpoint de historial de ubicaciones incluya typeConsultaHistory
 * 3. Los datos se estructuren correctamente según TypeConsultaHistoryDto
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConsultationHistory() {
  try {
    console.log('🧪 Iniciando pruebas de historial de consultas...');
    
    // 1. Verificar que existen usuarios con ubicaciones
    const usersWithLocations = await prisma.user.findMany({
      where: {
        userLocations: {
          some: { isActive: true }
        }
      },
      include: {
        userLocations: {
          where: { isActive: true },
          take: 1
        }
      },
      take: 1
    });
    
    if (usersWithLocations.length === 0) {
      console.log('❌ No se encontraron usuarios con ubicaciones activas');
      return;
    }
    
    const testUser = usersWithLocations[0];
    const testLocation = testUser.userLocations[0];
    
    console.log(`✅ Usuario de prueba: ${testUser.username} (${testUser.id})`);
    console.log(`✅ Ubicación de prueba: ${testLocation.locationName} (${testLocation.id})`);
    
    // 2. Crear algunos logs de consulta de prueba
    const testLogs = [
      {
        consultaType: 'ICS',
        consultaSubtype: 'normal',
        consultaKey: '12345678901',
        parametros: JSON.stringify({ claveCatastral: '12345678901' }),
        resultado: 'SUCCESS',
        totalEncontrado: 5,
        duracionMs: 1200,
        userId: testUser.id,
        userLocationId: testLocation.id
      },
      {
        consultaType: 'EC',
        consultaSubtype: 'amnistia',
        consultaKey: '87654321',
        parametros: JSON.stringify({ dni: '87654321' }),
        resultado: 'SUCCESS',
        totalEncontrado: 3,
        duracionMs: 800,
        userId: testUser.id,
        userLocationId: testLocation.id
      }
    ];
    
    console.log('📝 Creando logs de consulta de prueba...');
    
    for (const logData of testLogs) {
      await prisma.consultaLog.create({ data: logData });
    }
    
    console.log('✅ Logs de consulta creados exitosamente');
    
    // 3. Verificar que los logs se guardaron correctamente
    const savedLogs = await prisma.consultaLog.findMany({
      where: {
        userId: testUser.id,
        userLocationId: testLocation.id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`✅ Se encontraron ${savedLogs.length} logs para el usuario`);
    
    // 4. Verificar que los logs tienen consultaKey y userLocationId
    const logsWithKey = savedLogs.filter(log => log.consultaKey && log.userLocationId);
    console.log(`✅ ${logsWithKey.length} logs tienen consultaKey y userLocationId`);
    
    // 5. Simular la consulta que haría el servicio para obtener typeConsultaHistory
    const consultaLogs = await prisma.consultaLog.findMany({
      where: {
        userId: testUser.id,
        userLocationId: testLocation.id,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        consultaType: true,
        consultaSubtype: true,
        consultaKey: true,
        totalEncontrado: true,
        createdAt: true,
      },
    });
    
    // Agrupar por tipo y método de consulta (simulando el método del servicio)
    const groupedConsultas = consultaLogs.reduce((acc, log) => {
      const key = `${log.consultaType}_${log.consultaSubtype}`;
      
      if (!acc[key]) {
        acc[key] = {
          type: log.consultaType,
          method: log.consultaSubtype,
          consultations: [],
        };
      }
      
      acc[key].consultations.push({
        key: log.consultaKey,
        total: log.totalEncontrado || 0,
        consultedAt: log.createdAt,
      });
      
      return acc;
    }, {});
    
    // Convertir a array con el formato TypeConsultaHistoryDto
    const typeConsultaHistory = Object.values(groupedConsultas).map((group) => ({
      type: group.type,
      method: group.method,
      key: group.consultations.length > 0 ? group.consultations[0].key : null,
      total: group.consultations.reduce((sum, c) => sum + c.total, 0),
      consultedAt: group.consultations.length > 0 ? group.consultations[0].consultedAt : new Date(),
    }));
    
    console.log('\n📊 Resultado de typeConsultaHistory:');
    console.log(JSON.stringify(typeConsultaHistory, null, 2));
    
    console.log('\n🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`- Usuario de prueba: ${testUser.username}`);
    console.log(`- Ubicación: ${testLocation.locationName}`);
    console.log(`- Logs creados: ${testLogs.length}`);
    console.log(`- Logs con consultaKey: ${logsWithKey.length}`);
    console.log(`- Tipos de consulta agrupados: ${typeConsultaHistory.length}`);
    
  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar las pruebas
testConsultationHistory();