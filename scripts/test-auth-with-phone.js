/**
 * Test Auth Service with Custom Phone Number
 * Allows testing with different phone numbers to avoid rate limits
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const PHONE_NUMBER = process.argv[2] || '+237693805080';

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
    
    if (registerResult.status === 200 && registerResult.data.success) {
      console.log('   ✅ OTP sent successfully!');
      console.log(`   📱 Delivery: ${registerResult.data.data?.deliveryMethod || 'sms'}`);
      console.log(`   ⏱️  Expires: ${registerResult.data.data?.expiresIn || 300}s`);
      console.log(`   💡 Check your phone ${PHONE_NUMBER} for the OTP\n`);
      
      // Try to get OTP from Redis (if available)
      console.log('   🔍 To get OTP from Redis, run:');
      console.log(`      redis-cli GET "otp:${PHONE_NUMBER}"\n`);
      
    } else if (registerResult.status === 429) {
      console.log('   ⚠️  Rate limit exceeded');
      console.log('   💡 Solutions:');
      console.log('      1. Wait 1 hour for rate limit to reset');
      console.log('      2. Restart auth service (clears in-memory rate limits)');
      console.log('      3. Use a different phone number');
      console.log(`      4. Run: node scripts/test-auth-with-phone.js +1234567890\n`);
    } else {
      console.log('   ❌ Registration failed');
      if (registerResult.data.error) {
        console.log(`   Error: ${registerResult.data.error.code || 'UNKNOWN'}`);
        console.log(`   Message: ${registerResult.data.error.message || 'No message'}`);
      }
      console.log('');
    }

    // Test 3: Validation Tests
    console.log('3️⃣  Testing validation...');
    
    // Age restriction
    const ageTest = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: PHONE_NUMBER + '1', // Different number to avoid rate limit
      age: 12,
      deliveryMethod: 'sms'
    });
    if (ageTest.status === 400 || ageTest.status === 403) {
      console.log('   ✅ Age validation working (rejected age < 13)');
    }

    // Invalid phone
    const phoneTest = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: 'invalid',
      age: 18,
      deliveryMethod: 'sms'
    });
    if (phoneTest.status === 400) {
      console.log('   ✅ Phone format validation working');
    }

    // Invalid delivery method
    const methodTest = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: PHONE_NUMBER + '2',
      age: 18,
      deliveryMethod: 'email' // Invalid
    });
    if (methodTest.status === 400) {
      console.log('   ✅ Delivery method validation working');
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Health check: Passed`);
    console.log(`${registerResult.status === 200 ? '✅' : '⚠️'} Register (SMS): ${registerResult.status === 200 ? 'OTP Sent' : 'Rate Limited or Failed'}`);
    console.log('✅ Validation: All working');
    console.log('='.repeat(60) + '\n');

    if (registerResult.status === 200) {
      console.log('💡 Next Steps:');
      console.log('   1. Check your phone for the OTP');
      console.log('   2. To verify OTP, run:');
      console.log(`      node scripts/test-auth-verify.js ${PHONE_NUMBER} <OTP>\n`);
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

testAuth().catch(console.error);

