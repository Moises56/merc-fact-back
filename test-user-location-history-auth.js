// Test para verificar el endpoint de historial de ubicaciones con autenticación
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const USER_ID = '254d0547-063c-4e84-a86c-1780d8a034f9'; // ID del usuario a probar

async function testUserLocationHistoryWithAuth() {
  console.log('🚀 PROBANDO ENDPOINT DE HISTORIAL DE UBICACIONES CON AUTENTICACIÓN\n');

  try {
    // 1. Login para obtener cookies de autenticación
    console.log('📋 Paso 1: Iniciando sesión...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'mougrindec',
      contrasena: 'admin123'
    }, {
      withCredentials: true
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login falló con status: ${loginResponse.status}`);
    }

    console.log('✅ Login exitoso');
    
    // Extraer cookies para futuras requests
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    // 2. Test con estadísticas de consultas
    console.log('\n=== Test 1: Con estadísticas de consultas ===');
    const url1 = `${BASE_URL}/api/user-stats/user/${USER_ID}/location-history`;
    const params1 = {
      page: 1,
      limit: 10,
      sortBy: 'assignedAt',
      sortOrder: 'desc',
      includeConsultationStats: true
    };
    
    console.log(`🔍 Realizando petición a: ${url1}`);
    console.log(`📊 Parámetros:`, params1);
    
    const response1 = await axios.get(url1, {
      params: params1,
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });

    console.log(`✅ Status: ${response1.status}`);
    console.log('📋 Respuesta (con estadísticas):');
    console.log(JSON.stringify(response1.data, null, 2));

    // Verificar si tiene consultationStats
    if (response1.data.data && response1.data.data.length > 0) {
      const firstLocation = response1.data.data[0];
      if (firstLocation.consultationStats) {
        console.log('✅ consultationStats presente en la respuesta');
      } else {
        console.log('❌ consultationStats NO presente en la respuesta');
      }
      
      if (firstLocation.assignedByUsername && !firstLocation.assignedByUsername.includes('-')) {
        console.log('✅ assignedByUsername muestra nombre real:', firstLocation.assignedByUsername);
      } else {
        console.log('❌ assignedByUsername sigue mostrando UUID:', firstLocation.assignedByUsername);
      }
    }

    // 3. Test sin estadísticas de consultas
    console.log('\n=== Test 2: Sin estadísticas de consultas ===');
    const url2 = `${BASE_URL}/api/user-stats/user/${USER_ID}/location-history`;
    const params2 = {
      page: 1,
      limit: 10,
      sortBy: 'assignedAt',
      sortOrder: 'desc'
      // No includeConsultationStats
    };
    
    console.log(`🔍 Realizando petición a: ${url2}`);
    console.log(`📊 Parámetros:`, params2);
    
    const response2 = await axios.get(url2, {
      params: params2,
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });

    console.log(`✅ Status: ${response2.status}`);
    console.log('📋 Respuesta (sin estadísticas):');
    console.log(JSON.stringify(response2.data, null, 2));

    // Verificar que NO tenga consultationStats
    if (response2.data.data && response2.data.data.length > 0) {
      const firstLocation = response2.data.data[0];
      if (!firstLocation.consultationStats) {
        console.log('✅ consultationStats correctamente ausente');
      } else {
        console.log('❌ consultationStats presente cuando no debería estar');
      }
    }

  } catch (error) {
    console.error('❌ Error en el test:', error.response?.data || error.message);
  }

  console.log('\n============================================================');
  console.log('🎉 PRUEBAS COMPLETADAS');
}

// Ejecutar el test
testUserLocationHistoryWithAuth();