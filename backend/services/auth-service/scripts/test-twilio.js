/**
 * Test Twilio REST API Integration
 * Tests SMS and WhatsApp delivery via REST API
 */

require('dotenv').config({ path: '.env' });

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${fromNumber}`;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const testPhoneNumber = process.env.TEST_PHONE_NUMBER;

console.log('🧪 Testing Twilio REST API Integration\n');

if (!accountSid || !authToken) {
  console.error('❌ Twilio credentials not found in .env');
  console.log('   Make sure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are set\n');
  process.exit(1);
}

if (!testPhoneNumber) {
  console.error('❌ TEST_PHONE_NUMBER not found in .env');
  console.log('   Set TEST_PHONE_NUMBER to your phone number (E.164 format: +1234567890)\n');
  process.exit(1);
}

const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;

// Create Basic Auth header
const credentials = `${accountSid}:${authToken}`;
const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;

/**
 * Send message via Twilio REST API
 */
async function sendMessage(to, message, useWhatsApp = false) {
  const url = `${baseUrl}/Messages.json`;
  
  const formattedTo = useWhatsApp 
    ? (to.startsWith('whatsapp:') ? to : `whatsapp:${to}`)
    : to;

  const formData = new URLSearchParams();
  formData.append('To', formattedTo);
  formData.append('Body', message);

  if (messagingServiceSid) {
    formData.append('MessagingServiceSid', messagingServiceSid);
    console.log(`   Using Messaging Service: ${messagingServiceSid}`);
  } else {
    const from = useWhatsApp ? whatsappNumber : fromNumber;
    formData.append('From', from);
    console.log(`   From: ${from}`);
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ API Error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.error_code) {
      console.error(`   ❌ Twilio Error: ${data.error_code} - ${data.error_message}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error('   ❌ Request failed:', error.message);
    return null;
  }
}

/**
 * Test SMS
 */
async function testSms() {
  console.log('\n📱 Testing SMS Delivery');
  console.log('─'.repeat(50));
  console.log(`   To: ${testPhoneNumber}`);
  
  const message = `FaithConnect Test SMS - ${new Date().toISOString()}`;
  console.log(`   Message: ${message.substring(0, 50)}...`);

  const result = await sendMessage(testPhoneNumber, message, false);

  if (result) {
    console.log(`   ✅ SMS sent successfully!`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Please check your phone for the message.\n`);
    return true;
  } else {
    console.log(`   ❌ SMS failed to send\n`);
    return false;
  }
}

/**
 * Test WhatsApp
 */
async function testWhatsApp() {
  console.log('\n💬 Testing WhatsApp Delivery');
  console.log('─'.repeat(50));
  console.log(`   To: ${testPhoneNumber}`);
  
  const message = `FaithConnect Test WhatsApp - ${new Date().toISOString()}`;
  console.log(`   Message: ${message.substring(0, 50)}...`);

  const result = await sendMessage(testPhoneNumber, message, true);

  if (result) {
    console.log(`   ✅ WhatsApp message sent successfully!`);
    console.log(`   Message SID: ${result.sid}`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Please check WhatsApp for the message.\n`);
    return true;
  } else {
    console.log(`   ❌ WhatsApp failed to send\n`);
    return false;
  }
}

/**
 * Run tests
 */
async function runTests() {
  console.log(`Account SID: ${accountSid.substring(0, 20)}...`);
  if (messagingServiceSid) {
    console.log(`Messaging Service SID: ${messagingServiceSid}`);
  } else {
    console.log(`From Number: ${fromNumber}`);
  }
  console.log(`Test Phone: ${testPhoneNumber}\n`);

  const smsResult = await testSms();
  
  // Wait a bit before sending WhatsApp
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const whatsappResult = await testWhatsApp();

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results');
  console.log('='.repeat(50));
  console.log(`SMS:        ${smsResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`WhatsApp:   ${whatsappResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50) + '\n');

  if (smsResult && whatsappResult) {
    console.log('✅ All tests passed! Twilio REST API is working correctly.\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the errors above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
