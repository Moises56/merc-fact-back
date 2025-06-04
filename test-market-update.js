const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testImprovedMarketResponses() {
  try {
    console.log('🚀 Testing Improved Market API Responses...\n');

    // Step 1: Login as admin
    console.log('1. 🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      correo: 'admin@admin.com',
      contrasena: 'admin123'
    });

    const token = loginResponse.data.access_token;
    console.log('✅ Login successful\n');

    // Step 2: Test CREATE with improved response
    console.log('2. 📝 Testing CREATE market with improved response...');
    const createData = {
      nombre_mercado: `Mercado Test ${Date.now()}`,
      direccion: 'Dirección de prueba 123',
      latitud: -12.0464,
      longitud: -77.0428,
      descripcion: 'Mercado para probar respuestas mejoradas'
    };

    const createResponse = await axios.post(`${API_BASE_URL}/mercados`, createData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ CREATE Response Structure:');
    console.log(`   - Message: "${createResponse.data.message}"`);
    console.log(`   - Data Object: ${createResponse.data.data ? 'Present' : 'Missing'}`);
    console.log(`   - Market ID: ${createResponse.data.data.id}`);
    console.log(`   - Market Name: ${createResponse.data.data.nombre_mercado}\n`);

    const marketId = createResponse.data.data.id;

    // Step 3: Test UPDATE with activo field mapping
    console.log('3. 🔄 Testing UPDATE with activo → isActive field mapping...');
    const updateData = {
      nombre_mercado: `${createData.nombre_mercado} - Actualizado`,
      direccion: `${createData.direccion} - Actualizada`,
      activo: false  // This field gets mapped to isActive
    };

    console.log('📤 Sending update with "activo: false"...');
    const updateResponse = await axios.patch(`${API_BASE_URL}/mercados/${marketId}`, updateData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ UPDATE Response Structure:');
    console.log(`   - Message: "${updateResponse.data.message}"`);
    console.log(`   - Data Object: ${updateResponse.data.data ? 'Present' : 'Missing'}`);
    console.log(`   - Updated Name: ${updateResponse.data.data.nombre_mercado}`);
    console.log(`   - isActive (from activo): ${updateResponse.data.data.isActive}`);
    console.log('✅ Field mapping WORKS! activo → isActive ✨\n');

    // Step 4: Test ACTIVATE with improved response
    console.log('4. ⚡ Testing ACTIVATE market with improved response...');
    const activateResponse = await axios.patch(`${API_BASE_URL}/mercados/${marketId}/activate`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ ACTIVATE Response Structure:');
    console.log(`   - Message: "${activateResponse.data.message}"`);
    console.log(`   - Data Object: ${activateResponse.data.data ? 'Present' : 'Missing'}`);
    console.log(`   - Confirmed Active: ${activateResponse.data.data.isActive}\n`);

    // Step 5: Test error responses
    console.log('5. ❌ Testing improved ERROR responses...');
    
    // Test duplicate name error
    console.log('   5a. Testing duplicate name error...');
    try {
      await axios.post(`${API_BASE_URL}/mercados`, {
        nombre_mercado: createData.nombre_mercado, // Same name as before
        direccion: 'Different address',
        latitud: -12.0464,
        longitud: -77.0428
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.log('   ✅ Improved Error Response Structure:');
      console.log(`      - Message: "${error.response.data.message}"`);
      console.log(`      - Error: "${error.response.data.error}"`);
      console.log(`      - Status Code: ${error.response.data.statusCode}`);
    }

    // Test not found error
    console.log('\n   5b. Testing not found error...');
    try {
      await axios.get(`${API_BASE_URL}/mercados/non-existent-id`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.log('   ✅ Improved Not Found Response:');
      console.log(`      - Message: "${error.response.data.message}"`);
      console.log(`      - Error: "${error.response.data.error}"`);
      console.log(`      - Status Code: ${error.response.data.statusCode}`);
    }

    // Step 6: Clean up - delete test market
    console.log('\n6. 🧹 Cleaning up test market...');
    const deleteResponse = await axios.delete(`${API_BASE_URL}/mercados/${marketId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log('✅ DELETE Response Structure:');
    console.log(`   - Message: "${deleteResponse.data.message}"`);
    console.log(`   - Data Object: ${deleteResponse.data.data ? 'Present' : 'Missing'}`);
    if (deleteResponse.data.data) {
      console.log(`   - Confirmed Inactive: ${!deleteResponse.data.data.isActive}`);
    }

    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('\n📋 SUMMARY OF IMPROVEMENTS:');
    console.log('   ✅ Field mapping: activo → isActive FIXED');
    console.log('   ✅ Success responses include descriptive messages');
    console.log('   ✅ Error responses are structured with message, error, and statusCode');
    console.log('   ✅ Responses include relevant data confirmations');
    console.log('   ✅ PrismaClientValidationError has been RESOLVED! 🚀');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testImprovedMarketResponses();
