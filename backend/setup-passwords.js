const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function setupPasswords() {
  // Create database connection
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'fastrevkids'
  });

  try {
    console.log('🔐 Setting up passwords for students...');
    
    // Hash the password
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Update all students with the hashed password
    const [result] = await connection.execute(
      'UPDATE students SET passwordHash = ?, email = CONCAT(LOWER(prenom), ".", LOWER(nom), "@test.com") WHERE passwordHash IS NULL',
      [hashedPassword]
    );
    
    console.log(`✅ Updated ${result.affectedRows} students with password and email`);
    console.log(`🔑 Password for all students: ${password}`);
    
    // Show updated students
    const [students] = await connection.execute(
      'SELECT id, prenom, nom, email FROM students LIMIT 5'
    );
    
    console.log('\n👥 Students with credentials:');
    students.forEach(student => {
      console.log(`- ${student.prenom} ${student.nom} (${student.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

setupPasswords();