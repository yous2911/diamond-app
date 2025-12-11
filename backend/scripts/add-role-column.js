const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', 'env.backend');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'reved_kids',
};

(async () => {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database');
    
    // Check if role column exists
    const [columns] = await connection.execute('DESCRIBE students');
    const hasRole = columns.some(c => c.Field === 'role');
    
    if (hasRole) {
      console.log('✅ Role column already exists');
    } else {
      console.log('➕ Adding role column...');
      await connection.execute(
        "ALTER TABLE students ADD COLUMN role ENUM('student', 'admin') NOT NULL DEFAULT 'student'"
      );
      console.log('✅ Role column added successfully');
    }
    
    // Update existing students to have 'student' role
    await connection.execute("UPDATE students SET role = 'student' WHERE role IS NULL");
    console.log('✅ All students have role assigned');
    
    await connection.end();
    console.log('\n🎉 Database ready!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Role column already exists');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
    if (connection) await connection.end();
  }
})();








