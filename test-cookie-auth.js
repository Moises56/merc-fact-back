const axios = require('axios');

async function testCookieAuth() {
  console.log('🧪 Testing cookie-based authentication...\n');
  
  // Crear una instancia de axios con un jar de cookies
  const CookieJar = require('tough-cookie').CookieJar;
  const { wrapper } = require('axios-cookiejar-support');
  
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
    console.log('👤 User:', loginResponse.data.user.username);
    
    // Verificar cookies recibidas
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies) {
      console.log('🍪 Cookies received:', cookies.length);
      cookies.forEach(cookie => {
        const name = cookie.split('=')[0];
        console.log(`   - ${name}`);
      });
    }
    
    // 2. Probar endpoint protegido
    console.log('\n2️⃣ Testing protected endpoint...');
    const auditResponse = await axiosInstance.get('/api/audit/logs?limit=5');
    
    console.log('✅ Protected endpoint accessible');
    console.log(`📊 Audit logs found: ${auditResponse.data.total || auditResponse.data.length || 0}`);
    
    if (auditResponse.data.data && auditResponse.data.data.length > 0) {
      console.log('📋 Latest audit logs:');
      auditResponse.data.data.slice(0, 3).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} on ${log.table_name} by ${log.user_id?.substring(0, 8)}...`);
      });
    }
    
    console.log('\n✅ Cookie authentication working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status || error.message);
    if (error.response?.data) {
      console.error('📋 Details:', error.response.data);
    }
  }
}

// Verificar si tough-cookie está instalado
try {
  require('tough-cookie');
  require('axios-cookiejar-support');
  testCookieAuth();
} catch (moduleError) {
  console.log('📦 Installing required dependencies...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install tough-cookie axios-cookiejar-support', { stdio: 'inherit' });
    console.log('✅ Dependencies installed, rerun the script');
  } catch (installError) {
    console.error('❌ Failed to install dependencies:', installError.message);
    console.log('\nPlease install manually: npm install tough-cookie axios-cookiejar-support');
  }
}
