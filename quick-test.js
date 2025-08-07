// Test rápido de los endpoints principales
// Ejecutar con: node quick-test.js

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testLogin(username, password) {
  console.log(`🔐 Probando login para: ${username}`);
  
  const response = await makeRequest('POST', '/api/auth/login', {
    username: username,
    contrasena: password
  });
  
  if ((response.status === 200 || response.status === 201) && response.data.access_token) {
    console.log(`✅ Login exitoso para ${username}`);
    return response.data.access_token;
  } else {
    console.log(`❌ Error en login para ${username}:`, response.status, response.data);
    return null;
  }
}

async function testUserStats(token, userType) {
  console.log(`📈 Probando estadísticas para usuario ${userType}...`);
  
  const response = await makeRequest('GET', '/api/user-stats/my-stats', null, token);
  
  if (response.status === 200) {
    console.log(`✅ Estadísticas obtenidas para ${userType}`);
    console.log('📊 Stats resumen:', {
      totalConsultas: response.data.totalConsultas,
      consultasEC: response.data.consultasEC,
      consultasICS: response.data.consultasICS,
      ubicacion: response.data.ubicacionActual?.locationName
    });
  } else {
    console.log(`❌ Error obteniendo estadísticas para ${userType}:`, response.status, response.data);
  }
  
  return response;
}

async function testConsultaEC(token, userType) {
  console.log(`📋 Probando consulta EC para ${userType}...`);
  
  const response = await makeRequest('GET', '/consultaEC/auth?claveCatastral=12345&dni=0801123456789', null, token);
  
  if (response.status === 200 || response.status === 201) {
    console.log(`✅ Consulta EC exitosa para ${userType}`);
  } else {
    console.log(`❌ Error en consulta EC para ${userType}:`, response.status, response.data);
  }
  
  return response;
}

async function runQuickTest() {
  console.log('🚀 Iniciando test rápido del sistema de logs y estadísticas\n');
  
  try {
    // 1. Test de login USER-ADMIN
    const userAdminToken = await testLogin('useradmin', 'admin123');
    
    if (!userAdminToken) {
      console.log('❌ No se pudo obtener token USER-ADMIN');
      return;
    }

    // 2. Test de login USER regular
    const userToken = await testLogin('jperez', 'admin123');
    
    if (!userToken) {
      console.log('❌ No se pudo obtener token USER');
      return;
    }

    console.log('\n=== PROBANDO CONSULTAS CON LOGGING ===');
    
    // 3. Test de consulta con USER-ADMIN
    await testConsultaEC(userAdminToken, 'USER-ADMIN');
    
    // 4. Test de consulta con USER regular
    await testConsultaEC(userToken, 'USER');
    
    console.log('\n=== PROBANDO ESTADÍSTICAS ===');
    
    // 5. Test de estadísticas USER-ADMIN
    await testUserStats(userAdminToken, 'USER-ADMIN');
    
    // 6. Test de estadísticas USER regular
    await testUserStats(userToken, 'USER');
    
    console.log('\n🎉 Test rápido completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Esperar 3 segundos y ejecutar test
setTimeout(() => {
  runQuickTest();
}, 3000);

console.log('⏳ Esperando que el servidor esté listo...');
