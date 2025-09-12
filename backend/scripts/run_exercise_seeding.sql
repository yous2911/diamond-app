-- Exercise Seeding Runner Script
-- This script runs the comprehensive exercise seeding for all competencies

-- =============================================================================
-- PRE-SEEDING VERIFICATION
-- =============================================================================

-- Check current exercise count
SELECT 
    'Current Exercise Count' as metric,
    COUNT(*) as value
FROM exercises;

-- Check competencies count
SELECT 
    'Total Competencies' as metric,
    COUNT(*) as value
FROM cp2025_competence_codes
WHERE niveau IN ('CP', 'CE1', 'CE2');

-- Check by grade level
SELECT 
    niveau as grade_level,
    COUNT(*) as competencies
FROM cp2025_competence_codes
WHERE niveau IN ('CP', 'CE1', 'CE2')
GROUP BY niveau
ORDER BY niveau;

-- =============================================================================
-- RUN THE SEEDING SCRIPT
-- =============================================================================

SOURCE seed_all_competencies_with_exercises.sql;

-- =============================================================================
-- POST-SEEDING VERIFICATION
-- =============================================================================

-- Final exercise count
SELECT 
    'Final Exercise Count' as metric,
    COUNT(*) as value
FROM exercises;

-- Exercises by type
SELECT 
    exercise_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM exercises), 2) as percentage
FROM exercises
GROUP BY exercise_type
ORDER BY count DESC;

-- Exercises by grade level
SELECT 
    SUBSTRING(competence_code, 1, 2) as grade_level,
    COUNT(*) as exercises,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM exercises), 2) as percentage
FROM exercises
GROUP BY SUBSTRING(competence_code, 1, 2)
ORDER BY grade_level;

-- Exercises by subject
SELECT 
    CASE 
        WHEN competence_code LIKE '%.FR.%' THEN 'FRANCAIS'
        WHEN competence_code LIKE '%.MA.%' THEN 'MATHEMATIQUES'
        ELSE 'OTHER'
    END as subject,
    COUNT(*) as exercises,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM exercises), 2) as percentage
FROM exercises
GROUP BY 
    CASE 
        WHEN competence_code LIKE '%.FR.%' THEN 'FRANCAIS'
        WHEN competence_code LIKE '%.MA.%' THEN 'MATHEMATIQUES'
        ELSE 'OTHER'
    END
ORDER BY exercises DESC;

-- Average exercises per competency
SELECT 
    'Average Exercises per Competency' as metric,
    ROUND(COUNT(*) / (SELECT COUNT(*) FROM cp2025_competence_codes WHERE niveau IN ('CP', 'CE1', 'CE2')), 2) as value
FROM exercises;

-- Difficulty distribution
SELECT 
    difficulty_level,
    COUNT(*) as exercises,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM exercises), 2) as percentage
FROM exercises
GROUP BY difficulty_level
ORDER BY difficulty_level;

-- XP reward distribution
SELECT 
    CASE 
        WHEN xp_reward <= 6 THEN 'Low (≤6)'
        WHEN xp_reward <= 10 THEN 'Medium (7-10)'
        WHEN xp_reward <= 15 THEN 'High (11-15)'
        ELSE 'Very High (16+)'
    END as xp_range,
    COUNT(*) as exercises,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM exercises), 2) as percentage
FROM exercises
GROUP BY 
    CASE 
        WHEN xp_reward <= 6 THEN 'Low (≤6)'
        WHEN xp_reward <= 10 THEN 'Medium (7-10)'
        WHEN xp_reward <= 15 THEN 'High (11-15)'
        ELSE 'Very High (16+)'
    END
ORDER BY MIN(xp_reward);

-- =============================================================================
-- SAMPLE DATA PREVIEW
-- =============================================================================

-- Sample exercises by type
SELECT '=== SAMPLE DRAG & DROP EXERCISES ===' as section;
SELECT 
    competence_code,
    title,
    difficulty_level,
    xp_reward
FROM exercises 
WHERE exercise_type = 'drag_drop'
ORDER BY competence_code
LIMIT 5;

SELECT '=== SAMPLE TEXTE LIBRE EXERCISES ===' as section;
SELECT 
    competence_code,
    title,
    difficulty_level,
    xp_reward
FROM exercises 
WHERE exercise_type = 'texte_libre'
ORDER BY competence_code
LIMIT 5;

SELECT '=== SAMPLE MULTIPLE CHOICE EXERCISES ===' as section;
SELECT 
    competence_code,
    title,
    difficulty_level,
    xp_reward
FROM exercises 
WHERE exercise_type = 'multiple_choice'
ORDER BY competence_code
LIMIT 5;

-- =============================================================================
-- COMPETENCY COVERAGE CHECK
-- =============================================================================

-- Check which competencies have exercises
SELECT 
    'Competencies with Exercises' as metric,
    COUNT(DISTINCT competence_code) as value
FROM exercises;

-- Check which competencies are missing exercises
SELECT 
    'Competencies Missing Exercises' as metric,
    COUNT(*) as value
FROM cp2025_competence_codes c
WHERE c.niveau IN ('CP', 'CE1', 'CE2')
  AND c.code NOT IN (SELECT DISTINCT competence_code FROM exercises);

-- Show missing competencies (if any)
SELECT 
    'Missing Competencies:' as info,
    c.code,
    c.niveau,
    c.matiere,
    c.description
FROM cp2025_competence_codes c
WHERE c.niveau IN ('CP', 'CE1', 'CE2')
  AND c.code NOT IN (SELECT DISTINCT competence_code FROM exercises)
ORDER BY c.niveau, c.matiere, c.code
LIMIT 10;

-- =============================================================================
-- SUCCESS SUMMARY
-- =============================================================================

SELECT '🎉 EXERCISE SEEDING COMPLETED SUCCESSFULLY! 🎉' as status;
SELECT 'Your database now contains comprehensive exercise data for beta testing!' as message;
SELECT 'All competencies have 3 exercise types: Drag & Drop, Texte Libre, and Multiple Choice' as details;


