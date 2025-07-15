/**
 * Test script for password management endpoints
 * Tests both self-service password change and admin password reset functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test data
const testUser = {
  username: 'testuser123',
  contrasena: 'password123',
  email: 'test@example.com',
  nombre: 'Test User',
  telefono: '1234567890',
  rol: 'USER'
};

const adminUser = {
  username: 'mougrind',
  contrasena: 'Asd.456@'
};

let userAuthCookie = '';
let adminAuthCookie = '';
let testUserId = '';

async function makeRequest(method, url, data = null, cookies = '') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, headers: response.headers };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

async function extractCookieFromResponse(headers) {
  const setCookieHeader = headers['set-cookie'];
  if (setCookieHeader && setCookieHeader.length > 0) {
    return setCookieHeader[0].split(';')[0];
  }
  return '';
}

async function testPasswordManagement() {
  console.log('🔐 TESTING PASSWORD MANAGEMENT ENDPOINTS\n');
  
  try {
    // Step 1: Login as admin to create test user
    console.log('1️⃣ Login as admin...');
    const adminLogin = await makeRequest('POST', '/auth/login', {
      username: adminUser.username,
      contrasena: adminUser.contrasena
    });
    
    if (!adminLogin.success) {
      console.log('❌ Admin login failed:', adminLogin.error);
      return;
    }
    
    adminAuthCookie = await extractCookieFromResponse(adminLogin.headers);
    console.log('✅ Admin logged in successfully');
    
    // Step 2: Create test user
    console.log('\n2️⃣ Creating test user...');
    const createUser = await makeRequest('POST', '/users', testUser, adminAuthCookie);
    
    if (!createUser.success) {
      console.log('❌ Failed to create test user:', createUser.error);
      return;
    }
    
    testUserId = createUser.data.id;
    console.log('✅ Test user created with ID:', testUserId);
    
    // Step 3: Login as test user
    console.log('\n3️⃣ Login as test user...');
    const userLogin = await makeRequest('POST', '/auth/login', {
      username: testUser.username,
      contrasena: testUser.contrasena
    });
    
    if (!userLogin.success) {
      console.log('❌ Test user login failed:', userLogin.error);
      return;
    }
    
    userAuthCookie = await extractCookieFromResponse(userLogin.headers);
    console.log('✅ Test user logged in successfully');
    
    // Step 4: Test self-service password change
    console.log('\n4️⃣ Testing self-service password change...');
    const newPassword = 'newpassword123';
    const changePasswordResult = await makeRequest('POST', '/auth/change-password', {
      currentPassword: testUser.contrasena,
      newPassword: newPassword
    }, userAuthCookie);
    
    if (!changePasswordResult.success) {
      console.log('❌ Password change failed:', changePasswordResult.error);
    } else {
      console.log('✅ Password changed successfully');
      
      // Verify new password works
      console.log('   🔄 Verifying new password...');
      const newLogin = await makeRequest('POST', '/auth/login', {
        username: testUser.username,
        contrasena: newPassword
      });
      
      if (newLogin.success) {
        console.log('   ✅ New password verified successfully');
        userAuthCookie = await extractCookieFromResponse(newLogin.headers);
      } else {
        console.log('   ❌ New password verification failed:', newLogin.error);
      }
    }
    
    // Step 5: Test admin password reset
    console.log('\n5️⃣ Testing admin password reset...');
    const resetPassword = 'resetpassword123';
    const resetResult = await makeRequest('PATCH', `/users/${testUserId}/reset-password`, {
      newPassword: resetPassword
    }, adminAuthCookie);
    
    if (!resetResult.success) {
      console.log('❌ Admin password reset failed:', resetResult.error);
    } else {
      console.log('✅ Admin password reset successful');
      
      // Verify reset password works
      console.log('   🔄 Verifying reset password...');
      const resetLogin = await makeRequest('POST', '/auth/login', {
        username: testUser.username,
        contrasena: resetPassword
      });
      
      if (resetLogin.success) {
        console.log('   ✅ Reset password verified successfully');
      } else {
        console.log('   ❌ Reset password verification failed:', resetLogin.error);
      }
    }
    
    // Step 6: Test unauthorized access (user trying to reset password)
    console.log('\n6️⃣ Testing unauthorized access (user trying admin reset)...');
    const unauthorizedReset = await makeRequest('PATCH', `/users/${testUserId}/reset-password`, {
      newPassword: 'shouldnotwork123'
    }, userAuthCookie);
    
    if (!unauthorizedReset.success && unauthorizedReset.status === 403) {
      console.log('✅ Unauthorized access properly blocked (403 Forbidden)');
    } else {
      console.log('❌ Security issue: User was able to access admin endpoint');
    }
    
    // Step 7: Test invalid current password
    console.log('\n7️⃣ Testing invalid current password...');
    const invalidPasswordChange = await makeRequest('POST', '/auth/change-password', {
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword456'
    }, userAuthCookie);
    
    if (!invalidPasswordChange.success) {
      console.log('✅ Invalid current password properly rejected');
    } else {
      console.log('❌ Security issue: Invalid current password was accepted');
    }
    
    // Step 8: Test audit logs (admin can check password change events)
    console.log('\n8️⃣ Checking audit logs for password events...');
    const auditLogs = await makeRequest('GET', '/audit/logs?limit=10', null, adminAuthCookie);
    
    if (auditLogs.success) {
      const passwordEvents = auditLogs.data.filter(log => 
        log.action === 'CHANGE_PASSWORD' || log.action === 'RESET_PASSWORD'
      );
      console.log(`✅ Found ${passwordEvents.length} password-related audit events`);
      passwordEvents.forEach(event => {
        console.log(`   📝 ${event.action} - User: ${event.userId} - Time: ${event.timestamp}`);
      });
    } else {
      console.log('❌ Failed to retrieve audit logs:', auditLogs.error);
    }
    
    // Cleanup: Delete test user
    console.log('\n9️⃣ Cleaning up test user...');
    const deleteUser = await makeRequest('DELETE', `/users/${testUserId}`, null, adminAuthCookie);
    
    if (deleteUser.success) {
      console.log('✅ Test user deleted successfully');
    } else {
      console.log('❌ Failed to delete test user:', deleteUser.error);
    }
    
    console.log('\n🎉 PASSWORD MANAGEMENT TEST COMPLETED!\n');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testPasswordManagement();
