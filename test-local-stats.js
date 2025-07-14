// Script para probar el nuevo endpoint de estadísticas de local
const axios = require('axios');

async function testLocalStats() {
  try {
    console.log('🧪 Probando endpoint de estadísticas de local...\n');

    // Necesitamos obtener un ID de local válido primero
    const localesResponse = await axios.get('http://localhost:3000/api/locales', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Necesitarás reemplazar con un token válido
      },
      params: {
        limit: 1,
      },
    });

    if (localesResponse.data.data.length === 0) {
      console.log('❌ No hay locales en la base de datos para probar');
      return;
    }

    const localId = localesResponse.data.data[0].id;
    console.log(`📍 Probando con local ID: ${localId}`);

    // Probar el nuevo endpoint de estadísticas
    const statsResponse = await axios.get(`http://localhost:3000/api/locales/${localId}/stats`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Necesitarás reemplazar con un token válido
      },
    });

    console.log('\n✅ Respuesta del endpoint de estadísticas:');
    console.log(JSON.stringify(statsResponse.data, null, 2));

    // Verificar que incluye todos los campos requeridos
    const data = statsResponse.data;
    const requiredFields = [
      'local_id',
      'local_nombre', 
      'local_numero',
      'local_estado',
      'mercado',
      'estadisticas_facturas',
      'estadisticas_financieras'
    ];

    console.log('\n🔍 Verificando campos requeridos:');
    requiredFields.forEach(field => {
      if (data[field] !== undefined) {
        console.log(`✅ ${field}: presente`);
      } else {
        console.log(`❌ ${field}: FALTANTE`);
      }
    });

    // Verificar subcampos de estadisticas_facturas
    const facturasFields = [
      'total_facturas',
      'facturas_pendientes',
      'facturas_pagadas', 
      'facturas_vencidas',
      'facturas_anuladas'
    ];

    console.log('\n📊 Verificando estadísticas de facturas:');
    facturasFields.forEach(field => {
      if (data.estadisticas_facturas[field] !== undefined) {
        console.log(`✅ ${field}: ${data.estadisticas_facturas[field]}`);
      } else {
        console.log(`❌ ${field}: FALTANTE`);
      }
    });

    // Verificar subcampos de estadisticas_financieras
    const financierasFields = [
      'total_recaudado',
      'monto_total_facturas',
      'monto_pendiente',
      'recaudo_esperado_mensual',
      'recaudo_esperado_anual',
      'porcentaje_recaudacion'
    ];

    console.log('\n💰 Verificando estadísticas financieras:');
    financierasFields.forEach(field => {
      if (data.estadisticas_financieras[field] !== undefined) {
        console.log(`✅ ${field}: $${data.estadisticas_financieras[field]}`);
      } else {
        console.log(`❌ ${field}: FALTANTE`);
      }
    });

  } catch (error) {
    if (error.response) {
      console.log('❌ Error del servidor:', error.response.status);
      console.log('📄 Respuesta:', error.response.data);
    } else {
      console.log('❌ Error de conexión:', error.message);
    }
  }
}

// Función para probar sin autenticación (para desarrollo)
async function testLocalStatsWithoutAuth() {
  try {
    console.log('🧪 Probando endpoint de estadísticas de local (sin auth)...\n');

    // ID de ejemplo basado en conversaciones anteriores
    const localId = 'a2564f93-d208-4d63-a394-2d0cf89bd23b'; // Este podría no existir

    const response = await axios.get(`http://localhost:3000/api/locales/${localId}/stats`);
    
    console.log('\n✅ Respuesta del endpoint:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.log('❌ Error del servidor:', error.response.status);
      console.log('📄 Respuesta:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n💡 Nota: El endpoint requiere autenticación. Para probarlo:');
        console.log('1. Inicia sesión en /api/auth/login');
        console.log('2. Usa el token JWT en el header Authorization');
        console.log('3. O temporalmente desactiva la autenticación en el endpoint para pruebas');
      }
    } else {
      console.log('❌ Error de conexión:', error.message);
      console.log('\n💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
    }
  }
}

// Ejecutar la función de prueba
if (require.main === module) {
  testLocalStatsWithoutAuth();
}

module.exports = { testLocalStats, testLocalStatsWithoutAuth };
