-- Complete CE1 2025 Setup Script
-- This script sets up all CE1 competencies and prerequisites

-- =============================================================================
-- SETUP CE1 2025 COMPETENCIES AND PREREQUISITES
-- =============================================================================

-- Run the French competencies
SOURCE add_ce1_competencies.sql;

-- Run the Math competencies  
SOURCE add_ce1_math_competencies.sql;

-- Run the French prerequisites
SOURCE add_ce1_prerequisites.sql;

-- Run the Math prerequisites
SOURCE add_ce1_math_prerequisites.sql;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Count total CE1 competencies
SELECT 
    'Total CE1 Competencies' as metric,
    COUNT(*) as value
FROM cp2025_competence_codes 
WHERE niveau = 'CE1';

-- Count by subject
SELECT 
    matiere as subject,
    COUNT(*) as competencies
FROM cp2025_competence_codes 
WHERE niveau = 'CE1'
GROUP BY matiere;

-- Count by domain
SELECT 
    matiere as subject,
    domaine as domain,
    COUNT(*) as competencies
FROM cp2025_competence_codes 
WHERE niveau = 'CE1'
GROUP BY matiere, domaine
ORDER BY matiere, domaine;

-- Count total prerequisites
SELECT 
    'Total CE1 Prerequisites' as metric,
    COUNT(*) as value
FROM competence_prerequisites 
WHERE competence_code LIKE 'CE1.%';

-- Count prerequisites by type
SELECT 
    prerequisite_type as type,
    COUNT(*) as count
FROM competence_prerequisites 
WHERE competence_code LIKE 'CE1.%'
GROUP BY prerequisite_type;

-- Show sample prerequisites
SELECT 
    competence_code,
    prerequisite_code,
    prerequisite_type,
    mastery_threshold,
    weight,
    description
FROM competence_prerequisites 
WHERE competence_code LIKE 'CE1.%'
LIMIT 10;

-- =============================================================================
-- SUMMARY
-- =============================================================================

SELECT 'CE1 2025 Setup Complete!' as status;
SELECT 'French: 50 competencies' as french;
SELECT 'Math: 65 competencies' as math;
SELECT 'Total: 115 competencies' as total;
SELECT 'Prerequisites: Mapped CP to CE1' as prerequisites;

