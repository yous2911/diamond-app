-- Database setup script for DIAMOND-APP
-- Run this in MySQL as root user

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS reved_kids CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user and grant privileges  
-- (Replace password if needed)
CREATE USER IF NOT EXISTS 'reved_admin'@'localhost' IDENTIFIED BY 'thisisREALLYIT29!';
GRANT ALL PRIVILEGES ON reved_kids.* TO 'reved_admin'@'localhost';

-- Also grant to root user in case that's what we're using
ALTER USER 'root'@'localhost' IDENTIFIED BY 'thisisREALLYIT29!';
GRANT ALL PRIVILEGES ON reved_kids.* TO 'root'@'localhost';

FLUSH PRIVILEGES;

-- Show the result
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'reved_admin');
SHOW DATABASES LIKE 'reved_kids';