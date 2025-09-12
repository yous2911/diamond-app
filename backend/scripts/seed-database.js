const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
    let connection;
    
    try {
        console.log('🚀 Starting database seeding...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'thisisREALLYIT29!',
            database: 'reved_kids',
            multipleStatements: true
        });
        
        console.log('✅ Connected to database');
        
        // Read the seeding SQL file
        const sqlFile = path.join(__dirname, 'seed_all_competencies_with_exercises.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        console.log('📖 Reading SQL file...');
        
        // Split the SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SOURCE'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        // Execute each statement
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            try {
                if (statement.trim()) {
                    await connection.execute(statement);
                    successCount++;
                    
                    if (i % 50 === 0) {
                        console.log(`⏳ Progress: ${i + 1}/${statements.length} statements executed`);
                    }
                }
            } catch (error) {
                errorCount++;
                console.error(`❌ Error in statement ${i + 1}:`, error.message);
                // Continue with other statements
            }
        }
        
        console.log(`\n📊 Seeding Results:`);
        console.log(`✅ Successful statements: ${successCount}`);
        console.log(`❌ Failed statements: ${errorCount}`);
        
        // Verify the results
        console.log('\n🔍 Verifying results...');
        
        // Count total exercises
        const [exerciseCount] = await connection.execute('SELECT COUNT(*) as count FROM exercises');
        console.log(`📚 Total exercises created: ${exerciseCount[0].count}`);
        
        // Count by exercise type
        const [typeCount] = await connection.execute(`
            SELECT exercise_type, COUNT(*) as count 
            FROM exercises 
            GROUP BY exercise_type
        `);
        console.log('\n📊 Exercises by type:');
        typeCount.forEach(row => {
            console.log(`   ${row.exercise_type}: ${row.count}`);
        });
        
        // Count by grade level
        const [gradeCount] = await connection.execute(`
            SELECT 
                SUBSTRING(competence_code, 1, 2) as grade_level,
                COUNT(*) as count
            FROM exercises 
            GROUP BY SUBSTRING(competence_code, 1, 2)
            ORDER BY grade_level
        `);
        console.log('\n🎓 Exercises by grade level:');
        gradeCount.forEach(row => {
            console.log(`   ${row.grade_level}: ${row.count}`);
        });
        
        // Count by subject
        const [subjectCount] = await connection.execute(`
            SELECT 
                CASE 
                    WHEN competence_code LIKE '%.FR.%' THEN 'FRANCAIS'
                    WHEN competence_code LIKE '%.MA.%' THEN 'MATHEMATIQUES'
                    ELSE 'OTHER'
                END as subject,
                COUNT(*) as count
            FROM exercises 
            GROUP BY 
                CASE 
                    WHEN competence_code LIKE '%.FR.%' THEN 'FRANCAIS'
                    WHEN competence_code LIKE '%.MA.%' THEN 'MATHEMATIQUES'
                    ELSE 'OTHER'
                END
        `);
        console.log('\n📖 Exercises by subject:');
        subjectCount.forEach(row => {
            console.log(`   ${row.subject}: ${row.count}`);
        });
        
        // Sample exercises
        const [samples] = await connection.execute(`
            SELECT competence_code, exercise_type, title, difficulty_level, xp_reward
            FROM exercises 
            ORDER BY competence_code, exercise_type
            LIMIT 10
        `);
        console.log('\n📝 Sample exercises:');
        samples.forEach(row => {
            console.log(`   ${row.competence_code} - ${row.exercise_type}: ${row.title} (Level ${row.difficulty_level}, ${row.xp_reward} XP)`);
        });
        
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('🚀 Your app is now ready for beta testing with real exercise data!');
        
    } catch (error) {
        console.error('❌ Database seeding failed:', error.message);
        console.error('Full error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the seeding
seedDatabase().catch(console.error);
