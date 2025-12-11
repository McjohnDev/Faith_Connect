# Sprint 2 - Live Prayer UX + Reliability

**Duration:** 2 weeks  
**Priority:** P0  
**Status:** 🚧 In Progress

---

## Overview

Sprint 2 focuses on enhancing the user experience and reliability of live prayer meetings. This includes client UI components, network resilience, recording functionality, notifications, and performance testing.

---

## Stories

### 1. Client UI/UX for Meeting Controls ⏳
**Priority:** P0  
**Status:** Pending

**Requirements:**
- Participant list with roles (host, co-host, speaker, listener, music_host)
- Hand raise indicator
- Highlight speaker view
- Mute/unmute controls
- Host control panel
- Music controls (host/co-host)
- Real-time updates via WebSocket

**Deliverables:**
- React Native components for mobile
- React components for web (if needed)
- WebSocket integration
- Role-based UI visibility
- Smooth animations

**Acceptance Criteria:**
- [ ] Participant list displays correctly
- [ ] Role badges shown
- [ ] Hand raise visible to all
- [ ] Highlight speaker works
- [ ] Mute states update in real-time
- [ ] Host controls only visible to host/co-host
- [ ] UI matches design spec

---

### 2. Network Adaptation & Reconnect ⏳
**Priority:** P0  
**Status:** Pending

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

**Deliverables:**
- Network quality monitoring service
- Reconnection handler
- State synchronization logic
- Audio priority enforcement

**Acceptance Criteria:**
- [ ] Network quality monitored
- [ ] Audio priority enforced
- [ ] Auto-reconnect works
- [ ] State resumed correctly
- [ ] Packet loss handled gracefully
- [ ] Tested with network simulation

---

### 3. Recording to S3 End-to-End ⏳
**Priority:** P0  
**Status:** Pending

**Requirements:**
- Start/stop recording via API
- Record audio + background music
- Store in S3 with metadata
- Playback listing endpoint
- Client playback UI

**Current State:**
- Recording state management exists (Redis-backed)
- API endpoints exist (start/stop)
- Agora Cloud Recording integration needed
- S3 storage integration needed
- Playback listing endpoint needed

**Deliverables:**
- Agora Cloud Recording integration
- S3 storage service
- Recording metadata database
- Playback listing API
- Client playback component

**Acceptance Criteria:**
- [ ] Recording starts/stops correctly
- [ ] Audio + music recorded
- [ ] Files stored in S3
- [ ] Metadata persisted
- [ ] Playback listing works
- [ ] Client can play recordings
- [ ] Failure alerts configured

---

### 4. Meeting Notifications ⏳
**Priority:** P0  
**Status:** Pending

**Requirements:**
- Meeting reminder notifications
- "Meeting started" push/in-app notifications
- Quiet hours respected
- Push notification service integration

**Deliverables:**
- Notifications service
- Push notification integration (FCM/APNS)
- Quiet hours logic
- Notification preferences
- In-app notification system

**Acceptance Criteria:**
- [ ] Meeting reminders sent
- [ ] "Meeting started" notifications work
- [ ] Quiet hours respected
- [ ] Push notifications delivered
- [ ] In-app notifications shown
- [ ] User preferences respected

---

### 5. Load/Perf Harness ⏳
**Priority:** P0  
**Status:** Pending

**Requirements:**
- Performance testing framework
- Chaos tests (drop/rejoin, packet loss)
- Load testing for meetings
- Performance metrics collection

**Deliverables:**
- Load testing scripts
- Chaos testing framework
- Performance benchmarks
- Metrics dashboard

**Acceptance Criteria:**
- [ ] Load tests run successfully
- [ ] Chaos tests implemented
- [ ] Performance metrics collected
- [ ] Benchmarks documented
- [ ] Issues identified and fixed

---

## Implementation Order

### Phase 1: Backend Foundation (Week 1)
1. **Recording to S3** - Core functionality needed for other features
2. **Network Adaptation** - Critical for reliability
3. **Notifications Service** - Infrastructure needed

### Phase 2: Client Integration (Week 2)
4. **Client UI/UX** - Requires backend APIs to be stable
5. **Load/Perf Testing** - Test everything together

---

## Technical Stack

### Backend
- **Recording:** Agora Cloud Recording API
- **Storage:** AWS S3
- **Notifications:** FCM (Android), APNS (iOS)
- **Network:** Agora QoS monitoring

### Client
- **Mobile:** React Native
- **State:** Redux Toolkit
- **WebSocket:** Socket.io-client
- **Agora:** react-native-agora

---

## Dependencies

### External Services
- ✅ Agora.io (already integrated)
- ⏳ AWS S3 (needs setup)
- ⏳ FCM/APNS (needs setup)
- ✅ Redis (already available)
- ✅ Database (already available)

### Internal Services
- ✅ Auth Service (Sprint 1)
- ✅ Meetings Service (Sprint 1)
- ⏳ Notifications Service (Sprint 2)

---

## Success Metrics

- **Recording:** 100% success rate for recordings
- **Network:** < 2% reconnection failures
- **Notifications:** 95%+ delivery rate
- **Performance:** < 150ms RTT, < 2% packet loss
- **UI:** < 100ms update latency

---

## Risks & Mitigations

### Risk 1: Agora Cloud Recording Complexity
- **Mitigation:** Start with basic recording, iterate
- **Fallback:** Manual recording via Agora SDK

### Risk 2: S3 Storage Costs
- **Mitigation:** Implement lifecycle policies, compression
- **Monitoring:** Track storage usage

### Risk 3: Push Notification Delivery
- **Mitigation:** Use reliable providers (FCM/APNS)
- **Fallback:** In-app notifications

### Risk 4: Network Adaptation Complexity
- **Mitigation:** Leverage Agora SDK built-in features
- **Testing:** Extensive network simulation

---

## Documentation

- [ ] Recording setup guide
- [ ] Network adaptation guide
- [ ] Notifications setup guide
- [ ] Client UI component library
- [ ] Performance testing guide

---

**Last Updated:** 2025-12-11  
**Next Review:** Daily during Sprint 2

