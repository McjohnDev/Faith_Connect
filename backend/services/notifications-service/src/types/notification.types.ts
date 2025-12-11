/**
 * Notification Types
 */

export enum NotificationType {
  MEETING_REMINDER = 'meeting_reminder',
  MEETING_STARTED = 'meeting_started',
  MEETING_ENDING = 'meeting_ending',
  PRAYER_REQUEST = 'prayer_request',
  MESSAGE = 'message',
  FRIEND_REQUEST = 'friend_request',
  GROUP_INVITE = 'group_invite',
  SYSTEM = 'system'
}

export enum NotificationChannel {
  PUSH = 'push',
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface NotificationPreferences {
  userId: string;
  meetingReminders: boolean;
  meetingStarted: boolean;
  prayerRequests: boolean;
  messages: boolean;
  friendRequests: boolean;
  groupInvites: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format (e.g., "22:00")
  quietHoursEnd: string; // HH:mm format (e.g., "08:00")
  timezone: string; // IANA timezone (e.g., "America/New_York")
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  scheduledFor?: Date;
}

export interface UpdatePreferencesDto {
  meetingReminders?: boolean;
  meetingStarted?: boolean;
  prayerRequests?: boolean;
  messages?: boolean;
  friendRequests?: boolean;
  groupInvites?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

