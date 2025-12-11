/**
 * Chaos Tests
 * Tests system resilience under failure conditions
 */

require('dotenv').config();
const { TestClient } = require('../utils/test-client');
const { MetricsCollector } = require('../utils/metrics-collector');
const { io } = require('socket.io-client');

const MEETINGS_SERVICE_URL = process.env.MEETINGS_SERVICE_URL || 'http://localhost:3002';
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'http://localhost:3002';

function generateTestToken(userId) {
  const payload = { userId, sub: userId };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Test 1: Rapid Join/Leave (Connection Churn)
 */
async function testRapidJoinLeave(meetingId, iterations = 50) {
  console.log('\n🧪 Test 1: Rapid Join/Leave (Connection Churn)');
  console.log(`   Simulating ${iterations} rapid join/leave cycles\n`);

  const metrics = new MetricsCollector();
  metrics.start();

  for (let i = 0; i < iterations; i++) {
    const userId = `chaos-user-${i}`;
    const token = generateTestToken(userId);
    const client = new TestClient(MEETINGS_SERVICE_URL, token);

    try {
      // Join
      const joinStart = Date.now();
      await client.joinMeeting(meetingId, 'listener');
      metrics.recordRequest('POST', '/join', 200, Date.now() - joinStart);

      // Immediate leave
      const leaveStart = Date.now();
      await client.leaveMeeting(meetingId);
      metrics.recordRequest('POST', '/leave', 200, Date.now() - leaveStart);

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 10));
    } catch (error) {
      metrics.recordRequest('POST', '/join', 500, 0);
      console.log(`   ⚠️  Iteration ${i + 1} failed: ${error.message}`);
    }
  }

  metrics.stop();
  const summary = metrics.getSummary();
  console.log(`   Results: ${summary.requests.total} operations, ${summary.requests.failed} failures`);
  console.log(`   Avg Latency: ${summary.latency.avg}ms`);
  return summary;
}

/**
 * Test 2: Packet Loss Simulation
 */
async function testPacketLoss(meetingId, users = 20) {
  console.log('\n🧪 Test 2: Packet Loss Simulation');
  console.log(`   Simulating ${users} users with varying packet loss\n`);

  const metrics = new MetricsCollector();
  metrics.start();

  const promises = [];
  for (let i = 0; i < users; i++) {
    const userId = `packet-loss-user-${i}`;
    const token = generateTestToken(userId);
    const client = new TestClient(MEETINGS_SERVICE_URL, token);

    const promise = (async () => {
      try {
        await client.joinMeeting(meetingId, 'listener');

        // Simulate network quality reports with packet loss
        for (let j = 0; j < 10; j++) {
          const packetLoss = Math.random() * 100; // 0-100%
          const quality = packetLoss > 70 ? 'very_bad' : packetLoss > 30 ? 'poor' : 'good';

          const start = Date.now();
          await client.reportNetworkQuality(meetingId, {
            quality,
            rtt: Math.floor(Math.random() * 1000) + 50,
            packetLoss,
            bandwidth: Math.floor(Math.random() * 2000) + 100
          });
          metrics.recordRequest('POST', '/network/quality', 200, Date.now() - start);

          await new Promise(resolve => setTimeout(resolve, 100));
        }

        await client.leaveMeeting(meetingId);
      } catch (error) {
        metrics.recordRequest('POST', '/network/quality', 500, 0);
      }
    })();

    promises.push(promise);
  }

  await Promise.allSettled(promises);
  metrics.stop();

  const summary = metrics.getSummary();
  console.log(`   Results: ${summary.requests.total} operations, ${summary.requests.failed} failures`);
  console.log(`   Avg Latency: ${summary.latency.avg}ms`);
  return summary;
}

/**
 * Test 3: Reconnection Storm
 */
async function testReconnectionStorm(meetingId, users = 30) {
  console.log('\n🧪 Test 3: Reconnection Storm');
  console.log(`   Simulating ${users} users reconnecting simultaneously\n`);

  const metrics = new MetricsCollector();
  metrics.start();

  // First, all users join
  const tokens = [];
  for (let i = 0; i < users; i++) {
    const userId = `reconnect-user-${i}`;
    const token = generateTestToken(userId);
    tokens.push({ userId, token });
    
    const client = new TestClient(MEETINGS_SERVICE_URL, token);
    try {
      await client.joinMeeting(meetingId, 'listener');
    } catch (error) {
      // Ignore initial join errors
    }
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // All users reconnect simultaneously
  const reconnectPromises = tokens.map(({ userId, token }) => {
    const client = new TestClient(MEETINGS_SERVICE_URL, token);
    return (async () => {
      try {
        const start = Date.now();
        await client.reconnect(meetingId);
        metrics.recordRequest('POST', '/reconnect', 200, Date.now() - start);
      } catch (error) {
        metrics.recordRequest('POST', '/reconnect', 500, 0);
      }
    })();
  });

  await Promise.allSettled(reconnectPromises);
  metrics.stop();

  const summary = metrics.getSummary();
  console.log(`   Results: ${summary.requests.total} reconnections, ${summary.requests.failed} failures`);
  console.log(`   Avg Latency: ${summary.latency.avg}ms`);
  return summary;
}

/**
 * Test 4: WebSocket Connection Drops
 */
async function testWebSocketDrops(meetingId, connections = 20) {
  console.log('\n🧪 Test 4: WebSocket Connection Drops');
  console.log(`   Simulating ${connections} WebSocket connections with drops\n`);

  const metrics = new MetricsCollector();
  metrics.start();

  const sockets = [];
  const promises = [];

  for (let i = 0; i < connections; i++) {
    const userId = `ws-user-${i}`;
    const token = generateTestToken(userId);

    const promise = new Promise((resolve) => {
      const socket = io(WEBSOCKET_URL, {
        auth: { token },
        transports: ['websocket']
      });

      sockets.push(socket);

      socket.on('connect', () => {
        socket.emit('meeting:join', { meetingId });
        metrics.recordRequest('WS', 'connect', 200, 0);
      });

      socket.on('disconnect', () => {
        metrics.recordRequest('WS', 'disconnect', 200, 0);
      });

      // Randomly disconnect after some time
      setTimeout(() => {
        socket.disconnect();
        resolve();
      }, Math.random() * 5000 + 1000);
    });

    promises.push(promise);
  }

  await Promise.allSettled(promises);
  metrics.stop();

  const summary = metrics.getSummary();
  console.log(`   Results: ${connections} connections, ${summary.requests.total} events`);
  return summary;
}

/**
 * Test 5: High Concurrency Join
 */
async function testHighConcurrencyJoin(meetingId, concurrentUsers = 100) {
  console.log('\n🧪 Test 5: High Concurrency Join');
  console.log(`   ${concurrentUsers} users joining simultaneously\n`);

  const metrics = new MetricsCollector();
  metrics.start();

  const promises = [];
  for (let i = 0; i < concurrentUsers; i++) {
    const userId = `concurrent-user-${i}`;
    const token = generateTestToken(userId);
    const client = new TestClient(MEETINGS_SERVICE_URL, token);

    const promise = (async () => {
      try {
        const start = Date.now();
        await client.joinMeeting(meetingId, 'listener');
        metrics.recordRequest('POST', '/join', 200, Date.now() - start);
      } catch (error) {
        metrics.recordRequest('POST', '/join', 500, 0);
      }
    })();

    promises.push(promise);
  }

  await Promise.allSettled(promises);
  metrics.stop();

  const summary = metrics.getSummary();
  console.log(`   Results: ${summary.requests.total} joins, ${summary.requests.failed} failures`);
  console.log(`   Avg Latency: ${summary.latency.avg}ms`);
  console.log(`   P95 Latency: ${summary.latency.p95}ms`);
  return summary;
}

/**
 * Run all chaos tests
 */
async function runChaosTests() {
  console.log('🔥 Starting Chaos Tests\n');
  console.log(`Service URL: ${MEETINGS_SERVICE_URL}`);
  console.log(`WebSocket URL: ${WEBSOCKET_URL}\n`);

  // Create test meeting
  const hostToken = generateTestToken('chaos-host');
  const hostClient = new TestClient(MEETINGS_SERVICE_URL, hostToken);

  let meetingId;
  try {
    const meeting = await hostClient.createMeeting({
      title: 'Chaos Test Meeting',
      description: 'Chaos engineering test',
      maxParticipants: 1000
    });
    meetingId = meeting.data.id;
    console.log(`✅ Created test meeting: ${meetingId}\n`);
  } catch (error) {
    console.error('❌ Failed to create test meeting:', error.message);
    process.exit(1);
  }

  const results = {
    rapidJoinLeave: null,
    packetLoss: null,
    reconnectionStorm: null,
    websocketDrops: null,
    highConcurrency: null
  };

  try {
    // Run all tests
    results.rapidJoinLeave = await testRapidJoinLeave(meetingId, 50);
    results.packetLoss = await testPacketLoss(meetingId, 20);
    results.reconnectionStorm = await testReconnectionStorm(meetingId, 30);
    results.websocketDrops = await testWebSocketDrops(meetingId, 20);
    results.highConcurrency = await testHighConcurrencyJoin(meetingId, 100);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Chaos Test Summary');
    console.log('='.repeat(60));
    console.log('\nTest 1: Rapid Join/Leave');
    console.log(`  Success Rate: ${((results.rapidJoinLeave.requests.successful / results.rapidJoinLeave.requests.total) * 100).toFixed(2)}%`);
    console.log(`  Avg Latency: ${results.rapidJoinLeave.latency.avg}ms`);
    console.log('\nTest 2: Packet Loss');
    console.log(`  Success Rate: ${((results.packetLoss.requests.successful / results.packetLoss.requests.total) * 100).toFixed(2)}%`);
    console.log(`  Avg Latency: ${results.packetLoss.latency.avg}ms`);
    console.log('\nTest 3: Reconnection Storm');
    console.log(`  Success Rate: ${((results.reconnectionStorm.requests.successful / results.reconnectionStorm.requests.total) * 100).toFixed(2)}%`);
    console.log(`  Avg Latency: ${results.reconnectionStorm.latency.avg}ms`);
    console.log('\nTest 4: WebSocket Drops');
    console.log(`  Connections: ${results.websocketDrops.requests.total}`);
    console.log('\nTest 5: High Concurrency');
    console.log(`  Success Rate: ${((results.highConcurrency.requests.successful / results.highConcurrency.requests.total) * 100).toFixed(2)}%`);
    console.log(`  Avg Latency: ${results.highConcurrency.latency.avg}ms`);
    console.log(`  P95 Latency: ${results.highConcurrency.latency.p95}ms`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Chaos test failed:', error);
  } finally {
    // Cleanup
    try {
      await hostClient.leaveMeeting(meetingId);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  process.exit(0);
}

runChaosTests().catch(error => {
  console.error('❌ Chaos tests failed:', error);
  process.exit(1);
});

