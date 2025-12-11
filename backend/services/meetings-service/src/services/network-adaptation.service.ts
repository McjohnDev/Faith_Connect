/**
 * Network Adaptation Service
 * Handles network quality monitoring, audio-priority fallback, and reconnection
 */

import { logger } from '../utils/logger';
import { RedisService } from './redis.service';

export interface NetworkQuality {
  userId: string;
  meetingId: string;
  quality: 'excellent' | 'good' | 'poor' | 'bad' | 'very_bad' | 'down';
  rtt: number; // Round-trip time in ms
  packetLoss: number; // Packet loss percentage (0-100)
  bandwidth: number; // Available bandwidth in kbps
  timestamp: Date;
}

export interface ReconnectionState {
  userId: string;
  meetingId: string;
  attemptCount: number;
  lastAttempt: Date;
  nextAttempt: Date;
  maxAttempts: number;
  backoffMultiplier: number;
}

export class NetworkAdaptationService {
  private redisService: RedisService;
  private networkQualityCache: Map<string, NetworkQuality> = new Map(); // userId -> NetworkQuality
  private reconnectionStates: Map<string, ReconnectionState> = new Map(); // userId -> ReconnectionState

  constructor(redisService?: RedisService) {
    this.redisService = redisService || new RedisService();
  }

  /**
   * Report network quality from client
   */
  async reportNetworkQuality(quality: NetworkQuality): Promise<void> {
    try {
      const key = `network:quality:${quality.meetingId}:${quality.userId}`;
      
      // Store in memory cache
      this.networkQualityCache.set(quality.userId, quality);

      // Store in Redis for persistence (if available)
      if (this.redisService.isAvailable()) {
        await this.redisService.setex(
          key,
          300, // 5 minutes TTL
          JSON.stringify(quality)
        );
      }

      logger.debug(`Network quality reported: userId=${quality.userId}, quality=${quality.quality}, rtt=${quality.rtt}ms, packetLoss=${quality.packetLoss}%`);
    } catch (error: any) {
      logger.error('Failed to report network quality:', error);
    }
  }

  /**
   * Get current network quality for a user
   */
  async getNetworkQuality(userId: string, meetingId: string): Promise<NetworkQuality | null> {
    try {
      // Check memory cache first
      const cached = this.networkQualityCache.get(userId);
      if (cached && cached.meetingId === meetingId) {
        return cached;
      }

      // Check Redis
      if (this.redisService.isAvailable()) {
        const key = `network:quality:${meetingId}:${userId}`;
        const data = await this.redisService.get(key);
        if (data) {
          const quality = JSON.parse(data) as NetworkQuality;
          this.networkQualityCache.set(userId, quality);
          return quality;
        }
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to get network quality:', error);
      return null;
    }
  }

  /**
   * Determine if audio-priority mode should be enabled
   */
  shouldEnableAudioPriority(quality: NetworkQuality): boolean {
    // Enable audio priority if:
    // - Quality is poor or worse
    // - Packet loss > 5%
    // - RTT > 500ms
    // - Bandwidth < 100kbps
    return (
      ['poor', 'bad', 'very_bad', 'down'].includes(quality.quality) ||
      quality.packetLoss > 5 ||
      quality.rtt > 500 ||
      quality.bandwidth < 100
    );
  }

  /**
   * Determine recommended bitrate based on network quality
   */
  getRecommendedBitrate(quality: NetworkQuality): number {
    // Bitrate in kbps (100-2000 range)
    switch (quality.quality) {
      case 'excellent':
        return 2000; // 2 Mbps
      case 'good':
        return 1000; // 1 Mbps
      case 'poor':
        return 500; // 500 kbps
      case 'bad':
        return 200; // 200 kbps
      case 'very_bad':
        return 100; // 100 kbps (audio priority)
      case 'down':
        return 0; // No connection
      default:
        return 1000;
    }
  }

  /**
   * Check if packet loss is acceptable (70% tolerance)
   */
  isPacketLossAcceptable(packetLoss: number): boolean {
    return packetLoss <= 70; // 70% tolerance as per requirements
  }

  /**
   * Initialize reconnection state for a user
   */
  initializeReconnection(userId: string, meetingId: string): ReconnectionState {
    const state: ReconnectionState = {
      userId,
      meetingId,
      attemptCount: 0,
      lastAttempt: new Date(),
      nextAttempt: new Date(),
      maxAttempts: 10,
      backoffMultiplier: 1.5
    };

    this.reconnectionStates.set(userId, state);
    return state;
  }

  /**
   * Get reconnection state
   */
  getReconnectionState(userId: string): ReconnectionState | null {
    return this.reconnectionStates.get(userId) || null;
  }

  /**
   * Calculate next reconnection attempt with exponential backoff
   */
  calculateNextReconnectionAttempt(state: ReconnectionState): Date {
    const baseDelay = 1000; // 1 second base delay
    const delay = baseDelay * Math.pow(state.backoffMultiplier, state.attemptCount);
    const maxDelay = 60000; // Max 60 seconds
    const actualDelay = Math.min(delay, maxDelay);

    return new Date(Date.now() + actualDelay);
  }

  /**
   * Record reconnection attempt
   */
  recordReconnectionAttempt(userId: string): ReconnectionState | null {
    const state = this.reconnectionStates.get(userId);
    if (!state) {
      return null;
    }

    state.attemptCount++;
    state.lastAttempt = new Date();
    state.nextAttempt = this.calculateNextReconnectionAttempt(state);

    this.reconnectionStates.set(userId, state);
    logger.info(`Reconnection attempt ${state.attemptCount}/${state.maxAttempts} for userId=${userId}`);

    return state;
  }

  /**
   * Check if reconnection should be attempted
   */
  shouldAttemptReconnection(state: ReconnectionState): boolean {
    if (state.attemptCount >= state.maxAttempts) {
      return false; // Max attempts reached
    }

    if (new Date() < state.nextAttempt) {
      return false; // Backoff period not elapsed
    }

    return true;
  }

  /**
   * Clear reconnection state (on successful reconnect)
   */
  clearReconnectionState(userId: string): void {
    this.reconnectionStates.delete(userId);
    logger.info(`Reconnection state cleared for userId=${userId}`);
  }

  /**
   * Get network adaptation recommendations
   */
  getAdaptationRecommendations(quality: NetworkQuality): {
    enableAudioPriority: boolean;
    recommendedBitrate: number;
    packetLossAcceptable: boolean;
    actions: string[];
  } {
    const enableAudioPriority = this.shouldEnableAudioPriority(quality);
    const recommendedBitrate = this.getRecommendedBitrate(quality);
    const packetLossAcceptable = this.isPacketLossAcceptable(quality.packetLoss);

    const actions: string[] = [];

    if (enableAudioPriority) {
      actions.push('Enable audio-only mode');
      actions.push(`Reduce bitrate to ${recommendedBitrate} kbps`);
    }

    if (quality.packetLoss > 5 && quality.packetLoss <= 70) {
      actions.push('Packet loss detected but within tolerance');
    }

    if (quality.packetLoss > 70) {
      actions.push('High packet loss - connection may be unstable');
    }

    if (quality.rtt > 500) {
      actions.push('High latency detected');
    }

    if (quality.bandwidth < 100) {
      actions.push('Low bandwidth - audio priority recommended');
    }

    return {
      enableAudioPriority,
      recommendedBitrate,
      packetLossAcceptable,
      actions
    };
  }

  /**
   * Clean up old network quality data
   */
  cleanupOldData(maxAge: number = 300000): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [userId, quality] of this.networkQualityCache.entries()) {
      const age = now - quality.timestamp.getTime();
      if (age > maxAge) {
        toDelete.push(userId);
      }
    }

    toDelete.forEach(userId => {
      this.networkQualityCache.delete(userId);
    });

    if (toDelete.length > 0) {
      logger.debug(`Cleaned up ${toDelete.length} old network quality records`);
    }
  }
}

