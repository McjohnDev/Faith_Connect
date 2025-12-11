/**
 * FaithConnect Jira Ticket Creator
 * Creates all sprint tickets in Jira via REST API
 * 
 * Usage:
 *   node scripts/create-jira-tickets.js
 * 
 * Requires:
 *   - JIRA_BASE_URL (e.g., https://mcjohndev743.atlassian.net)
 *   - JIRA_EMAIL (your email)
 *   - JIRA_API_TOKEN (from https://id.atlassian.com/manage-profile/security/api-tokens)
 *   - JIRA_PROJECT_KEY (e.g., FC)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(__dirname, '..', 'jira-config.json');
let config = {};

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} else {
  console.error('❌ jira-config.json not found. Please create it first.');
  process.exit(1);
}

const {
  JIRA_BASE_URL = config.JIRA_BASE_URL,
  JIRA_EMAIL = config.JIRA_EMAIL,
  JIRA_API_TOKEN = config.JIRA_API_TOKEN,
  JIRA_ORG_ID = config.JIRA_ORG_ID,
  JIRA_PROJECT_KEY = config.JIRA_PROJECT_KEY || 'FC',
  JIRA_AUTH_METHOD = config.JIRA_AUTH_METHOD || 'bearer' // 'bearer' or 'basic'
} = process.env;

if (!JIRA_BASE_URL || !JIRA_API_TOKEN) {
  console.error('❌ Missing required environment variables or config:');
  console.error('   JIRA_BASE_URL, JIRA_API_TOKEN');
  if (JIRA_AUTH_METHOD === 'basic' && !JIRA_EMAIL) {
    console.error('   JIRA_EMAIL (required for basic auth)');
  }
  process.exit(1);
}

// Auth header - support both Bearer token and Basic auth
let authHeader;
if (JIRA_AUTH_METHOD === 'bearer' && !JIRA_EMAIL) {
  // Bearer token authentication (when no email provided)
  authHeader = `Bearer ${JIRA_API_TOKEN}`;
  console.log('⚠️  Using Bearer token auth. If this fails, try Basic Auth with your email.\n');
} else if (JIRA_EMAIL) {
  // Basic auth (email + API token) - preferred for Jira Cloud
  authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;
  console.log('✅ Using Basic Auth (email + API token)\n');
} else {
  // Fallback to Bearer if no email
  authHeader = `Bearer ${JIRA_API_TOKEN}`;
  console.log('⚠️  No email provided, using Bearer token. This may not work with Jira Cloud API.\n');
}

// All tickets organized by sprint
const tickets = [
  // ========== SPRINT 1 ==========
  {
    sprint: 1,
    title: 'Phone OTP Auth Flow (WhatsApp Style)',
    description: `Implement phone number-based authentication with OTP verification, similar to WhatsApp.

**Requirements:**
- Phone number registration with OTP verification
- Rate limiting per phone number and IP
- Age gate (≥13) before OTP send
- Community Guidelines acceptance (mandatory)
- Device cap (max 5 devices per account)
- JWT access token (15min) + refresh token rotation
- Revoke tokens on logout

**API Endpoints:**
- POST /api/v1/auth/register-phone
- POST /api/v1/auth/verify-phone
- POST /api/v1/auth/resend-otp
- POST /api/v1/auth/login-phone
- POST /api/v1/auth/refresh-token
- POST /api/v1/auth/logout

**Acceptance Criteria:**
- [ ] User can register with phone number
- [ ] OTP sent via SMS (Twilio)
- [ ] OTP verification works
- [ ] Rate limits enforced (5 OTPs/hour per phone)
- [ ] Age gate blocks users <13
- [ ] Guidelines acceptance required before access
- [ ] JWT tokens issued and validated
- [ ] Refresh token rotation implemented
- [ ] Device cap enforced
- [ ] Logout revokes tokens`,
    priority: 'P0',
    component: 'Auth',
    labels: ['sprint-1', 'auth', 'otp', 'p0']
  },
  {
    sprint: 1,
    title: 'Meetings Service Scaffold with Agora Integration',
    description: `Build the core Meetings microservice with Agora.io integration for live prayer meetings.

**Requirements:**
- Node.js service with Express
- Agora.io SDK integration (audio-first)
- Meeting roles: host, co-host, speaker, listener, music_host
- Host controls: mute/unmute, lock meeting, remove participant
- Raise hand functionality
- Meeting state management

**API Endpoints:**
- POST /api/v1/meetings (create)
- GET /api/v1/meetings/:meetingId
- POST /api/v1/meetings/:meetingId/join
- POST /api/v1/meetings/:meetingId/leave
- PUT /api/v1/meetings/:meetingId/participants/:userId/mute
- POST /api/v1/meetings/:meetingId/hand-raise

**Acceptance Criteria:**
- [ ] Service deployed and accessible
- [ ] Agora SDK integrated
- [ ] Audio-only meetings work
- [ ] Roles enforced server-side
- [ ] Host can mute/unmute participants
- [ ] Host can remove participants
- [ ] Raise hand event emitted
- [ ] Meeting state persisted (MongoDB)`,
    priority: 'P0',
    component: 'Meetings',
    labels: ['sprint-1', 'meetings', 'agora', 'p0']
  },
  {
    sprint: 1,
    title: 'Meetings WebSocket Events',
    description: `Implement WebSocket events for real-time meeting updates.

**Events to Emit:**
- meeting:participant-joined
- meeting:participant-left
- meeting:hand-raised
- meeting:hand-lowered
- meeting:host-promoted
- meeting:recording-started
- meeting:recording-stopped
- meeting:music-started
- meeting:music-stopped
- meeting:screenshare-started
- meeting:screenshare-stopped

**Requirements:**
- Socket.io integration
- JWT authentication for WebSocket connections
- Heartbeat/timeout handling
- Event broadcasting to all participants

**Acceptance Criteria:**
- [ ] WebSocket server running
- [ ] JWT auth on connection
- [ ] All events emitted correctly
- [ ] Clients receive events in real-time
- [ ] Heartbeat prevents stale connections
- [ ] Events logged for debugging`,
    priority: 'P0',
    component: 'Meetings',
    labels: ['sprint-1', 'meetings', 'websocket', 'p0']
  },
  {
    sprint: 1,
    title: 'Background Music MVP',
    description: `Implement background music playback during prayer meetings.

**Requirements:**
- Host/Co-Host can start/stop background music
- Music plays to all participants
- Volume control (0-100)
- Music persists when new participants join
- Recording includes music in audio track

**API Endpoints:**
- POST /api/v1/meetings/:meetingId/music/start
- POST /api/v1/meetings/:meetingId/music/stop
- PUT /api/v1/meetings/:meetingId/music/volume

**Data Model:**
\`\`\`javascript
backgroundMusic: {
  isEnabled: Boolean,
  source: String ('upload' | 'stream' | 'url'),
  trackUrl: String (S3 URL),
  volume: Number (0-100),
  isLooping: Boolean
}
\`\`\`

**Acceptance Criteria:**
- [ ] Host can start music
- [ ] Music plays to all participants
- [ ] Volume control works
- [ ] Music persists on participant join
- [ ] Recording includes music
- [ ] Permission checks (host/co-host only)`,
    priority: 'P0',
    component: 'Meetings',
    labels: ['sprint-1', 'meetings', 'music', 'p0']
  },
  {
    sprint: 1,
    title: 'Screen/Resource Share API Hooks',
    description: `Create API endpoints for screen sharing and resource sharing in meetings.

**Requirements:**
- Host/Co-Host can share screen
- Host/Co-Host can share files (PDFs, images)
- Share state broadcast to all participants
- Client stubs for UI integration

**API Endpoints:**
- POST /api/v1/meetings/:meetingId/screenshare/start
- POST /api/v1/meetings/:meetingId/screenshare/stop
- POST /api/v1/meetings/:meetingId/resources/share

**Acceptance Criteria:**
- [ ] Screen share API endpoints created
- [ ] Resource share endpoint created
- [ ] Permission checks (host/co-host)
- [ ] Share state persisted
- [ ] WebSocket events emitted
- [ ] Client stubs integrated`,
    priority: 'P0',
    component: 'Meetings',
    labels: ['sprint-1', 'meetings', 'screenshare', 'p0']
  },
  {
    sprint: 1,
    title: 'Observability Bootstrap (Auth + Meetings)',
    description: `Set up logging, tracing, and metrics for Auth and Meetings services.

**Requirements:**
- Structured JSON logging
- Distributed tracing (Datadog/OpenTelemetry)
- Metrics: OTP success/fail, rate limits, meeting join success, RTT, packet loss
- Dashboards for Auth and Meetings
- Alerts for critical failures

**Metrics to Track:**
- Auth: OTP sent, OTP verified, login success, rate limit hits
- Meetings: Join success rate, RTT (p95, p99), packet loss, music start/stop events

**Acceptance Criteria:**
- [ ] Structured logging implemented
- [ ] Tracing configured
- [ ] Metrics exported
- [ ] Auth dashboard created
- [ ] Meetings dashboard created
- [ ] Alerts configured (OTP abuse, join failures)`,
    priority: 'P0',
    component: 'DevOps',
    labels: ['sprint-1', 'observability', 'monitoring', 'p0']
  },

  // ========== SPRINT 2 ==========
  {
    sprint: 2,
    title: 'Meeting Controls UI/UX',
    description: `Build the client-side UI for meeting controls and participant management.

**UI Components:**
- Participant list with roles
- Hand raise indicator
- Highlight speaker view
- Mute/unmute controls
- Host control panel
- Music controls (host/co-host)

**Requirements:**
- React Native components
- Real-time updates via WebSocket
- Role-based UI visibility
- Smooth animations

**Acceptance Criteria:**
- [ ] Participant list displays correctly
- [ ] Role badges shown
- [ ] Hand raise visible to all
- [ ] Highlight speaker works
- [ ] Mute states update in real-time
- [ ] Host controls only visible to host/co-host
- [ ] UI matches design spec`,
    priority: 'P0',
    component: 'Mobile',
    labels: ['sprint-2', 'meetings', 'ui', 'p0']
  },
  {
    sprint: 2,
    title: 'Network Adaptation & Reconnect',
    description: `Implement network adaptation and automatic reconnection for meetings.

**Requirements:**
- Audio-priority fallback on poor network
- Automatic reconnect on network drop
- Resume meeting state after reconnect
- Handle packet loss gracefully (70% tolerance)

**Implementation:**
- Monitor network quality (Agora QoS)
- Auto-adjust bitrate (100kbps-2Mbps)
- Reconnect logic with exponential backoff
- State sync on reconnect

**Acceptance Criteria:**
- [ ] Network quality monitored
- [ ] Audio priority enforced
- [ ] Auto-reconnect works
- [ ] State resumed correctly
- [ ] Packet loss handled gracefully
- [ ] Tested with network simulation`,
    priority: 'P0',
    component: 'Meetings',
    labels: ['sprint-2', 'meetings', 'reliability', 'p0']
  },
  {
    sprint: 2,
    title: 'Recording to S3 End-to-End',
    description: `Implement meeting recording with storage in S3 and playback functionality.

**Requirements:**
- Start/stop recording via API
- Record audio + background music
- Store in S3 with metadata
- Playback listing endpoint
- Client playback UI

**API Endpoints:**
- POST /api/v1/meetings/:meetingId/recording/start
- POST /api/v1/meetings/:meetingId/recording/stop
- GET /api/v1/meetings/recordings

**Data Model:**
\`\`\`javascript
{
  recordingId: ObjectId,
  meetingId: ObjectId,
  recordingUrl: String (S3 URL),
  duration: Number,
  createdAt: Date
}
\`\`\`

**Acceptance Criteria:**
- [ ] Recording starts/stops correctly
- [ ] Audio + music recorded
- [ ] Files stored in S3
- [ ] Metadata persisted
- [ ] Playback listing works
- [ ] Client can play recordings
- [ ] Failure alerts configured`,
    priority: 'P0',
    component: 'Meetings',
    labels: ['sprint-2', 'meetings', 'recording', 'p0']
  },
  {
    sprint: 2,
    title: 'Meeting Notifications',
    description: `Implement push and in-app notifications for prayer meetings.

**Notification Types:**
- Meeting starting soon (reminder)
- Meeting started (host started)
- Meeting ended
- Participant joined (optional)

**Requirements:**
- Respect quiet hours
- Deep links to meeting
- FCM (Android) + APNs (iOS)
- In-app notification center

**Acceptance Criteria:**
- [ ] Reminder sent at scheduled time
- [ ] "Started" notification sent
- [ ] Quiet hours respected
- [ ] Deep links work
- [ ] In-app notifications displayed
- [ ] User can disable per category`,
    priority: 'P0',
    component: 'Notifications',
    labels: ['sprint-2', 'notifications', 'meetings', 'p0']
  },
  {
    sprint: 2,
    title: 'Meeting Load/Chaos Tests',
    description: `Create load testing harness and chaos tests for meetings.

**Load Tests:**
- 100 concurrent meetings
- 2500 participants per meeting
- Measure: join success rate, RTT, packet loss

**Chaos Tests:**
- Network drop/reconnect
- Packet loss simulation
- Agora service failure simulation

**Acceptance Criteria:**
- [ ] Load test harness created
- [ ] 100 concurrent meetings tested
- [ ] Join success rate >99%
- [ ] RTT <150ms (p95)
- [ ] Chaos tests documented
- [ ] Results logged`,
    priority: 'P0',
    component: 'QA',
    labels: ['sprint-2', 'testing', 'performance', 'p0']
  },

  // ========== SPRINT 3 ==========
  {
    sprint: 3,
    title: 'Feed Service Core (CRUD, Reactions, Comments)',
    description: `Build the core Feed service with post creation, reactions, and comments.

**Features:**
- Post CRUD (text, image)
- Reactions (Amen, Praying, Love, etc.)
- Nested comments (3 levels)
- Prayer request flag
- Edification score stub
- Feed types: primary, discovery, prayer requests

**API Endpoints:**
- GET /api/v1/posts/feed?type=primary
- POST /api/v1/posts
- POST /api/v1/posts/:postId/react
- POST /api/v1/posts/:postId/comments

**Acceptance Criteria:**
- [ ] Posts can be created
- [ ] Feed pagination works
- [ ] Reactions work
- [ ] Comments nested correctly
- [ ] Prayer request flag works
- [ ] Edification score calculated (stub)`,
    priority: 'P0',
    component: 'Feed',
    labels: ['sprint-3', 'feed', 'p0']
  },
  {
    sprint: 3,
    title: 'Chat Baseline (DM/Group, Read Receipts, Typing)',
    description: `Implement core chat functionality with direct messages and group chats.

**Features:**
- 1-on-1 DMs
- Group chats (up to 1000 members)
- Text and image messages
- Read receipts
- Typing indicators
- Delivery status
- Media upload with retry

**API Endpoints:**
- GET /api/v1/conversations
- POST /api/v1/conversations/:conversationId/messages
- PUT /api/v1/messages/:messageId/read

**Acceptance Criteria:**
- [ ] DMs work
- [ ] Group chats work
- [ ] Read receipts accurate
- [ ] Typing indicators work
- [ ] Media uploads with retry
- [ ] Encryption in transit verified`,
    priority: 'P0',
    component: 'Chat',
    labels: ['sprint-3', 'chat', 'p0']
  },
  {
    sprint: 3,
    title: 'Offline Cache (Feed + Chat)',
    description: `Implement offline caching for feed and chat with retry queue.

**Requirements:**
- Cache last 50 feed posts locally
- Show stale data indicator when offline
- Retry queue for chat sends
- Sync on reconnect

**Implementation:**
- WatermelonDB for local storage
- Redux Persist for state
- Background sync service

**Acceptance Criteria:**
- [ ] Feed cached locally
- [ ] Stale indicator shown
- [ ] Chat retry queue works
- [ ] Sync on reconnect
- [ ] Works in airplane mode`,
    priority: 'P1',
    component: 'Mobile',
    labels: ['sprint-3', 'offline', 'cache', 'p1']
  },
  {
    sprint: 3,
    title: 'E2EE 1:1 Scaffold (Signal Protocol)',
    description: `Implement end-to-end encryption for 1-on-1 messages using Signal Protocol.

**Requirements:**
- Signal Protocol library integration
- Key exchange on first message
- Encrypted message storage
- Feature flag: E2EE_ENABLED

**Implementation:**
- Use libsignal-protocol-typescript or similar
- Key management service
- Encrypted message format

**Acceptance Criteria:**
- [ ] Signal Protocol integrated
- [ ] Key exchange works
- [ ] Messages encrypted
- [ ] Feature flag controls visibility
- [ ] Tested in test environment`,
    priority: 'P1',
    component: 'Chat',
    labels: ['sprint-3', 'chat', 'e2ee', 'p1']
  },
  {
    sprint: 3,
    title: 'Content Report + Admin View',
    description: `Implement content reporting and basic admin moderation queue.

**Requirements:**
- Report endpoint for posts/comments
- Admin queue to view reports
- Basic actions: hide, delete (full moderation in Sprint 5)

**API Endpoints:**
- POST /api/v1/posts/:postId/report
- GET /api/v1/admin/reports
- POST /api/v1/admin/reports/:reportId/action

**Acceptance Criteria:**
- [ ] Users can report content
- [ ] Reports stored
- [ ] Admin can view queue
- [ ] Basic actions work
- [ ] Notifications sent`,
    priority: 'P1',
    component: 'Moderation',
    labels: ['sprint-3', 'moderation', 'p1']
  },

  // ========== SPRINT 4 ==========
  {
    sprint: 4,
    title: 'Creator Apply/Review Workflow',
    description: `Build the creator application and admin review process.

**Requirements:**
- Creator application form
- Admin review queue
- Approve/reject workflow
- Notifications to creators

**API Endpoints:**
- POST /api/v1/creators/apply
- GET /api/v1/admin/creator-applications
- PUT /api/v1/admin/creator-applications/:applicationId/approve

**Acceptance Criteria:**
- [ ] Application form works
- [ ] Applications stored
- [ ] Admin queue displays
- [ ] Approve/reject works
- [ ] Notifications sent
- [ ] Creator badge assigned`,
    priority: 'P1',
    component: 'Creator',
    labels: ['sprint-4', 'creator', 'p1']
  },
  {
    sprint: 4,
    title: 'Upload Music Albums & Resource Packs',
    description: `Implement upload flows for creator content.

**Requirements:**
- Music album upload (MP3 files)
- Resource pack upload (PDFs, images)
- S3 storage with AV scan
- Metadata: title, description, tags, pricing
- Publish flag

**API Endpoints:**
- POST /api/v1/creators/music-albums
- POST /api/v1/creators/resource-packs
- POST /api/v1/creators/music-albums/:albumId/publish

**Acceptance Criteria:**
- [ ] Music uploads work
- [ ] Resource uploads work
- [ ] AV scan runs
- [ ] Metadata saved
- [ ] Files stored in S3
- [ ] Publish flag works`,
    priority: 'P1',
    component: 'Creator',
    labels: ['sprint-4', 'creator', 'upload', 'p1']
  },
  {
    sprint: 4,
    title: 'Marketplace Browse/Purchase (Sandbox)',
    description: `Build the marketplace UI and purchase flow with sandbox payments.

**Requirements:**
- Browse music albums
- Browse resource packs
- Purchase flow
- Receipt persistence
- Entitlement checking

**API Endpoints:**
- GET /api/v1/marketplace/music
- POST /api/v1/marketplace/music/:albumId/purchase
- GET /api/v1/marketplace/resources

**Acceptance Criteria:**
- [ ] Browse works
- [ ] Purchase flow works (sandbox)
- [ ] Receipts stored
- [ ] Entitlements checked
- [ ] Downloads work`,
    priority: 'P1',
    component: 'Creator',
    labels: ['sprint-4', 'creator', 'marketplace', 'p1']
  },
  {
    sprint: 4,
    title: 'Payments Abstraction (Stripe + IAP)',
    description: `Create payment abstraction layer for Stripe and in-app purchases.

**Requirements:**
- Stripe Connect integration
- IAP placeholder (iOS/Android)
- Subscription status check API
- Test stubs for development

**API Endpoints:**
- GET /api/v1/subscriptions/status
- POST /api/v1/subscriptions/subscribe

**Acceptance Criteria:**
- [ ] Stripe Connect integrated
- [ ] IAP interfaces defined
- [ ] Status check works
- [ ] Test stubs work
- [ ] Error handling implemented`,
    priority: 'P1',
    component: 'Payments',
    labels: ['sprint-4', 'payments', 'p1']
  },
  {
    sprint: 4,
    title: 'Creator Notifications & Revenue Dashboard',
    description: `Build notifications and basic revenue dashboard for creators.

**Notifications:**
- Content published
- New purchase
- Payout sent

**Dashboard:**
- Sales count
- Revenue (net)
- Platform fees
- Payout history

**Acceptance Criteria:**
- [ ] Notifications sent
- [ ] Dashboard displays data
- [ ] Revenue calculated correctly
- [ ] Payouts tracked`,
    priority: 'P1',
    component: 'Creator',
    labels: ['sprint-4', 'creator', 'dashboard', 'p1']
  },

  // ========== SPRINT 5 ==========
  {
    sprint: 5,
    title: 'Reporting Flows End-to-End',
    description: `Complete the reporting and moderation workflow.

**Requirements:**
- User reports content
- Admin reviews and takes action
- Actions: warn, suspend, ban, hide, delete
- Strike system (3 strikes = auto-suspend)
- User notifications

**API Endpoints:**
- POST /api/v1/posts/:postId/report
- GET /api/v1/admin/reports
- POST /api/v1/admin/users/:userId/warn
- POST /api/v1/admin/users/:userId/suspend

**Acceptance Criteria:**
- [ ] Reports flow works
- [ ] Admin actions work
- [ ] Strikes tracked
- [ ] Auto-suspend on 3 strikes
- [ ] Users notified
- [ ] Appeals link provided`,
    priority: 'P1',
    component: 'Moderation',
    labels: ['sprint-5', 'moderation', 'p1']
  },
  {
    sprint: 5,
    title: 'AI Scans & Blocklists',
    description: `Implement AI-powered content moderation with blocklists.

**Requirements:**
- Google Cloud Perspective API for text
- AWS Rekognition for images
- Dynamic blocklist
- Spam throttles (rate limits)

**Implementation:**
- Inline scanning on post/comment creation
- Configurable thresholds
- Auto-flag for review

**Acceptance Criteria:**
- [ ] Text scanning works
- [ ] Image scanning works
- [ ] Blocklist enforced
- [ ] Spam throttles work
- [ ] Configurable thresholds
- [ ] False positives logged`,
    priority: 'P1',
    component: 'Moderation',
    labels: ['sprint-5', 'moderation', 'ai', 'p1']
  },
  {
    sprint: 5,
    title: 'Audit Logging & Transparency Stats',
    description: `Implement audit logging and transparency reporting.

**Requirements:**
- Log all admin/mod actions
- Transparency stats endpoint
- PII-minimized logs
- Quarterly report generation

**API Endpoints:**
- GET /api/v1/admin/moderation/stats
- GET /api/v1/admin/audit-logs

**Acceptance Criteria:**
- [ ] All actions logged
- [ ] Stats endpoint works
- [ ] PII minimized
- [ ] Reports generated
- [ ] Logs searchable`,
    priority: 'P1',
    component: 'Moderation',
    labels: ['sprint-5', 'moderation', 'audit', 'p1']
  },
  {
    sprint: 5,
    title: 'Appeals Flow with SLA Tracking',
    description: `Build the appeals process for moderation actions.

**Requirements:**
- User can appeal within 7 days
- Admin review within 48h
- SLA tracking
- Notifications

**API Endpoints:**
- POST /api/v1/moderation/appeals
- GET /api/v1/admin/appeals
- PUT /api/v1/admin/appeals/:appealId/review

**Acceptance Criteria:**
- [ ] Appeals can be submitted
- [ ] Admin queue works
- [ ] SLA tracked
- [ ] Notifications sent
- [ ] Decisions final`,
    priority: 'P1',
    component: 'Moderation',
    labels: ['sprint-5', 'moderation', 'appeals', 'p1']
  },

  // ========== SPRINT 6 ==========
  {
    sprint: 6,
    title: 'E2E Automation Pass (Detox + Cypress)',
    description: `Create and run E2E tests for critical user flows.

**Test Flows:**
- OTP onboarding
- Live meeting join/participate
- Chat send/receive
- Feed post creation
- Report → Admin action
- Creator purchase

**Tools:**
- Detox (React Native)
- Cypress (Web Admin)

**Acceptance Criteria:**
- [ ] All critical flows tested
- [ ] Tests pass in CI
- [ ] Flaky tests identified
- [ ] Coverage >80% of critical paths`,
    priority: 'P0',
    component: 'QA',
    labels: ['sprint-6', 'testing', 'e2e', 'p0']
  },
  {
    sprint: 6,
    title: 'Load/Stress Tests & Performance Tuning',
    description: `Run load tests and tune performance to meet targets.

**Targets:**
- Feed load <2s (4G)
- Chat delivery <100ms
- Prayer meeting RTT <150ms

**Tests:**
- Load: 10k concurrent users
- Stress: 100k users
- Spike: 10x traffic

**Acceptance Criteria:**
- [ ] Load tests run
- [ ] Targets met
- [ ] Bottlenecks identified
- [ ] Optimizations applied
- [ ] Results documented`,
    priority: 'P0',
    component: 'QA',
    labels: ['sprint-6', 'testing', 'performance', 'p0']
  },
  {
    sprint: 6,
    title: 'Accessibility Pass (WCAG 2.1 AA)',
    description: `Ensure app meets WCAG 2.1 Level AA standards.

**Requirements:**
- VoiceOver/TalkBack support
- Text scaling (135% iOS, 2.0x Android)
- Color contrast (4.5:1)
- Motor accessibility (44x44dp tap targets)

**Screens to Test:**
- Onboarding
- Feed
- Meeting controls
- Bible reader
- Settings

**Acceptance Criteria:**
- [ ] Screen readers work
- [ ] Text scaling works
- [ ] Contrast compliant
- [ ] Tap targets sized correctly
- [ ] Issues fixed or documented`,
    priority: 'P1',
    component: 'QA',
    labels: ['sprint-6', 'accessibility', 'p1']
  },
  {
    sprint: 6,
    title: 'Localization & Regression Burn-Down',
    description: `Finalize localization and complete regression testing.

**Requirements:**
- English, Spanish, Portuguese, French
- RTL support (future)
- Regression test suite
- Bug burn-down

**Acceptance Criteria:**
- [ ] All languages supported
- [ ] Translations verified
- [ ] Regression tests pass
- [ ] Critical bugs fixed
- [ ] Release-ready`,
    priority: 'P1',
    component: 'QA',
    labels: ['sprint-6', 'localization', 'regression', 'p1']
  }
];

// Jira API helper with timeout
function jiraRequest(method, endpoint, data = null, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, JIRA_BASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      timeout: timeout,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`Jira API error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ETIMEDOUT') {
        reject(new Error(`Connection timeout after ${timeout}ms. Check your network or firewall settings.`));
      } else {
        reject(err);
      }
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Test connection to Jira
async function testConnection() {
  console.log('🔍 Testing connection to Jira...\n');
  try {
    const result = await jiraRequest('GET', '/rest/api/3/myself', null, 10000);
    console.log(`✅ Connected successfully!`);
    console.log(`   User: ${result.displayName} (${result.emailAddress || 'No email'})\n`);
    return true;
  } catch (error) {
    console.error(`❌ Connection test failed: ${error.message}\n`);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('💡 Authentication issue. Please check:');
      console.error('   - Your API token is correct');
      if (JIRA_AUTH_METHOD === 'basic') {
        console.error('   - Your email address is correct');
        console.error('   - You have permission to create issues in the project');
      }
    } else if (error.message.includes('timeout')) {
      console.error('💡 Network timeout. Please check:');
      console.error('   - Your internet connection');
      console.error('   - Firewall/proxy settings');
      console.error('   - Jira URL is accessible');
    }
    return false;
  }
}

// Create issue type mapping
const issueTypeMap = {
  'P0': 'Bug', // Can change to 'Story' or 'Task'
  'P1': 'Story'
};

// Main execution
async function createTickets() {
  console.log('🚀 Starting Jira ticket creation...\n');
  console.log(`📋 Project: ${JIRA_PROJECT_KEY}`);
  console.log(`🌐 Base URL: ${JIRA_BASE_URL}`);
  console.log(`🔐 Auth Method: ${JIRA_AUTH_METHOD}\n`);

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without a valid connection. Please fix the issues above.');
    process.exit(1);
  }

  const created = [];
  const failed = [];

  for (const ticket of tickets) {
    try {
      console.log(`Creating: ${ticket.title}...`);

      const issueData = {
        fields: {
          project: { key: JIRA_PROJECT_KEY },
          summary: ticket.title,
          description: ticket.description,
          issuetype: { name: issueTypeMap[ticket.priority] || 'Story' },
          priority: { name: ticket.priority === 'P0' ? 'Highest' : 'High' },
          labels: ticket.labels
        }
      };

      // Add component if Jira project has components configured
      // Uncomment if components are set up:
      // if (ticket.component) {
      //   issueData.fields.components = [{ name: ticket.component }];
      // }

      const result = await jiraRequest('POST', '/rest/api/3/issue', issueData);
      
      const issueKey = result.key;
      const issueUrl = `${JIRA_BASE_URL}/browse/${issueKey}`;
      
      created.push({ key: issueKey, title: ticket.title, url: issueUrl, sprint: ticket.sprint });
      console.log(`✅ Created: ${issueKey} - ${ticket.title}`);
      console.log(`   ${issueUrl}\n`);

      // Rate limiting - wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Failed: ${ticket.title}`);
      console.error(`   ${error.message}\n`);
      failed.push({ title: ticket.title, error: error.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Created: ${created.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  if (created.length > 0) {
    console.log('Created Tickets by Sprint:');
    const bySprint = {};
    created.forEach(t => {
      if (!bySprint[t.sprint]) bySprint[t.sprint] = [];
      bySprint[t.sprint].push(t);
    });
    Object.keys(bySprint).sort().forEach(sprint => {
      console.log(`\nSprint ${sprint}:`);
      bySprint[sprint].forEach(t => {
        console.log(`  ${t.key}: ${t.title}`);
        console.log(`    ${t.url}`);
      });
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Tickets:');
    failed.forEach(f => {
      console.log(`  ${f.title}: ${f.error}`);
    });
  }

  // Save results to file
  const resultsPath = path.join(__dirname, '..', 'jira-tickets-created.json');
  fs.writeFileSync(resultsPath, JSON.stringify({ created, failed }, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);
}

// Run
createTickets().catch(console.error);

