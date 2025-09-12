const mysql = require('mysql2/promise');

async function checkAllCompetencies() {
    let connection;
    
    try {
        console.log('🔍 Checking ALL competencies in database...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'thisisREALLYIT29!',
            database: 'reved_kids',
            multipleStatements: true
        });
        
        console.log('✅ Connected to database');
        
        // Check all tables that might contain competencies
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\n📋 All available tables:');
        tables.forEach(table => {
            console.log(`   ${Object.values(table)[0]}`);
        });
        
        // Check competences table (not competences_cp)
        const [competencesExists] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'reved_kids' 
            AND table_name = 'competences'
        `);
        
        if (competencesExists[0].count > 0) {
            console.log('\n📚 competences table structure:');
            const [columns] = await connection.execute('DESCRIBE competences');
            columns.forEach(col => {
                console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
            });
            
            // Count competencies
            const [competenceCount] = await connection.execute('SELECT COUNT(*) as count FROM competences');
            console.log(`\n📊 Total competencies in 'competences' table: ${competenceCount[0].count}`);
            
            // Show sample competencies
            const [samples] = await connection.execute('SELECT * FROM competences LIMIT 10');
            console.log('\n📝 Sample competencies:');
            samples.forEach(comp => {
                console.log(`   ${JSON.stringify(comp, null, 2)}`);
            });
            
            // Check for prerequisites
            const [prereqCount] = await connection.execute(`
                SELECT COUNT(*) as count 
                FROM competences 
                WHERE prerequis IS NOT NULL AND prerequis != ''
            `);
            console.log(`\n🔗 Competencies with prerequisites: ${prereqCount[0].count}`);
            
            // Show competencies by level
            const [levelCount] = await connection.execute(`
                SELECT niveau_scolaire, COUNT(*) as count
                FROM competences 
                GROUP BY niveau_scolaire
                ORDER BY niveau_scolaire
            `);
            console.log('\n🎓 Competencies by level:');
            levelCount.forEach(row => {
                console.log(`   ${row.niveau_scolaire}: ${row.count}`);
            });
            
            // Show competencies by subject
            const [subjectCount] = await connection.execute(`
                SELECT matiere, COUNT(*) as count
                FROM competences 
                GROUP BY matiere
                ORDER BY matiere
            `);
            console.log('\n📖 Competencies by subject:');
            subjectCount.forEach(row => {
                console.log(`   ${row.matiere}: ${row.count}`);
            });
        }
        
        // Also check competences_cp table
        const [competencesCpExists] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'reved_kids' 
            AND table_name = 'competences_cp'
        `);
        
        if (competencesCpExists[0].count > 0) {
            const [competenceCpCount] = await connection.execute('SELECT COUNT(*) as count FROM competences_cp');
            console.log(`\n📊 Total competencies in 'competences_cp' table: ${competenceCpCount[0].count}`);
        }
        
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
checkAllCompetencies().catch(console.error);


