/**
 * Create a test user for Feed Service testing
 */

const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '../backend/services/auth-service/.env') });

async function createTestUser() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'faithconnect_test'
  });

  try {
    const userId = randomUUID();
    const phoneNumber = '+1234567890';
    const now = new Date();

    // Check if user already exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE phone_number = ?',
      [phoneNumber]
    );

    if (existing.length > 0) {
      console.log(`✅ Test user already exists: ${existing[0].id}`);
      await connection.end();
      return existing[0].id;
    }

    // Create test user
    await connection.execute(
      `INSERT INTO users (id, phone_number, guidelines_accepted, guidelines_accepted_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, phoneNumber, true, now, now, now]
    );

    console.log(`✅ Test user created: ${userId}`);
    console.log(`   Phone: ${phoneNumber}`);
    console.log(`   Use this ID in tests: ${userId}`);

    await connection.end();
    return userId;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    await connection.end();
    throw error;
  }
}

createTestUser().catch(console.error);

