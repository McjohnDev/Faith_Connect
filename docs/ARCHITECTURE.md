# FaithConnect Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────┐
│   Mobile App (React Native)             │
│   Web Admin (Next.js)                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│   API Gateway (Kong/Nginx)             │
│   - Rate Limiting                       │
│   - SSL Termination                     │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌─────▼─────┐   ┌───▼───┐
│ Auth  │   │ Meetings  │   │ Feed  │
│       │   │           │   │       │
└───┬───┘   └─────┬─────┘   └───┬───┘
    │             │             │
┌───▼───┐   ┌─────▼─────┐   ┌───▼───┐
│Postgres│   │  MongoDB  │   │ Redis │
│ (Prod) │   │           │   │       │
│ MySQL  │   │           │   │       │
│ (Test) │   └───────────┘   └───────┘
└────────┘
```

## Technology Stack

### Frontend
- **Mobile**: React Native 0.72+
- **Web Admin**: Next.js 14+

### Backend
- **Runtime**: Node.js 18 LTS
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Video/Audio**: Agora.io

### Databases
- **Relational**: PostgreSQL (prod), MySQL (test)
- **Document**: MongoDB
- **Cache**: Redis
- **Search**: Elasticsearch

### Infrastructure
- **Hosting**: AWS
- **CDN**: CloudFront
- **Storage**: S3
- **IaC**: Terraform

## Microservices

See [backend/README.md](../backend/README.md) for details.

## Data Flow

1. Client → API Gateway
2. Gateway → Microservice
3. Service → Database/Cache
4. Real-time events via WebSocket

## Security

- TLS 1.3 everywhere
- JWT with refresh rotation
- Rate limiting
- E2EE for 1:1 messages
- AI content moderation

