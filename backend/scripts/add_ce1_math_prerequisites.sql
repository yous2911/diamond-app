-- Add CE1 2025 Math Prerequisites Mapping
-- This script maps CP competencies as prerequisites for CE1 Math competencies

-- =============================================================================
-- MATH CE1 PREREQUISITES
-- =============================================================================

-- NOMBRES ENTIERS (N1) - Requires complete CP number mastery
INSERT INTO competence_prerequisites (competence_code, prerequisite_code, prerequisite_type, mastery_threshold, weight, description) VALUES
-- CE1.MA.N1.1 requires complete CP number foundation
('CE1.MA.N1.1', 'CP.MA.N1.1', 'required', 85, 3.0, 'Nombres jusqu''à 100 CP requis pour consolidation'),
('CE1.MA.N1.1', 'CP.MA.N1.2', 'required', 80, 2.5, 'Décomposition CP requise pour nombres 100'),
('CE1.MA.N1.1', 'CP.MA.N1.3', 'required', 80, 2.5, 'Comparaison CP requise pour consolidation'),
('CE1.MA.N1.1', 'CP.MA.N1.4', 'required', 80, 2.5, 'Ordre CP requis pour consolidation'),
('CE1.MA.N1.1', 'CP.MA.N1.5', 'required', 80, 2.5, 'Suite numérique CP requise pour consolidation'),

-- CE1.MA.N1.2 requires CP numbers + measures foundation
('CE1.MA.N1.2', 'CP.MA.N1.1', 'required', 85, 3.0, 'Nombres jusqu''à 100 CP requis pour extension 1000'),
('CE1.MA.N1.2', 'CP.MA.N1.2', 'required', 80, 2.5, 'Décomposition CP requise pour nombres 1000'),
('CE1.MA.N1.2', 'CP.MA.M1.1', 'required', 75, 2.0, 'Mesures CP requises pour nombres 1000'),
('CE1.MA.N1.2', 'CP.MA.M1.2', 'required', 75, 2.0, 'Unités CP requises pour nombres 1000'),
('CE1.MA.N1.2', 'CP.MA.M1.3', 'required', 75, 2.0, 'Mesure longueurs CP requise pour nombres 1000'),

-- CE1.MA.N1.3 requires CP comparison skills
('CE1.MA.N1.3', 'CP.MA.N1.3', 'required', 80, 2.5, 'Comparaison CP requise pour nombres 1000'),
('CE1.MA.N1.3', 'CP.MA.N1.4', 'required', 80, 2.5, 'Ordre CP requis pour nombres 1000'),
('CE1.MA.N1.3', 'CP.MA.N1.5', 'required', 80, 2.5, 'Suite numérique CP requise pour encadrement'),

-- CE1.MA.N1.4 requires CP number line work
('CE1.MA.N1.4', 'CP.MA.N1.4', 'required', 80, 2.5, 'Droite graduée CP requise pour nombres 1000'),
('CE1.MA.N1.4', 'CP.MA.N1.5', 'required', 80, 2.5, 'Suite numérique CP requise pour placement'),

-- CE1.MA.N1.5 requires CP ordinal understanding
('CE1.MA.N1.5', 'CP.MA.N1.5', 'required', 80, 2.5, 'Suite numérique CP requise pour ordinaux'),

-- FRACTIONS (N2) - NEW in CE1, requires CP numbers + measures
('CE1.MA.N2.1', 'CP.MA.N1.1', 'required', 80, 2.5, 'Nombres CP requis pour fractions comme parties'),
('CE1.MA.N2.1', 'CP.MA.M1.1', 'required', 75, 2.0, 'Mesures CP requises pour fractions'),
('CE1.MA.N2.1', 'CP.MA.M1.2', 'required', 75, 2.0, 'Unités CP requises pour fractions'),
('CE1.MA.N2.1', 'CP.MA.M1.3', 'required', 75, 2.0, 'Mesure longueurs CP requise pour fractions'),

('CE1.MA.N2.2', 'CP.MA.N1.1', 'required', 80, 2.5, 'Nombres CP requis pour fractions unitaires'),
('CE1.MA.N2.2', 'CP.MA.M1.1', 'required', 75, 2.0, 'Mesures CP requises pour 1/2, 1/3, 1/4'),

('CE1.MA.N2.3', 'CP.MA.N1.3', 'required', 80, 2.5, 'Comparaison CP requise pour fractions'),
('CE1.MA.N2.3', 'CP.MA.N2.1', 'required', 80, 2.5, 'Fractions de base requises pour comparaison'),

('CE1.MA.N2.4', 'CP.MA.N3.1', 'required', 80, 2.5, 'Addition/soustraction CP requises pour fractions'),
('CE1.MA.N2.4', 'CP.MA.N2.1', 'required', 80, 2.5, 'Fractions de base requises pour opérations'),

('CE1.MA.N2.5', 'CP.MA.M1.1', 'required', 80, 2.5, 'Mesures CP requises pour fractions-mesures'),
('CE1.MA.N2.5', 'CP.MA.N2.1', 'required', 80, 2.5, 'Fractions de base requises pour mesures'),

-- CALCUL MENTAL ET AUTOMATISMES (N3) - Requires CP mental calculation mastery
('CE1.MA.N3.1', 'CP.MA.N3.1', 'required', 85, 3.0, 'Compléments à 10 CP requis pour extension 100'),
('CE1.MA.N3.1', 'CP.MA.N3.2', 'required', 80, 2.5, 'Compléments CP requis pour automatisation'),

('CE1.MA.N3.2', 'CP.MA.N3.1', 'required', 85, 3.0, 'Addition/soustraction CP requises pour mental'),
('CE1.MA.N3.2', 'CP.MA.N3.2', 'required', 80, 2.5, 'Calcul mental CP requis pour automatisation'),

('CE1.MA.N3.3', 'CP.MA.N4.3', 'required', 80, 2.5, 'Sens multiplication CP requis pour tables'),
('CE1.MA.N3.3', 'CP.MA.N4.4', 'required', 80, 2.5, 'Sens division CP requis pour tables'),

('CE1.MA.N3.4', 'CP.MA.N3.1', 'required', 85, 3.0, 'Calcul mental CP requis pour fluence'),
('CE1.MA.N3.4', 'CP.MA.N3.2', 'required', 80, 2.5, 'Automatismes CP requis pour chronométrage'),

('CE1.MA.N3.5', 'CP.MA.N3.1', 'required', 80, 2.5, 'Stratégies calcul CP requises pour explicites'),
('CE1.MA.N3.5', 'CP.MA.N3.2', 'required', 80, 2.5, 'Calcul mental CP requis pour stratégies'),

-- CALCUL POSÉ (N4) - Requires CP written calculation foundation
('CE1.MA.N4.1', 'CP.MA.N3.1', 'required', 80, 2.5, 'Addition CP requise pour posée avec retenue'),
('CE1.MA.N4.1', 'CP.MA.N3.2', 'required', 80, 2.5, 'Soustraction CP requise pour posée avec retenue'),

('CE1.MA.N4.2', 'CP.MA.N3.1', 'required', 80, 2.5, 'Addition CP requise pour soustraction posée'),
('CE1.MA.N4.2', 'CP.MA.N3.2', 'required', 80, 2.5, 'Soustraction CP requise pour posée avec retenue'),

('CE1.MA.N4.3', 'CP.MA.N3.1', 'required', 80, 2.5, 'Vérification calculs CP requise'),
('CE1.MA.N4.3', 'CP.MA.N3.2', 'required', 80, 2.5, 'Techniques opératoires CP requises'),

('CE1.MA.N4.4', 'CP.MA.N3.1', 'required', 80, 2.5, 'Techniques opératoires CP requises pour fluide'),
('CE1.MA.N4.4', 'CP.MA.N3.2', 'required', 80, 2.5, 'Calcul posé CP requis pour automatisation'),

('CE1.MA.N4.5', 'CP.MA.P1.1', 'required', 80, 2.5, 'Résolution problèmes CP requise pour calculs posés'),
('CE1.MA.N4.5', 'CP.MA.P1.2', 'required', 80, 2.5, 'Problèmes CP requis pour calculs posés'),

-- RÉSOLUTION DE PROBLÈMES (N5) - Requires complete CP problem solving
('CE1.MA.N5.1', 'CP.MA.P1.1', 'required', 85, 3.0, 'Résolution problèmes CP requise pour arithmétiques'),
('CE1.MA.N5.1', 'CP.MA.P1.2', 'required', 80, 2.5, 'Problèmes CP requis pour extension'),
('CE1.MA.N5.1', 'CP.MA.P2.1', 'required', 80, 2.5, 'Problèmes multiplication CP requis'),
('CE1.MA.N5.1', 'CP.MA.P2.2', 'required', 80, 2.5, 'Problèmes division CP requis'),
('CE1.MA.N5.1', 'CP.MA.P3.1', 'required', 80, 2.5, 'Problèmes à étapes CP requis'),
('CE1.MA.N5.1', 'CP.MA.P3.2', 'required', 80, 2.5, 'Stratégies résolution CP requises'),
('CE1.MA.N5.1', 'CP.MA.P3.3', 'required', 80, 2.5, 'Problèmes multiples CP requis'),
('CE1.MA.N5.1', 'CP.MA.P3.4', 'required', 80, 2.5, 'Vérification problèmes CP requise'),

('CE1.MA.N5.2', 'CP.MA.P1.1', 'required', 80, 2.5, 'Identification informations CP requise'),
('CE1.MA.N5.2', 'CP.MA.P1.2', 'required', 80, 2.5, 'Problèmes CP requis pour informations pertinentes'),

('CE1.MA.N5.3', 'CP.MA.P1.1', 'required', 80, 2.5, 'Choix opération CP requis'),
('CE1.MA.N5.3', 'CP.MA.P1.2', 'required', 80, 2.5, 'Problèmes CP requis pour opération appropriée'),

('CE1.MA.N5.4', 'CP.MA.P3.1', 'required', 80, 2.5, 'Problèmes à étapes CP requis pour analogie'),
('CE1.MA.N5.4', 'CP.MA.P3.2', 'required', 80, 2.5, 'Stratégies CP requises pour procédures'),

('CE1.MA.N5.5', 'CP.MA.P3.4', 'required', 80, 2.5, 'Vérification CP requise pour cohérence'),
('CE1.MA.N5.5', 'CP.MA.P1.2', 'required', 80, 2.5, 'Problèmes CP requis pour vérification'),

-- LONGUEURS (M1) - Requires CP length mastery
('CE1.MA.M1.1', 'CP.MA.M1.1', 'required', 85, 3.0, 'Comparaison longueurs CP requise pour superposition'),
('CE1.MA.M1.1', 'CP.MA.M1.2', 'required', 80, 2.5, 'Report CP requis pour comparaison'),

('CE1.MA.M1.2', 'CP.MA.M1.2', 'required', 80, 2.5, 'Unités longueur CP requises pour cm, m'),
('CE1.MA.M1.2', 'CP.MA.M1.3', 'required', 80, 2.5, 'Mesure longueurs CP requise pour unités'),

('CE1.MA.M1.3', 'CP.MA.M1.3', 'required', 80, 2.5, 'Mesure longueurs CP requise pour règle graduée'),
('CE1.MA.M1.3', 'CP.MA.M1.2', 'required', 80, 2.5, 'Unités CP requises pour mesure'),

('CE1.MA.M1.4', 'CP.MA.M1.1', 'required', 80, 2.5, 'Comparaison CP requise pour estimation'),
('CE1.MA.M1.4', 'CP.MA.M1.3', 'required', 80, 2.5, 'Mesure CP requise pour estimation'),

('CE1.MA.M1.5', 'CP.MA.P1.1', 'required', 80, 2.5, 'Résolution problèmes CP requise pour longueurs'),
('CE1.MA.M1.5', 'CP.MA.M1.1', 'required', 80, 2.5, 'Longueurs CP requises pour problèmes'),

-- MASSES (M2) - Requires CP mass foundation
('CE1.MA.M2.1', 'CP.MA.M2.1', 'required', 80, 2.5, 'Comparaison masses CP requise pour manipulation'),
('CE1.MA.M2.1', 'CP.MA.M2.2', 'required', 80, 2.5, 'Masses CP requises pour comparaison'),

('CE1.MA.M2.2', 'CP.MA.M2.2', 'required', 80, 2.5, 'Masses CP requises pour unités g, kg'),
('CE1.MA.M2.2', 'CP.MA.M1.2', 'required', 75, 2.0, 'Unités CP requises pour masses'),

('CE1.MA.M2.3', 'CP.MA.M2.1', 'required', 80, 2.5, 'Masses CP requises pour balance'),
('CE1.MA.M2.3', 'CP.MA.M2.2', 'required', 80, 2.5, 'Unités masses CP requises pour mesure'),

('CE1.MA.M2.4', 'CP.MA.M2.1', 'required', 80, 2.5, 'Comparaison masses CP requise pour estimation'),
('CE1.MA.M2.4', 'CP.MA.M2.3', 'required', 80, 2.5, 'Mesure masses CP requise pour estimation'),

('CE1.MA.M2.5', 'CP.MA.P1.1', 'required', 80, 2.5, 'Résolution problèmes CP requise pour masses'),
('CE1.MA.M2.5', 'CP.MA.M2.1', 'required', 80, 2.5, 'Masses CP requises pour problèmes'),

-- CONTENANCES (M3) - Requires CP capacity foundation
('CE1.MA.M3.1', 'CP.MA.M3.1', 'required', 80, 2.5, 'Comparaison contenances CP requise pour transvasement'),
('CE1.MA.M3.1', 'CP.MA.M3.2', 'required', 80, 2.5, 'Contenances CP requises pour comparaison'),

('CE1.MA.M3.2', 'CP.MA.M3.2', 'required', 80, 2.5, 'Contenances CP requises pour unité L'),
('CE1.MA.M3.2', 'CP.MA.M1.2', 'required', 75, 2.0, 'Unités CP requises pour contenances'),

('CE1.MA.M3.3', 'CP.MA.M3.1', 'required', 80, 2.5, 'Contenances CP requises pour récipients gradués'),
('CE1.MA.M3.3', 'CP.MA.M3.2', 'required', 80, 2.5, 'Unités contenances CP requises pour mesure'),

('CE1.MA.M3.4', 'CP.MA.M3.1', 'required', 80, 2.5, 'Comparaison contenances CP requise pour estimation'),
('CE1.MA.M3.4', 'CP.MA.M3.3', 'required', 80, 2.5, 'Mesure contenances CP requise pour estimation'),

('CE1.MA.M3.5', 'CP.MA.P1.1', 'required', 80, 2.5, 'Résolution problèmes CP requise pour contenances'),
('CE1.MA.M3.5', 'CP.MA.M3.1', 'required', 80, 2.5, 'Contenances CP requises pour problèmes'),

-- TEMPS ET DURÉES (M4) - Requires CP time mastery
('CE1.MA.M4.1', 'CP.MA.M3.1', 'required', 80, 2.5, 'Lecture heure CP requise pour heures et demi-heures'),
('CE1.MA.M4.1', 'CP.MA.M3.2', 'required', 80, 2.5, 'Heure CP requise pour extension'),

('CE1.MA.M4.2', 'CP.MA.M3.1', 'required', 80, 2.5, 'Lecture heure CP requise pour quarts d''heure'),
('CE1.MA.M4.2', 'CP.MA.M4.1', 'required', 80, 2.5, 'Heures et demi-heures requises pour quarts'),

('CE1.MA.M4.3', 'CP.MA.M3.1', 'required', 80, 2.5, 'Lecture heure CP requise pour durées'),
('CE1.MA.M4.3', 'CP.MA.M3.2', 'required', 80, 2.5, 'Heure CP requise pour calcul durées'),

('CE1.MA.M4.4', 'CP.MA.M4.1', 'required', 80, 2.5, 'Calendrier CP requis pour repérage dates'),
('CE1.MA.M4.4', 'CP.MA.M4.2', 'required', 80, 2.5, 'Temps CP requis pour calendrier'),

('CE1.MA.M4.5', 'CP.MA.P1.1', 'required', 80, 2.5, 'Résolution problèmes CP requise pour temps'),
('CE1.MA.M4.5', 'CP.MA.M3.1', 'required', 80, 2.5, 'Temps CP requis pour problèmes'),

-- MONNAIE (M5) - Requires CP money foundation
('CE1.MA.M5.1', 'CP.MA.M4.1', 'required', 80, 2.5, 'Reconnaissance monnaie CP requise pour euros'),
('CE1.MA.M5.1', 'CP.MA.M4.2', 'required', 80, 2.5, 'Monnaie CP requise pour pièces et billets'),

('CE1.MA.M5.2', 'CP.MA.M4.2', 'required', 80, 2.5, 'Calcul monnaie CP requis pour sommes'),
('CE1.MA.M5.2', 'CP.MA.M4.3', 'required', 80, 2.5, 'Monnaie CP requise pour calcul'),

('CE1.MA.M5.3', 'CP.MA.M4.3', 'required', 80, 2.5, 'Rendre monnaie CP requis pour achats simples'),
('CE1.MA.M5.3', 'CP.MA.M4.2', 'required', 80, 2.5, 'Calcul monnaie CP requis pour rendu'),

('CE1.MA.M5.4', 'CP.MA.M4.2', 'required', 80, 2.5, 'Écriture prix CP requise pour virgule'),
('CE1.MA.M5.4', 'CP.MA.M4.3', 'required', 80, 2.5, 'Monnaie CP requise pour écriture'),

('CE1.MA.M5.5', 'CP.MA.P1.1', 'required', 80, 2.5, 'Résolution problèmes CP requise pour monnaie'),
('CE1.MA.M5.5', 'CP.MA.M4.1', 'required', 80, 2.5, 'Monnaie CP requise pour problèmes'),

-- REPÉRAGE ET DÉPLACEMENTS (G1) - Requires CP spatial foundation
('CE1.MA.G1.1', 'CP.MA.G1.1', 'required', 80, 2.5, 'Repérage espace CP requis pour espace proche'),
('CE1.MA.G1.1', 'CP.MA.G1.2', 'required', 80, 2.5, 'Espace CP requis pour repérage'),

('CE1.MA.G1.2', 'CP.MA.G1.2', 'required', 80, 2.5, 'Vocabulaire spatial CP requis pour devant, derrière, etc.'),
('CE1.MA.G1.2', 'CP.MA.G1.3', 'required', 80, 2.5, 'Espace CP requis pour vocabulaire'),

('CE1.MA.G1.3', 'CP.MA.G1.3', 'required', 80, 2.5, 'Déplacements CP requis pour consignes spatiales'),
('CE1.MA.G1.3', 'CP.MA.G1.2', 'required', 80, 2.5, 'Vocabulaire spatial CP requis pour déplacements'),

('CE1.MA.G1.4', 'CP.MA.G1.4', 'required', 80, 2.5, 'Quadrillage CP requis pour positions'),
('CE1.MA.G1.4', 'CP.MA.G1.3', 'required', 80, 2.5, 'Déplacements CP requis pour quadrillage'),

('CE1.MA.G1.5', 'CP.MA.G1.3', 'required', 80, 2.5, 'Déplacements CP requis pour programmation'),
('CE1.MA.G1.5', 'CP.MA.G1.4', 'required', 80, 2.5, 'Quadrillage CP requis pour programmation'),

-- FIGURES GÉOMÉTRIQUES PLANES (G2) - Requires CP plane figures mastery
('CE1.MA.G2.1', 'CP.MA.G2.1', 'required', 80, 2.5, 'Figures planes CP requises pour reconnaissance'),
('CE1.MA.G2.1', 'CP.MA.G2.2', 'required', 80, 2.5, 'Figures CP requises pour nommage'),

('CE1.MA.G2.2', 'CP.MA.G2.2', 'required', 80, 2.5, 'Propriétés figures CP requises pour description'),
('CE1.MA.G2.2', 'CP.MA.G2.3', 'required', 80, 2.5, 'Figures CP requises pour propriétés'),

('CE1.MA.G2.3', 'CP.MA.G2.3', 'required', 80, 2.5, 'Reproduction figures CP requise pour quadrillage'),
('CE1.MA.G2.3', 'CP.MA.G2.1', 'required', 80, 2.5, 'Figures CP requises pour reproduction'),

('CE1.MA.G2.4', 'CP.MA.G2.3', 'required', 80, 2.5, 'Reproduction figures CP requise pour construction'),
('CE1.MA.G2.4', 'CP.MA.G3.1', 'required', 80, 2.5, 'Instruments CP requis pour construction'),

('CE1.MA.G2.5', 'CP.MA.G2.1', 'required', 80, 2.5, 'Figures CP requises pour symétrie axiale'),
('CE1.MA.G2.5', 'CP.MA.G2.2', 'required', 80, 2.5, 'Propriétés figures CP requises pour symétrie'),

-- SOLIDES (G3) - Requires CP solids foundation
('CE1.MA.G3.1', 'CP.MA.G2.1', 'required', 80, 2.5, 'Figures planes CP requises pour solides'),
('CE1.MA.G3.1', 'CP.MA.G2.2', 'required', 80, 2.5, 'Propriétés CP requises pour solides'),

('CE1.MA.G3.2', 'CP.MA.G2.2', 'required', 80, 2.5, 'Propriétés figures CP requises pour solides'),
('CE1.MA.G3.2', 'CP.MA.G3.1', 'required', 80, 2.5, 'Solides CP requis pour propriétés'),

('CE1.MA.G3.3', 'CP.MA.G2.3', 'required', 80, 2.5, 'Reproduction figures CP requise pour patrons'),
('CE1.MA.G3.3', 'CP.MA.G3.1', 'required', 80, 2.5, 'Solides CP requis pour patrons'),

('CE1.MA.G3.4', 'CP.MA.G2.3', 'required', 80, 2.5, 'Reproduction figures CP requise pour construction solides'),
('CE1.MA.G3.4', 'CP.MA.G3.1', 'required', 80, 2.5, 'Solides CP requis pour construction'),

('CE1.MA.G3.5', 'CP.MA.P1.1', 'required', 80, 2.5, 'Résolution problèmes CP requise pour solides'),
('CE1.MA.G3.5', 'CP.MA.G3.1', 'required', 80, 2.5, 'Solides CP requis pour problèmes'),

-- CONSTRUCTION ET TRACÉS (G4) - Requires CP construction skills
('CE1.MA.G4.1', 'CP.MA.G3.1', 'required', 80, 2.5, 'Instruments CP requis pour règle'),
('CE1.MA.G4.1', 'CP.MA.G3.2', 'required', 80, 2.5, 'Tracés CP requis pour segments'),

('CE1.MA.G4.2', 'CP.MA.G3.1', 'required', 80, 2.5, 'Instruments CP requis pour équerre'),
('CE1.MA.G4.2', 'CP.MA.G3.2', 'required', 80, 2.5, 'Tracés CP requis pour angles droits'),

('CE1.MA.G4.3', 'CP.MA.G3.1', 'required', 80, 2.5, 'Instruments CP requis pour compas'),
('CE1.MA.G4.3', 'CP.MA.G3.2', 'required', 80, 2.5, 'Tracés CP requis pour cercles'),

('CE1.MA.G4.4', 'CP.MA.G3.2', 'required', 80, 2.5, 'Tracés CP requis pour construction précise'),
('CE1.MA.G4.4', 'CP.MA.G4.1', 'required', 80, 2.5, 'Règle CP requise pour construction'),
('CE1.MA.G4.4', 'CP.MA.G4.2', 'required', 80, 2.5, 'Équerre CP requise pour construction'),
('CE1.MA.G4.4', 'CP.MA.G4.3', 'required', 80, 2.5, 'Compas CP requis pour construction'),

('CE1.MA.G4.5', 'CP.MA.G3.2', 'required', 80, 2.5, 'Tracés CP requis pour vérification précision'),
('CE1.MA.G4.5', 'CP.MA.G4.4', 'required', 80, 2.5, 'Construction CP requise pour vérification'),

-- LECTURE DE DONNÉES (D1) - NEW in CE1, requires CP data foundation
('CE1.MA.D1.1', 'CP.MA.D1.1', 'required', 80, 2.5, 'Lecture données CP requise pour tableaux'),
('CE1.MA.D1.1', 'CP.MA.D1.2', 'required', 80, 2.5, 'Données CP requises pour tableaux simples'),

('CE1.MA.D1.2', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture données CP requise pour graphiques barres'),
('CE1.MA.D1.2', 'CP.MA.D1.3', 'required', 80, 2.5, 'Graphiques CP requis pour barres'),

('CE1.MA.D1.3', 'CP.MA.D1.3', 'required', 80, 2.5, 'Lecture données CP requise pour graphiques courbes'),
('CE1.MA.D1.3', 'CP.MA.D1.2', 'required', 80, 2.5, 'Graphiques CP requis pour courbes'),

('CE1.MA.D1.4', 'CP.MA.D1.4', 'required', 80, 2.5, 'Lecture données CP requise pour diagrammes'),
('CE1.MA.D1.4', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour diagrammes'),

('CE1.MA.D1.5', 'CP.MA.D1.4', 'required', 80, 2.5, 'Lecture données CP requise pour statistiques'),
('CE1.MA.D1.5', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour interprétation'),

-- ORGANISATION DE DONNÉES (D2) - NEW in CE1, requires CP data foundation
('CE1.MA.D2.1', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour organisation tableaux'),
('CE1.MA.D2.1', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture données CP requise pour organisation'),

('CE1.MA.D2.2', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour classement critères'),
('CE1.MA.D2.2', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture données CP requise pour classement'),

('CE1.MA.D2.3', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour tri ordre'),
('CE1.MA.D2.3', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture données CP requise pour tri'),

('CE1.MA.D2.4', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour groupement'),
('CE1.MA.D2.4', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture données CP requise pour groupement'),

('CE1.MA.D2.5', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour vérification cohérence'),
('CE1.MA.D2.5', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture données CP requise pour vérification'),

-- REPRÉSENTATION GRAPHIQUE (D3) - NEW in CE1, requires CP data foundation
('CE1.MA.D3.1', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture graphiques CP requise pour construction barres'),
('CE1.MA.D3.1', 'CP.MA.D1.3', 'required', 80, 2.5, 'Graphiques CP requis pour construction'),

('CE1.MA.D3.2', 'CP.MA.D1.3', 'required', 80, 2.5, 'Lecture graphiques CP requise pour construction courbes'),
('CE1.MA.D3.2', 'CP.MA.D1.2', 'required', 80, 2.5, 'Graphiques CP requis pour courbes'),

('CE1.MA.D3.3', 'CP.MA.D1.4', 'required', 80, 2.5, 'Lecture diagrammes CP requise pour circulaire'),
('CE1.MA.D3.3', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour diagramme circulaire'),

('CE1.MA.D3.4', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture graphiques CP requise pour choix type'),
('CE1.MA.D3.4', 'CP.MA.D1.3', 'required', 80, 2.5, 'Graphiques CP requis pour choix approprié'),

('CE1.MA.D3.5', 'CP.MA.D1.1', 'required', 80, 2.5, 'Données CP requises pour présentation claire'),
('CE1.MA.D3.5', 'CP.MA.D1.2', 'required', 80, 2.5, 'Lecture données CP requise pour lisibilité');
