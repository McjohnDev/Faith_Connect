/**
 * Notification Routes
 */

import { Router } from 'express';
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  getPreferences,
  updatePreferences,
  registerDeviceToken,
  unregisterDeviceToken
} from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Notifications
router.post('/', createNotification);
router.get('/', getUserNotifications);
router.put('/:notificationId/read', markAsRead);

// Preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Device tokens
router.post('/devices', registerDeviceToken);
router.delete('/devices', unregisterDeviceToken);

export default router;

