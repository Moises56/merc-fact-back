// Script para verificar y diagnost    // 2. Verificar logs inmediatamente después del login
    console.log('2️⃣ Verificando logs de auditoría después del login...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const logsResponse = await axiosInstance.get('/api/audit/logs?limit=5'); sistema de auditoría
const axios = require('axios');

async function testAuditSystem() {
  const baseUrl = 'http://localhost:3000';
  let cookies = '';
  
  // Configurar axios para manejar cookies
  const axiosInstance = axios.create({
    baseURL: baseUrl,
    withCredentials: true,
  });
  
  try {
    console.log('🧪 Iniciando diagnóstico del sistema de auditoría...\n');

    // 1. Login para obtener token
    console.log('1️⃣ Realizando login para obtener token...');
    const loginResponse = await axiosInstance.post('/api/auth/login', {
      username: 'mougrind',
      contrasena: '@Asd.456@'
    });
    
    // Extraer cookies de la respuesta
    const setCookieHeaders = loginResponse.headers['set-cookie'];
    if (setCookieHeaders) {
      cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
      axiosInstance.defaults.headers.Cookie = cookies;
    }
    
    console.log('✅ Login exitoso');
    console.log('📄 Respuesta completa del login:', JSON.stringify(loginResponse.data, null, 2));
    console.log('🍪 Cookies establecidas:', cookies);
    console.log('');

    // 2. Verificar logs inmediatamente después del login
    console.log('2️⃣ Verificando logs de auditoría después del login...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const logsResponse = await axios.get(`${baseUrl}/api/audit/logs?limit=5`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    console.log(`📊 Total de logs encontrados: ${logsResponse.data.total}`);
    if (logsResponse.data.data.length > 0) {
      console.log('🎉 ¡Sistema de auditoría funcionando!');
      console.log('📋 Últimos logs:');
      logsResponse.data.data.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.accion} en ${log.tabla} por ${log.user.nombre} (${new Date(log.createdAt).toLocaleString()})`);
      });
    } else {
      console.log('❌ No se encontraron logs de auditoría');
    }
    console.log('');

    // 3. Realizar acción que debe generar log (consultar dashboard)
    console.log('3️⃣ Ejecutando acción que debe generar log de auditoría...');
    await axios.get(`${baseUrl}/api/dashboard/statistics`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    console.log('✅ Acción ejecutada (consulta dashboard)\n');

    // 4. Verificar si se creó el nuevo log
    console.log('4️⃣ Verificando nuevos logs después de la acción...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const newLogsResponse = await axios.get(`${baseUrl}/api/audit/logs?limit=5`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    console.log(`📊 Total de logs encontrados: ${newLogsResponse.data.total}`);
    if (newLogsResponse.data.total > logsResponse.data.total) {
      console.log('🎉 ¡Nuevo log de auditoría creado exitosamente!');
    } else {
      console.log('⚠️ No se detectaron nuevos logs de auditoría');
    }
    
    // 5. Mostrar estadísticas de auditoría
    console.log('\n5️⃣ Obteniendo estadísticas de auditoría...');
    const statsResponse = await axios.get(`${baseUrl}/api/audit/stats`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    console.log('📈 Estadísticas de auditoría:');
    console.log(`   • Total de logs: ${statsResponse.data.total_logs}`);
    console.log(`   • Usuarios activos: ${statsResponse.data.unique_users}`);
    console.log(`   • Acciones más comunes:`, statsResponse.data.most_common_actions);
    
    // 6. Test de creación manual de log
    console.log('\n6️⃣ Creando log de auditoría manual...');
    const manualLogResponse = await axios.post(`${baseUrl}/api/audit`, {
      accion: 'TEST_MANUAL',
      tabla: 'test',
      registroId: 'test-123',
      datosAntes: JSON.stringify({ test: 'before' }),
      datosDespues: JSON.stringify({ test: 'after' })
    }, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    console.log('✅ Log manual creado exitosamente:', manualLogResponse.data.id);
    
    console.log('\n🎉 Diagnóstico completado exitosamente!');
    
  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    // Diagnóstico adicional
    console.log('\n🔍 Diagnóstico adicional:');
    console.log(`   • Token disponible: ${accessToken ? 'Sí' : 'No'}`);
    console.log(`   • Servidor respondiendo: ${error.code !== 'ECONNREFUSED' ? 'Sí' : 'No'}`);
    
    if (error.response?.status === 401) {
      console.log('   • Problema: Token inválido o expirado');
    } else if (error.response?.status === 404) {
      console.log('   • Problema: Endpoint no encontrado');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   • Problema: Servidor no está ejecutándose');
    }
  }
}

// Función para monitorear logs en tiempo real
async function monitorAuditLogs() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('👀 Iniciando monitoreo de logs de auditoría...');
    console.log('   (Ejecuta acciones en otra terminal para ver los logs)\n');
    
    // Login
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      correo: 'user@mercados.com',
      contrasena: 'password123'
    });
    
    const accessToken = loginResponse.data.access_token;
    let lastLogCount = 0;
    
    setInterval(async () => {
      try {
        const logsResponse = await axios.get(`${baseUrl}/api/audit/logs?limit=3`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (logsResponse.data.total > lastLogCount) {
          console.log(`🆕 Nuevo log detectado! Total: ${logsResponse.data.total}`);
          const latestLog = logsResponse.data.data[0];
          console.log(`   📝 ${latestLog.accion} en ${latestLog.tabla} por ${latestLog.user.nombre} - ${new Date(latestLog.createdAt).toLocaleTimeString()}`);
          lastLogCount = logsResponse.data.total;
        }
      } catch (error) {
        console.error('Error en monitoreo:', error.message);
      }
    }, 2000); // Verificar cada 2 segundos
    
  } catch (error) {
    console.error('Error iniciando monitoreo:', error.message);
  }
}

// Determinar qué función ejecutar basado en argumentos
const mode = process.argv[2];

if (mode === 'monitor') {
  monitorAuditLogs();
} else {
  testAuditSystem();
}
