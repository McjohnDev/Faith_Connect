/**
 * Push Notification Service
 * Handles FCM (Android) and APNS (iOS) push notifications
 */

import admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { Notification, NotificationChannel, DeviceToken } from '../types/notification.types';

export class PushNotificationService {
  private fcmApp?: admin.app.App;
  private isConfigured: boolean = false;

  constructor() {
    // Initialize FCM if credentials are available
    const serviceAccount = process.env.FCM_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccount) {
      try {
        const serviceAccountJson = JSON.parse(serviceAccount);
        this.fcmApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccountJson)
        });
        this.isConfigured = true;
        logger.info('FCM (Firebase Cloud Messaging) initialized');
      } catch (error: any) {
        logger.warn('Failed to initialize FCM:', error.message);
        logger.warn('Push notifications will use stub mode');
      }
    } else {
      logger.warn('FCM_SERVICE_ACCOUNT_KEY not configured. Push notifications will use stub mode.');
    }
  }

  /**
   * Send push notification to a device
   */
  async sendToDevice(
    deviceToken: DeviceToken,
    notification: Notification
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.fcmApp) {
      logger.debug(`Stub: Would send push to ${deviceToken.platform} device ${deviceToken.id}`);
      return { success: true, messageId: 'stub-message-id' };
    }

    try {
      const message: admin.messaging.Message = {
        token: deviceToken.token,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data ? this.stringifyData(notification.data) : undefined,
        apns: deviceToken.platform === 'ios' ? {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              priority: notification.priority === 'urgent' ? 10 : 5
            }
          }
        } : undefined,
        android: deviceToken.platform === 'android' ? {
          priority: notification.priority === 'urgent' ? 'high' : 'normal',
          notification: {
            sound: 'default',
            channelId: 'faithconnect_notifications'
          }
        } : undefined
      };

      const response = await admin.messaging().send(message);
      logger.info(`Push notification sent: messageId=${response}, platform=${deviceToken.platform}`);
      
      return { success: true, messageId: response };
    } catch (error: any) {
      logger.error(`Failed to send push notification: ${error.message}`);
      
      // Handle invalid token
      if (error.code === 'messaging/invalid-registration-token' || 
          error.code === 'messaging/registration-token-not-registered') {
        return { success: false, error: 'INVALID_TOKEN' };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToDevices(
    deviceTokens: DeviceToken[],
    notification: Notification
  ): Promise<{ successCount: number; failureCount: number; errors: string[] }> {
    const results = await Promise.allSettled(
      deviceTokens.map(token => this.sendToDevice(token, notification))
    );

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successCount++;
      } else {
        failureCount++;
        const error = result.status === 'rejected' 
          ? result.reason.message 
          : result.value.error || 'Unknown error';
        errors.push(`Device ${deviceTokens[index].id}: ${error}`);
      }
    });

    logger.info(`Push notifications sent: ${successCount} success, ${failureCount} failures`);
    
    return { successCount, failureCount, errors };
  }

  /**
   * Convert data object to string format (FCM requirement)
   */
  private stringifyData(data: Record<string, any>): Record<string, string> {
    const stringified: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      stringified[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return stringified;
  }

  /**
   * Check if push notifications are configured
   */
  isPushConfigured(): boolean {
    return this.isConfigured;
  }
}

