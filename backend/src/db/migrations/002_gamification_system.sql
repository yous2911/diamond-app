-- =============================================================================
-- Gamification System Migration
-- Production-ready tables with proper indexing and constraints
-- =============================================================================

-- Add XP and level columns to existing students table
ALTER TABLE students 
ADD COLUMN xp INT NOT NULL DEFAULT 0,
ADD COLUMN level INT NOT NULL DEFAULT 1,
ADD COLUMN last_xp_at DATETIME NULL;

-- Add indexes for performance
CREATE INDEX idx_students_xp ON students(xp DESC);
CREATE INDEX idx_students_level ON students(level);
CREATE INDEX idx_students_last_xp ON students(last_xp_at);

-- =============================================================================
-- Achievements System
-- =============================================================================

-- Achievement definitions (static data)
CREATE TABLE achievements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  icon VARCHAR(128),
  rarity ENUM('common', 'rare', 'epic', 'legendary') NOT NULL DEFAULT 'common',
  points_required INT NULL,
  streak_required INT NULL,
  rank_required INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_achievements_code (code),
  INDEX idx_achievements_rarity (rarity)
);

-- User achievements (earned badges)
CREATE TABLE user_achievements (
  user_id INT NOT NULL,
  achievement_id INT NOT NULL,
  earned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSON,
  
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  
  INDEX idx_user_achievements_earned (earned_at DESC),
  INDEX idx_user_achievements_user (user_id, earned_at DESC)
);

-- =============================================================================
-- Streaks System 
-- =============================================================================

CREATE TABLE user_streaks (
  user_id INT PRIMARY KEY,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE NULL,
  streak_start_date DATE NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES students(id) ON DELETE CASCADE,
  
  INDEX idx_streaks_current (current_streak DESC),
  INDEX idx_streaks_best (best_streak DESC),
  INDEX idx_streaks_last_active (last_active_date)
);

-- =============================================================================
-- Kudos System (Social Recognition)
-- =============================================================================

CREATE TABLE kudos (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  from_user INT NOT NULL,
  to_user INT NOT NULL,
  message VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (from_user) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user) REFERENCES students(id) ON DELETE CASCADE,
  
  INDEX idx_kudos_from (from_user, created_at DESC),
  INDEX idx_kudos_to (to_user, created_at DESC),
  INDEX idx_kudos_created (created_at DESC),
  
  -- Prevent spam: unique constraint with time window handled by app logic
  UNIQUE KEY unique_kudos_pair_time (from_user, to_user, created_at)
);

-- =============================================================================
-- Seasons System (Leaderboard Resets)
-- =============================================================================

CREATE TABLE seasons (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_seasons_active (is_active, start_at, end_at),
  INDEX idx_seasons_dates (start_at, end_at)
);

-- Season leaderboard snapshots
CREATE TABLE season_scores (
  season_id INT NOT NULL,
  user_id INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  rank_final INT NULL,
  exercises_completed INT DEFAULT 0,
  streak_best INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (season_id, user_id),
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES students(id) ON DELETE CASCADE,
  
  INDEX idx_season_scores_rank (season_id, score DESC),
  INDEX idx_season_scores_user (user_id, season_id)
);

-- =============================================================================
-- XP Transaction Log (Audit Trail)
-- =============================================================================

CREATE TABLE xp_transactions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  xp_delta INT NOT NULL,
  xp_before INT NOT NULL,
  xp_after INT NOT NULL,
  reason ENUM('login', 'exercise_complete', 'streak_bonus', 'achievement', 'daily_challenge', 'bonus', 'admin') NOT NULL,
  reference_id INT NULL, -- Links to exercise_id, achievement_id, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES students(id) ON DELETE CASCADE,
  
  INDEX idx_xp_transactions_user (user_id, created_at DESC),
  INDEX idx_xp_transactions_reason (reason, created_at DESC),
  INDEX idx_xp_transactions_created (created_at DESC)
);

-- =============================================================================
-- Seed Achievement Data
-- =============================================================================

INSERT INTO achievements (code, name, description, icon, rarity, points_required, streak_required) VALUES
-- Beginner achievements
('FIRST_LOGIN', '🎯 Première Connexion', 'Bienvenue dans l\'aventure !', '🎯', 'common', NULL, NULL),
('FIRST_EXERCISE', '📚 Premier Exercice', 'Votre premier exercice complété !', '📚', 'common', NULL, NULL),
('POINTS_100', '💎 100 Points', 'Vous avez accumulé 100 points !', '💎', 'common', 100, NULL),

-- Streak achievements
('STREAK_3', '🔥 Série de 3 jours', '3 jours consécutifs d\'apprentissage !', '🔥', 'common', NULL, 3),
('STREAK_7', '⚡ Série de 7 jours', 'Une semaine complète ! Impressionnant !', '⚡', 'rare', NULL, 7),
('STREAK_14', '🌟 Série de 14 jours', 'Deux semaines de constance !', '🌟', 'rare', NULL, 14),
('STREAK_30', '👑 Série de 30 jours', 'Un mois entier ! Vous êtes une légende !', '👑', 'epic', NULL, 30),

-- Point milestones
('POINTS_500', '💰 500 Points', 'Vous progressez rapidement !', '💰', 'common', 500, NULL),
('POINTS_1000', '💎 1000 Points', 'Mille points atteints !', '💎', 'rare', 1000, NULL),
('POINTS_5000', '🏆 5000 Points', 'Maître de l\'apprentissage !', '🏆', 'epic', 5000, NULL),
('POINTS_10000', '⭐ 10000 Points', 'Champion absolu !', '⭐', 'legendary', 10000, NULL),

-- Ranking achievements
('TOP_100', '🎖️ Top 100', 'Parmi les 100 meilleurs !', '🎖️', 'rare', NULL, NULL),
('TOP_50', '🥉 Top 50', 'Dans le top 50 !', '🥉', 'rare', NULL, NULL),
('TOP_10', '🥈 Top 10', 'Élite du top 10 !', '🥈', 'epic', NULL, NULL),
('TOP_3', '🥇 Top 3', 'Podium ! Incroyable !', '🥇', 'epic', NULL, NULL),
('RANK_1', '👑 Champion', 'Numéro 1 mondial !', '👑', 'legendary', NULL, NULL),

-- Social achievements
('KUDOS_10', '👏 Apprécié', '10 kudos reçus !', '👏', 'common', NULL, NULL),
('KUDOS_50', '🌟 Populaire', '50 kudos reçus !', '🌟', 'rare', NULL, NULL),
('GENEROUS', '💝 Généreux', '50 kudos donnés !', '💝', 'rare', NULL, NULL),

-- Special achievements
('PERFECTIONIST', '💯 Perfectionniste', '95%+ de réussite sur 50 exercices', '💯', 'epic', NULL, NULL),
('SPEED_DEMON', '💨 Foudre', '100 exercices en une semaine', '💨', 'epic', NULL, NULL),
('EARLY_BIRD', '🐦 Lève-tôt', 'Actif avant 8h du matin', '🐦', 'common', NULL, NULL),
('NIGHT_OWL', '🦉 Noctambule', 'Actif après 22h', '🦉', 'common', NULL, NULL);

-- =============================================================================
-- Create Initial Season
-- =============================================================================

INSERT INTO seasons (name, description, start_at, end_at, is_active) VALUES
('Saison Inaugurale', 'La première saison de compétition !', NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), 1);

-- =============================================================================
-- Initialize Streak Data for Existing Students
-- =============================================================================

INSERT INTO user_streaks (user_id, current_streak, best_streak, last_active_date)
SELECT 
  id,
  FLOOR(RAND() * 10) + 1, -- Random current streak 1-10
  FLOOR(RAND() * 30) + 5, -- Random best streak 5-35
  CASE 
    WHEN RAND() > 0.7 THEN CURDATE()  -- 30% active today
    WHEN RAND() > 0.5 THEN DATE_SUB(CURDATE(), INTERVAL 1 DAY)  -- 20% active yesterday  
    ELSE DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND() * 7) + 2 DAY)  -- 50% active 2-8 days ago
  END
FROM students
WHERE xp > 0;

-- =============================================================================
-- Update XP values for existing students (realistic distribution)
-- =============================================================================

UPDATE students 
SET 
  xp = CASE 
    WHEN RAND() < 0.1 THEN FLOOR(RAND() * 500) + 2000  -- 10% high performers (2000-2500 XP)
    WHEN RAND() < 0.3 THEN FLOOR(RAND() * 800) + 800   -- 20% good performers (800-1600 XP) 
    WHEN RAND() < 0.7 THEN FLOOR(RAND() * 600) + 200   -- 40% average performers (200-800 XP)
    ELSE FLOOR(RAND() * 200) + 50                       -- 30% beginners (50-250 XP)
  END,
  level = FLOOR(POW(GREATEST(xp, 50) / 100, 0.7)) + 1,
  last_xp_at = DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 7) DAY)
WHERE id IN (SELECT * FROM (SELECT id FROM students LIMIT 50) temp);

-- =============================================================================
-- Performance Optimization Views
-- =============================================================================

-- Fast leaderboard view
CREATE VIEW v_leaderboard AS
SELECT 
  s.id,
  s.prenom,
  s.nom,
  s.xp,
  s.level,
  s.mascotteType,
  s.mascotteColor,
  ROW_NUMBER() OVER (ORDER BY s.xp DESC) as rank_position,
  us.current_streak,
  us.best_streak,
  (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = s.id) as badge_count
FROM students s
LEFT JOIN user_streaks us ON s.id = us.user_id
WHERE s.xp > 0
ORDER BY s.xp DESC;

-- Recent activity view  
CREATE VIEW v_recent_activity AS
SELECT 
  xt.user_id,
  s.prenom,
  s.nom,
  xt.reason,
  xt.xp_delta,
  xt.created_at
FROM xp_transactions xt
JOIN students s ON xt.user_id = s.id
ORDER BY xt.created_at DESC
LIMIT 100;

-- =============================================================================
-- Completion Message
-- =============================================================================

SELECT 
  'Gamification system installed successfully!' as message,
  (SELECT COUNT(*) FROM students WHERE xp > 0) as students_with_xp,
  (SELECT COUNT(*) FROM achievements) as total_achievements,
  (SELECT COUNT(*) FROM user_streaks) as students_with_streaks;