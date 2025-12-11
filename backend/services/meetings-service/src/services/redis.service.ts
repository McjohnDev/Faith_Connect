/**
 * Redis Service for Meetings
 * Handles Redis connections and operations
 */

import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = createClient({
      url: redisUrl
    }) as RedisClientType;

    this.client.on('error', (err) => {
      logger.error('Redis error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('Redis connected for meetings service');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      logger.warn('Redis disconnected');
      this.isConnected = false;
    });

    // Connect in development (in production, connection is managed by infrastructure)
    if (process.env.NODE_ENV !== 'production') {
      this.client.connect().catch(err => {
        logger.warn('Redis connection failed (will use in-memory fallback):', err.message);
      });
    }
  }

  /**
   * Get value from Redis
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      return null;
    }
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  /**
   * Set value in Redis with expiration
   */
  async setex(key: string, seconds: number, value: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }
    try {
      await this.client.setEx(key, seconds, value);
      return true;
    } catch (error) {
      logger.error('Redis setex error:', error);
      return false;
    }
  }

  /**
   * Set value in Redis (no expiration)
   */
  async set(key: string, value: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }
    try {
      await this.client.set(key, value);
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  }

  /**
   * Delete key from Redis
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error);
      return false;
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }
    try {
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', error);
      return false;
    }
  }

  /**
   * Check if Redis is connected
   */
  isAvailable(): boolean {
    return this.isConnected;
  }

  /**
   * Get Redis client (for advanced usage)
   */
  getClient(): RedisClientType {
    return this.client;
  }
}

