/**
 * Direct Exercise Seeding
 * Seeds exercises directly without migration issues
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

async function seedExercises() {
  let connection;
  
  try {
    console.log('🌱 Seeding exercises...\n');
    
    connection = await mysql.createConnection({
      ...DB_CONFIG,
      multipleStatements: true
    });
    console.log('✅ Connected to database\n');
    
    // Check existing exercises
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM exercises');
    console.log(`📊 Existing exercises: ${existing[0].count}\n`);
    
    // Sample exercises to seed
    const exercises = [
      {
        titre: 'Addition simple',
        description: 'Combien font 2 + 3 ?',
        matiere: 'mathematiques',
        niveau: 'CP',
        difficulte: 'decouverte',
        competence_code: 'MATH_ADD_01',
        type_exercice: 'multiple-choice',
        contenu: JSON.stringify({
          question: 'Combien font 2 + 3 ?',
          options: ['4', '5', '6', '7'],
          type: 'multiple-choice'
        }),
        solution: JSON.stringify({
          correctAnswer: '5',
          explanation: '2 + 3 = 5'
        }),
        points_recompense: 10,
        temps_estime: 60,
        xp: 10,
        ordre: 1,
        est_actif: true
      },
      {
        titre: 'Soustraction simple',
        description: 'Combien font 10 - 4 ?',
        matiere: 'mathematiques',
        niveau: 'CP',
        difficulte: 'decouverte',
        competence_code: 'MATH_SUB_01',
        type_exercice: 'fill-in-blank',
        contenu: JSON.stringify({
          question: 'Combien font 10 - 4 ?',
          type: 'calculation'
        }),
        solution: JSON.stringify({
          correctAnswer: '6',
          explanation: '10 - 4 = 6'
        }),
        points_recompense: 10,
        temps_estime: 90,
        xp: 10,
        ordre: 2,
        est_actif: true
      },
      {
        titre: 'Lecture de mots simples',
        description: 'Lis le mot affiché',
        matiere: 'francais',
        niveau: 'CP',
        difficulte: 'decouverte',
        competence_code: 'FR_READ_01',
        type_exercice: 'text-input',
        contenu: JSON.stringify({
          question: 'Lis ce mot : "CHAT"',
          word: 'chat',
          type: 'reading'
        }),
        solution: JSON.stringify({
          correctAnswer: 'chat',
          explanation: 'Le mot est "chat"'
        }),
        points_recompense: 15,
        temps_estime: 120,
        xp: 15,
        ordre: 1,
        est_actif: true
      }
    ];
    
    let inserted = 0;
    let skipped = 0;
    
    for (const exercise of exercises) {
      try {
        // Check if exists
        const [existing] = await connection.execute(
          'SELECT id FROM exercises WHERE titre = ? AND matiere = ? AND niveau = ?',
          [exercise.titre, exercise.matiere, exercise.niveau]
        );
        
        if (existing.length > 0) {
          console.log(`   ⏭️  Skipped: ${exercise.titre} (already exists)`);
          skipped++;
        } else {
          await connection.execute(
            `INSERT INTO exercises (
              titre, description, matiere, niveau, difficulte, competence_id, competence_code,
              type_exercice, contenu, solution, points_recompense, temps_estime,
              xp, ordre, est_actif, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              exercise.titre,
              exercise.description,
              exercise.matiere,
              exercise.niveau,
              exercise.difficulte,
              exercise.competence_code, // Use competence_code for competence_id too
              exercise.competence_code,
              exercise.type_exercice,
              exercise.contenu,
              exercise.solution,
              exercise.points_recompense,
              exercise.temps_estime,
              exercise.xp,
              exercise.ordre,
              exercise.est_actif
            ]
          );
          console.log(`   ✅ Inserted: ${exercise.titre}`);
          inserted++;
        }
      } catch (error) {
        console.log(`   ❌ Error with ${exercise.titre}: ${error.message}`);
      }
    }
    
    // Final count
    const [final] = await connection.execute('SELECT COUNT(*) as count FROM exercises');
    console.log(`\n✅ Seeding complete!`);
    console.log(`   Inserted: ${inserted}, Skipped: ${skipped}`);
    console.log(`   Total exercises in database: ${final[0].count}\n`);
    
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
  seedExercises();
}

module.exports = { seedExercises };

