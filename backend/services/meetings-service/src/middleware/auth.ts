/**
 * Auth Middleware (Mock for Testing)
 * 
 * In production, this should verify JWT tokens
 * For now, it extracts user ID from X-User-Id header or Authorization Bearer token
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Mock auth middleware - extracts user from header or JWT
export const authMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // For testing: allow X-User-Id header
  const userIdFromHeader = req.headers['x-user-id'] as string;
  
  if (userIdFromHeader) {
    (req as any).user = { id: userIdFromHeader };
    next();
    return;
  }

  // Try to extract from Authorization header (JWT)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // TODO: Verify JWT token
    // For now, if token exists, extract user ID from it (mock)
    try {
      // In production, use: jwt.verify(token, process.env.JWT_SECRET)
      // For testing, we'll decode without verification
      const payload = JSON.parse(Buffer.from(token.split('.')[1] || '', 'base64').toString());
      (req as any).user = { id: payload.userId || payload.sub || 'unknown' };
      next();
      return;
    } catch (error) {
      logger.warn('Failed to parse token:', error);
    }
  }

  // No auth provided - allow for testing but log warning
  logger.warn('No authentication provided, using default test user');
  (req as any).user = { id: 'test-user-default' };
  next();
};

