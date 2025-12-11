# Environment Setup

## Quick Setup

1. **Create `.env` file** in `backend/services/auth-service/`:

```bash
cd backend/services/auth-service
cp .env.example .env  # If .env.example exists
# OR create .env manually
```

2. **Add your Twilio credentials** to `.env`:

```env
# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX
```

3. **Test the connection**:

```bash
npm run test:twilio sms +237693805080
```

## Full .env Template

```env
# Server
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# JWT
JWT_SECRET=change-me-to-secure-random-string
JWT_REFRESH_SECRET=change-me-to-secure-random-string-refresh

# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX

# Test phone number
TEST_PHONE_NUMBER=+237693805080

# Redis
REDIS_URL=redis://localhost:6379

# Database - MySQL (Test)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=faithconnect_test

# Database - PostgreSQL (Production)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DATABASE=faithconnect

# Logging
LOG_LEVEL=info
```

## Security Note

✅ The `.env` file is in `.gitignore` and will **NOT** be committed to git.

⚠️ **Never commit** your Auth Token or any secrets to the repository!

