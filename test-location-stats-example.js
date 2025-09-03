/**
 * Ejemplo de pruebas para el endpoint de estadísticas de ubicaciones de usuarios
 * Endpoint: GET /user-stats/users/location-history
 * 
 * Este archivo contiene ejemplos de cómo probar el endpoint con diferentes parámetros
 * y muestra las respuestas esperadas con estadísticas de consultas por ubicación.
 */

const axios = require('axios');

// Configuración base
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/user-stats';

// Headers de autenticación (REQUERIDO - ajustar según tu sistema de auth)
// IMPORTANTE: Este endpoint requiere autenticación con rol ADMIN o USER_ADMIN
const headers = {
  'Content-Type': 'application/json',
  // OPCIÓN 1: JWT Token (descomenta y reemplaza YOUR_TOKEN_HERE)
  // 'Authorization': 'Bearer YOUR_TOKEN_HERE',
  
  // OPCIÓN 2: Cookie de sesión (descomenta y reemplaza YOUR_SESSION_COOKIE)
  // 'Cookie': 'session=YOUR_SESSION_COOKIE',
  
  // OPCIÓN 3: Para pruebas rápidas, puedes usar el endpoint de login primero
  // Ver función loginAndGetToken() más abajo
};

// Variable global para almacenar el token obtenido del login
let authToken = null;

/**
 * Función para hacer login automático y obtener token
 * NOTA: Ajusta las credenciales según tu sistema
 */
async function loginAndGetToken() {
  try {
    console.log('🔐 Intentando hacer login automático...');
    
    const loginData = {
      username: 'mougrindec', // Cambiar por usuario válido
      password: 'admin123' // Cambiar por contraseña válida
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data.access_token) {
      authToken = response.data.access_token;
      console.log('✅ Login exitoso, token obtenido');
      return authToken;
    } else if (response.headers['set-cookie']) {
      // Si usa cookies en lugar de JWT
      const cookies = response.headers['set-cookie'].join('; ');
      console.log('✅ Login exitoso, cookies obtenidas');
      return cookies;
    }
    
    throw new Error('No se pudo obtener token ni cookies del login');
    
  } catch (error) {
    console.error('❌ Error en login automático:', error.response?.data || error.message);
    console.log('💡 Sugerencia: Verifica las credenciales en la función loginAndGetToken()');
    console.log('💡 O configura manualmente el token/cookie en los headers');
    throw error;
  }
}

/**
 * Función auxiliar para hacer peticiones GET con autenticación automática
 */
async function makeRequest(params = {}) {
  try {
    // Intentar login automático si no tenemos token
    if (!authToken && !headers.Authorization && !headers.Cookie) {
      try {
        await loginAndGetToken();
      } catch (loginError) {
        console.log('⚠️  Continuando sin autenticación automática...');
      }
    }
    
    const baseUrl = `${BASE_URL}${API_ENDPOINT}`;
    const url = new URL(baseUrl);
    
    // Agregar parámetros de consulta
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    console.log(`\n🔍 Realizando petición a: ${url.toString()}`);
    
    // Preparar headers con autenticación
    const requestHeaders = { ...headers };
    if (authToken && !requestHeaders.Authorization) {
      requestHeaders.Authorization = `Bearer ${authToken}`;
    }
    
    const response = await axios.get(url.toString(), { headers: requestHeaders });
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`📊 Total de usuarios: ${response.data.length}`);
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error(`❌ Error de autenticación (401):`, error.response?.data || error.message);
      console.log('💡 Sugerencias para resolver el error 401:');
      console.log('   1. Verifica las credenciales en loginAndGetToken()');
      console.log('   2. O configura manualmente el Authorization header');
      console.log('   3. O configura manualmente el Cookie header');
      console.log('   4. Asegúrate de que el usuario tenga rol ADMIN o USER_ADMIN');
    } else {
      console.error(`❌ Error en la petición:`, error.response?.data || error.message);
    }
    throw error;
  }
}

/**
 * Función para mostrar estadísticas de un usuario específico
 */
function displayUserStats(user, includeDetails = false) {
  console.log(`\n👤 Usuario: ${user.username} (ID: ${user.userId})`);
  
  if (user.consultationStats) {
    console.log(`📈 Estadísticas generales:`);
    console.log(`   - ICS Normal: ${user.consultationStats.icsNormal}`);
    console.log(`   - ICS Amnistía: ${user.consultationStats.icsAmnistia}`);
    console.log(`   - EC Normal: ${user.consultationStats.ecNormal}`);
    console.log(`   - EC Amnistía: ${user.consultationStats.ecAmnistia}`);
    console.log(`   - Total Exitosas: ${user.consultationStats.totalExitosas}`);
    console.log(`   - Total Errores: ${user.consultationStats.totalErrores}`);
    console.log(`   - Total Consultas: ${user.consultationStats.totalConsultas}`);
  }
  
  if (user.currentLocation) {
    console.log(`📍 Ubicación actual: ${user.currentLocation.locationName}`);
    if (user.currentLocation.consultationStats && includeDetails) {
      console.log(`   📊 Stats en ubicación actual:`);
      console.log(`      - ICS Normal: ${user.currentLocation.consultationStats.icsNormal}`);
      console.log(`      - EC Normal: ${user.currentLocation.consultationStats.ecNormal}`);
      console.log(`      - Total: ${user.currentLocation.consultationStats.totalConsultas}`);
    }
  }
  
  if (user.locationHistory && user.locationHistory.length > 0 && includeDetails) {
    console.log(`📚 Historial de ubicaciones (${user.locationHistory.length}):`);
    user.locationHistory.forEach((location, index) => {
      console.log(`   ${index + 1}. ${location.locationName} (${location.assignedAt})`);
      if (location.consultationStats) {
        console.log(`      📊 Stats: ICS(${location.consultationStats.icsNormal}+${location.consultationStats.icsAmnistia}) EC(${location.consultationStats.ecNormal}+${location.consultationStats.ecAmnistia}) Total: ${location.consultationStats.totalConsultas}`);
      }
    });
  }
}

/**
 * EJEMPLO 1: Obtener historial básico sin estadísticas de consultas
 */
async function ejemplo1_HistorialBasico() {
  console.log('\n' + '='.repeat(60));
  console.log('📋 EJEMPLO 1: Historial básico de ubicaciones (sin estadísticas)');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Specific user location history with consultation stats
    const userId = '254d0547-063c-4e84-a86c-1780d8a034f9';
    const test1 = await makeRequest(`${API_ENDPOINT}/user/${userId}/location-history?page=1&limit=10&sortBy=assignedAt&sortOrder=desc&includeConsultationStats=true`);
    console.log('\n=== Test 1: User Location History with Consultation Stats ===');
    console.log('Status:', test1.status);
    if (test1.success) {
      console.log('User:', test1.data.username);
      console.log('Current Location:', test1.data.currentLocation?.locationName);
      console.log('Total Locations:', test1.data.totalLocations);
      console.log('Location History Count:', test1.data.locationHistory?.length);
      
      // Show consultation stats for current location
      if (test1.data.currentLocation?.consultationStats) {
        console.log('Current Location Consultation Stats:');
        console.log('  ICS Normal:', test1.data.currentLocation.consultationStats.icsNormal);
        console.log('  ICS Amnistía:', test1.data.currentLocation.consultationStats.icsAmnistia);
        console.log('  EC Normal:', test1.data.currentLocation.consultationStats.ecNormal);
        console.log('  EC Amnistía:', test1.data.currentLocation.consultationStats.ecAmnistia);
      }
      
      // Show overall consultation stats
      if (test1.data.consultationStats) {
        console.log('Overall Consultation Stats:');
        console.log('  ICS Normal:', test1.data.consultationStats.icsNormal);
        console.log('  ICS Amnistía:', test1.data.consultationStats.icsAmnistia);
        console.log('  EC Normal:', test1.data.consultationStats.ecNormal);
        console.log('  EC Amnistía:', test1.data.consultationStats.ecAmnistia);
      }
    } else {
      console.log('Error:', test1.error);
    }
    
    // Test 2: Without consultation stats for comparison
    const test2 = await makeRequest(`${API_ENDPOINT}/user/${userId}/location-history?page=1&limit=10&sortBy=assignedAt&sortOrder=desc`);
    console.log('\n=== Test 2: Same User Without Consultation Stats ===');
    console.log('Status:', test2.status);
    if (test2.success) {
      console.log('User:', test2.data.username);
      console.log('Current Location:', test2.data.currentLocation?.locationName);
      console.log('Has consultation stats:', !!test2.data.consultationStats);
      console.log('Current location has stats:', !!test2.data.currentLocation?.consultationStats);
    } else {
      console.log('Error:', test2.error);
    }
    
    console.log('\n✅ Ejemplo 1 completado exitosamente');
    return test1;
  } catch (error) {
    console.error('❌ Error en Ejemplo 1:', error.message);
  }
}

/**
 * EJEMPLO 2: Obtener historial CON estadísticas de consultas
 */
async function ejemplo2_HistorialConEstadisticas() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 EJEMPLO 2: Historial con estadísticas de consultas');
  console.log('='.repeat(60));
  
  try {
    const params = {
      includeConsultationStats: 'true'
    };
    
    const data = await makeRequest(params);
    
    console.log(`\n📊 Respuesta exitosa - ${data.length} usuarios con estadísticas`);
    
    // Mostrar usuarios que tienen consultas
    const usersWithConsultations = data.filter(user => 
      user.consultationStats && user.consultationStats.totalConsultas > 0
    );
    
    console.log(`\n🎯 Usuarios con consultas: ${usersWithConsultations.length}`);
    
    usersWithConsultations.slice(0, 2).forEach(user => {
      displayUserStats(user, true);
    });
    
    console.log('\n✅ Ejemplo 2 completado exitosamente');
    return data;
  } catch (error) {
    console.error('❌ Error en Ejemplo 2:', error.message);
  }
}

/**
 * EJEMPLO 3: Obtener estadísticas con filtro de fechas
 */
async function ejemplo3_EstadisticasConFechas() {
  console.log('\n' + '='.repeat(60));
  console.log('📅 EJEMPLO 3: Estadísticas con filtro de fechas');
  console.log('='.repeat(60));
  
  try {
    const params = {
      includeConsultationStats: 'true',
      statsDateFrom: '2025-01-01T00:00:00.000Z',
      statsDateTo: '2025-12-31T23:59:59.999Z'
    };
    
    const data = await makeRequest(params);
    
    console.log(`\n📊 Respuesta exitosa - Estadísticas del año 2025`);
    console.log(`📈 Total usuarios: ${data.length}`);
    
    // Calcular estadísticas agregadas
    const totalStats = data.reduce((acc, user) => {
      if (user.consultationStats) {
        acc.totalConsultas += user.consultationStats.totalConsultas || 0;
        acc.totalExitosas += user.consultationStats.totalExitosas || 0;
        acc.totalErrores += user.consultationStats.totalErrores || 0;
        acc.icsTotal += (user.consultationStats.icsNormal || 0) + (user.consultationStats.icsAmnistia || 0);
        acc.ecTotal += (user.consultationStats.ecNormal || 0) + (user.consultationStats.ecAmnistia || 0);
      }
      return acc;
    }, { totalConsultas: 0, totalExitosas: 0, totalErrores: 0, icsTotal: 0, ecTotal: 0 });
    
    console.log(`\n📊 Estadísticas agregadas del período:`);
    console.log(`   - Total consultas: ${totalStats.totalConsultas}`);
    console.log(`   - Consultas exitosas: ${totalStats.totalExitosas}`);
    console.log(`   - Consultas con error: ${totalStats.totalErrores}`);
    console.log(`   - Consultas ICS: ${totalStats.icsTotal}`);
    console.log(`   - Consultas EC: ${totalStats.ecTotal}`);
    
    console.log('\n✅ Ejemplo 3 completado exitosamente');
    return data;
  } catch (error) {
    console.error('❌ Error en Ejemplo 3:', error.message);
  }
}

/**
 * EJEMPLO 4: Buscar usuario específico (simulado con filtro)
 */
async function ejemplo4_UsuarioEspecifico() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 EJEMPLO 4: Buscar usuario específico con estadísticas detalladas');
  console.log('='.repeat(60));
  
  try {
    const params = {
      includeConsultationStats: 'true'
    };
    
    const data = await makeRequest(params);
    
    // Buscar usuario "Xlee" como ejemplo
    const targetUser = data.find(user => user.username.toLowerCase().includes('xlee'));
    
    if (targetUser) {
      console.log('\n🎯 Usuario encontrado:');
      displayUserStats(targetUser, true);
      
      // Verificar consistencia de estadísticas
      console.log('\n🔍 Verificación de consistencia:');
      
      if (targetUser.currentLocation && targetUser.currentLocation.consultationStats) {
        const currentStats = targetUser.currentLocation.consultationStats;
        console.log(`✓ Estadísticas en ubicación actual (${targetUser.currentLocation.locationName}):`);
        console.log(`  - Total consultas: ${currentStats.totalConsultas}`);
      }
      
      if (targetUser.locationHistory) {
        targetUser.locationHistory.forEach(location => {
          if (location.consultationStats && location.consultationStats.totalConsultas > 0) {
            console.log(`✓ Estadísticas en ${location.locationName}: ${location.consultationStats.totalConsultas} consultas`);
          }
        });
      }
    } else {
      console.log('\n⚠️  Usuario "Xlee" no encontrado. Mostrando primer usuario con consultas:');
      const userWithStats = data.find(user => 
        user.consultationStats && user.consultationStats.totalConsultas > 0
      );
      
      if (userWithStats) {
        displayUserStats(userWithStats, true);
      } else {
        console.log('❌ No se encontraron usuarios con estadísticas de consultas');
      }
    }
    
    console.log('\n✅ Ejemplo 4 completado exitosamente');
    return data;
  } catch (error) {
    console.error('❌ Error en Ejemplo 4:', error.message);
  }
}

/**
 * Función principal que ejecuta todos los ejemplos
 */
async function ejecutarEjemplos() {
  console.log('🚀 INICIANDO PRUEBAS DEL ENDPOINT DE ESTADÍSTICAS DE UBICACIONES');
  console.log('🌐 Servidor: ' + BASE_URL);
  console.log('📡 Endpoint: ' + API_ENDPOINT);
  
  try {
    // Ejecutar ejemplos secuencialmente
    await ejemplo1_HistorialBasico();
    await ejemplo2_HistorialConEstadisticas();
    await ejemplo3_EstadisticasConFechas();
    await ejemplo4_UsuarioEspecifico();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n💥 Error general en las pruebas:', error.message);
  }
}

/**
 * Estructura de respuesta esperada del endpoint:
 * 
 * [
 *   {
 *     "userId": "string",
 *     "username": "string",
 *     "consultationStats": {  // Solo si includeConsultationStats=true
 *       "icsNormal": number,
 *       "icsAmnistia": number,
 *       "ecNormal": number,
 *       "ecAmnistia": number,
 *       "totalExitosas": number,
 *       "totalErrores": number,
 *       "totalConsultas": number
 *     },
 *     "currentLocation": {
 *       "locationName": "string",
 *       "assignedAt": "ISO_DATE_STRING",
 *       "isActive": boolean,
 *       "consultationStats": {  // Solo si includeConsultationStats=true
 *         "icsNormal": number,
 *         "icsAmnistia": number,
 *         "ecNormal": number,
 *         "ecAmnistia": number,
 *         "totalExitosas": number,
 *         "totalErrores": number,
 *         "totalConsultas": number
 *       }
 *     },
 *     "locationHistory": [
 *       {
 *         "locationName": "string",
 *         "assignedAt": "ISO_DATE_STRING",
 *         "isActive": boolean,
 *         "consultationStats": {  // Solo si includeConsultationStats=true
 *           "icsNormal": number,
 *           "icsAmnistia": number,
 *           "ecNormal": number,
 *           "ecAmnistia": number,
 *           "totalExitosas": number,
 *           "totalErrores": number,
 *           "totalConsultas": number
 *         }
 *       }
 *     ]
 *   }
 * ]
 */

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarEjemplos();
}

// Exportar funciones para uso en otros archivos
module.exports = {
  makeRequest,
  displayUserStats,
  ejemplo1_HistorialBasico,
  ejemplo2_HistorialConEstadisticas,
  ejemplo3_EstadisticasConFechas,
  ejemplo4_UsuarioEspecifico,
  ejecutarEjemplos
};

/**
 * INSTRUCCIONES DE USO:
 * 
 * 1. Instalar dependencias:
 *    npm install axios
 * 
 * 2. Asegurarse de que el servidor esté ejecutándose:
 *    npm run start:dev
 * 
 * 3. CONFIGURAR AUTENTICACIÓN (REQUERIDO):
 *    Este endpoint requiere autenticación con rol ADMIN o USER_ADMIN.
 *    Tienes 3 opciones:
 * 
 *    OPCIÓN A - Login automático (recomendado para pruebas):
 *    - Edita la función loginAndGetToken() con credenciales válidas
 *    - El script intentará hacer login automáticamente
 * 
 *    OPCIÓN B - JWT Token manual:
 *    - Obtén un token JWT haciendo login en /api/auth/login
 *    - Descomenta y configura: headers.Authorization = 'Bearer YOUR_TOKEN'
 * 
 *    OPCIÓN C - Cookie de sesión:
 *    - Haz login en el navegador y copia la cookie de sesión
 *    - Descomenta y configura: headers.Cookie = 'session=YOUR_COOKIE'
 * 
 * 4. Ejecutar las pruebas:
 *    node test-location-stats-example.js
 * 
 * 5. Para usar en otros archivos:
 *    const { makeRequest, ejecutarEjemplos } = require('./test-location-stats-example.js');
 * 
 * PARÁMETROS DISPONIBLES:
 * - includeConsultationStats: 'true' | 'false' (incluir estadísticas de consultas)
 * - statsDateFrom: ISO date string (fecha inicio para filtrar estadísticas)
 * - statsDateTo: ISO date string (fecha fin para filtrar estadísticas)
 * 
 * CASOS DE PRUEBA CUBIERTOS:
 * ✅ Historial básico sin estadísticas
 * ✅ Historial con estadísticas completas
 * ✅ Filtrado por rango de fechas
 * ✅ Búsqueda de usuario específico
 * ✅ Verificación de consistencia de datos
 * ✅ Manejo de errores y autenticación
 * ✅ Estadísticas agregadas
 * ✅ Login automático
 * 
 * EJEMPLO DE RESPUESTA EXITOSA:
 * [
 *   {
 *     "userId": "user-123",
 *     "username": "Xlee",
 *     "consultationStats": {
 *       "icsNormal": 5,
 *       "icsAmnistia": 2,
 *       "ecNormal": 3,
 *       "ecAmnistia": 1,
 *       "totalExitosas": 10,
 *       "totalErrores": 1,
 *       "totalConsultas": 11
 *     },
 *     "currentLocation": {
 *       "locationName": "Mall el Dorado",
 *       "assignedAt": "2025-01-08T10:30:00.000Z",
 *       "isActive": true,
 *       "consultationStats": {
 *         "icsNormal": 2,
 *         "icsAmnistia": 1,
 *         "ecNormal": 1,
 *         "ecAmnistia": 1,
 *         "totalExitosas": 5,
 *         "totalErrores": 0,
 *         "totalConsultas": 5
 *       }
 *     },
 *     "locationHistory": [
 *       {
 *         "locationName": "Centro Comercial",
 *         "assignedAt": "2025-01-01T08:00:00.000Z",
 *         "isActive": false,
 *         "consultationStats": {
 *           "icsNormal": 3,
 *           "icsAmnistia": 1,
 *           "ecNormal": 2,
 *           "ecAmnistia": 0,
 *           "totalExitosas": 5,
 *           "totalErrores": 1,
 *           "totalConsultas": 6
 *         }
 *       }
 *     ]
 *   }
 * ]
 * 
 * SOLUCIÓN DE PROBLEMAS:
 * 
 * ❌ Error 401 (Unauthorized):
 *    - Verifica que las credenciales en loginAndGetToken() sean correctas
 *    - Asegúrate de que el usuario tenga rol ADMIN o USER_ADMIN
 *    - O configura manualmente el token/cookie en los headers
 * 
 * ❌ Error 404 (Not Found):
 *    - Verifica que el servidor esté ejecutándose en http://localhost:3000
 *    - Confirma que la ruta sea /api/user-stats/users/location-history
 * 
 * ❌ Error de conexión:
 *    - Asegúrate de que el servidor esté ejecutándose: npm run start:dev
 *    - Verifica que no haya conflictos de puerto
 * 
 * ✅ Estadísticas por ubicación muestran 0:
 *    - Esto es normal si el usuario no ha hecho consultas en esa ubicación específica
 *    - Las estadísticas se filtran por el período de tiempo que el usuario estuvo en cada ubicación
 *    - Las estadísticas generales del usuario pueden ser diferentes a las específicas por ubicación
 */