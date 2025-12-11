# Quick Test Guide - Stories 1 & 2

## 🚀 Quick Start

### Step 1: Start Services

**Terminal 1 - Auth Service:**
```bash
cd backend/services/auth-service
npm run dev
```

**Terminal 2 - Meetings Service:**
```bash
cd backend/services/meetings-service
npm run dev
```

### Step 2: Run Tests

**Terminal 3 - Test Auth:**
```bash
cd backend/services/auth-service
node scripts/test-auth-flow.js +237693805080
```

**Terminal 4 - Test Meetings:**
```bash
cd backend/services/meetings-service
node scripts/test-meetings-flow.js
```

## ✅ What Gets Tested

### Auth Service (Story 1)
- Health check
- Phone registration → OTP sent
- OTP verification → User created
- Token generation (access + refresh)
- Refresh token flow
- Login flow

### Meetings Service (Story 2)
- Health check
- Create meeting
- Get meeting details
- Join meeting → Agora token generated
- Raise hand
- Meeting controls (mute)
- List meetings
- Leave meeting

## 📋 Prerequisites

1. **Database**: Run migrations first
   ```bash
   cd backend/shared/database
   npm run migrate:mysql
   ```

2. **Environment**: 
   - Auth Service needs Twilio credentials (`.env`)
   - Meetings Service needs Agora credentials (optional for testing)

3. **Services Running**:
   - Auth: `http://localhost:3001`
   - Meetings: `http://localhost:3002`

## 🎯 Expected Results

- ✅ All endpoints return 200/201
- ✅ OTP received on phone (if Twilio configured)
- ✅ User created in database
- ✅ Meeting created with Agora token
- ✅ All operations complete successfully

## 📝 Notes

- Auth Service uses real Twilio (SMS/WhatsApp)
- Meetings Service uses mock auth (X-User-Id header) for testing
- Agora tokens generated but need real credentials for audio

See `TESTING-GUIDE.md` for detailed manual testing instructions.

