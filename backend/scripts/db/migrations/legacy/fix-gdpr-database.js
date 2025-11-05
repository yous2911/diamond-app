const mysql = require('mysql2/promise');

async function fixGdprDatabase() {
  const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'thisisREALLYIT29!',
    database: 'reved_kids'
  };
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('🔧 Fixing GDPR database issues...');
    
    // Check if parental_consent table exists and has correct structure
    console.log('📋 Checking parental_consent table...');
    try {
      const [rows] = await connection.execute('DESCRIBE parental_consent');
      console.log('✅ parental_consent table exists with columns:');
      rows.forEach(row => {
        console.log(`  - ${row.Field}: ${row.Type}`);
      });
    } catch (error) {
      console.log('❌ parental_consent table missing, creating it...');
      await connection.execute(`
        CREATE TABLE parental_consent (
          id VARCHAR(36) PRIMARY KEY,
          parent_email VARCHAR(255) NOT NULL,
          parent_name VARCHAR(255) NOT NULL,
          child_name VARCHAR(255) NOT NULL,
          child_age INT NOT NULL,
          consent_types JSON NOT NULL,
          first_consent_token VARCHAR(255) NOT NULL,
          second_consent_token VARCHAR(255),
          status ENUM('pending', 'first_verified', 'verified', 'expired', 'revoked') DEFAULT 'pending',
          expiry_date TIMESTAMP NOT NULL,
          verified_at TIMESTAMP NULL,
          revoked_at TIMESTAMP NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_parent_email (parent_email),
          INDEX idx_status (status),
          INDEX idx_first_token (first_consent_token),
          INDEX idx_second_token (second_consent_token),
          INDEX idx_expiry (expiry_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ parental_consent table created');
    }
    
    // Check if audit_logs table has the right structure
    console.log('📋 Checking audit_logs table...');
    try {
      const [rows] = await connection.execute('DESCRIBE audit_logs');
      console.log('✅ audit_logs table exists with columns:');
      rows.forEach(row => {
        console.log(`  - ${row.Field}: ${row.Type}`);
      });
    } catch (error) {
      console.log('❌ audit_logs table missing, creating it...');
      await connection.execute(`
        CREATE TABLE audit_logs (
          id VARCHAR(36) PRIMARY KEY,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(255) NOT NULL,
          action VARCHAR(50) NOT NULL,
          details JSON,
          ip_address VARCHAR(45),
          user_agent TEXT,
          severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
          category VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_entity (entity_type, entity_id),
          INDEX idx_action (action),
          INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ audit_logs table created');
    }
    
    // Add missing columns to parental_consent if needed
    console.log('📋 Adding missing columns to parental_consent...');
    const columnsToAdd = [
      { name: 'student_id', type: 'VARCHAR(255)', nullable: 'NULL' },
      { name: 'verification_method', type: 'VARCHAR(50)', nullable: 'NULL' },
      { name: 'metadata', type: 'JSON', nullable: 'NULL' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await connection.execute(`
          ALTER TABLE parental_consent 
          ADD COLUMN ${column.name} ${column.type} ${column.nullable}
        `);
        console.log(`✅ Added column ${column.name}`);
      } catch (error) {
        if (error.message.includes('Duplicate column name')) {
          console.log(`ℹ️ Column ${column.name} already exists`);
        } else {
          console.log(`⚠️ Could not add column ${column.name}:`, error.message);
        }
      }
    }
    
    // Insert test data for GDPR tests
    console.log('📋 Inserting test GDPR data...');
    try {
      await connection.execute(`
        INSERT INTO parental_consent (
          id, parent_email, parent_name, child_name, child_age, 
          consent_types, first_consent_token, status, expiry_date
        ) VALUES (
          'test-consent-123', 'test@example.com', 'Test Parent', 'Test Child', 8,
          '["data_processing"]', 'test-token-123', 'pending', 
          DATE_ADD(NOW(), INTERVAL 7 DAY)
        ) ON DUPLICATE KEY UPDATE updated_at = NOW()
      `);
      console.log('✅ Test consent data inserted');
    } catch (error) {
      console.log('⚠️ Could not insert test data:', error.message);
    }
    
    await connection.end();
    console.log('🎉 GDPR database fixes completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixGdprDatabase();

