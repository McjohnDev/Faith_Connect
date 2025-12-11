# Quick Start Guide - Local Development (No Docker)

## Prerequisites

- Node.js 18+ installed
- MySQL installed (you have Laragon)
- Redis (optional for now, can use Docker just for Redis if needed)

## Step 1: Start MySQL

**Using Laragon:**
1. Open Laragon
2. Click "Start All" or just start MySQL
3. Wait for MySQL to show as running (green indicator)

**Or manually:**
```powershell
# Check if MySQL service is running
Get-Service | Where-Object {$_.Name -like "*mysql*"}

# Start MySQL service (adjust service name if different)
net start MySQL80
```

## Step 2: Run Setup Script

```powershell
# From project root (D:\Faith_Connect)
.\scripts\setup-local.ps1
```

This script will:
- ✅ Install all dependencies
- ✅ Check if MySQL is running
- ✅ Create the database
- ✅ Run migrations (create users, devices, sessions tables)

## Step 3: Create Environment Files

### Auth Service

Create `backend/services/auth-service/.env`:

```env
PORT=3001
NODE_ENV=development

# MySQL (Laragon default)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=faithconnect_test

# PostgreSQL (optional for now)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=faithconnect

# Redis (optional - can use Docker just for Redis)
REDIS_URL=redis://localhost:6379

# JWT Secrets (change in production!)
JWT_SECRET=dev-secret-key-change-me
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-me

# Twilio (get from Twilio console - optional for testing)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WHATSAPP_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=

LOG_LEVEL=info
```

### Meetings Service

Create `backend/services/meetings-service/.env`:

```env
PORT=3002
NODE_ENV=development

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=faithconnect_test

# PostgreSQL (optional)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=faithconnect

# Agora (optional - uses mock tokens if not set)
AGORA_APP_ID=
AGORA_APP_CERTIFICATE=
ALLOW_MOCK_AGORA=true

# JWT
JWT_SECRET=dev-secret-key-change-me

LOG_LEVEL=info
```

## Step 4: Start Services

**Option 1: Use the start script (opens in new windows):**
```powershell
.\scripts\start-services.ps1
```

**Option 2: Manual start (two terminals):**

**Terminal 1 - Auth Service:**
```powershell
cd backend/services/auth-service
npm run dev
```

**Terminal 2 - Meetings Service:**
```powershell
cd backend/services/meetings-service
npm run dev
```

## Step 5: Verify Services

```powershell
# Health checks
curl http://localhost:3001/health
curl http://localhost:3002/health

# Metrics
curl http://localhost:3001/metrics
curl http://localhost:3002/metrics
```

## Optional: Redis (for OTP storage)

If you need Redis for the auth service:

**Option 1: Docker (just Redis):**
```powershell
docker run -d -p 6379:6379 --name faithconnect-redis redis:7
```

**Option 2: Install Redis locally:**
- Windows: Use WSL2 or download from GitHub
- Or use Docker just for Redis (recommended)

## Troubleshooting

### MySQL Connection Error

- Ensure MySQL is running in Laragon
- Check credentials in `.env` file
- Verify database exists: `mysql -u root -e "SHOW DATABASES;"`

### Port Already in Use

- Change `PORT` in `.env` files
- Or stop the conflicting service

### Migration Errors

- Ensure MySQL is running
- Check database credentials
- Run `npm run setup` in `backend/shared/database` first

## Next Steps

1. Test auth service: Register a phone number
2. Test meetings service: Create a meeting
3. Check logs for any errors
4. Review API documentation

## Need Help?

- See `docs/SETUP-WITHOUT-DOCKER.md` for detailed instructions
- See `docs/IMPLEMENTATION-PROGRESS.md` for current progress
- See `TROUBLESHOOTING.md` for common issues

