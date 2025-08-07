// Test con datos reales
// Ejecutar con: node test-real-data.js

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Datos reales proporcionados
const DATOS_REALES = {
  EC: {
    claveCatastral: '23-0799-005',
    dni: '0101195401184'
  },
  ICS: {
    ics: 'ICS-006454',
    rtn: '08019022363089'
  }
};

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

async function testConsultaECReal(token, userType) {
  console.log(`📋 Probando consulta EC REAL para ${userType}...`);
  console.log(`   Clave Catastral: ${DATOS_REALES.EC.claveCatastral}`);
  console.log(`   DNI: ${DATOS_REALES.EC.dni}`);
  
  const url = `/consultaEC/auth?claveCatastral=${DATOS_REALES.EC.claveCatastral}&dni=${DATOS_REALES.EC.dni}`;
  const response = await makeRequest('GET', url, null, token);
  
  if (response.status === 200) {
    console.log(`✅ Consulta EC REAL exitosa para ${userType}`);
    console.log('📊 Resultado:', {
      totalGeneral: response.data.totalGeneral,
      totalAPagar: response.data.totalAPagar,
      registrosEncontrados: response.data.registros?.length || 0
    });
  } else {
    console.log(`❌ Error en consulta EC REAL para ${userType}:`, response.status, response.data);
  }
  
  return response;
}

async function testConsultaICSReal(token, userType) {
  console.log(`📋 Probando consulta ICS REAL para ${userType}...`);
  console.log(`   ICS: ${DATOS_REALES.ICS.ics}`);
  console.log(`   DNI: ${DATOS_REALES.ICS.rtn}`);
  
  const url = `/consultaICS/auth?ics=${DATOS_REALES.ICS.ics}&dni=${DATOS_REALES.ICS.rtn}`;
  const response = await makeRequest('GET', url, null, token);
  
  if (response.status === 200) {
    console.log(`✅ Consulta ICS REAL exitosa para ${userType}`);
    console.log('📊 Resultado:', {
      totalGeneral: response.data.totalGeneral,
      totalAPagar: response.data.totalAPagar,
      registrosEncontrados: response.data.registros?.length || 0
    });
  } else {
    console.log(`❌ Error en consulta ICS REAL para ${userType}:`, response.status, response.data);
  }
  
  return response;
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
      consultasExitosas: response.data.consultasExitosas,
      consultasFallidas: response.data.consultasFallidas,
      ubicacion: response.data.ubicacionActual?.locationName
    });
  } else {
    console.log(`❌ Error obteniendo estadísticas para ${userType}:`, response.status, response.data);
  }
  
  return response;
}

async function runRealDataTest() {
  console.log('🚀 INICIANDO TEST CON DATOS REALES\n');
  console.log('📋 Datos de prueba:');
  console.log('   EC - Clave Catastral:', DATOS_REALES.EC.claveCatastral, '| DNI:', DATOS_REALES.EC.dni);
  console.log('   ICS - ICS:', DATOS_REALES.ICS.ics, '| DNI:', DATOS_REALES.ICS.rtn);
  console.log('');
  
  try {
    // 1. Test de login
    console.log('=== FASE 1: AUTENTICACIÓN ===');
    const userAdminToken = await testLogin('useradmin', 'admin123');
    const userToken = await testLogin('jperez', 'admin123');
    
    if (!userAdminToken || !userToken) {
      console.log('❌ No se pudieron obtener todos los tokens');
      return;
    }
    
    console.log('\n=== FASE 2: CONSULTAS CON DATOS REALES ===');
    
    // 2. Estadísticas ANTES de las consultas
    console.log('\n--- Estadísticas ANTES de consultas ---');
    await testUserStats(userAdminToken, 'USER-ADMIN');
    await testUserStats(userToken, 'USER');
    
    // 3. Consultas EC con datos reales
    console.log('\n--- Consultas EC con datos reales ---');
    await testConsultaECReal(userAdminToken, 'USER-ADMIN');
    await testConsultaECReal(userToken, 'USER');
    
    // 4. Consultas ICS con datos reales
    console.log('\n--- Consultas ICS con datos reales ---');
    await testConsultaICSReal(userAdminToken, 'USER-ADMIN');
    await testConsultaICSReal(userToken, 'USER');
    
    // 5. Estadísticas DESPUÉS de las consultas
    console.log('\n=== FASE 3: VERIFICACIÓN DE LOGGING ===');
    console.log('\n--- Estadísticas DESPUÉS de consultas ---');
    await testUserStats(userAdminToken, 'USER-ADMIN');
    await testUserStats(userToken, 'USER');
    
    console.log('\n🎉 TEST CON DATOS REALES COMPLETADO');
    console.log('📝 Revisa los logs del servidor para verificar que el interceptor esté funcionando');
    
  } catch (error) {
    console.error('❌ Error durante el test:', error.message);
  }
}

// Esperar 2 segundos y ejecutar test
setTimeout(() => {
  runRealDataTest();
}, 2000);

console.log('⏳ Esperando que el servidor esté listo para datos reales...');
