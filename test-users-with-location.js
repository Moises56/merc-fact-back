// Test para verificar que el endpoint de usuarios incluye la ubicación
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUsersWithLocation() {
  console.log('📍 Testeando endpoint de usuarios con ubicaciones...\n');

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

    // 2. Probar endpoint de usuarios
    console.log('\n📋 Paso 2: Obteniendo lista de usuarios...');
    
    const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
      params: {
        page: 1,
        limit: 5
      },
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (usersResponse.status === 200) {
      console.log('✅ Endpoint de usuarios funciona correctamente');
      
      // Verificar la estructura de la respuesta
      const { data, pagination } = usersResponse.data;
      
      console.log('\n📊 Información de la respuesta:');
      console.log(`Total de usuarios: ${pagination.total_items}`);
      console.log(`Usuarios en esta página: ${data.length}`);
      
      // Verificar si los usuarios tienen el campo ubicacion
      console.log('\n🏷️ Verificando campo ubicacion en usuarios:');
      
      let usuariosConUbicacion = 0;
      let usuariosSinUbicacion = 0;
      
      data.forEach((user, index) => {
        const tieneUbicacion = user.ubicacion !== null && user.ubicacion !== undefined;
        const ubicacionTexto = tieneUbicacion ? `"${user.ubicacion}"` : 'Sin ubicación';
        
        console.log(`  ${index + 1}. ${user.username} (${user.nombre} ${user.apellido}) - Ubicación: ${ubicacionTexto}`);
        
        if (tieneUbicacion) {
          usuariosConUbicacion++;
        } else {
          usuariosSinUbicacion++;
        }
      });
      
      console.log('\n📈 Resumen:');
      console.log(`  ✅ Usuarios CON ubicación: ${usuariosConUbicacion}`);
      console.log(`  ⚠️  Usuarios SIN ubicación: ${usuariosSinUbicacion}`);
      
      // Verificar que el campo 'ubicacion' existe en la estructura
      const primerUsuario = data[0];
      if (primerUsuario) {
        const camposUsuario = Object.keys(primerUsuario);
        const tieneUbicacionField = camposUsuario.includes('ubicacion');
        
        console.log('\n🔍 Verificación de estructura:');
        console.log(`  Campo 'ubicacion' presente: ${tieneUbicacionField ? '✅ SÍ' : '❌ NO'}`);
        
        if (tieneUbicacionField) {
          console.log('  🎯 ¡PERFECTO! El endpoint ahora incluye la ubicación de los usuarios.');
        } else {
          console.log('  ❌ ERROR: El campo ubicacion no está presente en la respuesta.');
        }
      }
      
      // Mostrar ejemplo de usuario completo
      if (data.length > 0) {
        console.log('\n📄 Ejemplo de usuario (estructura completa):');
        console.log(JSON.stringify(data[0], null, 2));
      }
      
    } else {
      console.log(`❌ Endpoint falló: ${usersResponse.status}`);
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
testUsersWithLocation().catch(console.error);
