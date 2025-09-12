const mysql = require('mysql2/promise');

async function checkCompetencesTable() {
    let connection;
    
    try {
        console.log('🔍 Checking competences_cp table structure...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'thisisREALLYIT29!',
            database: 'reved_kids',
            multipleStatements: true
        });
        
        console.log('✅ Connected to database');
        
        // Check competences_cp table structure
        console.log('\n📚 competences_cp table structure:');
        const [columns] = await connection.execute('DESCRIBE competences_cp');
        columns.forEach(col => {
            console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
        });
        
        // Count competencies
        const [competenceCount] = await connection.execute('SELECT COUNT(*) as count FROM competences_cp');
        console.log(`\n📊 Total competencies: ${competenceCount[0].count}`);
        
        // Show sample competencies
        const [samples] = await connection.execute('SELECT * FROM competences_cp LIMIT 5');
        console.log('\n📝 Sample competencies:');
        samples.forEach(comp => {
            console.log(`   ${JSON.stringify(comp, null, 2)}`);
        });
        
    } catch (error) {
        console.error('❌ Schema check failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the schema check
checkCompetencesTable().catch(console.error);


