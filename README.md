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

- [Functional Requirements](./functional-requirements.md) - Complete product specification
- [Sprints & Stories](./sprints-and-stories.md) - Development roadmap and implementation stories
- [Jira Setup](./SETUP-JIRA.md) - Jira ticket creation guide

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ LTS
- Docker (for local databases)
- Git

### Setup

```bash
# Clone repository
git clone <repository-url>
cd Faith_Connect

# Install dependencies (when services are created)
npm install

# Copy environment template
cp .env.template .env

# Start local services
docker-compose up -d
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

### Sprint 1 (Weeks 1-2) - Live Prayer Foundations
- Phone OTP Auth
- Meetings Service with Agora
- WebSocket events
- Background music MVP
- Observability

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

**Status**: 🚧 In Development - Sprint 1

