// Direct database seeding without config validation
const mysql = require('mysql2/promise');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect directly to MySQL
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'thisisREALLYIT29!',
      database: 'reved_kids'
    });

    console.log('✅ Connected to database');

    // Create tables first
    console.log('📋 Creating tables...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prenom VARCHAR(100) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        date_naissance DATE NOT NULL,
        niveau_actuel VARCHAR(20) NOT NULL,
        niveau_scolaire VARCHAR(20) NOT NULL,
        total_points INT DEFAULT 0,
        xp INT DEFAULT 0,
        serie_jours INT DEFAULT 0,
        mascotte_type VARCHAR(50) DEFAULT 'dragon',
        dernier_acces TIMESTAMP NULL,
        est_connecte BOOLEAN DEFAULT false,
        failed_login_attempts INT DEFAULT 0,
        locked_until TIMESTAMP NULL,
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP,
        mascotte_color VARCHAR(20) DEFAULT '#ff6b35',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exercises (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titre VARCHAR(200) NOT NULL,
        description TEXT,
        matiere VARCHAR(50) NOT NULL,
        niveau VARCHAR(20) NOT NULL,
        difficulte VARCHAR(30) NOT NULL,
        competence_code VARCHAR(20) NOT NULL,
        prerequis JSON,
        contenu JSON NOT NULL,
        solution JSON NOT NULL,
        points_recompense INT DEFAULT 10,
        xp INT DEFAULT 10,
        temps_estime INT DEFAULT 300,
        type_exercice VARCHAR(30) NOT NULL,
        type VARCHAR(30) NOT NULL,
        ordre INT DEFAULT 1,
        est_actif BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Tables created');

    // Seed students with authentication
    console.log('📚 Seeding students...');
    await connection.execute(`
      INSERT INTO students (prenom, nom, email, password_hash, date_naissance, niveau_actuel, niveau_scolaire, total_points, serie_jours, mascotte_type) 
      VALUES 
      ('Lucas', 'Martin', 'lucas.martin@test.com', '$2b$12$8K4QKjX1qV5R.HDGm2bOmOXK8Hk8M7N6B9T5W4R7E1X3K0Y6Z8A2C', '2014-05-15', 'CE2', 'CE2', 150, 3, 'dragon'),
      ('Emma', 'Dubois', 'emma.dubois@test.com', '$2b$12$8K4QKjX1qV5R.HDGm2bOmOXK8Hk8M7N6B9T5W4R7E1X3K0Y6Z8A2C', '2013-09-22', 'CE2', 'CE2', 220, 7, 'unicorn'),
      ('Noah', 'Lefevre', 'noah.lefevre@test.com', '$2b$12$8K4QKjX1qV5R.HDGm2bOmOXK8Hk8M7N6B9T5W4R7E1X3K0Y6Z8A2C', '2015-01-10', 'CE1', 'CE1', 95, 2, 'robot')
      ON DUPLICATE KEY UPDATE email=email
    `);

    // Seed exercises
    console.log('🎯 Seeding exercises...');
    await connection.execute(`
      INSERT INTO exercises (titre, description, matiere, niveau, difficulte, competence_code, type_exercice, type, contenu, solution, xp, points_recompense, temps_estime, ordre) 
      VALUES 
      ('Compter de 10 en 10', 'Complète la suite : 10, 20, ___, 40, 50', 'mathematiques', 'CE1', 'decouverte', 'MATH_COUNT_01', 'multiple-choice', 'multiple-choice', 
       JSON_OBJECT('question', 'Complète la suite : 10, 20, ___, 40, 50', 'options', JSON_ARRAY('25', '30', '35', '45'), 'type', 'multiple-choice'), 
       JSON_OBJECT('correctAnswer', '30', 'explanation', 'En comptant de 10 en 10, après 20 vient 30'), 
       10, 10, 60, 1),
       
      ('Addition simple', 'Calcule : 15 + 8', 'mathematiques', 'CE1', 'decouverte', 'MATH_ADD_01', 'calculation', 'calculation', 
       JSON_OBJECT('question', 'Calcule : 15 + 8', 'operand1', 15, 'operand2', 8, 'operator', '+', 'type', 'calculation'), 
       JSON_OBJECT('correctAnswer', '23', 'explanation', '15 + 8 = 23'), 
       10, 10, 90, 2),
       
      ('Conjugaison présent', 'Conjugue le verbe "manger" à la 3ème personne du singulier', 'francais', 'CE2', 'application', 'FR_CONJ_01', 'text-input', 'text-input', 
       JSON_OBJECT('question', 'Il/Elle ... (manger)', 'verb', 'manger', 'tense', 'present', 'person', 'third_singular', 'type', 'conjugation'), 
       JSON_OBJECT('correctAnswer', 'mange', 'explanation', 'Le verbe "manger" à la 3ème personne du singulier au présent : il/elle mange'), 
       15, 15, 120, 1)
      ON DUPLICATE KEY UPDATE titre=titre
    `);

    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('🧑‍🎓 Test users created:');
    console.log('- lucas.martin@test.com (password: test123456789)');
    console.log('- emma.dubois@test.com (password: test123456789)');
    console.log('- noah.lefevre@test.com (password: test123456789)');
    console.log('');

    await connection.end();

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Run the seeding
seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });