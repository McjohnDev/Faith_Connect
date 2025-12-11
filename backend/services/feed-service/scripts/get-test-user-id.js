/**
 * Get or create a test user ID for Feed Service testing
 */

const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');
require('dotenv').config();

async function getTestUserId() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'faithconnect_test'
  });

  try {
    // Try to get an existing user
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
    
    if (users.length > 0) {
      console.log(`✅ Found existing user: ${users[0].id}`);
      await connection.end();
      return users[0].id;
    }

    // Create test user if none exists
    const userId = randomUUID();
    const phoneNumber = '+1234567890';
    const now = new Date();

    await connection.execute(
      `INSERT INTO users (id, phone_number, guidelines_accepted, guidelines_accepted_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, phoneNumber, true, now, now, now]
    );

    console.log(`✅ Created test user: ${userId}`);
    await connection.end();
    return userId;
  } catch (error) {
    console.error('❌ Error:', error.message);
    await connection.end();
    throw error;
  }
}

getTestUserId()
  .then(userId => {
    console.log(`\n📝 Use this user ID in tests: ${userId}\n`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed:', error);
    process.exit(1);
  });

