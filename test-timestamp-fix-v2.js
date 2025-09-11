const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Usuario de prueba
const TEST_USER = {
  username: 'mougrindec',
  contrasena: 'admin123'
};

async function testTimestampFix() {
  console.log('🕐 === PRUEBA DE CORRECCIÓN DE TIMESTAMP ===\n');

  try {
    // Paso 1: Autenticación
    console.log('1. Autenticando usuario...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, TEST_USER, {
      withCredentials: true,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Error en autenticación:', loginResponse.data);
      return;
    }

    console.log('✅ Autenticación exitosa');
    console.log('   - Usuario:', loginResponse.data.user?.username);
    console.log('   - ID:', loginResponse.data.user?.id);
    
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    console.log('   - Cookies configuradas:', !!cookieHeader);

    // Paso 2: Información de tiempo antes de la consulta
    const beforeTime = new Date();
    const hondurasTime = new Date(beforeTime.getTime() - (6 * 60 * 60 * 1000));
    
    console.log('\n2. Información de tiempo antes de la consulta:');
    console.log('   - Hora UTC actual:', beforeTime.toISOString());
    console.log('   - Hora Honduras esperada:', hondurasTime.toISOString());
    console.log('   - Hora Honduras formateada:', hondurasTime.toLocaleString('es-HN'));

    // Paso 3: Hacer una consulta EC para generar un log
    console.log('\n3. Realizando consulta EC...');
    
    // Usar una clave catastral real que sabemos que funciona
    const claveCatastral = '21-1448-003';
    console.log('   - Clave catastral de prueba:', claveCatastral);
    
    const ecResponse = await axios.get(`${BASE_URL}/consultaEC`, {
      params: {
        claveCatastral: claveCatastral
      },
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    console.log('   - Status de respuesta:', ecResponse.status);
    
    if (ecResponse.status === 200) {
      console.log('✅ Consulta EC realizada exitosamente');
      console.log('   - Fecha devuelta por endpoint:', ecResponse.data.fecha);
      console.log('   - Hora devuelta por endpoint:', ecResponse.data.hora);
    } else if (ecResponse.status === 404) {
      console.log('⚠️ Consulta EC devolvió 404 (esperado para clave de prueba)');
      console.log('   - Esto debería generar un log con resultado NOT_FOUND');
    } else {
      console.log('❌ Error en consulta EC:', ecResponse.status, ecResponse.data);
    }

    // Paso 4: Esperar un momento para que se procese el log
    console.log('\n4. Esperando procesamiento del log...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Paso 5: Obtener logs más recientes
    console.log('\n5. Obteniendo logs más recientes...');
    const logsResponse = await axios.get(`${BASE_URL}/api/user-stats/logs`, {
      params: {
        limit: 10,
        offset: 0,
        consultaType: 'EC'
      },
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true,
      validateStatus: function (status) {
        return status < 500;
      }
    });

    if (logsResponse.status !== 200) {
      console.error('❌ Error obteniendo logs:', logsResponse.data);
      return;
    }

    console.log('✅ Logs obtenidos exitosamente');
    console.log('   - Total de logs:', logsResponse.data.total);

    // Paso 6: Buscar el log más reciente que coincida con nuestra consulta
    const logs = logsResponse.data.logs || [];
    const ourLog = logs.find(log => {
      try {
        const params = JSON.parse(log.parametros);
        return params.claveCatastral === claveCatastral;
      } catch {
        return false;
      }
    });

    if (!ourLog) {
      console.log('❌ No se encontró el log de nuestra consulta');
      console.log('   - Logs disponibles:');
      logs.slice(0, 3).forEach((log, index) => {
        console.log(`     ${index + 1}. ID: ${log.id}`);
        console.log(`        Timestamp: ${log.createdAt}`);
        console.log(`        Parámetros: ${log.parametros}`);
      });
      return;
    }

    console.log('\n6. Análisis del timestamp del log generado:');
    console.log('   - ID del log:', ourLog.id);
    console.log('   - Parámetros:', ourLog.parametros);
    console.log('   - Timestamp guardado en DB:', ourLog.createdAt);
    
    const logTimestamp = new Date(ourLog.createdAt);
    console.log('   - Timestamp como Date:', logTimestamp.toISOString());
    console.log('   - Timestamp formateado (Honduras):', logTimestamp.toLocaleString('es-HN'));

    // Verificar si el timestamp está en hora de Honduras
    const timeDifferenceMinutes = Math.abs(logTimestamp.getTime() - hondurasTime.getTime()) / (1000 * 60);
    
    console.log('\n   📊 Verificación de corrección:');
    console.log('   - Diferencia con hora Honduras esperada:', timeDifferenceMinutes.toFixed(1), 'minutos');
    
    if (timeDifferenceMinutes <= 5) {
      console.log('   ✅ El timestamp está correctamente guardado en hora de Honduras');
    } else {
      console.log('   ❌ El timestamp podría no estar correctamente guardado (diferencia > 5 minutos)');
    }
    
    // Verificar la hora específica
    const logHour = logTimestamp.getHours();
    const expectedHour = hondurasTime.getHours();
    
    console.log('   - Hora del log:', logHour + ':' + logTimestamp.getMinutes().toString().padStart(2, '0'));
    console.log('   - Hora esperada (Honduras):', expectedHour + ':' + hondurasTime.getMinutes().toString().padStart(2, '0'));
    
    if (Math.abs(logHour - expectedHour) <= 1) {
      console.log('   ✅ La hora del log coincide con la hora local de Honduras');
    } else {
      console.log('   ❌ La hora del log NO coincide con la hora local de Honduras');
    }

    console.log('\n🎉 Prueba de timestamp completada');
    
    // Mostrar comparación con logs anteriores
    console.log('\n7. Comparando con logs anteriores...');
    console.log('   - Analizando 3 logs más recientes:');
    
    logs.slice(0, 3).forEach((log, index) => {
      const timestamp = new Date(log.createdAt);
      console.log(`\n   Log ${index + 1}:`);
      console.log(`   - Timestamp: ${log.createdAt}`);
      console.log(`   - Hora: ${timestamp.getHours()}:${timestamp.getMinutes().toString().padStart(2, '0')}:${timestamp.getSeconds().toString().padStart(2, '0')}`);
      console.log(`   - Parámetros: ${log.parametros}`);
    });

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    if (error.response) {
      console.error('   - Status:', error.response.status);
      console.error('   - Data:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testTimestampFix().catch(console.error);