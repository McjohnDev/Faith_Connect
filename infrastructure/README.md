# Local Infrastructure (Docker Compose)

Run MySQL (dev/test), PostgreSQL (prod parity), Redis, and the Auth + Meetings services locally via Docker.

## Start

```bash
docker compose -f infrastructure/docker-compose.local.yml up -d --build
```

Services:
- MySQL: `localhost:3306` (DB: `faithconnect_test`, empty root password via `MYSQL_ALLOW_EMPTY_PASSWORD=yes`)
- PostgreSQL: `localhost:5432` (user/password/db: `postgres/postgres/faithconnect`)
- Redis: `localhost:6379`
- Auth Service: `http://localhost:3001` (uses `backend/services/auth-service/env.docker.example`)
- Meetings Service: `http://localhost:3002` (uses `backend/services/meetings-service/env.docker.example`)

## Stop

```bash
docker compose -f infrastructure/docker-compose.local.yml down
```

## Run Migrations

From `backend/shared/database`:

```bash
# MySQL (default dev)
npm install
npm run migrate:mysql

# PostgreSQL
npm run migrate:postgres
```

