/**
 * Database Service for Feed
 * Handles post, reaction, and comment data persistence
 */

import { Pool, createPool } from 'mysql2/promise';
import { Pool as PgPool } from 'pg';
import { logger } from '../utils/logger';
import { Post, Reaction, Comment, FeedType, ReactionType, UpdatePostDto, ListPostsFilters } from '../types/feed.types';

export class DatabaseService {
  private mysqlPool?: Pool;
  private pgPool?: PgPool;
  private dbType: 'mysql' | 'postgresql';

  constructor() {
    this.dbType = process.env.NODE_ENV === 'production' ? 'postgresql' : 'mysql';

    if (this.dbType === 'mysql') {
      this.mysqlPool = createPool({
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'faithconnect_test',
        waitForConnections: true,
        connectionLimit: 10
      });
      logger.info('MySQL connection pool created for feed');
    } else {
      this.pgPool = new PgPool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || '',
        database: process.env.POSTGRES_DATABASE || 'faithconnect',
        max: 20
      });
      logger.info('PostgreSQL connection pool created for feed');
    }
  }

  // Posts
  async createPost(post: Post): Promise<void> {
    const query = this.dbType === 'mysql'
      ? `INSERT INTO posts (id, user_id, content, media_url, media_type, is_prayer_request, edification_score, feed_type, visibility, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO posts (id, user_id, content, media_url, media_type, is_prayer_request, edification_score, feed_type, visibility, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

    const params = [
      post.id,
      post.user_id,
      post.content,
      post.media_url || null,
      post.media_type || null,
      post.is_prayer_request,
      post.edification_score,
      post.feed_type,
      post.visibility,
      post.created_at,
      post.updated_at
    ];

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async getPost(postId: string, includeDeleted: boolean = false): Promise<Post | null> {
    const query = includeDeleted
      ? (this.dbType === 'mysql'
          ? 'SELECT * FROM posts WHERE id = ?'
          : 'SELECT * FROM posts WHERE id = $1')
      : (this.dbType === 'mysql'
          ? 'SELECT * FROM posts WHERE id = ? AND deleted_at IS NULL'
          : 'SELECT * FROM posts WHERE id = $1 AND deleted_at IS NULL');

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [postId]);
      const posts = rows as any[];
      return posts.length > 0 ? this.mapToPost(posts[0]) : null;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [postId]);
      return result.rows.length > 0 ? this.mapToPost(result.rows[0]) : null;
    }
    return null;
  }

  /**
   * Batch get reactions for multiple posts
   */
  async getReactionsBatch(postIds: string[]): Promise<Map<string, Reaction[]>> {
    if (postIds.length === 0) {
      return new Map();
    }

    let reactions: Reaction[] = [];
    
    if (this.dbType === 'mysql' && this.mysqlPool) {
      const placeholders = postIds.map(() => '?').join(',');
      const query = `SELECT * FROM reactions WHERE post_id IN (${placeholders}) ORDER BY created_at DESC`;
      const [rows] = await this.mysqlPool.execute(query, postIds);
      reactions = (rows as any[]).map(row => this.mapToReaction(row));
    } else if (this.pgPool) {
      const query = `SELECT * FROM reactions WHERE post_id = ANY($1::uuid[]) ORDER BY created_at DESC`;
      const result = await this.pgPool.query(query, [postIds]);
      reactions = result.rows.map(row => this.mapToReaction(row));
    }

    // Group by post_id
    const reactionsMap = new Map<string, Reaction[]>();
    for (const reaction of reactions) {
      const existing = reactionsMap.get(reaction.post_id) || [];
      existing.push(reaction);
      reactionsMap.set(reaction.post_id, existing);
    }

    // Ensure all postIds have an entry (even if empty)
    for (const postId of postIds) {
      if (!reactionsMap.has(postId)) {
        reactionsMap.set(postId, []);
      }
    }

    return reactionsMap;
  }

  /**
   * Batch get comment counts for multiple posts
   */
  async getCommentCountsBatch(postIds: string[]): Promise<Map<string, number>> {
    if (postIds.length === 0) {
      return new Map();
    }

    const countsMap = new Map<string, number>();
    
    if (this.dbType === 'mysql' && this.mysqlPool) {
      const placeholders = postIds.map(() => '?').join(',');
      const query = `SELECT post_id, COUNT(*) as count FROM comments WHERE post_id IN (${placeholders}) AND deleted_at IS NULL GROUP BY post_id`;
      const [rows] = await this.mysqlPool.execute(query, postIds);
      for (const row of rows as any[]) {
        countsMap.set(row.post_id || row.postId, parseInt(row.count) || 0);
      }
    } else if (this.pgPool) {
      const query = `SELECT post_id, COUNT(*) as count FROM comments WHERE post_id = ANY($1::uuid[]) AND deleted_at IS NULL GROUP BY post_id`;
      const result = await this.pgPool.query(query, [postIds]);
      for (const row of result.rows) {
        countsMap.set(row.post_id, parseInt(row.count) || 0);
      }
    }

    // Ensure all postIds have an entry (even if 0)
    for (const postId of postIds) {
      if (!countsMap.has(postId)) {
        countsMap.set(postId, 0);
      }
    }

    return countsMap;
  }

  async updatePost(postId: string, update: UpdatePostDto): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (update.content !== undefined) {
      updates.push(this.dbType === 'mysql' ? 'content = ?' : `content = $${paramIndex++}`);
      params.push(update.content);
    }
    if (update.media_url !== undefined) {
      updates.push(this.dbType === 'mysql' ? 'media_url = ?' : `media_url = $${paramIndex++}`);
      params.push(update.media_url);
    }
    if (update.media_type !== undefined) {
      updates.push(this.dbType === 'mysql' ? 'media_type = ?' : `media_type = $${paramIndex++}`);
      params.push(update.media_type);
    }
    if (update.is_prayer_request !== undefined) {
      updates.push(this.dbType === 'mysql' ? 'is_prayer_request = ?' : `is_prayer_request = $${paramIndex++}`);
      params.push(update.is_prayer_request);
    }
    if (update.visibility !== undefined) {
      updates.push(this.dbType === 'mysql' ? 'visibility = ?' : `visibility = $${paramIndex++}`);
      params.push(update.visibility);
    }

    if (updates.length === 0) return;

    updates.push(this.dbType === 'mysql' ? 'updated_at = NOW()' : 'updated_at = CURRENT_TIMESTAMP');

    const query = this.dbType === 'mysql'
      ? `UPDATE posts SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`
      : `UPDATE posts SET ${updates.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL`;

    params.push(postId);

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async deletePost(postId: string): Promise<void> {
    const query = this.dbType === 'mysql'
      ? 'UPDATE posts SET deleted_at = NOW() WHERE id = ?'
      : 'UPDATE posts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, [postId]);
    } else if (this.pgPool) {
      await this.pgPool.query(query, [postId]);
    }
  }

  async listPosts(filters?: ListPostsFilters): Promise<Post[]> {
    // Enforce max limit
    const maxLimit = 100;
    const enforcedLimit = filters?.limit !== undefined && filters.limit > 0 
      ? Math.min(filters.limit, maxLimit) 
      : undefined;
    const enforcedOffset = filters?.offset !== undefined && filters.offset >= 0 
      ? filters.offset 
      : undefined;

    let query = 'SELECT * FROM posts WHERE deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.feed_type) {
      if (this.dbType === 'mysql') {
        query += ' AND feed_type = ?';
        params.push(filters.feed_type);
      } else {
        query += ` AND feed_type = $${paramIndex++}`;
        params.push(filters.feed_type);
      }
    }
    if (filters?.user_id) {
      if (this.dbType === 'mysql') {
        query += ' AND user_id = ?';
        params.push(filters.user_id);
      } else {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(filters.user_id);
      }
    }
    if (filters?.is_prayer_request !== undefined) {
      if (this.dbType === 'mysql') {
        query += ' AND is_prayer_request = ?';
        params.push(filters.is_prayer_request);
      } else {
        query += ` AND is_prayer_request = $${paramIndex++}`;
        params.push(filters.is_prayer_request);
      }
    }

    query += ' ORDER BY created_at DESC';

    // Add LIMIT and OFFSET if provided
    if (enforcedLimit !== undefined && enforcedLimit > 0) {
      if (this.dbType === 'mysql') {
        query += ' LIMIT ?';
        params.push(enforcedLimit);
        // MySQL requires OFFSET after LIMIT if offset is provided
        if (enforcedOffset !== undefined && enforcedOffset >= 0) {
          query += ' OFFSET ?';
          params.push(enforcedOffset);
        }
      } else {
        query += ` LIMIT $${paramIndex++}`;
        params.push(enforcedLimit);
        if (enforcedOffset !== undefined && enforcedOffset >= 0) {
          query += ` OFFSET $${paramIndex++}`;
          params.push(enforcedOffset);
        }
      }
    } else if (enforcedOffset !== undefined && enforcedOffset > 0) {
      // Only OFFSET without LIMIT (not standard, but handle it)
      if (this.dbType === 'mysql') {
        query += ' LIMIT 18446744073709551615 OFFSET ?'; // MySQL workaround for OFFSET without LIMIT
        params.push(enforcedOffset);
      } else {
        query += ` OFFSET $${paramIndex++}`;
        params.push(enforcedOffset);
      }
    }

    if (this.dbType === 'mysql' && this.mysqlPool) {
      // Use query() for dynamic queries with variable parameters
      const [rows] = await this.mysqlPool.query(query, params);
      return (rows as any[]).map(row => this.mapToPost(row));
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, params);
      return result.rows.map(row => this.mapToPost(row));
    }
    return [];
  }

  // Reactions
  async addReaction(reaction: Reaction): Promise<void> {
    const query = this.dbType === 'mysql'
      ? `INSERT INTO reactions (id, post_id, user_id, reaction_type, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE reaction_type = VALUES(reaction_type), created_at = VALUES(created_at)`
      : `INSERT INTO reactions (id, post_id, user_id, reaction_type, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (post_id, user_id, reaction_type) DO UPDATE SET reaction_type = EXCLUDED.reaction_type, created_at = EXCLUDED.created_at`;

    const params = [
      reaction.id,
      reaction.post_id,
      reaction.user_id,
      reaction.reaction_type,
      reaction.created_at
    ];

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async removeReaction(postId: string, userId: string, reactionType: ReactionType): Promise<void> {
    const query = this.dbType === 'mysql'
      ? 'DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND reaction_type = ?'
      : 'DELETE FROM reactions WHERE post_id = $1 AND user_id = $2 AND reaction_type = $3';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, [postId, userId, reactionType]);
    } else if (this.pgPool) {
      await this.pgPool.query(query, [postId, userId, reactionType]);
    }
  }

  async getReactions(postId: string): Promise<Reaction[]> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM reactions WHERE post_id = ? ORDER BY created_at DESC'
      : 'SELECT * FROM reactions WHERE post_id = $1 ORDER BY created_at DESC';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [postId]);
      return (rows as any[]).map(row => this.mapToReaction(row));
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [postId]);
      return result.rows.map(row => this.mapToReaction(row));
    }
    return [];
  }

  async getUserReaction(postId: string, userId: string): Promise<Reaction | null> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM reactions WHERE post_id = ? AND user_id = ? LIMIT 1'
      : 'SELECT * FROM reactions WHERE post_id = $1 AND user_id = $2 LIMIT 1';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [postId, userId]);
      const reactions = rows as any[];
      return reactions.length > 0 ? this.mapToReaction(reactions[0]) : null;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [postId, userId]);
      return result.rows.length > 0 ? this.mapToReaction(result.rows[0]) : null;
    }
    return null;
  }

  // Comments
  async addComment(comment: Comment): Promise<void> {
    const query = this.dbType === 'mysql'
      ? `INSERT INTO comments (id, post_id, user_id, content, parent_comment_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      : `INSERT INTO comments (id, post_id, user_id, content, parent_comment_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`;

    const params = [
      comment.id,
      comment.post_id,
      comment.user_id,
      comment.content,
      comment.parent_comment_id || null,
      comment.created_at,
      comment.updated_at
    ];

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, params);
    } else if (this.pgPool) {
      await this.pgPool.query(query, params);
    }
  }

  async getComment(commentId: string): Promise<Comment | null> {
    const query = this.dbType === 'mysql'
      ? 'SELECT * FROM comments WHERE id = ? AND deleted_at IS NULL'
      : 'SELECT * FROM comments WHERE id = $1 AND deleted_at IS NULL';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      const [rows] = await this.mysqlPool.execute(query, [commentId]);
      const comments = rows as any[];
      return comments.length > 0 ? this.mapToComment(comments[0]) : null;
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, [commentId]);
      return result.rows.length > 0 ? this.mapToComment(result.rows[0]) : null;
    }
    return null;
  }

  async deleteComment(commentId: string): Promise<void> {
    const query = this.dbType === 'mysql'
      ? 'UPDATE comments SET deleted_at = NOW() WHERE id = ?'
      : 'UPDATE comments SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1';

    if (this.dbType === 'mysql' && this.mysqlPool) {
      await this.mysqlPool.execute(query, [commentId]);
    } else if (this.pgPool) {
      await this.pgPool.query(query, [commentId]);
    }
  }

  async getComments(postId: string, limit?: number, offset?: number): Promise<Comment[]> {
    let query = this.dbType === 'mysql'
      ? 'SELECT * FROM comments WHERE post_id = ? AND deleted_at IS NULL ORDER BY created_at ASC'
      : 'SELECT * FROM comments WHERE post_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC';
    const params: any[] = [postId];
    let paramIndex = 2;

    if (limit !== undefined && limit > 0) {
      if (this.dbType === 'mysql') {
        query += ' LIMIT ?';
        params.push(limit);
      } else {
        query += ` LIMIT $${paramIndex++}`;
        params.push(limit);
      }
    }
    if (offset !== undefined && offset > 0) {
      if (this.dbType === 'mysql') {
        query += ' OFFSET ?';
        params.push(offset);
      } else {
        query += ` OFFSET $${paramIndex++}`;
        params.push(offset);
      }
    }

    if (this.dbType === 'mysql' && this.mysqlPool) {
      // Use query() for dynamic queries with variable parameters
      const [rows] = await this.mysqlPool.query(query, params);
      return (rows as any[]).map(row => this.mapToComment(row));
    } else if (this.pgPool) {
      const result = await this.pgPool.query(query, params);
      return result.rows.map(row => this.mapToComment(row));
    }
    return [];
  }

  // Helper mappers
  private mapToPost(row: any): Post {
    return {
      id: row.id,
      user_id: row.user_id || row.userId,
      content: row.content,
      media_url: row.media_url || row.mediaUrl,
      media_type: row.media_type || row.mediaType,
      is_prayer_request: row.is_prayer_request || row.isPrayerRequest || false,
      edification_score: parseFloat(row.edification_score || row.edificationScore || '0'),
      feed_type: (row.feed_type || row.feedType) as FeedType,
      visibility: (row.visibility) as any,
      created_at: new Date(row.created_at || row.createdAt),
      updated_at: new Date(row.updated_at || row.updatedAt),
      deleted_at: row.deleted_at ? new Date(row.deleted_at) : undefined
    };
  }

  private mapToReaction(row: any): Reaction {
    return {
      id: row.id,
      post_id: row.post_id || row.postId,
      user_id: row.user_id || row.userId,
      reaction_type: (row.reaction_type || row.reactionType) as ReactionType,
      created_at: new Date(row.created_at || row.createdAt)
    };
  }

  private mapToComment(row: any): Comment {
    return {
      id: row.id,
      post_id: row.post_id || row.postId,
      user_id: row.user_id || row.userId,
      content: row.content,
      parent_comment_id: row.parent_comment_id || row.parentCommentId,
      created_at: new Date(row.created_at || row.createdAt),
      updated_at: new Date(row.updated_at || row.updatedAt),
      deleted_at: row.deleted_at ? new Date(row.deleted_at) : undefined
    };
  }
}

