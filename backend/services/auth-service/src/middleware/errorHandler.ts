/**
 * Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Map error codes to HTTP status
  const errorMap: Record<string, number> = {
    'RATE_LIMIT_EXCEEDED': 429,
    'INVALID_OTP': 401,
    'INVALID_REFRESH_TOKEN': 401,
    'SMS_SEND_FAILED': 503,
    'WHATSAPP_SEND_FAILED': 503,
    'OTP_SEND_FAILED': 503,
    'MAX_DEVICES_REACHED': 403,
    'AGE_RESTRICTION': 403,
    'GUIDELINES_REQUIRED': 400,
    'INVALID_DELIVERY_METHOD': 400
  };

  const statusCode = errorMap[err.message] || 500;

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.message || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred'
    },
    timestamp: new Date().toISOString()
  });
};

