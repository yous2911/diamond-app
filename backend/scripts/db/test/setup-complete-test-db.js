/**
 * Complete Test Database Setup Script
 * Sets up all required data for authentication + GDPR compliance
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Database configuration - from your env.backend file
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'thisisREALLYIT29!',
  database: 'reved_kids'
};

// Test students data
const TEST_STUDENTS = [
  {
    prenom: 'Emma', nom: 'Martin',
    email: 'emma.martin@test.com',
    dateNaissance: '2017-03-15',
    niveauActuel: 'CP', niveauScolaire: 'CP',
    totalPoints: 150, xp: 150,
    parentName: 'Marie Martin', parentEmail: 'marie.martin@email.com'
  },
  {
    prenom: 'Lucas', nom: 'Dubois',
    email: 'lucas.dubois@test.com', 
    dateNaissance: '2017-05-20',
    niveauActuel: 'CP', niveauScolaire: 'CP',
    totalPoints: 200, xp: 200,
    parentName: 'Pierre Dubois', parentEmail: 'pierre.dubois@email.com'
  },
  {
    prenom: 'Léa', nom: 'Bernard',
    email: 'lea.bernard@test.com',
    dateNaissance: '2017-08-10', 
    niveauActuel: 'CP', niveauScolaire: 'CP',
    totalPoints: 100, xp: 100,
    parentName: 'Sophie Bernard', parentEmail: 'sophie.bernard@email.com'
  },
  {
    prenom: 'Noah', nom: 'Garcia',
    email: 'noah.garcia@test.com',
    dateNaissance: '2016-01-25',
    niveauActuel: 'CE1', niveauScolaire: 'CE1', 
    totalPoints: 300, xp: 300,
    parentName: 'Carlos Garcia', parentEmail: 'carlos.garcia@email.com'
  },
  {
    prenom: 'Alice', nom: 'Rodriguez',
    email: 'alice.rodriguez@test.com',
    dateNaissance: '2016-11-30',
    niveauActuel: 'CE1', niveauScolaire: 'CE1',
    totalPoints: 250, xp: 250,
    parentName: 'Ana Rodriguez', parentEmail: 'ana.rodriguez@email.com'
  }
];

async function setupCompleteTestDatabase() {
  let connection;
  
  try {
    console.log('🚀 Starting complete test database setup...\n');
    
    // Connect to database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to MySQL database');

    // Generate password hash (same for all test accounts)
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 12);
    console.log(`🔐 Generated password hash for: ${password}`);

    // Step 1: Update students table structure if needed
    console.log('\n📋 Step 1: Ensuring students table has all required columns...');
    
    const requiredColumns = [
      "ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE",
      "ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)", 
      "ADD COLUMN IF NOT EXISTS niveau_scolaire VARCHAR(20)",
      "ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0",
      "ADD COLUMN IF NOT EXISTS mascotte_color VARCHAR(20) DEFAULT '#ff6b35'"
    ];

    for (const column of requiredColumns) {
      try {
        await connection.execute(`ALTER TABLE students ${column}`);
      } catch (error) {
        if (!error.message.includes('Duplicate column')) {
          console.log(`   ⚠️  Column might already exist: ${column.split(' ')[5]}`);
        }
      }
    }
    console.log('✅ Students table structure verified');

    // Step 2: Handle existing data (update instead of delete due to foreign keys)
    console.log('\n🔄 Step 2: Handling existing test data...');
    const [existingStudents] = await connection.execute(
      'SELECT id, email FROM students WHERE email LIKE "%@test.com"'
    );
    console.log(`   Found ${existingStudents.length} existing test students`);

    // Step 3: Insert/Update test students
    console.log('\n👥 Step 3: Setting up test students...');
    
    const upsertStudentQuery = `
      INSERT INTO students (
        prenom, nom, email, password_hash, date_naissance,
        niveau_actuel, niveau_scolaire, total_points, xp,
        serie_jours, mascotte_type, mascotte_color,
        est_connecte, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        niveau_actuel = VALUES(niveau_actuel),
        niveau_scolaire = VALUES(niveau_scolaire),
        total_points = VALUES(total_points),
        xp = VALUES(xp),
        updated_at = NOW()
    `;

    const studentIds = [];
    for (const student of TEST_STUDENTS) {
      try {
        const [result] = await connection.execute(upsertStudentQuery, [
          student.prenom, student.nom, student.email, passwordHash,
          student.dateNaissance, student.niveauActuel, student.niveauScolaire,
          student.totalPoints, student.xp, 0, 'dragon', '#ff6b35', false
        ]);
        
        // Get the student ID (either inserted or existing)
        if (result.insertId) {
          studentIds.push(result.insertId);
          console.log(`   ✅ Added: ${student.prenom} ${student.nom} (ID: ${result.insertId})`);
        } else {
          // If no insertId, it was an update - get the existing ID
          const [existing] = await connection.execute(
            'SELECT id FROM students WHERE email = ?',
            [student.email]
          );
          const studentId = existing[0]?.id;
          studentIds.push(studentId);
          console.log(`   🔄 Updated: ${student.prenom} ${student.nom} (ID: ${studentId})`);
        }
      } catch (error) {
        console.log(`   ⚠️ Issue with ${student.prenom} ${student.nom}:`, error.message);
      }
    }

    // Step 4: Setup GDPR compliance tables  
    console.log('\n🛡️  Step 4: Setting up GDPR compliance data...');

    // Create parental consent records
    const parentalConsentQuery = `
      INSERT INTO parental_consent (
        student_id, parent_name, parent_email, consent_given, consent_date, created_at
      ) VALUES (?, ?, ?, TRUE, NOW(), NOW())
      ON DUPLICATE KEY UPDATE consent_given = TRUE, consent_date = NOW()
    `;

    // Create consent preferences
    const consentPrefsQuery = `
      INSERT INTO consent_preferences (
        student_id, consent_type, granted, created_at  
      ) VALUES (?, ?, TRUE, NOW())
      ON DUPLICATE KEY UPDATE granted = TRUE
    `;

    for (let i = 0; i < TEST_STUDENTS.length; i++) {
      const studentId = studentIds[i];
      const student = TEST_STUDENTS[i];

      // Add parental consent
      await connection.execute(parentalConsentQuery, [
        studentId, student.parentName, student.parentEmail
      ]);

      // Add basic consent preferences
      const consentTypes = ['data_processing', 'analytics', 'marketing'];
      for (const consentType of consentTypes) {
        await connection.execute(consentPrefsQuery, [studentId, consentType]);
      }

      console.log(`   ✅ GDPR setup for: ${student.prenom} ${student.nom}`);
    }

    // Step 5: Verification
    console.log('\n🔍 Step 5: Verifying setup...');
    
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

    // Check GDPR data
    const studentIdPlaceholders = studentIds.map(() => '?').join(',');
    const [parentalCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM parental_consent WHERE student_id IN (${studentIdPlaceholders})`,
      studentIds
    );
    
    const [consentCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM consent_preferences WHERE student_id IN (${studentIdPlaceholders})`, 
      studentIds
    );

    console.log('🛡️  GDPR Compliance Status:');
    console.log(`   👪 Parental consents: ${parentalCount[0]?.count || 0}`);
    console.log(`   ✅ Consent preferences: ${consentCount[0]?.count || 0}`);

    console.log('\n🎉 SUCCESS! Complete test database setup finished!');
    console.log('\n🔑 Login credentials for testing:');
    console.log('   👤 Any student name (Emma Martin, Lucas Dubois, etc.)');
    console.log('   🔐 Password: password123');
    console.log('   🌐 Frontend: http://localhost:3004');
    console.log('   🔗 Backend API: http://localhost:3003/api');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Fix: Update DB_CONFIG at the top of this script with your MySQL credentials');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Fix: Create the "fastrevkids" database first, or update DB_CONFIG.database');
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
  setupCompleteTestDatabase();
}

module.exports = { setupCompleteTestDatabase };