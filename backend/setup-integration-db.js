#!/usr/bin/env node

/**
 * Integration Database Setup Script
 * 
 * Creates and configures a separate database for integration testing
 * with real MySQL instead of mocks.
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'thisisREALLYIT29!',
};

const INTEGRATION_DB_NAME = 'reved_kids_integration';

async function setupIntegrationDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL server...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('🗄️  Creating integration test database...');
    await connection.execute(`DROP DATABASE IF EXISTS \`${INTEGRATION_DB_NAME}\``);
    await connection.execute(`CREATE DATABASE \`${INTEGRATION_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log('✅ Integration database created successfully!');
    
    // Switch to the new database
    await connection.execute(`USE \`${INTEGRATION_DB_NAME}\``);
    
    console.log('📋 Setting up database schema...');
    
    // Check if schema files exist
    const schemaDir = path.join(__dirname, 'src', 'db');
    const migrationFiles = [
      path.join(schemaDir, 'schema-mysql.sql'),
      path.join(schemaDir, 'initial-setup.sql'),
      path.join(schemaDir, 'migrations')
    ];
    
    // Try to find and run schema/migration files
    for (const file of migrationFiles) {
      if (fs.existsSync(file)) {
        if (fs.statSync(file).isDirectory()) {
          // Handle migrations directory
          const migrationFiles = fs.readdirSync(file)
            .filter(f => f.endsWith('.sql'))
            .sort();
          
          for (const migFile of migrationFiles) {
            const migPath = path.join(file, migFile);
            console.log(`   Running migration: ${migFile}`);
            const sql = fs.readFileSync(migPath, 'utf8');
            await connection.execute(sql);
          }
        } else if (file.endsWith('.sql')) {
          console.log(`   Running schema: ${path.basename(file)}`);
          const sql = fs.readFileSync(file, 'utf8');
          await connection.execute(sql);
        }
      }
    }
    
    console.log('🌱 Adding test data...');
    
    // Add minimal test data for integration tests
    const testDataSQL = `
      -- Test student for integration tests
      INSERT IGNORE INTO students (
        id, prenom, nom, email, password, dateNaissance, niveauActuel, 
        role, totalPoints, serieJours, mascotteType, dateCreation
      ) VALUES (
        999, 'Test', 'Student', 'test@integration.com', 
        '$2b$10$test.hash.for.integration.testing.only', 
        '2010-01-01', 'CP', 'student', 0, 0, 'dragon', NOW()
      );
      
      -- Test admin for integration tests  
      INSERT IGNORE INTO students (
        id, prenom, nom, email, password, dateNaissance, niveauActuel,
        role, totalPoints, serieJours, mascotteType, dateCreation
      ) VALUES (
        998, 'Test', 'Admin', 'admin@integration.com',
        '$2b$10$test.hash.for.integration.testing.only',
        '1990-01-01', 'CE2', 'admin', 1000, 10, 'fairy', NOW()
      );
      
      -- Test competence
      INSERT IGNORE INTO competences (code, nom, description, niveau, matiere) 
      VALUES ('TEST-001', 'Test Competence', 'Integration test competence', 'CP', 'mathematiques');
      
      -- Test exercise
      INSERT IGNORE INTO exercises (
        id, title, question, type, difficulte, niveauScolaire, matiere, 
        competenceCode, points, tempsEstime, dateCreation
      ) VALUES (
        999, 'Test Exercise', 'What is 2+2?', 'qcm', 'facile', 'CP', 
        'mathematiques', 'TEST-001', 10, 60, NOW()
      );
    `;
    
    // Split and execute each statement
    const statements = testDataSQL.split(';').filter(stmt => stmt.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        try {
          await connection.execute(stmt);
        } catch (err) {
          // Ignore duplicate key errors for test data
          if (!err.message.includes('Duplicate entry')) {
            console.warn(`   Warning: ${err.message}`);
          }
        }
      }
    }
    
    console.log('✅ Integration database setup complete!');
    console.log('');
    console.log('📊 Database Info:');
    console.log(`   Host: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    console.log(`   Database: ${INTEGRATION_DB_NAME}`);
    console.log(`   User: ${DB_CONFIG.user}`);
    console.log('');
    console.log('🚀 Ready to run integration tests!');
    console.log('   Run: node test-integration.js');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('');
    console.log('💡 Common solutions:');
    console.log('   1. Check MySQL server is running');
    console.log('   2. Verify credentials in .env file');
    console.log('   3. Ensure user has CREATE DATABASE privileges');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupIntegrationDatabase();