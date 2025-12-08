/**
 * Check Exercise Schema Compatibility
 * Compares exercise files with database schema
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

async function checkSchema() {
  let connection;
  
  try {
    console.log('🔍 Checking Exercise Schema Compatibility...\n');
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');
    
    // Get actual database structure
    const [dbColumns] = await connection.execute('DESCRIBE exercises');
    console.log('📊 ACTUAL DATABASE STRUCTURE (exercises table):');
    console.log('─'.repeat(80));
    dbColumns.forEach(col => {
      console.log(`  ${col.Field.padEnd(25)} ${col.Type.padEnd(30)} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });
    console.log('');
    
    // Expected schema from schema.ts
    const expectedColumns = {
      'id': 'int PRIMARY KEY AUTO_INCREMENT',
      'titre': 'varchar(200) NOT NULL',
      'description': 'text',
      'matiere': 'varchar(50) NOT NULL',
      'niveau': 'varchar(20) NOT NULL',
      'difficulte': 'varchar(30) NOT NULL',
      'competence_code': 'varchar(20) NOT NULL',
      'prerequis': 'json',
      'contenu': 'json NOT NULL',
      'solution': 'json NOT NULL',
      'points_recompense': 'int DEFAULT 10',
      'temps_estime': 'int DEFAULT 300',
      'type_exercice': 'varchar(30) NOT NULL',
      'xp': 'int DEFAULT 10',
      'configuration': 'json',
      'ordre': 'int DEFAULT 0',
      'est_actif': 'boolean DEFAULT true',
      'metadonnees': 'json',
      'created_at': 'timestamp NOT NULL',
      'updated_at': 'timestamp NOT NULL'
    };
    
    console.log('📋 EXPECTED SCHEMA (from schema.ts):');
    console.log('─'.repeat(80));
    Object.entries(expectedColumns).forEach(([name, type]) => {
      console.log(`  ${name.padEnd(25)} ${type}`);
    });
    console.log('');
    
    // Compare
    const dbColumnNames = dbColumns.map(c => c.Field);
    const expectedNames = Object.keys(expectedColumns);
    
    const missingInDb = expectedNames.filter(name => !dbColumnNames.includes(name));
    const extraInDb = dbColumnNames.filter(name => !expectedNames.includes(name));
    
    console.log('🔍 COMPARISON RESULTS:');
    console.log('─'.repeat(80));
    
    if (missingInDb.length > 0) {
      console.log('❌ MISSING COLUMNS IN DATABASE:');
      missingInDb.forEach(col => {
        console.log(`   - ${col} (expected: ${expectedColumns[col]})`);
      });
      console.log('');
    }
    
    if (extraInDb.length > 0) {
      console.log('⚠️  EXTRA COLUMNS IN DATABASE (not in schema.ts):');
      extraInDb.forEach(col => {
        const dbCol = dbColumns.find(c => c.Field === col);
        console.log(`   - ${col} (${dbCol.Type})`);
      });
      console.log('');
    }
    
    if (missingInDb.length === 0 && extraInDb.length === 0) {
      console.log('✅ PERFECT MATCH! All columns match.\n');
    } else {
      console.log('⚠️  SCHEMA MISMATCH DETECTED!\n');
    }
    
    // Check exercise seed files
    console.log('📁 CHECKING EXERCISE SEED FILES:');
    console.log('─'.repeat(80));
    
    const seedFiles = [
      'src/db/seeds/cp2025-exercises.ts',
      'src/db/seed.ts'
    ];
    
    for (const file of seedFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasXp = content.includes('xp:');
        const hasTitre = content.includes('titre:');
        const hasContenu = content.includes('contenu:');
        const hasSolution = content.includes('solution:');
        const hasTypeExercice = content.includes('typeExercice:');
        
        console.log(`\n📄 ${file}:`);
        console.log(`   ${hasTitre ? '✅' : '❌'} titre`);
        console.log(`   ${hasContenu ? '✅' : '❌'} contenu`);
        console.log(`   ${hasSolution ? '✅' : '❌'} solution`);
        console.log(`   ${hasTypeExercice ? '✅' : '❌'} typeExercice`);
        console.log(`   ${hasXp ? '✅' : '❌'} xp`);
      }
    }
    
    // Check actual exercises in database
    console.log('\n📊 EXERCISES IN DATABASE:');
    console.log('─'.repeat(80));
    const [exercises] = await connection.execute('SELECT COUNT(*) as count FROM exercises');
    console.log(`   Total exercises: ${exercises[0].count}`);
    
    if (exercises[0].count > 0) {
      const [sample] = await connection.execute('SELECT * FROM exercises LIMIT 1');
      if (sample.length > 0) {
        console.log('\n   Sample exercise structure:');
        Object.keys(sample[0]).forEach(key => {
          const value = sample[0][key];
          const type = typeof value;
          console.log(`     ${key.padEnd(25)} ${type} ${value !== null ? `(${String(value).substring(0, 30)}...)` : '(NULL)'}`);
        });
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('─'.repeat(80));
    if (missingInDb.length === 0 && extraInDb.length === 0) {
      console.log('✅ Schema matches perfectly! Exercise files should work.');
    } else {
      console.log('⚠️  Schema mismatch found. Exercise files may need updates.');
      if (missingInDb.length > 0) {
        console.log(`   Missing ${missingInDb.length} column(s) - may cause insert errors`);
      }
      if (extraInDb.length > 0) {
        console.log(`   Extra ${extraInDb.length} column(s) - should be fine, but may cause confusion`);
      }
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 Fix: Run migrations first: npm run migrate');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  checkSchema();
}

module.exports = { checkSchema };





