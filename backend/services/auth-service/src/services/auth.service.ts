/**
 * Auth Service
 * Core authentication business logic
 */

import jwt from 'jsonwebtoken';
import { TwilioService, DeliveryMethod } from './twilio.service';
import { RedisService } from './redis.service';
import { DatabaseService } from './database.service';
import { logger } from '../utils/logger';

export class AuthService {
  private twilioService: TwilioService;
  private redisService: RedisService;
  private dbService: DatabaseService;
  private readonly OTP_EXPIRY = 300; // 5 minutes
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'change-me';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-refresh';
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';
  private readonly MAX_DEVICES = 5;

  constructor() {
    this.twilioService = new TwilioService();
    this.redisService = new RedisService();
    this.dbService = new DatabaseService();
  }

  /**
   * Generate OTP
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to phone number via SMS or WhatsApp
   */
  async sendOtp(
    phoneNumber: string,
    deliveryMethod: DeliveryMethod = 'sms',
    _isLogin: boolean = false
  ): Promise<{
    phoneNumber: string;
    expiresIn: number;
    deliveryMethod: DeliveryMethod;
  }> {
    // Check rate limits
    const rateLimitKey = `otp:rate:${phoneNumber}`;
    const attempts = await this.redisService.get(rateLimitKey);
    
    if (attempts && parseInt(attempts) >= 5) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // Generate OTP
    const otp = this.generateOtp();
    const otpKey = `otp:${phoneNumber}`;
    
    // Store OTP in Redis with expiry (include delivery method for tracking)
    await this.redisService.setex(otpKey, this.OTP_EXPIRY, otp);
    await this.redisService.setex(`${otpKey}:method`, this.OTP_EXPIRY, deliveryMethod);
    
    // Increment rate limit counter
    await this.redisService.incr(rateLimitKey);
    await this.redisService.expire(rateLimitKey, 3600); // 1 hour window

    // Create OTP message
    const message = `Your FaithConnect verification code is: ${otp}. Valid for 5 minutes.`;

    // Send OTP via Twilio (SMS or WhatsApp)
    try {
      const result = await this.twilioService.sendOtp(phoneNumber, message, deliveryMethod);
      logger.info(`OTP sent via ${result.method} to ${phoneNumber}`);
      
      return {
        phoneNumber,
        expiresIn: this.OTP_EXPIRY,
        deliveryMethod: result.method // May be different if fallback occurred
      };
    } catch (error) {
      logger.error(`OTP send error (${deliveryMethod}):`, error);
      throw new Error('OTP_SEND_FAILED');
    }
  }

  /**
   * Verify OTP and create/login user
   */
  async verifyOtp(
    phoneNumber: string,
    otp: string,
    guidelinesAccepted: boolean,
    deviceId?: string,
    deviceName?: string,
    deviceType?: string
  ): Promise<{
    user: any;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    // Verify OTP
    const otpKey = `otp:${phoneNumber}`;
    const storedOtp = await this.redisService.get(otpKey);

    if (!storedOtp || storedOtp !== otp) {
      throw new Error('INVALID_OTP');
    }

    // Delete OTP after verification
    await this.redisService.del(otpKey);

    // Check if user exists
    let user = await this.dbService.findUserByPhone(phoneNumber);

    if (!user) {
      // Create new user
      user = await this.dbService.createUser({
        phoneNumber,
        guidelinesAccepted,
        guidelinesAcceptedAt: new Date()
      });
    } else {
      // Update guidelines acceptance if needed
      if (!user.guidelinesAccepted && guidelinesAccepted) {
        await this.dbService.updateUser(user.id, {
          guidelinesAccepted: true,
          guidelinesAcceptedAt: new Date()
        });
      }
    }

    // Track device if provided
    if (deviceId) {
      // Check if this device already exists
      const deviceExists = await this.dbService.deviceExists(user.id, deviceId);
      
      // Only check device count if this is a new device
      if (!deviceExists) {
        const deviceCount = await this.dbService.getUserDeviceCount(user.id);
        if (deviceCount >= this.MAX_DEVICES) {
          throw new Error('MAX_DEVICES_REACHED');
        }
      }

      // Create or update device
      await this.dbService.createOrUpdateDevice(user.id, deviceId, deviceName, deviceType);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, deviceId);

    // Store refresh token
    await this.redisService.setex(
      `refresh:${user.id}:${tokens.refreshToken}`,
      7 * 24 * 60 * 60, // 7 days
      '1'
    );

    return {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, deviceId?: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = jwt.sign(
      { userId, type: 'access', deviceId },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh', deviceId },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      
      // Check if refresh token is blacklisted
      const isBlacklisted = await this.redisService.get(
        `refresh:${decoded.userId}:${refreshToken}`
      );
      
      if (!isBlacklisted) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Generate new token pair (rotation)
      const tokens = await this.generateTokens(decoded.userId, decoded.deviceId);

      // Delete old refresh token
      await this.redisService.del(`refresh:${decoded.userId}:${refreshToken}`);

      // Store new refresh token
      await this.redisService.setex(
        `refresh:${decoded.userId}:${tokens.refreshToken}`,
        7 * 24 * 60 * 60,
        '1'
      );

      return tokens;
    } catch (error) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Revoke tokens on logout
   */
  async revokeTokens(userId: string, refreshToken: string): Promise<void> {
    // Blacklist refresh token
    await this.redisService.del(`refresh:${userId}:${refreshToken}`);
    
    // Optionally blacklist access token (requires token storage)
    logger.info(`Tokens revoked for user ${userId}`);
  }
}

