# Auth Service OTP Test Results

**Date:** 2025-12-11  
**Service:** Auth Service (Port 3001)  
**Test Phone:** +237693805080  
**Twilio Phone:** +12694668702

## Test Status

⚠️ **Tests are running but may require Twilio configuration**

The auth service endpoints are responding, but OTP delivery requires:
1. Twilio Account SID
2. Twilio Auth Token  
3. Twilio Phone Number configured in `.env`

## Test Scripts Created

1. **`scripts/test-auth-simple.js`** - Tests OTP registration flow
   - Health check
   - Register phone (SMS)
   - Register phone (WhatsApp)
   - Resend OTP
   - Login flow

2. **`scripts/test-auth-verify.js`** - Verifies OTP and completes auth flow
   - Verify OTP
   - Test refresh token
   - Test logout

## Usage

### Step 1: Register and Send OTP
```bash
node scripts/test-auth-simple.js
```

This will:
- ✅ Test health endpoint
- ✅ Register phone number (+237693805080)
- ✅ Send OTP via SMS
- ✅ Send OTP via WhatsApp
- ✅ Test resend OTP
- ✅ Test login flow

### Step 2: Verify OTP (after receiving OTP on phone)
```bash
node scripts/test-auth-verify.js +237693805080 <OTP>
```

Example:
```bash
node scripts/test-auth-verify.js +237693805080 123456
```

## Endpoints Tested

### ✅ Health Check
- `GET /health` - Service status

### ⏳ Register Phone (SMS)
- `POST /api/v1/auth/register-phone`
- Body: `{ phoneNumber: "+237693805080", age: 18, deliveryMethod: "sms" }`
- **Status:** Requires Twilio configuration

### ⏳ Register Phone (WhatsApp)
- `POST /api/v1/auth/register-phone`
- Body: `{ phoneNumber: "+237693805080", age: 18, deliveryMethod: "whatsapp" }`
- **Status:** Requires Twilio configuration

### ⏳ Resend OTP
- `POST /api/v1/auth/resend-otp`
- Body: `{ phoneNumber: "+237693805080", deliveryMethod: "sms" }`
- **Status:** Requires Twilio configuration

### ⏳ Login Phone
- `POST /api/v1/auth/login-phone`
- Body: `{ phoneNumber: "+237693805080", deliveryMethod: "sms" }`
- **Status:** Requires Twilio configuration

### ⏳ Verify OTP
- `POST /api/v1/auth/verify-phone`
- Body: `{ phoneNumber: "+237693805080", otp: "123456", guidelinesAccepted: true }`
- **Status:** Requires valid OTP from registration

### ⏳ Refresh Token
- `POST /api/v1/auth/refresh-token`
- Body: `{ refreshToken: "..." }`
- **Status:** Requires valid refresh token from verification

### ⏳ Logout
- `POST /api/v1/auth/logout`
- Body: `{ refreshToken: "..." }`
- **Status:** Requires valid refresh token

## Validation Tests

✅ **Age Restriction** - Users under 13 are rejected
✅ **Phone Format** - Invalid phone numbers are rejected
✅ **Guidelines** - Guidelines must be accepted for verification

## Configuration Required

To complete OTP testing, ensure `.env` file has:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+12694668702
TWILIO_WHATSAPP_NUMBER=whatsapp:+12694668702
REDIS_URL=redis://localhost:6379
```

## Next Steps

1. **Configure Twilio** - Add credentials to `.env` file
2. **Start Redis** - Ensure Redis is running for OTP storage
3. **Run Tests** - Execute test scripts
4. **Check Phone** - Verify OTP is received
5. **Verify OTP** - Complete the auth flow

## Expected Flow

1. User registers phone → OTP sent to +237693805080
2. User receives OTP on phone
3. User verifies OTP → Account created, tokens issued
4. User can refresh tokens
5. User can logout

---

**Last Updated:** 2025-12-11

