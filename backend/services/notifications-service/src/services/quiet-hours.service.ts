/**
 * Quiet Hours Service
 * Handles quiet hours logic and timezone-aware scheduling
 */

import { logger } from '../utils/logger';
import { NotificationPreferences } from '../types/notification.types';

export class QuietHoursService {
  /**
   * Check if current time is within quiet hours
   */
  isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursEnabled) {
      return false;
    }

    const now = new Date();
    const userTimezone = preferences.timezone || 'UTC';
    
    // Convert current time to user's timezone
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    // Parse quiet hours
    const [startHour, startMinute] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    // Handle quiet hours that span midnight (e.g., 22:00 - 08:00)
    if (startTimeMinutes > endTimeMinutes) {
      // Quiet hours span midnight
      return currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
    } else {
      // Quiet hours within same day
      return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
    }
  }

  /**
   * Check if notification should be sent (respects quiet hours)
   */
  shouldSendNotification(
    preferences: NotificationPreferences,
    priority: 'low' | 'normal' | 'high' | 'urgent'
  ): boolean {
    // Urgent notifications bypass quiet hours
    if (priority === 'urgent') {
      return true;
    }

    // Check if in quiet hours
    if (this.isQuietHours(preferences)) {
      logger.debug(`Notification suppressed due to quiet hours for userId=${preferences.userId}`);
      return false;
    }

    return true;
  }

  /**
   * Calculate next available send time (after quiet hours)
   */
  getNextAvailableTime(preferences: NotificationPreferences): Date {
    if (!preferences.quietHoursEnabled) {
      return new Date(); // Can send immediately
    }

    const now = new Date();
    const userTimezone = preferences.timezone || 'UTC';
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    
    const [endHour, endMinute] = preferences.quietHoursEnd.split(':').map(Number);
    
    // If currently in quiet hours, schedule for end of quiet hours
    if (this.isQuietHours(preferences)) {
      const nextAvailable = new Date(userTime);
      nextAvailable.setHours(endHour, endMinute, 0, 0);
      
      // If quiet hours end is tomorrow, add a day
      if (nextAvailable <= userTime) {
        nextAvailable.setDate(nextAvailable.getDate() + 1);
      }
      
      // Convert back to UTC
      return new Date(nextAvailable.toLocaleString('en-US', { timeZone: 'UTC' }));
    }

    // Not in quiet hours, can send now
    return now;
  }
}

