// Test simple para verificar el error 403 en actualización de perfil
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testUserUpdate() {
  console.log('🔧 Testeando actualización de usuario (debe fallar con 403)...\n');

  try {
    // 1. Login con el usuario que cambié la contraseña
    console.log('📋 Paso 1: Iniciando sesión...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'agarcia',  // Usuario que vimos en los logs
      contrasena: '@Asd.456@'  // Nueva contraseña que se estableció
    }, {
      withCredentials: true
    });

    console.log('✅ Login exitoso');
    
    // Extraer cookies para futuras requests
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    // 2. Intentar actualizar el perfil del usuario actual usando el ID específico
    console.log('\n📋 Paso 2: Intentando actualizar perfil propio...');
    
    const userId = '254d0547-063c-4e84-a86c-1780d8a034f9'; // El ID que mencionaste
    
    try {
      const updateResponse = await axios.patch(`${BASE_URL}/api/users/${userId}`, {
        nombre: 'Nombre Actualizado',
        apellido: 'Apellido Actualizado'
      }, {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true
      });
      
      console.log('❌ ERROR: Debería haber fallado pero funcionó');
      console.log('Respuesta:', updateResponse.data);
      
    } catch (error) {
      if (error.response) {
        console.log(`⚠️ Error ${error.response.status}: ${error.response.data.message}`);
        
        if (error.response.status === 403) {
          console.log('✅ Correcto: Error 403 - El usuario no puede actualizar este ID');
        } else if (error.response.status === 404) {
          console.log('⚠️ Error 404: Usuario no encontrado');
        } else {
          console.log('⚠️ Error inesperado');
        }
      } else {
        console.log('❌ Error de conexión:', error.message);
      }
    }

    // 3. Probar actualización usando el endpoint /api/users/me
    console.log('\n📋 Paso 3: Probando endpoint /api/users/me...');
    
    try {
      const updateMeResponse = await axios.patch(`${BASE_URL}/api/users/me`, {
        nombre: 'Mi Nombre Actualizado',
        apellido: 'Mi Apellido Actualizado'
      }, {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true
      });
      
      console.log('✅ Actualización exitosa usando /api/users/me');
      console.log(`Nuevo nombre: ${updateMeResponse.data.nombre} ${updateMeResponse.data.apellido}`);
      
    } catch (error) {
      console.log('❌ Error actualizando con /api/users/me:', error.response?.data || error.message);
    }

    // 4. Obtener el ID del usuario actual para probarlo correctamente
    console.log('\n📋 Paso 4: Obteniendo mi ID real...');
    
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/users/me`, {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true
      });
      
      console.log('✅ Mi perfil obtenido');
      console.log(`Mi ID: ${profileResponse.data.id}`);
      console.log(`Mi usuario: ${profileResponse.data.username}`);
      
      // Ahora probar actualizar con mi ID real
      console.log('\n📋 Paso 5: Actualizando con mi ID real...');
      
      const updateWithRealIdResponse = await axios.patch(`${BASE_URL}/api/users/${profileResponse.data.id}`, {
        nombre: 'Nombre Con ID Real',
        apellido: 'Apellido Con ID Real'
      }, {
        headers: {
          'Cookie': cookieHeader
        },
        withCredentials: true
      });
      
      console.log('✅ Actualización exitosa usando mi ID real');
      console.log(`Nombre final: ${updateWithRealIdResponse.data.nombre} ${updateWithRealIdResponse.data.apellido}`);
      
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
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
testUserUpdate().catch(console.error);
