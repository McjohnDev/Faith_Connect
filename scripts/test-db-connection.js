/**
 * Test Database Connection
 * Verifies that services can connect to the database
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/services/auth-service/.env' });

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'faithconnect_test'
  };

  console.log('Connection config:');
  console.log(`  Host: ${config.host}:${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}\n`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL database');

    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Users table exists: ${rows[0].count} users`);

    const [devices] = await connection.execute('SELECT COUNT(*) as count FROM devices');
    console.log(`✅ Devices table exists: ${devices[0].count} devices`);

    const [sessions] = await connection.execute('SELECT COUNT(*) as count FROM sessions');
    console.log(`✅ Sessions table exists: ${sessions[0].count} sessions`);

    const [meetings] = await connection.execute('SELECT COUNT(*) as count FROM meetings');
    console.log(`✅ Meetings table exists: ${meetings[0].count} meetings`);

    await connection.end();
    console.log('\n✅ Database connection test passed!');
    console.log('   Services should be able to connect to the database.\n');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure MySQL is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Check your MySQL username and password in .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   Database does not exist. Run: npm run setup in backend/shared/database');
    }
    process.exit(1);
  }
}

testConnection().catch(console.error);

