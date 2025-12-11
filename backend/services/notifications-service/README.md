# Notifications Service

Push notifications, meeting reminders, and quiet hours support for FaithConnect.

## Features

- ✅ Push notifications (FCM/APNS)
- ✅ Meeting reminder notifications
- ✅ "Meeting started" notifications
- ✅ Quiet hours support (timezone-aware)
- ✅ Notification preferences per user
- ✅ Device token management
- ✅ Scheduled notifications
- ✅ In-app notifications

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp env.docker.example .env

# Edit .env with your credentials:
# - FCM_SERVICE_ACCOUNT_KEY (Firebase service account JSON)
# - Database credentials (MySQL/PostgreSQL)
# - JWT secrets

# Run migrations (create tables)
# See migrations/ directory

# Run in development
npm run dev

# Build
npm run build

# Run production
npm start
```

## API Endpoints

### Notifications

- `POST /api/v1/notifications` - Create notification
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:notificationId/read` - Mark as read

### Preferences

- `GET /api/v1/notifications/preferences` - Get preferences
- `PUT /api/v1/notifications/preferences` - Update preferences

### Device Tokens

- `POST /api/v1/notifications/devices` - Register device token
- `DELETE /api/v1/notifications/devices` - Unregister device token

## Configuration

### FCM Setup

1. Create Firebase project
2. Download service account key (JSON)
3. Set `FCM_SERVICE_ACCOUNT_KEY` environment variable (JSON string)

### Quiet Hours

Users can configure quiet hours in their preferences:
- Start time (e.g., "22:00")
- End time (e.g., "08:00")
- Timezone (e.g., "America/New_York")

Urgent notifications bypass quiet hours.

## Database Tables

- `notifications` - Notification records
- `notification_preferences` - User preferences
- `device_tokens` - Push notification tokens

## Integration

The service can be called from other services:

```typescript
// Send meeting reminder
await notificationService.sendMeetingReminder(
  userId,
  meetingId,
  meetingTitle,
  scheduledStart
);

// Send "meeting started" notification
await notificationService.sendMeetingStarted(
  userId,
  meetingId,
  meetingTitle
);
```

