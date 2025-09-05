-- COMPLETE DATABASE CREATION SCRIPT
-- Based on your actual schema.ts file

DROP DATABASE IF EXISTS diamond_app;
CREATE DATABASE diamond_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE diamond_app;

-- Students table (matches your schema)
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  date_naissance DATE NOT NULL,
  niveau_actuel VARCHAR(20) NOT NULL,
  total_points INT DEFAULT 0,
  xp INT DEFAULT 0,
  serie_jours INT DEFAULT 0,
  mascotte_type VARCHAR(50) DEFAULT 'dragon',
  dernier_acces TIMESTAMP NULL,
  est_connecte BOOLEAN DEFAULT false,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP NULL,
  niveau_scolaire VARCHAR(20) NOT NULL,
  mascotte_color VARCHAR(20) DEFAULT '#ff6b35',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Exercises table (matches your schema)
CREATE TABLE exercises (
  id INT PRIMARY KEY AUTO_INCREMENT,
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
  temps_estime INT DEFAULT 300,
  type_exercice VARCHAR(30) NOT NULL,
  type VARCHAR(30) NOT NULL,
  xp INT DEFAULT 10,
  configuration JSON,
  ordre INT DEFAULT 0,
  est_actif BOOLEAN DEFAULT true,
  metadonnees JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Student Progress table (full schema)
CREATE TABLE student_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  exercise_id INT NOT NULL,
  competence_code VARCHAR(20) NOT NULL,
  progress_percent DECIMAL(5,2) DEFAULT 0.00,
  mastery_level VARCHAR(20) NOT NULL DEFAULT 'not_started',
  total_attempts INT DEFAULT 0,
  successful_attempts INT DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  best_score DECIMAL(5,2) DEFAULT 0.00,
  total_time_spent INT DEFAULT 0,
  time_spent INT DEFAULT 0,
  last_attempt_at TIMESTAMP NULL,
  mastered_at TIMESTAMP NULL,
  needs_review BOOLEAN DEFAULT false,
  review_scheduled_at TIMESTAMP NULL,
  streak_count INT DEFAULT 0,
  difficulty_preference VARCHAR(30),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP NULL,
  attempts INT DEFAULT 0,
  score DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- Student Learning Path table
CREATE TABLE student_learning_path (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  competence_code VARCHAR(20) NOT NULL,
  current_level VARCHAR(20) NOT NULL DEFAULT 'decouverte',
  target_level VARCHAR(20) NOT NULL DEFAULT 'maitrise',
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  recommended_difficulty VARCHAR(30) NOT NULL DEFAULT 'decouverte',
  estimated_completion_time INT,
  personalized_order INT DEFAULT 0,
  is_blocked BOOLEAN DEFAULT false,
  blocking_reasons JSON,
  unlocked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Competence Prerequisites table
CREATE TABLE competence_prerequisites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  competence_code VARCHAR(20) NOT NULL,
  prerequisite_code VARCHAR(20) NOT NULL,
  required BOOLEAN DEFAULT true,
  minimum_level VARCHAR(20) DEFAULT 'decouverte',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboards table
CREATE TABLE leaderboards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  student_id INT NOT NULL,
  score INT NOT NULL,
  rank INT NOT NULL,
  previous_rank INT,
  rank_change INT DEFAULT 0,
  period VARCHAR(20),
  class_id INT,
  metadata JSON,
  last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Student Badges table
CREATE TABLE student_badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  badge_type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  rarity VARCHAR(20) DEFAULT 'common',
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP NULL,
  metadata JSON,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Streaks table
CREATE TABLE streaks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  streak_freezes INT DEFAULT 0,
  weekly_goal INT DEFAULT 5,
  streak_safe_until TIMESTAMP NULL,
  emotional_state VARCHAR(20) DEFAULT 'cold',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- GDPR tables
CREATE TABLE parental_consent (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  parent_name VARCHAR(200) NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE TABLE consent_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Insert test students
INSERT INTO students (prenom, nom, email, password_hash, date_naissance, niveau_actuel, niveau_scolaire, total_points, xp) VALUES 
('Emma', 'Martin', 'emma.martin@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2017-03-15', 'CP', 'CP', 150, 150),
('Lucas', 'Dubois', 'lucas.dubois@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2017-05-20', 'CP', 'CP', 200, 200),
('Léa', 'Bernard', 'lea.bernard@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2017-08-10', 'CP', 'CP', 100, 100),
('Noah', 'Garcia', 'noah.garcia@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2016-01-25', 'CE1', 'CE1', 300, 300),
('Alice', 'Rodriguez', 'alice.rodriguez@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2016-11-30', 'CE1', 'CE1', 250, 250);

-- Sample exercises with competency codes
INSERT INTO exercises (titre, description, matiere, niveau, difficulte, competence_code, prerequis, contenu, solution, type_exercice, type, xp) VALUES
('Addition simple', 'Additionner deux nombres', 'mathématiques', 'CP', 'facile', 'CP.MA.N1.1', 
 '[]', 
 '{"question": "Combien font 2 + 3 ?", "options": ["4", "5", "6"], "type": "qcm"}', 
 '{"answer": "5", "explanation": "2 + 3 = 5"}', 
 'qcm', 'qcm', 10),

('Reconnaissance lettres', 'Identifier les lettres', 'français', 'CP', 'facile', 'CP.FR.L1.1',
 '[]',
 '{"question": "Quelle est cette lettre ?", "letter": "A", "options": ["A", "B", "C"], "type": "qcm"}',
 '{"answer": "A", "explanation": "C\'est la lettre A"}',
 'qcm', 'qcm', 10),

('Soustraction CE1', 'Soustraire deux nombres', 'mathématiques', 'CE1', 'moyen', 'CE1.MA.N2.1',
 '["CP.MA.N1.1"]',
 '{"question": "Combien font 8 - 3 ?", "options": ["4", "5", "6"], "type": "qcm"}',
 '{"answer": "5", "explanation": "8 - 3 = 5"}',
 'qcm', 'qcm', 15);

-- Sample competency prerequisites
INSERT INTO competence_prerequisites (competence_code, prerequisite_code, required, minimum_level, description) VALUES
('CE1.MA.N2.1', 'CP.MA.N1.1', true, 'maitrise', 'Maîtriser l\'addition avant la soustraction'),
('CP.FR.L1.2', 'CP.FR.L1.1', true, 'decouverte', 'Connaître les lettres de base');

-- Sample GDPR data
INSERT INTO parental_consent (student_id, parent_name, parent_email, consent_given, consent_date) VALUES
(1, 'Marie Martin', 'marie.martin@email.com', TRUE, NOW()),
(2, 'Pierre Dubois', 'pierre.dubois@email.com', TRUE, NOW()),
(3, 'Sophie Bernard', 'sophie.bernard@email.com', TRUE, NOW()),
(4, 'Carlos Garcia', 'carlos.garcia@email.com', TRUE, NOW()),
(5, 'Ana Rodriguez', 'ana.rodriguez@email.com', TRUE, NOW());

INSERT INTO consent_preferences (student_id, consent_type, granted) VALUES
(1, 'data_processing', TRUE), (1, 'analytics', TRUE),
(2, 'data_processing', TRUE), (2, 'analytics', TRUE),
(3, 'data_processing', TRUE), (3, 'analytics', TRUE),
(4, 'data_processing', TRUE), (4, 'analytics', TRUE),
(5, 'data_processing', TRUE), (5, 'analytics', TRUE);

-- Sample leaderboard data
INSERT INTO leaderboards (type, category, student_id, score, rank, previous_rank, rank_change) VALUES
('global', 'points', 4, 300, 1, 2, 1),
('global', 'points', 5, 250, 2, 1, -1),
('global', 'points', 2, 200, 3, 3, 0),
('global', 'points', 1, 150, 4, 4, 0),
('global', 'points', 3, 100, 5, 5, 0);

-- Sample streaks
INSERT INTO streaks (student_id, current_streak, longest_streak) VALUES
(1, 3, 5), (2, 7, 10), (3, 1, 3), (4, 12, 15), (5, 5, 8);

SELECT 'DATABASE CREATED SUCCESSFULLY!' as status;