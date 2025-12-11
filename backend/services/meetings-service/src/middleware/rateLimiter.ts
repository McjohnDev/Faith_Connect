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
  createMeeting: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 meetings per 15 minutes
    message: 'Too many meetings created, please try again later',
    keyGenerator
  }),

  listMeetings: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many requests, please try again later',
    keyGenerator
  }),

  getMeeting: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    message: 'Too many requests, please try again later',
    keyGenerator
  }),

  joinMeeting: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20,
    message: 'Too many join attempts, please try again later',
    keyGenerator
  }),

  leaveMeeting: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: 'Too many requests, please try again later',
    keyGenerator
  }),

  raiseHand: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: 'Too many requests, please try again later',
    keyGenerator
  }),

  controlMeeting: rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: 'Too many control actions, please try again later',
    keyGenerator
  })
};

