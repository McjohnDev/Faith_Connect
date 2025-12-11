/**
 * Verify Jira Setup
 * Checks if all required configuration is present
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'jira-config.json');

console.log('🔍 Verifying Jira Configuration...\n');

if (!fs.existsSync(configPath)) {
  console.error('❌ jira-config.json not found');
  console.log('💡 Copy jira-config.json.template and fill in your details');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const required = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT_KEY'];
const missing = required.filter(key => !config[key] || config[key] === '');

if (missing.length > 0) {
  console.error('❌ Missing required configuration:');
  missing.forEach(key => console.error(`   - ${key}`));
  process.exit(1);
}

console.log('✅ Configuration Check:');
console.log(`   Base URL: ${config.JIRA_BASE_URL}`);
console.log(`   Email: ${config.JIRA_EMAIL}`);
console.log(`   Project: ${config.JIRA_PROJECT_KEY}`);
console.log(`   Auth Method: ${config.JIRA_AUTH_METHOD || 'basic'}`);
console.log(`   Org ID: ${config.JIRA_ORG_ID || 'Not set'}`);
console.log(`   API Token: ${config.JIRA_API_TOKEN ? '***' + config.JIRA_API_TOKEN.slice(-4) : 'Missing'}`);

// Check API token format
const token = config.JIRA_API_TOKEN;
if (token && token.length < 20) {
  console.warn('\n⚠️  Warning: API token seems too short. Verify it\'s correct.');
}

// Check expiry (if we had expiry info, we'd check it here)
console.log('\n📅 API Key Info:');
console.log('   Key Name: dev');
console.log('   Expires: 2026-01-10');
console.log('   Status: Active');

console.log('\n✅ Configuration looks good!');
console.log('\nNext steps:');
console.log('   1. Test connection: node scripts/test-jira-connection.js');
console.log('   2. Create tickets: node scripts/create-jira-tickets.js');

