// Test para verificar el endpoint de ubicaciones
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLocationsEndpoint() {
  console.log('📍 Testeando endpoint de ubicaciones...\n');

  try {
    // 1. Login para obtener cookies de autenticación
    console.log('📋 Paso 1: Iniciando sesión...');
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

    // 2. Probar endpoint de ubicaciones
    console.log('\n📋 Paso 2: Obteniendo todas las ubicaciones...');
    
    const locationsResponse = await axios.get(`${BASE_URL}/api/user-stats/locations`, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (locationsResponse.status === 200) {
      console.log('✅ Endpoint de ubicaciones funciona correctamente');
      
      const locations = locationsResponse.data;
      
      console.log('\n📊 Información de ubicaciones:');
      console.log(`Total de ubicaciones: ${locations.length}`);
      
      if (locations.length > 0) {
        console.log('\n🏷️ Lista de ubicaciones:');
        
        locations.forEach((location, index) => {
          const codigo = location.locationCode || 'Sin código';
          const descripcion = location.description || 'Sin descripción';
          const activa = location.isActive ? '✅ Activa' : '❌ Inactiva';
          const usuarios = location.usersCount || 0;
          
          console.log(`  ${index + 1}. ${location.locationName}`);
          console.log(`     - Código: ${codigo}`);
          console.log(`     - Descripción: ${descripcion}`);
          console.log(`     - Estado: ${activa}`);
          console.log(`     - Usuarios asignados: ${usuarios}`);
          console.log('');
        });
        
        // Estadísticas
        const ubicacionesActivas = locations.filter(loc => loc.isActive).length;
        const ubicacionesInactivas = locations.filter(loc => !loc.isActive).length;
        const totalUsuarios = locations.reduce((sum, loc) => sum + (loc.usersCount || 0), 0);
        
        console.log('📈 Resumen:');
        console.log(`  ✅ Ubicaciones activas: ${ubicacionesActivas}`);
        console.log(`  ❌ Ubicaciones inactivas: ${ubicacionesInactivas}`);
        console.log(`  👥 Total usuarios con ubicación: ${totalUsuarios}`);
        
        // Mostrar ejemplo de ubicación completa
        console.log('\n📄 Ejemplo de ubicación (estructura completa):');
        console.log(JSON.stringify(locations[0], null, 2));
        
      } else {
        console.log('⚠️  No se encontraron ubicaciones en el sistema.');
        console.log('💡 Sugerencia: Asigna ubicaciones a usuarios usando el endpoint:');
        console.log('   POST /api/user-stats/user-location');
      }
      
    } else {
      console.log(`❌ Endpoint falló: ${locationsResponse.status}`);
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
testLocationsEndpoint().catch(console.error);
