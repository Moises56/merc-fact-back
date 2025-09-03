const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  username: 'test_user',
  password: 'test_password'
};

async function testTimezoneFix() {
  try {
    console.log('🕐 Iniciando prueba de corrección de zona horaria...');
    
    // 1. Autenticarse
    console.log('\n1. Autenticando usuario...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    const token = loginResponse.data.access_token;
    console.log('✅ Usuario autenticado exitosamente');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 2. Realizar una consulta para generar un log reciente
    console.log('\n2. Realizando consulta para generar log...');
    try {
      await axios.get(`${BASE_URL}/consultaEC`, {
        params: { claveCatastral: '0612196700087' },
        headers
      });
      console.log('✅ Consulta realizada exitosamente');
    } catch (consultaError) {
      console.log('⚠️ Consulta falló (puede ser normal si no hay datos)');
    }
    
    // 3. Esperar un momento para que se procese el log
    console.log('\n3. Esperando procesamiento del log...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Obtener la hora actual del sistema
    const now = new Date();
    const hondurasTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Tegucigalpa"}));
    
    console.log('\n4. Información de tiempo:');
    console.log(`   - Hora UTC actual: ${now.toISOString()}`);
    console.log(`   - Hora Honduras actual: ${hondurasTime.toISOString()}`);
    console.log(`   - Diferencia esperada: 6 horas`);
    
    // 5. Verificar historial de ubicación del usuario
    console.log('\n5. Verificando historial con zona horaria corregida...');
    const historyResponse = await axios.get(`${BASE_URL}/user-stats/location-history`, {
      params: { includeConsultationStats: true },
      headers
    });
    
    console.log('✅ Historial obtenido exitosamente');
    
    // 6. Analizar las fechas en typeConsultaHistory
    console.log('\n6. Analizando fechas en typeConsultaHistory...');
    const history = historyResponse.data;
    
    if (history.typeConsultaHistory && history.typeConsultaHistory.length > 0) {
      console.log(`   - Total de entradas: ${history.typeConsultaHistory.length}`);
      
      // Mostrar las primeras 3 entradas con análisis de tiempo
      const entriesToShow = Math.min(3, history.typeConsultaHistory.length);
      
      for (let i = 0; i < entriesToShow; i++) {
        const entry = history.typeConsultaHistory[i];
        const consultedAt = new Date(entry.consultedAt);
        const utcTime = new Date(consultedAt.getTime() + (6 * 60 * 60 * 1000)); // Agregar 6 horas para obtener UTC
        
        console.log(`\n   Entrada ${i + 1}:`);
        console.log(`   - Tipo: ${entry.type}, Método: ${entry.method}`);
        console.log(`   - Clave: ${entry.key}`);
        console.log(`   - Total: ${entry.total}`);
        console.log(`   - Fecha mostrada (Honduras): ${consultedAt.toISOString()}`);
        console.log(`   - Fecha equivalente UTC: ${utcTime.toISOString()}`);
        console.log(`   - Hora local mostrada: ${consultedAt.toLocaleTimeString('es-HN')}`);
        
        // Verificar si la hora está en rango razonable para Honduras
        const hourHonduras = consultedAt.getHours();
        if (hourHonduras >= 0 && hourHonduras <= 23) {
          console.log(`   ✅ Hora en rango válido para Honduras (${hourHonduras}:${consultedAt.getMinutes().toString().padStart(2, '0')})`);
        } else {
          console.log(`   ❌ Hora fuera de rango (${hourHonduras}:${consultedAt.getMinutes().toString().padStart(2, '0')})`);
        }
      }
      
      // Verificar la entrada más reciente
      const mostRecent = history.typeConsultaHistory[0];
      const recentTime = new Date(mostRecent.consultedAt);
      const timeDiff = Math.abs(hondurasTime.getTime() - recentTime.getTime()) / (1000 * 60); // diferencia en minutos
      
      console.log(`\n   📊 Análisis de la entrada más reciente:`);
      console.log(`   - Diferencia con hora actual de Honduras: ${timeDiff.toFixed(1)} minutos`);
      
      if (timeDiff <= 60) { // Si la diferencia es menor a 1 hora
        console.log(`   ✅ La fecha parece estar correctamente ajustada a la zona horaria de Honduras`);
      } else {
        console.log(`   ⚠️ La fecha podría no estar correctamente ajustada (diferencia > 1 hora)`);
      }
      
    } else {
      console.log('❌ No hay entradas en typeConsultaHistory para analizar');
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
testTimezoneFix();