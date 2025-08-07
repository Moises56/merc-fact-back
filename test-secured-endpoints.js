// Test para verificar que todos los endpoints de consulta requieren autenticación
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSecuredEndpoints() {
  console.log('🔒 Testeando que los endpoints de consulta requieren autenticación...\n');

  const endpoints = [
    '/consultaEC?claveCatastral=12345678&dni=12345678',
    '/consultaEC/amnistia?claveCatastral=12345678&dni=12345678',
    '/consultaICS?ics=12345678&dni=12345678',
    '/consultaICS/amnistia?ics=12345678&dni=12345678'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📋 Probando endpoint: ${endpoint}`);
      
      // Intentar acceder sin autenticación - debería fallar
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        validateStatus: function (status) {
          return status < 500; // No lanzar error para códigos de estado esperados
        }
      });

      if (response.status === 401) {
        console.log(`✅ CORRECTO: ${endpoint} requiere autenticación (401 Unauthorized)`);
      } else {
        console.log(`❌ ERROR: ${endpoint} permite acceso sin autenticación (status: ${response.status})`);
      }
      
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✅ CORRECTO: ${endpoint} requiere autenticación (401 Unauthorized)`);
      } else {
        console.log(`❌ ERROR inesperado en ${endpoint}:`, error.message);
      }
    }
  }

  console.log('\n🎯 Test de seguridad completado. Todos los endpoints deben mostrar "CORRECTO".');
}

// Ejecutar test
testSecuredEndpoints().catch(console.error);
