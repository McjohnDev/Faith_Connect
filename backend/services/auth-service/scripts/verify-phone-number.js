/**
 * Verify Phone Number for Twilio Trial Account
 * 
 * Trial accounts can only send to verified numbers
 * 
 * Usage:
 *   node scripts/verify-phone-number.js +237693805080
 */

const twilio = require('twilio');
require('dotenv').config({ path: '.env' });

const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error('❌ Phone number required');
  console.log('Usage: node scripts/verify-phone-number.js +1234567890');
  process.exit(1);
}

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid) {
  console.error('❌ TWILIO_ACCOUNT_SID not set in .env');
  process.exit(1);
}

if (!authToken) {
  console.error('❌ TWILIO_AUTH_TOKEN not set in .env');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function verifyNumber() {
  console.log('📱 Verifying Phone Number for Trial Account...\n');
  console.log(`Phone Number: ${phoneNumber}\n`);

  try {
    // Check if number is verified
    const verifiedNumbers = await client.outgoingCallerIds.list();
    const isVerified = verifiedNumbers.some(v => v.phoneNumber === phoneNumber);

    if (isVerified) {
      console.log('✅ Phone number is verified!');
      console.log('   You can receive SMS from this trial account.\n');
    } else {
      console.log('❌ Phone number is NOT verified');
      console.log('\n📋 To verify this number:');
      console.log('   1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
      console.log('   2. Click "Add a new number"');
      console.log('   3. Enter: ' + phoneNumber);
      console.log('   4. Choose verification method (SMS or Call)');
      console.log('   5. Enter the code you receive');
      console.log('\n   OR use the API to send verification:');
      console.log('   curl -X POST https://api.twilio.com/2010-04-01/Accounts/' + accountSid + '/OutgoingCallerIds.json \\');
      console.log('     --data-urlencode "PhoneNumber=' + phoneNumber + '" \\');
      console.log('     -u ' + accountSid + ':' + authToken);
    }

    console.log('\n💡 Trial Account Limitations:');
    console.log('   - Can only send to verified numbers');
    console.log('   - Messages include "Sent from your Twilio trial account" prefix');
    console.log('   - Upgrade to paid account to send to any number');
    console.log('\n🔗 Verify Number: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
  }
}

verifyNumber().catch(console.error);

