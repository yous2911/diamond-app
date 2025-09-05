#!/usr/bin/env node

/**
 * Setup Authentication Database
 * This script updates the students table schema and seeds test data
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reved_kids',
  port: process.env.DB_PORT || 3306
};

async function runSQLFile(filePath) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log(`📄 Running SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
    
    console.log(`✅ Successfully executed: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error executing ${filePath}:`, error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function main() {
  try {
    console.log('🚀 Setting up authentication database...\n');
    
    // Step 1: Update schema
    console.log('📋 Step 1: Updating students table schema...');
    await runSQLFile(path.join(__dirname, 'update-students-schema.sql'));
    
    // Step 2: Seed test students
    console.log('\n👥 Step 2: Seeding test students...');
    await runSQLFile(path.join(__dirname, 'seed-test-students.sql'));
    
    console.log('\n🎉 Database setup complete!');
    console.log('\n📝 Test Students Created:');
    console.log('   • Emma Martin (emma.martin@test.com) - CP - 150 XP');
    console.log('   • Lucas Dubois (lucas.dubois@test.com) - CP - 200 XP');
    console.log('   • Léa Bernard (lea.bernard@test.com) - CP - 100 XP');
    console.log('   • Noah Garcia (noah.garcia@test.com) - CE1 - 300 XP');
    console.log('   • Alice Rodriguez (alice.rodriguez@test.com) - CE1 - 250 XP');
    console.log('\n🔑 All students use password: password123');
    console.log('\n🧪 You can now test login with any of these accounts!');
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
