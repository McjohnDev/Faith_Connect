# Agora.io Integration Guide

## Overview

The Meetings Service uses Agora.io for real-time audio communication in prayer meetings. The service generates Agora RTC tokens that allow clients to join audio channels.

## Current Status

✅ **Service Integration:** Complete  
⚠️ **Credentials:** Using mock tokens (needs real Agora credentials for production)  
✅ **Token Generation:** Working (with fallback to mock tokens)

## Configuration

### Environment Variables

Add to `backend/services/meetings-service/.env`:

```env
# Agora Configuration
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

# Development fallback (allows mock tokens when Agora not configured)
ALLOW_MOCK_AGORA=true  # Set to false in production
```

### Getting Agora Credentials

1. **Sign up for Agora.io**
   - Go to https://www.agora.io/
   - Create an account
   - Navigate to Console → Projects

2. **Create a Project**
   - Click "Create Project"
   - Choose "Audio Only" (for prayer meetings)
   - Note your App ID and App Certificate

3. **Configure in Service**
   - Add `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` to `.env`
   - Restart the meetings service

## Token Generation

### How It Works

1. **User Joins Meeting** → Service generates Agora token
2. **Token Contains:**
   - Channel name (meeting ID)
   - User ID (Agora UID)
   - Role (publisher/subscriber)
   - Expiration (1 hour default)

3. **Client Uses Token** → Connects to Agora RTC network

### Token Roles

- **Publisher:** Can speak (host, co-host, speaker, music_host)
- **Subscriber:** Listen only (listener role)

### Example Token Generation

```typescript
// In meeting.service.ts
const agoraToken = agoraService.generateToken(
  meeting.channelName,  // e.g., "meeting_abc123"
  agoraUid,             // e.g., 131664
  role === 'listener' ? 'subscriber' : 'publisher'
);
```

## Mock Tokens (Development)

When Agora credentials are not configured:

- Service generates mock tokens for testing
- Format: `mock_token_{channelName}_{uid}_{timestamp}`
- Allows API testing without real Agora setup
- **Not valid for actual audio connections**

## Production Setup

### Required Steps

1. **Get Real Agora Credentials**
   - Sign up at Agora.io
   - Create audio-only project
   - Get App ID and Certificate

2. **Update Environment**
   ```env
   AGORA_APP_ID=your_real_app_id
   AGORA_APP_CERTIFICATE=your_real_certificate
   ALLOW_MOCK_AGORA=false
   ```

3. **Test Token Generation**
   ```bash
   # Create a meeting
   curl -X POST http://localhost:3002/api/v1/meetings \
     -H "Content-Type: application/json" \
     -H "x-user-id: test-user" \
     -d '{"title":"Test Meeting"}'
   
   # Join meeting (returns real Agora token)
   curl -X POST http://localhost:3002/api/v1/meetings/{id}/join \
     -H "Content-Type: application/json" \
     -H "x-user-id: test-user" \
     -d '{"role":"speaker"}'
   ```

4. **Verify Token**
   - Token should be a valid Agora RTC token
   - Can be decoded/verified using Agora SDK

## Client Integration

### React Native Example

```typescript
import RtcEngine from 'react-native-agora';

// Initialize Agora
const engine = await RtcEngine.create(AGORA_APP_ID);

// Join channel with token
await engine.joinChannel(
  agoraToken,      // Token from API
  channelName,     // Meeting channel name
  agoraUid,        // User ID
  {
    clientRoleType: role === 'listener' ? ClientRoleType.ClientRoleAudience : ClientRoleType.ClientRoleBroadcaster
  }
);
```

### Web Example

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

// Create client
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// Join channel
await client.join(
  AGORA_APP_ID,
  channelName,
  agoraToken,
  agoraUid
);
```

## Token Expiration

- **Default:** 1 hour
- **Configurable:** Set `expireTime` parameter in `generateToken()`
- **Refresh:** Clients should request new token before expiration
- **Security:** Tokens are single-use and time-limited

## Troubleshooting

### Issue: "AGORA_NOT_CONFIGURED" Error

**Solution:**
1. Check `.env` file has `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE`
2. Restart the meetings service
3. Verify credentials are correct

### Issue: Mock Tokens in Production

**Solution:**
1. Set `ALLOW_MOCK_AGORA=false` in production
2. Ensure real Agora credentials are configured
3. Service will fail gracefully if credentials missing

### Issue: Token Invalid

**Solution:**
1. Check token hasn't expired
2. Verify App ID matches between service and client
3. Ensure certificate is correct
4. Check channel name format

## Security Considerations

1. **Never expose App Certificate** - Keep in `.env` only
2. **Token Expiration** - Use short expiration times
3. **Role Validation** - Verify user role before generating token
4. **Channel Names** - Use unique, non-guessable channel names

## Next Steps

1. **Get Agora Credentials** - Sign up and create project
2. **Configure Service** - Add credentials to `.env`
3. **Test Integration** - Generate real tokens and test
4. **Client Integration** - Integrate Agora SDK in mobile/web clients

---

**Last Updated:** 2025-12-11

