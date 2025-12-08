/**
 * Check What's Actually in the Database
 * Shows exactly what accounts exist and their passwords
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', 'env.backend');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reved_kids',
};

async function checkAccounts() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');
    
    // Check for test accounts
    const [accounts] = await connection.execute(
      `SELECT id, prenom, nom, email, 
              CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 'YES' ELSE 'NO' END as has_password,
              CASE WHEN role IS NOT NULL THEN role ELSE 'NULL' END as role
       FROM students 
       WHERE email LIKE '%@test.com' OR prenom IN ('Emma', 'Lucas', 'Léa', 'Noah', 'Alice')
       ORDER BY prenom`
    );
    
    if (accounts.length === 0) {
      console.log('❌ NO TEST ACCOUNTS FOUND IN DATABASE!\n');
      console.log('Run: node scripts/check-and-seed-db.js\n');
      return;
    }
    
    console.log(`📋 Found ${accounts.length} test accounts:\n`);
    accounts.forEach(acc => {
      console.log(`   ${acc.prenom} ${acc.nom}`);
      console.log(`      Email: ${acc.email || 'NO EMAIL'}`);
      console.log(`      Password: ${acc.has_password}`);
      console.log(`      Role: ${acc.role}`);
      console.log(`      ID: ${acc.id}`);
      console.log('');
    });
    
    // Test password
    console.log('\n🔐 Testing password "password123456"...\n');
    const testPassword = 'password123456';
    
    for (const acc of accounts) {
      if (acc.has_password === 'YES') {
        const [student] = await connection.execute(
          'SELECT password_hash FROM students WHERE id = ?',
          [acc.id]
        );
        
        if (student.length > 0 && student[0].password_hash) {
          const isValid = await bcrypt.compare(testPassword, student[0].password_hash);
          console.log(`   ${acc.prenom} ${acc.nom}: ${isValid ? '✅ PASSWORD WORKS' : '❌ PASSWORD DOES NOT MATCH'}`);
        }
      }
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Check MySQL credentials in env.backend');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Run migrations first.');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAccounts();




