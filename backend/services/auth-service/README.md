# Auth Service

Phone OTP Authentication Service (WhatsApp Style)

## Features

- Phone number registration with OTP
- OTP delivery via **SMS or WhatsApp** (Twilio)
- Automatic fallback: WhatsApp → SMS if WhatsApp fails
- Age gate (≥13)
- Community Guidelines acceptance
- JWT access & refresh tokens
- Device cap (max 5 devices)
- Rate limiting
- Dual database support (MySQL test, PostgreSQL prod)

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.template .env

# Edit .env with your credentials

# Run in development
npm run dev

# Build
npm run build

# Run production
npm start
```

## API Endpoints

- `POST /api/v1/auth/register-phone` - Register with phone (sends OTP via SMS or WhatsApp)
  - Body: `{ phoneNumber: "+1234567890", age: 18, deliveryMethod: "sms" | "whatsapp" }`
- `POST /api/v1/auth/verify-phone` - Verify OTP and create account
- `POST /api/v1/auth/resend-otp` - Resend OTP (SMS or WhatsApp)
  - Body: `{ phoneNumber: "+1234567890", deliveryMethod: "sms" | "whatsapp" }`
- `POST /api/v1/auth/login-phone` - Login with phone (sends OTP via SMS or WhatsApp)
  - Body: `{ phoneNumber: "+1234567890", deliveryMethod: "sms" | "whatsapp" }`
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout and revoke tokens
- `GET /health` - Health check

## Database

- **Test**: MySQL
- **Production**: PostgreSQL

Migrations will be created separately.

## Rate Limits

- Register/Login: 5 requests/hour per phone
- Verify OTP: 10 requests/hour per phone
- Resend OTP: 3 requests/hour per phone

