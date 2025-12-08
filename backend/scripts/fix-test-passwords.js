/**
 * Fix Test Account Passwords
 * Updates all test accounts to use a valid 12+ character password
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Load environment variables from env.backend if it exists
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', 'env.backend');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
  console.log('✅ Loaded environment from env.backend');
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reved_kids',
};

// New password: password123456 (15 characters - exceeds minimum requirement)
const NEW_PASSWORD = 'password123456';
const SALT_ROUNDS = 12;

async function fixTestPasswords() {
  let connection;
  
  try {
    console.log('🔧 Fixing test account passwords...\n');
    
    // Connect to database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');
    
    // Hash the new password
    console.log('🔐 Hashing new password...');
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, SALT_ROUNDS);
    console.log('✅ Password hashed\n');
    
    // Update all test accounts
    const testEmails = [
      'emma.martin@test.com',
      'lucas.dubois@test.com',
      'lea.bernard@test.com',
      'noah.garcia@test.com',
      'alice.rodriguez@test.com'
    ];
    
    console.log('📝 Updating test accounts...');
    for (const email of testEmails) {
      const [result] = await connection.execute(
        `UPDATE students 
         SET password_hash = ? 
         WHERE email = ?`,
        [passwordHash, email]
      );
      
      if (result.affectedRows > 0) {
        console.log(`   ✅ Updated: ${email}`);
      } else {
        console.log(`   ⚠️  Not found: ${email}`);
      }
    }
    
    // Also update by prenom/nom for accounts that might not have emails
    const testAccounts = [
      { prenom: 'Emma', nom: 'Martin' },
      { prenom: 'Lucas', nom: 'Dubois' },
      { prenom: 'Léa', nom: 'Bernard' },
      { prenom: 'Noah', nom: 'Garcia' },
      { prenom: 'Alice', nom: 'Rodriguez' },
      { prenom: 'Alice', nom: 'Dupont' },
      { prenom: 'Bob', nom: 'Martin' },
      { prenom: 'Charlie', nom: 'Durand' },
      { prenom: 'Lucas', nom: 'Martin' },
      { prenom: 'Emma', nom: 'Dubois' },
      { prenom: 'Noah', nom: 'Lefevre' }
    ];
    
    console.log('\n📝 Updating accounts by name...');
    for (const account of testAccounts) {
      const [result] = await connection.execute(
        `UPDATE students 
         SET password_hash = ? 
         WHERE prenom = ? AND nom = ? AND (password_hash IS NULL OR password_hash = '')`,
        [passwordHash, account.prenom, account.nom]
      );
      
      if (result.affectedRows > 0) {
        console.log(`   ✅ Updated: ${account.prenom} ${account.nom}`);
      }
    }
    
    // Verify updates
    console.log('\n🔍 Verifying updates...');
    const [students] = await connection.execute(`
      SELECT prenom, nom, email, 
             CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN '✅' ELSE '❌' END as has_password
      FROM students 
      WHERE email LIKE '%@test.com' 
         OR prenom IN ('Emma', 'Lucas', 'Léa', 'Noah', 'Alice', 'Bob', 'Charlie')
      ORDER BY prenom, nom
    `);
    
    console.log('\n📊 Updated Accounts:');
    students.forEach(student => {
      console.log(`   ${student.has_password} ${student.prenom} ${student.nom} ${student.email || '(no email)'}`);
    });
    
    console.log('\n🎉 Password update complete!');
    console.log('\n🔑 New login credentials:');
    console.log(`   Password: ${NEW_PASSWORD}`);
    console.log('   (12 characters - meets validation requirements)');
    console.log('\n📝 Test accounts:');
    testEmails.forEach(email => {
      const [prenom, nom] = email.split('@')[0].split('.');
      console.log(`   Prénom: ${prenom.charAt(0).toUpperCase() + prenom.slice(1)}, Nom: ${nom.charAt(0).toUpperCase() + nom.slice(1)}, Password: ${NEW_PASSWORD}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Fix: Check MySQL credentials in DB_CONFIG or environment variables');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  fixTestPasswords();
}

module.exports = { fixTestPasswords };

