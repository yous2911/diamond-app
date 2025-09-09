import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// =============================================================================
// 🎯 SCRIPT POUR AJOUTER DES EXERCICES D'ÉCHANTILLON
// =============================================================================

const sampleExercises = [
  // Mathématiques - CP/CE1
  {
    titre: "Addition Magique des Dragons",
    competence_id: "MATH_ADD_01",
    niveau: "cp" as const,
    matiere: "mathematiques",
    contenu: {
      type: "CALCUL",
      question: "Le dragon a 3 pièces d'or dans son coffre. Il en trouve 2 de plus. Combien de pièces a-t-il maintenant ?",
      operation: "3 + 2 = ?",
      image: "🐉💰",
      context: "Aventure avec un dragon",
      choix: [4, 5, 6, 7],
      bonneReponse: 5
    },
    difficulty_level: 1
  },

  {
    titre: "Soustraction des Fées",
    competence_id: "MATH_SUB_01",
    niveau: "cp" as const,
    matiere: "mathematiques",
    contenu: {
      type: "CALCUL",
      question: "Les fées avaient 7 fleurs magiques. La tempête en a emporté 3. Combien en reste-t-il ?",
      operation: "7 - 3 = ?",
      image: "🧚‍♀️🌸",
      context: "Jardin des fées",
      choix: [3, 4, 5, 6],
      bonneReponse: 4
    },
    difficulty_level: 1
  },

  {
    titre: "Multiplication des Robots",
    competence_id: "MATH_MULT_01",
    niveau: "ce1" as const,
    matiere: "mathematiques",
    contenu: {
      type: "CALCUL",
      question: "Le robot a 4 compartiments à piles. Chaque compartiment contient 3 piles. Combien de piles au total ?",
      operation: "4 × 3 = ?",
      image: "🤖🔋",
      context: "Laboratoire du robot",
      choix: [10, 11, 12, 13],
      bonneReponse: 12
    },
    difficulty_level: 2
  },

  // Français - CP/CE1
  {
    titre: "Lecture des Contes Magiques",
    competence_id: "FR_LECT_01",
    niveau: "cp" as const,
    matiere: "francais",
    contenu: {
      type: "QCM",
      question: "Il était une fois un petit ___ qui vivait dans la forêt.",
      choix: ["chat", "lapin", "ours", "renard"],
      bonneReponse: "lapin",
      image: "🐰📚",
      context: "Conte de fées"
    },
    difficulty_level: 1
  },

  {
    titre: "Écriture Magique",
    competence_id: "FR_ECRIT_01",
    niveau: "cp" as const,
    matiere: "francais",
    contenu: {
      type: "TEXT_LIBRE",
      question: "Écris le mot : 'maison'",
      audio: "maison.mp3",
      image: "🏠✨",
      context: "Apprentissage de l'écriture",
      bonneReponse: "maison"
    },
    difficulty_level: 1
  },

  {
    titre: "Grammaire des Fées",
    competence_id: "FR_GRAM_01",
    niveau: "ce1" as const,
    matiere: "francais",
    contenu: {
      type: "QCM",
      question: "Conjugue le verbe 'être' : 'Je ___ (être) content de te voir.'",
      choix: ["suis", "es", "est", "sommes"],
      bonneReponse: "suis",
      image: "🧚‍♀️📝",
      context: "Leçon de grammaire"
    },
    difficulty_level: 2
  },

  // Sciences - CP/CE1
  {
    titre: "Les Animaux de la Forêt",
    competence_id: "SCI_NAT_01",
    niveau: "cp" as const,
    matiere: "sciences",
    contenu: {
      type: "QCM",
      question: "Quel animal vit dans la forêt ?",
      choix: ["poisson", "renard", "pingouin", "dauphin"],
      bonneReponse: "renard",
      image: "🦊🌲",
      context: "Exploration de la forêt"
    },
    difficulty_level: 1
  },

  {
    titre: "Les Plantes Magiques",
    competence_id: "SCI_NAT_02",
    niveau: "cp" as const,
    matiere: "sciences",
    contenu: {
      type: "QCM",
      question: "Quelle couleur sont généralement les feuilles des plantes ?",
      choix: ["rouge", "vert", "bleu", "jaune"],
      bonneReponse: "vert",
      image: "🌿🟢",
      context: "Jardin magique"
    },
    difficulty_level: 1
  },

  // Arts - CP/CE1
  {
    titre: "Dessin des Mascottes",
    competence_id: "ART_DESSIN_01",
    niveau: "cp" as const,
    matiere: "arts",
    contenu: {
      type: "QCM",
      question: "Quelle couleur utiliserais-tu pour dessiner un dragon ?",
      choix: ["bleu", "vert", "rose", "blanc"],
      bonneReponse: "vert",
      image: "🐉🎨",
      context: "Atelier d'art"
    },
    difficulty_level: 1
  },

  {
    titre: "Palette des Couleurs",
    competence_id: "ART_COULEUR_01",
    niveau: "ce1" as const,
    matiere: "arts",
    contenu: {
      type: "QCM",
      question: "Quelle couleur obtient-on en mélangeant le rouge et le bleu ?",
      choix: ["vert", "orange", "violet", "jaune"],
      bonneReponse: "violet",
      image: "🎨🟣",
      context: "Laboratoire des couleurs"
    },
    difficulty_level: 2
  }
];

async function addSampleExercises() {
  let connection;
  try {
    console.log('🎯 Adding sample exercises to database...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'reved_kids'
    });
    
    // First, let's create the competences if they don't exist
    console.log('📚 Creating competences...');
    const competences = [
      { id: 'MATH_ADD_01', nom: 'Addition de base', description: 'Additionner des nombres simples' },
      { id: 'MATH_SUB_01', nom: 'Soustraction de base', description: 'Soustraire des nombres simples' },
      { id: 'MATH_MULT_01', nom: 'Multiplication de base', description: 'Multiplier des nombres simples' },
      { id: 'FR_LECT_01', nom: 'Lecture de mots', description: 'Lire et comprendre des mots' },
      { id: 'FR_ECRIT_01', nom: 'Écriture de mots', description: 'Écrire des mots correctement' },
      { id: 'FR_GRAM_01', nom: 'Grammaire de base', description: 'Conjuguer des verbes simples' },
      { id: 'SCI_NAT_01', nom: 'Animaux et habitats', description: 'Connaître les animaux et leurs habitats' },
      { id: 'SCI_NAT_02', nom: 'Plantes et couleurs', description: 'Identifier les couleurs des plantes' },
      { id: 'ART_DESSIN_01', nom: 'Dessin et couleurs', description: 'Utiliser les couleurs en dessin' },
      { id: 'ART_COULEUR_01', nom: 'Mélange des couleurs', description: 'Comprendre le mélange des couleurs' }
    ];
    
    for (const competence of competences) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO competences (id, nom, description, niveau, matiere, created_at, updated_at)
          VALUES (?, ?, ?, 'cp', 'general', NOW(), NOW())
        `, [competence.id, competence.nom, competence.description]);
      } catch (error) {
        console.log(`Competence ${competence.id} might already exist, skipping...`);
      }
    }
    
    // Now insert the exercises
    console.log('🎯 Inserting exercises...');
    for (const exercise of sampleExercises) {
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
    }
    
    console.log(`✅ Successfully added ${sampleExercises.length} sample exercises!`);
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
    console.error('❌ Error adding sample exercises:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
if (require.main === module) {
  addSampleExercises()
    .then(() => {
      console.log('🎉 Sample exercises added successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to add sample exercises:', error);
      process.exit(1);
    });
}

export { addSampleExercises };