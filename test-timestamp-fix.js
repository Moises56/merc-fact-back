const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  username: 'mougrindec',
  contrasena: 'admin123'
};

async function testTimestampFix() {
  try {
    console.log('🕐 Iniciando prueba de corrección de timestamp...');
    
    // 1. Autenticarse
    console.log('\n1. Autenticando usuario...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER);
    const cookies = loginResponse.headers['set-cookie'];
    console.log('✅ Usuario autenticado exitosamente');
    
    const headers = {
      'Cookie': cookies ? cookies.join('; ') : '',
      'Content-Type': 'application/json'
    };
    
    // 2. Obtener la hora actual antes de la consulta
    const beforeConsulta = new Date();
    const hondurasTimeBefore = new Date(beforeConsulta.getTime() - (6 * 60 * 60 * 1000));
    
    console.log('\n2. Información de tiempo antes de la consulta:');
    console.log(`   - Hora UTC actual: ${beforeConsulta.toISOString()}`);
    console.log(`   - Hora Honduras esperada: ${hondurasTimeBefore.toISOString()}`);
    console.log(`   - Hora Honduras formateada: ${hondurasTimeBefore.toLocaleString('es-HN')}`);
    
    // 3. Realizar una consulta EC para generar un log
    console.log('\n3. Realizando consulta EC para generar log...');
    try {
      const consultaResponse = await axios.get(`${BASE_URL}/consultaEC`, {
        params: { claveCatastral: '21-1448-003' },
        headers
      });
      console.log('✅ Consulta EC realizada exitosamente');
      console.log(`   - Fecha devuelta por endpoint: ${consultaResponse.data.fecha}`);
      console.log(`   - Hora devuelta por endpoint: ${consultaResponse.data.hora}`);
    } catch (consultaError) {
      console.log('⚠️ Consulta falló:', consultaError.response?.status, consultaError.response?.data);
    }
    
    // 4. Esperar un momento para que se procese el log
    console.log('\n4. Esperando procesamiento del log...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Obtener los logs más recientes
    console.log('\n5. Obteniendo logs más recientes...');
    const logsResponse = await axios.get(`${BASE_URL}/api/user-stats/logs`, {
      params: { 
        limit: 5,
        consultaType: 'EC',
        resultado: 'SUCCESS'
      },
      headers
    });
    
    console.log('✅ Logs obtenidos exitosamente');
    console.log(`   - Total de logs: ${logsResponse.data.total}`);
    
    // 6. Analizar el timestamp del log más reciente
    if (logsResponse.data.logs && logsResponse.data.logs.length > 0) {
      const mostRecentLog = logsResponse.data.logs[0];
      const logCreatedAt = new Date(mostRecentLog.createdAt);
      
      console.log('\n6. Análisis del timestamp del log más reciente:');
      console.log(`   - ID del log: ${mostRecentLog.id}`);
      console.log(`   - Parámetros: ${mostRecentLog.parametros}`);
      console.log(`   - Timestamp guardado en DB: ${mostRecentLog.createdAt}`);
      console.log(`   - Timestamp como Date: ${logCreatedAt.toISOString()}`);
      console.log(`   - Timestamp formateado (Honduras): ${logCreatedAt.toLocaleString('es-HN')}`);
      
      // Calcular diferencia con la hora esperada
      const timeDiffMs = Math.abs(logCreatedAt.getTime() - hondurasTimeBefore.getTime());
      const timeDiffMinutes = timeDiffMs / (1000 * 60);
      
      console.log(`\n   📊 Verificación de corrección:`);
      console.log(`   - Diferencia con hora Honduras esperada: ${timeDiffMinutes.toFixed(1)} minutos`);
      
      if (timeDiffMinutes <= 5) {
        console.log(`   ✅ El timestamp parece estar correctamente guardado en hora de Honduras`);
      } else {
        console.log(`   ❌ El timestamp podría no estar correctamente guardado (diferencia > 5 minutos)`);
      }
      
      // Verificar si la hora está en el rango correcto para Honduras
      const logHour = logCreatedAt.getHours();
      const expectedHour = hondurasTimeBefore.getHours();
      
      console.log(`   - Hora del log: ${logHour}:${logCreatedAt.getMinutes().toString().padStart(2, '0')}`);
      console.log(`   - Hora esperada (Honduras): ${expectedHour}:${hondurasTimeBefore.getMinutes().toString().padStart(2, '0')}`);
      
      if (Math.abs(logHour - expectedHour) <= 1) {
        console.log(`   ✅ La hora del log coincide con la hora local de Honduras`);
      } else {
        console.log(`   ❌ La hora del log NO coincide con la hora local de Honduras`);
      }
      
    } else {
      console.log('\n6. ❌ No se encontraron logs recientes para analizar');
    }
    
    // 7. Mostrar comparación con logs anteriores (si existen)
    console.log('\n7. Comparando con logs anteriores...');
    const allLogsResponse = await axios.get(`${BASE_URL}/api/user-stats/logs`, {
      params: { 
        limit: 10,
        consultaType: 'EC'
      },
      headers
    });
    
    if (allLogsResponse.data.logs && allLogsResponse.data.logs.length > 1) {
      console.log(`   - Analizando ${Math.min(3, allLogsResponse.data.logs.length)} logs más recientes:`);
      
      for (let i = 0; i < Math.min(3, allLogsResponse.data.logs.length); i++) {
        const log = allLogsResponse.data.logs[i];
        const logDate = new Date(log.createdAt);
        
        console.log(`\n   Log ${i + 1}:`);
        console.log(`   - Timestamp: ${log.createdAt}`);
        console.log(`   - Hora: ${logDate.getHours()}:${logDate.getMinutes().toString().padStart(2, '0')}:${logDate.getSeconds().toString().padStart(2, '0')}`);
        console.log(`   - Parámetros: ${log.parametros}`);
      }
    }
    
    console.log('\n🎉 Prueba de timestamp completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testTimestampFix();