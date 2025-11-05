const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function updatePasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'admin',
    database: 'reved_kids'
  });

  try {
    console.log('🔐 Updating passwords for test students...');
    
    // Hash the new password
    const newPassword = 'password123456';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    console.log(`🔑 New password: ${newPassword}`);
    console.log(`🔐 New hash: ${hashedPassword}`);
    
    // Update all test students with the new password hash
    const [result] = await connection.execute(
      'UPDATE students SET password_hash = ? WHERE email LIKE "%@test.com"',
      [hashedPassword]
    );
    
    console.log(`✅ Updated ${result.affectedRows} students with new password`);
    
    // Show updated students
    const [students] = await connection.execute(
      'SELECT id, prenom, nom, email FROM students WHERE email LIKE "%@test.com"'
    );
    
    console.log('\n👥 Updated students:');
    students.forEach(student => {
      console.log(`- ${student.prenom} ${student.nom} (${student.email})`);
    });
    
    console.log('\n🎉 Password update completed!');
    console.log('🔑 New password for all test accounts: password123456');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

updatePasswords();
