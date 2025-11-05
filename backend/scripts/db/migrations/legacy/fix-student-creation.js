const mysql = require('mysql2/promise');

async function fixStudentCreation() {
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  };
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('🔧 Fixing student creation issues...');
    
    // Check students table structure
    console.log('📋 Checking students table structure...');
    const [columns] = await connection.execute('DESCRIBE students');
    console.log('✅ Students table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if required columns exist
    const requiredColumns = ['nom', 'prenom', 'age', 'niveau', 'estConnecte', 'createdAt'];
    const existingColumns = columns.map(col => col.Field);
    
    console.log('\n🔍 Checking required columns...');
    for (const col of requiredColumns) {
      if (existingColumns.includes(col)) {
        console.log(`✅ ${col} exists`);
      } else {
        console.log(`❌ ${col} missing`);
      }
    }
    
    // Add missing columns if needed
    if (!existingColumns.includes('estConnecte')) {
      console.log('➕ Adding estConnecte column...');
      await connection.execute('ALTER TABLE students ADD COLUMN estConnecte BOOLEAN DEFAULT FALSE');
    }
    
    if (!existingColumns.includes('createdAt')) {
      console.log('➕ Adding createdAt column...');
      await connection.execute('ALTER TABLE students ADD COLUMN createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    }
    
    if (!existingColumns.includes('updatedAt')) {
      console.log('➕ Adding updatedAt column...');
      await connection.execute('ALTER TABLE students ADD COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    }
    
    await connection.end();
    console.log('✅ Student table structure fixed');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixStudentCreation();

