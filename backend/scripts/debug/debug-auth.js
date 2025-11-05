const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function debugAuth() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  });

  try {
    console.log('🔍 Debugging authentication...');
    
    // Test 1: Check if we can find a student
    const [students] = await connection.execute(
      'SELECT id, prenom, nom, email, password_hash FROM students WHERE email LIKE "%@test.com" LIMIT 1'
    );
    
    if (students.length === 0) {
      console.log('❌ No test students found');
      return;
    }
    
    const student = students[0];
    console.log('✅ Found student:', student);
    
    // Test 2: Check password hash
    if (!student.password_hash) {
      console.log('❌ Student has no password hash');
      return;
    }
    
    console.log('✅ Student has password hash');
    
    // Test 3: Test password verification
    const password = 'password123456';
    const isValid = await bcrypt.compare(password, student.password_hash);
    console.log(`🔐 Password verification: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    
    // Test 4: Check all required fields
    const [fullStudent] = await connection.execute(
      'SELECT * FROM students WHERE id = ?',
      [student.id]
    );
    
    console.log('📋 Student fields:');
    Object.keys(fullStudent[0]).forEach(key => {
      console.log(`  ${key}: ${fullStudent[0][key]}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

debugAuth();