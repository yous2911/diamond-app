-- Add CE1 2025 Competencies to Database
-- This script adds all 115 CE1 competencies (50 French + 65 Math)

-- =============================================================================
-- FRENCH CE1 COMPETENCIES (50 total)
-- =============================================================================

-- LECTURE ET DÉCODAGE (L1)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.L1.1', 'CE1', 'FRANCAIS', 'L1', 1, 1, 'Identifier des mots de manière de plus en plus aisée'),
('CE1.FR.L1.2', 'CE1', 'FRANCAIS', 'L1', 1, 2, 'Reconnaître les lettres muettes'),
('CE1.FR.L1.3', 'CE1', 'FRANCAIS', 'L1', 1, 3, 'Distinguer les sons proches ([f]/[v], [ch]/[j], [k]/[g])'),
('CE1.FR.L1.4', 'CE1', 'FRANCAIS', 'L1', 1, 4, 'Produire des syllabes et les associer pour écrire des mots complexes'),
('CE1.FR.L1.5', 'CE1', 'FRANCAIS', 'L1', 1, 5, 'Mémoriser des mots fréquents'),
('CE1.FR.L1.6', 'CE1', 'FRANCAIS', 'L1', 1, 6, 'Lire des mots nouveaux, même difficiles');

-- LECTURE FLUENTE (L2)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.L2.1', 'CE1', 'FRANCAIS', 'L2', 2, 1, 'Lire à voix haute en respectant la ponctuation'),
('CE1.FR.L2.2', 'CE1', 'FRANCAIS', 'L2', 2, 2, 'Adapter le ton et l''intonation au sens du texte'),
('CE1.FR.L2.3', 'CE1', 'FRANCAIS', 'L2', 2, 3, 'Lire avec fluidité des textes variés'),
('CE1.FR.L2.4', 'CE1', 'FRANCAIS', 'L2', 2, 4, 'Pratiquer la lecture expressive et l''interprétation');

-- TYPES DE TEXTES (L3)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.L3.1', 'CE1', 'FRANCAIS', 'L3', 3, 1, 'Lire des écrits scolaires (consignes, emploi du temps)'),
('CE1.FR.L3.2', 'CE1', 'FRANCAIS', 'L3', 3, 2, 'Lire des écrits fonctionnels (recettes, notices)'),
('CE1.FR.L3.3', 'CE1', 'FRANCAIS', 'L3', 3, 3, 'Lire des textes de fiction de différents genres'),
('CE1.FR.L3.4', 'CE1', 'FRANCAIS', 'L3', 3, 4, 'Lire des textes documentaires (manuels, dictionnaire)');

-- COMPRÉHENSION ÉCRITE (C1)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.C1.1', 'CE1', 'FRANCAIS', 'C1', 1, 1, 'Comprendre un texte et contrôler sa compréhension'),
('CE1.FR.C1.2', 'CE1', 'FRANCAIS', 'C1', 1, 2, 'Mobiliser des connaissances pour comprendre'),
('CE1.FR.C1.3', 'CE1', 'FRANCAIS', 'C1', 1, 3, 'Repérer des informations dans un texte'),
('CE1.FR.C1.4', 'CE1', 'FRANCAIS', 'C1', 1, 4, 'Reformuler le contenu d''un texte'),
('CE1.FR.C1.5', 'CE1', 'FRANCAIS', 'C1', 1, 5, 'Identifier les caractéristiques d''un type de texte'),
('CE1.FR.C1.6', 'CE1', 'FRANCAIS', 'C1', 1, 6, 'Comprendre des textes de genres variés');

-- COMPRÉHENSION ORALE (C2)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.C2.1', 'CE1', 'FRANCAIS', 'C2', 2, 1, 'Écouter pour comprendre des messages oraux'),
('CE1.FR.C2.2', 'CE1', 'FRANCAIS', 'C2', 2, 2, 'Écouter pour comprendre des textes lus par un adulte'),
('CE1.FR.C2.3', 'CE1', 'FRANCAIS', 'C2', 2, 3, 'Repérer les informations importantes dans un message oral'),
('CE1.FR.C2.4', 'CE1', 'FRANCAIS', 'C2', 2, 4, 'Reformuler et expliquer ce qui a été entendu');

-- ÉCRITURE TECHNIQUE (E1)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.E1.1', 'CE1', 'FRANCAIS', 'E1', 1, 1, 'Copier des phrases et des textes avec une écriture correcte'),
('CE1.FR.E1.2', 'CE1', 'FRANCAIS', 'E1', 1, 2, 'Copier des mots pour les mémoriser'),
('CE1.FR.E1.3', 'CE1', 'FRANCAIS', 'E1', 1, 3, 'Copier pour "mettre au propre" avec une mise en page adaptée'),
('CE1.FR.E1.4', 'CE1', 'FRANCAIS', 'E1', 1, 4, 'Maîtriser le geste d''écriture cursive'),
('CE1.FR.E1.5', 'CE1', 'FRANCAIS', 'E1', 1, 5, 'Développer l''endurance et la rapidité d''écriture');

-- PRODUCTION ÉCRITE (E2)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.E2.1', 'CE1', 'FRANCAIS', 'E2', 2, 1, 'Écrire des textes courts en s''appropriant une démarche'),
('CE1.FR.E2.2', 'CE1', 'FRANCAIS', 'E2', 2, 2, 'Rédiger en respectant les caractéristiques du type de texte'),
('CE1.FR.E2.3', 'CE1', 'FRANCAIS', 'E2', 2, 3, 'Organiser sa rédaction (brouillon, schéma, tableau)'),
('CE1.FR.E2.4', 'CE1', 'FRANCAIS', 'E2', 2, 4, 'Utiliser des outils pour la classe (grille de relecture)'),
('CE1.FR.E2.5', 'CE1', 'FRANCAIS', 'E2', 2, 5, 'Construire progressivement des écrits plus longs');

-- RÉVISION ET AMÉLIORATION (E3)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.E3.1', 'CE1', 'FRANCAIS', 'E3', 3, 1, 'Réviser et améliorer l''écrit qu''on a produit'),
('CE1.FR.E3.2', 'CE1', 'FRANCAIS', 'E3', 3, 2, 'Réécrire un texte en changeant certains éléments'),
('CE1.FR.E3.3', 'CE1', 'FRANCAIS', 'E3', 3, 3, 'Utiliser les pronoms pour éviter les répétitions'),
('CE1.FR.E3.4', 'CE1', 'FRANCAIS', 'E3', 3, 4, 'Relire à voix haute pour identifier les améliorations');

-- GRAMMAIRE (G1)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.G1.1', 'CE1', 'FRANCAIS', 'G1', 1, 1, 'Reconnaître les mots de la phrase (sujet, verbe, compléments)'),
('CE1.FR.G1.2', 'CE1', 'FRANCAIS', 'G1', 1, 2, 'Différencier les classes de mots (nom, déterminant, adjectif, verbe)'),
('CE1.FR.G1.3', 'CE1', 'FRANCAIS', 'G1', 1, 3, 'Reconnaître le groupe nominal'),
('CE1.FR.G1.4', 'CE1', 'FRANCAIS', 'G1', 1, 4, 'Reconnaître les 3 types de phrases'),
('CE1.FR.G1.5', 'CE1', 'FRANCAIS', 'G1', 1, 5, 'Reconnaître les formes interrogatives, exclamatives et négatives'),
('CE1.FR.G1.6', 'CE1', 'FRANCAIS', 'G1', 1, 6, 'Commencer à utiliser les mots de la grammaire');

-- ORTHOGRAPHE (G2)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.G2.1', 'CE1', 'FRANCAIS', 'G2', 2, 1, 'Passer de l''oral à l''écrit (correspondances phonème-graphème)'),
('CE1.FR.G2.2', 'CE1', 'FRANCAIS', 'G2', 2, 2, 'Transcrire correctement les sons et mots entendus'),
('CE1.FR.G2.3', 'CE1', 'FRANCAIS', 'G2', 2, 3, 'Maîtriser l''orthographe grammaticale de base'),
('CE1.FR.G2.4', 'CE1', 'FRANCAIS', 'G2', 2, 4, 'Procéder aux accords en genre et nombre dans le groupe nominal'),
('CE1.FR.G2.5', 'CE1', 'FRANCAIS', 'G2', 2, 5, 'Effectuer l''accord entre sujet et verbe'),
('CE1.FR.G2.6', 'CE1', 'FRANCAIS', 'G2', 2, 6, 'Mémoriser les règles de changement singulier/pluriel');

-- VOCABULAIRE (G3)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.G3.1', 'CE1', 'FRANCAIS', 'G3', 3, 1, 'Enrichir son vocabulaire par la lecture et l''écoute'),
('CE1.FR.G3.2', 'CE1', 'FRANCAIS', 'G3', 3, 2, 'Maîtriser l''orthographe lexicale des mots fréquents'),
('CE1.FR.G3.3', 'CE1', 'FRANCAIS', 'G3', 3, 3, 'Comprendre et utiliser les registres de langue'),
('CE1.FR.G3.4', 'CE1', 'FRANCAIS', 'G3', 3, 4, 'Utiliser le dictionnaire pour vérifier l''orthographe'),
('CE1.FR.G3.5', 'CE1', 'FRANCAIS', 'G3', 3, 5, 'Comprendre les relations entre les mots (synonymes, antonymes)'),
('CE1.FR.G3.6', 'CE1', 'FRANCAIS', 'G3', 3, 6, 'Utiliser des mots de liaison pour structurer le discours'),
('CE1.FR.G3.7', 'CE1', 'FRANCAIS', 'G3', 3, 7, 'Comprendre et utiliser les expressions idiomatiques'),
('CE1.FR.G3.8', 'CE1', 'FRANCAIS', 'G3', 3, 8, 'Développer le vocabulaire technique et spécialisé');

-- CONJUGAISON (G4)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.G4.1', 'CE1', 'FRANCAIS', 'G4', 4, 1, 'Conjuguer les verbes être et avoir au présent'),
('CE1.FR.G4.2', 'CE1', 'FRANCAIS', 'G4', 4, 2, 'Conjuguer les verbes du 1er groupe au présent'),
('CE1.FR.G4.3', 'CE1', 'FRANCAIS', 'G4', 4, 3, 'Conjuguer les verbes du 2ème groupe au présent'),
('CE1.FR.G4.4', 'CE1', 'FRANCAIS', 'G4', 4, 4, 'Conjuguer les verbes du 3ème groupe au présent'),
('CE1.FR.G4.5', 'CE1', 'FRANCAIS', 'G4', 4, 5, 'Conjuguer les verbes au passé composé'),
('CE1.FR.G4.6', 'CE1', 'FRANCAIS', 'G4', 4, 6, 'Conjuguer les verbes à l''imparfait'),
('CE1.FR.G4.7', 'CE1', 'FRANCAIS', 'G4', 4, 7, 'Conjuguer les verbes au futur simple');

-- ORAL (O1)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.FR.O1.1', 'CE1', 'FRANCAIS', 'O1', 1, 1, 'S''exprimer clairement à l''oral en utilisant un vocabulaire approprié'),
('CE1.FR.O1.2', 'CE1', 'FRANCAIS', 'O1', 1, 2, 'Participer à des échanges en respectant les règles de communication');
