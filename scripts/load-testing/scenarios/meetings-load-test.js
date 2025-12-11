/**
 * Meetings Load Test
 * Simulates concurrent users joining meetings
 */

require('dotenv').config();
const { TestClient } = require('../utils/test-client');
const { MetricsCollector } = require('../utils/metrics-collector');
const pLimit = require('p-limit');

const MEETINGS_SERVICE_URL = process.env.MEETINGS_SERVICE_URL || 'http://localhost:3002';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '50');
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '60'); // seconds
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER || '10');

// Generate test tokens (in production, use real auth)
function generateTestToken(userId) {
  const payload = { userId, sub: userId };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

async function simulateUser(userId, meetingId, metrics) {
  const token = generateTestToken(userId);
  const client = new TestClient(MEETINGS_SERVICE_URL, token);
  const errors = [];

  try {
    // Join meeting
    const startTime = Date.now();
    await client.joinMeeting(meetingId, 'listener');
    const latency = Date.now() - startTime;
    metrics.recordRequest('POST', '/api/v1/meetings/:id/join', 200, latency);

    // Simulate user activity
    for (let i = 0; i < REQUESTS_PER_USER; i++) {
      // Random actions
      const action = Math.random();
      
      if (action < 0.3) {
        // Get meeting
        const start = Date.now();
        await client.getMeeting(meetingId);
        metrics.recordRequest('GET', '/api/v1/meetings/:id', 200, Date.now() - start);
      } else if (action < 0.5) {
        // Raise hand
        const start = Date.now();
        await client.raiseHand(meetingId);
        metrics.recordRequest('POST', '/api/v1/meetings/:id/hand/raise', 200, Date.now() - start);
      } else if (action < 0.7) {
        // Report network quality
        const start = Date.now();
        await client.reportNetworkQuality(meetingId, {
          quality: ['excellent', 'good', 'poor'][Math.floor(Math.random() * 3)],
          rtt: Math.floor(Math.random() * 500) + 50,
          packetLoss: Math.random() * 10,
          bandwidth: Math.floor(Math.random() * 2000) + 100
        });
        metrics.recordRequest('POST', '/api/v1/meetings/:id/network/quality', 200, Date.now() - start);
      }

      // Wait between actions
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    }

    // Leave meeting
    const leaveStart = Date.now();
    await client.leaveMeeting(meetingId);
    metrics.recordRequest('POST', '/api/v1/meetings/:id/leave', 200, Date.now() - leaveStart);

  } catch (error) {
    errors.push({ userId, error: error.message });
    metrics.recordRequest('ERROR', 'unknown', 500, 0);
  }

  return errors;
}

async function runLoadTest() {
  console.log('🚀 Starting Meetings Load Test\n');
  console.log(`Configuration:`);
  console.log(`  Service URL: ${MEETINGS_SERVICE_URL}`);
  console.log(`  Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`  Test Duration: ${TEST_DURATION}s`);
  console.log(`  Requests per User: ${REQUESTS_PER_USER}\n`);

  const metrics = new MetricsCollector();
  metrics.start();

  // Create a test meeting
  const hostToken = generateTestToken('host-user-1');
  const hostClient = new TestClient(MEETINGS_SERVICE_URL, hostToken);
  
  let meetingId;
  try {
    const meeting = await hostClient.createMeeting({
      title: 'Load Test Meeting',
      description: 'Performance testing',
      maxParticipants: 1000
    });
    meetingId = meeting.data.id;
    console.log(`✅ Created test meeting: ${meetingId}\n`);
  } catch (error) {
    console.error('❌ Failed to create test meeting:', error.message);
    process.exit(1);
  }

  // Health check
  try {
    await hostClient.health();
    console.log('✅ Service health check passed\n');
  } catch (error) {
    console.error('❌ Service health check failed:', error.message);
    process.exit(1);
  }

  // Run load test
  const limit = pLimit(CONCURRENT_USERS);
  const startTime = Date.now();
  const endTime = startTime + (TEST_DURATION * 1000);
  const promises = [];
  let userCounter = 0;

  console.log('📊 Running load test...\n');

  // Spawn users continuously until test duration
  const spawnInterval = setInterval(() => {
    if (Date.now() >= endTime) {
      clearInterval(spawnInterval);
      return;
    }

    const userId = `load-test-user-${++userCounter}`;
    const promise = limit(() => simulateUser(userId, meetingId, metrics));
    promises.push(promise);
    metrics.setConcurrentUsers(userCounter);
  }, 100); // Spawn a user every 100ms

  // Wait for test duration
  await new Promise(resolve => setTimeout(resolve, TEST_DURATION * 1000));
  clearInterval(spawnInterval);

  // Wait for all users to complete
  console.log('⏳ Waiting for all users to complete...\n');
  const results = await Promise.allSettled(promises);

  metrics.stop();

  // Collect errors
  const allErrors = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allErrors.push(...result.value);
    } else if (result.status === 'rejected') {
      allErrors.push({ error: result.reason.message });
    }
  });

  // Print summary
  const summary = metrics.getSummary();
  console.log('='.repeat(60));
  console.log('📊 Load Test Results');
  console.log('='.repeat(60));
  console.log(`Duration: ${summary.duration.seconds}s`);
  console.log(`\nRequests:`);
  console.log(`  Total: ${summary.requests.total}`);
  console.log(`  Successful: ${summary.requests.successful}`);
  console.log(`  Failed: ${summary.requests.failed}`);
  console.log(`  Error Rate: ${summary.requests.errorRate}`);
  console.log(`\nLatency (ms):`);
  console.log(`  Min: ${summary.latency.min}`);
  console.log(`  Max: ${summary.latency.max}`);
  console.log(`  Avg: ${summary.latency.avg}`);
  console.log(`  P50: ${summary.latency.p50}`);
  console.log(`  P95: ${summary.latency.p95}`);
  console.log(`  P99: ${summary.latency.p99}`);
  console.log(`\nThroughput:`);
  console.log(`  Requests/sec: ${summary.throughput.rps}`);
  console.log(`  Avg RPS: ${summary.throughput.avg}`);
  console.log(`\nConcurrent Users: ${summary.concurrentUsers}`);

  if (allErrors.length > 0) {
    console.log(`\n⚠️  Errors: ${allErrors.length}`);
    if (allErrors.length <= 10) {
      allErrors.forEach(err => console.log(`  - ${JSON.stringify(err)}`));
    }
  }

  console.log('='.repeat(60));

  // Performance targets
  const targets = {
    avgLatency: 200, // ms
    p95Latency: 500, // ms
    p99Latency: 1000, // ms
    errorRate: 1 // %
  };

  console.log('\n🎯 Performance Targets:');
  console.log(`  Avg Latency < ${targets.avgLatency}ms: ${parseFloat(summary.latency.avg) < targets.avgLatency ? '✅' : '❌'}`);
  console.log(`  P95 Latency < ${targets.p95Latency}ms: ${summary.latency.p95 < targets.p95Latency ? '✅' : '❌'}`);
  console.log(`  P99 Latency < ${targets.p99Latency}ms: ${summary.latency.p99 < targets.p99Latency ? '✅' : '❌'}`);
  console.log(`  Error Rate < ${targets.errorRate}%: ${parseFloat(summary.requests.errorRate) < targets.errorRate ? '✅' : '❌'}`);

  // Cleanup
  try {
    await hostClient.leaveMeeting(meetingId);
  } catch (error) {
    // Ignore cleanup errors
  }

  process.exit(0);
}

runLoadTest().catch(error => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});
