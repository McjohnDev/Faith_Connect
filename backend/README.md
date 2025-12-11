# Backend Services

Node.js microservices for FaithConnect platform.

## Services

### Auth Service
- Phone OTP authentication
- JWT token management
- Device management
- 2FA support

### Meetings Service
- Agora.io integration
- Live prayer meetings
- Background music
- Screen sharing
- Recording

### Feed Service
- Post CRUD operations
- Reactions and comments
- Feed algorithms
- Prayer request boost

### Chat Service
- Direct messages
- Group chats
- E2EE for 1:1
- WebSocket real-time

### Bible Service
- Verse lookup
- Multiple translations
- Reading plans
- Study tools

### Moderation Service
- AI content scanning
- Human review queue
- Strike system
- Appeals process

### Payment Service
- Stripe integration
- Subscription management
- Creator marketplace
- Revenue tracking

### Notification Service
- Push notifications (FCM/APNs)
- In-app notifications
- Email notifications

## Setup

```bash
# Install dependencies
npm install

# Run services
npm run dev

# Run tests
npm test
```

## Database

- **Test**: MySQL
- **Production**: PostgreSQL

Migrations support both databases.

