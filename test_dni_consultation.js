const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  username: 'test_user',
  password: 'test_password'
};
const TEST_DNI = '0801199012345'; // DNI de prueba

async function testDNIConsultation() {
  try {
    console.log('🔍 Iniciando prueba de consulta por DNI...');
    
    // 1. Autenticarse
    console.log('\n1. Autenticando usuario...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.access_token;
    console.log('✅ Usuario autenticado exitosamente');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Realizar consulta por DNI
    console.log('\n2. Realizando consulta por DNI...');
    try {
      const consultaResponse = await axios.get(`${BASE_URL}/consultaEC`, {
        params: { dni: TEST_DNI },
        headers
      });
      console.log('✅ Consulta por DNI realizada exitosamente');
      console.log(`   - Tipo de consulta: ${consultaResponse.data.tipoConsulta}`);
      console.log(`   - Total general: ${consultaResponse.data.totalGeneral}`);
      console.log(`   - Propiedades encontradas: ${consultaResponse.data.propiedades?.length || 0}`);
    } catch (consultaError) {
      console.log('⚠️ Error en consulta por DNI (puede ser normal si no hay datos):');
      console.log(`   - Status: ${consultaError.response?.status}`);
      console.log(`   - Mensaje: ${consultaError.response?.data?.message}`);
    }
    
    // 3. Esperar un momento para que se procese el log
    console.log('\n3. Esperando procesamiento del log...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Verificar historial de ubicación del usuario
    console.log('\n4. Verificando historial de ubicación...');
    const historyResponse = await axios.get(`${BASE_URL}/user-stats/location-history`, {
      params: { includeConsultationStats: true },
      headers
    });
    
    console.log('✅ Historial obtenido exitosamente');
    
    // 5. Buscar consultas por DNI en el historial
    console.log('\n5. Analizando typeConsultaHistory...');
    const history = historyResponse.data;
    
    if (history.typeConsultaHistory && history.typeConsultaHistory.length > 0) {
      console.log(`   - Total de entradas en typeConsultaHistory: ${history.typeConsultaHistory.length}`);
      
      // Buscar consultas que contengan el DNI de prueba
      const dniConsultations = history.typeConsultaHistory.filter(item => 
        item.key === TEST_DNI || (item.key && item.key.includes(TEST_DNI.substring(0, 8)))
      );
      
      if (dniConsultations.length > 0) {
        console.log('✅ Consultas por DNI encontradas en el historial:');
        dniConsultations.forEach((item, index) => {
          console.log(`   ${index + 1}. Tipo: ${item.type}, Método: ${item.method}`);
          console.log(`      Clave: ${item.key}`);
          console.log(`      Total: ${item.total}`);
          console.log(`      Fecha: ${item.consultedAt}`);
        });
      } else {
        console.log('❌ No se encontraron consultas por DNI en el historial');
        console.log('   Todas las entradas en typeConsultaHistory:');
        history.typeConsultaHistory.forEach((item, index) => {
          console.log(`   ${index + 1}. Tipo: ${item.type}, Método: ${item.method}, Clave: ${item.key}`);
        });
      }
    } else {
      console.log('❌ No hay entradas en typeConsultaHistory');
    }
    
    // 6. Verificar logs directamente
    console.log('\n6. Verificando logs de consulta directamente...');
    try {
      const logsResponse = await axios.get(`${BASE_URL}/user-stats/consulta-logs`, {
        params: { limit: 10 },
        headers
      });
      
      const recentLogs = logsResponse.data.logs || [];
      const dniLogs = recentLogs.filter(log => {
        const params = JSON.parse(log.parametros || '{}');
        return params.dni === TEST_DNI;
      });
      
      if (dniLogs.length > 0) {
        console.log('✅ Logs de consulta por DNI encontrados:');
        dniLogs.forEach((log, index) => {
          const params = JSON.parse(log.parametros);
          console.log(`   ${index + 1}. ID: ${log.id}`);
          console.log(`      Tipo: ${log.consultaType}, Subtipo: ${log.consultaSubtype}`);
          console.log(`      DNI: ${params.dni}`);
          console.log(`      Resultado: ${log.resultado}`);
          console.log(`      Fecha: ${log.createdAt}`);
        });
      } else {
        console.log('❌ No se encontraron logs de consulta por DNI');
      }
    } catch (logsError) {
      console.log('⚠️ Error al obtener logs:', logsError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testDNIConsultation();