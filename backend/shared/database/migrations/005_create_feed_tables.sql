-- Migration: Create feed tables
-- Supports both MySQL and PostgreSQL
-- Version: 005
-- Description: Tables for posts, reactions, comments, and feed types

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    media_url VARCHAR(500) NULL, -- S3 URL for images
    media_type VARCHAR(50) NULL, -- 'image', 'video', etc.
    is_prayer_request BOOLEAN DEFAULT FALSE,
    edification_score DECIMAL(5,2) DEFAULT 0.00, -- Stub for now
    feed_type VARCHAR(20) DEFAULT 'primary', -- 'primary', 'discovery', 'prayer'
    visibility VARCHAR(20) DEFAULT 'public', -- 'public', 'followers', 'private'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_posts_user_id (user_id),
    INDEX idx_posts_feed_type (feed_type),
    INDEX idx_posts_is_prayer_request (is_prayer_request),
    INDEX idx_posts_created_at (created_at),
    INDEX idx_posts_deleted_at (deleted_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    reaction_type VARCHAR(20) NOT NULL, -- 'like', 'love', 'prayer', 'amen', etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_post_reaction (post_id, user_id, reaction_type),
    INDEX idx_reactions_post_id (post_id),
    INDEX idx_reactions_user_id (user_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id VARCHAR(36) NULL, -- For nested comments/replies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,

    INDEX idx_comments_post_id (post_id),
    INDEX idx_comments_user_id (user_id),
    INDEX idx_comments_parent_comment_id (parent_comment_id),
    INDEX idx_comments_created_at (created_at),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE
);

