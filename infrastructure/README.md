# Local Infrastructure (Docker Compose)

Run MySQL (dev/test), PostgreSQL (prod parity), and Redis locally.

## Start

```bash
docker compose -f infrastructure/docker-compose.local.yml up -d
```

Services:
- MySQL: `localhost:3306` (DB: `faithconnect_test`, empty root password via `MYSQL_ALLOW_EMPTY_PASSWORD=yes`)
- PostgreSQL: `localhost:5432` (user/password/db: `postgres/postgres/faithconnect`)
- Redis: `localhost:6379`

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

