# Notifications Service - Database Migrations

**Migration Version:** 004  
**Date:** 2025-12-11

---

## Overview

Database migrations for the notifications service, including tables for notifications, user preferences, and device tokens.

---

## Tables Created

### 1. notifications

Stores all notifications sent to users.

**Columns:**
- `id` (VARCHAR(36), PRIMARY KEY) - Notification ID
- `user_id` (VARCHAR(36), NOT NULL) - User who receives the notification
- `type` (VARCHAR(50), NOT NULL) - Notification type (meeting_reminder, meeting_started, etc.)
- `title` (VARCHAR(255), NOT NULL) - Notification title
- `body` (TEXT, NOT NULL) - Notification body/message
- `data` (JSON/JSONB, NULL) - Additional data (meetingId, etc.)
- `channels` (JSON/JSONB, NOT NULL) - Delivery channels (push, in_app, etc.)
- `priority` (VARCHAR(20), DEFAULT 'normal') - Priority level (low, normal, high, urgent)
- `scheduled_for` (TIMESTAMP, NULL) - When to send (for scheduled notifications)
- `sent_at` (TIMESTAMP, NULL) - When notification was sent
- `read_at` (TIMESTAMP, NULL) - When user read the notification
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Creation timestamp

**Indexes:**
- `idx_user_id` - For querying user notifications
- `idx_type` - For filtering by type
- `idx_scheduled_for` - For scheduled notification queries
- `idx_sent_at` - For sent notification queries
- `idx_read_at` - For read/unread queries
- `idx_created_at` - For chronological ordering

---

### 2. notification_preferences

Stores user notification preferences and quiet hours settings.

**Columns:**
- `user_id` (VARCHAR(36), PRIMARY KEY) - User ID
- `meeting_reminders` (BOOLEAN, DEFAULT TRUE) - Enable meeting reminders
- `meeting_started` (BOOLEAN, DEFAULT TRUE) - Enable "meeting started" notifications
- `prayer_requests` (BOOLEAN, DEFAULT TRUE) - Enable prayer request notifications
- `messages` (BOOLEAN, DEFAULT TRUE) - Enable message notifications
- `friend_requests` (BOOLEAN, DEFAULT TRUE) - Enable friend request notifications
- `group_invites` (BOOLEAN, DEFAULT TRUE) - Enable group invite notifications
- `quiet_hours_enabled` (BOOLEAN, DEFAULT FALSE) - Enable quiet hours
- `quiet_hours_start` (VARCHAR(5), DEFAULT '22:00') - Quiet hours start time (HH:mm)
- `quiet_hours_end` (VARCHAR(5), DEFAULT '08:00') - Quiet hours end time (HH:mm)
- `timezone` (VARCHAR(50), DEFAULT 'UTC') - User's timezone (IANA format)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Last update timestamp

**Indexes:**
- Primary key on `user_id` (implicit)

**Triggers (PostgreSQL only):**
- `update_notification_preferences_updated_at` - Auto-update `updated_at` on update

---

### 3. device_tokens

Stores push notification device tokens for FCM/APNS.

**Columns:**
- `id` (VARCHAR(36), PRIMARY KEY) - Device token record ID
- `user_id` (VARCHAR(36), NOT NULL) - User who owns the device
- `token` (VARCHAR(500), NOT NULL, UNIQUE) - FCM/APNS token
- `platform` (VARCHAR(20), NOT NULL) - Platform (ios, android, web)
- `device_id` (VARCHAR(255), NULL) - Device identifier
- `device_name` (VARCHAR(255), NULL) - Device name (e.g., "iPhone 14 Pro")
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_user_id` - For querying user's devices
- `idx_token` - For token lookups (UNIQUE constraint)
- `idx_platform` - For platform-specific queries

**Triggers (PostgreSQL only):**
- `update_device_tokens_updated_at` - Auto-update `updated_at` on update

---

## Running Migrations

### MySQL (Test)

```bash
cd backend/shared/database
npm run migrate:mysql
```

Or manually:
```sql
SOURCE migrations/004_create_notifications_tables.sql;
```

### PostgreSQL (Production)

```bash
cd backend/shared/database
npm run migrate:postgres
```

Or manually:
```sql
\i migrations/004_create_notifications_tables.postgresql.sql
```

---

## Migration Notes

### JSON/JSONB Support
- **MySQL**: Uses `JSON` type
- **PostgreSQL**: Uses `JSONB` type (more efficient for querying)

### Timestamps
- Both databases use `TIMESTAMP` type
- Default to `CURRENT_TIMESTAMP`
- PostgreSQL has triggers for `updated_at` auto-update
- MySQL uses `ON UPDATE CURRENT_TIMESTAMP` for `updated_at`

### Foreign Keys
- No foreign keys to `users` table (to avoid cross-service dependencies)
- User ID is stored as VARCHAR(36) for flexibility

---

## Verification

After running migrations, verify tables were created:

### MySQL
```sql
SHOW TABLES LIKE '%notification%';
DESCRIBE notifications;
DESCRIBE notification_preferences;
DESCRIBE device_tokens;
```

### PostgreSQL
```sql
\dt *notification*
\d notifications
\d notification_preferences
\d device_tokens
```

---

## Rollback

To rollback (if needed):

### MySQL
```sql
DROP TABLE IF EXISTS device_tokens;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notifications;
```

### PostgreSQL
```sql
DROP TABLE IF EXISTS device_tokens CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
```

---

## Next Steps

1. ✅ Run migrations on test database (MySQL)
2. ✅ Run migrations on production database (PostgreSQL)
3. ✅ Verify tables created successfully
4. ✅ Test notifications service with database
5. ✅ Create test data for development

---

**Last Updated:** 2025-12-11

