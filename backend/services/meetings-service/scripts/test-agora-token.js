/**
 * Test Agora Token Generation
 * 
 * Verifies that Agora credentials are working
 */

require('dotenv').config({ path: '.env' });
const { RtcTokenBuilder, RtcRole } = require('agora-token');

const appId = process.env.AGORA_APP_ID;
const appCertificate = process.env.AGORA_APP_CERTIFICATE;

console.log('🧪 Testing Agora Token Generation\n');

if (!appId || !appCertificate) {
  console.error('❌ Agora credentials not found in .env');
  console.log('   Make sure AGORA_APP_ID and AGORA_APP_CERTIFICATE are set\n');
  process.exit(1);
}

console.log(`App ID: ${appId.substring(0, 20)}...`);
console.log(`Certificate: ${appCertificate.substring(0, 20)}...\n`);

try {
  const channelName = 'test_channel_123';
  const uid = 12345;
  const role = RtcRole.PUBLISHER;
  const currentTime = Math.floor(Date.now() / 1000);
  const expireTime = 3600; // 1 hour
  const privilegeExpireTime = currentTime + expireTime;

  console.log('Generating token...');
  console.log(`  Channel: ${channelName}`);
  console.log(`  UID: ${uid}`);
  console.log(`  Role: ${role === RtcRole.PUBLISHER ? 'PUBLISHER' : 'SUBSCRIBER'}`);
  console.log(`  Expires in: ${expireTime} seconds\n`);

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    role,
    privilegeExpireTime,
    privilegeExpireTime
  );

  console.log('✅ Token generated successfully!\n');
  console.log(`Token (first 50 chars): ${token.substring(0, 50)}...\n`);
  console.log('✅ Agora credentials are working correctly!\n');

} catch (error) {
  console.error('❌ Token generation failed:', error.message);
  console.error('\nPossible issues:');
  console.error('  - Invalid App ID or Certificate');
  console.error('  - Agora service unavailable');
  console.error('  - Network connectivity issues\n');
  process.exit(1);
}

