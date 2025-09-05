#!/usr/bin/env node

/**
 * 🎮 Gamification Setup Script
 * 
 * Runs the database migrations and seeds the system with realistic data
 * Usage: node scripts/setup-gamification.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'thisisREALLYIT29!',
  database: process.env.DB_NAME || 'reved_kids',
  multipleStatements: true
};

async function setupGamification() {
  let connection;

  try {
    console.log('🎮 Starting gamification system setup...');
    console.log(`📡 Connecting to MySQL at ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database');

    // Read and execute the migration SQL
    const migrationPath = path.join(__dirname, '..', 'src', 'db', 'migrations', '002_gamification_system.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    console.log('📄 Reading migration file...');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Executing gamification migration...');
    await connection.query(migrationSQL);
    
    console.log('✅ Gamification system installed successfully!');

    // Verify installation
    console.log('🔍 Verifying installation...');
    
    const [studentsWithXp] = await connection.query(
      'SELECT COUNT(*) as count FROM students WHERE xp > 0'
    );
    
    const [achievementsCount] = await connection.query(
      'SELECT COUNT(*) as count FROM achievements'
    );
    
    const [streaksCount] = await connection.query(
      'SELECT COUNT(*) as count FROM user_streaks'
    );

    console.log('\n📊 Installation Summary:');
    console.log(`   - Students with XP: ${studentsWithXp[0].count}`);
    console.log(`   - Total achievements: ${achievementsCount[0].count}`);  
    console.log(`   - Students with streaks: ${streaksCount[0].count}`);

    console.log('\n🎯 Next Steps:');
    console.log('   1. Start your backend server: npm run dev');
    console.log('   2. Test the gamification endpoints:');
    console.log('      - GET /api/profile/1');
    console.log('      - GET /api/leaderboard?userId=1&centerOnMe=true');
    console.log('      - POST /api/progress/xp {"userId":1,"delta":50,"reason":"exercise_complete"}');
    console.log('   3. Import PsychologyDrivenDashboard in your React app');

    console.log('\n🚀 Your gamification system is ready for deployment!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
if (require.main === module) {
  setupGamification()
    .then(() => {
      console.log('✅ Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupGamification };