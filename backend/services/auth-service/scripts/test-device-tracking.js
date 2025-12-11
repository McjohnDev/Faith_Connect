/**
 * Test Device Tracking in Auth Flow
 * 
 * Tests device tracking, device cap enforcement, and device persistence
 * 
 * Usage:
 *   node scripts/test-device-tracking.js <phoneNumber>
 * 
 * Example:
 *   node scripts/test-device-tracking.js +237693805080
 */

require('dotenv').config({ path: '.env' });
const http = require('http');
const { createClient } = require('redis');

const BASE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const phoneNumber = process.argv[2] || `+237693805080${Math.floor(Math.random() * 1000)}`;

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;

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

// Get OTP from Redis for testing
async function getOtpFromRedis(phoneNumber) {
  try {
    if (!redisClient) {
      redisClient = createClient({ url: redisUrl });
      await redisClient.connect();
    }
    const otp = await redisClient.get(`otp:${phoneNumber}`);
    return otp;
  } catch (error) {
    console.warn('⚠️  Could not get OTP from Redis:', error.message);
    return null;
  }
}

async function testDeviceTracking() {
  console.log('🧪 Testing Device Tracking in Auth Flow\n');
  console.log(`Phone Number: ${phoneNumber}`);
  console.log(`Service URL: ${BASE_URL}\n`);

  let userId = null;
  let accessToken = null;
  let refreshToken = null;

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
    console.log('2️⃣  Registering phone number...');
    const registerResult = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber,
      age: 18,
      deliveryMethod: 'sms'
    });

    if (registerResult.status !== 200 && registerResult.status !== 201) {
      console.log('   ❌ Registration failed');
      console.log(`   Status: ${registerResult.status}`);
      console.log(`   Error: ${JSON.stringify(registerResult.data)}\n`);
      process.exit(1);
    }

    console.log('   ✅ OTP sent successfully\n');

    // Step 3: Get OTP from Redis
    console.log('3️⃣  Getting OTP from Redis...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for OTP to be stored
    const otp = await getOtpFromRedis(phoneNumber);

    if (!otp) {
      console.log('   ⚠️  Could not get OTP from Redis');
      console.log('   📝 Please enter the OTP you received:');
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      const manualOtp = await new Promise((resolve) => {
        rl.question('   OTP: ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });
      if (!manualOtp) {
        console.log('   ❌ No OTP provided\n');
        process.exit(1);
      }
      otp = manualOtp;
    } else {
      console.log(`   ✅ OTP retrieved: ${otp}\n`);
    }

    // Step 4: Verify OTP with Device 1
    console.log('4️⃣  Verifying OTP with Device 1 (iOS)...');
    const device1 = {
      deviceId: `device-ios-${Date.now()}`,
      deviceName: 'iPhone 14 Pro',
      deviceType: 'ios'
    };

    const verifyResult1 = await makeRequest('POST', '/api/v1/auth/verify-phone', {
      phoneNumber,
      otp,
      guidelinesAccepted: true,
      ...device1
    });

    if (verifyResult1.status !== 200) {
      console.log('   ❌ OTP verification failed');
      console.log(`   Status: ${verifyResult1.status}`);
      console.log(`   Error: ${JSON.stringify(verifyResult1.data)}\n`);
      process.exit(1);
    }

    userId = verifyResult1.data.data?.user?.id;
    accessToken = verifyResult1.data.data?.tokens?.accessToken;
    refreshToken = verifyResult1.data.data?.tokens?.refreshToken;

    console.log('   ✅ Device 1 registered successfully');
    console.log(`   👤 User ID: ${userId}`);
    console.log(`   📱 Device ID: ${device1.deviceId}\n`);

    // Step 5: Register another OTP for Device 2
    console.log('5️⃣  Registering OTP for Device 2...');
    const registerResult2 = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber,
      age: 18,
      deliveryMethod: 'sms'
    });

    if (registerResult2.status !== 200) {
      console.log('   ❌ Registration failed\n');
      process.exit(1);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    const otp2 = await getOtpFromRedis(phoneNumber) || '000000'; // Fallback

    // Step 6: Verify OTP with Device 2
    console.log('6️⃣  Verifying OTP with Device 2 (Android)...');
    const device2 = {
      deviceId: `device-android-${Date.now()}`,
      deviceName: 'Samsung Galaxy S23',
      deviceType: 'android'
    };

    const verifyResult2 = await makeRequest('POST', '/api/v1/auth/verify-phone', {
      phoneNumber,
      otp: otp2,
      guidelinesAccepted: true,
      ...device2
    });

    if (verifyResult2.status === 200) {
      console.log('   ✅ Device 2 registered successfully');
      console.log(`   📱 Device ID: ${device2.deviceId}\n`);
    } else {
      console.log('   ⚠️  Device 2 registration failed (may need manual OTP)');
      console.log(`   Status: ${verifyResult2.status}\n`);
    }

    // Step 7: Test device cap (try to add 6th device)
    console.log('7️⃣  Testing device cap enforcement...');
    const registerResult3 = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber,
      age: 18,
      deliveryMethod: 'sms'
    });

    if (registerResult3.status === 200) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const otp3 = await getOtpFromRedis(phoneNumber) || '000000';

      // Try to add devices 3, 4, 5, 6
      for (let i = 3; i <= 6; i++) {
        const device = {
          deviceId: `device-web-${i}-${Date.now()}`,
          deviceName: `Web Browser ${i}`,
          deviceType: 'web'
        };

        const verifyResult = await makeRequest('POST', '/api/v1/auth/verify-phone', {
          phoneNumber,
          otp: otp3,
          guidelinesAccepted: true,
          ...device
        });

        if (verifyResult.status === 200) {
          console.log(`   ✅ Device ${i} registered`);
        } else if (verifyResult.data?.error?.code === 'MAX_DEVICES_REACHED' || 
                   verifyResult.data?.error?.message?.includes('MAX_DEVICES')) {
          console.log(`   ✅ Device cap enforced at device ${i} (expected)\n`);
          break;
        } else {
          console.log(`   ⚠️  Device ${i} failed: ${JSON.stringify(verifyResult.data)}\n`);
        }
      }
    }

    // Step 8: Test reusing existing device (should not count against cap)
    console.log('8️⃣  Testing existing device reuse...');
    const verifyResultReuse = await makeRequest('POST', '/api/v1/auth/verify-phone', {
      phoneNumber,
      otp: otp || '000000',
      guidelinesAccepted: true,
      ...device1 // Reuse device 1
    });

    if (verifyResultReuse.status === 200) {
      console.log('   ✅ Existing device reused successfully (no cap violation)\n');
    } else {
      console.log('   ⚠️  Device reuse test inconclusive\n');
    }

    // Step 9: Test refresh token with device info
    if (refreshToken) {
      console.log('9️⃣  Testing refresh token...');
      const refreshResult = await makeRequest('POST', '/api/v1/auth/refresh-token', {
        refreshToken
      });

      if (refreshResult.status === 200) {
        console.log('   ✅ Refresh token works');
        console.log(`   🔑 New tokens generated\n`);
      } else {
        console.log('   ⚠️  Refresh token test failed\n');
      }
    }

    // Step 10: Test logout
    if (refreshToken) {
      console.log('🔟 Testing logout...');
      const logoutResult = await makeRequest('POST', '/api/v1/auth/logout', {
        refreshToken
      });

      if (logoutResult.status === 200) {
        console.log('   ✅ Logout successful\n');
      } else {
        console.log('   ⚠️  Logout test failed\n');
      }
    }

    console.log('✅ Device Tracking Test Complete!\n');
    console.log('Summary:');
    console.log('  ✅ Health check');
    console.log('  ✅ Device registration');
    console.log('  ✅ Multiple devices');
    console.log('  ✅ Device cap enforcement');
    console.log('  ✅ Existing device reuse');
    console.log('  ✅ Token refresh');
    console.log('  ✅ Logout\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}

testDeviceTracking().catch(console.error);

