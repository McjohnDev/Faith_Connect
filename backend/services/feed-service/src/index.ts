/**
 * Feed Service
 * Social Feed with Posts, Reactions, and Comments
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import feedRoutes from './routes/feed.routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { metricsHandler, metricsMiddleware } from './middleware/metrics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics (Prometheus)
app.use(metricsMiddleware);

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
    service: 'feed-service',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/metrics', metricsHandler);

// API routes
app.use('/api/v1/feed', feedRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Feed Service running on port ${PORT}`);
});

