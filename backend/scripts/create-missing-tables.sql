-- Create Missing Database Tables for Tests
-- MySQL Schema for core tables needed for tests to pass

USE reved_kids;

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prenom VARCHAR(100) NOT NULL,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    date_naissance DATE,
    niveau_scolaire ENUM('CP', 'CE1', 'CE2', 'CM1', 'CM2') NOT NULL DEFAULT 'CP',
    niveau_actuel ENUM('CP', 'CE1', 'CE2', 'CM1', 'CM2') NOT NULL DEFAULT 'CP',
    total_points INT DEFAULT 0,
    serie_jours INT DEFAULT 0,
    mascotte_type VARCHAR(50) DEFAULT 'dragon',
    hearts_remaining INT DEFAULT 3,
    current_streak INT DEFAULT 0,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_niveau (niveau_scolaire)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    user_id VARCHAR(100),
    details JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
    id VARCHAR(36) PRIMARY KEY,
    entity_id VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    anomalies JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity (entity_id),
    INDEX idx_type (alert_type),
    INDEX idx_severity (severity),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Files table for file upload system
CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(36) PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    path VARCHAR(500) NOT NULL,
    checksum VARCHAR(64),
    uploaded_by INT,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP NULL,
    metadata JSON,
    status ENUM('active', 'deleted', 'expired') DEFAULT 'active',
    INDEX idx_filename (filename),
    INDEX idx_checksum (checksum),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_status (status),
    INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Competences table
CREATE TABLE IF NOT EXISTS competences (
    id VARCHAR(20) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    titre VARCHAR(255) NOT NULL,
    matiere ENUM('MA', 'FR') NOT NULL,
    niveau ENUM('CP', 'CE1', 'CE2', 'CM1', 'CM2') NOT NULL,
    domaine VARCHAR(10) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_matiere (matiere),
    INDEX idx_niveau (niveau)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    competence_id VARCHAR(20) NOT NULL,
    niveau ENUM('cp', 'ce1', 'ce2', 'cm1', 'cm2') NOT NULL,
    matiere VARCHAR(50) NOT NULL,
    contenu JSON,
    difficulty_level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_competence (competence_id),
    INDEX idx_niveau (niveau),
    INDEX idx_matiere (matiere),
    FOREIGN KEY (competence_id) REFERENCES competences(id) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,
    student_id INT NOT NULL,
    competence_codes JSON,
    exercises_completed INT DEFAULT 0,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
    INDEX idx_student (student_id),
    INDEX idx_status (status),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert test data
-- Test student
INSERT IGNORE INTO students (id, prenom, nom, email, niveau_scolaire, niveau_actuel) VALUES 
(1, 'Alice', 'Dupont', 'alice@test.com', 'CP', 'CP'),
(2, 'Bob', 'Martin', 'bob@test.com', 'CE2', 'CE2'),
(3, 'Charlie', 'Durand', 'charlie@test.com', 'CE1', 'CE1');

-- Test competences
INSERT IGNORE INTO competences (id, code, titre, matiere, niveau, domaine) VALUES 
('CP.MA.N.EN.01', 'CP.MA.N.EN.01', 'Énumération', 'MA', 'CP', 'N'),
('CP.MA.N.FR.01', 'CP.MA.N.FR.01', 'Fractions', 'MA', 'CP', 'N'),
('CP.FR.E.CO.01', 'CP.FR.E.CO.01', 'Compréhension', 'FR', 'CP', 'E'),
('CE2.MA.N.EN.01', 'CE2.MA.N.EN.01', 'Énumération CE2', 'MA', 'CE2', 'N'),
('CE2.FR.E.CO.01', 'CE2.FR.E.CO.01', 'Compréhension CE2', 'FR', 'CE2', 'E');

-- Test exercises
INSERT IGNORE INTO exercises (titre, competence_id, niveau, matiere, contenu) VALUES 
('Addition', 'CP.MA.N.EN.01', 'cp', 'mathematiques', '{"question": "Combien font 2 + 3 ?", "reponse_attendue": "5", "feedback_succes": "Bravo!", "aide": "Compte sur tes doigts"}'),
('Soustraction', 'CP.MA.N.EN.01', 'cp', 'mathematiques', '{"question": "Combien font 5 - 2 ?", "reponse_attendue": "3", "feedback_succes": "Excellent!", "aide": "Enlève 2 objets"}'),
('Lecture CE2', 'CE2.FR.E.CO.01', 'ce2', 'francais', '{"question": "Que signifie le mot joie ?", "reponse_attendue": "bonheur", "feedback_succes": "Parfait!", "aide": "C\'est un sentiment positif"}');

COMMIT;