/**
 * Feed Controller
 */

import { Request, Response, NextFunction } from 'express';
import { FeedService } from '../services/feed.service';
import { getUserId } from '../middleware/auth';
import { logger } from '../utils/logger';
import { requireUUID } from '../utils/validation';
import { FeedType, ReactionType } from '../types/feed.types';

let feedServiceInstance: FeedService | null = null;

const getFeedService = (): FeedService => {
  if (!feedServiceInstance) {
    feedServiceInstance = new FeedService();
  }
  return feedServiceInstance;
};

export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const post = await getFeedService().createPost(userId, req.body);

    res.status(201).json({
      success: true,
      data: post,
      message: 'Post created successfully'
    });
  } catch (error: any) {
    logger.error('Create post error:', error);
    next(error);
  }
};

export const getPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId } = req.params;
    const post = await getFeedService().getPost(postId);

    if (!post) {
      res.status(404).json({
        success: false,
        error: 'POST_NOT_FOUND',
        message: 'Post not found'
      });
      return;
    }

    // Get reactions and comments count
    const reactions = await getFeedService().getReactions(postId);
    const comments = await getFeedService().getComments(postId, 0, 0);

    res.json({
      success: true,
      data: {
        ...post,
        reaction_count: reactions.length,
        comment_count: comments.length
      }
    });
  } catch (error: any) {
    logger.error('Get post error:', error);
    next(error);
  }
};

export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { postId } = req.params;
    const post = await getFeedService().updatePost(postId, userId, req.body);

    res.json({
      success: true,
      data: post,
      message: 'Post updated successfully'
    });
  } catch (error: any) {
    logger.error('Update post error:', error);
    next(error);
  }
};

export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { postId } = req.params;
    const isAdmin = (req as any).user?.isAdmin || false;

    await getFeedService().deletePost(postId, userId, isAdmin);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error: any) {
    logger.error('Delete post error:', error);
    next(error);
  }
};

export const listPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const feedType = req.query.feed_type as FeedType | undefined;
    const userId = req.query.user_id as string | undefined;
    const isPrayerRequest = req.query.is_prayer_request === 'true' ? true : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

    // Validate user_id if provided
    if (userId) {
      requireUUID(userId, 'USER');
    }

    const posts = await getFeedService().listPosts({
      feed_type: feedType,
      user_id: userId,
      is_prayer_request: isPrayerRequest,
      limit,
      offset
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        limit: posts.length > 0 ? (limit ? Math.min(limit, 100) : 20) : 0,
        offset: offset || 0,
        count: posts.length
      }
    });
  } catch (error: any) {
    logger.error('List posts error:', error);
    next(error);
  }
};

export const addReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { postId } = req.params;
    const reaction = await getFeedService().addReaction(postId, userId, req.body);

    res.json({
      success: true,
      data: reaction,
      message: 'Reaction added successfully'
    });
  } catch (error: any) {
    logger.error('Add reaction error:', error);
    next(error);
  }
};

export const removeReaction = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { postId } = req.params;
    const reactionType = req.query.reaction_type as ReactionType;

    if (!reactionType) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'reaction_type is required'
      });
      return;
    }

    await getFeedService().removeReaction(postId, userId, reactionType);

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });
  } catch (error: any) {
    logger.error('Remove reaction error:', error);
    next(error);
  }
};

export const addComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { postId } = req.params;
    const comment = await getFeedService().addComment(postId, userId, req.body);

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  } catch (error: any) {
    logger.error('Add comment error:', error);
    next(error);
  }
};

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const { commentId } = req.params;
    const isAdmin = (req as any).user?.isAdmin || false;

    await getFeedService().deleteComment(commentId, userId, isAdmin);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error: any) {
    logger.error('Delete comment error:', error);
    next(error);
  }
};

export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const comments = await getFeedService().getComments(postId, limit, offset);

    res.json({
      success: true,
      data: comments,
      pagination: {
        limit,
        offset,
        count: comments.length
      }
    });
  } catch (error: any) {
    logger.error('Get comments error:', error);
    next(error);
  }
};

export const getReactions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { postId } = req.params;
    const reactions = await getFeedService().getReactions(postId);

    res.json({
      success: true,
      data: reactions
    });
  } catch (error: any) {
    logger.error('Get reactions error:', error);
    next(error);
  }
};

