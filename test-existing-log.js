const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testExistingLog() {
  try {
    console.log('🔍 Analizando log existente con timestamp...');
    
    // 1. Autenticar usuario
    console.log('\n1. Autenticando usuario de prueba...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'mougrindec',
      contrasena: 'admin123'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Autenticación exitosa');
    console.log(`   - Usuario: ${loginResponse.data.username || loginResponse.data.email}`);
    console.log(`   - Cookies configuradas: ${!!loginResponse.headers['set-cookie']}`);
    
    // 2. Configurar headers de autenticación
    const cookies = loginResponse.headers['set-cookie'];
    const authHeaders = {
      'Cookie': cookies ? cookies.join('; ') : ''
    };
    
    // 3. Obtener logs recientes
    console.log('\n2. Obteniendo logs más recientes...');
    const logsResponse = await axios.get(`${BASE_URL}/api/user-stats/logs`, {
      headers: authHeaders,
      withCredentials: true
    });
    
    console.log('✅ Logs obtenidos exitosamente');
    console.log(`   - Total de logs: ${logsResponse.data.logs.length}`);
    
    // 4. Buscar el log específico con claveCatastral: 21-1448-003
    const logs = logsResponse.data.logs;
    const targetLog = logs.find(log => {
      try {
        const params = JSON.parse(log.parametros);
        return params.claveCatastral === '21-1448-003';
      } catch (e) {
        return false;
      }
    });
    
    if (!targetLog) {
      console.log('❌ No se encontró el log con claveCatastral: 21-1448-003');
      return;
    }
    
    console.log('\n3. Analizando timestamp del log encontrado:');
    console.log(`   - ID del log: ${targetLog.id}`);
    console.log(`   - Resultado: ${targetLog.resultado}`);
    console.log(`   - Timestamp en DB: ${targetLog.createdAt}`);
    
    // 5. Analizar el timestamp
    const logTime = new Date(targetLog.createdAt);
    const currentTime = new Date();
    
    // Convertir a hora de Honduras (UTC-6)
    const hondurasOffset = -6 * 60; // -6 horas en minutos
    const hondurasTime = new Date(logTime.getTime() + (hondurasOffset * 60 * 1000));
    
    console.log('\n4. Análisis de timestamp:');
    console.log(`   - Hora UTC en DB: ${logTime.toISOString()}`);
    console.log(`   - Hora Honduras calculada: ${hondurasTime.toISOString()}`);
    console.log(`   - Hora Honduras formateada: ${hondurasTime.toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })}`);
    
    // 6. Verificar si el timestamp está en hora local de Honduras
    const expectedHondurasTime = new Date(logTime.getTime() - (6 * 60 * 60 * 1000));
    const timeDifference = Math.abs(logTime.getTime() - expectedHondurasTime.getTime()) / (1000 * 60);
    
    console.log('\n5. Verificación de corrección:');
    if (timeDifference < 1) {
      console.log('✅ El timestamp parece estar guardado en hora UTC (correcto)');
      console.log(`   - Diferencia con UTC: ${timeDifference.toFixed(2)} minutos`);
    } else {
      console.log('⚠️ El timestamp podría estar en hora local');
      console.log(`   - Diferencia con UTC esperado: ${timeDifference.toFixed(2)} minutos`);
    }
    
    // 7. Mostrar información adicional del log
    console.log('\n6. Información adicional del log:');
    console.log(`   - Tipo de consulta: ${targetLog.consultaType}`);
    console.log(`   - Parámetros: ${targetLog.parametros}`);
    console.log(`   - Usuario ID: ${targetLog.usuarioId}`);
    
    console.log('\n🎉 Análisis de timestamp completado');
    
  } catch (error) {
    console.error('❌ Error en el análisis:', error.message);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testExistingLog();