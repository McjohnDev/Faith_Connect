/**
 * Notifications Service
 * Main entry point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import notificationRoutes from './routes/notification.routes';
import { NotificationService } from './services/notification.service';
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'notifications-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/notifications', notificationRoutes);

// Error handler
app.use(errorHandler);

// Scheduled job: Process scheduled notifications every minute
const notificationService = new NotificationService();
cron.schedule('* * * * *', async () => {
  try {
    // Access database service through notification service
    const dbService = (notificationService as any).dbService;
    if (dbService) {
      const scheduled = await dbService.getScheduledNotifications(100);
      for (const notification of scheduled) {
        await notificationService.sendNotification(notification);
      }
    }
  } catch (error: any) {
    logger.error('Scheduled notification job error:', error);
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Notifications service running on port ${PORT}`);
});

