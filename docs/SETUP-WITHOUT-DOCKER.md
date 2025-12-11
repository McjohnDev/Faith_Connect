# Setup Guide - Running Without Docker

This guide helps you set up FaithConnect services locally without using Docker for the Node.js services.

## Option 1: Docker for Databases Only (Recommended)

Run MySQL, PostgreSQL, and Redis in Docker, but run the Node.js services locally.

### Step 1: Start Databases in Docker

```powershell
cd infrastructure
docker compose -f docker-compose.local.yml up -d mysql postgres redis
```

This starts:
- MySQL on `localhost:3306` (database: `faithconnect_test`)
- PostgreSQL on `localhost:5432` (database: `faithconnect`)
- Redis on `localhost:6379`

### Step 2: Install Dependencies

```powershell
# Database migrations
cd backend/shared/database
npm install

# Auth service
cd ../../services/auth-service
npm install

# Meetings service
cd ../meetings-service
npm install
```

### Step 3: Set Up Environment Variables

**Auth Service** (`backend/services/auth-service/.env`):
```env
PORT=3001
NODE_ENV=development

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
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=faithconnect

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Twilio (get from Twilio console)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid

# Logging
LOG_LEVEL=info
```

**Meetings Service** (`backend/services/meetings-service/.env`):
```env
PORT=3002
NODE_ENV=development

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
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=faithconnect

# Agora (get from Agora console)
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_app_certificate
ALLOW_MOCK_AGORA=true  # Set to false when you have real credentials

# JWT
JWT_SECRET=your-secret-key-change-in-production

# Logging
LOG_LEVEL=info
```

### Step 4: Run Database Migrations

```powershell
cd backend/shared/database

# For MySQL (test/development)
npm run migrate:mysql

# For PostgreSQL (production)
npm run migrate:postgres
```

### Step 5: Start Services

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

## Option 2: Full Local Setup (No Docker)

If you prefer not to use Docker at all, install MySQL, PostgreSQL, and Redis locally.

### Install MySQL

**Windows:**
- Download from https://dev.mysql.com/downloads/installer/
- Or use Chocolatey: `choco install mysql`

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Linux:**
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

### Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Or use Chocolatey: `choco install postgresql`

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql
sudo systemctl start postgresql
```

### Install Redis

**Windows:**
- Use WSL2 or download from https://github.com/microsoftarchive/redis/releases
- Or use Docker: `docker run -d -p 6379:6379 redis:7`

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Create Databases

**MySQL:**
```sql
CREATE DATABASE IF NOT EXISTS faithconnect_test;
```

**PostgreSQL:**
```sql
CREATE DATABASE faithconnect;
```

Then follow Steps 2-5 from Option 1 above.

## Verify Setup

### Check Database Connections

```powershell
# MySQL
mysql -u root -h localhost -e "SHOW DATABASES;"

# PostgreSQL
psql -U postgres -h localhost -c "\l"
```

### Check Services

```powershell
# Auth Service
curl http://localhost:3001/health

# Meetings Service
curl http://localhost:3002/health

# Metrics
curl http://localhost:3001/metrics
curl http://localhost:3002/metrics
```

## Troubleshooting

### Database Connection Errors

- **MySQL**: Ensure MySQL is running and credentials are correct
- **PostgreSQL**: Ensure PostgreSQL is running and password is set
- **Redis**: Ensure Redis is running on port 6379

### Port Already in Use

If ports 3001, 3002, 3306, 5432, or 6379 are in use:
- Change ports in `.env` files
- Or stop the conflicting service

### Migration Errors

- Ensure databases exist (run `npm run setup` in `backend/shared/database`)
- Check database credentials in `.env`
- Ensure you have CREATE TABLE permissions

## Next Steps

After setup is complete:
1. Test auth service: Register a phone number
2. Test meetings service: Create a meeting
3. Check logs for any errors
4. Review metrics endpoints

