-- Migration to add a role column to the students table for RBAC

-- Add the 'role' column with an ENUM type for allowed roles
-- The default role for any new user will be 'student'
ALTER TABLE `students` ADD COLUMN `role` ENUM('student', 'admin') NOT NULL DEFAULT 'student';

-- Set the role for existing admin/teacher accounts
-- This moves the authorization logic from a hardcoded list in the code to the database
UPDATE `students` SET `role` = 'admin' WHERE `email` IN ('admin@revedkids.com', 'teacher@revedkids.com');
