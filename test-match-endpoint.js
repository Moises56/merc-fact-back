const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMatchEndpoint() {
  try {
    console.log('🔐 Iniciando sesión...');
    
    // 1. Login para obtener cookies de autenticación
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'mougrindec',
      contrasena: 'admin123'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login exitoso');
    console.log('🍪 Cookies recibidas:', loginResponse.headers['set-cookie']);

    // 2. Probar endpoint de match con año 2025
    console.log('\n🧪 Probando endpoint de match con año 2025...');
    const matchUrl = `${BASE_URL}/api/user-stats/match?year=2025`;
    console.log('📡 URL:', matchUrl);
    
    const matchResponse = await axios.get(matchUrl, {
      withCredentials: true,
      headers: {
        'Cookie': loginResponse.headers['set-cookie']?.join('; ') || ''
      }
    });

    console.log('✅ Respuesta exitosa del endpoint match:');
    const data = matchResponse.data;
    
    console.log('\n📊 ESTADÍSTICAS GENERALES:');
    console.log(`📈 Total consultas analizadas: ${data.totalConsultasAnalizadas}`);
    console.log(`🎯 Total matches encontrados: ${data.totalMatches}`);
    console.log(`💰 Suma total encontrado en consultas: ${data.sumaTotalEncontrado?.toLocaleString('es-HN')}`);
    console.log(`💵 Suma total pagado en RECAUDO: ${data.sumaTotalPagado?.toLocaleString('es-HN')}`);
    
    console.log('\n📱 PAGOS MEDIANTE APP (después de consulta):');
    console.log(`📊 Cantidad: ${data.totalPagosMedianteApp}`);
    console.log(`💰 Suma total: ${data.sumaTotalPagadoMedianteApp?.toLocaleString('es-HN')}`);
    console.log(`💵 Promedio por pago: ${data.totalPagosMedianteApp > 0 ? (data.sumaTotalPagadoMedianteApp / data.totalPagosMedianteApp).toLocaleString('es-HN') : 'N/A'}`);
    
    console.log('\n🕐 PAGOS PREVIOS (antes de consulta):');
    console.log(`📊 Cantidad: ${data.totalPagosPrevios}`);
    console.log(`💰 Suma total: ${data.sumaTotalPagosPrevios?.toLocaleString('es-HN')}`);
    console.log(`💵 Promedio por pago: ${data.totalPagosPrevios > 0 ? (data.sumaTotalPagosPrevios / data.totalPagosPrevios).toLocaleString('es-HN') : 'N/A'}`);
    
    console.log('\n🔍 ANÁLISIS DE COHERENCIA:');
    const totalPagos = data.totalPagosMedianteApp + data.totalPagosPrevios;
    const totalSumaPagos = data.sumaTotalPagadoMedianteApp + data.sumaTotalPagosPrevios;
    console.log(`✅ Total pagos: ${totalPagos} (debe coincidir con totalMatches: ${data.totalMatches})`);
    console.log(`✅ Total suma pagos: ${totalSumaPagos?.toLocaleString('es-HN')} (debe coincidir con sumaTotalPagado: ${data.sumaTotalPagado?.toLocaleString('es-HN')})`);
    
    if (totalPagos === data.totalMatches) {
      console.log('✅ COHERENCIA: Los totales de pagos coinciden');
    } else {
      console.log('❌ ERROR: Los totales de pagos NO coinciden');
    }
    
    if (Math.abs(totalSumaPagos - data.sumaTotalPagado) < 0.01) {
      console.log('✅ COHERENCIA: Las sumas de pagos coinciden');
    } else {
      console.log('❌ ERROR: Las sumas de pagos NO coinciden');
    }
    
    console.log('\n📋 ESTADÍSTICAS DE DUPLICADOS:');
    console.log(`🔢 Artículos únicos: ${data.estadisticasDuplicados?.totalArticulosUnicos}`);
    console.log(`🔄 Artículos duplicados: ${data.estadisticasDuplicados?.totalArticulosDuplicados}`);
    console.log(`💳 Artículos con múltiples pagos: ${data.estadisticasDuplicados?.totalArticulosConMultiplesPagos}`);
    
    console.log('\n⏰ Período consultado:');
    console.log(`📅 ${data.periodoConsultado}`);
    
    // Mostrar algunos ejemplos de matches
    if (data.matches && data.matches.length > 0) {
      console.log('\n🔍 EJEMPLOS DE MATCHES (primeros 3):');
      data.matches.slice(0, 3).forEach((match, index) => {
        console.log(`\n📋 Match ${index + 1}:`);
        console.log(`  🏷️  Parámetro: ${match.parametro}`);
        console.log(`  📅 Fecha consulta: ${new Date(match.consultaLog.createdAt).toLocaleDateString('es-HN')}`);
        console.log(`  💰 Total encontrado: ${match.consultaLog.totalEncontrado?.toLocaleString('es-HN')}`);
        console.log(`  📅 Fecha pago: ${new Date(match.recaudoData.FECHA_PAGO).toLocaleDateString('es-HN')}`);
        console.log(`  💵 Total pagado: ${match.recaudoData.TOTAL_PAGADO?.toLocaleString('es-HN')}`);
        console.log(`  🏷️  Tipo pago: ${match.tipoPago}`);
        console.log(`  📱 Es pago mediante app: ${match.esPagoMedianteApp ? 'SÍ' : 'NO'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('🔐 Error de autenticación. Verifica las credenciales.');
    }
  }
}

testMatchEndpoint();