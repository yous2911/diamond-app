// Quick test to check how Drizzle works with raw SQL
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

async function testDrizzleRaw() {
  try {
    const connection = mysql.createPool({
      host: 'localhost',
      user: 'root', 
      password: 'thisisREALLYIT29!',
      database: 'reved_kids'
    });

    const db = drizzle(connection);
    console.log('🔗 Drizzle connected');

    // Test raw SQL query
    const rows = await db.execute(sql`
      SELECT code, titre as nom, matiere, domaine, description
      FROM competences
      WHERE est_actif = 1
      ORDER BY code
      LIMIT 5 OFFSET 0
    `);

    console.log(`✅ Found ${rows.length} competencies with Drizzle:`, rows);
    await connection.end();
  } catch (error) {
    console.error('❌ Drizzle Error:', error.message);
  }
}

testDrizzleRaw();