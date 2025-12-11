/**
 * Auth Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const userIdFromHeader = req.headers['x-user-id'] as string;
  
  if (userIdFromHeader) {
    (req as any).user = { id: userIdFromHeader };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString());
      (req as any).user = { id: payload.userId || payload.sub || 'unknown' };
      next();
      return;
    } catch (error) {
      logger.warn('Failed to parse token:', error);
    }
  }

  logger.warn('No authentication provided');
  (req as any).user = { id: 'test-user-default' };
  next();
};

export const getUserId = (req: Request): string => {
  return (req as any).user?.id || 'unknown';
};

