# Database Migrations

Migration system supporting both MySQL (test) and PostgreSQL (production).

## Structure

```
migrations/
  ├── 001_create_users_table.sql          # MySQL version
  └── 001_create_users_table.postgresql.sql # PostgreSQL version
```

## Usage

### Run Migrations

```bash
# Auto-detect based on NODE_ENV
npm run migrate

# Force MySQL (test)
npm run migrate:mysql

# Force PostgreSQL (prod)
npm run migrate:postgres
```

### Migration Files

- **MySQL**: `001_name.sql`
- **PostgreSQL**: `001_name.postgresql.sql`

Both versions are kept in sync.

## Tables Created

1. **users** - User accounts
2. **devices** - Device tracking (for device cap)
3. **sessions** - Refresh token storage
4. **schema_migrations** - Migration tracking

## Environment Variables

```env
# MySQL (Test)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=faithconnect_test

# PostgreSQL (Production)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=
POSTGRES_DATABASE=faithconnect
```

