// Using built-in fetch (Node.js 18+)

// Configuración
const BASE_URL = 'http://localhost:3000';
const USER_ID = '254d0547-063c-4e84-a86c-1780d8a034f9';

// Token de autenticación (configurar manualmente si es necesario)
let authToken = null;

async function makeRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    console.log(`🔍 Realizando petición a: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers,
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('❌ Error:', response.status, data);
      return { success: false, status: response.status, error: data };
    }

    return { success: true, status: response.status, data };
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return { success: false, error: error.message };
  }
}

async function testUserLocationHistory() {
  console.log('🚀 PROBANDO ENDPOINT DE HISTORIAL DE UBICACIONES DE USUARIO');
  console.log('============================================================');
  
  // Test 1: Con estadísticas de consultas
  console.log('\n=== Test 1: Con estadísticas de consultas ===');
  const url1 = `${BASE_URL}/api/user-stats/user/${USER_ID}/location-history?page=1&limit=10&sortBy=assignedAt&sortOrder=desc&includeConsultationStats=true`;
  const result1 = await makeRequest(url1);
  
  if (result1.success) {
    console.log('✅ Éxito!');
    console.log('Usuario:', result1.data.username);
    console.log('Ubicación actual:', result1.data.currentLocation?.locationName);
    console.log('Total ubicaciones:', result1.data.totalLocations);
    
    // Mostrar estadísticas de ubicación actual
    if (result1.data.currentLocation?.consultationStats) {
      console.log('\n📊 Estadísticas de ubicación actual:');
      const stats = result1.data.currentLocation.consultationStats;
      console.log(`  ICS Normal: ${stats.icsNormal}`);
      console.log(`  ICS Amnistía: ${stats.icsAmnistia}`);
      console.log(`  EC Normal: ${stats.ecNormal}`);
      console.log(`  EC Amnistía: ${stats.ecAmnistia}`);
    } else {
      console.log('⚠️  No hay estadísticas para la ubicación actual');
    }
    
    // Mostrar estadísticas generales
    if (result1.data.consultationStats) {
      console.log('\n📊 Estadísticas generales del usuario:');
      const stats = result1.data.consultationStats;
      console.log(`  ICS Normal: ${stats.icsNormal}`);
      console.log(`  ICS Amnistía: ${stats.icsAmnistia}`);
      console.log(`  EC Normal: ${stats.ecNormal}`);
      console.log(`  EC Amnistía: ${stats.ecAmnistia}`);
    } else {
      console.log('⚠️  No hay estadísticas generales');
    }
    
    // Mostrar historial de ubicaciones
    if (result1.data.locationHistory && result1.data.locationHistory.length > 0) {
      console.log('\n📍 Historial de ubicaciones:');
      result1.data.locationHistory.forEach((location, index) => {
        console.log(`  ${index + 1}. ${location.locationName} (${location.isActive ? 'Activa' : 'Inactiva'})`);
        if (location.consultationStats) {
          const stats = location.consultationStats;
          console.log(`     Stats: ICS(${stats.icsNormal}/${stats.icsAmnistia}) EC(${stats.ecNormal}/${stats.ecAmnistia})`);
        }
      });
    }
  } else {
    console.log('❌ Error en Test 1:', result1.error);
  }
  
  // Test 2: Sin estadísticas de consultas
  console.log('\n=== Test 2: Sin estadísticas de consultas ===');
  const url2 = `${BASE_URL}/api/user-stats/user/${USER_ID}/location-history?page=1&limit=10&sortBy=assignedAt&sortOrder=desc`;
  const result2 = await makeRequest(url2);
  
  if (result2.success) {
    console.log('✅ Éxito!');
    console.log('Usuario:', result2.data.username);
    console.log('Ubicación actual:', result2.data.currentLocation?.locationName);
    console.log('Tiene estadísticas generales:', !!result2.data.consultationStats);
    console.log('Ubicación actual tiene estadísticas:', !!result2.data.currentLocation?.consultationStats);
  } else {
    console.log('❌ Error en Test 2:', result2.error);
  }
  
  console.log('\n============================================================');
  console.log('🎉 PRUEBAS COMPLETADAS');
}

// Ejecutar las pruebas
testUserLocationHistory().catch(console.error);