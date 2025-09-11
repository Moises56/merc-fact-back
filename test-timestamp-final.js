const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  username: 'mougrindec',
  contrasena: 'admin123'
};

async function testTimestampCorrection() {
  try {
    console.log('🔐 Autenticando usuario...');
    
    // Autenticar usuario
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: TEST_USER.username,
      contrasena: TEST_USER.contrasena
    });
    
    if (loginResponse.status !== 200) {
      throw new Error('Error en autenticación');
    }
    
    const cookies = loginResponse.headers['set-cookie'];
    console.log('✅ Autenticación exitosa');
    
    // Realizar consulta EC para generar un nuevo log
    console.log('🔍 Realizando consulta EC...');
    const consultaResponse = await axios.get(
      `${BASE_URL}/consultaEC/amnistia`,
      {
        params: { dni: '0801197308288' },
        headers: {
          'Cookie': cookies.join('; ')
        }
      }
    );
    
    console.log(`📊 Consulta EC completada - Status: ${consultaResponse.status}`);
    
    // Esperar un momento para que se guarde el log
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obtener logs recientes
    console.log('📋 Obteniendo logs recientes...');
    const logsResponse = await axios.get(`${BASE_URL}/api/user-stats/logs`, {
      params: {
        limit: 10,
        consultaType: 'EC'
      },
      headers: {
        'Cookie': cookies.join('; ')
      }
    });
    
    const logs = logsResponse.data;
    console.log(`📝 Respuesta de logs:`, typeof logs, logs);
    
    // Verificar si logs es un array
    const logsArray = Array.isArray(logs) ? logs : (logs.data || logs.logs || []);
    console.log(`📝 Se obtuvieron ${logsArray.length} logs recientes`);
    
    // Buscar el log más reciente con el DNI consultado
    const recentLog = logsArray.find(log => {
      const parametros = JSON.parse(log.parametros || '{}');
      return parametros.dni === '0801197308288';
    });
    
    if (recentLog) {
      console.log('\n🎯 Log encontrado:');
      console.log(`ID: ${recentLog.id}`);
      console.log(`Tipo: ${recentLog.consultaType}`);
      console.log(`Subtipo: ${recentLog.consultaSubtype}`);
      console.log(`Parámetros: ${recentLog.parametros}`);
      console.log(`Resultado: ${recentLog.resultado}`);
      console.log(`Total: ${recentLog.totalEncontrado}`);
      console.log(`Timestamp: ${recentLog.createdAt}`);
      
      // Analizar el timestamp
      const logDate = new Date(recentLog.createdAt);
      const now = new Date();
      const diffMinutes = Math.abs(now.getTime() - logDate.getTime()) / (1000 * 60);
      
      console.log('\n⏰ Análisis de timestamp:');
      console.log(`Hora actual (UTC): ${now.toISOString()}`);
      console.log(`Hora del log: ${logDate.toISOString()}`);
      console.log(`Diferencia: ${diffMinutes.toFixed(2)} minutos`);
      
      if (diffMinutes < 10) {
        console.log('✅ CORRECCIÓN EXITOSA: El timestamp se está guardando correctamente en UTC');
      } else {
        console.log('❌ PROBLEMA: El timestamp parece tener un desfase significativo');
      }
    } else {
      console.log('❌ No se encontró el log con el DNI consultado');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTimestampCorrection();