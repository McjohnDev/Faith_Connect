import { BackgroundMusicState } from '../types/meeting.types';
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';

/**
 * Redis-backed music state repository.
 * Falls back to in-memory if Redis is not available.
 */
export class MusicStateRepositoryRedis {
  private redisService: RedisService;
  private memoryFallback: Map<string, BackgroundMusicState> = new Map();
  private readonly KEY_PREFIX = 'meeting:music:';
  private readonly TTL_SECONDS = 24 * 60 * 60; // 24 hours

  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }

  private getKey(meetingId: string): string {
    return `${this.KEY_PREFIX}${meetingId}`;
  }

  async set(meetingId: string, state: BackgroundMusicState): Promise<void> {
    const key = this.getKey(meetingId);
    const value = JSON.stringify(state);

    if (this.redisService.isAvailable()) {
      const success = await this.redisService.setex(key, this.TTL_SECONDS, value);
      if (success) {
        logger.debug(`Music state stored in Redis for meeting ${meetingId}`);
        return;
      }
    }

    // Fallback to memory
    this.memoryFallback.set(meetingId, state);
    logger.debug(`Music state stored in memory (Redis unavailable) for meeting ${meetingId}`);
  }

  async get(meetingId: string): Promise<BackgroundMusicState | null> {
    const key = this.getKey(meetingId);

    if (this.redisService.isAvailable()) {
      const value = await this.redisService.get(key);
      if (value) {
        try {
          return JSON.parse(value) as BackgroundMusicState;
        } catch (error) {
          logger.error('Failed to parse music state from Redis:', error);
        }
      }
    }

    // Fallback to memory
    return this.memoryFallback.get(meetingId) || null;
  }

  async delete(meetingId: string): Promise<void> {
    const key = this.getKey(meetingId);

    if (this.redisService.isAvailable()) {
      await this.redisService.del(key);
    }

    // Also clear memory fallback
    this.memoryFallback.delete(meetingId);
  }

  async updateVolume(meetingId: string, volume: number): Promise<BackgroundMusicState | null> {
    const current = await this.get(meetingId);
    if (!current) return null;

    const updated: BackgroundMusicState = { ...current, volume };
    await this.set(meetingId, updated);
    return updated;
  }
}

