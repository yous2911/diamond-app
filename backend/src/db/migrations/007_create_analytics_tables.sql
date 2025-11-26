-- =============================================================================
-- Analytics Tables Migration
-- Creates analytics and tracking tables required by the application
-- Required by: analytics.service.ts, enhanced-database.service.ts, parents.ts
-- =============================================================================

-- Student Competence Progress table (matches schema.ts)
CREATE TABLE IF NOT EXISTS student_competence_progress (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  competence_code VARCHAR(20) NOT NULL,
  progress_percent DECIMAL(5,2) DEFAULT 0.00,
  mastery_level VARCHAR(20) DEFAULT 'not_started',
  current_score DECIMAL(5,2) DEFAULT 0.00,
  total_attempts INT DEFAULT 0,
  successful_attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  
  INDEX idx_competence_progress_student (student_id),
  INDEX idx_competence_progress_competence (competence_code),
  INDEX idx_competence_progress_mastery (mastery_level),
  INDEX idx_competence_progress_student_competence (student_id, competence_code)
);

-- Daily Learning Analytics table (matches schema.ts)
CREATE TABLE IF NOT EXISTS daily_learning_analytics (
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
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_student_date (student_id, date),
  INDEX idx_daily_analytics_student (student_id),
  INDEX idx_daily_analytics_date (date),
  INDEX idx_daily_analytics_student_date (student_id, date)
);

-- Weekly Progress Summary table (matches schema.ts)
CREATE TABLE IF NOT EXISTS weekly_progress_summary (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  week_start DATE NOT NULL,
  total_exercises INT DEFAULT 0,
  completed_exercises INT DEFAULT 0,
  total_time_spent INT DEFAULT 0,
  avg_score DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_student_week (student_id, week_start),
  INDEX idx_weekly_summary_student (student_id),
  INDEX idx_weekly_summary_week (week_start)
);

-- Learning Session Tracking table (matches schema.ts)
CREATE TABLE IF NOT EXISTS learning_session_tracking (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP NULL,
  exercises_completed INT DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0.00,
  focus_time INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  
  INDEX idx_session_tracking_student (student_id),
  INDEX idx_session_tracking_start (session_start),
  INDEX idx_session_tracking_student_start (student_id, session_start)
);

-- Exercise Performance Analytics table (matches schema.ts)
CREATE TABLE IF NOT EXISTS exercise_performance_analytics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  exercise_id INT NOT NULL,
  total_attempts INT DEFAULT 0,
  successful_attempts INT DEFAULT 0,
  avg_completion_time INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_exercise (exercise_id),
  INDEX idx_exercise_analytics_exercise (exercise_id)
);

-- Daily Goals table (matches schema.ts)
CREATE TABLE IF NOT EXISTS daily_goals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  goal_date DATE NOT NULL,
  target_exercises INT DEFAULT 3,
  completed_exercises INT DEFAULT 0,
  goal_met BOOLEAN DEFAULT false,
  study_time_minutes INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_student_goal_date (student_id, goal_date),
  INDEX idx_daily_goals_student (student_id),
  INDEX idx_daily_goals_date (goal_date)
);

-- Spaced Repetition table (matches schema.ts)
CREATE TABLE IF NOT EXISTS spaced_repetition (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  exercise_id INT NOT NULL,
  competence_code VARCHAR(20) NOT NULL,
  
  -- SuperMemo-2 Algorithm parameters
  easiness_factor DECIMAL(3,2) DEFAULT 2.5,
  repetition_number INT DEFAULT 0,
  interval_days INT DEFAULT 1,
  
  -- Scheduling
  next_review_date TIMESTAMP NOT NULL,
  last_review_date TIMESTAMP NULL,
  
  -- Performance tracking
  correct_answers INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  average_response_time INT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority VARCHAR(20) DEFAULT 'normal',
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE,
  
  INDEX idx_spaced_rep_student (student_id),
  INDEX idx_spaced_rep_exercise (exercise_id),
  INDEX idx_spaced_rep_next_review (next_review_date),
  INDEX idx_spaced_rep_student_next (student_id, next_review_date)
);

-- Push Notifications table (matches schema.ts)
CREATE TABLE IF NOT EXISTS push_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  device_token VARCHAR(255) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  
  -- Notification preferences
  streak_reminders BOOLEAN DEFAULT true,
  daily_goal_reminders BOOLEAN DEFAULT true,
  spaced_repetition_reminders BOOLEAN DEFAULT true,
  achievement_notifications BOOLEAN DEFAULT true,
  
  -- Timing preferences
  reminder_time VARCHAR(8) DEFAULT '19:00',
  time_zone VARCHAR(50) DEFAULT 'Europe/Paris',
  
  -- Quiet hours
  quiet_hours_start VARCHAR(8) DEFAULT '22:00',
  quiet_hours_end VARCHAR(8) DEFAULT '08:00',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  
  INDEX idx_push_notifications_student (student_id),
  INDEX idx_push_notifications_device (device_token),
  INDEX idx_push_notifications_platform (platform)
);

