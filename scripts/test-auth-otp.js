/**
 * Auth Service OTP Test
 * Tests OTP registration and verification flow
 */

const http = require('http');
let redis = null;
try {
  redis = require('redis');
} catch (e) {
  // Redis optional - will skip OTP retrieval if not available
}

const BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PHONE_NUMBER = process.argv[2] || '+237693805080';

console.log('🧪 Auth Service OTP Test\n');
console.log('─'.repeat(60));
console.log(`Phone Number: ${PHONE_NUMBER}`);
console.log(`Service URL: ${BASE_URL}`);
console.log(`Redis URL: ${REDIS_URL}`);
console.log('─'.repeat(60) + '\n');

let testsPassed = 0;
let testsFailed = 0;
let otpFromRedis = null;
let accessToken = null;
let refreshToken = null;
let userId = null;

// Helper to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
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

// Helper to get OTP from Redis
async function getOtpFromRedis() {
  if (!redis) {
    return { otp: null, ttl: 0 };
  }
  
  try {
    const client = redis.createClient({ url: REDIS_URL });
    await client.connect();
    
    const key = `otp:${PHONE_NUMBER}`;
    const otp = await client.get(key);
    const ttl = await client.ttl(key);
    
    await client.quit();
    
    return { otp, ttl };
  } catch (error) {
    console.error('   ⚠️  Could not connect to Redis:', error.message);
    return { otp: null, ttl: 0 };
  }
}

function test(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}: ${message || 'PASS'}`);
    testsPassed++;
  } else {
    console.log(`❌ ${name}: ${message || 'FAIL'}`);
    testsFailed++;
  }
}

async function runTests() {
  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing health endpoint...');
    const health = await makeRequest('GET', '/health');
    test('Health Check', health.status === 200, `Status: ${health.status}`);
    console.log('');

    // Test 2: Register Phone (SMS)
    console.log('2️⃣  Registering phone number (SMS)...');
    const registerResult = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: PHONE_NUMBER,
      age: 18,
      deliveryMethod: 'sms'
    });

    if (registerResult.status === 200) {
      test('Register Phone (SMS)', true, 'OTP sent successfully');
      console.log(`   📱 Delivery: ${registerResult.data.data?.deliveryMethod || 'sms'}`);
      console.log(`   ⏱️  Expires: ${registerResult.data.data?.expiresIn || 300}s`);
      
      // Try to get OTP from Redis
      console.log('\n   🔍 Checking Redis for OTP...');
      const { otp, ttl } = await getOtpFromRedis();
      if (otp) {
        otpFromRedis = otp;
        console.log(`   ✅ OTP found in Redis: ${otp}`);
        console.log(`   ⏱️  TTL: ${ttl}s`);
      } else {
        console.log('   ⚠️  OTP not found in Redis (may need Twilio credentials)');
        console.log('   💡 If Twilio is configured, check your phone for the OTP');
      }
    } else {
      test('Register Phone (SMS)', false, `Status: ${registerResult.status}, Error: ${JSON.stringify(registerResult.data)}`);
    }
    console.log('');

    // Test 3: Register Phone (WhatsApp)
    console.log('3️⃣  Registering phone number (WhatsApp)...');
    const registerWhatsApp = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: PHONE_NUMBER,
      age: 18,
      deliveryMethod: 'whatsapp'
    });

    if (registerWhatsApp.status === 200) {
      test('Register Phone (WhatsApp)', true, 'OTP sent successfully');
      console.log(`   📱 Delivery: ${registerWhatsApp.data.data?.deliveryMethod || 'whatsapp'}`);
    } else {
      test('Register Phone (WhatsApp)', false, `Status: ${registerWhatsApp.status}`);
    }
    console.log('');

    // Test 4: Resend OTP
    console.log('4️⃣  Resending OTP...');
    const resendResult = await makeRequest('POST', '/api/v1/auth/resend-otp', {
      phoneNumber: PHONE_NUMBER,
      deliveryMethod: 'sms'
    });

    if (resendResult.status === 200) {
      test('Resend OTP', true, 'OTP resent successfully');
      
      // Check Redis again
      const { otp } = await getOtpFromRedis();
      if (otp) {
        otpFromRedis = otp;
        console.log(`   ✅ New OTP in Redis: ${otp}`);
      }
    } else {
      test('Resend OTP', false, `Status: ${resendResult.status}`);
    }
    console.log('');

    // Test 5: Verify OTP (if we have OTP)
    if (otpFromRedis) {
      console.log('5️⃣  Verifying OTP...');
      console.log(`   Using OTP: ${otpFromRedis}`);
      
      const verifyResult = await makeRequest('POST', '/api/v1/auth/verify-phone', {
        phoneNumber: PHONE_NUMBER,
        otp: otpFromRedis,
        guidelinesAccepted: true,
        deviceId: 'test-device-123',
        deviceName: 'Test Device',
        deviceType: 'web'
      });

      if (verifyResult.status === 200 && verifyResult.data.success) {
        test('Verify OTP', true, 'OTP verified successfully');
        accessToken = verifyResult.data.data?.tokens?.accessToken;
        refreshToken = verifyResult.data.data?.tokens?.refreshToken;
        userId = verifyResult.data.data?.user?.id;
        
        console.log(`   👤 User ID: ${userId}`);
        console.log(`   🔑 Access Token: ${accessToken?.substring(0, 30)}...`);
        console.log(`   🔄 Refresh Token: ${refreshToken?.substring(0, 30)}...`);
      } else {
        test('Verify OTP', false, `Status: ${verifyResult.status}, Error: ${JSON.stringify(verifyResult.data)}`);
      }
    } else {
      console.log('5️⃣  Skipping OTP verification (no OTP available)');
      console.log('   💡 To test verification:');
      console.log('      1. Ensure Twilio credentials are configured');
      console.log('      2. Check your phone for the OTP');
      console.log('      3. Run: node scripts/test-auth-otp.js +237693805080 <OTP>');
    }
    console.log('');

    // Test 6: Refresh Token (if we have tokens)
    if (refreshToken) {
      console.log('6️⃣  Testing refresh token...');
      const refreshResult = await makeRequest('POST', '/api/v1/auth/refresh-token', {
        refreshToken: refreshToken
      });

      if (refreshResult.status === 200 && refreshResult.data.success) {
        test('Refresh Token', true, 'Token refreshed successfully');
        const newAccessToken = refreshResult.data.data?.accessToken;
        console.log(`   🔑 New Access Token: ${newAccessToken?.substring(0, 30)}...`);
      } else {
        test('Refresh Token', false, `Status: ${refreshResult.status}`);
      }
      console.log('');
    }

    // Test 7: Login Phone
    console.log('7️⃣  Testing login flow...');
    const loginResult = await makeRequest('POST', '/api/v1/auth/login-phone', {
      phoneNumber: PHONE_NUMBER,
      deliveryMethod: 'sms'
    });

    if (loginResult.status === 200) {
      test('Login Phone', true, 'Login OTP sent successfully');
    } else {
      test('Login Phone', false, `Status: ${loginResult.status}`);
    }
    console.log('');

    // Test 8: Validation Tests
    console.log('8️⃣  Testing validation...');
    
    // Age restriction
    const ageTest = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: PHONE_NUMBER,
      age: 12,
      deliveryMethod: 'sms'
    });
    test('Age Validation', ageTest.status === 400 || ageTest.status === 403, 'Age restriction enforced');

    // Invalid phone
    const phoneTest = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber: 'invalid',
      age: 18,
      deliveryMethod: 'sms'
    });
    test('Phone Validation', phoneTest.status === 400, 'Invalid phone rejected');

    // Guidelines required
    if (otpFromRedis) {
      const guidelinesTest = await makeRequest('POST', '/api/v1/auth/verify-phone', {
        phoneNumber: PHONE_NUMBER,
        otp: otpFromRedis,
        guidelinesAccepted: false
      });
      test('Guidelines Validation', guidelinesTest.status === 400, 'Guidelines acceptance required');
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('📊 Test Results');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log(`📈 Total: ${testsPassed + testsFailed}`);
    console.log('='.repeat(60) + '\n');

    if (testsFailed === 0) {
      console.log('🎉 All tests passed!\n');
    } else {
      console.log('⚠️  Some tests failed. Check the errors above.\n');
    }

    process.exit(testsFailed === 0 ? 0 : 1);

  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
}

// Check if OTP provided as argument
const providedOtp = process.argv[3];
if (providedOtp) {
  otpFromRedis = providedOtp;
  console.log(`📝 Using provided OTP: ${providedOtp}\n`);
}

runTests().catch(console.error);

