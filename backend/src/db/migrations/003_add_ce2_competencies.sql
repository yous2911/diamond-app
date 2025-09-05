-- =============================================================================
-- CE2 2025 COMPETENCIES MIGRATION
-- =============================================================================
-- This script adds all 32 CE2 competencies from the official 2025 curriculum
-- Based on the "Programme officiel CE2 rentrée 2025" document
-- =============================================================================

-- =============================================================================
-- FRENCH CE2 COMPETENCIES (17 total)
-- =============================================================================

-- LECTURE (CE2.FR.L.X.X)
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.FR.L.FL.01', 'Identifier les mots de manière fluide', 'FR', 'L', 1, 1, 'Objectif 90 mots/minute, voie directe majoritaire', 15),
('CE2.FR.L.EX.01', 'Lire à voix haute avec expression', 'FR', 'L', 1, 2, 'Adaptation du ton aux personnages, réalisation des liaisons', 15),
('CE2.FR.L.CO.01', 'Comprendre des textes complexes', 'FR', 'L', 1, 3, 'Textes 2-3 pages, inférences autonomes, lecture de pièces de théâtre', 20),
('CE2.FR.L.CU.01', 'Développer une culture littéraire', 'FR', 'L', 1, 4, 'Découverte du théâtre, culture patrimoniale étendue', 15);

-- ÉCRITURE (CE2.FR.E.X.X)
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.FR.E.GR.01', 'Maîtriser l''écriture cursive avec endurance', 'FR', 'E', 2, 1, 'Endurance accrue, copie guidée spécifique', 15),
('CE2.FR.E.DI.01', 'Encoder et écrire sous dictée', 'FR', 'E', 2, 2, 'Raisonnement orthographique complet (CGP + morphologie)', 20),
('CE2.FR.E.CO.01', 'Copier avec stratégies avancées', 'FR', 'E', 2, 3, '10 lignes sans erreur, mises en page complexes', 15),
('CE2.FR.E.PR.01', 'Produire des textes structurés', 'FR', 'E', 2, 4, 'Textes 10 lignes, planification autonome, connecteurs logiques', 25);

-- ORAL (CE2.FR.O.X.X)
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.FR.O.EC.01', 'Écouter pour comprendre des formats complexes', 'FR', 'O', 3, 1, 'Écoutes d''interviews, documentaires complexes', 15),
('CE2.FR.O.EX.01', 'S''exprimer avec stratégies d''interaction', 'FR', 'O', 3, 2, 'Adaptation à l''auditoire, explication de démarches', 15),
('CE2.FR.O.IN.01', 'Participer aux échanges avec langage soutenu', 'FR', 'O', 3, 3, 'Langage soutenu, suppression des "tics verbaux"', 15);

-- VOCABULAIRE (CE2.FR.V.X.X) - NOUVEAU DOMAINE SÉPARÉ
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.FR.V.EN.01', 'Enrichir par réseaux sémantiques', 'FR', 'V', 4, 1, 'Enseignement par corpus, réseaux sémantiques structurés', 20),
('CE2.FR.V.RE.01', 'Établir des relations morphologiques', 'FR', 'V', 4, 2, 'Préfixes complexes (dé-, mal-, im-), dérivations avec classes grammaticales', 20),
('CE2.FR.V.UT.01', 'Réemployer activement', 'FR', 'V', 4, 3, 'Sens propre/figuré, niveaux de langue (familier/soutenu)', 15),
('CE2.FR.V.OR.01', 'Mémoriser l''orthographe lexicale par raisonnement', 'FR', 'V', 4, 4, 'Raisonnements morphologiques (beauté←beau)', 20);

-- GRAMMAIRE (CE2.FR.G.X.X)
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.FR.G.SY.01', 'Se repérer dans la phrase complexe', 'FR', 'G', 5, 1, 'Identification complète sujet/verbe/compléments, discours rapporté', 20),
('CE2.FR.G.OR.01', 'Maîtriser l''orthographe grammaticale avancée', 'FR', 'G', 5, 2, 'Passé composé (innovation majeure), pluriels particuliers', 25);

-- =============================================================================
-- MATHÉMATIQUES CE2 COMPETENCIES (15 total)
-- =============================================================================

-- NOMBRES ET CALCUL (CE2.MA.N.X.X) - Priorité absolue
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.MA.N.EN.01', 'Maîtriser les nombres jusqu''à 10 000', 'MA', 'N', 1, 1, 'Extension jusqu''à 10 000, millier comme nouvelle unité', 25),
('CE2.MA.N.FR.01', 'Manipuler les fractions d''unités de mesure', 'MA', 'N', 1, 2, 'Fractions d''unités de longueur, égalités de fractions (6/8 = 3/4)', 30),
('CE2.MA.N.OP.01', 'Maîtriser les quatre opérations', 'MA', 'N', 1, 3, 'Multiplication posée (période 4), division en ligne', 25),
('CE2.MA.C.ME.01', 'Développer la fluence mathématique', 'MA', 'N', 1, 4, '15 résultats/3 minutes, tables étendues', 20),
('CE2.MA.P.RE.01', 'Résoudre des problèmes complexes', 'MA', 'N', 1, 5, 'Problèmes 3 étapes, procédures par analogie', 25);

-- GRANDEURS ET MESURES (CE2.MA.GM.X.X)
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.MA.GM.CO.01', 'Mesurer des contenances', 'MA', 'GM', 2, 1, 'Unités L, dL, cL (nouveau domaine)', 20),
('CE2.MA.GM.DE.01', 'Manipuler les nombres décimaux (monnaie)', 'MA', 'GM', 2, 2, 'Écriture à virgule, opérations posées avec décimaux', 25),
('CE2.MA.GM.TE.01', 'Résoudre des problèmes de durées', 'MA', 'GM', 2, 3, 'Problèmes 1-2 étapes, axes chronologiques', 20);

-- ESPACE ET GÉOMÉTRIE (CE2.MA.EG.X.X)
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.MA.EG.AN.01', 'Reconnaître et tracer des angles', 'MA', 'EG', 3, 1, 'Angles aigus/obtus transférés en géométrie, usage de l''équerre', 20),
('CE2.MA.EG.FI.01', 'Construire de nouvelles figures', 'MA', 'EG', 3, 2, 'Losange et ses propriétés, triangle rectangle spécifique', 20),
('CE2.MA.EG.SY.01', 'Travailler la symétrie axiale', 'MA', 'EG', 3, 3, 'Symétrie déplacée du CE1 au CE2, axes de symétrie', 20),
('CE2.MA.EG.PE.01', 'Calculer des périmètres', 'MA', 'EG', 3, 4, 'Périmètre comme nouveau concept', 20),
('CE2.MA.EG.CO.01', 'Construire avec instruments', 'MA', 'EG', 3, 5, 'Patron du cube (initiation), usage combiné règle/équerre/compas', 20);

-- ORGANISATION ET GESTION DE DONNÉES (CE2.MA.OGD.X.X)
INSERT INTO competences_cp (code, nom, matiere, domaine, niveau_comp, sous_competence, description, xp_reward) VALUES
('CE2.MA.OGD.TA.01', 'Exploiter tableaux et graphiques', 'MA', 'OGD', 4, 1, 'Extraction d''informations complexes, diagrammes en barres', 20);

-- =============================================================================
-- CE2 PREREQUISITES
-- =============================================================================

-- FRENCH PREREQUISITES
INSERT INTO competence_prerequisites (competence_code, prerequisite_code, required, minimum_level, description) VALUES
-- LECTURE PREREQUISITES
('CE2.FR.L.FL.01', 'CE1.FR.L.DEC.01', TRUE, 'maitrise', 'Correspondances graphèmes-phonèmes CE1 requises'),
('CE2.FR.L.FL.01', 'CE1.FR.L.FL.01', TRUE, 'maitrise', 'Fluidité 60 mots/minute CE1 requise'),
('CE2.FR.L.EX.01', 'CE1.FR.L.EX.01', TRUE, 'maitrise', 'Lecture expressive basique CE1 requise'),
('CE2.FR.L.EX.01', 'CE1.FR.G.PH.01', TRUE, 'maitrise', 'Ponctuation simple CE1 requise'),
('CE2.FR.L.CO.01', 'CE1.FR.L.CO.01', TRUE, 'maitrise', 'Compréhension littérale CE1 requise'),
('CE2.FR.L.CO.01', 'CE1.FR.L.CO.02', TRUE, 'maitrise', 'Inférences guidées CE1 requises'),
('CE2.FR.L.CU.01', 'CE1.FR.L.CU.01', TRUE, 'maitrise', 'Genres littéraires basiques CE1 requis'),

-- ÉCRITURE PREREQUISITES
('CE2.FR.E.GR.01', 'CE1.FR.E.GR.01', TRUE, 'maitrise', 'Automatismes graphiques CE1 requis'),
('CE2.FR.E.GR.01', 'CE1.FR.E.GR.02', TRUE, 'maitrise', 'Geste maîtrisé CE1 requis'),
('CE2.FR.E.DI.01', 'CE1.FR.G.OR.01', TRUE, 'maitrise', 'CGP basiques CE1 requis'),
('CE2.FR.E.DI.01', 'CE1.FR.E.DI.01', TRUE, 'maitrise', 'Dictée simple CE1 requise'),
('CE2.FR.E.CO.01', 'CE1.FR.E.CO.01', TRUE, 'maitrise', 'Copie sans erreur courte CE1 requise'),
('CE2.FR.E.CO.01', 'CE1.FR.E.CO.02', TRUE, 'maitrise', 'Stratégies basiques CE1 requises'),
('CE2.FR.E.PR.01', 'CE1.FR.E.PR.01', TRUE, 'maitrise', 'Phrases cohérentes CE1 requises'),
('CE2.FR.E.PR.01', 'CE1.FR.E.PR.02', TRUE, 'maitrise', 'Textes courts CE1 requis'),

-- ORAL PREREQUISITES
('CE2.FR.O.EC.01', 'CE1.FR.O.EC.01', TRUE, 'maitrise', 'Écoute attentive CE1 requise'),
('CE2.FR.O.EC.01', 'CE1.FR.O.EC.02', TRUE, 'maitrise', 'Consignes orales CE1 requises'),
('CE2.FR.O.EX.01', 'CE1.FR.O.EX.01', TRUE, 'maitrise', 'Expression claire CE1 requise'),
('CE2.FR.O.EX.01', 'CE1.FR.O.EX.02', TRUE, 'maitrise', 'Récitation CE1 requise'),
('CE2.FR.O.IN.01', 'CE1.FR.O.IN.01', TRUE, 'maitrise', 'Tours de parole CE1 requis'),
('CE2.FR.O.IN.01', 'CE1.FR.O.IN.02', TRUE, 'maitrise', 'Respect des autres CE1 requis'),

-- VOCABULAIRE PREREQUISITES
('CE2.FR.V.EN.01', 'CE1.FR.V.LE.01', TRUE, 'maitrise', 'Lexique thématique CE1 requis'),
('CE2.FR.V.EN.01', 'CE1.FR.V.LE.02', TRUE, 'maitrise', 'Mots nouveaux CE1 requis'),
('CE2.FR.V.RE.01', 'CE1.FR.V.MO.01', TRUE, 'maitrise', 'Familles simples CE1 requises'),
('CE2.FR.V.RE.01', 'CE1.FR.V.MO.02', TRUE, 'maitrise', 'Préfixes de base CE1 requis'),
('CE2.FR.V.UT.01', 'CE1.FR.V.UT.01', TRUE, 'maitrise', 'Usage contextuel basique CE1 requis'),
('CE2.FR.V.OR.01', 'CE1.FR.V.OR.01', TRUE, 'maitrise', 'Mots fréquents CE1 requis'),
('CE2.FR.V.OR.01', 'CE1.FR.V.OR.02', TRUE, 'maitrise', 'Analogies simples CE1 requises'),

-- GRAMMAIRE PREREQUISITES
('CE2.FR.G.SY.01', 'CE1.FR.G.PH.01', TRUE, 'maitrise', 'Phrase simple CE1 requise'),
('CE2.FR.G.SY.01', 'CE1.FR.G.CL.01', TRUE, 'maitrise', 'Nom/verbe CE1 requis'),
('CE2.FR.G.OR.01', 'CE1.FR.G.CO.01', TRUE, 'maitrise', 'Présent/futur CE1 requis'),
('CE2.FR.G.OR.01', 'CE1.FR.G.AC.01', TRUE, 'maitrise', 'Accords basiques CE1 requis');

-- MATH PREREQUISITES
INSERT INTO competence_prerequisites (competence_code, prerequisite_code, required, minimum_level, description) VALUES
-- NOMBRES ET CALCUL PREREQUISITES
('CE2.MA.N.EN.01', 'CE1.MA.N.EN.01', TRUE, 'maitrise', 'Nombres jusqu''à 1000 CE1 requis'),
('CE2.MA.N.EN.01', 'CE1.MA.N.EN.02', TRUE, 'maitrise', 'Unités de numération CE1 requises'),
('CE2.MA.N.FR.01', 'CE1.MA.N.FR.01', TRUE, 'maitrise', 'Fractions d''un tout ≤ 1 CE1 requises'),
('CE2.MA.N.OP.01', 'CE1.MA.C.AD.01', TRUE, 'maitrise', 'Addition posée CE1 requise'),
('CE2.MA.N.OP.01', 'CE1.MA.C.SO.01', TRUE, 'maitrise', 'Soustraction posée CE1 requise'),
('CE2.MA.C.ME.01', 'CE1.MA.C.ME.01', TRUE, 'maitrise', 'Tables 2,5,10 CE1 requises'),
('CE2.MA.C.ME.01', 'CE1.MA.C.ME.02', TRUE, 'maitrise', '12 résultats/3min CE1 requis'),
('CE2.MA.P.RE.01', 'CE1.MA.P.RE.01', TRUE, 'maitrise', 'Problèmes 1-2 étapes CE1 requis'),
('CE2.MA.P.RE.01', 'CE1.MA.P.RE.02', TRUE, 'maitrise', 'Schématisation CE1 requise'),

-- GRANDEURS ET MESURES PREREQUISITES
('CE2.MA.GM.CO.01', 'CE1.MA.GM.ME.01', TRUE, 'maitrise', 'Concepts de mesure CE1 requis'),
('CE2.MA.GM.DE.01', 'CE1.MA.GM.MO.01', TRUE, 'maitrise', 'Euros et centimes CE1 requis'),
('CE2.MA.GM.TE.01', 'CE1.MA.GM.TE.01', TRUE, 'maitrise', 'Heures/minutes CE1 requis'),
('CE2.MA.GM.TE.01', 'CE1.MA.GM.TE.02', TRUE, 'maitrise', 'Calendrier CE1 requis'),

-- ESPACE ET GÉOMÉTRIE PREREQUISITES
('CE2.MA.EG.AN.01', 'CE1.MA.GM.AN.01', TRUE, 'maitrise', 'Angle droit en mesures CE1 requis'),
('CE2.MA.EG.FI.01', 'CE1.MA.EG.FI.01', TRUE, 'maitrise', 'Carré, rectangle, triangle CE1 requis'),
('CE2.MA.EG.PE.01', 'CE1.MA.GM.LO.01', TRUE, 'maitrise', 'Mesures de longueur CE1 requises'),
('CE2.MA.EG.CO.01', 'CE1.MA.EG.CO.01', TRUE, 'maitrise', 'Règle/équerre basique CE1 requis'),

-- ORGANISATION ET GESTION DE DONNÉES PREREQUISITES
('CE2.MA.OGD.TA.01', 'CE1.MA.OGD.TA.01', TRUE, 'maitrise', 'Tableaux simples CE1 requis');

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Count total CE2 competencies
SELECT 
    'Total CE2 Competencies' as metric,
    COUNT(*) as value
FROM competences_cp 
WHERE code LIKE 'CE2.%';

-- Count by subject
SELECT 
    matiere as subject,
    COUNT(*) as competencies
FROM competences_cp 
WHERE code LIKE 'CE2.%'
GROUP BY matiere;

-- Count total CE2 prerequisites
SELECT 
    'Total CE2 Prerequisites' as metric,
    COUNT(*) as value
FROM competence_prerequisites 
WHERE competence_code LIKE 'CE2.%';

