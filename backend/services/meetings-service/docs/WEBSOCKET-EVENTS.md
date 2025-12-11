# WebSocket Events Documentation

## Overview

The Meetings Service uses Socket.io for real-time communication. All WebSocket connections require JWT authentication.

## Connection

### Connect to WebSocket Server

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002', {
  auth: {
    token: 'your-jwt-access-token'
  },
  transports: ['websocket', 'polling']
});
```

### Authentication

The WebSocket connection requires JWT authentication. The token can be provided in two ways:

1. **Via `auth.token`** (recommended):
   ```javascript
   const socket = io('http://localhost:3002', {
     auth: { token: 'your-jwt-token' }
   });
   ```

2. **Via `Authorization` header**:
   ```javascript
   const socket = io('http://localhost:3002', {
     extraHeaders: {
       Authorization: 'Bearer your-jwt-token'
     }
   });
   ```

## Client Events (Client → Server)

### Join Meeting Room

Join a meeting room to receive real-time updates for that meeting.

```javascript
socket.emit('meeting:join', {
  meetingId: 'meeting-uuid'
});
```

**Response:**
```javascript
socket.on('meeting:joined', (data) => {
  console.log('Joined meeting room:', data.meetingId);
});
```

### Leave Meeting Room

Leave a meeting room to stop receiving updates.

```javascript
socket.emit('meeting:leave', {
  meetingId: 'meeting-uuid'
});
```

**Response:**
```javascript
socket.on('meeting:left', (data) => {
  console.log('Left meeting room:', data.meetingId);
});
```

### Heartbeat/Ping

Keep connection alive (optional - Socket.io handles this automatically).

```javascript
socket.emit('ping');
socket.on('pong', () => {
  console.log('Server responded to ping');
});
```

## Server Events (Server → Client)

All events are broadcast to all participants in the meeting room.

### Participant Joined

Emitted when a participant joins the meeting.

```javascript
socket.on('meeting:participant-joined', (data) => {
  console.log('Participant joined:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   participant: { ... },
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Participant Left

Emitted when a participant leaves the meeting.

```javascript
socket.on('meeting:participant-left', (data) => {
  console.log('Participant left:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Hand Raised

Emitted when a participant raises their hand.

```javascript
socket.on('meeting:hand-raised', (data) => {
  console.log('Hand raised:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Hand Lowered

Emitted when a participant lowers their hand.

```javascript
socket.on('meeting:hand-lowered', (data) => {
  console.log('Hand lowered:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Host Promoted

Emitted when a participant is promoted to host/co-host.

```javascript
socket.on('meeting:host-promoted', (data) => {
  console.log('Host promoted:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   role: 'host' | 'co_host',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Recording Started

Emitted when recording starts.

```javascript
socket.on('meeting:recording-started', (data) => {
  console.log('Recording started:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Recording Stopped

Emitted when recording stops.

```javascript
socket.on('meeting:recording-stopped', (data) => {
  console.log('Recording stopped:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Music Started

Emitted when background music starts.

```javascript
socket.on('meeting:music-started', (data) => {
  console.log('Music started:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   musicState: {
  //     isEnabled: true,
  //     source: 'url',
  //     trackUrl: 'https://...',
  //     volume: 50,
  //     isLooping: true
  //   },
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Music Stopped

Emitted when background music stops.

```javascript
socket.on('meeting:music-stopped', (data) => {
  console.log('Music stopped:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Music Volume Updated

Emitted when music volume changes.

```javascript
socket.on('meeting:music-volume-updated', (data) => {
  console.log('Music volume updated:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   volume: 75,
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Screen Share Started

Emitted when screen sharing starts.

```javascript
socket.on('meeting:screenshare-started', (data) => {
  console.log('Screen share started:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Screen Share Stopped

Emitted when screen sharing stops.

```javascript
socket.on('meeting:screenshare-stopped', (data) => {
  console.log('Screen share stopped:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   timestamp: '2025-12-10T...'
  // }
});
```

### Resource Shared

Emitted when a resource (PDF, image) is shared.

```javascript
socket.on('meeting:resource-shared', (data) => {
  console.log('Resource shared:', data);
  // {
  //   meetingId: 'uuid',
  //   userId: 'user-uuid',
  //   resource: {
  //     type: 'pdf' | 'image',
  //     url: 'https://...',
  //     name: 'document.pdf'
  //   },
  //   timestamp: '2025-12-10T...'
  // }
});
```

## Error Handling

### Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  // Common errors:
  // - "Authentication required" - No token provided
  // - "Authentication failed" - Invalid token
  // - "Invalid token" - Token missing userId
});
```

### Custom Error Events

```javascript
socket.on('error', (data) => {
  console.error('Error:', data.message);
});
```

## Complete Example

```javascript
import { io } from 'socket.io-client';

// Connect with JWT token
const socket = io('http://localhost:3002', {
  auth: {
    token: 'your-jwt-access-token'
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Join meeting room
  socket.emit('meeting:join', {
    meetingId: 'meeting-uuid'
  });
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});

// Meeting events
socket.on('meeting:joined', (data) => {
  console.log('Joined meeting room:', data.meetingId);
});

socket.on('meeting:participant-joined', (data) => {
  console.log('New participant:', data.userId);
  // Update UI with new participant
});

socket.on('meeting:participant-left', (data) => {
  console.log('Participant left:', data.userId);
  // Remove participant from UI
});

socket.on('meeting:hand-raised', (data) => {
  console.log('Hand raised by:', data.userId);
  // Show hand raise indicator in UI
});

socket.on('meeting:music-started', (data) => {
  console.log('Music started:', data.musicState);
  // Start playing music in client
});

// Cleanup on component unmount
socket.close();
```

## React Native Example

```typescript
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const useMeetingSocket = (meetingId: string, token: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect
    const socket = io('http://your-api-url:3002', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Join meeting room
    socket.emit('meeting:join', { meetingId });

    // Listen to events
    socket.on('meeting:participant-joined', (data) => {
      // Handle participant joined
    });

    socket.on('meeting:music-started', (data) => {
      // Handle music started
    });

    // Cleanup
    return () => {
      socket.emit('meeting:leave', { meetingId });
      socket.close();
    };
  }, [meetingId, token]);

  return socketRef.current;
};
```

## Testing

Use the test script to verify WebSocket events:

```bash
node scripts/test-websocket-events.js
```

## Notes

- All events include a `timestamp` field (ISO 8601 format)
- Events are only sent to participants who have joined the meeting room
- JWT tokens expire after 15 minutes (default) - clients should refresh tokens
- Socket.io automatically handles reconnection on network issues
- Heartbeat is handled automatically by Socket.io (ping/pong)

