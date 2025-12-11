# FaithConnect Sprints & Implementation Stories
Version: 0.1  
Scope: 6 sprints (2w each), live service prioritized  
DB: MySQL (test), PostgreSQL (prod)  
Auth: Phone OTP-only (WhatsApp style); email only for export/recovery  

## Sprint 1 — Live Prayer Foundations (P0)
- Story: Implement phone OTP auth flow (register/verify/resend/login) with rate limits, age gate ≥13, Guidelines acceptance; device cap; JWT/refresh rotation; revoke on logout.
- Story: Scaffold Meetings service (Node) with Agora audio-only join/leave; roles host/co-host/speaker/listener/music_host; mute/unmute; raise hand; lock/remove.
- Story: Meetings WebSocket events (join/leave/hand/recording/music/screen placeholders) wired to gateway and client.
- Story: Background music MVP: start/stop/volume API + client controls; ensure recording pipeline stub includes music.
- Story: Screen/resource share API hooks (start/stop/share resource) with client stubs.
- Story: Observability bootstrap: logging/tracing/metrics for Auth + Meetings; Agora QoS ingest; dashboards (auth rate limits, join success, RTT).

## Sprint 2 — Live Prayer UX + Reliability (P0)
- Story: Client UI/UX for meeting controls, participant list, hand raise, highlight speaker.
- Story: Network adaptation & reconnect: audio-priority fallback; resume on reconnect; handle packet loss.
- Story: Recording to S3 end-to-end; playback listing endpoint + client surface.
- Story: Notifications: meeting reminder + “meeting started” push/in-app; quiet hours respected.
- Story: Load/perf harness for meetings; chaos tests (drop/rejoin, packet loss).

## Sprint 3 — Feed/Chat Hardening + Offline (P0/P1)
- Story: Feed service CRUD (text/image), reactions, comments; prayer request flag; edification score stub; primary/discovery/prayer feeds.
- Story: Chat DM/group baseline (text/image), read receipts, typing, delivery status; media upload path; retry on failure.
- Story: Offline cache for feed (last 50 posts) and retry queue for chat sends.
- Story: E2EE 1:1 scaffold (Signal) behind flag.
- Story: Content report endpoint + minimal admin view.

## Sprint 4 — Creator MVP + Payments Skeleton (P1)
- Story: Creator apply/review workflow; admin review queue.
- Story: Upload flows for music albums and resource packs (S3, AV scan, metadata).
- Story: Marketplace browse/purchase (sandbox payments); receipt persistence.
- Story: Payments abstraction: Stripe Connect + IAP placeholder; subscription status check API.
- Story: Creator notifications (published/purchase/payout); basic revenue dashboard.

## Sprint 5 — Moderation & Safety (P1)
- Story: Reporting flows end-to-end; admin actions (warn/suspend/ban/hide/delete); strikes with expiry.
- Story: AI scans inline (Perspective, Rekognition); blocklists; spam throttles (rate limits per endpoint).
- Story: Audit logging for admin/mod actions; transparency stats endpoint.
- Story: Appeals flow with ≤48h SLA hooks.

## Sprint 6 — QA/Perf/Stabilization (P0/P1)
- Story: E2E automation passes (Detox mobile, Cypress web admin) for critical paths: OTP onboarding, live meeting, chat send, feed post, report→action, creator purchase.
- Story: Load/stress for meetings, chat, feed; perf tuning to targets (feed <2s, chat <100ms, prayer RTT <150ms).
- Story: Accessibility pass (VoiceOver/TalkBack, text scaling, contrast) on key screens.
- Story: Localization hooks (EN/ES/PT/FR) and regression burn-down.

## Start Implementation Checklist
- Create tickets per story with owners/acceptance criteria.
- Enable feature flags: meetings/music/screen share; creator marketplace; ads.
- CI: dual DB matrix (MySQL test, PostgreSQL prod) for migrations; lint/test.
- Set up QoS dashboards (Auth/OTP, Meetings join success, RTT, packet loss, recording success).
- Seed env configs: Agora keys, S3 buckets, Redis, Mongo, Elasticsearch, Stripe sandbox.

