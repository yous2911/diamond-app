const mysql = require('mysql2/promise');

async function checkDatabaseSchema() {
    let connection;
    
    try {
        console.log('🔍 Checking database schema...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'thisisREALLYIT29!',
            database: 'reved_kids',
            multipleStatements: true
        });
        
        console.log('✅ Connected to database');
        
        // Check what tables exist
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\n📋 Available tables:');
        tables.forEach(table => {
            console.log(`   ${Object.values(table)[0]}`);
        });
        
        // Check if exercises table exists and its structure
        const [exerciseTableExists] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'reved_kids' 
            AND table_name = 'exercises'
        `);
        
        if (exerciseTableExists[0].count > 0) {
            console.log('\n📚 Exercises table structure:');
            const [columns] = await connection.execute('DESCRIBE exercises');
            columns.forEach(col => {
                console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
            });
        } else {
            console.log('\n❌ Exercises table does not exist');
        }
        
        // Check if cp2025_competence_codes table exists
        const [competenceTableExists] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'reved_kids' 
            AND table_name = 'cp2025_competence_codes'
        `);
        
        if (competenceTableExists[0].count > 0) {
            console.log('\n🎯 Competence codes table structure:');
            const [columns] = await connection.execute('DESCRIBE cp2025_competence_codes');
            columns.forEach(col => {
                console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
            });
            
            // Count competencies
            const [competenceCount] = await connection.execute('SELECT COUNT(*) as count FROM cp2025_competence_codes');
            console.log(`\n📊 Total competencies: ${competenceCount[0].count}`);
            
            // Show sample competencies
            const [samples] = await connection.execute('SELECT * FROM cp2025_competence_codes LIMIT 5');
            console.log('\n📝 Sample competencies:');
            samples.forEach(comp => {
                console.log(`   ${comp.code}: ${comp.description || comp.competence || 'No description'}`);
            });
        } else {
            console.log('\n❌ cp2025_competence_codes table does not exist');
        }
        
        // Check for any existing exercises
        if (exerciseTableExists[0].count > 0) {
            const [exerciseCount] = await connection.execute('SELECT COUNT(*) as count FROM exercises');
            console.log(`\n📚 Existing exercises: ${exerciseCount[0].count}`);
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
checkDatabaseSchema().catch(console.error);


