/**
 * Database Service
 * User data persistence
 * Supports both MySQL (test) and PostgreSQL (prod)
 */

import { Pool, createPool } from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import { logger } from '../utils/logger';

interface User {
  id: string;
  phoneNumber: string;
  guidelinesAccepted: boolean;
  guidelinesAcceptedAt: Date;
  createdAt: Date;
}

export class DatabaseService {
  private mysqlPool?: Pool;
  private pgPool?: PgPool;
  private dbType: 'mysql' | 'postgresql';

  constructor() {
    // Determine which database to use based on environment
    this.dbType = process.env.NODE_ENV === 'production' ? 'postgresql' : 'mysql';

    if (this.dbType === 'mysql') {
      this.mysqlPool = createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'faithconnect_test',
        waitForConnections: true,
        connectionLimit: 10
      });
      logger.info('MySQL connection pool created');
    } else {
      this.pgPool = new PgPool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        database: process.env.POSTGRES_DATABASE || 'faithconnect',
        max: 20
      });
      logger.info('PostgreSQL connection pool created');
    }
  }

  async findUserByPhone(phoneNumber: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE phone_number = ?';
    
    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [phoneNumber]);
      const users = rows as any[];
      return users.length > 0 ? this.mapToUser(users[0]) : null;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(
        'SELECT * FROM users WHERE phone_number = $1',
        [phoneNumber]
      );
      return result.rows.length > 0 ? this.mapToUser(result.rows[0]) : null;
    }
    
    return null;
  }

  async createUser(data: {
    phoneNumber: string;
    guidelinesAccepted: boolean;
    guidelinesAcceptedAt: Date;
  }): Promise<User> {
    const { randomUUID } = require('crypto');
    const id = randomUUID();
    const now = new Date();

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(
        `INSERT INTO users (id, phone_number, guidelines_accepted, guidelines_accepted_at, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, data.phoneNumber, data.guidelinesAccepted, data.guidelinesAcceptedAt, now]
      );
    } else if (this.pgPool) {
      await this.pgPool.query(
        `INSERT INTO users (id, phone_number, guidelines_accepted, guidelines_accepted_at, created_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [id, data.phoneNumber, data.guidelinesAccepted, data.guidelinesAcceptedAt, now]
      );
    }

    return {
      id,
      phoneNumber: data.phoneNumber,
      guidelinesAccepted: data.guidelinesAccepted,
      guidelinesAcceptedAt: data.guidelinesAcceptedAt,
      createdAt: now
    };
  }

  async updateUser(userId: string, _data: Partial<User>): Promise<void> {
    // Implementation for user updates
    logger.info(`Updating user ${userId}`);
  }

  async getUserDeviceCount(userId: string): Promise<number> {
    const query = this.dbType === 'mysql'
      ? 'SELECT COUNT(*) as count FROM devices WHERE user_id = ?'
      : 'SELECT COUNT(*) as count FROM devices WHERE user_id = $1';

    try {
      if (this.dbType === 'mysql' && this.mysqlPool) {
        const [rows] = await this.mysqlPool.execute(query, [userId]);
        return (rows as any[])[0].count;
      } else if (this.pgPool) {
        const result = await this.pgPool.query(query, [userId]);
        return parseInt(result.rows[0].count);
      }
      return 0;
    } catch (error) {
      logger.error('Get device count error:', error);
      return 0;
    }
  }

  async deviceExists(userId: string, deviceId: string): Promise<boolean> {
    const query = this.dbType === 'mysql'
      ? 'SELECT COUNT(*) as count FROM devices WHERE user_id = ? AND device_id = ?'
      : 'SELECT COUNT(*) as count FROM devices WHERE user_id = $1 AND device_id = $2';

    try {
      if (this.dbType === 'mysql' && this.mysqlPool) {
        const [rows] = await this.mysqlPool.execute(query, [userId, deviceId]);
        return (rows as any[])[0].count > 0;
      } else if (this.pgPool) {
        const result = await this.pgPool.query(query, [userId, deviceId]);
        return parseInt(result.rows[0].count) > 0;
      }
      return false;
    } catch (error) {
      logger.error('Check device exists error:', error);
      return false;
    }
  }

  async createOrUpdateDevice(
    userId: string,
    deviceId: string,
    deviceName?: string,
    deviceType?: string
  ): Promise<void> {
    const query = this.dbType === 'mysql'
      ? `INSERT INTO devices (id, user_id, device_id, device_name, device_type, last_used_at, created_at)
         VALUES (UUID(), ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           device_name = VALUES(device_name),
           device_type = VALUES(device_type),
           last_used_at = NOW()`
      : `INSERT INTO devices (id, user_id, device_id, device_name, device_type, last_used_at, created_at)
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, device_id) DO UPDATE SET
           device_name = EXCLUDED.device_name,
           device_type = EXCLUDED.device_type,
           last_used_at = CURRENT_TIMESTAMP`;

    try {
      if (this.dbType === 'mysql' && this.mysqlPool) {
        await this.mysqlPool.execute(query, [userId, deviceId, deviceName || null, deviceType || null]);
      } else if (this.pgPool) {
        await this.pgPool.query(query, [userId, deviceId, deviceName || null, deviceType || null]);
      }
      logger.info(`Device tracked: ${deviceId} for user ${userId}`);
    } catch (error) {
      logger.error('Create/update device error:', error);
      throw error;
    }
  }

  private mapToUser(row: any): User {
    return {
      id: row.id,
      phoneNumber: row.phone_number || row.phoneNumber,
      guidelinesAccepted: row.guidelines_accepted || row.guidelinesAccepted,
      guidelinesAcceptedAt: new Date(row.guidelines_accepted_at || row.guidelinesAcceptedAt),
      createdAt: new Date(row.created_at || row.createdAt)
    };
  }
}

