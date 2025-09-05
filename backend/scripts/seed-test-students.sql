-- Seed Test Students with Authentication Data
-- This script creates 5 test students with proper authentication setup

-- The bcrypt hash for "password123" with salt rounds 12
SET @password_hash = '$2b$12$LQv3c1yqBWVHxkd0LQ7xceoxGzgWyxJ3YAmGtcfLo5OiJpWKtO/L2';

-- Clear existing test students (optional - remove if you want to keep existing data)
-- DELETE FROM students WHERE email LIKE '%@test.com';

-- Insert test students
INSERT INTO students (
    prenom, 
    nom, 
    email, 
    passwordHash, 
    dateNaissance, 
    niveauActuel, 
    niveauScolaire, 
    totalPoints, 
    xp, 
    serieJours, 
    mascotteType, 
    mascotteColor,
    estConnecte,
    failedLoginAttempts,
    createdAt,
    updatedAt
) VALUES 
(
    'Emma', 
    'Martin', 
    'emma.martin@test.com', 
    @password_hash, 
    '2017-03-15', 
    'CP', 
    'CP', 
    150, 
    150, 
    3, 
    'dragon', 
    '#ff6b35',
    false,
    0,
    NOW(),
    NOW()
),
(
    'Lucas', 
    'Dubois', 
    'lucas.dubois@test.com', 
    @password_hash, 
    '2017-07-22', 
    'CP', 
    'CP', 
    200, 
    200, 
    5, 
    'phoenix', 
    '#4ecdc4',
    false,
    0,
    NOW(),
    NOW()
),
(
    'Léa', 
    'Bernard', 
    'lea.bernard@test.com', 
    @password_hash, 
    '2017-11-08', 
    'CP', 
    'CP', 
    100, 
    100, 
    1, 
    'unicorn', 
    '#ff9ff3',
    false,
    0,
    NOW(),
    NOW()
),
(
    'Noah', 
    'Garcia', 
    'noah.garcia@test.com', 
    @password_hash, 
    '2016-05-12', 
    'CE1', 
    'CE1', 
    300, 
    300, 
    7, 
    'dragon', 
    '#54a0ff',
    false,
    0,
    NOW(),
    NOW()
),
(
    'Alice', 
    'Rodriguez', 
    'alice.rodriguez@test.com', 
    @password_hash, 
    '2016-09-30', 
    'CE1', 
    'CE1', 
    250, 
    250, 
    4, 
    'phoenix', 
    '#5f27cd',
    false,
    0,
    NOW(),
    NOW()
);

-- Verify the insertions
SELECT 
    id,
    prenom,
    nom,
    email,
    niveauActuel,
    totalPoints,
    xp,
    serieJours,
    mascotteType,
    mascotteColor
FROM students 
WHERE email LIKE '%@test.com'
ORDER BY niveauActuel, prenom;
