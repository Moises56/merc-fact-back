// Test para verificar actualización de perfil propio
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUserProfileUpdate() {
  console.log('👤 Testeando actualización de perfil propio...\n');

  try {
    // 1. Login como usuario regular
    console.log('📋 Paso 1: Iniciando sesión como usuario regular...');
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

    // 2. Obtener perfil actual
    console.log('\n📋 Paso 2: Obteniendo perfil actual...');
    
    const profileResponse = await axios.get(`${BASE_URL}/api/users/me`, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (profileResponse.status === 200) {
      console.log('✅ Perfil obtenido correctamente');
      console.log(`Usuario: ${profileResponse.data.username}`);
      console.log(`Nombre: ${profileResponse.data.nombre} ${profileResponse.data.apellido}`);
      console.log(`Email: ${profileResponse.data.correo}`);
    }

    // 3. Actualizar perfil propio usando /api/users/me
    console.log('\n📋 Paso 3: Actualizando perfil usando /api/users/me...');
    
    const updateData = {
      nombre: 'Nombre Actualizado',
      apellido: 'Apellido Actualizado',
      telefono: '99887766'
    };

    const updateMeResponse = await axios.patch(`${BASE_URL}/api/users/me`, updateData, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (updateMeResponse.status === 200) {
      console.log('✅ Perfil actualizado correctamente usando /api/users/me');
      console.log(`Nuevo nombre: ${updateMeResponse.data.nombre} ${updateMeResponse.data.apellido}`);
      console.log(`Nuevo teléfono: ${updateMeResponse.data.telefono}`);
    }

    // 4. Probar actualización usando /api/users/:id (debería funcionar también)
    console.log('\n📋 Paso 4: Actualizando perfil usando /api/users/:id...');
    
    const userId = profileResponse.data.id;
    const updateData2 = {
      nombre: 'Nombre Final',
      apellido: 'Apellido Final'
    };

    const updateByIdResponse = await axios.patch(`${BASE_URL}/api/users/${userId}`, updateData2, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (updateByIdResponse.status === 200) {
      console.log('✅ Perfil actualizado correctamente usando /api/users/:id');
      console.log(`Nombre final: ${updateByIdResponse.data.nombre} ${updateByIdResponse.data.apellido}`);
    }

    // 5. Intentar actualizar campos restringidos (debería fallar)
    console.log('\n📋 Paso 5: Intentando actualizar campos restringidos...');
    
    try {
      await axios.patch(`${BASE_URL}/api/users/me`, {
        role: 'ADMIN', // Campo restringido
        isActive: false // Campo restringido
      }, {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true
      });
      
      console.log('❌ ERROR: Se permitió actualizar campos restringidos');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Correctamente bloqueó actualización de campos restringidos');
      } else {
        console.log('⚠️ Error inesperado:', error.response?.status || error.message);
      }
    }

    // 6. Intentar actualizar otro usuario (debería fallar)
    console.log('\n📋 Paso 6: Intentando actualizar otro usuario...');
    
    try {
      // Usar un ID diferente (simulamos otro usuario)
      const otherUserId = '11111111-1111-1111-1111-111111111111';
      await axios.patch(`${BASE_URL}/api/users/${otherUserId}`, {
        nombre: 'Intento Hackeo'
      }, {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true
      });
      
      console.log('❌ ERROR: Se permitió actualizar otro usuario');
    } catch (error) {
      if (error.response && (error.response.status === 403 || error.response.status === 404)) {
        console.log('✅ Correctamente bloqueó actualización de otro usuario');
      } else {
        console.log('⚠️ Error inesperado:', error.response?.status || error.message);
      }
    }

    console.log('\n🎉 Test completado exitosamente');

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
testUserProfileUpdate().catch(console.error);
