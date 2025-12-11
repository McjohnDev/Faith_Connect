/**
 * Feed Service
 * Core business logic for feed operations
 */

import { randomUUID } from 'crypto';
import { DatabaseService } from './database.service';
import { StorageService } from './storage.service';
import { logger } from '../utils/logger';
import { validateUUID, requireUUID, enforcePaginationLimits } from '../utils/validation';
import { sanitizeContent, isValidUrl } from '../utils/sanitize';
import {
  Post,
  Reaction,
  Comment,
  CreatePostDto,
  UpdatePostDto,
  AddReactionDto,
  AddCommentDto,
  ListPostsFilters,
  FeedType,
  ReactionType,
  PostWithStats
} from '../types/feed.types';

export class FeedService {
  private dbService: DatabaseService;
  private storageService: StorageService;

  constructor() {
    this.dbService = new DatabaseService();
    this.storageService = new StorageService();
  }

  /**
   * Create a new post
   */
  async createPost(userId: string, dto: CreatePostDto): Promise<Post> {
    // Validate user ID
    requireUUID(userId, 'USER');

    // Sanitize content
    const sanitizedContent = sanitizeContent(dto.content);

    // Validate media URL if provided
    if (dto.media_url && !isValidUrl(dto.media_url) && !dto.media_url.startsWith('http')) {
      throw new Error('INVALID_MEDIA_URL');
    }

    const postId = randomUUID();
    const now = new Date();

    // Calculate edification score (stub for now)
    const edificationScore = this.calculateEdificationScore(sanitizedContent, dto.is_prayer_request || false);

    // Upload media if provided
    let mediaUrl = dto.media_url;
    if (dto.media_url && !dto.media_url.startsWith('http')) {
      // If it's a local path or needs upload, handle it
      mediaUrl = await this.storageService.uploadPostImage(
        userId,
        postId,
        dto.media_url,
        dto.media_type || 'image/jpeg'
      );
    }

    const post: Post = {
      id: postId,
      user_id: userId,
      content: sanitizedContent,
      media_url: mediaUrl,
      media_type: dto.media_type,
      is_prayer_request: dto.is_prayer_request || false,
      edification_score: edificationScore,
      feed_type: dto.feed_type || FeedType.PRIMARY,
      visibility: (dto.visibility || 'public') as any,
      created_at: now,
      updated_at: now
    };

    await this.dbService.createPost(post);
    logger.info(`Post created: ${postId} by user ${userId}`);
    return post;
  }

  /**
   * Get post by ID
   */
  async getPost(postId: string): Promise<Post | null> {
    // Validate UUID format
    if (!validateUUID(postId)) {
      throw new Error('INVALID_POST_ID_FORMAT');
    }
    return await this.dbService.getPost(postId);
  }

  /**
   * Update post (author only)
   */
  async updatePost(postId: string, userId: string, dto: UpdatePostDto): Promise<Post> {
    // Validate UUIDs
    requireUUID(postId, 'POST');
    requireUUID(userId, 'USER');

    const post = await this.dbService.getPost(postId);
    if (!post || post.deleted_at) {
      throw new Error('POST_NOT_FOUND');
    }

    if (post.user_id !== userId) {
      throw new Error('UNAUTHORIZED');
    }

    // Sanitize content if provided
    const updateDto: UpdatePostDto = { ...dto };
    if (dto.content !== undefined) {
      updateDto.content = sanitizeContent(dto.content);
    }

    // Validate media URL if provided
    if (dto.media_url && !isValidUrl(dto.media_url) && !dto.media_url.startsWith('http')) {
      throw new Error('INVALID_MEDIA_URL');
    }

    // Recalculate edification score if content changed
    // Note: We'd need to add edification_score to UpdatePostDto to update it
    // For now, we calculate but don't persist it
    if (dto.content !== undefined) {
      this.calculateEdificationScore(
        updateDto.content!,
        dto.is_prayer_request !== undefined ? dto.is_prayer_request : post.is_prayer_request
      );
    }

    await this.dbService.updatePost(postId, updateDto);
    const updated = await this.dbService.getPost(postId);
    if (!updated || updated.deleted_at) {
      throw new Error('POST_NOT_FOUND');
    }
    return updated;
  }

  /**
   * Delete post (author or admin)
   */
  async deletePost(postId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    // Validate UUIDs
    requireUUID(postId, 'POST');
    requireUUID(userId, 'USER');

    const post = await this.dbService.getPost(postId);
    if (!post || post.deleted_at) {
      throw new Error('POST_NOT_FOUND');
    }

    if (post.user_id !== userId && !isAdmin) {
      throw new Error('UNAUTHORIZED');
    }

    // Delete associated media
    if (post.media_url) {
      try {
        await this.storageService.deletePostImage(post.media_url);
      } catch (error) {
        logger.warn(`Failed to delete media for post ${postId}:`, error);
      }
    }

    await this.dbService.deletePost(postId);
    logger.info(`Post deleted: ${postId} by user ${userId}`);
  }

  /**
   * List posts with filters
   */
  async listPosts(filters?: ListPostsFilters): Promise<PostWithStats[]> {
    // Enforce pagination limits
    const { limit, offset } = enforcePaginationLimits(filters?.limit, filters?.offset);
    const enforcedFilters = { ...filters, limit, offset };

    const posts = await this.dbService.listPosts(enforcedFilters);

    if (posts.length === 0) {
      return [];
    }

    // Batch fetch reactions and comment counts to avoid N+1 queries
    const postIds = posts.map(p => p.id);
    const [reactionsMap, commentCountsMap] = await Promise.all([
      this.dbService.getReactionsBatch(postIds),
      this.dbService.getCommentCountsBatch(postIds)
    ]);

    // Enrich with stats
    const postsWithStats: PostWithStats[] = posts.map((post) => {
      const reactions = reactionsMap.get(post.id) || [];
      const commentCount = commentCountsMap.get(post.id) || 0;

      return {
        ...post,
        reaction_count: reactions.length,
        comment_count: commentCount
      };
    });

    return postsWithStats;
  }

  /**
   * Add reaction to post
   */
  async addReaction(postId: string, userId: string, dto: AddReactionDto): Promise<Reaction> {
    // Validate UUIDs
    requireUUID(postId, 'POST');
    requireUUID(userId, 'USER');

    const post = await this.dbService.getPost(postId);
    if (!post || post.deleted_at) {
      throw new Error('POST_NOT_FOUND');
    }

    // Remove existing reaction if user already reacted
    const existing = await this.dbService.getUserReaction(postId, userId);
    if (existing && existing.reaction_type !== dto.reaction_type) {
      await this.dbService.removeReaction(postId, userId, existing.reaction_type);
    }

    const reaction: Reaction = {
      id: randomUUID(),
      post_id: postId,
      user_id: userId,
      reaction_type: dto.reaction_type,
      created_at: new Date()
    };

    await this.dbService.addReaction(reaction);
    logger.info(`Reaction added: ${dto.reaction_type} on post ${postId} by user ${userId}`);
    return reaction;
  }

  /**
   * Remove reaction from post
   */
  async removeReaction(postId: string, userId: string, reactionType: ReactionType): Promise<void> {
    // Validate UUIDs
    requireUUID(postId, 'POST');
    requireUUID(userId, 'USER');

    const post = await this.dbService.getPost(postId);
    if (!post || post.deleted_at) {
      throw new Error('POST_NOT_FOUND');
    }

    await this.dbService.removeReaction(postId, userId, reactionType);
    logger.info(`Reaction removed: ${reactionType} on post ${postId} by user ${userId}`);
  }

  /**
   * Add comment to post
   */
  async addComment(postId: string, userId: string, dto: AddCommentDto): Promise<Comment> {
    // Validate UUIDs
    requireUUID(postId, 'POST');
    requireUUID(userId, 'USER');

    const post = await this.dbService.getPost(postId);
    if (!post || post.deleted_at) {
      throw new Error('POST_NOT_FOUND');
    }

    // Validate parent comment if provided
    if (dto.parent_comment_id) {
      requireUUID(dto.parent_comment_id, 'PARENT_COMMENT');
      const parentComment = await this.dbService.getComment(dto.parent_comment_id);
      if (!parentComment || parentComment.deleted_at || parentComment.post_id !== postId) {
        throw new Error('PARENT_COMMENT_NOT_FOUND');
      }
    }

    // Sanitize content
    const sanitizedContent = sanitizeContent(dto.content);

    const comment: Comment = {
      id: randomUUID(),
      post_id: postId,
      user_id: userId,
      content: sanitizedContent,
      parent_comment_id: dto.parent_comment_id,
      created_at: new Date(),
      updated_at: new Date()
    };

    await this.dbService.addComment(comment);
    logger.info(`Comment added to post ${postId} by user ${userId}`);
    return comment;
  }

  /**
   * Delete comment (author or admin)
   */
  async deleteComment(commentId: string, userId: string, isAdmin: boolean = false): Promise<void> {
    // Validate UUIDs
    requireUUID(commentId, 'COMMENT');
    requireUUID(userId, 'USER');

    // Get comment to check ownership (efficient lookup)
    const comment = await this.dbService.getComment(commentId);
    if (!comment || comment.deleted_at) {
      throw new Error('COMMENT_NOT_FOUND');
    }

    if (comment.user_id !== userId && !isAdmin) {
      throw new Error('UNAUTHORIZED');
    }

    await this.dbService.deleteComment(commentId);
    logger.info(`Comment deleted: ${commentId} by user ${userId}`);
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: string, limit: number = 50, offset: number = 0): Promise<Comment[]> {
    // Validate UUID
    requireUUID(postId, 'POST');

    // Check if post exists and is not deleted
    const post = await this.dbService.getPost(postId);
    if (!post || post.deleted_at) {
      throw new Error('POST_NOT_FOUND');
    }

    // Enforce pagination limits
    const { limit: enforcedLimit, offset: enforcedOffset } = enforcePaginationLimits(limit, offset);
    
    return await this.dbService.getComments(postId, enforcedLimit, enforcedOffset);
  }

  /**
   * Get reactions for a post
   */
  async getReactions(postId: string): Promise<Reaction[]> {
    // Validate UUID
    requireUUID(postId, 'POST');

    // Check if post exists and is not deleted
    const post = await this.dbService.getPost(postId);
    if (!post || post.deleted_at) {
      throw new Error('POST_NOT_FOUND');
    }

    return await this.dbService.getReactions(postId);
  }

  /**
   * Calculate edification score (stub)
   * In a real implementation, this would use ML/NLP to analyze content
   */
  private calculateEdificationScore(content: string, isPrayerRequest: boolean): number {
    // Stub: simple heuristic
    let score = 0.5; // Base score

    // Prayer requests get a boost
    if (isPrayerRequest) {
      score += 0.2;
    }

    // Content length bonus
    if (content.length > 100) {
      score += 0.1;
    }
    if (content.length > 500) {
      score += 0.1;
    }

    // Cap at 1.0
    return Math.min(1.0, score);
  }
}

