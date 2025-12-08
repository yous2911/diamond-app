/**
 * Fix Exercises Table Schema
 * Adds missing columns to match schema.ts
 */

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

async function fixSchema() {
  let connection;
  
  try {
    console.log('🔧 Fixing Exercises Table Schema...\n');
    
    connection = await mysql.createConnection({
      ...DB_CONFIG,
      multipleStatements: true
    });
    console.log('✅ Connected to database\n');
    
    // Check current structure
    const [columns] = await connection.execute('DESCRIBE exercises');
    const columnNames = columns.map(c => c.Field);
    
    console.log('📊 Current columns:', columnNames.join(', '));
    console.log('');
    
    // Add missing columns
    const columnsToAdd = [
      { name: 'description', sql: 'ADD COLUMN description TEXT' },
      { name: 'difficulte', sql: "ADD COLUMN difficulte VARCHAR(30) NOT NULL DEFAULT 'decouverte'" },
      { name: 'competence_code', sql: 'ADD COLUMN competence_code VARCHAR(20)' },
      { name: 'prerequis', sql: 'ADD COLUMN prerequis JSON' },
      { name: 'solution', sql: 'ADD COLUMN solution JSON' },
      { name: 'points_recompense', sql: 'ADD COLUMN points_recompense INT DEFAULT 10' },
      { name: 'temps_estime', sql: 'ADD COLUMN temps_estime INT DEFAULT 300' },
      { name: 'type_exercice', sql: "ADD COLUMN type_exercice VARCHAR(30) NOT NULL DEFAULT 'multiple-choice'" },
      { name: 'xp', sql: 'ADD COLUMN xp INT DEFAULT 10' },
      { name: 'configuration', sql: 'ADD COLUMN configuration JSON' },
      { name: 'ordre', sql: 'ADD COLUMN ordre INT DEFAULT 0' },
      { name: 'est_actif', sql: 'ADD COLUMN est_actif BOOLEAN DEFAULT TRUE' },
      { name: 'metadonnees', sql: 'ADD COLUMN metadonnees JSON' }
    ];
    
    console.log('➕ Adding missing columns...\n');
    let added = 0;
    let skipped = 0;
    
    for (const col of columnsToAdd) {
      if (columnNames.includes(col.name)) {
        console.log(`   ⏭️  Skipped: ${col.name} (already exists)`);
        skipped++;
      } else {
        try {
          await connection.execute(`ALTER TABLE exercises ${col.sql}`);
          console.log(`   ✅ Added: ${col.name}`);
          added++;
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`   ⏭️  Skipped: ${col.name} (already exists)`);
            skipped++;
          } else {
            console.log(`   ❌ Error adding ${col.name}: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`\n✅ Added ${added} columns, skipped ${skipped}\n`);
    
    // Migrate data from old columns to new columns
    console.log('🔄 Migrating data...\n');
    
    // Copy competence_id to competence_code if competence_code is empty
    try {
      await connection.execute(`
        UPDATE exercises 
        SET competence_code = competence_id 
        WHERE (competence_code IS NULL OR competence_code = '') 
        AND competence_id IS NOT NULL
      `);
      console.log('   ✅ Migrated competence_id → competence_code');
    } catch (error) {
      console.log(`   ⚠️  Could not migrate competence_id: ${error.message}`);
    }
    
    // Copy difficulty_level to difficulte
    try {
      await connection.execute(`
        UPDATE exercises 
        SET difficulte = CASE 
          WHEN difficulty_level <= 1 THEN 'decouverte'
          WHEN difficulty_level = 2 THEN 'application'
          WHEN difficulty_level = 3 THEN 'renforcement'
          WHEN difficulty_level >= 4 THEN 'maitrise'
          ELSE 'decouverte'
        END
        WHERE difficulte = 'decouverte' OR difficulte IS NULL
      `);
      console.log('   ✅ Migrated difficulty_level → difficulte');
    } catch (error) {
      console.log(`   ⚠️  Could not migrate difficulty_level: ${error.message}`);
    }
    
    // Set default values for required fields
    try {
      await connection.execute(`
        UPDATE exercises 
        SET solution = JSON_OBJECT('correctAnswer', 'N/A', 'explanation', 'To be completed')
        WHERE solution IS NULL
      `);
      console.log('   ✅ Set default solutions');
    } catch (error) {
      console.log(`   ⚠️  Could not set default solutions: ${error.message}`);
    }
    
    try {
      await connection.execute(`
        UPDATE exercises 
        SET type_exercice = 'multiple-choice'
        WHERE type_exercice IS NULL OR type_exercice = ''
      `);
      console.log('   ✅ Set default type_exercice');
    } catch (error) {
      console.log(`   ⚠️  Could not set default type_exercice: ${error.message}`);
    }
    
    // Verify final structure
    console.log('\n📊 Final structure:');
    const [finalColumns] = await connection.execute('DESCRIBE exercises');
    console.log(`   Total columns: ${finalColumns.length}`);
    finalColumns.forEach(col => {
      console.log(`     ${col.Field.padEnd(25)} ${col.Type}`);
    });
    
    console.log('\n🎉 Schema fix complete!');
    console.log('\n✅ Exercise files should now work with the database.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  fixSchema();
}

module.exports = { fixSchema };





