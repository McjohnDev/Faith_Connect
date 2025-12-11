# FaithConnect Functional Requirements (Base)

Version: 2.0-unified (Dec 2025)  
Status: Draft for engineering kickoff  
Authors: Product, Engineering, Design, Architecture  
Note: Corrections applied — Test DB = MySQL, Prod DB = PostgreSQL; phone-number OTP auth (WhatsApp style); email is only for data export/recovery to Drive (not for auth).

## 1) Purpose & Scope
- Single source of truth for MVP → Phase 3 features across Mobile (React Native) and Web Admin (Next.js).
- Guides engineering, design, QA, moderation, and go-to-market.

## 2) Architecture (High-Level)
- Mobile: React Native 0.72+, Redux Toolkit/RTK Query + Persist, React Navigation 6, Formik/Yup, Axios, Socket.io-client, WatermelonDB/SQLite.
- Web Admin: Next.js + TypeScript + React Query, RBAC.
- Backend: Node.js 18 microservices (Auth, User, Feed, Chat, Bible, Moderation, Payment, Notification, Creator/Marketplace) behind Kong/Nginx gateway.
- Data:
  - Relational: **MySQL (test), PostgreSQL (prod)** via ORM migrations compatible with both.
  - MongoDB (posts, messages, UGC, logs), Redis (cache/sessions/rate limits/queues), Elasticsearch (search), S3 + CloudFront (media/recordings/downloads).
- Realtime: Socket.io; Agora for live prayer; WebSockets for messaging/presence.

## 3) Core Functional Requirements (P0/P1 focus)

### Auth & Identity (P0)
- Phone-number-first signup/login with OTP (WhatsApp style); age gate ≥13 before OTP send.
- Mandatory Community Guidelines acceptance with timestamp.
- JWT access (15m) + rotating refresh; revoke on logout; max 5 devices.
- Optional 2FA (SMS/email/TOTP) for premium/leaders. Biometric app unlock.
- Profile creation: display name, bio, denomination, interests, church, profile photo.
- Email only used for export/recovery (not for auth/login).

### Profiles & Social Graph (P0/P1)
- View/edit profile; privacy settings; block; deactivate/delete; data export (email delivery to Drive link).
- Connection models: Follow + Friend; suggestions; church verification badge.

### Feed & Posts (P0/P1)
- Post types: text, image, video, verse card, link, mixed. Limits: text 5k chars; images up to 10×10MB; video 2min/50MB with auto-compress.
- Composer: mentions, hashtags, verse picker, per-post visibility (public/friends/private/group/custom), autosave drafts.
- Interactions: faith reactions set, nested comments (3 levels), shares, save/collections, report, hide/mute.
- Feeds: primary (chronological + bump), discovery, prayer-priority, friends-only; Edification Score; offline cache; pull-to-refresh; infinite scroll.

### Chat & Live Prayer (P0/P1)
- DM & groups (≤1,000); replies/forwards/edit/delete; voice notes; file send; read receipts; typing; delivery; search (premium).
- E2EE for 1:1 (Signal); optional for groups.
- Live Prayer Meetings (Agora):
  - Roles: host, co-host, speaker, listener, **music_host**.
  - Capacity: up to 2,500 participants on all tiers (not paywalled).
  - Controls: mute/unmute all, lock, remove, raise hand, highlight speaker, assign music host.
  - Background music: host/co-host can play MP3/stream; persists on joins; included in recording.
  - Screen share & resource share (PDF/images) to participants.
  - Recording to S3; breakout rooms (premium); network adaptation.

### Bible & Study Tools (P0/P1)
- Reader: 15+ translations, parallel view, TTS, offline downloads, verse actions (highlight, bookmark, note, share, verse image), deep links.
- Study: search (<500ms local), cross-references, commentaries (premium), lexicon (P2), notes/highlights/bookmarks management.
- Reading plans: preset/custom/group; streaks; reminders; share progress. Verse of the Day with history and preferred translation.

### Quiet Time (P0/P1)
- Journal: rich text, images (≤5), moods, tags, verse embeds, templates, reminders, search; export (premium); optional sharing.
- Personal prayer list: add/edit/delete, urgency, mark prayed, answered log, reminders.
- Community Prayer Wall: anonymous/named, pray button, comments, answered flag, category filters.

### Groups (P0/P1)
- Public/private/secret groups; roles (admin/mod/member); group feed + group chat; invite links/QR; approvals; announcements; events (RSVP); resources (P2).

### Notifications (P0)
- Push (FCM/APNs), in-app; quiet hours; category toggles. Badge counts.
- Email only for export/recovery. Creator notifications: publish, purchase, payout, ad approved.

### Moderation & Safety (P0/P1)
- AI text (Perspective) + image (Rekognition) scanning; blocklists; spam detection.
- Reporting, admin queue, actions (warn/suspend/ban/hide/delete), strikes (3), appeals.
- Creator content review (music/resources/ads); copyright checks; ad review SLA 24h.

### Payments, Subscriptions, Creator Program (P1)
- Plans: Free / FaithPlus / FaithPro (meeting capacity free for all).
- Revenue: premium tools, creator marketplace (music/resource packs), ads, IAP (gifts, storage).
- Creator Program: apply/review; upload prayer music albums & resource packs; marketplace browse/purchase; payouts (Stripe Connect); dashboards/analytics; promotions later.

## 4) Non-Functional Requirements (Essentials)
- Performance: cold start <2s; feed load <2s on 4G; chat <100ms; prayer latency <150ms; API p95 <500ms.
- Security: TLS 1.3; bcrypt 12r; JWT rotation; rate limits; sanitization; CSP/XSS/CSRF; AV scan uploads; RBAC; audit logs; least privilege; privacy by design.
- Reliability: 99.9% uptime; RPO 1h; RTO 4h; PITR; backups; blue-green/canary deploy.
- Accessibility: WCAG 2.1 AA; screen readers; text scaling; contrast; motor accessibility; localization (EN/ES/PT/FR); offline mode for core features.
- Compatibility: iOS ≥14; Android ≥8; modern desktop browsers.

## 5) Data & Storage (Key Models)
- Relational (MySQL test / PostgreSQL prod): users, privacy, friendships, follows, subscriptions/payments, groups/members, reading_plan_progress, audit_logs, analytics_events, purchases, payouts.
- MongoDB: posts, comments, conversations, messages, highlights, bookmarks, study_notes, devotionals, prayer_list, prayer_wall, meetings, notifications, content_reports, user_sessions, creator_profiles, music_albums, resource_packs, ad_campaigns, purchases, payouts.
- Redis: sessions, rate limits, feed caches, presence, queues.
- Elasticsearch: users/posts/bible indices.
- S3/CloudFront: media, recordings, downloads, creator assets.

## 6) API Surfaces (Condensed)
- Auth: phone register/verify/resend OTP, login, refresh, logout, change password, 2FA setup/verify.
- Users: profile CRUD, photo upload/delete, friends/follows/block, suggestions, search, export (email link).
- Feed/Posts: feed (primary/discovery/prayer), CRUD, react, comments, share, save, report, hide.
- Chat/Meetings: conversations/messages CRUD, pin/mute/leave/read/search; meetings CRUD/join/leave/recording; music start/stop/volume; screenshare start/stop; resource share.
- Bible: translations, books/chapters/verses, download, highlights/bookmarks/notes, reading plans, VOTD.
- Quiet Time: devotionals CRUD, prayer list CRUD/prayed, prayer wall CRUD/pray/answered.
- Groups: search/create/update/join/approve/members/admins/invite-link/settings.
- Moderation (admin): reports queue/review, user actions, content hide/delete, moderation stats.
- Payments/Subscriptions: plans, status, subscribe/cancel/restore; purchases (IAP, resource packs, music).
- Creator: apply/profile, music albums, resource packs, ads, publish/submit, dashboard, analytics, payouts; marketplace browse/purchase.
- Notifications: list/read/read-all, settings update.
- WebSocket events: chat (sent/delivered/read/typing/presence), feed (post/react/comment), prayer meetings (participant events, hand raise, recording, music control, screenshare), notifications.

## 7) Phases (Adjusted)
- Phase 1 (Months 1–4): Auth (phone OTP), profiles, feed (text/image), basic DM, basic groups, Bible (5 versions), push, admin v1, CI/CD.
- Phase 2 (Months 5–8): Live prayer (audio→video), edification feed, video posts, prayer wall, study tools, reading plans (40+), in-app notifications, creator MVP (apply/upload/review, marketplace browse/purchase), revenue dashboard basic. Public launch v2.0.
- Phase 3 (Months 9–12): Advanced creator tools, ads portal, premium features, breakout rooms, analytics dashboards, localization, performance/scaling. v2.5.

## 8) Testing & QA (Targets)
- Unit ≥80% (100% auth/payment); integration for all APIs; E2E mobile (Detox) and web admin (Cypress) for critical flows.
- Performance/load/stress/spike; accessibility audits; security (OWASP, pentest); beta program staged.

## 9) Open Risks/Assumptions
- Dual-DB migrations must be validated in CI (MySQL) and staging/prod (PostgreSQL).
- E2EE for groups may be scoped to later if schedule risk.
- Creator review bandwidth and copyright detection must be staffed/tooling-ready.

## 10) What’s Next (Execution Plan)
1) **Finalize API contracts** per module and publish OpenAPI/WS event maps.  
2) **DB migration strategy**: author Prisma/TypeORM schemas to run on MySQL (test) and PostgreSQL (prod); add CI jobs for both engines.  
3) **Service decomposition & tickets**: break down P0/P1 items by service (Auth, Feed, Chat/Meetings, Bible, Quiet Time, Groups, Moderation, Creator/Payments).  
4) **Delivery plan**: lock Phase 1 scope to P0; create sprint board with dependencies; add feature flags (prayer meetings, creator marketplace, ads).  
5) **Security & compliance**: document DPIA, data export/recovery (email-only) flow, and age-gating/COPPA handling.  
6) **Observability**: define dashboards/alerts (API p95, chat latency, prayer QoS, crash rate).  
7) **QA plan**: define E2E scenarios, device matrix, accessibility checks, load/perf thresholds; add synthetic tests for OTP and live prayer flows.  
8) **Go-to-market**: align creator onboarding timeline and moderation staffing; comms for “prayer meetings not paywalled” positioning.

