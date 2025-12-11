/**
 * Check Twilio Message Delivery Status
 * 
 * Usage:
 *   node scripts/check-message-status.js SM26d55694f9163fb54bc0895ef54d2659
 */

const twilio = require('twilio');
require('dotenv').config({ path: '.env' });

const messageSid = process.argv[2];

if (!messageSid) {
  console.error('❌ Message SID required');
  console.log('Usage: node scripts/check-message-status.js <MessageSID>');
  console.log('\nExample:');
  console.log('  node scripts/check-message-status.js SM26d55694f9163fb54bc0895ef54d2659');
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

async function checkStatus() {
  console.log('🔍 Checking Message Status...\n');
  console.log(`Message SID: ${messageSid}\n`);

  try {
    const message = await client.messages(messageSid).fetch();

    console.log('📊 Message Details:');
    console.log(`   Status: ${message.status}`);
    console.log(`   From: ${message.from}`);
    console.log(`   To: ${message.to}`);
    console.log(`   Body: ${message.body}`);
    console.log(`   Date Created: ${message.dateCreated}`);
    console.log(`   Date Sent: ${message.dateSent || 'Not sent yet'}`);
    console.log(`   Error Code: ${message.errorCode || 'None'}`);
    console.log(`   Error Message: ${message.errorMessage || 'None'}`);
    console.log(`   Price: ${message.price || 'N/A'}`);
    console.log(`   Price Unit: ${message.priceUnit || 'N/A'}`);

    console.log('\n📈 Status Explanation:');
    const statusMap = {
      'queued': 'Message is queued and waiting to be sent',
      'sending': 'Message is currently being sent',
      'sent': 'Message was sent successfully',
      'failed': 'Message failed to send',
      'delivered': 'Message was delivered to recipient',
      'undelivered': 'Message could not be delivered',
      'receiving': 'Message is being received',
      'received': 'Message was received',
      'accepted': 'Message was accepted by Twilio (may still be processing)'
    };

    const explanation = statusMap[message.status] || 'Unknown status';
    console.log(`   ${explanation}`);

    if (message.errorCode) {
      console.log('\n⚠️  Error Details:');
      console.log(`   Code: ${message.errorCode}`);
      console.log(`   Message: ${message.errorMessage}`);
      
      // Common error codes
      const errorHelp = {
        '21211': 'Invalid phone number format',
        '21608': 'Unsubscribed recipient (WhatsApp)',
        '21614': 'WhatsApp number not registered in sandbox',
        '30003': 'Unreachable destination',
        '30004': 'Message blocked',
        '30005': 'Unknown destination',
        '30006': 'Landline or unreachable carrier',
        '30008': 'Unknown destination'
      };

      if (errorHelp[message.errorCode]) {
        console.log(`   Help: ${errorHelp[message.errorCode]}`);
      }
    }

    // Check if it's a trial account issue
    if (message.status === 'accepted' && !message.dateSent) {
      console.log('\n💡 Note: Message is "accepted" but may still be processing.');
      console.log('   For trial accounts, you can only send to verified numbers.');
      console.log('   Check: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }

  } catch (error) {
    console.error('❌ Error fetching message:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    process.exit(1);
  }
}

checkStatus().catch(console.error);

