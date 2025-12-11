/**
 * Simple Auth Service OTP Test
 * Tests OTP registration with phone number +237693805080
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const PHONE_NUMBER = '+237693805080';

console.log('🧪 Auth Service OTP Test\n');
console.log('─'.repeat(60));
console.log(`Phone Number: ${PHONE_NUMBER}`);
console.log(`Service URL: ${BASE_URL}`);
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

async function testAuth() {
  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing health endpoint...');
    const health = await makeRequest('GET', '/health');
    if (health.status === 200) {
      console.log('   ✅ Health check passed\n');
    } else {
      console.log('   ❌ Health check failed\n');
      return;
    }

    // Test 2: Register Phone (SMS)
    console.log('2️⃣  Registering phone number (SMS)...');
    console.log(`   Phone: ${PHONE_NUMBER}`);
    const registerResult = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: PHONE_NUMBER,
      age: 18,
      deliveryMethod: 'sms'
    });

    console.log(`   Status: ${registerResult.status}`);
    console.log(`   Response: ${JSON.stringify(registerResult.data, null, 2)}\n`);

    if (registerResult.status === 200 && registerResult.data.success) {
      console.log('   ✅ OTP sent successfully!');
      console.log(`   📱 Delivery: ${registerResult.data.data?.deliveryMethod || 'sms'}`);
      console.log(`   ⏱️  Expires: ${registerResult.data.data?.expiresIn || 300}s`);
      console.log(`   💡 Check your phone ${PHONE_NUMBER} for the OTP\n`);
    } else {
      console.log('   ❌ Registration failed');
      if (registerResult.data.error) {
        console.log(`   Error: ${registerResult.data.error.code || 'UNKNOWN'}`);
        console.log(`   Message: ${registerResult.data.error.message || 'No message'}`);
      }
      console.log('');
    }

    // Test 3: Register Phone (WhatsApp)
    console.log('3️⃣  Registering phone number (WhatsApp)...');
    const registerWhatsApp = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: PHONE_NUMBER,
      age: 18,
      deliveryMethod: 'whatsapp'
    });

    console.log(`   Status: ${registerWhatsApp.status}`);
    if (registerWhatsApp.status === 200 && registerWhatsApp.data.success) {
      console.log('   ✅ WhatsApp OTP sent successfully!');
      console.log(`   📱 Delivery: ${registerWhatsApp.data.data?.deliveryMethod || 'whatsapp'}\n`);
    } else {
      console.log('   ❌ WhatsApp registration failed');
      if (registerWhatsApp.data.error) {
        console.log(`   Error: ${registerWhatsApp.data.error.code || 'UNKNOWN'}\n`);
      }
    }

    // Test 4: Resend OTP
    console.log('4️⃣  Resending OTP (SMS)...');
    const resendResult = await makeRequest('POST', '/api/v1/auth/resend-otp', {
      phoneNumber: PHONE_NUMBER,
      deliveryMethod: 'sms'
    });

    console.log(`   Status: ${resendResult.status}`);
    if (resendResult.status === 200 && resendResult.data.success) {
      console.log('   ✅ OTP resent successfully!\n');
    } else {
      console.log('   ❌ Resend failed\n');
    }

    // Test 5: Login Phone
    console.log('5️⃣  Testing login flow...');
    const loginResult = await makeRequest('POST', '/api/v1/auth/login-phone', {
      phoneNumber: PHONE_NUMBER,
      deliveryMethod: 'sms'
    });

    console.log(`   Status: ${loginResult.status}`);
    if (loginResult.status === 200 && loginResult.data.success) {
      console.log('   ✅ Login OTP sent successfully!\n');
    } else {
      console.log('   ❌ Login failed\n');
    }

    console.log('='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Health check: Passed');
    console.log(`${registerResult.status === 200 ? '✅' : '❌'} Register (SMS): ${registerResult.status === 200 ? 'Passed' : 'Failed'}`);
    console.log(`${registerWhatsApp.status === 200 ? '✅' : '❌'} Register (WhatsApp): ${registerWhatsApp.status === 200 ? 'Passed' : 'Failed'}`);
    console.log(`${resendResult.status === 200 ? '✅' : '❌'} Resend OTP: ${resendResult.status === 200 ? 'Passed' : 'Failed'}`);
    console.log(`${loginResult.status === 200 ? '✅' : '❌'} Login: ${loginResult.status === 200 ? 'Passed' : 'Failed'}`);
    console.log('='.repeat(60) + '\n');

    console.log('💡 Next Steps:');
    console.log('   1. Check your phone for the OTP');
    console.log('   2. To verify OTP, run:');
    console.log(`      node scripts/test-auth-verify.js ${PHONE_NUMBER} <OTP>\n`);

  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

testAuth().catch(console.error);
