#!/usr/bin/env node

/**
 * Staging Database Setup using Node.js
 * Alternative to MySQL command line tools
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'thisisREALLYIT29!',
  multipleStatements: true
};

async function createStagingDatabase() {
  let connection;
  
  try {
    log('🔌 Connecting to MySQL...', 'blue');
    connection = await mysql.createConnection(dbConfig);
    
    log('✅ Connected to MySQL successfully', 'green');
    
    // Create staging database
    log('📊 Creating staging database...', 'blue');
    await connection.query('CREATE DATABASE IF NOT EXISTS `reved_kids_staging` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    log('✅ Staging database created', 'green');
    
    // Use staging database
    await connection.query('USE `reved_kids_staging`');
    
    // Create tables
    log('🏗️  Creating tables...', 'blue');
    
    // Students table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`students\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`prenom\` varchar(100) NOT NULL,
        \`nom\` varchar(100) NOT NULL,
        \`email\` varchar(255) NOT NULL UNIQUE,
        \`passwordHash\` varchar(255) NOT NULL,
        \`role\` enum('student','parent','teacher','admin') DEFAULT 'student',
        \`niveauActuel\` enum('CP','CE1','CE2','CM1','CM2') DEFAULT 'CP',
        \`totalPoints\` int(11) DEFAULT 0,
        \`serieJours\` int(11) DEFAULT 0,
        \`mascotteType\` varchar(50) DEFAULT 'dragon',
        \`estConnecte\` boolean DEFAULT false,
        \`dernierAcces\` timestamp NULL DEFAULT NULL,
        \`failedLoginAttempts\` int(11) DEFAULT 0,
        \`accountLockedUntil\` timestamp NULL DEFAULT NULL,
        \`passwordResetToken\` varchar(255) NULL DEFAULT NULL,
        \`passwordResetExpires\` timestamp NULL DEFAULT NULL,
        \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_email\` (\`email\`),
        KEY \`idx_niveau\` (\`niveauActuel\`),
        KEY \`idx_created\` (\`createdAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Competencies table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`competencies\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`code\` varchar(50) NOT NULL UNIQUE,
        \`nom\` varchar(255) NOT NULL,
        \`matiere\` varchar(50) NOT NULL,
        \`domaine\` varchar(100) NOT NULL,
        \`niveau\` varchar(20) NOT NULL,
        \`difficulte\` enum('L','M','H','E') DEFAULT 'L',
        \`description\` text,
        \`objectifs\` text,
        \`prerequis\` text,
        \`xp_reward\` int(11) DEFAULT 10,
        \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_code\` (\`code\`),
        KEY \`idx_matiere\` (\`matiere\`),
        KEY \`idx_niveau\` (\`niveau\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Exercises table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`exercises\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`titre\` varchar(255) NOT NULL,
        \`matiere\` varchar(50) NOT NULL,
        \`niveau\` varchar(20) NOT NULL,
        \`difficulte\` enum('L','M','H','E') DEFAULT 'L',
        \`competenceCode\` varchar(50) NOT NULL,
        \`questions\` json NOT NULL,
        \`reponses\` json NOT NULL,
        \`explications\` json,
        \`tempsEstime\` int(11) DEFAULT 300,
        \`xp_reward\` int(11) DEFAULT 5,
        \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_competence\` (\`competenceCode\`),
        KEY \`idx_matiere\` (\`matiere\`),
        KEY \`idx_niveau\` (\`niveau\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Student Progress table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`studentProgress\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`studentId\` int(11) NOT NULL,
        \`exerciseId\` int(11) NOT NULL,
        \`competenceCode\` varchar(50) NOT NULL,
        \`score\` decimal(5,2) DEFAULT 0.00,
        \`completed\` boolean DEFAULT false,
        \`timeSpent\` int(11) DEFAULT 0,
        \`attempts\` int(11) DEFAULT 1,
        \`lastAttempt\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_student\` (\`studentId\`),
        KEY \`idx_exercise\` (\`exerciseId\`),
        KEY \`idx_competence\` (\`competenceCode\`),
        KEY \`idx_completed\` (\`completed\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`sessions\` (
        \`id\` varchar(255) NOT NULL,
        \`studentId\` int(11) NOT NULL,
        \`data\` json,
        \`expiresAt\` timestamp NOT NULL,
        \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_student\` (\`studentId\`),
        KEY \`idx_expires\` (\`expiresAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // GDPR Files table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`gdprFiles\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`studentId\` int(11) NOT NULL,
        \`fileName\` varchar(255) NOT NULL,
        \`filePath\` varchar(500) NOT NULL,
        \`fileSize\` int(11) NOT NULL,
        \`mimeType\` varchar(100) NOT NULL,
        \`uploadedAt\` timestamp DEFAULT CURRENT_TIMESTAMP,
        \`anonymizedAt\` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_student\` (\`studentId\`),
        KEY \`idx_uploaded\` (\`uploadedAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // GDPR Data Processing Log table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`gdprDataProcessingLog\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`studentId\` int(11) NULL DEFAULT NULL,
        \`action\` enum('CREATE','READ','UPDATE','DELETE','EXPORT','ANONYMIZE') NOT NULL,
        \`dataType\` varchar(100) NOT NULL,
        \`details\` text,
        \`ipAddress\` varchar(45),
        \`userAgent\` text,
        \`requestId\` varchar(255),
        \`createdAt\` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_student\` (\`studentId\`),
        KEY \`idx_action\` (\`action\`),
        KEY \`idx_created\` (\`createdAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    log('✅ All tables created successfully', 'green');
    
    // Insert test data
    log('📝 Inserting test data...', 'blue');
    
    // Insert test students
    await connection.query(`
      INSERT IGNORE INTO \`students\` (\`id\`, \`prenom\`, \`nom\`, \`email\`, \`passwordHash\`, \`role\`, \`niveauActuel\`, \`totalPoints\`, \`serieJours\`, \`mascotteType\`) VALUES
      (1, 'Test', 'Student', 'test.student@staging.com', '$2b$10$test.hash.for.staging.environment', 'student', 'CE2', 150, 5, 'dragon'),
      (2, 'Staging', 'User', 'staging.user@staging.com', '$2b$10$test.hash.for.staging.environment', 'student', 'CE1', 75, 3, 'unicorn'),
      (3, 'Admin', 'Staging', 'admin@staging.com', '$2b$10$test.hash.for.staging.environment', 'admin', 'CM1', 500, 10, 'phoenix')
    `);
    
    // Insert test competencies
    await connection.query(`
      INSERT IGNORE INTO \`competencies\` (\`id\`, \`code\`, \`nom\`, \`matiere\`, \`domaine\`, \`niveau\`, \`difficulte\`, \`description\`, \`xp_reward\`) VALUES
      (1, 'CE2.FR.L.FL.01', 'Lecture de mots simples', 'FR', 'Lecture', 'CE2', 'L', 'Lire des mots de 2 à 3 syllabes', 10),
      (2, 'CE2.MA.L.CA.01', 'Addition simple', 'MA', 'Calcul', 'CE2', 'L', 'Additionner des nombres à 2 chiffres', 10),
      (3, 'CE1.FR.M.FL.01', 'Compréhension de texte', 'FR', 'Lecture', 'CE1', 'M', 'Comprendre un texte court', 15)
    `);
    
    // Insert test exercises
    await connection.query(`
      INSERT IGNORE INTO \`exercises\` (\`id\`, \`titre\`, \`matiere\`, \`niveau\`, \`difficulte\`, \`competenceCode\`, \`questions\`, \`reponses\`, \`explications\`, \`xp_reward\`) VALUES
      (1, 'Lecture de mots - Test', 'FR', 'CE2', 'L', 'CE2.FR.L.FL.01', 
       '["Lisez le mot: CHAT", "Lisez le mot: MAISON"]', 
       '["chat", "maison"]', 
       '["Chat se lit C-H-A-T", "Maison se lit M-A-I-S-O-N"]', 
       5),
      (2, 'Addition simple - Test', 'MA', 'CE2', 'L', 'CE2.MA.L.CA.01', 
       '["Combien font 5 + 3 ?", "Combien font 12 + 8 ?"]', 
       '["8", "20"]', 
       '["5 + 3 = 8", "12 + 8 = 20"]', 
       5)
    `);
    
    log('✅ Test data inserted successfully', 'green');
    
    // Create staging dashboard view
    await connection.query(`
      CREATE OR REPLACE VIEW \`staging_dashboard\` AS
      SELECT 
          s.id,
          s.prenom,
          s.nom,
          s.email,
          s.niveauActuel,
          s.totalPoints,
          s.serieJours,
          COUNT(sp.id) as totalExercises,
          COUNT(CASE WHEN sp.completed = true THEN 1 END) as completedExercises,
          AVG(sp.score) as averageScore
      FROM students s
      LEFT JOIN studentProgress sp ON s.id = sp.studentId
      GROUP BY s.id, s.prenom, s.nom, s.email, s.niveauActuel, s.totalPoints, s.serieJours
    `);
    
    log('✅ Staging dashboard view created', 'green');
    
    // Verify setup
    log('🔍 Verifying setup...', 'blue');
    
    const [students] = await connection.query('SELECT COUNT(*) as count FROM students');
    const [competencies] = await connection.query('SELECT COUNT(*) as count FROM competencies');
    const [exercises] = await connection.query('SELECT COUNT(*) as count FROM exercises');
    
    log('📊 Database Summary:', 'blue');
    log(`   Students: ${students[0].count}`, 'yellow');
    log(`   Competencies: ${competencies[0].count}`, 'yellow');
    log(`   Exercises: ${exercises[0].count}`, 'yellow');
    
    log('\n🎉 Staging database setup completed successfully!', 'green');
    log('\n📋 Next Steps:', 'blue');
    log('1. Start staging server: npm run start:staging', 'yellow');
    log('2. Access staging at: http://localhost:3004', 'yellow');
    log('3. Test with staging users:', 'yellow');
    log('   - test.student@staging.com', 'yellow');
    log('   - staging.user@staging.com', 'yellow');
    log('   - admin@staging.com', 'yellow');
    
  } catch (error) {
    log(`❌ Error setting up staging database: ${error.message}`, 'red');
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
if (require.main === module) {
  createStagingDatabase().catch(error => {
    log(`❌ Setup failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { createStagingDatabase };
