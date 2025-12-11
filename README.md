# FaithConnect - Christian Social Network Platform

A comprehensive mobile and web platform for Christians to connect, study Scripture, pray together, and support one another in a safe, doctrinally neutral environment.

## 🎯 Project Overview

FaithConnect is a full-stack application built with:
- **Mobile**: React Native (iOS/Android)
- **Backend**: Node.js microservices
- **Web Admin**: Next.js
- **Databases**: PostgreSQL (prod), MySQL (test)
- **Real-time**: Socket.io, Agora.io for live prayer meetings

## 📋 Documentation

### Getting Started
- [Quick Start Guide](./QUICK-START-LOCAL.md) - Get running in 5 minutes
- [Setup Without Docker](./docs/SETUP-WITHOUT-DOCKER.md) - Complete setup instructions
- [Project Summary](./docs/PROJECT-SUMMARY.md) - Complete project overview

### Sprint Status
- [Sprint 1 Complete](./docs/SPRINT-1-COMPLETE.md) - Full completion report
- [Sprint 1 Status](./docs/SPRINT-1-STATUS.md) - Sprint progress tracking
- [Implementation Progress](./docs/IMPLEMENTATION-PROGRESS.md) - Detailed progress
- [Sprints & Stories](./sprints-and-stories.md) - Development roadmap

### Testing Results
- [API Test Results](./docs/API-TEST-RESULTS.md) - API endpoint testing
- [WebSocket Test Results](./docs/WEBSOCKET-TEST-RESULTS.md) - WebSocket event testing
- [Auth OTP Tests](./docs/AUTH-OTP-TEST-COMPLETE.md) - OTP authentication testing

### Integration Guides
- [Agora Integration](./docs/AGORA-INTEGRATION.md) - Agora.io setup guide
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

### Other
- [Functional Requirements](./functional-requirements.md) - Complete product specification
- [Jira Setup](./SETUP-JIRA.md) - Jira ticket creation guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ LTS
- MySQL (or Docker for databases)
- Redis (optional, has fallback)
- Git

### Setup

See [`QUICK-START-LOCAL.md`](QUICK-START-LOCAL.md) for complete setup instructions.

**Quick version:**
```bash
# Start MySQL (via Laragon or Docker)
# Then run setup script
.\scripts\setup-local.ps1

# Start services
.\scripts\start-services.ps1
```

**Or use Docker:**
```bash
docker compose -f infrastructure/docker-compose.local.yml up -d mysql postgres redis
```

## 📁 Project Structure

```
Faith_Connect/
├── backend/              # Node.js microservices
│   ├── auth-service/
│   ├── meetings-service/
│   ├── feed-service/
│   ├── chat-service/
│   └── ...
├── mobile/              # React Native app
│   ├── ios/
│   ├── android/
│   └── src/
├── web-admin/           # Next.js admin dashboard
├── scripts/             # Utility scripts
├── docs/                # Documentation
└── infrastructure/      # Terraform, Docker configs
```

## 🏗️ Architecture

### Microservices

1. **Auth Service** - Phone OTP authentication, JWT management
2. **Meetings Service** - Live prayer meetings (Agora.io)
3. **Feed Service** - Social timeline, posts, reactions
4. **Chat Service** - Direct messages, group chats, E2EE
5. **Bible Service** - Scripture reading, study tools
6. **Moderation Service** - Content moderation, AI scanning
7. **Payment Service** - Subscriptions, creator marketplace
8. **Notification Service** - Push notifications, in-app alerts

### Databases

- **PostgreSQL** (Production) - User data, groups, analytics
- **MySQL** (Test) - Test database
- **MongoDB** - Posts, messages, UGC
- **Redis** - Cache, sessions, rate limiting
- **Elasticsearch** - Search indexing

## 🎯 Development Phases

### ✅ Sprint 1 (Weeks 1-2) - Live Prayer Foundations - **COMPLETE**
- ✅ Phone OTP Auth
- ✅ Meetings Service with Agora
- ✅ WebSocket events
- ✅ Background music MVP
- ✅ Screen/resource share hooks
- ✅ Observability

**See:** [`docs/SPRINT-1-COMPLETE.md`](docs/SPRINT-1-COMPLETE.md) for full completion report

### Sprint 2 (Weeks 3-4) - Live Prayer UX + Reliability
- Meeting controls UI
- Network adaptation
- Recording to S3
- Notifications
- Load testing

### Sprint 3-6 - See [Sprints & Stories](./sprints-and-stories.md)

## 🔐 Security

- Phone OTP authentication (WhatsApp style)
- JWT with refresh token rotation
- End-to-end encryption for 1:1 messages
- Rate limiting on all endpoints
- AI-powered content moderation
- GDPR/CCPA/COPPA compliant

## 📊 Key Features

- **Live Prayer Meetings** - Up to 2,500 participants (free for all tiers)
- **Bible Study Tools** - 15+ translations, highlights, notes, reading plans
- **Social Feed** - Faith-focused posts, reactions, prayer requests
- **Quiet Time Journal** - Personal devotionals, prayer lists
- **Creator Marketplace** - Music albums, resource packs
- **Groups** - Faith-based communities

## 🧪 Testing

```bash
# Run tests
npm test

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

## 📝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📄 License

[To be determined]

## 👥 Team

- Product, Engineering, Design & Architecture Teams

---

**Status**: ✅ Sprint 1 Complete - Ready for Sprint 2

See [`docs/SPRINT-1-COMPLETE.md`](docs/SPRINT-1-COMPLETE.md) for completion details.

