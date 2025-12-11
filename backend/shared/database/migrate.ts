/**
 * Database Migration Runner
 * Supports both MySQL (test) and PostgreSQL (prod)
 */

import { Pool, createPool } from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'migration' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

interface Migration {
  version: string;
  name: string;
  sql: string;
}

export class MigrationRunner {
  private mysqlPool?: Pool;
  private pgPool?: PgPool;
  private dbType: 'mysql' | 'postgresql';
  private migrationsPath: string;

  constructor() {
    this.dbType = process.env.NODE_ENV === 'production' ? 'postgresql' : 'mysql';
    this.migrationsPath = join(__dirname, 'migrations');

    if (this.dbType === 'mysql') {
      this.mysqlPool = createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'faithconnect_test',
        multipleStatements: true
      });
    } else {
      this.pgPool = new PgPool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        database: process.env.POSTGRES_DATABASE || 'faithconnect'
      });
    }
  }

  /**
   * Create migrations table to track applied migrations
   */
  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = this.dbType === 'mysql'
      ? `CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(createTableSQL);
    } else if (this.pgPool) {
      await this.pgPool.query(createTableSQL);
    }
  }

  /**
   * Get list of applied migrations
   */
  private async getAppliedMigrations(): Promise<string[]> {
    await this.createMigrationsTable();

    const query = 'SELECT version FROM schema_migrations ORDER BY version';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query);
      return (rows as any[]).map(row => row.version);
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query);
      return result.rows.map(row => row.version);
    }

    return [];
  }

  /**
   * Load migration files
   */
  private loadMigrations(): Migration[] {
    const files = readdirSync(this.migrationsPath)
      .filter(file => {
        if (this.dbType === 'postgresql') {
          return file.endsWith('.postgresql.sql');
        } else {
          return file.endsWith('.sql') && !file.endsWith('.postgresql.sql');
        }
      })
      .sort();

    return files.map(file => {
      const version = file.split('_')[0];
      const name = file.replace(/^\d+_/, '').replace(/\.(sql|postgresql\.sql)$/, '');
      const sql = readFileSync(join(this.migrationsPath, file), 'utf8');
      return { version, name, sql };
    });
  }

  /**
   * Run a single migration
   */
  private async runMigration(migration: Migration): Promise<void> {
    logger.info(`Running migration ${migration.version}: ${migration.name}`);

    try {
      if (this.dbType === 'mysql' && this.mysqlPool) {
        await this.mysqlPool.query(migration.sql);
      } else if (this.pgPool) {
        await this.pgPool.query(migration.sql);
      }

      // Record migration
      const recordSQL = this.dbType === 'mysql'
        ? 'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
        : 'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)';

      if (this.dbType === 'mysql' && this.mysqlPool) {
        await this.mysqlPool.execute(recordSQL, [migration.version, migration.name]);
      } else if (this.pgPool) {
        await this.pgPool.query(recordSQL, [migration.version, migration.name]);
      }

      logger.info(`✅ Migration ${migration.version} applied successfully`);
    } catch (error: any) {
      logger.error(`❌ Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async migrate(): Promise<void> {
    logger.info(`Starting migrations for ${this.dbType}...`);

    const applied = await this.getAppliedMigrations();
    const migrations = this.loadMigrations();
    const pending = migrations.filter(m => !applied.includes(m.version));

    if (pending.length === 0) {
      logger.info('✅ No pending migrations');
      return;
    }

    logger.info(`Found ${pending.length} pending migration(s)`);

    for (const migration of pending) {
      await this.runMigration(migration);
    }

    logger.info(`✅ All migrations completed`);
  }

  /**
   * Close database connections
   */
  async close(): Promise<void> {
    if (this.mysqlPool) {
      await this.mysqlPool.end();
    }
    if (this.pgPool) {
      await this.pgPool.end();
    }
  }
}

// CLI runner
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.migrate()
    .then(() => runner.close())
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}

