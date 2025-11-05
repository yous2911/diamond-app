-- =====================================================
-- DIAMOND APP - Complete Database Creation Script
-- Create fresh database with all tables and test data
-- =====================================================

-- Drop and recreate the database
DROP DATABASE IF EXISTS reved_kids;
CREATE DATABASE reved_kids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reved_kids;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Students table
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

-- Exercises table
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
  xp INT DEFAULT 10,
  configuration JSON,
  ordre INT DEFAULT 0,
  est_actif BOOLEAN DEFAULT true,
  metadonnees JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Student Progress table
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

-- Sessions table
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY,
  student_id INT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Revisions table
CREATE TABLE revisions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  exercise_id INT,
  revision_date DATE NOT NULL,
  score INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- Modules table
CREATE TABLE modules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  titre VARCHAR(200) NOT NULL,
  matiere VARCHAR(50) NOT NULL,
  niveau VARCHAR(20) NOT NULL,
  ordre INT DEFAULT 0,
  est_actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- GDPR & COMPLIANCE TABLES
-- =====================================================

-- Parental Consent table
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

-- Consent Preferences table
CREATE TABLE consent_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- GDPR Consent Requests table
CREATE TABLE gdpr_consent_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  consent_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  request_token VARCHAR(255),
  request_type VARCHAR(50),
  expires_at TIMESTAMP NULL,
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Audit Logs table
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  user_id VARCHAR(36),
  parent_id VARCHAR(36),
  student_id VARCHAR(36),
  details JSON NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  severity VARCHAR(20) NOT NULL DEFAULT 'medium',
  category VARCHAR(50),
  session_id VARCHAR(100),
  correlation_id VARCHAR(36),
  checksum VARCHAR(64) NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GAMIFICATION TABLES
-- =====================================================

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

-- Leaderboard History table
CREATE TABLE leaderboard_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  leaderboard_type VARCHAR(50) NOT NULL,
  rank INT NOT NULL,
  score INT NOT NULL,
  period VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- Student Achievements table
CREATE TABLE student_achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  achievement_code VARCHAR(50) NOT NULL,
  badge_icon VARCHAR(255),
  achievement_type VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  xp_reward INT DEFAULT 10,
  unlocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- =====================================================
-- ANALYTICS TABLES
-- =====================================================

-- Daily Learning Analytics table
CREATE TABLE daily_learning_analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  date DATE NOT NULL,
  exercises_completed INT DEFAULT 0,
  time_spent INT DEFAULT 0,
  total_time_minutes INT DEFAULT 0,
  total_exercises INT DEFAULT 0,
  completed_exercises INT DEFAULT 0,
  avg_score DECIMAL(5,2) DEFAULT 0.00,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  competences_worked INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- =====================================================
-- INSERT TEST DATA
-- =====================================================

-- Test students with hashed passwords
INSERT INTO students (
  prenom, nom, email, password_hash, date_naissance,
  niveau_actuel, niveau_scolaire, total_points, xp,
  serie_jours, mascotte_type, mascotte_color,
  est_connecte, created_at, updated_at
) VALUES 
-- Password: password123 (hashed with bcrypt salt rounds 12)
('Emma', 'Martin', 'emma.martin@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2017-03-15', 'CP', 'CP', 150, 150, 0, 'dragon', '#ff6b35', false, NOW(), NOW()),
('Lucas', 'Dubois', 'lucas.dubois@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2017-05-20', 'CP', 'CP', 200, 200, 0, 'dragon', '#ff6b35', false, NOW(), NOW()),
('Léa', 'Bernard', 'lea.bernard@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2017-08-10', 'CP', 'CP', 100, 100, 0, 'dragon', '#ff6b35', false, NOW(), NOW()),
('Noah', 'Garcia', 'noah.garcia@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2016-01-25', 'CE1', 'CE1', 300, 300, 0, 'dragon', '#ff6b35', false, NOW(), NOW()),
('Alice', 'Rodriguez', 'alice.rodriguez@test.com', '$2b$12$rQGVXGYF/XKLgNLdT5/eqO5KgR6iyCm2V8LDXrU4RMc4.2O8JZ/pe', '2016-11-30', 'CE1', 'CE1', 250, 250, 0, 'dragon', '#ff6b35', false, NOW(), NOW());

-- GDPR Parental Consent
INSERT INTO parental_consent (student_id, parent_name, parent_email, consent_given, consent_date, created_at) VALUES
(1, 'Marie Martin', 'marie.martin@email.com', TRUE, NOW(), NOW()),
(2, 'Pierre Dubois', 'pierre.dubois@email.com', TRUE, NOW(), NOW()),
(3, 'Sophie Bernard', 'sophie.bernard@email.com', TRUE, NOW(), NOW()),
(4, 'Carlos Garcia', 'carlos.garcia@email.com', TRUE, NOW(), NOW()),
(5, 'Ana Rodriguez', 'ana.rodriguez@email.com', TRUE, NOW(), NOW());

-- GDPR Consent Preferences
INSERT INTO consent_preferences (student_id, consent_type, granted, created_at) VALUES
(1, 'data_processing', TRUE, NOW()),
(1, 'analytics', TRUE, NOW()),
(1, 'marketing', TRUE, NOW()),
(2, 'data_processing', TRUE, NOW()),
(2, 'analytics', TRUE, NOW()),
(2, 'marketing', TRUE, NOW()),
(3, 'data_processing', TRUE, NOW()),
(3, 'analytics', TRUE, NOW()),
(3, 'marketing', TRUE, NOW()),
(4, 'data_processing', TRUE, NOW()),
(4, 'analytics', TRUE, NOW()),
(4, 'marketing', TRUE, NOW()),
(5, 'data_processing', TRUE, NOW()),
(5, 'analytics', TRUE, NOW()),
(5, 'marketing', TRUE, NOW());

-- Sample exercises for CP level
INSERT INTO exercises (
  titre, description, matiere, niveau, difficulte, competence_code,
  prerequis, contenu, solution, points_recompense, temps_estime,
  type_exercice, type, xp, configuration, ordre, est_actif
) VALUES
('Addition simple', 'Apprendre à additionner deux nombres', 'mathématiques', 'CP', 'débutant', 'MATH_ADD_01',
  '[]',
  '{"question": "Combien font 2 + 3 ?", "options": ["4", "5", "6"], "type": "multiple_choice"}',
  '{"answer": "5", "explanation": "2 + 3 = 5"}',
  10, 300, 'multiple_choice', 'multiple_choice', 10, '{}', 1, true),
  
('Reconnaissance lettres', 'Identifier les lettres de l\\'alphabet', 'français', 'CP', 'débutant', 'FR_LETT_01',
  '[]',
  '{"question": "Quelle est cette lettre ?", "image": "letter_a.png", "options": ["A", "B", "C"], "type": "multiple_choice"}',
  '{"answer": "A", "explanation": "C\\'est la lettre A"}',
  10, 300, 'multiple_choice', 'multiple_choice', 10, '{}', 1, true);

-- Sample leaderboard data
INSERT INTO leaderboards (type, category, student_id, score, rank, previous_rank, rank_change, period, created_at) VALUES
('global', 'points', 4, 300, 1, 2, 1, 'current', NOW()),
('global', 'points', 5, 250, 2, 1, -1, 'current', NOW()),
('global', 'points', 2, 200, 3, 3, 0, 'current', NOW()),
('global', 'points', 1, 150, 4, 4, 0, 'current', NOW()),
('global', 'points', 3, 100, 5, 5, 0, 'current', NOW());

-- Sample student badges  
INSERT INTO student_badges (student_id, badge_type, title, description, icon, rarity, earned_at) VALUES
(1, 'first_exercise', '🎯 Premier Exercice', 'Félicitations pour votre premier exercice !', '🎯', 'common', NOW()),
(2, 'first_exercise', '🎯 Premier Exercice', 'Félicitations pour votre premier exercice !', '🎯', 'common', NOW()),
(4, 'top_performer', '👑 Meilleur Élève', 'Bravo, vous êtes en tête du classement !', '👑', 'legendary', NOW());

-- Sample streaks
INSERT INTO streaks (student_id, current_streak, longest_streak, last_activity_date) VALUES
(1, 3, 5, NOW()),
(2, 7, 10, NOW()),
(3, 1, 3, NOW()),
(4, 12, 15, NOW()),
(5, 5, 8, NOW());

-- Sample daily analytics
INSERT INTO daily_learning_analytics (student_id, date, exercises_completed, time_spent, avg_score) VALUES
(1, CURDATE(), 3, 900, 85.5),
(2, CURDATE(), 5, 1200, 92.0),
(3, CURDATE(), 2, 600, 78.5),
(4, CURDATE(), 7, 1800, 95.5),
(5, CURDATE(), 4, 1000, 88.0);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_student_progress_exercise_id ON student_progress(exercise_id);
CREATE INDEX idx_exercises_competence ON exercises(competence_code);
CREATE INDEX idx_leaderboards_type_category ON leaderboards(type, category);
CREATE INDEX idx_leaderboards_student_rank ON leaderboards(student_id, rank);

-- =====================================================
-- DISPLAY SUCCESS MESSAGE
-- =====================================================

SELECT 'Database created successfully!' as status;
SELECT 'Test students created with email login capability' as info;
SELECT 'Login credentials: Any test student email + password: password123' as credentials;