# Load & Performance Testing

Load testing, chaos engineering, and performance benchmarking for FaithConnect services.

## Setup

```bash
cd scripts/load-testing
npm install
```

## Configuration

Create a `.env` file:

```env
MEETINGS_SERVICE_URL=http://localhost:3002
WEBSOCKET_URL=http://localhost:3002
CONCURRENT_USERS=50
TEST_DURATION=60
REQUESTS_PER_USER=10
ITERATIONS=100
```

## Tests

### 1. Load Test

Simulates concurrent users joining meetings and performing actions.

```bash
npm run test:load
```

**Configuration:**
- `CONCURRENT_USERS` - Number of concurrent users (default: 50)
- `TEST_DURATION` - Test duration in seconds (default: 60)
- `REQUESTS_PER_USER` - Requests per user (default: 10)

**Metrics Collected:**
- Total requests
- Success/failure rate
- Latency (min, max, avg, P50, P95, P99)
- Throughput (requests/second)
- Error rate

**Performance Targets:**
- Avg Latency < 200ms
- P95 Latency < 500ms
- P99 Latency < 1000ms
- Error Rate < 1%

---

### 2. Chaos Tests

Tests system resilience under failure conditions.

```bash
npm run test:chaos
```

**Tests Included:**

1. **Rapid Join/Leave** - Connection churn (50 rapid cycles)
2. **Packet Loss Simulation** - 20 users with varying packet loss (0-100%)
3. **Reconnection Storm** - 30 users reconnecting simultaneously
4. **WebSocket Drops** - 20 WebSocket connections with random disconnects
5. **High Concurrency Join** - 100 users joining simultaneously

**Metrics:**
- Success rate per test
- Average latency
- P95 latency (for high concurrency)

---

### 3. Performance Benchmark

Measures baseline performance for individual endpoints.

```bash
npm run test:performance
```

**Endpoints Tested:**
- Health check
- Create meeting
- Get meeting
- Join meeting
- List meetings
- Network quality report

**Configuration:**
- `ITERATIONS` - Requests per endpoint (default: 100)

**Performance Targets:**
- Health Check: < 50ms (P95)
- Get Meeting: < 100ms (P95)
- Join Meeting: < 200ms (P95)
- List Meetings: < 150ms (P95)
- Network Quality: < 100ms (P95)

---

### Run All Tests

```bash
npm run test:all
```

---

## Test Results

### Load Test Example Output

```
📊 Load Test Results
============================================================
Duration: 60.00s

Requests:
  Total: 1250
  Successful: 1245
  Failed: 5
  Error Rate: 0.40%

Latency (ms):
  Min: 45
  Max: 850
  Avg: 156.23
  P50: 142
  P95: 487
  P99: 723

Throughput:
  Requests/sec: 20.83
  Avg RPS: 20.75

Concurrent Users: 50
```

### Chaos Test Example Output

```
🔥 Starting Chaos Tests

Test 1: Rapid Join/Leave (Connection Churn)
   Results: 100 operations, 2 failures
   Avg Latency: 89ms

Test 2: Packet Loss Simulation
   Results: 200 operations, 0 failures
   Avg Latency: 112ms

Test 3: Reconnection Storm
   Results: 30 reconnections, 0 failures
   Avg Latency: 145ms

Test 4: WebSocket Drops
   Results: 20 connections

Test 5: High Concurrency
   Results: 100 joins, 1 failure
   Avg Latency: 234ms
   P95 Latency: 456ms
```

---

## Customization

### Adjust Test Parameters

Edit the test files or set environment variables:

```bash
CONCURRENT_USERS=100 TEST_DURATION=120 npm run test:load
```

### Add Custom Tests

Create new test files in `scenarios/` or `chaos/` directories following the existing patterns.

---

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
- name: Run Load Tests
  run: |
    cd scripts/load-testing
    npm install
    npm run test:load
```

---

## Monitoring

During tests, monitor:
- Service metrics endpoint: `GET /metrics`
- Database connection pool usage
- Memory usage
- CPU usage
- Network I/O

---

## Troubleshooting

### High Error Rates
- Check service logs
- Verify database connections
- Check rate limiting settings
- Monitor resource usage

### High Latency
- Check database query performance
- Verify Redis connection
- Monitor network latency
- Check service load

### Connection Failures
- Verify service is running
- Check firewall rules
- Verify port availability
- Check service health endpoint

---

**Last Updated:** 2025-12-11

