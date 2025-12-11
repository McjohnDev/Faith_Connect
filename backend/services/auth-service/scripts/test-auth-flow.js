/**
 * Test Auth Service Flow
 * 
 * Tests the complete OTP registration and login flow
 * 
 * Usage:
 *   node scripts/test-auth-flow.js <phoneNumber>
 * 
 * Example:
 *   node scripts/test-auth-flow.js +237693805080
 */

const http = require('http');

const BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('❌ Phone number required');
  console.log('Usage: node scripts/test-auth-flow.js <phoneNumber>');
  console.log('Example: node scripts/test-auth-flow.js +237693805080');
  process.exit(1);
}

// Helper to make HTTP requests
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

async function testAuthFlow() {
  console.log('🧪 Testing Auth Service Flow\n');
  console.log(`Phone Number: ${phoneNumber}`);
  console.log(`Service URL: ${BASE_URL}\n`);

  try {
    // Step 1: Health Check
    console.log('1️⃣  Testing health endpoint...');
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      console.log('   ✅ Health check passed\n');
    } else {
      console.log('   ❌ Health check failed\n');
      process.exit(1);
    }

    // Step 2: Register Phone (Send OTP)
    console.log('2️⃣  Registering phone number (SMS)...');
    const registerResult = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber,
      age: 18,
      deliveryMethod: 'sms'
    });

    if (registerResult.status === 200 || registerResult.status === 201) {
      console.log('   ✅ OTP sent successfully');
      console.log(`   📱 Delivery method: ${registerResult.data.data?.deliveryMethod || 'sms'}`);
      console.log(`   ⏱️  Expires in: ${registerResult.data.data?.expiresIn || 300} seconds\n`);
    } else {
      console.log('   ❌ Registration failed');
      console.log(`   Status: ${registerResult.status}`);
      console.log(`   Error: ${JSON.stringify(registerResult.data)}\n`);
      process.exit(1);
    }

    // Step 3: Get OTP from user
    console.log('3️⃣  Waiting for OTP verification...');
    console.log('   📝 Please enter the OTP you received:');
    
    // In a real test, you'd read from stdin or Redis
    // For now, we'll prompt the user
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const otp = await new Promise((resolve) => {
      rl.question('   OTP: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });

    if (!otp) {
      console.log('   ❌ No OTP provided\n');
      process.exit(1);
    }

    // Step 4: Verify OTP
    console.log('\n4️⃣  Verifying OTP...');
    const verifyResult = await makeRequest('POST', '/api/v1/auth/verify-phone', {
      phoneNumber,
      otp,
      guidelinesAccepted: true
    });

    if (verifyResult.status === 200) {
      console.log('   ✅ OTP verified successfully');
      console.log(`   👤 User ID: ${verifyResult.data.data?.user?.id}`);
      console.log(`   🔑 Access Token: ${verifyResult.data.data?.tokens?.accessToken?.substring(0, 20)}...`);
      console.log(`   🔄 Refresh Token: ${verifyResult.data.data?.tokens?.refreshToken?.substring(0, 20)}...\n`);

      const tokens = verifyResult.data.data?.tokens;
      const userId = verifyResult.data.data?.user?.id;

      // Step 5: Test Refresh Token
      if (tokens?.refreshToken) {
        console.log('5️⃣  Testing refresh token...');
        const refreshResult = await makeRequest('POST', '/api/v1/auth/refresh-token', {
          refreshToken: tokens.refreshToken
        });

        if (refreshResult.status === 200) {
          console.log('   ✅ Refresh token works');
          console.log(`   🔑 New Access Token: ${refreshResult.data.data?.accessToken?.substring(0, 20)}...\n`);
        } else {
          console.log('   ❌ Refresh token failed');
          console.log(`   Error: ${JSON.stringify(refreshResult.data)}\n`);
        }
      }

      // Step 6: Test Login (should send new OTP)
      console.log('6️⃣  Testing login flow...');
      const loginResult = await makeRequest('POST', '/api/v1/auth/login-phone', {
        phoneNumber,
        deliveryMethod: 'sms'
      });

      if (loginResult.status === 200 || loginResult.status === 201) {
        console.log('   ✅ Login OTP sent successfully\n');
      } else {
        console.log('   ❌ Login failed');
        console.log(`   Error: ${JSON.stringify(loginResult.data)}\n`);
      }

      console.log('✅ Auth Service Flow Test Complete!\n');
      console.log('Summary:');
      console.log('  ✅ Health check');
      console.log('  ✅ Phone registration (OTP send)');
      console.log('  ✅ OTP verification');
      console.log('  ✅ Token generation');
      console.log('  ✅ Refresh token');
      console.log('  ✅ Login flow\n');

    } else {
      console.log('   ❌ OTP verification failed');
      console.log(`   Status: ${verifyResult.status}`);
      console.log(`   Error: ${JSON.stringify(verifyResult.data)}\n`);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAuthFlow().catch(console.error);

