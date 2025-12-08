/**
 * FIX EVERYTHING - One script to rule them all
 * Creates accounts, sets passwords, adds roles - everything
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

const TEST_PASSWORD = 'password123456'; // 15 characters

async function fixEverything() {
  let connection;
  
  try {
    console.log('🚀 FIXING EVERYTHING...\n');
    
    connection = await mysql.createConnection({
      ...DB_CONFIG,
      multipleStatements: true
    });
    console.log('✅ Connected to database\n');
    
    // Step 1: Add role column if missing
    console.log('1️⃣  Checking role column...');
    try {
      const [columns] = await connection.execute('DESCRIBE students');
      const hasRole = columns.some(c => c.Field === 'role');
      
      if (!hasRole) {
        await connection.execute(
          "ALTER TABLE students ADD COLUMN role ENUM('student', 'admin') NOT NULL DEFAULT 'student'"
        );
        console.log('   ✅ Added role column\n');
      } else {
        console.log('   ✅ Role column exists\n');
      }
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
      console.log('   ✅ Role column already exists\n');
    }
    
    // Step 2: Hash password
    console.log('2️⃣  Hashing password...');
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
    console.log('   ✅ Password hashed\n');
    
    // Step 3: Create/Update accounts
    console.log('3️⃣  Creating/updating test accounts...\n');
    
    const testAccounts = [
      { prenom: 'Emma', nom: 'Martin', email: 'emma.martin@test.com', niveau: 'CP', xp: 150 },
      { prenom: 'Lucas', nom: 'Dubois', email: 'lucas.dubois@test.com', niveau: 'CP', xp: 200 },
      { prenom: 'Léa', nom: 'Bernard', email: 'lea.bernard@test.com', niveau: 'CP', xp: 100 },
      { prenom: 'Noah', nom: 'Garcia', email: 'noah.garcia@test.com', niveau: 'CE1', xp: 300 },
      { prenom: 'Alice', nom: 'Rodriguez', email: 'alice.rodriguez@test.com', niveau: 'CE1', xp: 250 }
    ];
    
    for (const account of testAccounts) {
      try {
        // Check if exists
        const [existing] = await connection.execute(
          'SELECT id FROM students WHERE prenom = ? AND nom = ?',
          [account.prenom, account.nom]
        );
        
        if (existing.length > 0) {
          // Update existing
          await connection.execute(
            `UPDATE students 
             SET email = ?, password_hash = ?, niveau_actuel = ?, niveau_scolaire = ?, 
                 total_points = ?, xp = ?, role = 'student'
             WHERE prenom = ? AND nom = ?`,
            [
              account.email,
              passwordHash,
              account.niveau,
              account.niveau,
              account.xp,
              account.xp,
              account.prenom,
              account.nom
            ]
          );
          console.log(`   ✅ Updated: ${account.prenom} ${account.nom}`);
        } else {
          // Insert new
          await connection.execute(
            `INSERT INTO students (prenom, nom, email, password_hash, date_naissance, niveau_actuel, niveau_scolaire, total_points, xp, serie_jours, mascotte_type, est_connecte, role, created_at, updated_at)
             VALUES (?, ?, ?, ?, '2017-01-01', ?, ?, ?, ?, 0, 'dragon', false, 'student', NOW(), NOW())`,
            [
              account.prenom,
              account.nom,
              account.email,
              passwordHash,
              account.niveau,
              account.niveau,
              account.xp,
              account.xp
            ]
          );
          console.log(`   ✅ Created: ${account.prenom} ${account.nom}`);
        }
      } catch (error) {
        console.log(`   ⚠️  Error with ${account.prenom} ${account.nom}: ${error.message}`);
      }
    }
    
    // Step 4: Verify
    console.log('\n4️⃣  Verifying accounts...\n');
    const [verify] = await connection.execute(
      `SELECT prenom, nom, email,
              CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN '✅' ELSE '❌' END as has_password,
              CASE WHEN role IS NOT NULL THEN role ELSE '❌' END as role
       FROM students 
       WHERE email LIKE '%@test.com'
       ORDER BY prenom`
    );
    
    verify.forEach(acc => {
      console.log(`   ${acc.has_password} ${acc.prenom} ${acc.nom} - ${acc.email} (role: ${acc.role})`);
    });
    
    // Step 5: Test password
    console.log('\n5️⃣  Testing password...\n');
    const [testAcc] = await connection.execute(
      "SELECT password_hash FROM students WHERE prenom = 'Emma' AND nom = 'Martin' LIMIT 1"
    );
    
    if (testAcc.length > 0 && testAcc[0].password_hash) {
      const isValid = await bcrypt.compare(TEST_PASSWORD, testAcc[0].password_hash);
      console.log(`   Password test: ${isValid ? '✅ WORKS' : '❌ FAILED'}\n`);
    }
    
    console.log('\n🎉 EVERYTHING FIXED!\n');
    console.log('📋 Login Credentials:');
    console.log('   Prénom: Emma');
    console.log('   Nom: Martin');
    console.log(`   Password: ${TEST_PASSWORD}\n`);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Check MySQL credentials in env.backend');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Run migrations first.');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixEverything();




