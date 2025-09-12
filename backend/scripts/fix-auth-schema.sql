-- Fix Authentication Schema Mismatch
-- Add missing fields to students table for proper authentication functionality

USE reved_kids;

-- Add missing fields for authentication and gamification
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255) DEFAULT NULL;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP NULL;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS dernier_acces TIMESTAMP NULL;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS est_connecte BOOLEAN DEFAULT FALSE;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS mascotte_color VARCHAR(20) DEFAULT '#ff6b35';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_xp ON students(xp DESC);
CREATE INDEX IF NOT EXISTS idx_students_failed_attempts ON students(failed_login_attempts);
CREATE INDEX IF NOT EXISTS idx_students_locked_until ON students(locked_until);
CREATE INDEX IF NOT EXISTS idx_students_dernier_acces ON students(dernier_acces);

-- Update existing students with default values for new fields
UPDATE students 
SET 
    xp = COALESCE(xp, 0),
    failed_login_attempts = COALESCE(failed_login_attempts, 0),
    est_connecte = COALESCE(est_connecte, FALSE),
    mascotte_color = COALESCE(mascotte_color, '#ff6b35')
WHERE 
    xp IS NULL 
    OR failed_login_attempts IS NULL 
    OR est_connecte IS NULL 
    OR mascotte_color IS NULL;

-- Verify the schema update


at DESCRIBE students;
