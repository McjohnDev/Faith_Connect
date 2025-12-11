/**
 * Rate Limiting Middleware
 */

import rateLimit from 'express-rate-limit';

const keyGenerator = (req: any): string => {
  const user = req.user;
  const ip = Array.isArray(req.headers['x-forwarded-for'])
    ? req.headers['x-forwarded-for'][0]
    : req.headers['x-forwarded-for'] || req.ip;
  
  return user?.id ? `user:${user.id}` : `ip:${ip}`;
};

export const rateLimiter = {
  createPost: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 posts per 15 minutes
    message: 'Too many posts created, please try again later',
    keyGenerator
  }),

  listPosts: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
    message: 'Too many requests, please try again later',
    keyGenerator
  }),

  getPost: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later',
    keyGenerator
  }),

  addReaction: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: 'Too many reactions, please try again later',
    keyGenerator
  }),

  addComment: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: 'Too many comments, please try again later',
    keyGenerator
  })
};

