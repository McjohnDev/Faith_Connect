/**
 * Feed Routes
 */

import { Router } from 'express';
import {
  createPost,
  getPost,
  updatePost,
  deletePost,
  listPosts,
  addReaction,
  removeReaction,
  addComment,
  deleteComment,
  getComments,
  getReactions
} from '../controllers/feed.controller';
import { validateRequest } from '../middleware/validation';
import { rateLimiter } from '../middleware/rateLimiter';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Post routes
router.post(
  '/posts',
  rateLimiter.createPost,
  validateRequest('createPost'),
  createPost
);

router.get(
  '/posts',
  rateLimiter.listPosts,
  listPosts
);

router.get(
  '/posts/:postId',
  rateLimiter.getPost,
  getPost
);

router.put(
  '/posts/:postId',
  rateLimiter.createPost, // Reuse create rate limit
  validateRequest('updatePost'),
  updatePost
);

router.delete(
  '/posts/:postId',
  rateLimiter.createPost, // Reuse create rate limit
  deletePost
);

// Reaction routes
router.post(
  '/posts/:postId/reactions',
  rateLimiter.addReaction,
  validateRequest('addReaction'),
  addReaction
);

router.delete(
  '/posts/:postId/reactions',
  rateLimiter.addReaction,
  removeReaction
);

router.get(
  '/posts/:postId/reactions',
  rateLimiter.getPost,
  getReactions
);

// Comment routes
router.post(
  '/posts/:postId/comments',
  rateLimiter.addComment,
  validateRequest('addComment'),
  addComment
);

router.delete(
  '/comments/:commentId',
  rateLimiter.addComment,
  deleteComment
);

router.get(
  '/posts/:postId/comments',
  rateLimiter.getPost,
  getComments
);

export default router;

