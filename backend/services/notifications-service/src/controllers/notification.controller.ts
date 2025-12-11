/**
 * Notification Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notification.service';
import { getUserId } from '../middleware/auth';

let notificationServiceInstance: NotificationService | null = null;

const getNotificationService = (): NotificationService => {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
};

/**
 * Create notification
 */
export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const notification = await getNotificationService().createNotification(req.body);

    res.json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    logger.error('Create notification error:', error);
    next(error);
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const type = req.query.type as string | undefined;
    const read = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    const notifications = await getNotificationService().getUserNotifications(userId, {
      type: type as any,
      read,
      limit,
      offset
    });

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error: any) {
    logger.error('Get user notifications error:', error);
    next(error);
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { notificationId } = req.params;

    await getNotificationService().markAsRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error: any) {
    logger.error('Mark as read error:', error);
    next(error);
  }
};

/**
 * Get notification preferences
 */
export const getPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const preferences = await getNotificationService().getPreferences(userId);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error: any) {
    logger.error('Get preferences error:', error);
    next(error);
  }
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const preferences = await getNotificationService().updatePreferences(userId, req.body);

    res.json({
      success: true,
      data: preferences
    });
  } catch (error: any) {
    logger.error('Update preferences error:', error);
    next(error);
  }
};

/**
 * Register device token
 */
export const registerDeviceToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { token, platform, deviceId, deviceName } = req.body;

    const deviceToken = await getNotificationService().registerDeviceToken(
      userId,
      token,
      platform,
      deviceId,
      deviceName
    );

    res.json({
      success: true,
      data: deviceToken
    });
  } catch (error: any) {
    logger.error('Register device token error:', error);
    next(error);
  }
};

/**
 * Unregister device token
 */
export const unregisterDeviceToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { token } = req.body;

    await getNotificationService().unregisterDeviceToken(userId, token);

    res.json({
      success: true,
      message: 'Device token unregistered'
    });
  } catch (error: any) {
    logger.error('Unregister device token error:', error);
    next(error);
  }
};

