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
    'POST_NOT_FOUND': { status: 404, message: 'Post not found' },
    'COMMENT_NOT_FOUND': { status: 404, message: 'Comment not found' },
    'PARENT_COMMENT_NOT_FOUND': { status: 404, message: 'Parent comment not found' },
    'UNAUTHORIZED': { status: 401, message: 'Unauthorized' },
    'VALIDATION_ERROR': { status: 400, message: 'Validation error' },
    'FILE_NOT_FOUND': { status: 404, message: 'File not found' },
    'INVALID_POST_ID_FORMAT': { status: 400, message: 'Invalid post ID format' },
    'INVALID_COMMENT_ID_FORMAT': { status: 400, message: 'Invalid comment ID format' },
    'INVALID_USER_ID_FORMAT': { status: 400, message: 'Invalid user ID format' },
    'INVALID_PARENT_COMMENT_ID_FORMAT': { status: 400, message: 'Invalid parent comment ID format' },
    'INVALID_MEDIA_URL': { status: 400, message: 'Invalid media URL format' }
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

