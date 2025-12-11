/**
 * Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { FeedType, ReactionType, PostVisibility } from '../types/feed.types';

const schemas = {
  createPost: z.object({
    content: z.string().min(1).max(5000),
    media_url: z.string().url().optional(),
    media_type: z.string().optional(),
    is_prayer_request: z.boolean().optional(),
    feed_type: z.nativeEnum(FeedType).optional(),
    visibility: z.nativeEnum(PostVisibility).optional()
  }),

  updatePost: z.object({
    content: z.string().min(1).max(5000).optional(),
    media_url: z.string().url().optional(),
    media_type: z.string().optional(),
    is_prayer_request: z.boolean().optional(),
    visibility: z.nativeEnum(PostVisibility).optional()
  }),

  addReaction: z.object({
    reaction_type: z.nativeEnum(ReactionType)
  }),

  addComment: z.object({
    content: z.string().min(1).max(2000),
    parent_comment_id: z.string().uuid().optional()
  })
};

export const validateRequest = (schemaName: keyof typeof schemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const schema = schemas[schemaName];
      schema.parse(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('Validation error:', error.errors);
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          details: error.errors
        });
        return;
      }
      next(error);
    }
  };
};

