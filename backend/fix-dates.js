const mysql = require('mysql2/promise');

async function fixDates() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  });

  try {
    console.log('🔧 Fixing null date_naissance fields...');
    
    // Update null date_naissance fields
    const [result] = await connection.execute(
      'UPDATE students SET date_naissance = ? WHERE date_naissance IS NULL',
      ['2017-01-01']
    );
    
    console.log(`✅ Updated ${result.affectedRows} students with default birth date`);
    
    // Verify the fix
    const [students] = await connection.execute(
      'SELECT id, prenom, nom, date_naissance FROM students WHERE email LIKE "%@test.com"'
    );
    
    console.log('\n📋 Updated students:');
    students.forEach(student => {
      console.log(`- ${student.prenom} ${student.nom}: ${student.date_naissance}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

fixDates();
