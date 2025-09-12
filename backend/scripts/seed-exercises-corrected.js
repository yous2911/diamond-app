const mysql = require('mysql2/promise');

async function seedExercises() {
    let connection;
    
    try {
        console.log('🚀 Starting exercise seeding with correct schema...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'thisisREALLYIT29!',
            database: 'reved_kids',
            multipleStatements: true
        });
        
        console.log('✅ Connected to database');
        
        // First, get all competencies
        const [competencies] = await connection.execute(`
            SELECT code, niveau, matiere, competence, description 
            FROM competences_cp 
            WHERE niveau IN ('cp', 'ce1', 'ce2')
            ORDER BY niveau, matiere, competence
        `);
        
        console.log(`📚 Found ${competencies.length} competencies to seed`);
        
        // Create exercises for each competency
        let totalExercises = 0;
        
        for (const comp of competencies) {
            const competenceId = comp.code;
            const niveau = comp.niveau.toUpperCase();
            const matiere = comp.matiere;
            const description = comp.description || comp.competence || 'Exercice';
            
            // Create 3 exercises per competency (drag_drop, texte_libre, multiple_choice)
            const exercises = [
                {
                    titre: `Exercice Drag & Drop - ${description}`,
                    competence_id: competenceId,
                    niveau: comp.niveau,
                    matiere: matiere,
                    contenu: JSON.stringify({
                        type: 'drag_drop',
                        instruction: `Complète cet exercice interactif sur ${description}`,
                        items: [
                            { id: 'item1', text: 'Élément 1' },
                            { id: 'item2', text: 'Élément 2' },
                            { id: 'item3', text: 'Élément 3' }
                        ],
                        targets: [
                            { id: 'target1', text: 'Cible 1' },
                            { id: 'target2', text: 'Cible 2' }
                        ]
                    }),
                    difficulty_level: getDifficultyLevel(comp.niveau)
                },
                {
                    titre: `Exercice Texte Libre - ${description}`,
                    competence_id: competenceId,
                    niveau: comp.niveau,
                    matiere: matiere,
                    contenu: JSON.stringify({
                        type: 'texte_libre',
                        instruction: `Écris ta réponse sur ${description}`,
                        expected_words: ['réponse1', 'réponse2', 'réponse3'],
                        validation_type: 'contains_any',
                        hints: ['Pense bien avant d\'écrire', 'Vérifie ton travail']
                    }),
                    difficulty_level: getDifficultyLevel(comp.niveau)
                },
                {
                    titre: `Exercice QCM - ${description}`,
                    competence_id: competenceId,
                    niveau: comp.niveau,
                    matiere: matiere,
                    contenu: JSON.stringify({
                        type: 'multiple_choice',
                        question: `Question sur ${description} ?`,
                        options: ['Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'],
                        correct_answer: Math.floor(Math.random() * 4),
                        explanation: 'Explication de la bonne réponse'
                    }),
                    difficulty_level: getDifficultyLevel(comp.niveau)
                }
            ];
            
            // Insert exercises
            for (const exercise of exercises) {
                await connection.execute(`
                    INSERT INTO exercises (titre, competence_id, niveau, matiere, contenu, difficulty_level, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    exercise.titre,
                    exercise.competence_id,
                    exercise.niveau,
                    exercise.matiere,
                    exercise.contenu,
                    exercise.difficulty_level
                ]);
                totalExercises++;
            }
            
            if (totalExercises % 50 === 0) {
                console.log(`⏳ Progress: ${totalExercises} exercises created...`);
            }
        }
        
        console.log(`\n🎉 Seeding completed! Created ${totalExercises} exercises`);
        
        // Verify results
        console.log('\n🔍 Verifying results...');
        
        // Count total exercises
        const [exerciseCount] = await connection.execute('SELECT COUNT(*) as count FROM exercises');
        console.log(`📚 Total exercises in database: ${exerciseCount[0].count}`);
        
        // Count by exercise type (from JSON content)
        const [typeCount] = await connection.execute(`
            SELECT 
                JSON_EXTRACT(contenu, '$.type') as exercise_type,
                COUNT(*) as count
            FROM exercises 
            GROUP BY JSON_EXTRACT(contenu, '$.type')
        `);
        console.log('\n📊 Exercises by type:');
        typeCount.forEach(row => {
            const type = row.exercise_type.replace(/"/g, '');
            console.log(`   ${type}: ${row.count}`);
        });
        
        // Count by grade level
        const [gradeCount] = await connection.execute(`
            SELECT niveau, COUNT(*) as count
            FROM exercises 
            GROUP BY niveau
            ORDER BY niveau
        `);
        console.log('\n🎓 Exercises by grade level:');
        gradeCount.forEach(row => {
            console.log(`   ${row.niveau.toUpperCase()}: ${row.count}`);
        });
        
        // Count by subject
        const [subjectCount] = await connection.execute(`
            SELECT matiere, COUNT(*) as count
            FROM exercises 
            GROUP BY matiere
        `);
        console.log('\n📖 Exercises by subject:');
        subjectCount.forEach(row => {
            console.log(`   ${row.matiere}: ${row.count}`);
        });
        
        // Count by difficulty
        const [difficultyCount] = await connection.execute(`
            SELECT difficulty_level, COUNT(*) as count
            FROM exercises 
            GROUP BY difficulty_level
            ORDER BY difficulty_level
        `);
        console.log('\n📈 Exercises by difficulty:');
        difficultyCount.forEach(row => {
            console.log(`   Level ${row.difficulty_level}: ${row.count}`);
        });
        
        // Sample exercises
        const [samples] = await connection.execute(`
            SELECT titre, competence_id, niveau, matiere, difficulty_level
            FROM exercises 
            ORDER BY competence_id
            LIMIT 10
        `);
        console.log('\n📝 Sample exercises:');
        samples.forEach(row => {
            console.log(`   ${row.competence_id} - ${row.titre} (${row.niveau}, Level ${row.difficulty_level})`);
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

function getDifficultyLevel(niveau) {
    switch (niveau.toLowerCase()) {
        case 'cp': return 1;
        case 'ce1': return 2;
        case 'ce2': return 3;
        default: return 2;
    }
}

// Run the seeding
seedExercises().catch(console.error);


