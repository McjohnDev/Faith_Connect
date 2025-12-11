/**
 * Clear Rate Limits (Development Only)
 * Clears rate limit keys from Redis
 * 
 * WARNING: Only use in development/testing!
 */

const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const PHONE_NUMBER = process.argv[2];

if (!PHONE_NUMBER) {
  console.log('Usage: node scripts/clear-rate-limits.js <phoneNumber>');
  console.log('Example: node scripts/clear-rate-limits.js +237693805080');
  console.log('\nOr clear all rate limits:');
  console.log('  node scripts/clear-rate-limits.js --all');
  process.exit(1);
}

async function clearRateLimits() {
  try {
    const client = redis.createClient({ url: REDIS_URL });
    await client.connect();
    console.log('✅ Connected to Redis\n');

    if (PHONE_NUMBER === '--all') {
      console.log('🗑️  Clearing all rate limit keys...');
      const keys = await client.keys('otp:rate:*');
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`✅ Cleared ${keys.length} rate limit keys\n`);
      } else {
        console.log('ℹ️  No rate limit keys found\n');
      }
    } else {
      const rateLimitKey = `otp:rate:${PHONE_NUMBER}`;
      const deleted = await client.del(rateLimitKey);
      
      if (deleted > 0) {
        console.log(`✅ Cleared rate limit for ${PHONE_NUMBER}\n`);
      } else {
        console.log(`ℹ️  No rate limit found for ${PHONE_NUMBER}\n`);
      }
    }

    await client.quit();
    console.log('✅ Done! You can now retry the registration.\n');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Could not connect to Redis');
      console.error('   Make sure Redis is running on', REDIS_URL);
      console.error('   Or restart the auth service to clear in-memory rate limits\n');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

clearRateLimits().catch(console.error);

