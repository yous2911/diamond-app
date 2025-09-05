-- Update Students Table Schema
-- Add missing columns for authentication and gamification

-- Add passwordHash column if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS passwordHash VARCHAR(255) DEFAULT NULL;

-- Add email column if it doesn't exist  
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE DEFAULT NULL;

-- Add xp column if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;

-- Add other missing columns for full functionality
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS failedLoginAttempts INT DEFAULT 0;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS lockedUntil TIMESTAMP NULL;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS passwordResetToken VARCHAR(255) DEFAULT NULL;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS passwordResetExpires TIMESTAMP NULL;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- Create index on xp for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_students_xp ON students(xp DESC);
