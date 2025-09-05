/**
 * Fresh Database Setup Script
 * Creates a completely new database with all tables and test data
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'thisisREALLYIT29!',
  multipleStatements: true
};

async function setupFreshDatabase() {
  let connection;
  
  try {
    console.log('🚀 Setting up fresh database...\n');
    
    // Connect to MySQL (without database selection)
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to MySQL server');

    // Read the SQL script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'create-fresh-database.sql'), 'utf8');
    console.log('📄 SQL script loaded');

    // Execute script step by step
    console.log('⚡ Executing database creation script...');
    
    // Step 1: Drop and create database
    console.log('   🗑️  Dropping existing database...');
    await connection.execute('DROP DATABASE IF EXISTS reved_kids');
    console.log('   🆕 Creating new database...');
    await connection.execute('CREATE DATABASE reved_kids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    await connection.execute('USE reved_kids');
    
    // Step 2: Execute table creation and data insertion
    console.log('   📋 Creating tables and inserting data...');
    const sqlWithoutDbCommands = sqlScript
      .replace(/DROP DATABASE IF EXISTS reved_kids;/g, '')
      .replace(/CREATE DATABASE reved_kids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;/g, '')
      .replace(/USE reved_kids;/g, '');
    
    await connection.execute(sqlWithoutDbCommands);
    console.log('✅ Database script executed successfully');

    // Verify the setup by checking students table
    await connection.execute('USE reved_kids');
    const [students] = await connection.execute(`
      SELECT id, prenom, nom, email, niveau_scolaire, xp, 
             password_hash IS NOT NULL as has_password
      FROM students 
      WHERE email LIKE '%@test.com'
      ORDER BY id
    `);

    console.log('\n📊 Test Students Created:');
    students.forEach(student => {
      console.log(`   👤 ${student.prenom} ${student.nom}`);
      console.log(`      📧 ${student.email}`);
      console.log(`      🎓 ${student.niveau_scolaire} | XP: ${student.xp}`);
      console.log(`      🔐 Password: ${student.has_password ? '✅' : '❌'}`);
      console.log('');
    });

    // Check table counts
    const tables = [
      'students', 'exercises', 'parental_consent', 
      'consent_preferences', 'leaderboards', 'student_badges'
    ];
    
    console.log('📈 Database Statistics:');
    for (const table of tables) {
      const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   📋 ${table}: ${result[0].count} records`);
    }

    console.log('\n🎉 SUCCESS! Fresh database setup completed!');
    console.log('\n🔑 Login credentials for testing:');
    console.log('   👤 Any student email (emma.martin@test.com, etc.)');
    console.log('   🔐 Password: password123');
    console.log('   🌐 Frontend: http://localhost:3004');
    console.log('   🔗 Backend API: http://localhost:3003/api');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Fix: Check MySQL credentials in DB_CONFIG');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the setup
if (require.main === module) {
  setupFreshDatabase();
}

module.exports = { setupFreshDatabase };