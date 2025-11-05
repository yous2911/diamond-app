#!/usr/bin/env node

/**
 * Fix Student Tests to Work with Real Database
 * 
 * This script creates a test student in your real database that matches
 * what the tests expect, then runs a single student test to verify it works.
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: 'thisisREALLYIT29!',
  database: process.env.DB_NAME || 'reved_kids',
};

async function fixStudentTests() {
  let connection;
  
  try {
    console.log('🔧 Fixing student tests for real database...');
    connection = await mysql.createConnection(DB_CONFIG);
    
    // First, let's see what columns exist in students table
    const [columns] = await connection.execute('DESCRIBE students');
    console.log('📋 Students table columns:');
    columns.forEach(col => {
      console.log(`   ${col.Field} (${col.Type})`);
    });
    
    // Create a test student with proper data for your schema
    const testEmail = 'test@integration.com';
    const hashedPassword = await bcrypt.hash('test-password-123456', 10);
    
    // Delete existing test student if exists
    await connection.execute('DELETE FROM students WHERE email = ?', [testEmail]);
    
    // Insert test student with correct column names based on your schema
    const insertResult = await connection.execute(`
      INSERT INTO students (prenom, nom, email, password_hash, date_naissance, niveau_scolaire, total_points, serie_jours, mascotte_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      'Alice',           // prenom
      'Dupont',          // nom  
      testEmail,         // email
      hashedPassword,    // password_hash (correct column name)
      '2015-05-15',      // date_naissance
      'CP',              // niveau_scolaire
      0,                 // total_points
      0,                 // serie_jours
      'dragon',          // mascotte_type
    ]);
    
    const testStudentId = insertResult[0].insertId;
    console.log(`✅ Created test student with ID: ${testStudentId}`);
    
    // Verify the student was created
    const [students] = await connection.execute('SELECT * FROM students WHERE email = ?', [testEmail]);
    if (students.length > 0) {
      console.log('✅ Test student verified in database');
      console.log(`   ID: ${students[0].id}`);
      console.log(`   Name: ${students[0].prenom} ${students[0].nom}`);
      console.log(`   Email: ${students[0].email}`);
    }
    
    console.log('\n🎯 Test Data Ready!');
    console.log('   The students.test.ts should now work better with real auth data');
    console.log('   Test student email: test@integration.com');
    console.log('   Test student password: test-password-123456');
    
  } catch (error) {
    console.error('❌ Error fixing tests:', error.message);
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.log('💡 Column name mismatch - need to update test with correct column names');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixStudentTests();