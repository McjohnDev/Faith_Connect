# Twilio Setup Guide

## Configuration

### 1. Get Twilio Credentials

1. Sign up at https://www.twilio.com/
2. Go to Console: https://console.twilio.com/
3. Get your credentials:
   - **Account SID**: Found on dashboard (starts with `AC`)
   - **Auth Token**: Click to reveal (starts with your account SID)
   - **Phone Number**: Buy a number from Twilio

### 2. Configure Environment Variables

Add to `.env`:

```env
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX
TWILIO_MESSAGING_SERVICE_SID=YOUR_TWILIO_MESSAGING_SERVICE_SID
```

**Messaging Service SID (Recommended):**
- Provides better deliverability
- Supports sender pool management
- Automatic number selection
- Get from: Twilio Console → Messaging → Services

### 3. Test SMS

```bash
# Test SMS delivery
npm run test:twilio sms +237693805080

# Or directly
node scripts/test-twilio.js sms +237693805080
```

### 4. Test WhatsApp (Optional)

**Prerequisites:**
- Twilio WhatsApp Business API enabled
- WhatsApp number configured in Twilio

```bash
# Test WhatsApp delivery
npm run test:twilio whatsapp +237693805080

# Or directly
node scripts/test-twilio.js whatsapp +237693805080
```

## API Format

Twilio uses Basic Authentication:

```
curl 'https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json' \
  -X POST \
  --data-urlencode 'To=+237693805080' \
  --data-urlencode 'From=+12694668702' \
  --data-urlencode 'Body=Your OTP code' \
  -u {AccountSid}:{AuthToken}
```

## WhatsApp Setup

1. **Enable WhatsApp Sandbox** (for testing):
   - Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Follow instructions to join sandbox

2. **Production WhatsApp**:
   - Apply for WhatsApp Business API
   - Get approved by Twilio
   - Configure WhatsApp number

## Troubleshooting

### SMS Not Sending

- ✅ Verify Account SID and Auth Token
- ✅ Check phone number format (must include country code: +1234567890)
- ✅ Ensure Twilio account has credits
- ✅ Verify phone number is verified (for trial accounts)

### WhatsApp Not Working

- ✅ WhatsApp requires Business API setup
- ✅ Sandbox mode: User must join sandbox first
- ✅ Production: Requires approval
- ✅ Falls back to SMS automatically if WhatsApp fails

### Error Codes

- **21211**: Invalid phone number format
- **21608**: Unsubscribed recipient (WhatsApp)
- **21614**: WhatsApp number not registered
- **30003**: Unreachable destination
- **30008**: Unknown destination

## Rate Limits

- **SMS**: Varies by country
- **WhatsApp**: 1000 messages/day (sandbox), higher in production
- **Rate limiting**: Our service limits to 5 OTPs/hour per phone number

## Cost

- **SMS**: ~$0.0075 per message (varies by country)
- **WhatsApp**: Free in sandbox, paid in production
- Check Twilio pricing: https://www.twilio.com/pricing

