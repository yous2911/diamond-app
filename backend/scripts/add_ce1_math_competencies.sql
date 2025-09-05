-- Add CE1 2025 Math Competencies to Database
-- This script adds all 65 Math CE1 competencies

-- =============================================================================
-- MATH CE1 COMPETENCIES (65 total)
-- =============================================================================

-- NOMBRES ENTIERS (N1)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.N1.1', 'CE1', 'MATHEMATIQUES', 'N1', 1, 1, 'Connaître les nombres jusqu''à 100 (consolidation période 1)'),
('CE1.MA.N1.2', 'CE1', 'MATHEMATIQUES', 'N1', 1, 2, 'Comprendre et utiliser les nombres jusqu''à 1000 (objectif période 2)'),
('CE1.MA.N1.3', 'CE1', 'MATHEMATIQUES', 'N1', 1, 3, 'Comparer, ordonner, encadrer les nombres jusqu''à 1000'),
('CE1.MA.N1.4', 'CE1', 'MATHEMATIQUES', 'N1', 1, 4, 'Repérer et placer les nombres sur une droite graduée'),
('CE1.MA.N1.5', 'CE1', 'MATHEMATIQUES', 'N1', 1, 5, 'Utiliser les nombres ordinaux (rang, position)');

-- FRACTIONS (N2) - NOUVEAUTÉ 2025
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.N2.1', 'CE1', 'MATHEMATIQUES', 'N2', 2, 1, 'Comprendre les fractions comme parties d''un tout'),
('CE1.MA.N2.2', 'CE1', 'MATHEMATIQUES', 'N2', 2, 2, 'Utiliser les fractions unitaires (1/2, 1/3, 1/4) dès période 2'),
('CE1.MA.N2.3', 'CE1', 'MATHEMATIQUES', 'N2', 2, 3, 'Comparer des fractions inférieures ou égales à 1'),
('CE1.MA.N2.4', 'CE1', 'MATHEMATIQUES', 'N2', 2, 4, 'Additionner et soustraire des fractions de même dénominateur'),
('CE1.MA.N2.5', 'CE1', 'MATHEMATIQUES', 'N2', 2, 5, 'Lier fractions et mesures de grandeurs');

-- CALCUL MENTAL ET AUTOMATISMES (N3)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.N3.1', 'CE1', 'MATHEMATIQUES', 'N3', 3, 1, 'Maîtriser les compléments à 10 et à 100'),
('CE1.MA.N3.2', 'CE1', 'MATHEMATIQUES', 'N3', 3, 2, 'Calculer mentalement les additions et soustractions simples'),
('CE1.MA.N3.3', 'CE1', 'MATHEMATIQUES', 'N3', 3, 3, 'Connaître les tables de multiplication (2, 5, 10)'),
('CE1.MA.N3.4', 'CE1', 'MATHEMATIQUES', 'N3', 3, 4, 'Développer la fluence en calcul mental (tests chronométrés)'),
('CE1.MA.N3.5', 'CE1', 'MATHEMATIQUES', 'N3', 3, 5, 'Utiliser les stratégies de calcul mental explicites');

-- CALCUL POSÉ (N4)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.N4.1', 'CE1', 'MATHEMATIQUES', 'N4', 4, 1, 'Effectuer des additions posées avec retenue'),
('CE1.MA.N4.2', 'CE1', 'MATHEMATIQUES', 'N4', 4, 2, 'Effectuer des soustractions posées avec retenue'),
('CE1.MA.N4.3', 'CE1', 'MATHEMATIQUES', 'N4', 4, 3, 'Vérifier ses calculs posés'),
('CE1.MA.N4.4', 'CE1', 'MATHEMATIQUES', 'N4', 4, 4, 'Utiliser les techniques opératoires de manière fluide'),
('CE1.MA.N4.5', 'CE1', 'MATHEMATIQUES', 'N4', 4, 5, 'Résoudre des problèmes nécessitant des calculs posés');

-- RÉSOLUTION DE PROBLÈMES (N5)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.N5.1', 'CE1', 'MATHEMATIQUES', 'N5', 5, 1, 'Résoudre des problèmes arithmétiques simples (minimum 10 par semaine)'),
('CE1.MA.N5.2', 'CE1', 'MATHEMATIQUES', 'N5', 5, 2, 'Identifier les informations pertinentes dans un problème'),
('CE1.MA.N5.3', 'CE1', 'MATHEMATIQUES', 'N5', 5, 3, 'Choisir l''opération appropriée pour résoudre un problème'),
('CE1.MA.N5.4', 'CE1', 'MATHEMATIQUES', 'N5', 5, 4, 'Utiliser des procédures par analogie entre problèmes'),
('CE1.MA.N5.5', 'CE1', 'MATHEMATIQUES', 'N5', 5, 5, 'Vérifier la cohérence de sa réponse avec le problème');

-- LONGUEURS (M1)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.M1.1', 'CE1', 'MATHEMATIQUES', 'M1', 1, 1, 'Comparer des longueurs par superposition et report'),
('CE1.MA.M1.2', 'CE1', 'MATHEMATIQUES', 'M1', 1, 2, 'Utiliser les unités de longueur (cm, m)'),
('CE1.MA.M1.3', 'CE1', 'MATHEMATIQUES', 'M1', 1, 3, 'Mesurer des longueurs avec une règle graduée'),
('CE1.MA.M1.4', 'CE1', 'MATHEMATIQUES', 'M1', 1, 4, 'Estimer des longueurs avant de mesurer'),
('CE1.MA.M1.5', 'CE1', 'MATHEMATIQUES', 'M1', 1, 5, 'Résoudre des problèmes impliquant des longueurs');

-- MASSES (M2)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.M2.1', 'CE1', 'MATHEMATIQUES', 'M2', 2, 1, 'Comparer des masses par manipulation'),
('CE1.MA.M2.2', 'CE1', 'MATHEMATIQUES', 'M2', 2, 2, 'Utiliser les unités de masse (g, kg)'),
('CE1.MA.M2.3', 'CE1', 'MATHEMATIQUES', 'M2', 2, 3, 'Mesurer des masses avec une balance'),
('CE1.MA.M2.4', 'CE1', 'MATHEMATIQUES', 'M2', 2, 4, 'Estimer des masses avant de mesurer'),
('CE1.MA.M2.5', 'CE1', 'MATHEMATIQUES', 'M2', 2, 5, 'Résoudre des problèmes impliquant des masses');

-- CONTENANCES (M3)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.M3.1', 'CE1', 'MATHEMATIQUES', 'M3', 3, 1, 'Comparer des contenances par transvasement'),
('CE1.MA.M3.2', 'CE1', 'MATHEMATIQUES', 'M3', 3, 2, 'Utiliser l''unité de contenance (L)'),
('CE1.MA.M3.3', 'CE1', 'MATHEMATIQUES', 'M3', 3, 3, 'Mesurer des contenances avec des récipients gradués'),
('CE1.MA.M3.4', 'CE1', 'MATHEMATIQUES', 'M3', 3, 4, 'Estimer des contenances avant de mesurer'),
('CE1.MA.M3.5', 'CE1', 'MATHEMATIQUES', 'M3', 3, 5, 'Résoudre des problèmes impliquant des contenances');

-- TEMPS ET DURÉES (M4)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.M4.1', 'CE1', 'MATHEMATIQUES', 'M4', 4, 1, 'Lire l''heure sur une horloge à aiguilles (heures et demi-heures)'),
('CE1.MA.M4.2', 'CE1', 'MATHEMATIQUES', 'M4', 4, 2, 'Lire l''heure sur une horloge à aiguilles (quarts d''heure)'),
('CE1.MA.M4.3', 'CE1', 'MATHEMATIQUES', 'M4', 4, 3, 'Calculer des durées simples'),
('CE1.MA.M4.4', 'CE1', 'MATHEMATIQUES', 'M4', 4, 4, 'Utiliser un calendrier pour repérer des dates'),
('CE1.MA.M4.5', 'CE1', 'MATHEMATIQUES', 'M4', 4, 5, 'Résoudre des problèmes impliquant le temps');

-- MONNAIE (M5)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.M5.1', 'CE1', 'MATHEMATIQUES', 'M5', 5, 1, 'Reconnaître les pièces et billets en euros'),
('CE1.MA.M5.2', 'CE1', 'MATHEMATIQUES', 'M5', 5, 2, 'Calculer des sommes d''argent'),
('CE1.MA.M5.3', 'CE1', 'MATHEMATIQUES', 'M5', 5, 3, 'Rendre la monnaie sur des achats simples'),
('CE1.MA.M5.4', 'CE1', 'MATHEMATIQUES', 'M5', 5, 4, 'Écrire des prix avec la virgule'),
('CE1.MA.M5.5', 'CE1', 'MATHEMATIQUES', 'M5', 5, 5, 'Résoudre des problèmes impliquant la monnaie');

-- REPÉRAGE ET DÉPLACEMENTS (G1)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.G1.1', 'CE1', 'MATHEMATIQUES', 'G1', 1, 1, 'Se repérer dans l''espace proche'),
('CE1.MA.G1.2', 'CE1', 'MATHEMATIQUES', 'G1', 1, 2, 'Utiliser le vocabulaire spatial (devant, derrière, à gauche, à droite)'),
('CE1.MA.G1.3', 'CE1', 'MATHEMATIQUES', 'G1', 1, 3, 'Se déplacer selon des consignes spatiales'),
('CE1.MA.G1.4', 'CE1', 'MATHEMATIQUES', 'G1', 1, 4, 'Repérer des positions sur un quadrillage'),
('CE1.MA.G1.5', 'CE1', 'MATHEMATIQUES', 'G1', 1, 5, 'Programmer des déplacements simples');

-- FIGURES GÉOMÉTRIQUES PLANES (G2)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.G2.1', 'CE1', 'MATHEMATIQUES', 'G2', 2, 1, 'Reconnaître et nommer les figures planes (carré, rectangle, triangle, cercle)'),
('CE1.MA.G2.2', 'CE1', 'MATHEMATIQUES', 'G2', 2, 2, 'Décrire les propriétés des figures planes'),
('CE1.MA.G2.3', 'CE1', 'MATHEMATIQUES', 'G2', 2, 3, 'Reproduire des figures planes sur quadrillage'),
('CE1.MA.G2.4', 'CE1', 'MATHEMATIQUES', 'G2', 2, 4, 'Construire des figures planes avec des instruments'),
('CE1.MA.G2.5', 'CE1', 'MATHEMATIQUES', 'G2', 2, 5, 'Reconnaître la symétrie axiale');

-- SOLIDES (G3)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.G3.1', 'CE1', 'MATHEMATIQUES', 'G3', 3, 1, 'Reconnaître et nommer les solides (cube, pavé, cylindre, sphère)'),
('CE1.MA.G3.2', 'CE1', 'MATHEMATIQUES', 'G3', 3, 2, 'Décrire les propriétés des solides'),
('CE1.MA.G3.3', 'CE1', 'MATHEMATIQUES', 'G3', 3, 3, 'Associer des solides à leurs patrons'),
('CE1.MA.G3.4', 'CE1', 'MATHEMATIQUES', 'G3', 3, 4, 'Construire des solides avec des matériaux'),
('CE1.MA.G3.5', 'CE1', 'MATHEMATIQUES', 'G3', 3, 5, 'Résoudre des problèmes impliquant des solides');

-- CONSTRUCTION ET TRACÉS (G4)
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.G4.1', 'CE1', 'MATHEMATIQUES', 'G4', 4, 1, 'Utiliser la règle pour tracer des segments'),
('CE1.MA.G4.2', 'CE1', 'MATHEMATIQUES', 'G4', 4, 2, 'Utiliser l''équerre pour tracer des angles droits'),
('CE1.MA.G4.3', 'CE1', 'MATHEMATIQUES', 'G4', 4, 3, 'Utiliser le compas pour tracer des cercles'),
('CE1.MA.G4.4', 'CE1', 'MATHEMATIQUES', 'G4', 4, 4, 'Construire des figures géométriques précises'),
('CE1.MA.G4.5', 'CE1', 'MATHEMATIQUES', 'G4', 4, 5, 'Vérifier la précision de ses constructions');

-- LECTURE DE DONNÉES (D1) - NOUVEAUTÉ 2025
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.D1.1', 'CE1', 'MATHEMATIQUES', 'D1', 1, 1, 'Lire des données dans un tableau simple'),
('CE1.MA.D1.2', 'CE1', 'MATHEMATIQUES', 'D1', 1, 2, 'Lire des données dans un graphique en barres'),
('CE1.MA.D1.3', 'CE1', 'MATHEMATIQUES', 'D1', 1, 3, 'Lire des données dans un graphique en courbes'),
('CE1.MA.D1.4', 'CE1', 'MATHEMATIQUES', 'D1', 1, 4, 'Extraire des informations d''un diagramme'),
('CE1.MA.D1.5', 'CE1', 'MATHEMATIQUES', 'D1', 1, 5, 'Interpréter des données statistiques simples');

-- ORGANISATION DE DONNÉES (D2) - NOUVEAUTÉ 2025
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.D2.1', 'CE1', 'MATHEMATIQUES', 'D2', 2, 1, 'Organiser des données dans un tableau'),
('CE1.MA.D2.2', 'CE1', 'MATHEMATIQUES', 'D2', 2, 2, 'Classer des données selon des critères'),
('CE1.MA.D2.3', 'CE1', 'MATHEMATIQUES', 'D2', 2, 3, 'Trier des données par ordre croissant/décroissant'),
('CE1.MA.D2.4', 'CE1', 'MATHEMATIQUES', 'D2', 2, 4, 'Grouper des données similaires'),
('CE1.MA.D2.5', 'CE1', 'MATHEMATIQUES', 'D2', 2, 5, 'Vérifier la cohérence de l''organisation des données');

-- REPRÉSENTATION GRAPHIQUE (D3) - NOUVEAUTÉ 2025
INSERT INTO cp2025_competence_codes (code, niveau, matiere, domaine, numero, competence, description) VALUES
('CE1.MA.D3.1', 'CE1', 'MATHEMATIQUES', 'D3', 3, 1, 'Construire un graphique en barres simple'),
('CE1.MA.D3.2', 'CE1', 'MATHEMATIQUES', 'D3', 3, 2, 'Construire un graphique en courbes simple'),
('CE1.MA.D3.3', 'CE1', 'MATHEMATIQUES', 'D3', 3, 3, 'Construire un diagramme circulaire simple'),
('CE1.MA.D3.4', 'CE1', 'MATHEMATIQUES', 'D3', 3, 4, 'Choisir le type de graphique approprié'),
('CE1.MA.D3.5', 'CE1', 'MATHEMATIQUES', 'D3', 3, 5, 'Présenter des données de manière claire et lisible');

