// Test completo del sistema de logs y estadísticas de usuarios
// Ejecutar con: node test-user-stats-system.js

const https = require('https');

const CONFIG = {
  baseUrl: 'http://localhost:3000',
  users: {
    admin: { username: 'admin', password: 'admin' },
    userAdmin: { username: 'useradmin', password: 'admin123' },
    user: { username: 'jperez', password: 'admin123' }
  }
};

// Helper para hacer requests HTTP
function makeRequest(method, path, body = null, token = null) {
  const url = new URL(path, CONFIG.baseUrl);
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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

// Test de autenticación
async function testLogin(credentials) {
  console.log(`🔐 Probando login para: ${credentials.username}`);
  
  const response = await makeRequest('POST', '/auth/login', credentials);
  
  if (response.status === 201 && response.data.access_token) {
    console.log(`✅ Login exitoso para ${credentials.username}`);
    return response.data.access_token;
  } else {
    console.log(`❌ Error en login para ${credentials.username}:`, response);
    return null;
  }
}

// Test de consulta EC con logging
async function testConsultaECWithLogging(token, tipo = 'normal') {
  console.log(`📋 Probando consulta EC (${tipo}) con logging...`);
  
  const endpoint = tipo === 'amnistia' ? '/consultaEC/auth/amnistia' : '/consultaEC/auth';
  const body = {
    claveCatastral: '12345',
    dni: '0801123456789'
  };
  
  const response = await makeRequest('POST', endpoint, body, token);
  
  if (response.status === 200 || response.status === 201) {
    console.log(`✅ Consulta EC (${tipo}) exitosa`);
    console.log('📊 Resultado:', response.data);
  } else {
    console.log(`❌ Error en consulta EC (${tipo}):`, response);
  }
  
  return response;
}

// Test de consulta ICS con logging
async function testConsultaICSWithLogging(token, tipo = 'normal') {
  console.log(`📋 Probando consulta ICS (${tipo}) con logging...`);
  
  const endpoint = tipo === 'amnistia' ? '/consultaICS/auth/amnistia' : '/consultaICS/auth';
  const body = {
    ics: '67890',
    dni: '0801987654321'
  };
  
  const response = await makeRequest('POST', endpoint, body, token);
  
  if (response.status === 200 || response.status === 201) {
    console.log(`✅ Consulta ICS (${tipo}) exitosa`);
    console.log('📊 Resultado:', response.data);
  } else {
    console.log(`❌ Error en consulta ICS (${tipo}):`, response);
  }
  
  return response;
}

// Test de estadísticas de usuario
async function testUserStats(token, userType) {
  console.log(`📈 Probando estadísticas para usuario ${userType}...`);
  
  const response = await makeRequest('GET', '/user-stats/my-stats', null, token);
  
  if (response.status === 200) {
    console.log(`✅ Estadísticas obtenidas para ${userType}`);
    console.log('📊 Stats:', JSON.stringify(response.data, null, 2));
  } else {
    console.log(`❌ Error obteniendo estadísticas para ${userType}:`, response);
  }
  
  return response;
}

// Test de estadísticas de todos los usuarios (solo ADMIN)
async function testAllUsersStats(token) {
  console.log('📈 Probando estadísticas de todos los usuarios (ADMIN)...');
  
  const response = await makeRequest('GET', '/user-stats/all-users-stats', null, token);
  
  if (response.status === 200) {
    console.log('✅ Estadísticas de todos los usuarios obtenidas');
    console.log('📊 Stats:', JSON.stringify(response.data, null, 2));
  } else {
    console.log('❌ Error obteniendo estadísticas de todos los usuarios:', response);
  }
  
  return response;
}

// Test de logs de consulta (solo ADMIN)
async function testConsultaLogs(token) {
  console.log('📋 Probando obtención de logs de consulta (ADMIN)...');
  
  const response = await makeRequest('GET', '/user-stats/consulta-logs', null, token);
  
  if (response.status === 200) {
    console.log('✅ Logs de consulta obtenidos');
    console.log('📊 Logs:', JSON.stringify(response.data, null, 2));
  } else {
    console.log('❌ Error obteniendo logs de consulta:', response);
  }
  
  return response;
}

// Test de acceso de USER-ADMIN
async function testUserAdminAccess(token) {
  console.log('🔐 Probando acceso USER-ADMIN a endpoints restringidos...');
  
  // Debería tener acceso a consultas EC/ICS
  await testConsultaECWithLogging(token);
  await testConsultaICSWithLogging(token, 'amnistia');
  
  // Debería tener acceso a sus propias estadísticas
  await testUserStats(token, 'USER-ADMIN');
  
  // NO debería tener acceso a estadísticas de todos los usuarios
  const allStatsResponse = await makeRequest('GET', '/user-stats/all-users-stats', null, token);
  if (allStatsResponse.status === 403) {
    console.log('✅ USER-ADMIN correctamente restringido de estadísticas globales');
  } else {
    console.log('❌ USER-ADMIN tiene acceso no autorizado a estadísticas globales');
  }
}

// Test principal
async function runTests() {
  console.log('🚀 Iniciando tests del sistema de logs y estadísticas de usuarios\n');
  
  try {
    // 1. Test de login para diferentes tipos de usuario
    console.log('=== FASE 1: AUTENTICACIÓN ===');
    const adminToken = await testLogin(CONFIG.users.admin);
    const userAdminToken = await testLogin(CONFIG.users.userAdmin);
    const userToken = await testLogin(CONFIG.users.user);
    
    if (!adminToken || !userAdminToken || !userToken) {
      console.log('❌ No se pudieron obtener todos los tokens. Verifica que los usuarios existan.');
      return;
    }
    
    console.log('\n=== FASE 2: CONSULTAS CON LOGGING ===');
    
    // 2. Test de consultas con diferentes usuarios
    await testConsultaECWithLogging(userToken, 'normal');
    await testConsultaECWithLogging(userToken, 'amnistia');
    await testConsultaICSWithLogging(userToken, 'normal');
    await testConsultaICSWithLogging(userToken, 'amnistia');
    
    // 3. Test con USER-ADMIN
    await testConsultaECWithLogging(userAdminToken, 'normal');
    await testConsultaICSWithLogging(userAdminToken, 'amnistia');
    
    console.log('\n=== FASE 3: ESTADÍSTICAS DE USUARIO ===');
    
    // 4. Test de estadísticas
    await testUserStats(userToken, 'USER');
    await testUserStats(userAdminToken, 'USER-ADMIN');
    await testUserStats(adminToken, 'ADMIN');
    
    console.log('\n=== FASE 4: FUNCIONES ADMINISTRATIVAS ===');
    
    // 5. Test de funciones administrativas (solo ADMIN)
    await testAllUsersStats(adminToken);
    await testConsultaLogs(adminToken);
    
    console.log('\n=== FASE 5: CONTROL DE ACCESO ===');
    
    // 6. Test de control de acceso USER-ADMIN
    await testUserAdminAccess(userAdminToken);
    
    console.log('\n🎉 Tests completados');
    
  } catch (error) {
    console.error('❌ Error durante los tests:', error);
  }
}

// Ejecutar tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
