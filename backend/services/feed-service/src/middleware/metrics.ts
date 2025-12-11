import { NextFunction, Request, Response } from 'express';
import client from 'prom-client';

const register = new client.Registry();
register.setDefaultLabels({ service: 'feed-service' });

client.collectDefaultMetrics({ register });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10]
});

register.registerMetric(httpRequestDurationSeconds);

const normalisePath = (req: Request): string => {
  const routePath = (req.route && req.route.path) || (req as any).baseUrl || req.path || 'unknown';
  return typeof routePath === 'string' ? routePath : JSON.stringify(routePath);
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const end = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      path: normalisePath(req),
      status_code: String(res.statusCode)
    });
  });
  next();
};

export const metricsHandler = async (_req: Request, res: Response): Promise<void> => {
  res.setHeader('Content-Type', register.contentType);
  res.end(await register.metrics());
};

export const metricsRegister = register;

