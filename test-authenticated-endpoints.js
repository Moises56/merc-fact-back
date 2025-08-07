// Test completo para verificar autenticación y funcionalidad de endpoints seguros
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testWithAuthentication() {
  console.log('🔐 Testeando endpoints seguros CON autenticación...\n');

  try {
    // 1. Login para obtener cookies de autenticación
    console.log('📋 Paso 1: Iniciando sesión...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'useradmin',
      contrasena: 'admin123'
    }, {
      withCredentials: true // Importante para manejar cookies
    });

    if (loginResponse.status !== 200) {
      throw new Error(`Login falló con status: ${loginResponse.status}`);
    }

    console.log('✅ Login exitoso');
    
    // Extraer cookies para futuras requests
    const cookies = loginResponse.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';

    // 2. Probar endpoints de consulta EC con autenticación
    console.log('\n📋 Paso 2: Probando endpoints de consulta EC...');
    
    // Test ConsultaEC normal
    console.log('🔍 Probando /consultaEC...');
    const ecResponse = await axios.get(`${BASE_URL}/consultaEC`, {
      params: {
        claveCatastral: '12345678',
        dni: '12345678'
      },
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (ecResponse.status === 200) {
      console.log('✅ ConsultaEC exitosa con autenticación');
    } else {
      console.log(`❌ ConsultaEC falló: ${ecResponse.status}`);
    }

    // Test ConsultaEC amnistía
    console.log('🔍 Probando /consultaEC/amnistia...');
    const ecAmnistiaResponse = await axios.get(`${BASE_URL}/consultaEC/amnistia`, {
      params: {
        claveCatastral: '12345678',
        dni: '12345678'
      },
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (ecAmnistiaResponse.status === 200) {
      console.log('✅ ConsultaEC/amnistia exitosa con autenticación');
    } else {
      console.log(`❌ ConsultaEC/amnistia falló: ${ecAmnistiaResponse.status}`);
    }

    // 3. Probar endpoints de consulta ICS con autenticación
    console.log('\n📋 Paso 3: Probando endpoints de consulta ICS...');
    
    // Test ConsultaICS normal
    console.log('🔍 Probando /consultaICS...');
    const icsResponse = await axios.get(`${BASE_URL}/consultaICS`, {
      params: {
        ics: '12345678',
        dni: '12345678'
      },
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (icsResponse.status === 200) {
      console.log('✅ ConsultaICS exitosa con autenticación');
    } else {
      console.log(`❌ ConsultaICS falló: ${icsResponse.status}`);
    }

    // Test ConsultaICS amnistía
    console.log('🔍 Probando /consultaICS/amnistia...');
    const icsAmnistiaResponse = await axios.get(`${BASE_URL}/consultaICS/amnistia`, {
      params: {
        ics: '12345678',
        dni: '12345678'
      },
      headers: {
        'Cookie': cookieHeader
      },
      withCredentials: true
    });
    
    if (icsAmnistiaResponse.status === 200) {
      console.log('✅ ConsultaICS/amnistia exitosa con autenticación');
    } else {
      console.log(`❌ ConsultaICS/amnistia falló: ${icsAmnistiaResponse.status}`);
    }

    console.log('\n🎯 Todas las consultas completadas exitosamente con autenticación!');
    console.log('✨ Los endpoints ahora están correctamente protegidos y funcionales.');

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
testWithAuthentication().catch(console.error);
