const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLogsEndpointWithAuth() {
  try {
    console.log('🔐 Iniciando sesión con usuario mougrindec...');
    
    // Paso 1: Login para obtener cookie de autenticación
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'mougrindec',
      contrasena: 'admin123'
    }, {
      withCredentials: true, // Importante para recibir cookies
      validateStatus: function (status) {
        return status < 500; // No lanzar error para códigos < 500
      }
    });

    if (loginResponse.status !== 200) {
      console.error('❌ Error en login:', loginResponse.data);
      return;
    }

    console.log('✅ Login exitoso');
    console.log('📊 Datos del usuario:', loginResponse.data);

    // Extraer cookies del login
    const cookies = loginResponse.headers['set-cookie'];
    console.log('🍪 Cookies recibidas:', cookies);

    // Paso 2: Probar endpoint /api/user-stats/logs con diferentes filtros
    const testCases = [
      {
        name: 'Consultas EC con claveCatastral',
        params: {
          limit: 5,
          offset: 0,
          consultaType: 'EC',
          resultado: 'SUCCESS',
          parametros: 'claveCatastral'
        }
      },
      {
        name: 'Consultas ICS',
        params: {
          limit: 5,
          offset: 0,
          consultaType: 'ICS',
          resultado: 'SUCCESS'
        }
      },
      {
        name: 'Todas las consultas SUCCESS',
        params: {
          limit: 10,
          offset: 0,
          resultado: 'SUCCESS'
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Probando: ${testCase.name}`);
      
      const queryParams = new URLSearchParams(testCase.params).toString();
      const url = `${BASE_URL}/api/user-stats/logs?${queryParams}`;
      
      console.log('📡 URL:', url);
      
      try {
        const response = await axios.get(url, {
          headers: {
            'Cookie': cookies ? cookies.join('; ') : ''
          },
          withCredentials: true,
          validateStatus: function (status) {
            return status < 500;
          }
        });

        if (response.status === 200) {
          console.log('✅ Respuesta exitosa:');
          console.log('📊 Total de logs:', response.data.total);
          console.log('📋 Cantidad de logs devueltos:', response.data.logs?.length || 0);
          
          if (response.data.logs && response.data.logs.length > 0) {
            console.log('📝 Primer log de ejemplo:');
            const firstLog = response.data.logs[0];
            console.log('  - ID:', firstLog.id);
            console.log('  - Tipo consulta:', firstLog.consultaType);
            console.log('  - Resultado:', firstLog.resultado);
            console.log('  - Parámetros:', firstLog.parametros);
            console.log('  - Fecha:', firstLog.fechaConsulta);
          }
        } else {
          console.error('❌ Error en respuesta:', response.status, response.data);
        }
      } catch (error) {
        console.error('❌ Error en petición:', error.message);
        if (error.response) {
          console.error('📄 Detalles del error:', error.response.data);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
    if (error.response) {
      console.error('📄 Detalles:', error.response.data);
    }
  }
}

// Ejecutar el test
testLogsEndpointWithAuth();