-- =============================================================================
-- Parent System Tables Migration
-- Creates tables for parent authentication and parent-student relationships
-- Required by: parent-auth.service.ts, parents.ts routes
-- =============================================================================

-- Parents table (matches schema.ts)
CREATE TABLE IF NOT EXISTS parents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  date_naissance DATE,
  profession VARCHAR(100),
  
  -- Account settings
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP NULL,
  
  -- Security
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP NULL,
  last_login TIMESTAMP NULL,
  
  -- Notifications preferences
  daily_report_enabled BOOLEAN DEFAULT true,
  weekly_report_enabled BOOLEAN DEFAULT true,
  achievement_notifications_enabled BOOLEAN DEFAULT true,
  progress_alerts_enabled BOOLEAN DEFAULT true,
  
  -- Communication preferences
  preferred_language VARCHAR(10) DEFAULT 'fr',
  time_zone VARCHAR(50) DEFAULT 'Europe/Paris',
  
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_parents_email (email),
  INDEX idx_parents_email_verified (email_verified),
  INDEX idx_parents_password_reset (password_reset_token, password_reset_expires)
);

-- Parent-Student relationships table (matches schema.ts)
CREATE TABLE IF NOT EXISTS parent_student_relations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  parent_id INT NOT NULL,
  student_id INT NOT NULL,
  relationship_type VARCHAR(50) NOT NULL DEFAULT 'parent',
  is_primary_contact BOOLEAN DEFAULT false,
  can_view_progress BOOLEAN DEFAULT true,
  can_manage_account BOOLEAN DEFAULT true,
  can_receive_reports BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_parent_student (parent_id, student_id),
  INDEX idx_parent_student_parent (parent_id),
  INDEX idx_parent_student_student (student_id),
  INDEX idx_parent_student_relationship (relationship_type)
);

-- Parental Consent table (matches schema.ts)
CREATE TABLE IF NOT EXISTS parental_consent (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  parent_id INT,
  parent_name VARCHAR(200) NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP NULL,
  consent_type VARCHAR(50) NOT NULL DEFAULT 'general',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL,
  
  INDEX idx_parental_consent_student (student_id),
  INDEX idx_parental_consent_parent (parent_id),
  INDEX idx_parental_consent_email (parent_email),
  INDEX idx_parental_consent_given (consent_given)
);

