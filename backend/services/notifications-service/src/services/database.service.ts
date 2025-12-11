/**
 * Database Service for Notifications
 * Handles notification data persistence
 */

import { Pool, createPool } from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import { logger } from '../utils/logger';
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

export class DatabaseService {
  private mysqlPool?: Pool;
  private pgPool?: PgPool;
  private dbType: 'mysql' | 'postgresql';

  constructor() {
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
      logger.info('MySQL connection pool created for notifications');
    } else {
      this.pgPool = new PgPool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        database: process.env.POSTGRES_DATABASE || 'faithconnect',
        max: 20
      });
      logger.info('PostgreSQL connection pool created for notifications');
    }
  }

  /**
   * Create notification
   */
  async createNotification(dto: CreateNotificationDto & {
    priority: NotificationPriority;
    channels: NotificationChannel[];
    scheduledFor?: Date;
  }): Promise<Notification> {
    const id = require('crypto').randomUUID();
    const notification: Notification = {
      id,
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      channels: dto.channels,
      priority: dto.priority,
      scheduledFor: dto.scheduledFor,
      createdAt: new Date()
    };

    const channelsJson = JSON.stringify(dto.channels);
    const dataJson = dto.data ? JSON.stringify(dto.data) : null;

    const query = this.dbType === 'mysql'
      ? `INSERT INTO notifications (id, user_id, type, title, body, data, channels, priority, scheduled_for, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO notifications (id, user_id, type, title, body, data, channels, priority, scheduled_for, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`;

    const params = [
      id,
      dto.userId,
      dto.type,
      dto.title,
      dto.body,
      dataJson,
      channelsJson,
      dto.priority,
      dto.scheduledFor || null,
      notification.createdAt
    ];

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }

    return notification;
  }

  /**
   * Update notification
   */
  async updateNotification(
    notificationId: string,
    update: {
      sentAt?: Date;
      readAt?: Date;
    }
  ): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (update.sentAt !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('sent_at = ?');
        params.push(update.sentAt);
      } else {
        updates.push(`sent_at = $${paramIndex++}`);
        params.push(update.sentAt);
      }
    }

    if (update.readAt !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('read_at = ?');
        params.push(update.readAt);
      } else {
        updates.push(`read_at = $${paramIndex++}`);
        params.push(update.readAt);
      }
    }

    if (updates.length === 0) return;

    const query = this.dbType === 'mysql'
      ? `UPDATE notifications SET ${updates.join(', ')} WHERE id = ?`
      : `UPDATE notifications SET ${updates.join(', ')} WHERE id = $${paramIndex}`;

    params.push(notificationId);

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
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
    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters?.type) {
      if (this.dbType === 'mysql') {
        query += ' AND type = ?';
        params.push(filters.type);
      } else {
        query += ` AND type = $${paramIndex++}`;
        params.push(filters.type);
      }
    }

    if (filters?.read !== undefined) {
      if (this.dbType === 'mysql') {
        query += filters.read ? ' AND read_at IS NOT NULL' : ' AND read_at IS NULL';
      } else {
        query += filters.read ? ' AND read_at IS NOT NULL' : ' AND read_at IS NULL';
      }
    }

    query += ' ORDER BY created_at DESC';

    if (filters?.limit) {
      if (this.dbType === 'mysql') {
        query += ' LIMIT ?';
        params.push(filters.limit);
      } else {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }
    }

    if (filters?.offset) {
      if (this.dbType === 'mysql') {
        query += ' OFFSET ?';
        params.push(filters.offset);
      } else {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }
    }

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, params);
      return (rows as any[]).map(row => this.mapToNotification(row));
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, params);
      return result.rows.map(row => this.mapToNotification(row));
    }
    return [];
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM notification_preferences WHERE user_id = ?'
      : 'SELECT * FROM notification_preferences WHERE user_id = $1';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [userId]);
      const prefs = rows as any[];
      return prefs.length > 0 ? this.mapToPreferences(prefs[0]) : null;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [userId]);
      return result.rows.length > 0 ? this.mapToPreferences(result.rows[0]) : null;
    }
    return null;
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    dto: UpdatePreferencesDto
  ): Promise<NotificationPreferences> {
    // Check if preferences exist
    const existing = await this.getNotificationPreferences(userId);
    
    if (!existing) {
      // Create default preferences
      return await this.createNotificationPreferences(userId, dto);
    }

    // Update existing preferences
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (dto.meetingReminders !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('meeting_reminders = ?');
        params.push(dto.meetingReminders);
      } else {
        updates.push(`meeting_reminders = $${paramIndex++}`);
        params.push(dto.meetingReminders);
      }
    }

    if (dto.meetingStarted !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('meeting_started = ?');
        params.push(dto.meetingStarted);
      } else {
        updates.push(`meeting_started = $${paramIndex++}`);
        params.push(dto.meetingStarted);
      }
    }

    if (dto.prayerRequests !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('prayer_requests = ?');
        params.push(dto.prayerRequests);
      } else {
        updates.push(`prayer_requests = $${paramIndex++}`);
        params.push(dto.prayerRequests);
      }
    }

    if (dto.messages !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('messages = ?');
        params.push(dto.messages);
      } else {
        updates.push(`messages = $${paramIndex++}`);
        params.push(dto.messages);
      }
    }

    if (dto.friendRequests !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('friend_requests = ?');
        params.push(dto.friendRequests);
      } else {
        updates.push(`friend_requests = $${paramIndex++}`);
        params.push(dto.friendRequests);
      }
    }

    if (dto.groupInvites !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('group_invites = ?');
        params.push(dto.groupInvites);
      } else {
        updates.push(`group_invites = $${paramIndex++}`);
        params.push(dto.groupInvites);
      }
    }

    if (dto.quietHoursEnabled !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('quiet_hours_enabled = ?');
        params.push(dto.quietHoursEnabled);
      } else {
        updates.push(`quiet_hours_enabled = $${paramIndex++}`);
        params.push(dto.quietHoursEnabled);
      }
    }

    if (dto.quietHoursStart !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('quiet_hours_start = ?');
        params.push(dto.quietHoursStart);
      } else {
        updates.push(`quiet_hours_start = $${paramIndex++}`);
        params.push(dto.quietHoursStart);
      }
    }

    if (dto.quietHoursEnd !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('quiet_hours_end = ?');
        params.push(dto.quietHoursEnd);
      } else {
        updates.push(`quiet_hours_end = $${paramIndex++}`);
        params.push(dto.quietHoursEnd);
      }
    }

    if (dto.timezone !== undefined) {
      if (this.dbType === 'mysql') {
        updates.push('timezone = ?');
        params.push(dto.timezone);
      } else {
        updates.push(`timezone = $${paramIndex++}`);
        params.push(dto.timezone);
      }
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push(this.dbType === 'mysql' ? 'updated_at = NOW()' : 'updated_at = CURRENT_TIMESTAMP');

    const query = this.dbType === 'mysql'
      ? `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = ?`
      : `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = $${paramIndex}`;

    params.push(userId);

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }

    return await this.getNotificationPreferences(userId) || existing;
  }

  /**
   * Create notification preferences
   */
  private async createNotificationPreferences(
    userId: string,
    dto: UpdatePreferencesDto
  ): Promise<NotificationPreferences> {
    const now = new Date();
    const preferences: NotificationPreferences = {
      userId,
      meetingReminders: dto.meetingReminders ?? true,
      meetingStarted: dto.meetingStarted ?? true,
      prayerRequests: dto.prayerRequests ?? true,
      messages: dto.messages ?? true,
      friendRequests: dto.friendRequests ?? true,
      groupInvites: dto.groupInvites ?? true,
      quietHoursEnabled: dto.quietHoursEnabled ?? false,
      quietHoursStart: dto.quietHoursStart || '22:00',
      quietHoursEnd: dto.quietHoursEnd || '08:00',
      timezone: dto.timezone || 'UTC',
      createdAt: now,
      updatedAt: now
    };

    const query = this.dbType === 'mysql'
      ? `INSERT INTO notification_preferences (user_id, meeting_reminders, meeting_started, prayer_requests, messages, friend_requests, group_invites, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO notification_preferences (user_id, meeting_reminders, meeting_started, prayer_requests, messages, friend_requests, group_invites, quiet_hours_enabled, quiet_hours_start, quiet_hours_end, timezone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;

    const params = [
      userId,
      preferences.meetingReminders,
      preferences.meetingStarted,
      preferences.prayerRequests,
      preferences.messages,
      preferences.friendRequests,
      preferences.groupInvites,
      preferences.quietHoursEnabled,
      preferences.quietHoursStart,
      preferences.quietHoursEnd,
      preferences.timezone,
      preferences.createdAt,
      preferences.updatedAt
    ];

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }

    return preferences;
  }

  /**
   * Get device tokens for user
   */
  async getDeviceTokens(userId: string): Promise<DeviceToken[]> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM device_tokens WHERE user_id = ?'
      : 'SELECT * FROM device_tokens WHERE user_id = $1';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [userId]);
      return (rows as any[]).map(row => this.mapToDeviceToken(row));
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [userId]);
      return result.rows.map(row => this.mapToDeviceToken(row));
    }
    return [];
  }

  /**
   * Upsert device token
   */
  async upsertDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
    deviceId?: string,
    deviceName?: string
  ): Promise<DeviceToken> {
    const id = require('crypto').randomUUID();
    const now = new Date();

    // Check if token exists
    const existing = this.dbType === 'mysql'
      ? await this.mysqlPool!.execute('SELECT * FROM device_tokens WHERE token = ?', [token])
      : await this.pgPool!.query('SELECT * FROM device_tokens WHERE token = $1', [token]);

    const exists = this.dbType === 'mysql'
      ? (existing[0] as any[]).length > 0
      : existing.rows.length > 0;

    if (exists) {
      // Update existing
      const updateQuery = this.dbType === 'mysql'
        ? `UPDATE device_tokens SET user_id = ?, platform = ?, device_id = ?, device_name = ?, updated_at = ? WHERE token = ?`
        : `UPDATE device_tokens SET user_id = $1, platform = $2, device_id = $3, device_name = $4, updated_at = $5 WHERE token = $6`;

      const updateParams = [userId, platform, deviceId || null, deviceName || null, now, token];

      if (this.dbType === 'mysql' && this.mysqlPool) {
        await this.mysqlPool.execute(updateQuery, updateParams);
        const [rows] = await this.mysqlPool.execute('SELECT * FROM device_tokens WHERE token = ?', [token]);
        return this.mapToDeviceToken((rows as any[])[0]);
      } else if (this.pgPool) {
        await this.pgPool.query(updateQuery, updateParams);
        const result = await this.pgPool.query('SELECT * FROM device_tokens WHERE token = $1', [token]);
        return this.mapToDeviceToken(result.rows[0]);
      }
    } else {
      // Insert new
      const insertQuery = this.dbType === 'mysql'
        ? `INSERT INTO device_tokens (id, user_id, token, platform, device_id, device_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        : `INSERT INTO device_tokens (id, user_id, token, platform, device_id, device_name, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

      const insertParams = [id, userId, token, platform, deviceId || null, deviceName || null, now, now];

      if (this.dbType === 'mysql' && this.mysqlPool) {
        await this.mysqlPool.execute(insertQuery, insertParams);
      } else if (this.pgPool) {
        await this.pgPool.query(insertQuery, insertParams);
      }
    }

    const deviceToken: DeviceToken = {
      id,
      userId,
      token,
      platform,
      deviceId,
      deviceName,
      createdAt: now,
      updatedAt: now
    };

    return deviceToken;
  }

  /**
   * Delete device token
   */
  async deleteDeviceToken(userId: string, token: string): Promise<void> {
    const query = this.dbType === 'mysql'
      ? 'DELETE FROM device_tokens WHERE user_id = ? AND token = ?'
      : 'DELETE FROM device_tokens WHERE user_id = $1 AND token = $2';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, [userId, token]);
    } else if (this.pgPool) {
      await this.pgPool.query(query, [userId, token]);
    }
  }

  /**
   * Get scheduled notifications ready to send
   */
  async getScheduledNotifications(limit: number = 100): Promise<Notification[]> {
    const query = this.dbType === 'mysql'
      ? `SELECT * FROM notifications 
         WHERE scheduled_for IS NOT NULL 
         AND scheduled_for <= NOW() 
         AND sent_at IS NULL 
         ORDER BY scheduled_for ASC 
         LIMIT ?`
      : `SELECT * FROM notifications 
         WHERE scheduled_for IS NOT NULL 
         AND scheduled_for <= CURRENT_TIMESTAMP 
         AND sent_at IS NULL 
         ORDER BY scheduled_for ASC 
         LIMIT $1`;

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [limit]);
      return (rows as any[]).map(row => this.mapToNotification(row));
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [limit]);
      return result.rows.map(row => this.mapToNotification(row));
    }
    return [];
  }

  private mapToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id || row.userId,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      data: row.data ? JSON.parse(row.data) : undefined,
      channels: JSON.parse(row.channels) as NotificationChannel[],
      priority: row.priority as NotificationPriority,
      scheduledFor: row.scheduled_for ? new Date(row.scheduled_for) : undefined,
      sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
      readAt: row.read_at ? new Date(row.read_at) : undefined,
      createdAt: new Date(row.created_at || row.createdAt)
    };
  }

  private mapToPreferences(row: any): NotificationPreferences {
    return {
      userId: row.user_id || row.userId,
      meetingReminders: row.meeting_reminders || row.meetingReminders,
      meetingStarted: row.meeting_started || row.meetingStarted,
      prayerRequests: row.prayer_requests || row.prayerRequests,
      messages: row.messages,
      friendRequests: row.friend_requests || row.friendRequests,
      groupInvites: row.group_invites || row.groupInvites,
      quietHoursEnabled: row.quiet_hours_enabled || row.quietHoursEnabled,
      quietHoursStart: row.quiet_hours_start || row.quietHoursStart,
      quietHoursEnd: row.quiet_hours_end || row.quietHoursEnd,
      timezone: row.timezone || 'UTC',
      createdAt: new Date(row.created_at || row.createdAt),
      updatedAt: new Date(row.updated_at || row.updatedAt)
    };
  }

  private mapToDeviceToken(row: any): DeviceToken {
    return {
      id: row.id,
      userId: row.user_id || row.userId,
      token: row.token,
      platform: row.platform,
      deviceId: row.device_id || row.deviceId,
      deviceName: row.device_name || row.deviceName,
      createdAt: new Date(row.created_at || row.createdAt),
      updatedAt: new Date(row.updated_at || row.updatedAt)
    };
  }
}

