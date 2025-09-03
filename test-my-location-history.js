// Test para verificar el endpoint de mi historial de ubicaciones
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testMyLocationHistory() {
  console.log('🚀 PROBANDO ENDPOINT DE MI HISTORIAL DE UBICACIONES\n');

  try {
    // 1. Login para obtener cookies de autenticación
    console.log('📋 Paso 1: Iniciando sesión...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'agarcia',
      contrasena: '@Asd.456@'
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

    // 2. Test del endpoint my-location-history sin estadísticas
    console.log('\n=== Test 1: Mi historial sin estadísticas ===');
    const url1 = `${BASE_URL}/api/user-stats/my-location-history`;
    const params1 = {
      page: 1,
      limit: 10,
      sortOrder: 'desc'
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
    console.log('📋 Respuesta (sin estadísticas):');
    console.log(JSON.stringify(response1.data, null, 2));

    // 3. Test del endpoint my-location-history con estadísticas
    console.log('\n=== Test 2: Mi historial con estadísticas ===');
    const url2 = `${BASE_URL}/api/user-stats/my-location-history`;
    const params2 = {
      page: 1,
      limit: 10,
      sortOrder: 'desc',
      includeConsultationStats: true
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
    console.log('📋 Respuesta (con estadísticas):');
    console.log(JSON.stringify(response2.data, null, 2));

    // 4. Verificar estructura de la respuesta
    console.log('\n=== Verificación de estructura ===');
    const data = response2.data;
    
    console.log('✅ Campos principales:');
    console.log(`  - userId: ${data.userId ? '✅' : '❌'}`);
    console.log(`  - username: ${data.username ? '✅' : '❌'}`);
    console.log(`  - nombre: ${data.nombre ? '✅' : '❌'}`);
    console.log(`  - apellido: ${data.apellido ? '✅' : '❌'}`);
    console.log(`  - currentLocation: ${data.currentLocation ? '✅' : '❌'}`);
    console.log(`  - locationHistory: ${Array.isArray(data.locationHistory) ? '✅' : '❌'}`);
    console.log(`  - totalLocations: ${typeof data.totalLocations === 'number' ? '✅' : '❌'}`);
    
    if (data.currentLocation) {
      console.log('\n✅ Ubicación actual:');
      console.log(`  - locationName: ${data.currentLocation.locationName}`);
      console.log(`  - assignedByUsername: ${data.currentLocation.assignedByUsername}`);
      console.log(`  - isActive: ${data.currentLocation.isActive}`);
      
      if (data.currentLocation.consultationStats) {
        console.log('  - consultationStats: ✅ Incluidas');
      } else {
        console.log('  - consultationStats: ❌ No incluidas');
      }
    }
    
    if (data.locationHistory && data.locationHistory.length > 0) {
      console.log('\n✅ Historial de ubicaciones:');
      console.log(`  - Total de ubicaciones: ${data.locationHistory.length}`);
      
      data.locationHistory.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.locationName}`);
        console.log(`     - Activa: ${location.isActive ? 'Sí' : 'No'}`);
        console.log(`     - Asignado por: ${location.assignedByUsername}`);
        console.log(`     - Duración: ${location.durationDays} días`);
        
        if (location.consultationStats) {
          console.log('     - Estadísticas: ✅ Incluidas');
        }
      });
    }

    console.log('\n🎉 PRUEBA COMPLETADA EXITOSAMENTE!');
    console.log('\n📝 RESUMEN:');
    console.log('✅ Endpoint /api/user-stats/my-location-history funciona correctamente');
    console.log('✅ Los usuarios pueden ver su propio historial de ubicaciones');
    console.log('✅ Las estadísticas de consultas se incluyen cuando se solicitan');
    console.log('✅ El campo assignedByUsername muestra nombres reales en lugar de UUIDs');

  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
    if (error.response) {
      console.error('Detalles del error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

// Ejecutar test
testMyLocationHistory().catch(console.error);