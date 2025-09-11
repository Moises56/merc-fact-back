const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Usuario de prueba
const TEST_USER = {
  username: 'mougrindec',
  contrasena: 'admin123'
};

// Función para generar una clave catastral única
function generateUniqueClaveCatastral() {
  const timestamp = Date.now().toString().slice(-6);
  return `99-${timestamp.slice(0,4)}-${timestamp.slice(4,6)}`;
}

async function testTimestampFix() {
  try {
    console.log('🔍 Iniciando prueba de corrección de timestamp...');
    
    // 1. Autenticación
    console.log('\n1. Autenticando usuario de prueba...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Error en login: ${loginResponse.status}`);
    }
    
    const cookies = loginResponse.headers['set-cookie'];
    const userId = loginResponse.data.user?.id;
    
    console.log('✅ Autenticación exitosa');
    console.log(`   - Usuario: ${loginResponse.data.user?.email || loginResponse.data.user?.username}`);
    console.log(`   - ID: ${userId}`);
    console.log(`   - Cookies configuradas: ${cookies ? 'true' : 'false'}`);
    
    // 2. Información de tiempo antes de la consulta
    const beforeConsultation = new Date();
    const hondurasTime = new Date(beforeConsultation.getTime() - (6 * 60 * 60 * 1000)); // UTC-6
    
    console.log('\n2. Información de tiempo antes de la consulta:');
    console.log(`   - Hora UTC actual: ${beforeConsultation.toISOString()}`);
    console.log(`   - Hora Honduras esperada: ${hondurasTime.toISOString()}`);
    console.log(`   - Hora Honduras formateada: ${hondurasTime.toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })}`);
    
    // Configurar headers para requests autenticados
    const authHeaders = {
      'Cookie': cookies?.join('; ') || '',
      'Content-Type': 'application/json'
    };
    
    // 3. Realizar consulta EC con clave catastral real
    const realClaveCatastral = '21-1448-003'; // Usar una clave que sabemos que existe
    console.log('\n3. Realizando consulta EC...');
    console.log(`   - Clave catastral real: ${realClaveCatastral}`);
    
    try {
      const consultaResponse = await axios.get(`${BASE_URL}/consultaEC`, {
        params: {
           claveCatastral: realClaveCatastral
         },
        headers: authHeaders,
        withCredentials: true
      });
    
    console.log(`   - Status de respuesta: ${consultaResponse.status}`);
    
    if (consultaResponse.status === 200) {
      console.log('✅ Consulta EC realizada exitosamente');
      if (consultaResponse.data.fecha && consultaResponse.data.hora) {
        console.log(`   - Fecha devuelta por endpoint: ${consultaResponse.data.fecha}`);
        console.log(`   - Hora devuelta por endpoint: ${consultaResponse.data.hora}`);
      }
    } else {
      console.log('⚠️ Consulta EC devolvió status diferente a 200 (esto puede ser normal para claves de prueba)');
    }
    
  } catch (consultaError) {
    console.log('⚠️ Error en consulta EC (esto puede ser normal para claves de prueba):');
    console.log(`   - Status: ${consultaError.response?.status}`);
    console.log(`   - Mensaje: ${consultaError.response?.data?.message}`);
  }
  
  try {
    
    // 4. Esperar un momento para que se procese el log
    console.log('\n4. Esperando procesamiento del log...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. Obtener logs más recientes
    console.log('\n5. Obteniendo logs más recientes...');
    const logsResponse = await axios.get(`${BASE_URL}/api/user-stats/logs`, {
      params: {
        limit: 10,
        offset: 0
      },
      headers: authHeaders,
      withCredentials: true
    });
    
    if (logsResponse.status !== 200) {
      throw new Error(`Error obteniendo logs: ${logsResponse.status}`);
    }
    
    console.log('✅ Logs obtenidos exitosamente');
    console.log(`   - Total de logs: ${logsResponse.data.total}`);
    
    // 6. Buscar el log más reciente con nuestra clave catastral
    const logs = logsResponse.data.logs;
    console.log(`   - Buscando log con claveCatastral: ${realClaveCatastral}`);
    
    // Buscar el log más reciente (primero en la lista) con nuestra clave catastral
    const ourLog = logs.find(log => {
      try {
        const params = JSON.parse(log.parametros);
        const match = params.claveCatastral === realClaveCatastral;
        // Verificar que sea reciente (dentro de los últimos 2 minutos)
        const logTime = new Date(log.createdAt);
        const timeDiff = Math.abs(beforeConsultation.getTime() - logTime.getTime()) / (1000 * 60);
        const isRecent = timeDiff <= 2;
        if (match && isRecent) {
          console.log(`   - ✅ Log reciente encontrado: ${log.id} - ${log.resultado} (${timeDiff.toFixed(1)} min ago)`);
        }
        return match && isRecent;
      } catch (e) {
        return false;
      }
    });
    
    if (!ourLog) {
      console.log('❌ No se encontró el log generado por nuestra consulta');
      console.log('   - Logs más recientes:');
      logs.slice(0, 3).forEach((log, index) => {
        console.log(`     Log ${index + 1}: ${log.createdAt} - ${log.parametros}`);
      });
      return;
    }
    
    console.log('\n6. Análisis del timestamp del log generado:');
    console.log(`   - ID del log: ${ourLog.id}`);
    console.log(`   - Parámetros: ${ourLog.parametros}`);
    console.log(`   - Timestamp guardado en DB: ${ourLog.createdAt}`);
    
    // Analizar el timestamp
    const logTimestamp = new Date(ourLog.createdAt);
    console.log(`   - Timestamp como Date: ${logTimestamp.toISOString()}`);
    
    // Convertir a hora de Honduras para comparación
    const logHondurasTime = new Date(logTimestamp.getTime() - (6 * 60 * 60 * 1000));
    console.log(`   - Timestamp formateado (Honduras): ${logHondurasTime.toLocaleString('es-HN', { timeZone: 'America/Tegucigalpa' })}`);
    
    // Verificar si el timestamp está correcto
    console.log('\n   📊 Verificación de corrección:');
    const timeDifferenceMinutes = Math.abs(logTimestamp.getTime() - beforeConsultation.getTime()) / (1000 * 60);
    console.log(`   - Diferencia con hora de consulta: ${timeDifferenceMinutes.toFixed(1)} minutos`);
    
    if (timeDifferenceMinutes <= 5) {
      console.log('✅ El timestamp está correctamente guardado (diferencia <= 5 minutos)');
    } else {
      console.log('❌ El timestamp podría no estar correctamente guardado (diferencia > 5 minutos)');
    }
    
    // Verificar la hora específica
    const logHour = logTimestamp.getUTCHours();
    const expectedHour = beforeConsultation.getUTCHours();
    console.log(`   - Hora del log (UTC): ${logHour}:${logTimestamp.getUTCMinutes().toString().padStart(2, '0')}`);
    console.log(`   - Hora esperada (UTC): ${expectedHour}:${beforeConsultation.getUTCMinutes().toString().padStart(2, '0')}`);
    
    if (Math.abs(logHour - expectedHour) <= 1) {
      console.log('✅ La hora del log coincide aproximadamente con la hora actual');
    } else {
      console.log('❌ La hora del log NO coincide con la hora actual');
    }
    
    console.log('\n🎉 Prueba de timestamp completada');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
    }
  }
  
  } catch (error) {
    console.error('❌ Error general en la prueba:', error.message);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testTimestampFix();