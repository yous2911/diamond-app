import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// =============================================================================
// 🎯 SCRIPT POUR AJOUTER PLUS D'EXERCICES D'ÉCHANTILLON
// =============================================================================

const sampleExercises = [
  // Mathématiques - CP
  {
    titre: "Addition Magique des Dragons",
    competence_id: "CP.MA.N.EN.01", // Using existing competence
    niveau: "cp" as const,
    matiere: "mathematiques",
    contenu: {
      type: "CALCUL",
      question: "Le dragon a 3 pièces d'or dans son coffre. Il en trouve 2 de plus. Combien de pièces a-t-il maintenant ?",
      operation: "3 + 2 = ?",
      image: "🐉💰",
      context: "Aventure avec un dragon",
      choix: [4, 5, 6, 7],
      bonneReponse: 5,
      aide: "Compte les pièces une par une",
      feedback_succes: "Bravo ! Le dragon a maintenant 5 pièces d'or !",
      reponse_attendue: "5"
    },
    difficulty_level: 1
  },

  {
    titre: "Soustraction des Fées",
    competence_id: "CP.MA.N.EN.01", // Using existing competence
    niveau: "cp" as const,
    matiere: "mathematiques",
    contenu: {
      type: "CALCUL",
      question: "Les fées avaient 7 fleurs magiques. La tempête en a emporté 3. Combien en reste-t-il ?",
      operation: "7 - 3 = ?",
      image: "🧚‍♀️🌸",
      context: "Jardin des fées",
      choix: [3, 4, 5, 6],
      bonneReponse: 4,
      aide: "Enlève 3 fleurs de tes 7 fleurs",
      feedback_succes: "Parfait ! Il reste 4 fleurs magiques !",
      reponse_attendue: "4"
    },
    difficulty_level: 1
  },

  {
    titre: "Multiplication des Robots",
    competence_id: "CP.MA.N.FR.01", // Using existing competence
    niveau: "cp" as const,
    matiere: "mathematiques",
    contenu: {
      type: "CALCUL",
      question: "Le robot a 4 compartiments à piles. Chaque compartiment contient 3 piles. Combien de piles au total ?",
      operation: "4 × 3 = ?",
      image: "🤖🔋",
      context: "Laboratoire du robot",
      choix: [10, 11, 12, 13],
      bonneReponse: 12,
      aide: "Multiplie 4 par 3",
      feedback_succes: "Excellent ! Le robot a 12 piles au total !",
      reponse_attendue: "12"
    },
    difficulty_level: 2
  },

  // Français - CP
  {
    titre: "Lecture des Contes Magiques",
    competence_id: "CP.FR.E.CO.01", // Using existing competence
    niveau: "cp" as const,
    matiere: "francais",
    contenu: {
      type: "QCM",
      question: "Il était une fois un petit ___ qui vivait dans la forêt.",
      choix: ["chat", "lapin", "ours", "renard"],
      bonneReponse: "lapin",
      image: "🐰📚",
      context: "Conte de fées",
      aide: "Lis la phrase et choisis l'animal qui vit dans la forêt",
      feedback_succes: "Bravo ! Le lapin vit bien dans la forêt !",
      reponse_attendue: "lapin"
    },
    difficulty_level: 1
  },

  {
    titre: "Écriture Magique",
    competence_id: "CP.FR.E.CO.01", // Using existing competence
    niveau: "cp" as const,
    matiere: "francais",
    contenu: {
      type: "TEXT_LIBRE",
      question: "Écris le mot : 'maison'",
      audio: "maison.mp3",
      image: "🏠✨",
      context: "Apprentissage de l'écriture",
      bonneReponse: "maison",
      aide: "Écris chaque lettre du mot 'maison'",
      feedback_succes: "Parfait ! Tu as bien écrit le mot 'maison' !",
      reponse_attendue: "maison"
    },
    difficulty_level: 1
  },

  // Français - CE2
  {
    titre: "Grammaire des Fées",
    competence_id: "CE2.FR.E.CO.01", // Using existing competence
    niveau: "ce2" as const,
    matiere: "francais",
    contenu: {
      type: "QCM",
      question: "Conjugue le verbe 'être' : 'Je ___ (être) content de te voir.'",
      choix: ["suis", "es", "est", "sommes"],
      bonneReponse: "suis",
      image: "🧚‍♀️📝",
      context: "Leçon de grammaire",
      aide: "Avec 'Je', on utilise 'suis'",
      feedback_succes: "Excellent ! Je suis content de te voir !",
      reponse_attendue: "suis"
    },
    difficulty_level: 2
  },

  // Mathématiques - CE2
  {
    titre: "Énumération Avancée",
    competence_id: "CE2.MA.N.EN.01", // Using existing competence
    niveau: "ce2" as const,
    matiere: "mathematiques",
    contenu: {
      type: "QCM",
      question: "Combien y a-t-il de côtés dans un triangle ?",
      choix: ["2", "3", "4", "5"],
      bonneReponse: "3",
      image: "🔺📐",
      context: "Géométrie magique",
      aide: "Un triangle a 3 côtés",
      feedback_succes: "Parfait ! Un triangle a bien 3 côtés !",
      reponse_attendue: "3"
    },
    difficulty_level: 2
  }
];

async function addMoreExercises() {
  let connection;
  try {
    console.log('🎯 Adding more sample exercises to database...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'reved_kids'
    });
    
    // Insert the exercises
    console.log('🎯 Inserting exercises...');
    for (const exercise of sampleExercises) {
      try {
        await connection.execute(`
          INSERT INTO exercises (titre, competence_id, niveau, matiere, contenu, difficulty_level)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          exercise.titre,
          exercise.competence_id,
          exercise.niveau,
          exercise.matiere,
          JSON.stringify(exercise.contenu),
          exercise.difficulty_level
        ]);
        console.log(`✅ Added: ${exercise.titre}`);
      } catch (error) {
        console.log(`⚠️ Skipped: ${exercise.titre} (might already exist)`);
      }
    }
    
    console.log(`✅ Successfully processed ${sampleExercises.length} exercises!`);
    console.log('📚 Exercise subjects:');
    
    const subjects = [...new Set(sampleExercises.map(ex => ex.matiere))];
    subjects.forEach(subject => {
      const count = sampleExercises.filter(ex => ex.matiere === subject).length;
      console.log(`   - ${subject}: ${count} exercises`);
    });
    
    console.log('🎮 Exercise types:');
    const types = [...new Set(sampleExercises.map(ex => ex.contenu.type))];
    types.forEach(type => {
      const count = sampleExercises.filter(ex => ex.contenu.type === type).length;
      console.log(`   - ${type}: ${count} exercises`);
    });
    
    console.log('🎯 Ready to test the epic level-up system!');
    console.log('💡 Students can now complete exercises and see the amazing celebrations!');
    
  } catch (error) {
    console.error('❌ Error adding exercises:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
if (require.main === module) {
  addMoreExercises()
    .then(() => {
      console.log('🎉 More exercises added successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to add exercises:', error);
      process.exit(1);
    });
}

export { addMoreExercises };
