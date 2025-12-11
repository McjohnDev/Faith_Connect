/**
 * Simple Registration Test
 * Just tests if registration endpoint works
 */

const http = require('http');

const phoneNumber = process.argv[2] || '+237693805080';
const BASE_URL = 'http://localhost:3001';

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('Testing registration endpoint...\n');
  
  try {
    const result = await makeRequest('POST', '/api/v1/auth/register-phone', {
      phoneNumber,
      age: 18,
      deliveryMethod: 'sms'
    });

    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));

    if (result.status === 200 || result.status === 201) {
      console.log('\n✅ Registration successful!');
      console.log('Check your phone for the OTP.');
    } else {
      console.log('\n❌ Registration failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('Make sure Auth Service is running on port 3001');
    }
  }
}

test();

