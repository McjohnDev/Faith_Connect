# Meetings Service

Live Prayer Meetings Service with Agora.io Integration

## Features

- Create and manage prayer meetings
- Agora.io audio-only integration
- Role-based access (host, co-host, speaker, listener, music_host)
- Meeting controls (mute/unmute, lock, remove participants)
- Hand raise functionality
- Background music support (API ready)
- Recording support (API ready)

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.template .env

# Edit .env with your credentials:
# - Agora App ID and Certificate
# - Database credentials (MySQL/PostgreSQL)
# - JWT secrets

# Run migrations
npm run migrate

# Run in development
npm run dev

# Build
npm run build

# Run production
npm start
```

## API Endpoints

### Meetings

- `POST /api/v1/meetings` - Create meeting
  - Body: `{ title, description?, scheduledStart?, maxParticipants?, backgroundMusicEnabled?, recordingEnabled? }`
- `GET /api/v1/meetings` - List meetings
  - Query: `?status=scheduled&hostId=xxx&limit=10&offset=0`
- `GET /api/v1/meetings/:meetingId` - Get meeting details
- `POST /api/v1/meetings/:meetingId/join` - Join meeting
  - Body: `{ role?: "host" | "co_host" | "speaker" | "listener" | "music_host" }`
  - Returns: `{ meeting, participant, agoraToken, agoraUid }`
- `POST /api/v1/meetings/:meetingId/leave` - Leave meeting
- `POST /api/v1/meetings/:meetingId/hand/raise` - Raise hand
- `POST /api/v1/meetings/:meetingId/hand/lower` - Lower hand
- `POST /api/v1/meetings/:meetingId/control` - Meeting controls
  - Body: `{ action: "mute" | "unmute" | "remove" | "promote" | "demote" | "lock" | "unlock", participantId?, role? }`

### Health

- `GET /health` - Health check

## Meeting Roles

- **host**: Meeting creator, full control
- **co_host**: Can manage participants, lock meeting
- **speaker**: Can speak (publisher in Agora)
- **listener**: Listen only (subscriber in Agora)
- **music_host**: Can control background music

## Meeting Status

- `scheduled`: Meeting created but not started
- `active`: Meeting is live
- `ended`: Meeting has ended
- `cancelled`: Meeting was cancelled

## Agora Integration

The service generates Agora RTC tokens for joining audio channels:

- **Publishers**: Host, co-host, speaker, music_host
- **Subscribers**: Listeners

Token expires after 1 hour (configurable).

## Database

- **Test**: MySQL
- **Production**: PostgreSQL

Tables:
- `meetings` - Meeting data
- `meeting_participants` - Participant tracking

## Rate Limits

- Create meeting: 10 per 15 minutes
- List meetings: 30 per minute
- Get meeting: 60 per minute
- Join meeting: 20 per 5 minutes
- Leave meeting: 30 per minute
- Raise hand: 20 per minute
- Control meeting: 30 per minute

## Environment Variables

```env
# Server
PORT=3002
NODE_ENV=development

# Agora
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate

# Database (MySQL for test)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=faithconnect_test

# Database (PostgreSQL for prod)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DATABASE=faithconnect

# JWT (for auth middleware - to be implemented)
JWT_SECRET=your_jwt_secret

# Logging
LOG_LEVEL=info
```

## Next Steps

1. **Authentication Middleware**: Add JWT verification middleware
2. **WebSocket Events**: Real-time events for meeting updates
3. **Background Music**: Implement music control API
4. **Recording**: Integrate Agora Cloud Recording
5. **Screen Share**: Add screen share hooks

## Testing

```bash
# Start service
npm run dev

# Create meeting
curl -X POST http://localhost:3002/api/v1/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"title": "Morning Prayer", "description": "Join us for prayer"}'

# Join meeting
curl -X POST http://localhost:3002/api/v1/meetings/<meetingId>/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"role": "listener"}'
```

