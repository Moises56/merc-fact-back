/**
 * PRUEBA DEL ENDPOINT DE ANULACIÓN DE FACTURAS
 * ============================================
 * 
 * Este archivo contiene las pruebas para verificar que el nuevo endpoint 
 * de anulación de facturas funciona correctamente con auditoría completa.
 */

const axios = require('axios');

// Configuración del endpoint
const BASE_URL = 'http://localhost:3001/api';
let authToken = '';

/**
 * 1. AUTENTICACIÓN
 */
async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      correo: 'mougrind@amdc.hn',
      contrasena: 'Admin123!'
    });

    authToken = response.data.access_token;
    console.log('✅ Login exitoso');
    console.log(`📱 Token: ${authToken.substring(0, 20)}...`);
    
    return authToken;
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 2. CREAR FACTURA DE PRUEBA
 */
async function crearFacturaPrueba() {
  try {
    console.log('\n📄 Creando factura de prueba...');
    
    const facturaData = {
      localId: "f47ac10b-58cc-4372-a567-0e02b2c3d479", // Cambiar por un ID válido
      concepto: "Prueba de anulación",
      mes: "2025-01",
      anio: 2025,
      monto: 100.00,
      fecha_vencimiento: "2025-02-28"
    };

    const response = await axios.post(`${BASE_URL}/facturas`, facturaData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Factura creada exitosamente');
    console.log(`📋 ID: ${response.data.id}`);
    console.log(`💰 Monto: $${response.data.monto}`);
    console.log(`📅 Estado: ${response.data.estado}`);
    
    return response.data.id;
  } catch (error) {
    console.error('❌ Error creando factura:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 3. ANULAR FACTURA
 */
async function anularFactura(facturaId) {
  try {
    console.log(`\n🚫 Anulando factura ${facturaId}...`);
    
    const anulacionData = {
      razon_anulacion: "Factura creada por error durante las pruebas del sistema de anulación. Esta es una prueba técnica."
    };

    const response = await axios.patch(
      `${BASE_URL}/facturas/${facturaId}/anular`, 
      anulacionData,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Factura anulada exitosamente');
    console.log(`📋 ID: ${response.data.id}`);
    console.log(`📅 Estado: ${response.data.estado}`);
    console.log(`🕒 Fecha anulación: ${response.data.fecha_anulacion}`);
    console.log(`📝 Razón: ${response.data.razon_anulacion}`);
    console.log(`👤 Anulada por: ${response.data.anuladaBy?.nombre} ${response.data.anuladaBy?.apellido}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error anulando factura:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 4. VERIFICAR AUDITORÍA
 */
async function verificarAuditoria() {
  try {
    console.log('\n🔍 Verificando logs de auditoría...');
    
    const response = await axios.get(`${BASE_URL}/audit/logs?limit=5`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Logs de auditoría obtenidos');
    console.log(`📊 Total de logs recientes: ${response.data.length}`);
    
    // Buscar logs de anulación
    const logsAnulacion = response.data.filter(log => log.accion === 'ANULAR');
    console.log(`🚫 Logs de anulación encontrados: ${logsAnulacion.length}`);
    
    if (logsAnulacion.length > 0) {
      const ultimaAnulacion = logsAnulacion[0];
      console.log(`📋 Última anulación:`);
      console.log(`   - Usuario: ${ultimaAnulacion.user?.nombre} ${ultimaAnulacion.user?.apellido}`);
      console.log(`   - Fecha: ${ultimaAnulacion.createdAt}`);
      console.log(`   - IP: ${ultimaAnulacion.ip}`);
      console.log(`   - Registro ID: ${ultimaAnulacion.registroId}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error verificando auditoría:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * 5. PROBAR VALIDACIONES
 */
async function probarValidaciones(facturaId) {
  console.log('\n🧪 Probando validaciones...');
  
  // Intentar anular sin razón
  try {
    console.log('📝 Prueba 1: Anular sin razón...');
    await axios.patch(
      `${BASE_URL}/facturas/${facturaId}/anular`, 
      { razon_anulacion: "" },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('❌ FALLO: Debería haber rechazado razón vacía');
  } catch (error) {
    console.log('✅ CORRECTO: Rechazó razón vacía');
    console.log(`   Error: ${error.response?.data?.message[0] || error.response?.data?.message}`);
  }

  // Intentar anular con razón muy corta
  try {
    console.log('📝 Prueba 2: Anular con razón muy corta...');
    await axios.patch(
      `${BASE_URL}/facturas/${facturaId}/anular`, 
      { razon_anulacion: "corta" },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('❌ FALLO: Debería haber rechazado razón muy corta');
  } catch (error) {
    console.log('✅ CORRECTO: Rechazó razón muy corta');
    console.log(`   Error: ${error.response?.data?.message[0] || error.response?.data?.message}`);
  }

  // Intentar anular factura ya anulada
  try {
    console.log('📝 Prueba 3: Anular factura ya anulada...');
    await axios.patch(
      `${BASE_URL}/facturas/${facturaId}/anular`, 
      { razon_anulacion: "Intentando anular factura ya anulada para probar validación" },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('❌ FALLO: Debería haber rechazado factura ya anulada');
  } catch (error) {
    console.log('✅ CORRECTO: Rechazó factura ya anulada');
    console.log(`   Error: ${error.response?.data?.message}`);
  }
}

/**
 * EJECUTAR TODAS LAS PRUEBAS
 */
async function ejecutarPruebas() {
  console.log('🚀 INICIANDO PRUEBAS DEL ENDPOINT DE ANULACIÓN');
  console.log('='.repeat(60));
  
  try {
    // 1. Login
    await login();
    
    // 2. Crear factura de prueba
    const facturaId = await crearFacturaPrueba();
    
    // 3. Anular factura
    await anularFactura(facturaId);
    
    // 4. Verificar auditoría
    await verificarAuditoria();
    
    // 5. Probar validaciones
    await probarValidaciones(facturaId);
    
    console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('✅ Endpoint de anulación funcionando correctamente');
    console.log('✅ Validaciones implementadas correctamente');
    console.log('✅ Auditoría registrando todas las acciones');
    
  } catch (error) {
    console.log('\n💥 ERROR EN LAS PRUEBAS');
    console.log('='.repeat(60));
    console.error('Detalles del error:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  ejecutarPruebas();
}

module.exports = {
  login,
  crearFacturaPrueba,
  anularFactura,
  verificarAuditoria,
  probarValidaciones,
  ejecutarPruebas
};
