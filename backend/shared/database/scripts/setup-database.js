/**
 * Setup Database
 * Creates the database if it doesn't exist
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../../services/auth-service/.env' });

async function setupDatabase() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306');
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'faithconnect_test';

  console.log('🔧 Setting up database...\n');
  console.log(`Host: ${host}:${port}`);
  console.log(`User: ${user}`);
  console.log(`Database: ${database}\n`);

  try {
    // Connect without specifying database
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    console.log(`✅ Database '${database}' ready`);

    await connection.end();
    console.log('\n✅ Database setup complete!');
    console.log('   You can now run: npm run migrate:mysql\n');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure MySQL is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Check your MySQL username and password');
    }
    process.exit(1);
  }
}

setupDatabase().catch(console.error);

