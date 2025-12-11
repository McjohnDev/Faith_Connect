/**
 * Notification Service
 * Core business logic for notifications
 */

import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { DatabaseService } from './database.service';
import { PushNotificationService } from './push-notification.service';
import { QuietHoursService } from './quiet-hours.service';
import {
  Notification,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationPreferences,
  DeviceToken,
  CreateNotificationDto,
  UpdatePreferencesDto
} from '../types/notification.types';

export class NotificationService {
  private dbService: DatabaseService;
  private pushService: PushNotificationService;
  private quietHoursService: QuietHoursService;

  constructor() {
    this.dbService = new DatabaseService();
    this.pushService = new PushNotificationService();
    this.quietHoursService = new QuietHoursService();
  }

  /**
   * Create and send notification
   */
  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    // Get user preferences
    const preferences = await this.dbService.getNotificationPreferences(dto.userId);
    
    // Check if notification type is enabled
    if (!this.isNotificationTypeEnabled(preferences, dto.type)) {
      logger.debug(`Notification type ${dto.type} disabled for userId=${dto.userId}`);
      throw new Error('NOTIFICATION_TYPE_DISABLED');
    }

    // Determine priority
    const priority = dto.priority || this.getDefaultPriority(dto.type);

    // Check quiet hours
    if (preferences && !this.quietHoursService.shouldSendNotification(preferences, priority)) {
      // Schedule for after quiet hours
      const scheduledFor = this.quietHoursService.getNextAvailableTime(preferences);
      logger.info(`Notification scheduled for after quiet hours: ${scheduledFor.toISOString()}`);
      
      return await this.dbService.createNotification({
        ...dto,
        priority,
        scheduledFor,
        channels: dto.channels || [NotificationChannel.IN_APP]
      });
    }

    // Create notification
    const notification = await this.dbService.createNotification({
      ...dto,
      priority,
      channels: dto.channels || [NotificationChannel.IN_APP, NotificationChannel.PUSH]
    });

    // Send immediately if not scheduled
    if (!dto.scheduledFor) {
      await this.sendNotification(notification);
    }

    return notification;
  }

  /**
   * Send notification to user
   */
  async sendNotification(notification: Notification): Promise<void> {
    try {
      // Get user's device tokens
      const deviceTokens = await this.dbService.getDeviceTokens(notification.userId);

      // Send push notifications if enabled
      if (notification.channels.includes(NotificationChannel.PUSH) && deviceTokens.length > 0) {
        await this.pushService.sendToDevices(deviceTokens, notification);
      }

      // Mark as sent
      await this.dbService.updateNotification(notification.id, {
        sentAt: new Date()
      });

      logger.info(`Notification sent: id=${notification.id}, userId=${notification.userId}, type=${notification.type}`);
    } catch (error: any) {
      logger.error(`Failed to send notification: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send meeting reminder
   */
  async sendMeetingReminder(
    userId: string,
    meetingId: string,
    meetingTitle: string,
    scheduledStart: Date
  ): Promise<Notification> {
    const minutesUntilStart = Math.floor((scheduledStart.getTime() - Date.now()) / 60000);
    const timeText = minutesUntilStart < 60 
      ? `in ${minutesUntilStart} minutes`
      : `in ${Math.floor(minutesUntilStart / 60)} hours`;

    return await this.createNotification({
      userId,
      type: NotificationType.MEETING_REMINDER,
      title: 'Meeting Reminder',
      body: `${meetingTitle} starts ${timeText}`,
      data: {
        meetingId,
        type: 'meeting_reminder',
        scheduledStart: scheduledStart.toISOString()
      },
      priority: NotificationPriority.NORMAL
    });
  }

  /**
   * Send "meeting started" notification
   */
  async sendMeetingStarted(
    userId: string,
    meetingId: string,
    meetingTitle: string
  ): Promise<Notification> {
    return await this.createNotification({
      userId,
      type: NotificationType.MEETING_STARTED,
      title: 'Meeting Started',
      body: `${meetingTitle} has started`,
      data: {
        meetingId,
        type: 'meeting_started'
      },
      priority: NotificationPriority.HIGH
    });
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences | null> {
    return await this.dbService.getNotificationPreferences(userId);
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<NotificationPreferences> {
    return await this.dbService.updateNotificationPreferences(userId, dto);
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId?: string,
    deviceName?: string
  ): Promise<DeviceToken> {
    return await this.dbService.upsertDeviceToken(userId, token, platform, deviceId, deviceName);
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(userId: string, token: string): Promise<void> {
    await this.dbService.deleteDeviceToken(userId, token);
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    filters?: {
      type?: NotificationType;
      read?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]> {
    return await this.dbService.getUserNotifications(userId, filters);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.dbService.updateNotification(notificationId, {
      readAt: new Date()
    });
  }

  /**
   * Check if notification type is enabled in preferences
   */
  private isNotificationTypeEnabled(
    preferences: NotificationPreferences | null,
    type: NotificationType
  ): boolean {
    if (!preferences) {
      return true; // Default to enabled if no preferences
    }

    switch (type) {
      case NotificationType.MEETING_REMINDER:
        return preferences.meetingReminders;
      case NotificationType.MEETING_STARTED:
        return preferences.meetingStarted;
      case NotificationType.PRAYER_REQUEST:
        return preferences.prayerRequests;
      case NotificationType.MESSAGE:
        return preferences.messages;
      case NotificationType.FRIEND_REQUEST:
        return preferences.friendRequests;
      case NotificationType.GROUP_INVITE:
        return preferences.groupInvites;
      default:
        return true;
    }
  }

  /**
   * Get default priority for notification type
   */
  private getDefaultPriority(type: NotificationType): NotificationPriority {
    switch (type) {
      case NotificationType.MEETING_STARTED:
        return NotificationPriority.HIGH;
      case NotificationType.MEETING_REMINDER:
        return NotificationPriority.NORMAL;
      case NotificationType.PRAYER_REQUEST:
        return NotificationPriority.NORMAL;
      case NotificationType.MESSAGE:
        return NotificationPriority.NORMAL;
      case NotificationType.FRIEND_REQUEST:
        return NotificationPriority.LOW;
      case NotificationType.GROUP_INVITE:
        return NotificationPriority.LOW;
      default:
        return NotificationPriority.NORMAL;
    }
  }
}

