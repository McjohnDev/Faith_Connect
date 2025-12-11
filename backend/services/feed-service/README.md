# Feed Service

Social Feed Service for FaithConnect - Posts, Reactions, and Comments

## Features

- ✅ Create, read, update, delete posts
- ✅ Text and image posts
- ✅ Reactions (like, love, prayer, amen, support)
- ✅ Comments with nested replies
- ✅ Prayer request flagging
- ✅ Edification score calculation (stub)
- ✅ Feed types (primary, discovery, prayer)
- ✅ Post visibility (public, followers, private)
- ✅ Image upload to S3
- ✅ Prometheus `/metrics` endpoint

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp env.docker.example .env

# Edit .env with your credentials:
# - Database credentials (MySQL/PostgreSQL)
# - AWS S3 credentials (for image uploads)
# - JWT secret

# Run migrations (create tables)
# See backend/shared/database/migrations/005_create_feed_tables.sql

# Run in development
npm run dev

# Build
npm run build

# Run production
npm start
```

## API Endpoints

### Posts

- `POST /api/v1/feed/posts` - Create post
  - Body: `{ content, media_url?, media_type?, is_prayer_request?, feed_type?, visibility? }`
- `GET /api/v1/feed/posts` - List posts
  - Query: `?feed_type=primary&user_id=xxx&is_prayer_request=true&limit=20&offset=0`
- `GET /api/v1/feed/posts/:postId` - Get post
- `PUT /api/v1/feed/posts/:postId` - Update post
- `DELETE /api/v1/feed/posts/:postId` - Delete post

### Reactions

- `POST /api/v1/feed/posts/:postId/reactions` - Add reaction
  - Body: `{ reaction_type: "like" | "love" | "prayer" | "amen" | "support" }`
- `DELETE /api/v1/feed/posts/:postId/reactions?reaction_type=like` - Remove reaction
- `GET /api/v1/feed/posts/:postId/reactions` - Get reactions

### Comments

- `POST /api/v1/feed/posts/:postId/comments` - Add comment
  - Body: `{ content, parent_comment_id? }`
- `DELETE /api/v1/feed/posts/:postId/comments/:commentId` - Delete comment
- `GET /api/v1/feed/posts/:postId/comments` - Get comments
  - Query: `?limit=50&offset=0`

## Database

- **Test**: MySQL
- **Production**: PostgreSQL

Tables:
- `posts` - Post content and metadata
- `reactions` - User reactions to posts
- `comments` - Comments and nested replies

## Rate Limits

- Create post: 20 per 15 minutes
- List posts: 60 per minute
- Add reaction: 50 per minute
- Add comment: 30 per minute

## Authentication

All endpoints require authentication via:
- `Authorization: Bearer <token>` header, or
- `X-User-Id: <userId>` header (for testing)

## Feed Types

- `primary` - Following feed (default)
- `discovery` - All posts
- `prayer` - Prayer requests only

## Edification Score

Currently a stub implementation. In production, this would use ML/NLP to analyze content quality and spiritual value.

---

**Last Updated:** 2025-12-11

