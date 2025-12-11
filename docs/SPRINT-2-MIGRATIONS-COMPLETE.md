# Sprint 2 - Database Migrations: Complete ✅

**Date:** 2025-12-11  
**Status:** ✅ Complete

---

## Overview

Successfully created and applied database migrations for the notifications service.

---

## Migrations Created

### Migration 004: Notifications Tables

**Files:**
- `backend/shared/database/migrations/004_create_notifications_tables.sql` (MySQL)
- `backend/shared/database/migrations/004_create_notifications_tables.postgresql.sql` (PostgreSQL)

**Tables Created:**

1. **notifications** - Stores all notifications
   - 13 columns including id, user_id, type, title, body, data, channels, priority, etc.
   - 6 indexes for efficient querying
   - Supports scheduled notifications

2. **notification_preferences** - User notification preferences
   - 13 columns including user preferences and quiet hours settings
   - Primary key on user_id
   - Auto-update trigger for updated_at (PostgreSQL)

3. **device_tokens** - Push notification device tokens
   - 8 columns including token, platform, device info
   - Unique constraint on token
   - 3 indexes for efficient lookups
   - Auto-update trigger for updated_at (PostgreSQL)

---

## Migration Execution

### ✅ MySQL (Test Database)

```bash
cd backend/shared/database
npm run migrate:mysql
```

**Result:**
```
✅ Migration 003 applied successfully (recordings)
✅ Migration 004 applied successfully (notifications)
✅ All migrations completed
```

### ⏳ PostgreSQL (Production Database)

```bash
cd backend/shared/database
npm run migrate:postgres
```

**Note:** Run when ready to deploy to production.

---

## Table Structure

### notifications

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key |
| user_id | VARCHAR(36) | User who receives notification |
| type | VARCHAR(50) | Notification type |
| title | VARCHAR(255) | Notification title |
| body | TEXT | Notification message |
| data | JSON/JSONB | Additional data |
| channels | JSON/JSONB | Delivery channels |
| priority | VARCHAR(20) | Priority level |
| scheduled_for | TIMESTAMP | Scheduled send time |
| sent_at | TIMESTAMP | When sent |
| read_at | TIMESTAMP | When read |
| created_at | TIMESTAMP | Creation time |

**Indexes:**
- user_id, type, scheduled_for, sent_at, read_at, created_at

---

### notification_preferences

| Column | Type | Description |
|--------|------|-------------|
| user_id | VARCHAR(36) | Primary key |
| meeting_reminders | BOOLEAN | Enable meeting reminders |
| meeting_started | BOOLEAN | Enable "meeting started" |
| prayer_requests | BOOLEAN | Enable prayer requests |
| messages | BOOLEAN | Enable messages |
| friend_requests | BOOLEAN | Enable friend requests |
| group_invites | BOOLEAN | Enable group invites |
| quiet_hours_enabled | BOOLEAN | Enable quiet hours |
| quiet_hours_start | VARCHAR(5) | Start time (HH:mm) |
| quiet_hours_end | VARCHAR(5) | End time (HH:mm) |
| timezone | VARCHAR(50) | User timezone |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

---

### device_tokens

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(36) | Primary key |
| user_id | VARCHAR(36) | User who owns device |
| token | VARCHAR(500) | FCM/APNS token (UNIQUE) |
| platform | VARCHAR(20) | ios, android, web |
| device_id | VARCHAR(255) | Device identifier |
| device_name | VARCHAR(255) | Device name |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

**Indexes:**
- user_id, token (UNIQUE), platform

---

## Verification

### MySQL Verification

```sql
-- Check tables exist
SHOW TABLES LIKE '%notification%';

-- Verify structure
DESCRIBE notifications;
DESCRIBE notification_preferences;
DESCRIBE device_tokens;

-- Check indexes
SHOW INDEXES FROM notifications;
```

### PostgreSQL Verification

```sql
-- Check tables exist
\dt *notification*

-- Verify structure
\d notifications
\d notification_preferences
\d device_tokens
```

---

## Database Differences

### JSON Storage
- **MySQL**: Uses `JSON` type
- **PostgreSQL**: Uses `JSONB` type (more efficient)

### Timestamp Updates
- **MySQL**: Uses `ON UPDATE CURRENT_TIMESTAMP`
- **PostgreSQL**: Uses triggers with `update_updated_at_column()` function

### Index Creation
- **MySQL**: Indexes created inline with table
- **PostgreSQL**: Indexes created separately with `CREATE INDEX IF NOT EXISTS`

---

## Next Steps

1. ✅ **MySQL migrations applied** - Test database ready
2. ⏳ **PostgreSQL migrations** - Apply when deploying to production
3. ✅ **Tables verified** - All tables created successfully
4. ✅ **Notifications service ready** - Can now use database

---

## Rollback (If Needed)

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

## Status

✅ **Complete** - All migrations created and applied to MySQL test database

**Production:** Ready to apply PostgreSQL migrations when deploying.

---

**Last Updated:** 2025-12-11

