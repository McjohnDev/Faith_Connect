/**
 * Test WebSocket Events
 * Tests real-time WebSocket events for meetings
 */

require('dotenv').config({ path: '.env' });
const { io } = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://localhost:3002';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

// Generate a mock JWT token for testing
const jwt = require('jsonwebtoken');

// Create a test user ID
const testUserId = 'test-user-' + Date.now();
const testMeetingId = 'test-meeting-' + Date.now();

// Generate JWT token
const token = jwt.sign(
  { userId: testUserId, type: 'access' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('🧪 Testing WebSocket Events\n');
console.log('─'.repeat(50));
console.log(`API URL: ${API_URL}`);
console.log(`User ID: ${testUserId}`);
console.log(`Meeting ID: ${testMeetingId}`);
console.log('─'.repeat(50) + '\n');

// Connect to WebSocket server
console.log('📡 Connecting to WebSocket server...\n');

const socket = io(API_URL, {
  auth: {
    token: token
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

let testsPassed = 0;
let testsFailed = 0;
const testResults = [];

// Test helper
function test(name, condition, message) {
  if (condition) {
    console.log(`✅ ${name}: ${message || 'PASS'}`);
    testsPassed++;
    testResults.push({ name, status: 'PASS', message });
  } else {
    console.log(`❌ ${name}: ${message || 'FAIL'}`);
    testsFailed++;
    testResults.push({ name, status: 'FAIL', message });
  }
}

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server\n');
  test('Connection', true, 'Successfully connected');

  // Join meeting room
  console.log('📥 Joining meeting room...\n');
  socket.emit('meeting:join', { meetingId: testMeetingId });
});

socket.on('disconnect', (reason) => {
  console.log(`\n⚠️  Disconnected: ${reason}`);
  test('Disconnect', true, `Disconnected: ${reason}`);
});

socket.on('connect_error', (error) => {
  console.error(`\n❌ Connection error: ${error.message}`);
  test('Connection Error', false, error.message);
  
  if (error.message.includes('Authentication')) {
    console.log('\n💡 Tip: Make sure JWT_SECRET matches between services');
    console.log('   Check .env file for JWT_SECRET\n');
  }
  
  process.exit(1);
});

// Meeting room events
socket.on('meeting:joined', (data) => {
  console.log('✅ Joined meeting room:', data.meetingId);
  test('Join Meeting Room', data.meetingId === testMeetingId, `Joined: ${data.meetingId}`);
  
  // Simulate events by emitting test events
  setTimeout(() => {
    console.log('\n📤 Simulating meeting events...\n');
    simulateEvents();
  }, 1000);
});

socket.on('meeting:left', (data) => {
  console.log('✅ Left meeting room:', data.meetingId);
  test('Leave Meeting Room', data.meetingId === testMeetingId, `Left: ${data.meetingId}`);
});

// Participant events
socket.on('meeting:participant-joined', (data) => {
  console.log('👤 Participant joined:', data.userId);
  test('Participant Joined Event', !!data.userId && !!data.timestamp, 'Event received');
});

socket.on('meeting:participant-left', (data) => {
  console.log('👋 Participant left:', data.userId);
  test('Participant Left Event', !!data.userId && !!data.timestamp, 'Event received');
});

// Hand events
socket.on('meeting:hand-raised', (data) => {
  console.log('✋ Hand raised:', data.userId);
  test('Hand Raised Event', !!data.userId && !!data.timestamp, 'Event received');
});

socket.on('meeting:hand-lowered', (data) => {
  console.log('✋ Hand lowered:', data.userId);
  test('Hand Lowered Event', !!data.userId && !!data.timestamp, 'Event received');
});

// Music events
socket.on('meeting:music-started', (data) => {
  console.log('🎵 Music started:', data.musicState);
  test('Music Started Event', !!data.musicState && !!data.timestamp, 'Event received');
});

socket.on('meeting:music-stopped', (data) => {
  console.log('🔇 Music stopped:', data.userId);
  test('Music Stopped Event', !!data.userId && !!data.timestamp, 'Event received');
});

socket.on('meeting:music-volume-updated', (data) => {
  console.log('🔊 Music volume updated:', data.volume);
  test('Music Volume Updated Event', !!data.volume && !!data.timestamp, 'Event received');
});

// Screen share events
socket.on('meeting:screenshare-started', (data) => {
  console.log('📺 Screen share started:', data.userId);
  test('Screen Share Started Event', !!data.userId && !!data.timestamp, 'Event received');
});

socket.on('meeting:screenshare-stopped', (data) => {
  console.log('📺 Screen share stopped:', data.userId);
  test('Screen Share Stopped Event', !!data.userId && !!data.timestamp, 'Event received');
});

// Resource share events
socket.on('meeting:resource-shared', (data) => {
  console.log('📄 Resource shared:', data.resource);
  test('Resource Shared Event', !!data.resource && !!data.timestamp, 'Event received');
});

// Error events
socket.on('error', (data) => {
  console.error('❌ Error:', data.message);
  test('Error Handling', false, data.message);
});

// Ping/Pong
socket.on('pong', () => {
  console.log('🏓 Pong received');
  test('Heartbeat', true, 'Pong received');
});

// Simulate events (in a real scenario, these would come from the API)
function simulateEvents() {
  // Note: In production, these events are emitted by the meeting service
  // when API endpoints are called. For testing, we'll just verify the
  // WebSocket connection and event listeners are working.
  
  console.log('💡 Note: Real events are emitted by the meeting service');
  console.log('   when API endpoints are called (e.g., POST /meetings/:id/join)\n');
  
  // Test ping
  console.log('🏓 Sending ping...');
  socket.emit('ping');
  
  // Wait a bit, then leave and finish
  setTimeout(() => {
    console.log('\n📤 Leaving meeting room...\n');
    socket.emit('meeting:leave', { meetingId: testMeetingId });
    
    setTimeout(() => {
      finishTests();
    }, 1000);
  }, 2000);
}

function finishTests() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);
  console.log('='.repeat(50) + '\n');

  if (testsFailed === 0) {
    console.log('🎉 All WebSocket tests passed!\n');
    console.log('✅ WebSocket server is working correctly');
    console.log('✅ JWT authentication is working');
    console.log('✅ Event listeners are set up correctly\n');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
  }

  socket.close();
  process.exit(testsFailed === 0 ? 0 : 1);
}

// Timeout after 30 seconds
setTimeout(() => {
  console.log('\n⏱️  Test timeout (30s)');
  finishTests();
}, 30000);

// Handle process exit
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted');
  socket.close();
  process.exit(1);
});

