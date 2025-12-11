# Testing Guide - Stories 1 & 2

## Overview

This guide helps you test the first two completed stories:
- **Story 1**: Phone OTP Auth Flow ✅
- **Story 2**: Meetings Service ✅

## Prerequisites

1. **Database Setup**
   ```bash
   # Run migrations
   cd backend/shared/database
   npm run migrate:mysql  # For test environment
   ```

2. **Environment Variables**
   - Auth Service: `backend/services/auth-service/.env`
   - Meetings Service: `backend/services/meetings-service/.env`

3. **Services Running**
   - Auth Service: Port 3001
   - Meetings Service: Port 3002

## Quick Start

### 1. Start Services

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

### 2. Test Auth Service

**Terminal 3:**
```bash
cd backend/services/auth-service
node scripts/test-auth-flow.js +237693805080
```

**What it tests:**
- ✅ Health check
- ✅ Phone registration (OTP send via SMS)
- ✅ OTP verification
- ✅ Token generation
- ✅ Refresh token
- ✅ Login flow

**Expected Flow:**
1. OTP sent to phone
2. Enter OTP when prompted
3. User created/logged in
4. Tokens generated

### 3. Test Meetings Service

**Terminal 4:**
```bash
cd backend/services/meetings-service
node scripts/test-meetings-flow.js
```

**What it tests:**
- ✅ Health check
- ✅ Create meeting
- ✅ Get meeting details
- ✅ Join meeting (returns Agora token)
- ✅ Raise hand
- ✅ Meeting controls (mute)
- ✅ List meetings
- ✅ Leave meeting

## Manual Testing

### Auth Service Endpoints

#### 1. Health Check
```bash
curl http://localhost:3001/health
```

#### 2. Register Phone (Send OTP)
```bash
curl -X POST http://localhost:3001/api/v1/auth/register-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+237693805080",
    "age": 18,
    "deliveryMethod": "sms"
  }'
```

#### 3. Verify OTP
```bash
curl -X POST http://localhost:3001/api/v1/auth/verify-phone \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+237693805080",
    "otp": "123456",
    "guidelinesAccepted": true
  }'
```

#### 4. Refresh Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

### Meetings Service Endpoints

#### 1. Health Check
```bash
curl http://localhost:3002/health
```

#### 2. Create Meeting
```bash
curl -X POST http://localhost:3002/api/v1/meetings \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{
    "title": "Morning Prayer",
    "description": "Join us for prayer",
    "maxParticipants": 50
  }'
```

#### 3. Join Meeting
```bash
curl -X POST http://localhost:3002/api/v1/meetings/{meetingId}/join \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user-123" \
  -d '{
    "role": "listener"
  }'
```

#### 4. Raise Hand
```bash
curl -X POST http://localhost:3002/api/v1/meetings/{meetingId}/hand/raise \
  -H "X-User-Id: test-user-123"
```

## Expected Results

### Auth Service
- ✅ OTP sent successfully (check phone)
- ✅ User created in database
- ✅ JWT tokens generated
- ✅ Refresh token works

### Meetings Service
- ✅ Meeting created with unique channel name
- ✅ Agora token generated for joining
- ✅ Participant added to meeting
- ✅ Controls work (mute, raise hand, etc.)

## Troubleshooting

### Auth Service Issues

**OTP not received:**
- Check Twilio credentials in `.env`
- Verify phone number is verified (trial accounts)
- Check Twilio console for message status

**Database errors:**
- Run migrations: `cd backend/shared/database && npm run migrate:mysql`
- Check MySQL is running
- Verify database credentials in `.env`

### Meetings Service Issues

**Agora errors:**
- Check `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` in `.env`
- Service will still work but tokens won't be valid

**Database errors:**
- Run migrations: `cd backend/shared/database && npm run migrate:mysql`
- Check `meetings` and `meeting_participants` tables exist

**Connection refused:**
- Make sure service is running on port 3002
- Check for port conflicts

## Next Steps

After testing:
1. ✅ Verify all endpoints work
2. ✅ Check database records created
3. ✅ Test error cases (invalid OTP, locked meeting, etc.)
4. ✅ Move to Story 3: WebSocket Events

## Notes

- **Auth Service**: Uses real Twilio (SMS/WhatsApp)
- **Meetings Service**: Uses mock auth (X-User-Id header) for testing
- **Database**: MySQL for test, PostgreSQL for production
- **Agora**: Tokens generated but need real Agora credentials for actual audio

