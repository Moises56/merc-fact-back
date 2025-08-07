// Test para verificar el endpoint de ubicaciones con usuarios asignados
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLocationsWithUsers() {
  console.log('📍 Testeando endpoint de ubicaciones con usuarios asignados...\n');

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

    // 2. Probar endpoint de ubicaciones con usuarios
    console.log('\n📋 Paso 2: Obteniendo ubicaciones con usuarios asignados...');
    
    const locationsResponse = await axios.get(`${BASE_URL}/api/user-stats/locations`, {
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (locationsResponse.status === 200) {
      console.log('✅ Endpoint de ubicaciones con usuarios funciona correctamente');
      
      const locations = locationsResponse.data;
      
      console.log('\n📊 Información de ubicaciones:');
      console.log(`Total de ubicaciones: ${locations.length}`);
      
      if (locations.length > 0) {
        console.log('\n🏷️ Lista de ubicaciones con usuarios:');
        
        locations.forEach((location, index) => {
          const codigo = location.locationCode || 'Sin código';
          const descripcion = location.description || 'Sin descripción';
          const activa = location.isActive ? '✅ Activa' : '❌ Inactiva';
          const usuarios = location.users || [];
          
          console.log(`  ${index + 1}. ${location.locationName}`);
          console.log(`     - Código: ${codigo}`);
          console.log(`     - Descripción: ${descripcion}`);
          console.log(`     - Estado: ${activa}`);
          console.log(`     - Cantidad de usuarios: ${location.usersCount}`);
          
          if (usuarios.length > 0) {
            console.log(`     - Usuarios asignados:`);
            usuarios.forEach((user, userIndex) => {
              const nombreCompleto = `${user.nombre} ${user.apellido}`;
              const estado = user.isActive ? '✅' : '❌';
              const ultimoLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('es-HN') : 'Nunca';
              const fechaAsignacion = new Date(user.assignedAt).toLocaleDateString('es-HN');
              
              console.log(`       ${userIndex + 1}. ${estado} ${user.username} (${nombreCompleto})`);
              console.log(`          - Email: ${user.correo}`);
              console.log(`          - Rol: ${user.role}`);
              console.log(`          - Último login: ${ultimoLogin}`);
              console.log(`          - Asignado el: ${fechaAsignacion}`);
              if (user.assignedBy) {
                console.log(`          - Asignado por: ${user.assignedBy}`);
              }
              console.log('');
            });
          } else {
            console.log(`     - ⚠️  Sin usuarios asignados`);
          }
          console.log('');
        });
        
        // Estadísticas generales
        const ubicacionesActivas = locations.filter(loc => loc.isActive).length;
        const ubicacionesInactivas = locations.filter(loc => !loc.isActive).length;
        const totalUsuarios = locations.reduce((sum, loc) => sum + (loc.usersCount || 0), 0);
        const ubicacionesConUsuarios = locations.filter(loc => loc.usersCount > 0).length;
        const ubicacionesSinUsuarios = locations.filter(loc => loc.usersCount === 0).length;
        
        console.log('📈 Resumen detallado:');
        console.log(`  ✅ Ubicaciones activas: ${ubicacionesActivas}`);
        console.log(`  ❌ Ubicaciones inactivas: ${ubicacionesInactivas}`);
        console.log(`  👥 Total usuarios con ubicación: ${totalUsuarios}`);
        console.log(`  🏢 Ubicaciones CON usuarios: ${ubicacionesConUsuarios}`);
        console.log(`  🏗️  Ubicaciones SIN usuarios: ${ubicacionesSinUsuarios}`);
        
        // Mostrar ejemplo de ubicación completa con usuarios
        const ubicacionConUsuarios = locations.find(loc => loc.users && loc.users.length > 0);
        if (ubicacionConUsuarios) {
          console.log('\n📄 Ejemplo de ubicación con usuarios (estructura completa):');
          console.log(JSON.stringify(ubicacionConUsuarios, null, 2));
        }
        
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
testLocationsWithUsers().catch(console.error);
