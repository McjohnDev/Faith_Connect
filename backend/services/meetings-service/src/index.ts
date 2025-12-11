/**
 * Meetings Service
 * Live Prayer Meetings with Agora.io
 */

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import meetingRoutes from './routes/meeting.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { WebSocketService } from './services/websocket.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3002;

// Initialize WebSocket service
const wsService = new WebSocketService(httpServer);

// Set WebSocket service in MeetingService (to avoid circular dependency)
import { setWebSocketService } from './controllers/meeting.controller';
setWebSocketService(wsService);

// Export WebSocket service for use in other modules
export { wsService };

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'meetings-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/meetings', meetingRoutes);

// Error handler
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Meetings Service running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready for connections`);
});

