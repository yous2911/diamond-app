const mysql = require('mysql2/promise');
const fs = require('fs');

async function applyIndexes() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'thisisREALLYIT29!',
      database: 'reved_kids'
    });

    console.log('Connected to database');

    const indexSQL = fs.readFileSync('./scripts/performance/production-indexes.sql', 'utf8');
    const statements = indexSQL.split(';').filter(stmt => stmt.trim() && !stmt.trim().startsWith('/*'));

    let applied = 0;
    let skipped = 0;

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          await connection.execute(statement);
          if (statement.includes('CREATE INDEX')) {
            applied++;
            const indexName = statement.match(/idx_[a-zA-Z0-9_]+/);
            console.log('Applied index:', indexName ? indexName[0] : 'unnamed');
          }
        }
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          skipped++;
        } else {
          console.warn('Warning:', error.message.substring(0, 100));
        }
      }
    }

    console.log('Index Application Summary:');
    console.log('Applied:', applied, 'indexes');
    console.log('Skipped:', skipped, '(already exist)');

    await connection.end();
    console.log('Database indexes optimization complete');

  } catch (error) {
    console.error('Database index application failed:', error.message);
  }
}

applyIndexes();