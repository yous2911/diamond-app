/**
 * Check Database Schema and Seed
 * Verifies database structure and seeds test data
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

// Load environment
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

async function checkAndSeed() {
  let connection;
  
  try {
    console.log('🔍 Checking database structure...\n');
    
    // Connect
    connection = await mysql.createConnection({
      ...DB_CONFIG,
      multipleStatements: true
    });
    console.log('✅ Connected to database\n');
    
    // Check if students table exists
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(`📋 Found ${tableNames.length} tables: ${tableNames.slice(0, 5).join(', ')}${tableNames.length > 5 ? '...' : ''}\n`);
    
    if (!tableNames.includes('students')) {
      console.log('⚠️  Students table not found. Running migrations first...\n');
      console.log('💡 Run: npm run migrate\n');
      return;
    }
    
    // Check students table structure
    const [columns] = await connection.execute('DESCRIBE students');
    const columnNames = columns.map(c => c.Field);
    
    console.log('📊 Students table columns:');
    columns.forEach(col => {
      console.log(`   ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('');
    
    // Check for password_hash column
    const hasPasswordHash = columnNames.includes('password_hash');
    const hasPasswordHashCamel = columnNames.includes('passwordHash');
    
    if (!hasPasswordHash && !hasPasswordHashCamel) {
      console.log('⚠️  WARNING: No password_hash column found!');
      console.log('   This might cause login issues.\n');
    } else {
      console.log('✅ password_hash column found\n');
    }
    
    // Check for role column
    if (!columnNames.includes('role')) {
      console.log('⚠️  WARNING: No role column found!');
      console.log('   Run migration 004_add_role_to_students.sql\n');
    } else {
      console.log('✅ role column found\n');
    }
    
    // Check existing students
    const [students] = await connection.execute('SELECT COUNT(*) as count FROM students');
    console.log(`👥 Existing students: ${students[0].count}\n`);
    
    // Check if test accounts exist
    const [testStudents] = await connection.execute(
      `SELECT prenom, nom, email, 
              CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN '✅' ELSE '❌' END as has_password
       FROM students 
       WHERE email LIKE '%@test.com' OR prenom IN ('Emma', 'Lucas', 'Léa', 'Noah', 'Alice')
       LIMIT 10`
    );
    
    if (testStudents.length > 0) {
      console.log('🧪 Test accounts found:');
      testStudents.forEach(s => {
        console.log(`   ${s.has_password} ${s.prenom} ${s.nom} ${s.email || '(no email)'}`);
      });
      console.log('');
    }
    
    // Seed test accounts if needed
    console.log('🌱 Seeding test accounts...\n');
    const passwordHash = await bcrypt.hash('password123456', 12); // 15 characters
    
    const testAccounts = [
      { prenom: 'Emma', nom: 'Martin', email: 'emma.martin@test.com', niveau: 'CP', xp: 150 },
      { prenom: 'Lucas', nom: 'Dubois', email: 'lucas.dubois@test.com', niveau: 'CP', xp: 200 },
      { prenom: 'Léa', nom: 'Bernard', email: 'lea.bernard@test.com', niveau: 'CP', xp: 100 },
      { prenom: 'Noah', nom: 'Garcia', email: 'noah.garcia@test.com', niveau: 'CE1', xp: 300 },
      { prenom: 'Alice', nom: 'Rodriguez', email: 'alice.rodriguez@test.com', niveau: 'CE1', xp: 250 }
    ];
    
    let seeded = 0;
    for (const account of testAccounts) {
      try {
        // Check if exists
        const [existing] = await connection.execute(
          'SELECT id FROM students WHERE prenom = ? AND nom = ?',
          [account.prenom, account.nom]
        );
        
        // Check if role column exists
        const [columns] = await connection.execute('DESCRIBE students');
        const hasRole = columns.some(c => c.Field === 'role');
        
        if (existing.length > 0) {
          // Update existing
          if (hasRole) {
            await connection.execute(
              `UPDATE students 
               SET email = ?, password_hash = ?, niveau_actuel = ?, niveau_scolaire = ?, total_points = ?, xp = ?, role = 'student'
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
          } else {
            await connection.execute(
              `UPDATE students 
               SET email = ?, password_hash = ?, niveau_actuel = ?, niveau_scolaire = ?, total_points = ?, xp = ?
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
          }
          console.log(`   ✅ Updated: ${account.prenom} ${account.nom}`);
        } else {
          // Insert new
          if (hasRole) {
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
          } else {
            await connection.execute(
              `INSERT INTO students (prenom, nom, email, password_hash, date_naissance, niveau_actuel, niveau_scolaire, total_points, xp, serie_jours, mascotte_type, est_connecte, created_at, updated_at)
               VALUES (?, ?, ?, ?, '2017-01-01', ?, ?, ?, ?, 0, 'dragon', false, NOW(), NOW())`,
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
          }
          console.log(`   ✅ Created: ${account.prenom} ${account.nom}`);
          seeded++;
        }
      } catch (error) {
        console.log(`   ⚠️  Error with ${account.prenom} ${account.nom}: ${error.message}`);
      }
    }
    
    console.log(`\n✅ Seeding complete! ${seeded} new accounts created.\n`);
    
    // Verify final state
    const [finalCheck] = await connection.execute(
      `SELECT prenom, nom, email, 
              CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN '✅' ELSE '❌' END as has_password
       FROM students 
       WHERE email LIKE '%@test.com'
       ORDER BY prenom`
    );
    
    console.log('📊 Final test accounts:');
    finalCheck.forEach(s => {
      console.log(`   ${s.has_password} ${s.prenom} ${s.nom} - ${s.email}`);
    });
    
    console.log('\n🎉 Database check and seed complete!');
    console.log('\n🔑 Login credentials:');
    console.log('   Password: password123456 (15 characters)');
    console.log('   Test accounts are ready to use!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Fix: Check MySQL credentials in env.backend');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Fix: Create database first or run migrations');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  checkAndSeed();
}

module.exports = { checkAndSeed };


