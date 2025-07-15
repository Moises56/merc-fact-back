const axios = require('axios');
const CookieJar = require('tough-cookie').CookieJar;
const { wrapper } = require('axios-cookiejar-support');

async function testFullAuditSystem() {
  console.log('🧪 Testing complete audit system...\n');
  
  // Configurar axios con soporte completo de cookies
  const axiosInstance = wrapper(axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 10000,
    jar: new CookieJar(),
    withCredentials: true
  }));

  try {
    // 1. Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axiosInstance.post('/api/auth/login', {
      username: 'mougrind',
      contrasena: '@Asd.456@'
    });
    
    console.log('✅ Login successful');
    const user = loginResponse.data.user;
    console.log(`👤 User: ${user.username} (${user.role})`);
    
    // 2. Generar algo de actividad para auditoría
    console.log('\n2️⃣ Generating audit activity...');
    
    // Acceder al dashboard (esto debería generar un log)
    await axiosInstance.get('/api/dashboard/statistics');
    console.log('📊 Dashboard accessed');
    
    // Acceder a usuarios (esto debería generar otro log)
    await axiosInstance.get('/api/users?limit=1');
    console.log('👥 Users accessed');
    
    // Acceder a mercados (esto debería generar otro log)
    await axiosInstance.get('/api/mercados?limit=1');
    console.log('🏪 Markets accessed');
    
    // Esperar un momento para que los logs se procesen
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. Verificar logs de auditoría
    console.log('\n3️⃣ Checking audit logs...');
    const auditResponse = await axiosInstance.get('/api/audit/logs?limit=10');
    
    console.log('📋 Raw audit response structure:');
    console.log(JSON.stringify(auditResponse.data, null, 2));
    
    // 4. Verificar estadísticas de auditoría
    console.log('\n4️⃣ Checking audit stats...');
    const statsResponse = await axiosInstance.get('/api/audit/stats');
    console.log('📈 Audit stats:');
    console.log(JSON.stringify(statsResponse.data, null, 2));
    
    // 5. Crear un log manual de auditoría
    console.log('\n5️⃣ Creating manual audit log...');
    const manualLog = await axiosInstance.post('/api/audit', {
      action: 'TEST_ACTION',
      tableName: 'test_table',
      entityId: 'test-123',
      description: 'Manual audit log for testing'
    });
    console.log('✅ Manual audit log created:', manualLog.data);
    
    // 6. Verificar logs nuevamente
    console.log('\n6️⃣ Final audit logs check...');
    const finalAuditResponse = await axiosInstance.get('/api/audit/logs?limit=5');
    console.log(`📊 Total logs: ${finalAuditResponse.data.total || finalAuditResponse.data.length || 0}`);
    
    if (finalAuditResponse.data.data || finalAuditResponse.data.length) {
      const logs = finalAuditResponse.data.data || finalAuditResponse.data;
      console.log('\n📋 Recent audit logs:');
      logs.slice(0, 5).forEach((log, index) => {
        console.log(`   ${index + 1}. Action: ${log.action || log.accion}`);
        console.log(`      Table: ${log.table_name || log.tableName || log.tabla}`);
        console.log(`      User: ${log.user_id || log.userId || log.usuarioId || 'Unknown'}`);
        console.log(`      Time: ${new Date(log.created_at || log.createdAt || log.fechaCreacion).toLocaleString()}`);
        console.log(`      Description: ${log.description || log.descripcion || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log('✅ Audit system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.error('📋 Details:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.stack) {
      console.error('🔍 Stack trace:', error.stack);
    }
  }
}

testFullAuditSystem();
