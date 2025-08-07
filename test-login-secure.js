const fetch = require('node-fetch');

async function testSecureLogin() {
  try {
    console.log('🧪 Testing secure login without tokens in response...\n');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'useradmin',
        contrasena: 'admin123'
      })
    });

    const data = await response.json();
    
    console.log('📋 Response Status:', response.status);
    console.log('📋 Response Data:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n🍪 Response Headers (looking for Set-Cookie):');
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('cookie')) {
        console.log(`${key}: ${value}`);
      }
    });

    // Verificar que NO hay tokens en la respuesta
    if (data.access_token || data.refresh_token) {
      console.log('❌ ERROR: Los tokens todavía aparecen en la respuesta');
    } else {
      console.log('✅ PERFECTO: Sin tokens en la respuesta, solo cookies HTTP-only');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSecureLogin();
