// CP2025 Schema Database Seeding
const mysql = require('mysql2/promise');

async function seedCP2025Database() {
  try {
    console.log('🌱 Starting CP2025 database seeding...');

    // Connect directly to MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'thisisREALLYIT29!',
      database: 'reved_kids'
    });

    console.log('✅ Connected to database');

    // First, create the CP2025 tables
    console.log('📋 Creating CP2025 tables...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS competences_cp (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        titre VARCHAR(200) NOT NULL,
        description TEXT,
        niveau_scolaire VARCHAR(20) NOT NULL,
        matiere ENUM('MATHEMATIQUES', 'FRANCAIS', 'SCIENCES', 'HISTOIRE_GEOGRAPHIE', 'ANGLAIS') NOT NULL,
        ordre INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INT PRIMARY KEY AUTO_INCREMENT,
        competence_id INT NOT NULL,
        type ENUM('CALCUL', 'MENTAL_MATH', 'DRAG_DROP', 'QCM', 'LECTURE', 'ECRITURE', 'COMPREHENSION') NOT NULL,
        question TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        options JSON,
        difficulty_level INT NOT NULL DEFAULT 3,
        xp_reward INT DEFAULT 5,
        time_limit INT DEFAULT 60,
        hints_available INT DEFAULT 0,
        hints_text JSON,
        metadata JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (competence_id) REFERENCES competences_cp(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tables created');

    // Now seed competences_cp (required for foreign keys)
    console.log('📋 Seeding competences...');
    await connection.execute(`
      INSERT IGNORE INTO competences_cp (id, code, titre, description, niveau_scolaire, matiere)
      VALUES 
      (1, 'CE2.MA.C.ME.01', 'Calculs mentaux', 'Maitriser les tables addition et soustraction', 'CE2', 'MATHEMATIQUES'),
      (2, 'CE2.MA.EG.AN.01', 'Analyser des figures', 'Reconnaitre et analyser des figures geometriques', 'CE2', 'MATHEMATIQUES'),
      (3, 'CE2.FR.V.OR.01', 'Vocabulaire orthographe', 'Enrichir son vocabulaire et maitriser orthographe', 'CE2', 'FRANCAIS'),
      (4, 'CE2.FR.G.SY.01', 'Grammaire syntaxe', 'Comprendre les regles de grammaire et syntaxe', 'CE2', 'FRANCAIS'),
      (5, 'CE2.SC.VI.01', 'Sciences vivant', 'Decouvrir le monde du vivant', 'CE2', 'SCIENCES')
    `);

    // Now seed exercises with proper CP2025 schema
    console.log('🎯 Seeding CE2 exercises...');
    
    // Math exercises
    await connection.execute(`
      INSERT IGNORE INTO exercises (competence_id, type, question, correct_answer, options, difficulty_level, xp_reward, time_limit)
      VALUES 
      (1, 'QCM', 'Combien font 7 + 8 ?', '15', JSON_ARRAY('13', '14', '15', '16'), 2, 10, 60),
      (1, 'QCM', 'Combien font 12 - 5 ?', '7', JSON_ARRAY('6', '7', '8', '9'), 2, 10, 60),
      (1, 'QCM', 'Combien font 6 × 3 ?', '18', JSON_ARRAY('15', '16', '17', '18'), 3, 15, 90),
      (2, 'QCM', 'Combien de côtés a un triangle ?', '3', JSON_ARRAY('2', '3', '4', '5'), 2, 10, 60),
      (2, 'QCM', 'Quelle figure a 4 côtés égaux ?', 'carré', JSON_ARRAY('triangle', 'cercle', 'carré', 'rectangle'), 2, 10, 60)
    `);

    // French exercises  
    await connection.execute(`
      INSERT INTO exercises (competence_id, type, question, correct_answer, options, difficulty_level, xp_reward, time_limit)
      VALUES 
      (3, 'QCM', 'Comment écrit-on le féminin de "chanteur" ?', 'chanteuse', JSON_ARRAY('chanteuse', 'chanteure', 'chantrice', 'chantrice'), 3, 12, 90),
      (3, 'QCM', 'Quel est le pluriel de "cheval" ?', 'chevaux', JSON_ARRAY('chevaux', 'chevales', 'chevals', 'chevaus'), 4, 15, 120),
      (4, 'QCM', 'Dans "Le chat mange", quel est le verbe ?', 'mange', JSON_ARRAY('Le', 'chat', 'mange', 'le chat'), 2, 10, 60),
      (4, 'QCM', 'Conjugue: "Je ... (être) content"', 'suis', JSON_ARRAY('suis', 'es', 'est', 'sommes'), 3, 12, 90)
      ON DUPLICATE KEY UPDATE question=question
    `);

    // Science exercises
    await connection.execute(`
      INSERT INTO exercises (competence_id, type, question, correct_answer, options, difficulty_level, xp_reward, time_limit)
      VALUES 
      (5, 'QCM', 'Quel animal pond des œufs ?', 'poule', JSON_ARRAY('chien', 'chat', 'poule', 'lapin'), 2, 10, 60),
      (5, 'QCM', 'De quoi les plantes ont-elles besoin pour grandir ?', 'soleil', JSON_ARRAY('soleil', 'télévision', 'musique', 'ordinateur'), 2, 10, 60),
      (5, 'QCM', 'Combien de pattes a une araignée ?', '8', JSON_ARRAY('6', '7', '8', '10'), 3, 12, 90)
      ON DUPLICATE KEY UPDATE question=question
    `);

    console.log('✅ CP2025 Database seeded successfully!');
    console.log('📊 Exercise count by competence:');
    console.log('- Calculs mentaux: 3 exercises');
    console.log('- Géométrie: 2 exercises');
    console.log('- Vocabulaire: 2 exercises');  
    console.log('- Grammaire: 2 exercises');
    console.log('- Sciences: 3 exercises');
    console.log('');
    console.log('🎯 Total: 12 CE2 exercises ready for SuperMemo!');

    await connection.end();

  } catch (error) {
    console.error('❌ CP2025 Database seeding failed:', error);
    throw error;
  }
}

// Run the seeding
seedCP2025Database()
  .then(() => {
    console.log('✅ CP2025 Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ CP2025 Seeding failed:', error);
    process.exit(1);
  });