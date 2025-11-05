/**
 * Quick Database Connection Test
 * Run this to verify your database is working
 */

const mysql = require('mysql2/promise');

async function testConnection() {
  let connection;
  
  try {
    console.log('🔍 Testing database connection...');
    
    // Connect to database
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'thisisREALLYIT29!',
      database: 'reved_kids'
    });
    
    console.log('✅ Connected to database successfully!');
    
    // Test 1: Check if exercises table exists and has data
    console.log('\n📊 Checking exercises...');
    const [exercises] = await connection.execute('SELECT COUNT(*) as count FROM exercises');
    console.log(`   Found ${exercises[0].count} exercises in database`);
    
    // Test 2: Check exercises by level
    const [cpExercises] = await connection.execute('SELECT COUNT(*) as count FROM exercises WHERE niveau = "CP"');
    const [ce1Exercises] = await connection.execute('SELECT COUNT(*) as count FROM exercises WHERE niveau = "CE1"');
    const [ce2Exercises] = await connection.execute('SELECT COUNT(*) as count FROM exercises WHERE niveau = "CE2"');
    
    console.log(`   CP exercises: ${cpExercises[0].count}`);
    console.log(`   CE1 exercises: ${ce1Exercises[0].count}`);
    console.log(`   CE2 exercises: ${ce2Exercises[0].count}`);
    
    // Test 3: Check students table
    console.log('\n👥 Checking students...');
    const [students] = await connection.execute('SELECT COUNT(*) as count FROM students');
    console.log(`   Found ${students[0].count} students in database`);
    
    // Test 4: Show sample exercises
    console.log('\n📝 Sample exercises:');
    const [sampleExercises] = await connection.execute('SELECT titre, niveau, matiere FROM exercises LIMIT 5');
    sampleExercises.forEach(ex => {
      console.log(`   - ${ex.titre} (${ex.niveau}, ${ex.matiere})`);
    });
    
    console.log('\n🎉 Database is working perfectly!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Make sure MySQL is running and the database exists');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();






