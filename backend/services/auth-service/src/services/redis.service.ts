/**
 * Redis Service
 * Cache and session management
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class RedisService {
  private client: RedisClientType;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl
    }) as RedisClientType;

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
    });

    // Connect in development (in production, connection is managed by infrastructure)
    if (process.env.NODE_ENV !== 'production') {
      this.client.connect().catch(err => {
        logger.warn('Redis connection failed:', err);
      });
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    try {
      await this.client.setEx(key, seconds, value);
    } catch (error) {
      logger.error('Redis setex error:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Redis incr error:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis expire error:', error);
    }
  }
}

