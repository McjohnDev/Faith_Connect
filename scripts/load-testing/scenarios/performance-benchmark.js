/**
 * Performance Benchmark
 * Measures baseline performance metrics
 */

require('dotenv').config();
const { TestClient } = require('../utils/test-client');
const { MetricsCollector } = require('../utils/metrics-collector');

const MEETINGS_SERVICE_URL = process.env.MEETINGS_SERVICE_URL || 'http://localhost:3002';
const ITERATIONS = parseInt(process.env.ITERATIONS || '100');

function generateTestToken(userId) {
  const payload = { userId, sub: userId };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

async function benchmarkEndpoint(client, method, endpoint, data = null, iterations = ITERATIONS) {
  const metrics = new MetricsCollector();
  metrics.start();

  for (let i = 0; i < iterations; i++) {
    try {
      const start = Date.now();
      
      let response;
      if (method === 'GET') {
        response = await client.client.get(endpoint);
      } else if (method === 'POST') {
        response = await client.client.post(endpoint, data);
      } else if (method === 'PUT') {
        response = await client.client.put(endpoint, data);
      }

      const latency = Date.now() - start;
      metrics.recordRequest(method, endpoint, response.status, latency);
    } catch (error) {
      metrics.recordRequest(method, endpoint, error.response?.status || 500, 0);
    }
  }

  metrics.stop();
  return metrics.getSummary();
}

async function runBenchmarks() {
  console.log('⚡ Starting Performance Benchmarks\n');
  console.log(`Service URL: ${MEETINGS_SERVICE_URL}`);
  console.log(`Iterations per endpoint: ${ITERATIONS}\n`);

  const token = generateTestToken('benchmark-user');
  const client = new TestClient(MEETINGS_SERVICE_URL, token);

  // Health check
  console.log('📊 Benchmarking Health Endpoint...');
  const healthMetrics = await benchmarkEndpoint(client, 'GET', '/health', null, ITERATIONS);
  console.log(`   Avg Latency: ${healthMetrics.latency.avg}ms`);
  console.log(`   P95: ${healthMetrics.latency.p95}ms`);
  console.log(`   P99: ${healthMetrics.latency.p99}ms`);
  console.log(`   Error Rate: ${healthMetrics.requests.errorRate}\n`);

  // Create meeting
  console.log('📊 Benchmarking Create Meeting...');
  let meetingId;
  try {
    const meeting = await client.createMeeting({
      title: 'Benchmark Meeting',
      description: 'Performance test'
    });
    meetingId = meeting.data.id;
    console.log(`   Created meeting: ${meetingId}\n`);
  } catch (error) {
    console.error('   ❌ Failed to create meeting:', error.message);
    return;
  }

  // Get meeting
  console.log('📊 Benchmarking Get Meeting...');
  const getMeetingMetrics = await benchmarkEndpoint(
    client,
    'GET',
    `/api/v1/meetings/${meetingId}`,
    null,
    ITERATIONS
  );
  console.log(`   Avg Latency: ${getMeetingMetrics.latency.avg}ms`);
  console.log(`   P95: ${getMeetingMetrics.latency.p95}ms`);
  console.log(`   P99: ${getMeetingMetrics.latency.p99}ms`);
  console.log(`   Error Rate: ${getMeetingMetrics.requests.errorRate}\n`);

  // Join meeting
  console.log('📊 Benchmarking Join Meeting...');
  const joinMetrics = await benchmarkEndpoint(
    client,
    'POST',
    `/api/v1/meetings/${meetingId}/join`,
    { role: 'listener' },
    ITERATIONS
  );
  console.log(`   Avg Latency: ${joinMetrics.latency.avg}ms`);
  console.log(`   P95: ${joinMetrics.latency.p95}ms`);
  console.log(`   P99: ${joinMetrics.latency.p99}ms`);
  console.log(`   Error Rate: ${joinMetrics.requests.errorRate}\n`);

  // List meetings
  console.log('📊 Benchmarking List Meetings...');
  const listMetrics = await benchmarkEndpoint(
    client,
    'GET',
    '/api/v1/meetings',
    null,
    ITERATIONS
  );
  console.log(`   Avg Latency: ${listMetrics.latency.avg}ms`);
  console.log(`   P95: ${listMetrics.latency.p95}ms`);
  console.log(`   P99: ${listMetrics.latency.p99}ms`);
  console.log(`   Error Rate: ${listMetrics.requests.errorRate}\n`);

  // Network quality
  console.log('📊 Benchmarking Network Quality Report...');
  const networkMetrics = await benchmarkEndpoint(
    client,
    'POST',
    `/api/v1/meetings/${meetingId}/network/quality`,
    {
      quality: 'good',
      rtt: 100,
      packetLoss: 2,
      bandwidth: 1000
    },
    ITERATIONS
  );
  console.log(`   Avg Latency: ${networkMetrics.latency.avg}ms`);
  console.log(`   P95: ${networkMetrics.latency.p95}ms`);
  console.log(`   P99: ${networkMetrics.latency.p99}ms`);
  console.log(`   Error Rate: ${networkMetrics.requests.errorRate}\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Performance Benchmark Summary');
  console.log('='.repeat(60));
  console.log('\nTarget Performance:');
  console.log('  Health Check: < 50ms (P95)');
  console.log('  Get Meeting: < 100ms (P95)');
  console.log('  Join Meeting: < 200ms (P95)');
  console.log('  List Meetings: < 150ms (P95)');
  console.log('  Network Quality: < 100ms (P95)');
  console.log('\nResults:');
  console.log(`  Health: ${healthMetrics.latency.p95}ms ${healthMetrics.latency.p95 < 50 ? '✅' : '❌'}`);
  console.log(`  Get Meeting: ${getMeetingMetrics.latency.p95}ms ${getMeetingMetrics.latency.p95 < 100 ? '✅' : '❌'}`);
  console.log(`  Join Meeting: ${joinMetrics.latency.p95}ms ${joinMetrics.latency.p95 < 200 ? '✅' : '❌'}`);
  console.log(`  List Meetings: ${listMetrics.latency.p95}ms ${listMetrics.latency.p95 < 150 ? '✅' : '❌'}`);
  console.log(`  Network Quality: ${networkMetrics.latency.p95}ms ${networkMetrics.latency.p95 < 100 ? '✅' : '❌'}`);
  console.log('='.repeat(60));

  // Cleanup
  try {
    await client.leaveMeeting(meetingId);
  } catch (error) {
    // Ignore cleanup errors
  }

  process.exit(0);
}

runBenchmarks().catch(error => {
  console.error('❌ Benchmark failed:', error);
  process.exit(1);
});

