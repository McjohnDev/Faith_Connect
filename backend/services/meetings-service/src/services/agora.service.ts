/**
 * Agora Service
 * Handles Agora.io integration for audio-only meetings
 */

import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { logger } from '../utils/logger';

export class AgoraService {
  private appId: string;
  private appCertificate: string;

  constructor() {
    this.appId = process.env.AGORA_APP_ID || '';
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE || '';

    if (!this.appId || !this.appCertificate) {
      logger.warn('Agora credentials not configured. Meetings will not work without them.');
    }
  }

  /**
   * Generate Agora RTC token for joining a channel
   */
  generateToken(
    channelName: string,
    uid: number,
    role: 'publisher' | 'subscriber' = 'publisher',
    expireTime: number = 3600 // 1 hour default
  ): string {
    if (!this.appId || !this.appCertificate) {
      // In development, allow graceful degradation
      if (process.env.NODE_ENV === 'development' || process.env.ALLOW_MOCK_AGORA === 'true') {
        logger.warn('Agora not configured - token generation will fail. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE for production.');
        throw new Error('AGORA_NOT_CONFIGURED');
      }
      throw new Error('AGORA_NOT_CONFIGURED');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUid(
      this.appId,
      this.appCertificate,
      channelName,
      uid,
      rtcRole,
      privilegeExpireTime,
      privilegeExpireTime // privilegeExpireTime for both publish and subscribe
    );

    logger.info(`Generated Agora token for channel ${channelName}, uid ${uid}, role ${role}`);
    return token;
  }

  /**
   * Generate token with account (string-based UID)
   */
  generateTokenWithAccount(
    channelName: string,
    account: string,
    role: 'publisher' | 'subscriber' = 'publisher',
    expireTime: number = 3600
  ): string {
    if (!this.appId || !this.appCertificate) {
      throw new Error('AGORA_NOT_CONFIGURED');
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      this.appId,
      this.appCertificate,
      channelName,
      account,
      rtcRole,
      privilegeExpireTime,
      privilegeExpireTime // privilegeExpireTime for both publish and subscribe
    );

    logger.info(`Generated Agora token for channel ${channelName}, account ${account}, role ${role}`);
    return token;
  }

  /**
   * Check if Agora is configured
   */
  isConfigured(): boolean {
    return !!(this.appId && this.appCertificate);
  }

  /**
   * Get Agora App ID
   */
  getAppId(): string {
    return this.appId;
  }
}

