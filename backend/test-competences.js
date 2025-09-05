// Quick test to check competences database access
const mysql = require('mysql2/promise');

async function testCompetences() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: 'thisisREALLYIT29!',
      database: 'reved_kids'
    });

    console.log('🔗 Connected to database');

    // Test the query that the service uses
    const [rows] = await connection.execute(`
      SELECT code, titre as nom, matiere, domaine, description, 0 as xp_reward
      FROM competences
      WHERE est_actif = 1
      ORDER BY code
      LIMIT 10 OFFSET 0
    `);

    console.log(`✅ Found ${rows.length} competencies:`);
    rows.forEach(row => {
      console.log(`  - ${row.code}: ${row.nom} (${row.matiere})`);
    });

    // Check specifically for CE2 competencies
    const [ce2Rows] = await connection.execute(`
      SELECT code, titre as nom, matiere, domaine, description
      FROM competences
      WHERE est_actif = 1 AND code LIKE 'CE2.%'
      ORDER BY code
      LIMIT 5
    `);

    console.log(`\n🎯 Found ${ce2Rows.length} CE2 competencies:`);
    ce2Rows.forEach(row => {
      console.log(`  - ${row.code}: ${row.nom} (${row.matiere})`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
  }
}

testCompetences();