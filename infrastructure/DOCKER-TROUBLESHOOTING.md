# Docker Troubleshooting Guide

## Common Issues on Windows

### Issue: "unable to connect to Docker daemon"

**Symptoms:**
```
error during connect: in the default daemon configuration on Windows, 
the docker client must be run with elevated privileges to connect
```

**Solution:**

1. **Start Docker Desktop**
   - Open Docker Desktop application
   - Wait for it to fully start (whale icon in system tray should be steady)
   - Verify it's running: `docker ps` should work without errors

2. **Run PowerShell as Administrator** (if needed)
   - Right-click PowerShell → "Run as Administrator"
   - Navigate to project: `cd D:\Faith_Connect\infrastructure`
   - Run: `docker compose -f docker-compose.local.yml up -d`

3. **Check Docker Status**
   ```powershell
   docker version
   docker ps
   ```

### Alternative: Run Services Locally (Without Docker for Services)

If you prefer to run the Node.js services locally and only use Docker for databases:

1. **Start only databases:**
   ```powershell
   cd infrastructure
   docker compose -f docker-compose.local.yml up -d mysql postgres redis
   ```

2. **Run services locally:**
   ```powershell
   # Terminal 1 - Auth Service
   cd backend/services/auth-service
   npm install
   npm run dev

   # Terminal 2 - Meetings Service
   cd backend/services/meetings-service
   npm install
   npm run dev
   ```

3. **Update environment variables** to use `localhost` instead of service names:
   - `MYSQL_HOST=localhost`
   - `POSTGRES_HOST=localhost`
   - `REDIS_URL=redis://localhost:6379`

## Verify Docker is Running

```powershell
# Check Docker daemon
docker info

# List running containers
docker ps

# Check Docker Compose version
docker compose version
```

## Start All Services with Docker

Once Docker Desktop is running:

```powershell
cd infrastructure
docker compose -f docker-compose.local.yml up -d --build
```

## Stop All Services

```powershell
cd infrastructure
docker compose -f docker-compose.local.yml down
```

## View Logs

```powershell
# All services
docker compose -f docker-compose.local.yml logs -f

# Specific service
docker compose -f docker-compose.local.yml logs -f auth-service
docker compose -f docker-compose.local.yml logs -f meetings-service
```

