# Database Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
# From auth-service directory
cd ../../shared/database
npm install
```

### 2. Configure Environment

Create `.env` in `backend/services/auth-service/`:

```env
# MySQL (Test/Development)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=faithconnect_test

# PostgreSQL (Production)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=faithconnect

# Node Environment
NODE_ENV=development  # or 'production' for PostgreSQL
```

### 3. Create Database

**MySQL:**
```sql
CREATE DATABASE faithconnect_test;
```

**PostgreSQL:**
```sql
CREATE DATABASE faithconnect;
```

### 4. Run Migrations

```bash
# From auth-service directory
npm run migrate          # Auto-detect based on NODE_ENV
npm run migrate:mysql    # Force MySQL
npm run migrate:postgres # Force PostgreSQL
```

Or directly:
```bash
cd ../../shared/database
npm run migrate
```

## Migration System

### How It Works

1. **Auto-detection**: Uses `NODE_ENV` to choose database
   - `development` → MySQL
   - `production` → PostgreSQL

2. **Version tracking**: Creates `schema_migrations` table to track applied migrations

3. **Idempotent**: Safe to run multiple times (uses `IF NOT EXISTS`)

### Migration Files

- **MySQL**: `backend/shared/database/migrations/001_create_users_table.sql`
- **PostgreSQL**: `backend/shared/database/migrations/001_create_users_table.postgresql.sql`

## Tables Created

### `users`
- User accounts with phone-based authentication
- Fields: `id`, `phone_number`, `email`, `username`, `display_name`, etc.

### `devices`
- Device tracking for device cap (max 5 devices per user)
- Fields: `id`, `user_id`, `device_id`, `device_type`, `fcm_token`, etc.

### `sessions`
- Refresh token storage
- Fields: `id`, `user_id`, `refresh_token`, `device_id`, `expires_at`, etc.

## Troubleshooting

### Connection Errors

**MySQL:**
```bash
# Check MySQL is running
mysql -u root -p

# Test connection
mysql -h localhost -u root -p -e "SHOW DATABASES;"
```

**PostgreSQL:**
```bash
# Check PostgreSQL is running
psql -U postgres

# Test connection
psql -h localhost -U postgres -d faithconnect -c "SELECT 1;"
```

### Migration Already Applied

Migrations are tracked in `schema_migrations` table. If you need to re-run:

```sql
-- Remove migration record (be careful!)
DELETE FROM schema_migrations WHERE version = '001';
```

### Reset Database

**MySQL:**
```sql
DROP DATABASE faithconnect_test;
CREATE DATABASE faithconnect_test;
```

**PostgreSQL:**
```sql
DROP DATABASE faithconnect;
CREATE DATABASE faithconnect;
```

Then run migrations again.

## Next Steps

After migrations:
1. ✅ Database tables created
2. ✅ Auth Service can create users
3. ✅ Device tracking ready
4. ✅ Session management ready

Test the full flow:
```bash
# Start auth service
npm run dev

# Test registration
curl -X POST http://localhost:3001/api/v1/auth/register-phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "age": 18, "deliveryMethod": "sms"}'
```

