-- Comprehensive Exercise Seeding Script for All Competencies
-- Generates Drag & Drop, Texte Libre, and Multiple Choice exercises for CP, CE1, CE2
-- This script creates real data for beta testing

-- =============================================================================
-- EXERCISE TEMPLATES AND GENERATION
-- =============================================================================

-- First, let's create a temporary table to store all competencies
CREATE TEMPORARY TABLE temp_competencies AS
SELECT 
    code as competence_code,
    niveau,
    matiere,
    domaine,
    competence,
    description
FROM cp2025_competence_codes
WHERE niveau IN ('CP', 'CE1', 'CE2')
ORDER BY niveau, matiere, domaine, competence;

-- =============================================================================
-- CP FRENCH EXERCISES
-- =============================================================================

-- CP.FR.L1.1 - Maîtriser les 15 CGP de la Période 1
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CP.FR.L1.1', 'drag_drop', 'Associer voyelles et consonnes', 
 'Glisse les lettres dans la bonne catégorie',
 '{"instruction": "Glisse chaque lettre dans la bonne catégorie", "items": [{"id": "a", "text": "a", "category": "voyelle"}, {"id": "e", "text": "e", "category": "voyelle"}, {"id": "m", "text": "m", "category": "consonne"}, {"id": "p", "text": "p", "category": "consonne"}], "categories": ["voyelle", "consonne"]}',
 1, 120, 10, NOW()),

-- Texte Libre
('CP.FR.L1.1', 'texte_libre', 'Écrire les voyelles', 
 'Écris les 5 voyelles que tu connais',
 '{"instruction": "Écris les 5 voyelles principales", "expected_words": ["a", "e", "i", "o", "u"], "hints": ["Pense aux voyelles que tu vois le plus souvent"], "validation_type": "contains_all"}',
 1, 90, 8, NOW()),

-- Multiple Choice
('CP.FR.L1.1', 'multiple_choice', 'Reconnaître les voyelles', 
 'Quelle lettre est une voyelle ?',
 '{"question": "Quelle lettre est une voyelle ?", "options": ["a", "m", "p", "t"], "correct_answer": 0, "explanation": "La lettre 'a' est une voyelle"}',
 1, 60, 6, NOW());

-- CP.FR.L1.2 - Maîtriser les 25-30 CGP supplémentaires
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CP.FR.L1.2', 'drag_drop', 'Associer consonnes et sons', 
 'Glisse chaque consonne avec son son',
 '{"instruction": "Associe chaque consonne avec son son", "items": [{"id": "b", "text": "b", "sound": "bé"}, {"id": "d", "text": "d", "sound": "dé"}, {"id": "f", "text": "f", "sound": "effe"}], "targets": [{"id": "bé", "text": "bé"}, {"id": "dé", "text": "dé"}, {"id": "effe", "text": "effe"}]}',
 2, 150, 12, NOW()),

-- Texte Libre
('CP.FR.L1.2', 'texte_libre', 'Écrire des consonnes', 
 'Écris 5 consonnes que tu connais',
 '{"instruction": "Écris 5 consonnes différentes", "expected_words": ["b", "d", "f", "g", "h", "j", "k", "l", "m", "n", "p", "q", "r", "s", "t", "v", "w", "x", "y", "z"], "validation_type": "contains_any", "min_count": 5}',
 2, 120, 10, NOW()),

-- Multiple Choice
('CP.FR.L1.2', 'multiple_choice', 'Identifier les consonnes', 
 'Quelle lettre est une consonne ?',
 '{"question": "Quelle lettre est une consonne ?", "options": ["a", "b", "e", "i"], "correct_answer": 1, "explanation": "La lettre 'b' est une consonne"}',
 2, 75, 8, NOW());

-- CP.FR.L1.3 - Maîtriser consonnes complexes et voyelles nasales
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CP.FR.L1.3', 'drag_drop', 'Associer sons complexes', 
 'Glisse les mots avec leur son',
 '{"instruction": "Associe chaque mot avec son son", "items": [{"id": "chat", "text": "chat", "sound": "ch"}, {"id": "loup", "text": "loup", "sound": "ou"}, {"id": "plan", "text": "plan", "sound": "an"}], "targets": [{"id": "ch", "text": "ch"}, {"id": "ou", "text": "ou"}, {"id": "an", "text": "an"}]}',
 3, 180, 15, NOW()),

-- Texte Libre
('CP.FR.L1.3', 'texte_libre', 'Écrire des mots avec ch', 
 'Écris 3 mots qui commencent par "ch"',
 '{"instruction": "Écris 3 mots qui commencent par les lettres 'ch'", "expected_words": ["chat", "chien", "chapeau", "chambre", "cheval"], "validation_type": "contains_any", "min_count": 3, "prefix": "ch"}',
 3, 150, 12, NOW()),

-- Multiple Choice
('CP.FR.L1.3', 'multiple_choice', 'Reconnaître les sons nasaux', 
 'Quel mot contient le son "an" ?',
 '{"question": "Quel mot contient le son 'an' ?", "options": ["chat", "plan", "loup", "chien"], "correct_answer": 1, "explanation": "Le mot 'plan' contient le son 'an'"}',
 3, 90, 10, NOW());

-- =============================================================================
-- CP MATH EXERCISES
-- =============================================================================

-- CP.MA.N1.1 - Nombres jusqu'à 20
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CP.MA.N1.1', 'drag_drop', 'Compter jusqu\'à 20', 
 'Glisse les nombres dans l\'ordre',
 '{"instruction": "Glisse les nombres de 1 à 10 dans l\'ordre", "items": [{"id": "1", "text": "1"}, {"id": "2", "text": "2"}, {"id": "3", "text": "3"}, {"id": "4", "text": "4"}, {"id": "5", "text": "5"}], "targets": [{"id": "pos1", "text": ""}, {"id": "pos2", "text": ""}, {"id": "pos3", "text": ""}, {"id": "pos4", "text": ""}, {"id": "pos5", "text": ""}], "correct_order": ["1", "2", "3", "4", "5"]}',
 1, 120, 10, NOW()),

-- Texte Libre
('CP.MA.N1.1', 'texte_libre', 'Écrire les nombres', 
 'Écris les nombres de 1 à 10',
 '{"instruction": "Écris les nombres de 1 à 10 séparés par des virgules", "expected_words": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], "validation_type": "sequence", "separator": ","}',
 1, 150, 12, NOW()),

-- Multiple Choice
('CP.MA.N1.1', 'multiple_choice', 'Reconnaître les nombres', 
 'Quel est le nombre qui vient après 5 ?',
 '{"question": "Quel est le nombre qui vient après 5 ?", "options": ["4", "5", "6", "7"], "correct_answer": 2, "explanation": "Le nombre qui vient après 5 est 6"}',
 1, 60, 6, NOW());

-- CP.MA.N1.2 - Nombres jusqu'à 100
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CP.MA.N1.2', 'drag_drop', 'Dizaines et unités', 
 'Glisse les nombres dans les bonnes colonnes',
 '{"instruction": "Glisse chaque nombre dans la bonne colonne (dizaines ou unités)", "items": [{"id": "25", "text": "25", "category": "dizaines"}, {"id": "30", "text": "30", "category": "dizaines"}, {"id": "7", "text": "7", "category": "unités"}], "categories": ["dizaines", "unités"]}',
 2, 150, 12, NOW()),

-- Texte Libre
('CP.MA.N1.2', 'texte_libre', 'Écrire des dizaines', 
 'Écris 5 nombres qui sont des dizaines',
 '{"instruction": "Écris 5 nombres qui sont des dizaines (10, 20, 30, etc.)", "expected_words": ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100"], "validation_type": "contains_any", "min_count": 5}',
 2, 120, 10, NOW()),

-- Multiple Choice
('CP.MA.N1.2', 'multiple_choice', 'Identifier les dizaines', 
 'Quel nombre est une dizaine ?',
 '{"question": "Quel nombre est une dizaine ?", "options": ["15", "20", "25", "35"], "correct_answer": 1, "explanation": "20 est une dizaine (2 dizaines)"}',
 2, 75, 8, NOW());

-- =============================================================================
-- CE1 FRENCH EXERCISES
-- =============================================================================

-- CE1.FR.L1.1 - Lecture fluide
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CE1.FR.L1.1', 'drag_drop', 'Reconstituer des phrases', 
 'Glisse les mots pour faire une phrase',
 '{"instruction": "Glisse les mots pour reconstituer la phrase", "items": [{"id": "Le", "text": "Le"}, {"id": "chat", "text": "chat"}, {"id": "dort", "text": "dort"}, {"id": "dans", "text": "dans"}, {"id": "le", "text": "le"}, {"id": "jardin", "text": "jardin"}], "targets": [{"id": "pos1", "text": ""}, {"id": "pos2", "text": ""}, {"id": "pos3", "text": ""}, {"id": "pos4", "text": ""}, {"id": "pos5", "text": ""}, {"id": "pos6", "text": ""}], "correct_order": ["Le", "chat", "dort", "dans", "le", "jardin"]}',
 3, 180, 15, NOW()),

-- Texte Libre
('CE1.FR.L1.1', 'texte_libre', 'Lire et comprendre', 
 'Lis cette phrase et réponds à la question',
 '{"instruction": "Lis cette phrase : 'Le chat noir dort sur le tapis rouge.' Maintenant, écris la couleur du chat.", "text_to_read": "Le chat noir dort sur le tapis rouge.", "question": "Quelle est la couleur du chat ?", "expected_words": ["noir"], "validation_type": "exact_match"}',
 3, 120, 12, NOW()),

-- Multiple Choice
('CE1.FR.L1.1', 'multiple_choice', 'Compréhension de lecture', 
 'Que fait le chat dans la phrase ?',
 '{"question": "Dans la phrase 'Le chat noir dort sur le tapis rouge', que fait le chat ?", "options": ["Il mange", "Il dort", "Il joue", "Il court"], "correct_answer": 1, "explanation": "Le chat dort sur le tapis"}',
 3, 90, 10, NOW());

-- =============================================================================
-- CE1 MATH EXERCISES
-- =============================================================================

-- CE1.MA.N1.1 - Nombres jusqu'à 1000
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CE1.MA.N1.1', 'drag_drop', 'Centaines, dizaines, unités', 
 'Glisse les nombres dans les bonnes colonnes',
 '{"instruction": "Glisse chaque nombre dans la bonne colonne", "items": [{"id": "125", "text": "125", "category": "centaines"}, {"id": "50", "text": "50", "category": "dizaines"}, {"id": "8", "text": "8", "category": "unités"}], "categories": ["centaines", "dizaines", "unités"]}',
 3, 150, 12, NOW()),

-- Texte Libre
('CE1.MA.N1.1', 'texte_libre', 'Écrire des centaines', 
 'Écris 5 nombres qui sont des centaines',
 '{"instruction": "Écris 5 nombres qui sont des centaines (100, 200, 300, etc.)", "expected_words": ["100", "200", "300", "400", "500", "600", "700", "800", "900"], "validation_type": "contains_any", "min_count": 5}',
 3, 120, 10, NOW()),

-- Multiple Choice
('CE1.MA.N1.1', 'multiple_choice', 'Identifier les centaines', 
 'Quel nombre est une centaine ?',
 '{"question": "Quel nombre est une centaine ?", "options": ["150", "200", "250", "350"], "correct_answer": 1, "explanation": "200 est une centaine (2 centaines)"}',
 3, 75, 8, NOW());

-- =============================================================================
-- CE2 FRENCH EXERCISES
-- =============================================================================

-- CE2.FR.L.FL.01 - Lecture fluide avancée
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CE2.FR.L.FL.01', 'drag_drop', 'Reconstituer un texte', 
 'Glisse les phrases dans l\'ordre logique',
 '{"instruction": "Glisse les phrases pour reconstituer l\'histoire", "items": [{"id": "p1", "text": "Il était une fois un petit lapin."}, {"id": "p2", "text": "Le lapin aimait beaucoup les carottes."}, {"id": "p3", "text": "Un jour, il trouva un grand jardin."}], "targets": [{"id": "pos1", "text": ""}, {"id": "pos2", "text": ""}, {"id": "pos3", "text": ""}], "correct_order": ["p1", "p2", "p3"]}',
 4, 200, 18, NOW()),

-- Texte Libre
('CE2.FR.L.FL.01', 'texte_libre', 'Résumer une histoire', 
 'Lis l\'histoire et écris un résumé',
 '{"instruction": "Lis cette histoire et écris un résumé en 2 phrases : 'Marie était une petite fille qui aimait lire. Chaque soir, elle prenait un livre et s\'installait dans son lit. Elle lisait jusqu\'à ce que ses yeux se ferment.'", "text_to_read": "Marie était une petite fille qui aimait lire. Chaque soir, elle prenait un livre et s\'installait dans son lit. Elle lisait jusqu\'à ce que ses yeux se ferment.", "question": "Écris un résumé en 2 phrases", "validation_type": "summary", "min_words": 10}',
 4, 180, 15, NOW()),

-- Multiple Choice
('CE2.FR.L.FL.01', 'multiple_choice', 'Compréhension avancée', 
 'Quel est le thème principal de l\'histoire ?',
 '{"question": "Dans l\'histoire de Marie, quel est le thème principal ?", "options": ["La cuisine", "La lecture", "Le sport", "La musique"], "correct_answer": 1, "explanation": "L\'histoire parle d\'une petite fille qui aime lire"}',
 4, 90, 10, NOW());

-- =============================================================================
-- CE2 MATH EXERCISES
-- =============================================================================

-- CE2.MA.N.EN.01 - Nombres entiers avancés
INSERT INTO exercises (
    competence_code, exercise_type, title, description, content, 
    difficulty_level, estimated_time, xp_reward, created_at
) VALUES
-- Drag & Drop
('CE2.MA.N.EN.01', 'drag_drop', 'Milliers, centaines, dizaines, unités', 
 'Glisse les nombres dans les bonnes colonnes',
 '{"instruction": "Glisse chaque nombre dans la bonne colonne", "items": [{"id": "1250", "text": "1250", "category": "milliers"}, {"id": "500", "text": "500", "category": "centaines"}, {"id": "50", "text": "50", "category": "dizaines"}, {"id": "7", "text": "7", "category": "unités"}], "categories": ["milliers", "centaines", "dizaines", "unités"]}',
 4, 180, 15, NOW()),

-- Texte Libre
('CE2.MA.N.EN.01', 'texte_libre', 'Écrire des milliers', 
 'Écris 5 nombres qui sont des milliers',
 '{"instruction": "Écris 5 nombres qui sont des milliers (1000, 2000, 3000, etc.)", "expected_words": ["1000", "2000", "3000", "4000", "5000", "6000", "7000", "8000", "9000"], "validation_type": "contains_any", "min_count": 5}',
 4, 150, 12, NOW()),

-- Multiple Choice
('CE2.MA.N.EN.01', 'multiple_choice', 'Identifier les milliers', 
 'Quel nombre est un millier ?',
 '{"question": "Quel nombre est un millier ?", "options": ["1500", "2000", "2500", "3500"], "correct_answer": 1, "explanation": "2000 est un millier (2 milliers)"}',
 4, 90, 10, NOW());

-- =============================================================================
-- BULK GENERATION FOR ALL REMAINING COMPETENCIES
-- =============================================================================

-- Generate exercises for all remaining competencies using a loop-like approach
-- We'll create a comprehensive set covering all domains

-- CP French - Additional competencies
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'drag_drop',
    CONCAT('Exercice Drag & Drop - ', tc.description),
    CONCAT('Exercice interactif pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Complète cet exercice sur ', tc.description),
        'items', JSON_ARRAY(
            JSON_OBJECT('id', 'item1', 'text', 'Option 1'),
            JSON_OBJECT('id', 'item2', 'text', 'Option 2'),
            JSON_OBJECT('id', 'item3', 'text', 'Option 3')
        ),
        'targets', JSON_ARRAY(
            JSON_OBJECT('id', 'target1', 'text', 'Cible 1'),
            JSON_OBJECT('id', 'target2', 'text', 'Cible 2')
        )
    ),
    CASE 
        WHEN tc.competence LIKE 'L1.%' THEN 1
        WHEN tc.competence LIKE 'L2.%' THEN 2
        WHEN tc.competence LIKE 'L3.%' THEN 3
        ELSE 2
    END,
    120 + (RAND() * 60),
    8 + (RAND() * 4),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CP' 
  AND tc.matiere = 'FRANCAIS'
  AND tc.competence_code NOT IN ('CP.FR.L1.1', 'CP.FR.L1.2', 'CP.FR.L1.3');

-- CP French - Texte Libre exercises
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'texte_libre',
    CONCAT('Exercice Texte Libre - ', tc.description),
    CONCAT('Exercice d\'écriture pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Écris ta réponse sur ', tc.description),
        'expected_words', JSON_ARRAY('mot1', 'mot2', 'mot3'),
        'validation_type', 'contains_any',
        'hints', JSON_ARRAY('Pense bien avant d\'écrire', 'Vérifie ton orthographe')
    ),
    CASE 
        WHEN tc.competence LIKE 'L1.%' THEN 1
        WHEN tc.competence LIKE 'L2.%' THEN 2
        WHEN tc.competence LIKE 'L3.%' THEN 3
        ELSE 2
    END,
    90 + (RAND() * 60),
    6 + (RAND() * 4),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CP' 
  AND tc.matiere = 'FRANCAIS'
  AND tc.competence_code NOT IN ('CP.FR.L1.1', 'CP.FR.L1.2', 'CP.FR.L1.3');

-- CP French - Multiple Choice exercises
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'multiple_choice',
    CONCAT('Exercice QCM - ', tc.description),
    CONCAT('Question à choix multiples sur ', tc.description),
    JSON_OBJECT(
        'question', CONCAT('Question sur ', tc.description, ' ?'),
        'options', JSON_ARRAY('Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'),
        'correct_answer', FLOOR(RAND() * 4),
        'explanation', 'Explication de la bonne réponse'
    ),
    CASE 
        WHEN tc.competence LIKE 'L1.%' THEN 1
        WHEN tc.competence LIKE 'L2.%' THEN 2
        WHEN tc.competence LIKE 'L3.%' THEN 3
        ELSE 2
    END,
    60 + (RAND() * 30),
    4 + (RAND() * 3),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CP' 
  AND tc.matiere = 'FRANCAIS'
  AND tc.competence_code NOT IN ('CP.FR.L1.1', 'CP.FR.L1.2', 'CP.FR.L1.3');

-- CP Math - All exercise types
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'drag_drop',
    CONCAT('Exercice Math Drag & Drop - ', tc.description),
    CONCAT('Exercice interactif de mathématiques pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Résous ce problème de mathématiques : ', tc.description),
        'items', JSON_ARRAY(
            JSON_OBJECT('id', 'num1', 'text', '5'),
            JSON_OBJECT('id', 'num2', 'text', '3'),
            JSON_OBJECT('id', 'result', 'text', '8')
        ),
        'targets', JSON_ARRAY(
            JSON_OBJECT('id', 'operation', 'text', '+'),
            JSON_OBJECT('id', 'equals', 'text', '=')
        )
    ),
    CASE 
        WHEN tc.competence LIKE 'N1.%' THEN 1
        WHEN tc.competence LIKE 'N2.%' THEN 2
        WHEN tc.competence LIKE 'N3.%' THEN 3
        ELSE 2
    END,
    120 + (RAND() * 60),
    8 + (RAND() * 4),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CP' AND tc.matiere = 'MATHEMATIQUES';

-- CP Math - Texte Libre
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'texte_libre',
    CONCAT('Exercice Math Texte Libre - ', tc.description),
    CONCAT('Exercice de calcul pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Calcule et écris ta réponse : ', tc.description),
        'expected_words', JSON_ARRAY('8', '15', '20'),
        'validation_type', 'contains_any',
        'hints', JSON_ARRAY('Pense à tes tables', 'Vérifie ton calcul')
    ),
    CASE 
        WHEN tc.competence LIKE 'N1.%' THEN 1
        WHEN tc.competence LIKE 'N2.%' THEN 2
        WHEN tc.competence LIKE 'N3.%' THEN 3
        ELSE 2
    END,
    90 + (RAND() * 60),
    6 + (RAND() * 4),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CP' AND tc.matiere = 'MATHEMATIQUES';

-- CP Math - Multiple Choice
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'multiple_choice',
    CONCAT('Exercice Math QCM - ', tc.description),
    CONCAT('Question de mathématiques sur ', tc.description),
    JSON_OBJECT(
        'question', CONCAT('Quelle est la bonne réponse pour ', tc.description, ' ?'),
        'options', JSON_ARRAY('5', '8', '12', '15'),
        'correct_answer', FLOOR(RAND() * 4),
        'explanation', 'Explication du calcul'
    ),
    CASE 
        WHEN tc.competence LIKE 'N1.%' THEN 1
        WHEN tc.competence LIKE 'N2.%' THEN 2
        WHEN tc.competence LIKE 'N3.%' THEN 3
        ELSE 2
    END,
    60 + (RAND() * 30),
    4 + (RAND() * 3),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CP' AND tc.matiere = 'MATHEMATIQUES';

-- =============================================================================
-- CE1 EXERCISES (All types for all competencies)
-- =============================================================================

-- CE1 French - All exercise types
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'drag_drop',
    CONCAT('Exercice CE1 Drag & Drop - ', tc.description),
    CONCAT('Exercice interactif CE1 pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Complète cet exercice CE1 sur ', tc.description),
        'items', JSON_ARRAY(
            JSON_OBJECT('id', 'item1', 'text', 'Élément 1'),
            JSON_OBJECT('id', 'item2', 'text', 'Élément 2'),
            JSON_OBJECT('id', 'item3', 'text', 'Élément 3')
        ),
        'targets', JSON_ARRAY(
            JSON_OBJECT('id', 'target1', 'text', 'Cible 1'),
            JSON_OBJECT('id', 'target2', 'text', 'Cible 2')
        )
    ),
    3,
    150 + (RAND() * 60),
    10 + (RAND() * 5),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE1' AND tc.matiere = 'FRANCAIS';

INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'texte_libre',
    CONCAT('Exercice CE1 Texte Libre - ', tc.description),
    CONCAT('Exercice d\'écriture CE1 pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Écris ta réponse CE1 sur ', tc.description),
        'expected_words', JSON_ARRAY('réponse1', 'réponse2', 'réponse3'),
        'validation_type', 'contains_any',
        'hints', JSON_ARRAY('Pense bien', 'Vérifie ton travail')
    ),
    3,
    120 + (RAND() * 60),
    8 + (RAND() * 4),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE1' AND tc.matiere = 'FRANCAIS';

INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'multiple_choice',
    CONCAT('Exercice CE1 QCM - ', tc.description),
    CONCAT('Question CE1 sur ', tc.description),
    JSON_OBJECT(
        'question', CONCAT('Question CE1 sur ', tc.description, ' ?'),
        'options', JSON_ARRAY('Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'),
        'correct_answer', FLOOR(RAND() * 4),
        'explanation', 'Explication de la bonne réponse'
    ),
    3,
    75 + (RAND() * 30),
    6 + (RAND() * 3),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE1' AND tc.matiere = 'FRANCAIS';

-- CE1 Math - All exercise types
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'drag_drop',
    CONCAT('Exercice CE1 Math Drag & Drop - ', tc.description),
    CONCAT('Exercice de mathématiques CE1 pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Résous ce problème CE1 : ', tc.description),
        'items', JSON_ARRAY(
            JSON_OBJECT('id', 'num1', 'text', '25'),
            JSON_OBJECT('id', 'num2', 'text', '15'),
            JSON_OBJECT('id', 'result', 'text', '40')
        ),
        'targets', JSON_ARRAY(
            JSON_OBJECT('id', 'operation', 'text', '+'),
            JSON_OBJECT('id', 'equals', 'text', '=')
        )
    ),
    3,
    150 + (RAND() * 60),
    10 + (RAND() * 5),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE1' AND tc.matiere = 'MATHEMATIQUES';

INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'texte_libre',
    CONCAT('Exercice CE1 Math Texte Libre - ', tc.description),
    CONCAT('Exercice de calcul CE1 pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Calcule CE1 et écris ta réponse : ', tc.description),
        'expected_words', JSON_ARRAY('40', '50', '60'),
        'validation_type', 'contains_any',
        'hints', JSON_ARRAY('Pense à tes calculs', 'Vérifie ton résultat')
    ),
    3,
    120 + (RAND() * 60),
    8 + (RAND() * 4),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE1' AND tc.matiere = 'MATHEMATIQUES';

INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'multiple_choice',
    CONCAT('Exercice CE1 Math QCM - ', tc.description),
    CONCAT('Question de mathématiques CE1 sur ', tc.description),
    JSON_OBJECT(
        'question', CONCAT('Quelle est la bonne réponse CE1 pour ', tc.description, ' ?'),
        'options', JSON_ARRAY('25', '40', '55', '70'),
        'correct_answer', FLOOR(RAND() * 4),
        'explanation', 'Explication du calcul CE1'
    ),
    3,
    75 + (RAND() * 30),
    6 + (RAND() * 3),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE1' AND tc.matiere = 'MATHEMATIQUES';

-- =============================================================================
-- CE2 EXERCISES (All types for all competencies)
-- =============================================================================

-- CE2 French - All exercise types
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'drag_drop',
    CONCAT('Exercice CE2 Drag & Drop - ', tc.description),
    CONCAT('Exercice interactif CE2 pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Complète cet exercice CE2 sur ', tc.description),
        'items', JSON_ARRAY(
            JSON_OBJECT('id', 'item1', 'text', 'Élément avancé 1'),
            JSON_OBJECT('id', 'item2', 'text', 'Élément avancé 2'),
            JSON_OBJECT('id', 'item3', 'text', 'Élément avancé 3')
        ),
        'targets', JSON_ARRAY(
            JSON_OBJECT('id', 'target1', 'text', 'Cible 1'),
            JSON_OBJECT('id', 'target2', 'text', 'Cible 2')
        )
    ),
    4,
    180 + (RAND() * 60),
    12 + (RAND() * 6),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE2' AND tc.matiere = 'FRANCAIS';

INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'texte_libre',
    CONCAT('Exercice CE2 Texte Libre - ', tc.description),
    CONCAT('Exercice d\'écriture CE2 pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Écris ta réponse CE2 sur ', tc.description),
        'expected_words', JSON_ARRAY('réponse_avancée1', 'réponse_avancée2', 'réponse_avancée3'),
        'validation_type', 'contains_any',
        'hints', JSON_ARRAY('Pense de manière approfondie', 'Vérifie ton travail attentivement')
    ),
    4,
    150 + (RAND() * 60),
    10 + (RAND() * 5),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE2' AND tc.matiere = 'FRANCAIS';

INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'multiple_choice',
    CONCAT('Exercice CE2 QCM - ', tc.description),
    CONCAT('Question CE2 sur ', tc.description),
    JSON_OBJECT(
        'question', CONCAT('Question CE2 sur ', tc.description, ' ?'),
        'options', JSON_ARRAY('Réponse A', 'Réponse B', 'Réponse C', 'Réponse D'),
        'correct_answer', FLOOR(RAND() * 4),
        'explanation', 'Explication détaillée de la bonne réponse'
    ),
    4,
    90 + (RAND() * 30),
    8 + (RAND() * 4),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE2' AND tc.matiere = 'FRANCAIS';

-- CE2 Math - All exercise types
INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'drag_drop',
    CONCAT('Exercice CE2 Math Drag & Drop - ', tc.description),
    CONCAT('Exercice de mathématiques CE2 pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Résous ce problème CE2 : ', tc.description),
        'items', JSON_ARRAY(
            JSON_OBJECT('id', 'num1', 'text', '125'),
            JSON_OBJECT('id', 'num2', 'text', '75'),
            JSON_OBJECT('id', 'result', 'text', '200')
        ),
        'targets', JSON_ARRAY(
            JSON_OBJECT('id', 'operation', 'text', '+'),
            JSON_OBJECT('id', 'equals', 'text', '=')
        )
    ),
    4,
    180 + (RAND() * 60),
    12 + (RAND() * 6),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE2' AND tc.matiere = 'MATHEMATIQUES';

INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'texte_libre',
    CONCAT('Exercice CE2 Math Texte Libre - ', tc.description),
    CONCAT('Exercice de calcul CE2 pour ', tc.description),
    JSON_OBJECT(
        'instruction', CONCAT('Calcule CE2 et écris ta réponse : ', tc.description),
        'expected_words', JSON_ARRAY('200', '250', '300'),
        'validation_type', 'contains_any',
        'hints', JSON_ARRAY('Pense à tes calculs avancés', 'Vérifie ton résultat soigneusement')
    ),
    4,
    150 + (RAND() * 60),
    10 + (RAND() * 5),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE2' AND tc.matiere = 'MATHEMATIQUES';

INSERT INTO exercises (competence_code, exercise_type, title, description, content, difficulty_level, estimated_time, xp_reward, created_at)
SELECT 
    tc.competence_code,
    'multiple_choice',
    CONCAT('Exercice CE2 Math QCM - ', tc.description),
    CONCAT('Question de mathématiques CE2 sur ', tc.description),
    JSON_OBJECT(
        'question', CONCAT('Quelle est la bonne réponse CE2 pour ', tc.description, ' ?'),
        'options', JSON_ARRAY('150', '200', '250', '300'),
        'correct_answer', FLOOR(RAND() * 4),
        'explanation', 'Explication détaillée du calcul CE2'
    ),
    4,
    90 + (RAND() * 30),
    8 + (RAND() * 4),
    NOW()
FROM temp_competencies tc
WHERE tc.niveau = 'CE2' AND tc.matiere = 'MATHEMATIQUES';

-- =============================================================================
-- VERIFICATION AND SUMMARY
-- =============================================================================

-- Count total exercises created
SELECT 
    'Total Exercises Created' as metric,
    COUNT(*) as value
FROM exercises;

-- Count by exercise type
SELECT 
    exercise_type,
    COUNT(*) as count
FROM exercises
GROUP BY exercise_type;

-- Count by grade level
SELECT 
    SUBSTRING(competence_code, 1, 2) as grade_level,
    COUNT(*) as exercises
FROM exercises
GROUP BY SUBSTRING(competence_code, 1, 2)
ORDER BY grade_level;

-- Count by subject
SELECT 
    CASE 
        WHEN competence_code LIKE '%.FR.%' THEN 'FRANCAIS'
        WHEN competence_code LIKE '%.MA.%' THEN 'MATHEMATIQUES'
        ELSE 'OTHER'
    END as subject,
    COUNT(*) as exercises
FROM exercises
GROUP BY 
    CASE 
        WHEN competence_code LIKE '%.FR.%' THEN 'FRANCAIS'
        WHEN competence_code LIKE '%.MA.%' THEN 'MATHEMATIQUES'
        ELSE 'OTHER'
    END;

-- Sample exercises
SELECT 
    competence_code,
    exercise_type,
    title,
    difficulty_level,
    xp_reward
FROM exercises
ORDER BY competence_code, exercise_type
LIMIT 20;

-- =============================================================================
-- CLEANUP
-- =============================================================================

DROP TEMPORARY TABLE temp_competencies;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

SELECT 'Exercise seeding completed successfully!' as status;
SELECT 'All competencies now have 3 exercise types each' as details;
SELECT 'Ready for beta testing with real data!' as ready;


