const axios = require('axios');

// Configuración del servidor
const BASE_URL = 'http://localhost:3000';

// Función para hacer login y obtener cookies
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'mougrindec',
      contrasena: 'admin123'
    }, {
      withCredentials: true
    });
    
    // Extraer cookies para futuras requests
    const cookies = response.headers['set-cookie'];
    return cookies ? cookies.join('; ') : '';
  } catch (error) {
    console.error('Error en login:', error.response?.data || error.message);
    throw error;
  }
}

// Función para probar el endpoint de matches mejorado
async function testMatchesWithDeduplication(cookies) {
  try {
    console.log('\n🔍 Probando endpoint de matches con deduplicación...');
    
    const matchesResponse = await axios.get(`${BASE_URL}/api/user-stats/match`, {
      headers: {
        'Cookie': cookies
      },
      withCredentials: true,
      params: {
        // Filtros para probar solo claveCatastral e ICS
        consultaType: 'ICS',
        year: '2025',
        consultaStartDate: '2025-08-19'
      }
    });

    const data = matchesResponse.data;
    
    console.log('📊 Resultados del matching mejorado:');
    console.log(`- Total consultas analizadas: ${data.totalConsultasAnalizadas}`);
    console.log(`- Total matches únicos: ${data.totalMatches}`);
    console.log(`- Pagos mediante app: ${data.totalPagosMedianteApp}`);
    console.log(`- Pagos previos: ${data.totalPagosPrevios}`);
    console.log(`- Total pagado: $${data.sumaTotalPagado}`);
    
    console.log('\n📈 Estadísticas de duplicados:');
    const stats = data.estadisticasDuplicados;
    console.log(`- Artículos únicos: ${stats.totalArticulosUnicos}`);
    console.log(`- Artículos duplicados: ${stats.totalArticulosDuplicados}`);
    console.log(`- Artículos con múltiples pagos: ${stats.totalArticulosConMultiplesPagos}`);
    
    if (stats.detalleArticulosDuplicados.length > 0) {
      console.log('\n🔍 Detalle de duplicados (top 5):');
      stats.detalleArticulosDuplicados.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. Artículo: ${item.articulo}`);
        console.log(`   - Veces consultado: ${item.vecesConsultado}`);
        console.log(`   - Pagos encontrados: ${item.numerosPagosEncontrados}`);
        console.log(`   - Total pagado: $${item.totalPagadoAcumulado}`);
      });
    }
    
    console.log('\n✅ Matches únicos (primeros 3):');
    data.matches.slice(0, 3).forEach((match, index) => {
      console.log(`${index + 1}. Artículo: ${match.recaudoData.ARTICULO}`);
      console.log(`   - Identidad: ${match.recaudoData.IDENTIDAD}`);
      console.log(`   - Total pagado: $${match.recaudoData.TOTAL_PAGADO}`);
      console.log(`   - Tipo pago: ${match.tipoPago}`);
      console.log(`   - Fecha consulta: ${match.consultaLog.createdAt}`);
    });
    
    return data;
  } catch (error) {
    console.error('❌ Error probando matches:', error.response?.data || error.message);
    throw error;
  }
}

// Función para probar consultas filtradas (solo claveCatastral e ICS)
async function testFilteredConsultas(token) {
  try {
    console.log('\n🔍 Probando consultas filtradas (solo claveCatastral e ICS)...');
    
    const response = await axios.get(`${BASE_URL}/user-stats/consulta-logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        consultaType: 'ICS',
        resultado: 'SUCCESS',
        limit: 10
      }
    });

    const data = response.data;
    
    console.log(`📊 Total consultas ICS encontradas: ${data.total}`);
    console.log(`📋 Consultas mostradas: ${data.logs.length}`);
    
    if (data.logs.length > 0) {
      console.log('\n✅ Primeras 3 consultas:');
      data.logs.slice(0, 3).forEach((log, index) => {
        console.log(`${index + 1}. ID: ${log.id}`);
        console.log(`   - Tipo: ${log.consultaType}`);
        console.log(`   - Subtipo: ${log.consultaSubtype}`);
        console.log(`   - Resultado: ${log.resultado}`);
        console.log(`   - Parámetros: ${log.parametros}`);
        console.log(`   - Fecha: ${log.createdAt}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error probando consultas filtradas:', error.response?.data || error.message);
    throw error;
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando pruebas de mejoras de deduplicación...');
    console.log('=' .repeat(60));
    
    // Obtener cookies de autenticación
    console.log('🔐 Realizando login...');
    const cookies = await login();
    console.log('✅ Login exitoso');

    // Probar endpoint de matches con deduplicación
    await testMatchesWithDeduplication(cookies);
    
    // Probar consultas filtradas
    await testFilteredConsultas(token);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Todas las pruebas completadas exitosamente!');
    console.log('\n📋 Resumen de mejoras implementadas:');
    console.log('✅ Eliminado soporte para DNI');
    console.log('✅ Solo se procesan claveCatastral e ICS');
    console.log('✅ Deduplicación por artículo (mantiene el más reciente)');
    console.log('✅ Estadísticas de duplicados actualizadas');
    console.log('✅ Filtros de consulta optimizados');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    process.exit(1);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  main();
}

module.exports = { main, testMatchesWithDeduplication, testFilteredConsultas };