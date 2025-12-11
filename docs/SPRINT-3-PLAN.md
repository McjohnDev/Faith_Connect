# Sprint 3 - Feed/Chat Hardening + Offline

**Status:** 🚧 In Progress  
**Duration:** 2 weeks  
**Priority:** P0/P1

---

## Overview

Sprint 3 focuses on building the core social features of FaithConnect: the Feed service for content sharing and the Chat service for direct messaging. This sprint also adds offline support and content moderation capabilities.

---

## Stories

### 1. Feed Service CRUD (P0)
**Story:** Implement Feed service with CRUD operations for posts (text/image), reactions, comments, prayer request flag, edification score stub, and multiple feed types (primary/discovery/prayer).

**Acceptance Criteria:**
- ✅ Create post endpoint (text/image)
- ✅ Get post by ID
- ✅ Update post (author only)
- ✅ Delete post (author or admin)
- ✅ List posts with pagination
- ✅ Add reaction (like, love, prayer, etc.)
- ✅ Remove reaction
- ✅ Add comment
- ✅ Delete comment (author or admin)
- ✅ Flag post as prayer request
- ✅ Edification score calculation stub
- ✅ Feed types: primary (following), discovery (all), prayer (prayer requests)
- ✅ Database migrations for posts, reactions, comments
- ✅ Image upload to S3
- ✅ Validation and error handling

**Technical Details:**
- Service: `backend/services/feed-service/`
- Database: MySQL (test) / PostgreSQL (prod)
- Storage: S3 for images
- API: RESTful endpoints
- Authentication: JWT middleware

---

### 2. Chat Service Baseline (P0)
**Story:** Implement Chat service with DM/group messaging (text/image), read receipts, typing indicators, delivery status, media upload path, and retry on failure.

**Acceptance Criteria:**
- ✅ Create conversation (1:1 or group)
- ✅ Send message (text/image)
- ✅ Get conversation messages with pagination
- ✅ Read receipts (mark as read)
- ✅ Typing indicators (start/stop typing)
- ✅ Delivery status (sent, delivered, read)
- ✅ Media upload to S3
- ✅ Retry queue for failed sends
- ✅ WebSocket events for real-time messaging
- ✅ Database migrations for conversations, messages, read receipts
- ✅ Validation and error handling

**Technical Details:**
- Service: `backend/services/chat-service/`
- Database: MySQL (test) / PostgreSQL (prod)
- Storage: S3 for media
- Real-time: Socket.io for WebSocket events
- API: RESTful endpoints + WebSocket
- Authentication: JWT middleware

---

### 3. Offline Support (P1)
**Story:** Implement offline cache for feed (last 50 posts) and retry queue for chat sends.

**Acceptance Criteria:**
- ✅ Feed cache: Store last 50 posts locally
- ✅ Feed cache: Sync on reconnect
- ✅ Chat retry queue: Queue failed sends
- ✅ Chat retry queue: Retry on reconnect
- ✅ Cache invalidation strategy
- ✅ Conflict resolution (server wins)
- ✅ Database schema for offline cache
- ✅ Client-side implementation guide

**Technical Details:**
- Cache: Redis for server-side, SQLite for client-side
- Retry: Exponential backoff
- Sync: Background job on reconnect

---

### 4. E2EE Scaffold (P1)
**Story:** Implement end-to-end encryption scaffold for 1:1 chats (Signal-style) behind feature flag.

**Acceptance Criteria:**
- ✅ E2EE feature flag (env variable)
- ✅ Key exchange protocol stub
- ✅ Message encryption/decryption stub
- ✅ Key storage (encrypted at rest)
- ✅ Forward secrecy stub
- ✅ Database schema for keys
- ✅ API endpoints for key exchange
- ✅ Documentation for implementation

**Technical Details:**
- Encryption: libsodium (Signal Protocol)
- Feature Flag: `ENABLE_E2EE=true/false`
- Keys: Stored encrypted in database
- Protocol: Double Ratchet (stub)

---

### 5. Content Reporting (P0)
**Story:** Implement content report endpoint and minimal admin view for reports.

**Acceptance Criteria:**
- ✅ Report content endpoint (post, message, user)
- ✅ Report types (spam, harassment, inappropriate, etc.)
- ✅ Report metadata (reason, context)
- ✅ Database schema for reports
- ✅ Admin API: List reports
- ✅ Admin API: Get report details
- ✅ Admin API: Resolve report (dismiss/action)
- ✅ Minimal admin view (web page or API docs)
- ✅ Validation and error handling

**Technical Details:**
- Service: `backend/services/moderation-service/` (or extend existing)
- Database: MySQL (test) / PostgreSQL (prod)
- API: RESTful endpoints
- Authentication: Admin JWT middleware

---

## Implementation Order

1. **Feed Service** (Foundation)
   - Database migrations
   - CRUD operations
   - Reactions and comments
   - Feed types

2. **Chat Service** (Foundation)
   - Database migrations
   - DM/group messaging
   - Read receipts and typing
   - WebSocket events

3. **Content Reporting** (Moderation)
   - Report endpoint
   - Admin view

4. **Offline Support** (Enhancement)
   - Feed cache
   - Chat retry queue

5. **E2EE Scaffold** (Security)
   - Feature flag
   - Key exchange stub
   - Encryption stub

---

## Database Migrations

### Feed Service
- `005_create_feed_tables.sql` - Posts, reactions, comments

### Chat Service
- `006_create_chat_tables.sql` - Conversations, messages, read receipts, typing indicators

### Moderation Service
- `007_create_moderation_tables.sql` - Reports, report actions

### Offline Support
- `008_create_offline_cache_tables.sql` - Offline cache, retry queue

### E2EE
- `009_create_e2ee_tables.sql` - Encryption keys, key exchanges

---

## API Endpoints

### Feed Service
```
POST   /api/v1/feed/posts              - Create post
GET    /api/v1/feed/posts/:id           - Get post
PUT    /api/v1/feed/posts/:id           - Update post
DELETE /api/v1/feed/posts/:id           - Delete post
GET    /api/v1/feed/posts                - List posts (primary/discovery/prayer)
POST   /api/v1/feed/posts/:id/reactions - Add reaction
DELETE /api/v1/feed/posts/:id/reactions/:reactionId - Remove reaction
POST   /api/v1/feed/posts/:id/comments  - Add comment
DELETE /api/v1/feed/posts/:id/comments/:commentId - Delete comment
POST   /api/v1/feed/posts/:id/prayer-request - Flag as prayer request
```

### Chat Service
```
POST   /api/v1/chat/conversations      - Create conversation
GET    /api/v1/chat/conversations       - List conversations
GET    /api/v1/chat/conversations/:id   - Get conversation
POST   /api/v1/chat/conversations/:id/messages - Send message
GET    /api/v1/chat/conversations/:id/messages - Get messages
PUT    /api/v1/chat/conversations/:id/read - Mark as read
POST   /api/v1/chat/conversations/:id/typing - Start typing
DELETE /api/v1/chat/conversations/:id/typing - Stop typing
```

### Moderation Service
```
POST   /api/v1/moderation/reports       - Report content
GET    /api/v1/moderation/reports       - List reports (admin)
GET    /api/v1/moderation/reports/:id   - Get report (admin)
PUT    /api/v1/moderation/reports/:id/resolve - Resolve report (admin)
```

---

## WebSocket Events

### Chat Service
- `chat:message` - New message received
- `chat:typing` - User typing
- `chat:read` - Message read
- `chat:delivered` - Message delivered
- `chat:error` - Send error

---

## Testing Requirements

### Unit Tests
- Feed CRUD operations
- Chat messaging
- Offline cache
- E2EE key exchange

### Integration Tests
- Feed with reactions/comments
- Chat with read receipts
- Offline sync
- Content reporting

### Load Tests
- Feed pagination performance
- Chat message throughput
- Offline sync performance

---

## Documentation

- Feed Service README
- Chat Service README
- Offline Support Guide
- E2EE Implementation Guide
- Content Reporting Guide
- API Documentation

---

## Success Metrics

- ✅ Feed Service: All CRUD operations working
- ✅ Chat Service: Real-time messaging working
- ✅ Offline: Cache and retry queue functional
- ✅ E2EE: Scaffold in place (behind flag)
- ✅ Reporting: Content reports can be created and viewed

---

**Last Updated:** 2025-12-11

