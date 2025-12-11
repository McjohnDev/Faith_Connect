/**
 * Logger Utility
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'meetings-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Small helper for structured event logs
export const logEvent = (
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  meta?: Record<string, any>
): void => {
  logger.log(level, message, meta);
};

