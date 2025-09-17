-- =============================================================================
-- STAGING DATABASE SETUP SCRIPT
-- RevEd Kids Backend - Staging Environment
-- =============================================================================

-- Create staging database
CREATE DATABASE IF NOT EXISTS `reved_kids_staging` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the staging database
USE `reved_kids_staging`;

-- =============================================================================
-- CREATE TABLES (Same structure as production)
-- =============================================================================

-- Students table
CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prenom` varchar(100) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `passwordHash` varchar(255) NOT NULL,
  `role` enum('student','parent','teacher','admin') DEFAULT 'student',
  `niveauActuel` enum('CP','CE1','CE2','CM1','CM2') DEFAULT 'CP',
  `totalPoints` int(11) DEFAULT 0,
  `serieJours` int(11) DEFAULT 0,
  `mascotteType` varchar(50) DEFAULT 'dragon',
  `estConnecte` boolean DEFAULT false,
  `dernierAcces` timestamp NULL DEFAULT NULL,
  `failedLoginAttempts` int(11) DEFAULT 0,
  `accountLockedUntil` timestamp NULL DEFAULT NULL,
  `passwordResetToken` varchar(255) NULL DEFAULT NULL,
  `passwordResetExpires` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`),
  KEY `idx_niveau` (`niveauActuel`),
  KEY `idx_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Competencies table
CREATE TABLE IF NOT EXISTS `competencies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL UNIQUE,
  `nom` varchar(255) NOT NULL,
  `matiere` varchar(50) NOT NULL,
  `domaine` varchar(100) NOT NULL,
  `niveau` varchar(20) NOT NULL,
  `difficulte` enum('L','M','H','E') DEFAULT 'L',
  `description` text,
  `objectifs` text,
  `prerequis` text,
  `xp_reward` int(11) DEFAULT 10,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_code` (`code`),
  KEY `idx_matiere` (`matiere`),
  KEY `idx_niveau` (`niveau`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exercises table
CREATE TABLE IF NOT EXISTS `exercises` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `matiere` varchar(50) NOT NULL,
  `niveau` varchar(20) NOT NULL,
  `difficulte` enum('L','M','H','E') DEFAULT 'L',
  `competenceCode` varchar(50) NOT NULL,
  `questions` json NOT NULL,
  `reponses` json NOT NULL,
  `explications` json,
  `tempsEstime` int(11) DEFAULT 300,
  `xp_reward` int(11) DEFAULT 5,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_competence` (`competenceCode`),
  KEY `idx_matiere` (`matiere`),
  KEY `idx_niveau` (`niveau`),
  FOREIGN KEY (`competenceCode`) REFERENCES `competencies`(`code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Progress table
CREATE TABLE IF NOT EXISTS `studentProgress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `exerciseId` int(11) NOT NULL,
  `competenceCode` varchar(50) NOT NULL,
  `score` decimal(5,2) DEFAULT 0.00,
  `completed` boolean DEFAULT false,
  `timeSpent` int(11) DEFAULT 0,
  `attempts` int(11) DEFAULT 1,
  `lastAttempt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`studentId`),
  KEY `idx_exercise` (`exerciseId`),
  KEY `idx_competence` (`competenceCode`),
  KEY `idx_completed` (`completed`),
  FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`exerciseId`) REFERENCES `exercises`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`competenceCode`) REFERENCES `competencies`(`code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions table
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) NOT NULL,
  `studentId` int(11) NOT NULL,
  `data` json,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`studentId`),
  KEY `idx_expires` (`expiresAt`),
  FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GDPR Files table
CREATE TABLE IF NOT EXISTS `gdprFiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `filePath` varchar(500) NOT NULL,
  `fileSize` int(11) NOT NULL,
  `mimeType` varchar(100) NOT NULL,
  `uploadedAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `anonymizedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`studentId`),
  KEY `idx_uploaded` (`uploadedAt`),
  FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GDPR Data Processing Log table
CREATE TABLE IF NOT EXISTS `gdprDataProcessingLog` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NULL DEFAULT NULL,
  `action` enum('CREATE','READ','UPDATE','DELETE','EXPORT','ANONYMIZE') NOT NULL,
  `dataType` varchar(100) NOT NULL,
  `details` text,
  `ipAddress` varchar(45),
  `userAgent` text,
  `requestId` varchar(255),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student` (`studentId`),
  KEY `idx_action` (`action`),
  KEY `idx_created` (`createdAt`),
  FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- INSERT STAGING TEST DATA
-- =============================================================================

-- Insert test students
INSERT IGNORE INTO `students` (`id`, `prenom`, `nom`, `email`, `passwordHash`, `role`, `niveauActuel`, `totalPoints`, `serieJours`, `mascotteType`) VALUES
(1, 'Test', 'Student', 'test.student@staging.com', '$2b$10$test.hash.for.staging.environment', 'student', 'CE2', 150, 5, 'dragon'),
(2, 'Staging', 'User', 'staging.user@staging.com', '$2b$10$test.hash.for.staging.environment', 'student', 'CE1', 75, 3, 'unicorn'),
(3, 'Admin', 'Staging', 'admin@staging.com', '$2b$10$test.hash.for.staging.environment', 'admin', 'CM1', 500, 10, 'phoenix');

-- Insert test competencies
INSERT IGNORE INTO `competencies` (`id`, `code`, `nom`, `matiere`, `domaine`, `niveau`, `difficulte`, `description`, `xp_reward`) VALUES
(1, 'CE2.FR.L.FL.01', 'Lecture de mots simples', 'FR', 'Lecture', 'CE2', 'L', 'Lire des mots de 2 à 3 syllabes', 10),
(2, 'CE2.MA.L.CA.01', 'Addition simple', 'MA', 'Calcul', 'CE2', 'L', 'Additionner des nombres à 2 chiffres', 10),
(3, 'CE1.FR.M.FL.01', 'Compréhension de texte', 'FR', 'Lecture', 'CE1', 'M', 'Comprendre un texte court', 15);

-- Insert test exercises
INSERT IGNORE INTO `exercises` (`id`, `titre`, `matiere`, `niveau`, `difficulte`, `competenceCode`, `questions`, `reponses`, `explications`, `xp_reward`) VALUES
(1, 'Lecture de mots - Test', 'FR', 'CE2', 'L', 'CE2.FR.L.FL.01', 
 '["Lisez le mot: CHAT", "Lisez le mot: MAISON"]', 
 '["chat", "maison"]', 
 '["Chat se lit C-H-A-T", "Maison se lit M-A-I-S-O-N"]', 
 5),
(2, 'Addition simple - Test', 'MA', 'CE2', 'L', 'CE2.MA.L.CA.01', 
 '["Combien font 5 + 3 ?", "Combien font 12 + 8 ?"]', 
 '["8", "20"]', 
 '["5 + 3 = 8", "12 + 8 = 20"]', 
 5);

-- =============================================================================
-- CREATE STAGING-SPECIFIC VIEWS
-- =============================================================================

-- View for staging dashboard
CREATE OR REPLACE VIEW `staging_dashboard` AS
SELECT 
    s.id,
    s.prenom,
    s.nom,
    s.email,
    s.niveauActuel,
    s.totalPoints,
    s.serieJours,
    COUNT(sp.id) as totalExercises,
    COUNT(CASE WHEN sp.completed = true THEN 1 END) as completedExercises,
    AVG(sp.score) as averageScore
FROM students s
LEFT JOIN studentProgress sp ON s.id = sp.studentId
GROUP BY s.id, s.prenom, s.nom, s.email, s.niveauActuel, s.totalPoints, s.serieJours;

-- =============================================================================
-- CREATE STAGING-SPECIFIC STORED PROCEDURES
-- =============================================================================

DELIMITER //

-- Procedure to reset staging data
CREATE PROCEDURE IF NOT EXISTS `ResetStagingData`()
BEGIN
    -- Clear all progress data
    DELETE FROM studentProgress;
    DELETE FROM sessions;
    
    -- Reset student points and streaks
    UPDATE students SET 
        totalPoints = 0, 
        serieJours = 0, 
        estConnecte = false,
        dernierAcces = NULL,
        failedLoginAttempts = 0,
        accountLockedUntil = NULL;
    
    -- Clear GDPR logs (keep structure)
    DELETE FROM gdprDataProcessingLog WHERE createdAt < DATE_SUB(NOW(), INTERVAL 1 DAY);
    
    SELECT 'Staging data reset successfully' as message;
END //

-- Procedure to generate test progress data
CREATE PROCEDURE IF NOT EXISTS `GenerateTestProgress`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE student_id INT;
    DECLARE exercise_id INT;
    DECLARE student_cursor CURSOR FOR SELECT id FROM students WHERE role = 'student';
    DECLARE exercise_cursor CURSOR FOR SELECT id FROM exercises;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- Generate progress for each student and exercise
    OPEN student_cursor;
    student_loop: LOOP
        FETCH student_cursor INTO student_id;
        IF done THEN
            LEAVE student_loop;
        END IF;
        
        OPEN exercise_cursor;
        exercise_loop: LOOP
            FETCH exercise_cursor INTO exercise_id;
            IF done THEN
                LEAVE exercise_loop;
            END IF;
            
            -- Insert random progress data
            INSERT IGNORE INTO studentProgress (studentId, exerciseId, competenceCode, score, completed, timeSpent, attempts)
            SELECT 
                student_id,
                exercise_id,
                e.competenceCode,
                ROUND(RAND() * 100, 2),
                ROUND(RAND()) = 1,
                ROUND(RAND() * 600) + 60,
                ROUND(RAND() * 3) + 1
            FROM exercises e WHERE e.id = exercise_id;
            
        END LOOP;
        CLOSE exercise_cursor;
        SET done = FALSE;
    END LOOP;
    CLOSE student_cursor;
    
    SELECT 'Test progress data generated successfully' as message;
END //

DELIMITER ;

-- =============================================================================
-- CREATE STAGING-SPECIFIC TRIGGERS
-- =============================================================================

-- Trigger to log all data changes in staging
DELIMITER //

CREATE TRIGGER IF NOT EXISTS `staging_student_audit` 
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    INSERT INTO gdprDataProcessingLog (studentId, action, dataType, details, createdAt)
    VALUES (NEW.id, 'UPDATE', 'student', CONCAT('Student data updated in staging - ID: ', NEW.id), NOW());
END //

CREATE TRIGGER IF NOT EXISTS `staging_progress_audit` 
AFTER INSERT ON studentProgress
FOR EACH ROW
BEGIN
    INSERT INTO gdprDataProcessingLog (studentId, action, dataType, details, createdAt)
    VALUES (NEW.studentId, 'CREATE', 'progress', CONCAT('Progress recorded in staging - Exercise: ', NEW.exerciseId), NOW());
END //

DELIMITER ;

-- =============================================================================
-- FINAL SETUP
-- =============================================================================

-- Create staging-specific user (optional)
-- CREATE USER IF NOT EXISTS 'reved_staging'@'localhost' IDENTIFIED BY 'staging_password_123!';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON reved_kids_staging.* TO 'reved_staging'@'localhost';
-- FLUSH PRIVILEGES;

-- Show final status
SELECT 'Staging database setup completed successfully!' as status;
SELECT COUNT(*) as student_count FROM students;
SELECT COUNT(*) as competency_count FROM competencies;
SELECT COUNT(*) as exercise_count FROM exercises;
SELECT COUNT(*) as progress_count FROM studentProgress;


