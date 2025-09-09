import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkCompetences() {
  let connection;
  try {
    console.log('🔍 Checking existing competences...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'reved_kids'
    });
    
    // Check what competences exist
    const [rows] = await connection.execute('SELECT * FROM competences LIMIT 10');
    console.log('📚 Existing competences:');
    console.log(rows);
    
    // Check exercises table structure
    const [exerciseRows] = await connection.execute('SELECT * FROM exercises LIMIT 5');
    console.log('🎯 Existing exercises:');
    console.log(exerciseRows);
    
  } catch (error) {
    console.error('❌ Error checking competences:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
if (require.main === module) {
  checkCompetences()
    .then(() => {
      console.log('✅ Check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to check competences:', error);
      process.exit(1);
    });
}

export { checkCompetences };
