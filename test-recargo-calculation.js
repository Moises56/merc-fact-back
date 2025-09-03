const fetch = require('node-fetch');

// Configuración
const BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${BASE_URL}/api/auth/login`;
const CONSULTA_EC_URL = `${BASE_URL}/consultaEC`;

// Credenciales de prueba
const credentials = {
  username: 'agarcia',
  password: '@Asd.456@'
};

// Función para hacer login y obtener cookies
async function login() {
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const cookies = response.headers.get('set-cookie');
    console.log('✅ Login exitoso');
    return cookies;
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
}

// Función para probar el cálculo del recargo
async function testRecargoCalculation() {
  try {
    console.log('🧮 Iniciando prueba de cálculo de recargo...');
    
    // Hacer login
    const cookies = await login();
    
    // Datos de prueba para consulta EC
    const testData = {
      claveCatastral: '0801-0001-00001-0001' // Usar una clave catastral de prueba
    };
    
    console.log('\n📋 Consultando estado de cuenta...');
    const response = await fetch(CONSULTA_EC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify(testData)
    });
    
    if (!response.ok) {
      throw new Error(`Consulta failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('\n=== RESULTADO DE LA CONSULTA ===');
    console.log('Nombre:', result.nombre);
    console.log('Clave Catastral:', result.claveCatastral);
    console.log('\n=== ANÁLISIS DEL CÁLCULO DE RECARGO ===');
    
    if (result.detallesMora && result.detallesMora.length > 0) {
      result.detallesMora.forEach((detalle, index) => {
        console.log(`\n--- Año ${detalle.year} ---`);
        console.log(`Impuesto: ${detalle.impuesto} (${detalle.impuestoNumerico})`);
        console.log(`Tren de Aseo: ${detalle.trenDeAseo} (${detalle.trenDeAseoNumerico})`);
        console.log(`Tasa Bomberos: ${detalle.tasaBomberos} (${detalle.tasaBomberosNumerico})`);
        console.log(`Días vencidos: ${detalle.dias}`);
        console.log(`Recargo: ${detalle.recargo} (${detalle.recargoNumerico})`);
        
        // Verificar el cálculo manualmente
        const baseRecargo = detalle.impuestoNumerico + detalle.trenDeAseoNumerico + detalle.tasaBomberosNumerico;
        const recargoCalculado = (baseRecargo * detalle.dias * 0.22) / 360;
        
        console.log(`\n🧮 Verificación del cálculo:`);
        console.log(`Base para recargo: ${baseRecargo.toFixed(2)}`);
        console.log(`Fórmula: (${baseRecargo.toFixed(2)} * ${detalle.dias} * 0.22) / 360`);
        console.log(`Recargo calculado: ${recargoCalculado.toFixed(2)}`);
        console.log(`Recargo del sistema: ${detalle.recargoNumerico.toFixed(2)}`);
        
        const diferencia = Math.abs(recargoCalculado - detalle.recargoNumerico);
        if (diferencia < 0.01) {
          console.log('✅ Cálculo correcto');
        } else {
          console.log(`❌ Diferencia encontrada: ${diferencia.toFixed(2)}`);
        }
        
        console.log(`Total: ${detalle.total} (${detalle.totalNumerico})`);
      });
    } else {
      console.log('⚠️ No se encontraron detalles de mora');
    }
    
    console.log(`\n=== TOTAL GENERAL ===`);
    console.log(`Total: ${result.totalGeneral}`);
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Ejecutar la prueba
testRecargoCalculation();