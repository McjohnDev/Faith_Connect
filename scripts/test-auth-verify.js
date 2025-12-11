/**
 * Verify OTP and Complete Auth Flow
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const PHONE_NUMBER = process.argv[2] || '+237693805080';
const OTP = process.argv[3];

if (!OTP) {
  console.error('❌ OTP required');
  console.log('Usage: node scripts/test-auth-verify.js <phoneNumber> <OTP>');
  console.log('Example: node scripts/test-auth-verify.js +237693805080 123456');
  process.exit(1);
}

console.log('🔐 Verifying OTP and Completing Auth Flow\n');
console.log('─'.repeat(60));
console.log(`Phone Number: ${PHONE_NUMBER}`);
console.log(`OTP: ${OTP}`);
console.log('─'.repeat(60) + '\n');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function verifyAndTest() {
  try {
    // Step 1: Verify OTP
    console.log('1️⃣  Verifying OTP...');
    const verifyResult = await makeRequest('POST', '/api/v1/auth/verify-phone', {
      phoneNumber: PHONE_NUMBER,
      otp: OTP,
      guidelinesAccepted: true,
      deviceId: 'test-device-' + Date.now(),
      deviceName: 'Test Device',
      deviceType: 'web'
    });

    console.log(`   Status: ${verifyResult.status}`);
    
    if (verifyResult.status === 200 && verifyResult.data.success) {
      console.log('   ✅ OTP verified successfully!\n');
      
      const user = verifyResult.data.data?.user;
      const tokens = verifyResult.data.data?.tokens;
      
      if (user) {
        console.log('   👤 User Details:');
        console.log(`      ID: ${user.id}`);
        console.log(`      Phone: ${user.phoneNumber}`);
        console.log(`      Created: ${user.createdAt}\n`);
      }
      
      if (tokens) {
        console.log('   🔑 Tokens:');
        console.log(`      Access Token: ${tokens.accessToken?.substring(0, 30)}...`);
        console.log(`      Refresh Token: ${tokens.refreshToken?.substring(0, 30)}...\n`);
        
        // Step 2: Test Refresh Token
        console.log('2️⃣  Testing refresh token...');
        const refreshResult = await makeRequest('POST', '/api/v1/auth/refresh-token', {
          refreshToken: tokens.refreshToken
        });
        
        if (refreshResult.status === 200 && refreshResult.data.success) {
          console.log('   ✅ Refresh token works!');
          console.log(`   🔑 New Access Token: ${refreshResult.data.data?.accessToken?.substring(0, 30)}...\n`);
        } else {
          console.log('   ❌ Refresh token failed');
          console.log(`   Error: ${JSON.stringify(refreshResult.data)}\n`);
        }
        
        // Step 3: Test Logout
        console.log('3️⃣  Testing logout...');
        const logoutResult = await makeRequest('POST', '/api/v1/auth/logout', {
          refreshToken: tokens.refreshToken
        });
        
        if (logoutResult.status === 200 && logoutResult.data.success) {
          console.log('   ✅ Logout successful!\n');
        } else {
          console.log('   ❌ Logout failed\n');
        }
      }
      
      console.log('='.repeat(60));
      console.log('✅ Auth Flow Complete!');
      console.log('='.repeat(60) + '\n');
      
    } else {
      console.log('   ❌ OTP verification failed');
      if (verifyResult.data.error) {
        console.log(`   Error: ${verifyResult.data.error.code || 'UNKNOWN'}`);
        console.log(`   Message: ${verifyResult.data.error.message || 'No message'}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

verifyAndTest().catch(console.error);

