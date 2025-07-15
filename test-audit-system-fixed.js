const axios = require('axios');

async function testAuditSystem() {
  const baseUrl = 'http://localhost:3000';
  
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
    
    console.log('✅ Login exitoso');
    console.log('📄 Respuesta completa del login:', JSON.stringify(loginResponse.data, null, 2));
    console.log('');

    // 2. Verificar logs inmediatamente después del login
    console.log('2️⃣ Verificando logs de auditoría después del login...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const logsResponse = await axiosInstance.get('/api/audit/logs?limit=5');
    
    console.log(`📊 Total de logs encontrados: ${logsResponse.data.total || logsResponse.data.length}`);
    if ((logsResponse.data.data && logsResponse.data.data.length > 0) || logsResponse.data.length > 0) {
      console.log('🎉 ¡Sistema de auditoría funcionando!');
      console.log('📋 Últimos logs:');
      const logs = logsResponse.data.data || logsResponse.data;
      logs.slice(0, 3).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} - ${log.table_name} - Usuario: ${log.user_id} - ${new Date(log.created_at).toLocaleString()}`);
      });
    } else {
      console.log('⚠️  No se encontraron logs de auditoría');
    }
    console.log('');

    // 3. Probar endpoint del dashboard (que debería generar un log)
    console.log('3️⃣ Accediendo al dashboard para generar actividad...');
    await axiosInstance.get('/api/dashboard/statistics');
    console.log('✅ Dashboard accedido correctamente');
    console.log('');

    // 4. Verificar si se creó un nuevo log
    console.log('4️⃣ Verificando nuevos logs después del acceso al dashboard...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    const newLogsResponse = await axiosInstance.get('/api/audit/logs?limit=5');
    const newLogsCount = newLogsResponse.data.total || newLogsResponse.data.length;
    const oldLogsCount = logsResponse.data.total || logsResponse.data.length;
    
    console.log(`📊 Logs anteriores: ${oldLogsCount}, Logs actuales: ${newLogsCount}`);
    
    if (newLogsCount > oldLogsCount) {
      console.log('🎉 ¡Se generó un nuevo log! El sistema de auditoría está funcionando correctamente');
    } else {
      console.log('⚠️  No se detectaron nuevos logs. Posible problema con el interceptor');
    }
    console.log('');

    // 5. Probar creación manual de log
    console.log('5️⃣ Probando creación manual de log...');
    try {
      const manualLogResponse = await axiosInstance.post('/api/audit', {
        action: 'TEST_MANUAL',
        table_name: 'test',
        record_id: 'test-123',
        details: { test: 'Manual audit test' }
      });
      console.log('✅ Log manual creado exitosamente');
    } catch (manualError) {
      console.log('❌ Error creando log manual:', manualError.response?.data || manualError.message);
    }
    console.log('');

    // 6. Verificar estadísticas de auditoría
    console.log('6️⃣ Verificando estadísticas de auditoría...');
    try {
      const statsResponse = await axiosInstance.get('/api/audit/stats');
      console.log('📈 Estadísticas de auditoría:', JSON.stringify(statsResponse.data, null, 2));
    } catch (statsError) {
      console.log('❌ Error obteniendo estadísticas:', statsError.response?.data || statsError.message);
    }
    console.log('');

    // 7. Logout para completar el ciclo
    console.log('7️⃣ Realizando logout...');
    try {
      await axiosInstance.post('/api/auth/logout');
      console.log('✅ Logout exitoso');
    } catch (logoutError) {
      console.log('❌ Error en logout:', logoutError.response?.data || logoutError.message);
    }

    // 8. Verificar log de logout
    console.log('8️⃣ Verificando log de logout...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
    
    // Como hicimos logout, necesitamos hacer login de nuevo para ver los logs
    await axiosInstance.post('/api/auth/login', {
      username: 'mougrind',
      contrasena: '@Asd.456@'
    });
    
    const finalLogsResponse = await axiosInstance.get('/api/audit/logs?limit=10');
    const finalLogs = finalLogsResponse.data.data || finalLogsResponse.data;
    
    const logoutLog = finalLogs.find(log => log.action === 'LOGOUT');
    if (logoutLog) {
      console.log('✅ Log de logout encontrado');
    } else {
      console.log('⚠️  No se encontró log de logout');
    }

    console.log('\n🏁 Diagnóstico completado');

  } catch (error) {
    console.log('❌ Error durante el diagnóstico:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    
    console.log('\n🔍 Diagnóstico adicional:');
    console.log(`   • Servidor respondiendo: ${error.response ? 'Sí' : 'No'}`);
    console.log(`   • Problema: ${error.response ? 'Error de autorización o endpoint' : 'Conexión o servidor'}`);
  }
}

// Ejecutar el test
testAuditSystem().then(() => {
  console.log('\n🔚 Test completado');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Error fatal:', error);
  process.exit(1);
});
