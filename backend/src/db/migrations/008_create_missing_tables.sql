-- =============================================================================
-- Missing Tables Migration
-- Creates tables that exist in schema.ts but were missing from previous migrations
-- Required for: Leaderboard, Competitions, Badges, Prerequisites, Consent systems
-- =============================================================================

-- =============================================================================
-- LEADERBOARD SYSTEM TABLES
-- =============================================================================

-- Main leaderboards table (matches schema.ts)
CREATE TABLE IF NOT EXISTS leaderboards (
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

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

  INDEX idx_leaderboards_student (student_id),
  INDEX idx_leaderboards_type (type),
  INDEX idx_leaderboards_category (category),
  INDEX idx_leaderboards_rank (type, category, rank),
  INDEX idx_leaderboards_period (period),
  INDEX idx_leaderboards_class (class_id),
  INDEX idx_leaderboards_last_updated (last_updated)
);

-- Leaderboard history for tracking rank changes over time (matches schema.ts)
CREATE TABLE IF NOT EXISTS leaderboard_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  leaderboard_type VARCHAR(50) NOT NULL,
  rank INT NOT NULL,
  score INT NOT NULL,
  period VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

  INDEX idx_leaderboard_history_student (student_id),
  INDEX idx_leaderboard_history_type (leaderboard_type),
  INDEX idx_leaderboard_history_period (period),
  INDEX idx_leaderboard_history_recorded (recorded_at),
  INDEX idx_leaderboard_history_student_type (student_id, leaderboard_type)
);

-- =============================================================================
-- BADGE SYSTEM TABLE
-- =============================================================================

-- Student badges for achievements and milestones (matches schema.ts)
CREATE TABLE IF NOT EXISTS student_badges (
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

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

  INDEX idx_student_badges_student (student_id),
  INDEX idx_student_badges_type (badge_type),
  INDEX idx_student_badges_rarity (rarity),
  INDEX idx_student_badges_earned (earned_at),
  INDEX idx_student_badges_valid (valid_until)
);

-- =============================================================================
-- COMPETITION SYSTEM TABLES
-- =============================================================================

-- Competitions for time-limited challenges (matches schema.ts)
CREATE TABLE IF NOT EXISTS competitions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  rules JSON,
  rewards JSON,
  is_active BOOLEAN DEFAULT true,
  participants INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_competitions_type (type),
  INDEX idx_competitions_active (is_active),
  INDEX idx_competitions_dates (start_date, end_date),
  INDEX idx_competitions_created (created_at)
);

-- Competition participants tracking (matches schema.ts)
CREATE TABLE IF NOT EXISTS competition_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  competition_id INT NOT NULL,
  student_id INT NOT NULL,
  score INT DEFAULT 0,
  rank INT,
  progress JSON,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

  UNIQUE KEY unique_competition_student (competition_id, student_id),
  INDEX idx_competition_participants_competition (competition_id),
  INDEX idx_competition_participants_student (student_id),
  INDEX idx_competition_participants_rank (competition_id, rank),
  INDEX idx_competition_participants_score (competition_id, score DESC),
  INDEX idx_competition_participants_joined (joined_at),
  INDEX idx_competition_participants_activity (last_activity)
);

-- =============================================================================
-- COMPETENCE PREREQUISITES TABLE
-- =============================================================================

-- Competence prerequisites for learning path management (matches schema.ts)
CREATE TABLE IF NOT EXISTS competence_prerequisites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  competence_code VARCHAR(20) NOT NULL,
  prerequisite_code VARCHAR(20) NOT NULL,
  required BOOLEAN DEFAULT true,
  minimum_level VARCHAR(20) DEFAULT 'decouverte',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_competence_prerequisite (competence_code, prerequisite_code),
  INDEX idx_competence_prereq_competence (competence_code),
  INDEX idx_competence_prereq_prerequisite (prerequisite_code),
  INDEX idx_competence_prereq_required (required)
);

-- =============================================================================
-- CONSENT PREFERENCES TABLE
-- =============================================================================

-- Consent preferences for GDPR compliance (matches schema.ts)
CREATE TABLE IF NOT EXISTS consent_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,

  INDEX idx_consent_preferences_student (student_id),
  INDEX idx_consent_preferences_type (consent_type),
  INDEX idx_consent_preferences_granted (granted),
  INDEX idx_consent_preferences_student_type (student_id, consent_type)
);

-- =============================================================================
-- STREAK FREEZES TABLE
-- =============================================================================

-- Streak freezes usage log for tracking when students use streak protection (matches schema.ts)
CREATE TABLE IF NOT EXISTS streak_freezes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  protected_streak INT NOT NULL,
  reason VARCHAR(50) DEFAULT 'manual_use',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

  INDEX idx_streak_freezes_student (student_id),
  INDEX idx_streak_freezes_used (used_at),
  INDEX idx_streak_freezes_student_used (student_id, used_at)
);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT
  'Missing tables migration completed successfully!' as message,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN (
    'leaderboards', 'leaderboard_history', 'student_badges',
    'competitions', 'competition_participants', 'competence_prerequisites',
    'consent_preferences', 'streak_freezes'
  )) as tables_created;
