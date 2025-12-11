/**
 * Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', error);

  const errorMessages: Record<string, { status: number; message: string }> = {
    'MEETING_NOT_FOUND': { status: 404, message: 'Meeting not found' },
    'MEETING_LOCKED': { status: 403, message: 'Meeting is locked' },
    'MEETING_ENDED': { status: 400, message: 'Meeting has ended' },
    'MEETING_FULL': { status: 403, message: 'Meeting is full' },
    'NOT_PARTICIPANT': { status: 403, message: 'Not a participant in this meeting' },
    'INSUFFICIENT_PERMISSIONS': { status: 403, message: 'Insufficient permissions' },
    'INVALID_ACTION': { status: 400, message: 'Invalid action' },
    'UNAUTHORIZED': { status: 401, message: 'Unauthorized' },
    'AGORA_NOT_CONFIGURED': { status: 500, message: 'Agora service not configured' },
    'VALIDATION_ERROR': { status: 400, message: 'Validation error' }
  };

  const errorInfo = errorMessages[error.message] || {
    status: 500,
    message: 'Internal server error'
  };

  res.status(errorInfo.status).json({
    success: false,
    error: error.message,
    message: errorInfo.message
  });
};

