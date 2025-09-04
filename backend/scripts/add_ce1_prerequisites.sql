-- Add CE1 2025 Prerequisites Mapping
-- This script maps CP competencies as prerequisites for CE1 competencies

-- =============================================================================
-- FRENCH CE1 PREREQUISITES
-- =============================================================================

-- LECTURE ET DÉCODAGE (L1) - Requires complete CP reading mastery
INSERT INTO competence_prerequisites (competence_code, prerequisite_code, prerequisite_type, mastery_threshold, weight, description) VALUES
-- CE1.FR.L1.1 requires complete CP reading foundation
('CE1.FR.L1.1', 'CP.FR.L1.1', 'required', 85, 3.0, 'Reconnaissance phonèmes CP requise pour identification mots aisée'),
('CE1.FR.L1.1', 'CP.FR.L1.2', 'required', 80, 2.5, 'Sons simples CP requis pour lecture fluide'),
('CE1.FR.L1.1', 'CP.FR.L1.3', 'required', 80, 2.5, 'Sons complexes CP requis pour mots difficiles'),
('CE1.FR.L1.1', 'CP.FR.L1.4', 'required', 85, 3.0, 'Graphèmes complexes CP requis pour automatisation'),
('CE1.FR.L1.1', 'CP.FR.L1.5', 'required', 80, 2.0, 'Mots fréquents CP requis pour fluidité'),
('CE1.FR.L1.1', 'CP.FR.L1.6', 'required', 85, 3.0, 'Lecture mots nouveaux CP requise pour extension'),

-- CE1.FR.L1.2 requires CP reading + grammar
('CE1.FR.L1.2', 'CP.FR.L1.1', 'required', 80, 2.5, 'Reconnaissance phonèmes requise pour lettres muettes'),
('CE1.FR.L1.2', 'CP.FR.G1.1', 'required', 75, 2.0, 'Catégories grammaticales CP requises pour lettres muettes'),

-- CE1.FR.L1.3 requires CP sound discrimination
('CE1.FR.L1.3', 'CP.FR.L1.1', 'required', 85, 3.0, 'Discrimination phonèmes CP requise pour sons proches'),
('CE1.FR.L1.3', 'CP.FR.L1.3', 'required', 80, 2.5, 'Sons complexes CP requis pour distinction fine'),

-- CE1.FR.L1.4 requires CP syllable work
('CE1.FR.L1.4', 'CP.FR.L2.1', 'required', 85, 3.0, 'Construction syllabique CP requise pour mots complexes'),
('CE1.FR.L1.4', 'CP.FR.L2.3', 'required', 80, 2.5, 'Syllabation CP requise pour assemblage avancé'),

-- CE1.FR.L1.5 requires CP vocabulary
('CE1.FR.L1.5', 'CP.FR.L1.5', 'required', 80, 2.0, 'Mots fréquents CP requis pour mémorisation étendue'),

-- CE1.FR.L1.6 requires complete CP reading mastery
('CE1.FR.L1.6', 'CP.FR.L1.1', 'required', 85, 3.0, 'Maîtrise complète lecture CP requise pour mots difficiles'),
('CE1.FR.L1.6', 'CP.FR.L1.4', 'required', 85, 3.0, 'Graphèmes complexes CP requis pour déchiffrage avancé'),

-- LECTURE FLUENTE (L2) - Requires CP reading + comprehension
('CE1.FR.L2.1', 'CP.FR.L3.4', 'required', 80, 2.5, 'Compréhension ponctuation CP requise pour lecture expressive'),
('CE1.FR.L2.1', 'CP.FR.L1.6', 'required', 85, 3.0, 'Lecture fluente CP requise pour ponctuation'),

('CE1.FR.L2.2', 'CP.FR.C1.4', 'required', 80, 2.5, 'Compréhension CP requise pour intonation'),
('CE1.FR.L2.2', 'CP.FR.L2.1', 'required', 85, 3.0, 'Construction syllabique CP requise pour fluidité'),

('CE1.FR.L2.3', 'CP.FR.L1.6', 'required', 85, 3.0, 'Lecture mots nouveaux CP requise pour fluidité'),
('CE1.FR.L2.3', 'CP.FR.L2.3', 'required', 80, 2.5, 'Syllabation CP requise pour automatisation'),

('CE1.FR.L2.4', 'CP.FR.C1.4', 'required', 80, 2.5, 'Compréhension CP requise pour interprétation'),
('CE1.FR.L2.4', 'CP.FR.L3.4', 'required', 75, 2.0, 'Ponctuation CP requise pour expression'),

-- TYPES DE TEXTES (L3) - Requires CP reading foundation
('CE1.FR.L3.1', 'CP.FR.L1.6', 'required', 80, 2.5, 'Lecture CP requise pour écrits scolaires'),
('CE1.FR.L3.2', 'CP.FR.L1.6', 'required', 80, 2.5, 'Lecture CP requise pour écrits fonctionnels'),
('CE1.FR.L3.3', 'CP.FR.C1.4', 'required', 80, 2.5, 'Compréhension CP requise pour fiction'),
('CE1.FR.L3.4', 'CP.FR.C1.4', 'required', 80, 2.5, 'Compréhension CP requise pour documentaires'),

-- COMPRÉHENSION ÉCRITE (C1) - Requires complete CP comprehension
('CE1.FR.C1.1', 'CP.FR.C1.1', 'required', 85, 3.0, 'Compréhension de base CP requise pour contrôle'),
('CE1.FR.C1.1', 'CP.FR.C1.4', 'required', 80, 2.5, 'Reformulation CP requise pour vérification'),

('CE1.FR.C1.2', 'CP.FR.C1.2', 'required', 80, 2.5, 'Mobilisation connaissances CP requise'),
('CE1.FR.C1.3', 'CP.FR.C1.3', 'required', 80, 2.5, 'Repérage informations CP requis'),
('CE1.FR.C1.4', 'CP.FR.C1.4', 'required', 85, 3.0, 'Reformulation CP requise pour extension'),
('CE1.FR.C1.5', 'CP.FR.C1.5', 'required', 80, 2.5, 'Caractéristiques textes CP requises'),
('CE1.FR.C1.6', 'CP.FR.C1.6', 'required', 80, 2.5, 'Genres variés CP requis'),

-- COMPRÉHENSION ORALE (C2) - Requires CP oral comprehension
('CE1.FR.C2.1', 'CP.FR.C2.1', 'required', 80, 2.5, 'Écoute CP requise pour messages oraux'),
('CE1.FR.C2.2', 'CP.FR.C2.2', 'required', 80, 2.5, 'Écoute textes CP requise'),
('CE1.FR.C2.3', 'CP.FR.C2.3', 'required', 80, 2.5, 'Repérage oral CP requis'),
('CE1.FR.C2.4', 'CP.FR.C2.4', 'required', 80, 2.5, 'Reformulation orale CP requise'),

-- ÉCRITURE TECHNIQUE (E1) - Requires complete CP writing
('CE1.FR.E1.1', 'CP.FR.E1.1', 'required', 85, 3.0, 'Copie CP requise pour phrases et textes'),
('CE1.FR.E1.2', 'CP.FR.E1.2', 'required', 80, 2.5, 'Copie mots CP requise pour mémorisation'),
('CE1.FR.E1.3', 'CP.FR.E1.3', 'required', 80, 2.5, 'Mise en page CP requise'),
('CE1.FR.E1.4', 'CP.FR.E1.4', 'required', 85, 3.0, 'Geste écriture CP requis pour cursive'),
('CE1.FR.E1.5', 'CP.FR.E1.4', 'required', 80, 2.5, 'Geste écriture CP requis pour endurance'),

-- PRODUCTION ÉCRITE (E2) - Requires CP writing + grammar
('CE1.FR.E2.1', 'CP.FR.E2.1', 'required', 80, 2.5, 'Production écrite CP requise pour textes courts'),
('CE1.FR.E2.2', 'CP.FR.E2.2', 'required', 80, 2.5, 'Types de textes CP requis'),
('CE1.FR.E2.3', 'CP.FR.E2.3', 'required', 75, 2.0, 'Organisation CP requise pour rédaction'),
('CE1.FR.E2.4', 'CP.FR.E3.1', 'required', 75, 2.0, 'Révision CP requise pour outils'),
('CE1.FR.E2.5', 'CP.FR.E3.2', 'required', 80, 2.5, 'Production guidée CP requise pour textes longs'),

-- RÉVISION ET AMÉLIORATION (E3) - Requires CP revision skills
('CE1.FR.E3.1', 'CP.FR.E3.1', 'required', 80, 2.5, 'Révision CP requise pour amélioration'),
('CE1.FR.E3.2', 'CP.FR.E3.2', 'required', 80, 2.5, 'Réécriture CP requise pour modifications'),
('CE1.FR.E3.3', 'CP.FR.G1.1', 'required', 75, 2.0, 'Catégories grammaticales CP requises pour pronoms'),
('CE1.FR.E3.4', 'CP.FR.L3.4', 'required', 75, 2.0, 'Ponctuation CP requise pour relecture'),

-- GRAMMAIRE (G1) - Requires CP grammar foundation
('CE1.FR.G1.1', 'CP.FR.G1.1', 'required', 85, 3.0, 'Catégories grammaticales CP requises pour analyse phrase'),
('CE1.FR.G1.2', 'CP.FR.G1.1', 'required', 80, 2.5, 'Catégories grammaticales CP requises pour différenciation'),
('CE1.FR.G1.3', 'CP.FR.G1.2', 'required', 80, 2.5, 'Groupes de mots CP requis pour groupe nominal'),
('CE1.FR.G1.4', 'CP.FR.G1.3', 'required', 80, 2.5, 'Types de phrases CP requis'),
('CE1.FR.G1.5', 'CP.FR.G1.3', 'required', 75, 2.0, 'Types de phrases CP requis pour formes'),
('CE1.FR.G1.6', 'CP.FR.G1.1', 'required', 75, 2.0, 'Vocabulaire grammatical CP requis'),

-- ORTHOGRAPHE (G2) - Requires complete CP spelling
('CE1.FR.G2.1', 'CP.FR.G2.1', 'required', 85, 3.0, 'Correspondances phonème-graphème CP requises'),
('CE1.FR.G2.2', 'CP.FR.G2.2', 'required', 80, 2.5, 'Transcription CP requise'),
('CE1.FR.G2.3', 'CP.FR.G2.3', 'required', 80, 2.5, 'Orthographe grammaticale CP requise'),
('CE1.FR.G2.4', 'CP.FR.G2.4', 'required', 80, 2.5, 'Accords CP requis pour groupe nominal'),
('CE1.FR.G2.5', 'CP.FR.G2.4', 'required', 80, 2.5, 'Accords CP requis pour sujet-verbe'),
('CE1.FR.G2.6', 'CP.FR.G2.4', 'required', 80, 2.5, 'Accords CP requis pour singulier-pluriel'),

-- VOCABULAIRE (G3) - Requires CP vocabulary foundation
('CE1.FR.G3.1', 'CP.FR.G1.1', 'required', 75, 2.0, 'Vocabulaire CP requis pour enrichissement'),
('CE1.FR.G3.2', 'CP.FR.G2.2', 'required', 80, 2.5, 'Orthographe lexicale CP requise'),
('CE1.FR.G3.3', 'CP.FR.G1.1', 'required', 75, 2.0, 'Registres de langue CP requis'),
('CE1.FR.G3.4', 'CP.FR.L1.6', 'required', 75, 2.0, 'Lecture CP requise pour dictionnaire'),
('CE1.FR.G3.5', 'CP.FR.G1.1', 'required', 75, 2.0, 'Relations entre mots CP requises'),
('CE1.FR.G3.6', 'CP.FR.G1.1', 'required', 75, 2.0, 'Mots de liaison CP requis'),
('CE1.FR.G3.7', 'CP.FR.C1.4', 'required', 75, 2.0, 'Compréhension CP requise pour expressions'),
('CE1.FR.G3.8', 'CP.FR.G1.1', 'required', 75, 2.0, 'Vocabulaire technique CP requis'),

-- CONJUGAISON (G4) - NEW in CE1, requires CP grammar foundation
('CE1.FR.G4.1', 'CP.FR.G1.1', 'required', 80, 2.5, 'Catégories grammaticales CP requises pour conjugaison'),
('CE1.FR.G4.2', 'CP.FR.G1.1', 'required', 80, 2.5, 'Catégories grammaticales CP requises pour verbes -er'),
('CE1.FR.G4.3', 'CP.FR.G1.1', 'required', 80, 2.5, 'Catégories grammaticales CP requises pour verbes -ir'),
('CE1.FR.G4.4', 'CP.FR.G1.1', 'required', 80, 2.5, 'Catégories grammaticales CP requises pour verbes -re'),
('CE1.FR.G4.5', 'CP.FR.G1.1', 'required', 80, 2.5, 'Catégories grammaticales CP requises pour passé composé'),
('CE1.FR.G4.6', 'CP.FR.G1.1', 'required', 80, 2.5, 'Catégories grammaticales CP requises pour imparfait'),
('CE1.FR.G4.7', 'CP.FR.G1.1', 'required', 80, 2.5, 'Catégories grammaticales CP requises pour futur'),

-- ORAL (O1) - Requires CP oral foundation
('CE1.FR.O1.1', 'CP.FR.C2.1', 'required', 80, 2.5, 'Expression orale CP requise pour vocabulaire approprié'),
('CE1.FR.O1.2', 'CP.FR.C2.1', 'required', 80, 2.5, 'Communication CP requise pour échanges');
