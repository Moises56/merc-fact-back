// Test para verificar la asignación de ubicación (problema corregido)
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLocationAssignment() {
  console.log('📍 Testeando asignación de ubicación (error P2002 corregido)...\n');

  try {
    // 1. Login como USER-ADMIN
    console.log('📋 Paso 1: Iniciando sesión como USER-ADMIN...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'useradmin',
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

    // 2. Obtener lista de usuarios para seleccionar uno
    console.log('\n📋 Paso 2: Obteniendo lista de usuarios...');
    
    const usersResponse = await axios.get(`${BASE_URL}/api/users?page=1&limit=5`, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (usersResponse.status === 200 && usersResponse.data.data.length > 0) {
      const testUser = usersResponse.data.data[0]; // Primer usuario de la lista
      console.log(`✅ Usuario seleccionado: ${testUser.username} (${testUser.id})`);
      
      // 3. Asignar ubicación por primera vez
      console.log('\n📋 Paso 3: Asignando ubicación inicial...');
      
      const locationData1 = {
        userId: testUser.id,
        locationName: 'Mall Multiplaza',
        locationCode: 'MULT_001',
        description: 'Centro comercial principal'
      };

      try {
        const assignResponse1 = await axios.post(`${BASE_URL}/api/user-stats/user-location`, locationData1, {
          headers: {
            'Cookie': cookieHeader,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (assignResponse1.status === 201) {
          console.log('✅ Primera ubicación asignada exitosamente');
          console.log(`   Usuario: ${assignResponse1.data.username}`);
          console.log(`   Ubicación: ${assignResponse1.data.locationName}`);
          console.log(`   Código: ${assignResponse1.data.locationCode}`);
        }
        
      } catch (error) {
        console.log('❌ Error asignando primera ubicación:', error.response?.data || error.message);
        return;
      }

      // 4. Cambiar ubicación (esto antes causaba el error P2002)
      console.log('\n📋 Paso 4: Cambiando ubicación (test del error P2002)...');
      
      const locationData2 = {
        userId: testUser.id,
        locationName: 'Centro Histórico',
        locationCode: 'CENTRO_001',
        description: 'Centro histórico de la ciudad'
      };

      try {
        const assignResponse2 = await axios.post(`${BASE_URL}/api/user-stats/user-location`, locationData2, {
          headers: {
            'Cookie': cookieHeader,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (assignResponse2.status === 201) {
          console.log('✅ Ubicación cambiada exitosamente (error P2002 resuelto)');
          console.log(`   Usuario: ${assignResponse2.data.username}`);
          console.log(`   Nueva ubicación: ${assignResponse2.data.locationName}`);
          console.log(`   Nuevo código: ${assignResponse2.data.locationCode}`);
        }
        
      } catch (error) {
        if (error.response?.status === 400 && error.response.data.message?.includes('P2002')) {
          console.log('❌ Error P2002 aún persiste:', error.response.data.message);
        } else {
          console.log('❌ Error cambiando ubicación:', error.response?.data || error.message);
        }
        return;
      }

      // 5. Cambiar ubicación una vez más para confirmar
      console.log('\n📋 Paso 5: Cambiando ubicación nuevamente...');
      
      const locationData3 = {
        userId: testUser.id,
        locationName: 'Oficina Principal',
        locationCode: 'OFICINA_001',
        description: 'Oficina principal AMDC'
      };

      try {
        const assignResponse3 = await axios.post(`${BASE_URL}/api/user-stats/user-location`, locationData3, {
          headers: {
            'Cookie': cookieHeader,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
        
        if (assignResponse3.status === 201) {
          console.log('✅ Ubicación cambiada nuevamente - ¡Problema completamente resuelto!');
          console.log(`   Usuario: ${assignResponse3.data.username}`);
          console.log(`   Ubicación final: ${assignResponse3.data.locationName}`);
          console.log(`   Código final: ${assignResponse3.data.locationCode}`);
        }
        
      } catch (error) {
        console.log('❌ Error en tercer cambio:', error.response?.data || error.message);
      }

      // 6. Verificar ubicaciones en el sistema
      console.log('\n📋 Paso 6: Verificando ubicaciones en el sistema...');
      
      try {
        const locationsResponse = await axios.get(`${BASE_URL}/api/user-stats/locations`, {
          headers: {
            'Cookie': cookieHeader
          },
          withCredentials: true
        });
        
        if (locationsResponse.status === 200) {
          console.log('✅ Ubicaciones obtenidas:');
          locationsResponse.data.forEach((location, index) => {
            console.log(`   ${index + 1}. ${location.locationName} (${location.usersCount} usuarios)`);
          });
        }
        
      } catch (error) {
        console.log('❌ Error obteniendo ubicaciones:', error.response?.data || error.message);
      }

      console.log('\n🎉 Test completado exitosamente - Error P2002 resuelto');

    } else {
      console.log('❌ No se encontraron usuarios para probar');
    }

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
testLocationAssignment().catch(console.error);
