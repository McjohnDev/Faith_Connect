/**
 * Feed Types
 */

export enum FeedType {
  PRIMARY = 'primary',      // Following feed
  DISCOVERY = 'discovery',  // All posts
  PRAYER = 'prayer'         // Prayer requests only
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  PRAYER = 'prayer',
  AMEN = 'amen',
  SUPPORT = 'support'
}

export enum PostVisibility {
  PUBLIC = 'public',
  FOLLOWERS = 'followers',
  PRIVATE = 'private'
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  media_type?: string;
  is_prayer_request: boolean;
  edification_score: number;
  feed_type: FeedType;
  visibility: PostVisibility;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface Reaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: Date;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface CreatePostDto {
  content: string;
  media_url?: string;
  media_type?: string;
  is_prayer_request?: boolean;
  feed_type?: FeedType;
  visibility?: PostVisibility;
}

export interface UpdatePostDto {
  content?: string;
  media_url?: string;
  media_type?: string;
  is_prayer_request?: boolean;
  visibility?: PostVisibility;
}

export interface AddReactionDto {
  reaction_type: ReactionType;
}

export interface AddCommentDto {
  content: string;
  parent_comment_id?: string;
}

export interface ListPostsFilters {
  feed_type?: FeedType;
  user_id?: string;
  is_prayer_request?: boolean;
  limit?: number;
  offset?: number;
}

export interface PostWithStats extends Post {
  reaction_count?: number;
  comment_count?: number;
  user_reaction?: ReactionType;
}

