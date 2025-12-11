# Twilio Troubleshooting Guide

## Message Not Received

### Common Issues

#### 1. Trial Account Restrictions
**Problem**: Twilio trial accounts can only send to verified phone numbers.

**Solution**:
- Verify your phone number: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Or upgrade to a paid account

**Check**:
```bash
# Check message status
node scripts/check-message-status.js <MessageSID>
```

#### 2. Phone Number Format
**Problem**: Phone number must include country code.

**Correct Format**: `+1234567890` (with + and country code)
**Wrong Format**: `1234567890` or `01234567890`

#### 3. Message Status: "accepted" but not delivered
**Problem**: "accepted" means Twilio received it, but delivery may fail.

**Check Status**:
```bash
node scripts/check-message-status.js <MessageSID>
```

**Common Status Values**:
- `queued` - Waiting to send
- `sending` - Currently sending
- `sent` - Sent successfully
- `delivered` - Delivered to phone
- `failed` - Failed to send
- `undelivered` - Could not deliver
- `accepted` - Accepted by Twilio (may still be processing)

#### 4. Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 21211 | Invalid phone number | Check format: +1234567890 |
| 21608 | Unsubscribed (WhatsApp) | User must join WhatsApp sandbox |
| 21614 | WhatsApp not registered | Join sandbox or use production API |
| 30003 | Unreachable destination | Check phone number |
| 30004 | Message blocked | Carrier blocking |
| 30005 | Unknown destination | Invalid number |
| 30006 | Landline | Can't receive SMS on landline |
| 30008 | Unknown destination | Invalid number |

#### 5. WhatsApp Sandbox
**Problem**: WhatsApp requires sandbox setup for testing.

**Solution**:
1. Go to Twilio Console → Messaging → Try it out
2. Send WhatsApp message to join sandbox
3. User must reply with join code
4. Then messages will work

#### 6. Carrier Blocking
**Problem**: Some carriers block messages from trial accounts.

**Solution**: Upgrade to paid account or verify number

## Debugging Steps

### Step 1: Check Message Status
```bash
node scripts/check-message-status.js <MessageSID>
```

### Step 2: Verify Phone Number (Trial Accounts)
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Add your phone number
3. Verify via SMS/call

### Step 3: Check Twilio Console
1. Go to: https://console.twilio.com/us1/monitor/logs/sms
2. Find your message
3. Check status and error details

### Step 4: Test with Different Number
```bash
# Test SMS
npm run test:twilio sms +1234567890

# Use a verified number for trial accounts
```

## Testing Checklist

- [ ] Phone number format correct (+country code)
- [ ] Number verified (for trial accounts)
- [ ] Twilio account has credits
- [ ] Message status checked
- [ ] Error code reviewed
- [ ] WhatsApp sandbox joined (if using WhatsApp)

## Getting Help

1. **Twilio Console**: Check logs and message status
2. **Twilio Support**: https://support.twilio.com/
3. **Error Codes**: https://www.twilio.com/docs/api/errors

## Production Checklist

Before going to production:
- [ ] Upgrade from trial account
- [ ] Verify sending phone number
- [ ] Set up WhatsApp Business API (if using)
- [ ] Configure webhooks for delivery status
- [ ] Monitor message delivery rates
- [ ] Set up alerts for failures

