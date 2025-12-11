/**
 * Test MySQL Connection
 * Simple script to check if MySQL is running and accessible
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', 'env.backend');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
  console.log('✅ Loaded environment from env.backend\n');
} else {
  console.log('⚠️  env.backend not found, using defaults\n');
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reved_kids',
};

console.log('🔍 Testing MySQL Connection...\n');
console.log('Configuration:');
console.log(`   Host: ${DB_CONFIG.host}`);
console.log(`   Port: ${DB_CONFIG.port}`);
console.log(`   User: ${DB_CONFIG.user}`);
console.log(`   Database: ${DB_CONFIG.database}`);
console.log(`   Password: ${DB_CONFIG.password ? '***' + DB_CONFIG.password.slice(-3) : '(empty)'}\n`);

async function testConnection() {
  let connection;
  
  try {
    console.log('⏳ Attempting to connect...\n');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ SUCCESS! MySQL is working!\n');
    
    // Test query
    console.log('📊 Running test query...');
    const [result] = await connection.execute('SELECT VERSION() as version, DATABASE() as database');
    console.log(`   MySQL Version: ${result[0].version}`);
    console.log(`   Current Database: ${result[0].database}\n`);
    
    // Check if students table exists
    console.log('📋 Checking tables...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    if (tableNames.length === 0) {
      console.log('   ⚠️  No tables found in database');
      console.log('   💡 Run migrations: npm run migrate\n');
    } else {
      console.log(`   ✅ Found ${tableNames.length} tables`);
      console.log(`   Tables: ${tableNames.slice(0, 5).join(', ')}${tableNames.length > 5 ? '...' : ''}\n`);
      
      // Check if students table exists
      if (tableNames.includes('students')) {
        console.log('   ✅ students table exists\n');
        
        // Count students
        const [count] = await connection.execute('SELECT COUNT(*) as total FROM students');
        console.log(`   📊 Total students: ${count[0].total}\n`);
      } else {
        console.log('   ❌ students table NOT found');
        console.log('   💡 Run migrations: npm run migrate\n');
      }
    }
    
    console.log('🎉 MySQL connection test PASSED!\n');
    
  } catch (error) {
    console.error('\n❌ MySQL connection FAILED!\n');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 MySQL server is not running or not accessible');
      console.log('   - Check if MySQL service is running');
      console.log('   - Check if the port is correct (default: 3306)');
      console.log('   - Check firewall settings\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Wrong username or password');
      console.log('   - Check DB_USER and DB_PASSWORD in env.backend\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist');
      console.log('   - Create database: CREATE DATABASE reved_kids;');
      console.log('   - Or run migrations: npm run migrate\n');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      console.log('\n💡 Cannot reach MySQL server');
      console.log('   - Check if MySQL is running');
      console.log('   - Check DB_HOST in env.backend\n');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Connection closed\n');
    }
  }
}

testConnection();







