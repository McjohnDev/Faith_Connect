/**
 * Simple Jira Connection Test
 * Tests if we can connect to Jira with the provided credentials
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'jira-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ jira-config.json not found');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const {
  JIRA_BASE_URL = config.JIRA_BASE_URL,
  JIRA_EMAIL = config.JIRA_EMAIL,
  JIRA_API_TOKEN = config.JIRA_API_TOKEN,
  JIRA_AUTH_METHOD = config.JIRA_AUTH_METHOD || 'bearer'
} = process.env;

console.log('🔍 Testing Jira Connection...\n');
console.log(`URL: ${JIRA_BASE_URL}`);
console.log(`Auth Method: ${JIRA_AUTH_METHOD}`);
console.log(`Email: ${JIRA_EMAIL || '(not provided)'}\n`);

// Try Basic Auth if email provided, otherwise Bearer
let authHeader;
if (JIRA_EMAIL) {
  authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
  console.log('Using Basic Auth (email + token)');
} else {
  authHeader = `Bearer ${JIRA_API_TOKEN}`;
  console.log('Using Bearer token (no email provided)');
}

const url = new URL('/rest/api/3/myself', JIRA_BASE_URL);

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'GET',
  timeout: 30000, // 30 seconds
  headers: {
    'Authorization': authHeader,
    'Accept': 'application/json'
  }
};

console.log(`\nConnecting to: ${url.href}...\n`);

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    if (res.statusCode === 200) {
      try {
        const data = JSON.parse(body);
        console.log('✅ SUCCESS! Connected to Jira');
        console.log(`\nUser Info:`);
        console.log(`  Name: ${data.displayName}`);
        console.log(`  Email: ${data.emailAddress || 'N/A'}`);
        console.log(`  Account ID: ${data.accountId}`);
      } catch (e) {
        console.log('✅ Connected but response parsing failed');
        console.log('Response:', body.substring(0, 200));
      }
    } else {
      console.log('❌ FAILED');
      console.log('Response:', body);
      if (res.statusCode === 401) {
        console.log('\n💡 Authentication failed. Try:');
        console.log('   1. Add your email to jira-config.json');
        console.log('   2. Verify your API token is correct');
        console.log('   3. Check if token has expired');
      } else if (res.statusCode === 403) {
        console.log('\n💡 Permission denied. Check:');
        console.log('   1. You have access to this Jira instance');
        console.log('   2. Your account has API access enabled');
      }
    }
  });
});

req.on('error', (err) => {
  if (err.code === 'ETIMEDOUT') {
    console.error('❌ Connection timeout');
    console.error('\n💡 Possible issues:');
    console.error('   1. Network/firewall blocking connection');
    console.error('   2. VPN required');
    console.error('   3. Proxy settings needed');
    console.error('   4. Jira URL incorrect');
  } else {
    console.error('❌ Error:', err.message);
  }
});

req.on('timeout', () => {
  req.destroy();
  console.error('❌ Request timeout');
});

req.end();

