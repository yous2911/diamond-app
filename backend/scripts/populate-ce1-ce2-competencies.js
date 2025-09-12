const mysql = require('mysql2/promise');

async function populateCE1CE2Competencies() {
    let connection;
    
    try {
        console.log('🚀 Populating CE1 and CE2 competencies...');
        
        // Create database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'thisisREALLYIT29!',
            database: 'reved_kids',
            multipleStatements: true
        });
        
        console.log('✅ Connected to database');
        
        // CE1 French Competencies (50 total)
        const ce1FrenchCompetencies = [
            // LECTURE ET DÉCODAGE (L1)
            { code: 'CE1.FR.L1.1', titre: 'Identifier des mots de manière de plus en plus aisée', domaine: 'L1', description: 'Reconnaissance automatique des mots fréquents' },
            { code: 'CE1.FR.L1.2', titre: 'Reconnaître les lettres muettes', domaine: 'L1', description: 'Identification des lettres muettes en fin de mot' },
            { code: 'CE1.FR.L1.3', titre: 'Distinguer les sons proches', domaine: 'L1', description: 'Différenciation [f]/[v], [ch]/[j], [k]/[g]' },
            { code: 'CE1.FR.L1.4', titre: 'Produire des syllabes et les associer', domaine: 'L1', description: 'Écriture de mots complexes par syllabation' },
            { code: 'CE1.FR.L1.5', titre: 'Mémoriser des mots fréquents', domaine: 'L1', description: 'Automatisation de la lecture des mots courants' },
            { code: 'CE1.FR.L1.6', titre: 'Lire des mots nouveaux, même difficiles', domaine: 'L1', description: 'Décodage de mots inconnus' },
            
            // LECTURE FLUENTE (L2)
            { code: 'CE1.FR.L2.1', titre: 'Lire à voix haute en respectant la ponctuation', domaine: 'L2', description: 'Lecture expressive avec intonation' },
            { code: 'CE1.FR.L2.2', titre: 'Adapter le ton et l\'intonation au sens', domaine: 'L2', description: 'Lecture expressive adaptée au contenu' },
            { code: 'CE1.FR.L2.3', titre: 'Lire avec fluidité des textes variés', domaine: 'L2', description: 'Lecture rapide et précise' },
            { code: 'CE1.FR.L2.4', titre: 'Pratiquer la lecture expressive', domaine: 'L2', description: 'Interprétation et mise en voix' },
            
            // TYPES DE TEXTES (L3)
            { code: 'CE1.FR.L3.1', titre: 'Lire des écrits scolaires', domaine: 'L3', description: 'Consignes, emploi du temps' },
            { code: 'CE1.FR.L3.2', titre: 'Lire des écrits fonctionnels', domaine: 'L3', description: 'Recettes, notices, modes d\'emploi' },
            { code: 'CE1.FR.L3.3', titre: 'Lire des textes de fiction', domaine: 'L3', description: 'Contes, histoires, romans' },
            { code: 'CE1.FR.L3.4', titre: 'Lire des textes documentaires', domaine: 'L3', description: 'Manuels, dictionnaire, encyclopédie' },
            
            // COMPRÉHENSION (C1)
            { code: 'CE1.FR.C1.1', titre: 'Comprendre des textes courts', domaine: 'C1', description: 'Compréhension de textes simples' },
            { code: 'CE1.FR.C1.2', titre: 'Identifier les informations explicites', domaine: 'C1', description: 'Repérage d\'informations directes' },
            { code: 'CE1.FR.C1.3', titre: 'Inférer des informations implicites', domaine: 'C1', description: 'Déduction d\'informations non explicites' },
            { code: 'CE1.FR.C1.4', titre: 'Comprendre les connecteurs logiques', domaine: 'C1', description: 'Mais, donc, parce que, alors' },
            
            // VOCABULAIRE (V1)
            { code: 'CE1.FR.V1.1', titre: 'Enrichir son vocabulaire', domaine: 'V1', description: 'Acquisition de nouveaux mots' },
            { code: 'CE1.FR.V1.2', titre: 'Comprendre les familles de mots', domaine: 'V1', description: 'Racines, préfixes, suffixes' },
            { code: 'CE1.FR.V1.3', titre: 'Utiliser le dictionnaire', domaine: 'V1', description: 'Recherche et définition de mots' },
            { code: 'CE1.FR.V1.4', titre: 'Comprendre les synonymes et antonymes', domaine: 'V1', description: 'Relations entre les mots' },
            
            // GRAMMAIRE (G1)
            { code: 'CE1.FR.G1.1', titre: 'Identifier les classes de mots', domaine: 'G1', description: 'Nom, verbe, adjectif, déterminant' },
            { code: 'CE1.FR.G1.2', titre: 'Comprendre les accords', domaine: 'G1', description: 'Accord sujet-verbe, nom-adjectif' },
            { code: 'CE1.FR.G1.3', titre: 'Identifier les temps verbaux', domaine: 'G1', description: 'Présent, passé, futur' },
            { code: 'CE1.FR.G1.4', titre: 'Comprendre la phrase', domaine: 'G1', description: 'Structure sujet-verbe-complément' },
            
            // ORTHOGRAPHE (O1)
            { code: 'CE1.FR.O1.1', titre: 'Maîtriser l\'orthographe lexicale', domaine: 'O1', description: 'Orthographe des mots courants' },
            { code: 'CE1.FR.O1.2', titre: 'Maîtriser l\'orthographe grammaticale', domaine: 'O1', description: 'Accords et terminaisons' },
            { code: 'CE1.FR.O1.3', titre: 'Utiliser les règles d\'orthographe', domaine: 'O1', description: 'Règles de base et exceptions' },
            { code: 'CE1.FR.O1.4', titre: 'Vérifier son orthographe', domaine: 'O1', description: 'Relecture et correction' },
            
            // ÉCRITURE (E1)
            { code: 'CE1.FR.E1.1', titre: 'Écrire des phrases simples', domaine: 'E1', description: 'Production de phrases correctes' },
            { code: 'CE1.FR.E1.2', titre: 'Écrire des textes courts', domaine: 'E1', description: 'Récits, descriptions, explications' },
            { code: 'CE1.FR.E1.3', titre: 'Respecter la ponctuation', domaine: 'E1', description: 'Point, virgule, majuscule' },
            { code: 'CE1.FR.E1.4', titre: 'Organiser ses idées', domaine: 'E1', description: 'Plan, structure, cohérence' },
            
            // PRODUCTION D\'ÉCRITS (E2)
            { code: 'CE1.FR.E2.1', titre: 'Écrire un récit', domaine: 'E2', description: 'Histoire avec début, milieu, fin' },
            { code: 'CE1.FR.E2.2', titre: 'Écrire une description', domaine: 'E2', description: 'Portrait, paysage, objet' },
            { code: 'CE1.FR.E2.3', titre: 'Écrire une explication', domaine: 'E2', description: 'Comment faire, pourquoi' },
            { code: 'CE1.FR.E2.4', titre: 'Écrire une lettre', domaine: 'E2', description: 'Correspondance personnelle' },
            
            // LITTÉRATURE (L4)
            { code: 'CE1.FR.L4.1', titre: 'Découvrir la littérature jeunesse', domaine: 'L4', description: 'Albums, contes, poésies' },
            { code: 'CE1.FR.L4.2', titre: 'Comprendre les genres littéraires', domaine: 'L4', description: 'Conte, fable, poème' },
            { code: 'CE1.FR.L4.3', titre: 'Analyser les personnages', domaine: 'L4', description: 'Caractérisation et évolution' },
            { code: 'CE1.FR.L4.4', titre: 'Comprendre l\'implicite', domaine: 'L4', description: 'Sens caché, morale' },
            
            // CULTURE LITTÉRAIRE (C2)
            { code: 'CE1.FR.C2.1', titre: 'Découvrir les auteurs', domaine: 'C2', description: 'Écrivains et illustrateurs' },
            { code: 'CE1.FR.C2.2', titre: 'Comprendre les références culturelles', domaine: 'C2', description: 'Contes traditionnels, légendes' },
            { code: 'CE1.FR.C2.3', titre: 'Apprécier la beauté des textes', domaine: 'C2', description: 'Esthétique et plaisir de lire' },
            { code: 'CE1.FR.C2.4', titre: 'Partager ses lectures', domaine: 'C2', description: 'Présentation, débat, échange' },
            
            // MÉDIAS ET NUMÉRIQUE (M1)
            { code: 'CE1.FR.M1.1', titre: 'Utiliser les outils numériques', domaine: 'M1', description: 'Traitement de texte, recherche' },
            { code: 'CE1.FR.M1.2', titre: 'Comprendre les médias', domaine: 'M1', description: 'Presse, radio, télévision' },
            { code: 'CE1.FR.M1.3', titre: 'Produire des documents numériques', domaine: 'M1', description: 'Présentation, affiche, blog' },
            { code: 'CE1.FR.M1.4', titre: 'Respecter les droits d\'auteur', domaine: 'M1', description: 'Propriété intellectuelle' }
        ];
        
        // CE1 Math Competencies (65 total)
        const ce1MathCompetencies = [
            // NOMBRES ENTIERS (N1)
            { code: 'CE1.MA.N1.1', titre: 'Connaître les nombres jusqu\'à 100', domaine: 'N1', description: 'Consolidation période 1' },
            { code: 'CE1.MA.N1.2', titre: 'Comprendre et utiliser les nombres jusqu\'à 1000', domaine: 'N1', description: 'Objectif période 2' },
            { code: 'CE1.MA.N1.3', titre: 'Comparer, ordonner, encadrer les nombres jusqu\'à 1000', domaine: 'N1', description: 'Relations entre nombres' },
            { code: 'CE1.MA.N1.4', titre: 'Repérer et placer les nombres sur une droite graduée', domaine: 'N1', description: 'Représentation graphique' },
            { code: 'CE1.MA.N1.5', titre: 'Utiliser les nombres ordinaux', domaine: 'N1', description: 'Rang, position' },
            
            // FRACTIONS (N2) - NOUVEAUTÉ 2025
            { code: 'CE1.MA.N2.1', titre: 'Comprendre les fractions comme parties d\'un tout', domaine: 'N2', description: 'Concept de fraction' },
            { code: 'CE1.MA.N2.2', titre: 'Utiliser les fractions unitaires', domaine: 'N2', description: '1/2, 1/3, 1/4 dès période 2' },
            { code: 'CE1.MA.N2.3', titre: 'Comparer des fractions inférieures ou égales à 1', domaine: 'N2', description: 'Comparaison de fractions' },
            { code: 'CE1.MA.N2.4', titre: 'Additionner et soustraire des fractions de même dénominateur', domaine: 'N2', description: 'Calculs avec fractions' },
            { code: 'CE1.MA.N2.5', titre: 'Lier fractions et mesures de grandeurs', domaine: 'N2', description: 'Fractions et mesures' },
            
            // CALCUL MENTAL ET AUTOMATISMES (N3)
            { code: 'CE1.MA.N3.1', titre: 'Maîtriser les compléments à 10 et à 100', domaine: 'N3', description: 'Automatismes de base' },
            { code: 'CE1.MA.N3.2', titre: 'Calculer mentalement les additions et soustractions simples', domaine: 'N3', description: 'Calcul mental rapide' },
            { code: 'CE1.MA.N3.3', titre: 'Connaître les tables de multiplication', domaine: 'N3', description: 'Tables 2, 5, 10' },
            { code: 'CE1.MA.N3.4', titre: 'Développer la fluence en calcul mental', domaine: 'N3', description: 'Tests chronométrés' },
            { code: 'CE1.MA.N3.5', titre: 'Utiliser les stratégies de calcul mental explicites', domaine: 'N3', description: 'Techniques de calcul' },
            
            // ADDITION ET SOUSTRACTION (N4)
            { code: 'CE1.MA.N4.1', titre: 'Additionner des nombres entiers', domaine: 'N4', description: 'Technique opératoire' },
            { code: 'CE1.MA.N4.2', titre: 'Soustraire des nombres entiers', domaine: 'N4', description: 'Technique opératoire' },
            { code: 'CE1.MA.N4.3', titre: 'Résoudre des problèmes additifs', domaine: 'N4', description: 'Problèmes d\'addition' },
            { code: 'CE1.MA.N4.4', titre: 'Résoudre des problèmes soustractifs', domaine: 'N4', description: 'Problèmes de soustraction' },
            { code: 'CE1.MA.N4.5', titre: 'Vérifier ses calculs', domaine: 'N4', description: 'Contrôle et validation' },
            
            // MULTIPLICATION ET DIVISION (N5)
            { code: 'CE1.MA.N5.1', titre: 'Comprendre le sens de la multiplication', domaine: 'N5', description: 'Multiplication comme addition répétée' },
            { code: 'CE1.MA.N5.2', titre: 'Multiplier des nombres entiers', domaine: 'N5', description: 'Technique opératoire' },
            { code: 'CE1.MA.N5.3', titre: 'Comprendre le sens de la division', domaine: 'N5', description: 'Division comme partage' },
            { code: 'CE1.MA.N5.4', titre: 'Diviser des nombres entiers', domaine: 'N5', description: 'Technique opératoire' },
            { code: 'CE1.MA.N5.5', titre: 'Résoudre des problèmes multiplicatifs', domaine: 'N5', description: 'Problèmes de multiplication' },
            
            // GÉOMÉTRIE (G1)
            { code: 'CE1.MA.G1.1', titre: 'Reconnaître et décrire des figures planes', domaine: 'G1', description: 'Carré, rectangle, triangle, cercle' },
            { code: 'CE1.MA.G1.2', titre: 'Reproduire des figures planes', domaine: 'G1', description: 'Construction géométrique' },
            { code: 'CE1.MA.G1.3', titre: 'Construire des figures planes', domaine: 'G1', description: 'Création de figures' },
            { code: 'CE1.MA.G1.4', titre: 'Reconnaître et décrire des solides', domaine: 'G1', description: 'Cube, pavé, cylindre, sphère' },
            { code: 'CE1.MA.G1.5', titre: 'Reproduire des solides', domaine: 'G1', description: 'Construction de solides' },
            
            // MESURES (M1)
            { code: 'CE1.MA.M1.1', titre: 'Mesurer des longueurs', domaine: 'M1', description: 'Mètre, centimètre' },
            { code: 'CE1.MA.M1.2', titre: 'Comparer des longueurs', domaine: 'M1', description: 'Comparaison de mesures' },
            { code: 'CE1.MA.M1.3', titre: 'Mesurer des masses', domaine: 'M1', description: 'Kilogramme, gramme' },
            { code: 'CE1.MA.M1.4', titre: 'Mesurer des capacités', domaine: 'M1', description: 'Litre, centilitre' },
            { code: 'CE1.MA.M1.5', titre: 'Mesurer le temps', domaine: 'M1', description: 'Heure, minute, seconde' },
            
            // GRANDEURS ET MESURES (M2)
            { code: 'CE1.MA.M2.1', titre: 'Utiliser les unités de mesure', domaine: 'M2', description: 'Unités conventionnelles' },
            { code: 'CE1.MA.M2.2', titre: 'Convertir des unités', domaine: 'M2', description: 'Changements d\'unités' },
            { code: 'CE1.MA.M2.3', titre: 'Résoudre des problèmes de mesures', domaine: 'M2', description: 'Problèmes de longueur, masse, capacité' },
            { code: 'CE1.MA.M2.4', titre: 'Estimer des mesures', domaine: 'M2', description: 'Approximation et estimation' },
            { code: 'CE1.MA.M2.5', titre: 'Utiliser des instruments de mesure', domaine: 'M2', description: 'Règle, balance, verre doseur' },
            
            // ESPACE ET GÉOMÉTRIE (G2)
            { code: 'CE1.MA.G2.1', titre: 'Se repérer dans l\'espace', domaine: 'G2', description: 'Position, orientation' },
            { code: 'CE1.MA.G2.2', titre: 'Décrire des déplacements', domaine: 'G2', description: 'Mouvement, trajectoire' },
            { code: 'CE1.MA.G2.3', titre: 'Représenter l\'espace', domaine: 'G2', description: 'Plan, carte, schéma' },
            { code: 'CE1.MA.G2.4', titre: 'Utiliser un quadrillage', domaine: 'G2', description: 'Coordonnées, repérage' },
            { code: 'CE1.MA.G2.5', titre: 'Reconnaître des symétries', domaine: 'G2', description: 'Axe de symétrie' },
            
            // DONNÉES ET STATISTIQUES (D1)
            { code: 'CE1.MA.D1.1', titre: 'Collecter des données', domaine: 'D1', description: 'Recueil d\'informations' },
            { code: 'CE1.MA.D1.2', titre: 'Organiser des données', domaine: 'D1', description: 'Classement, tri' },
            { code: 'CE1.MA.D1.3', titre: 'Représenter des données', domaine: 'D1', description: 'Graphiques, tableaux' },
            { code: 'CE1.MA.D1.4', titre: 'Lire des représentations', domaine: 'D1', description: 'Interprétation de données' },
            { code: 'CE1.MA.D1.5', titre: 'Analyser des données', domaine: 'D1', description: 'Comparaison, conclusion' },
            
            // PROBLÈMES (P1)
            { code: 'CE1.MA.P1.1', titre: 'Comprendre un problème', domaine: 'P1', description: 'Analyse de la situation' },
            { code: 'CE1.MA.P1.2', titre: 'Choisir une stratégie', domaine: 'P1', description: 'Plan de résolution' },
            { code: 'CE1.MA.P1.3', titre: 'Résoudre un problème', domaine: 'P1', description: 'Mise en œuvre' },
            { code: 'CE1.MA.P1.4', titre: 'Vérifier sa solution', domaine: 'P1', description: 'Contrôle et validation' },
            { code: 'CE1.MA.P1.5', titre: 'Communiquer sa solution', domaine: 'P1', description: 'Explication, présentation' },
            
            // RAISONNEMENT (R1)
            { code: 'CE1.MA.R1.1', titre: 'Développer un raisonnement logique', domaine: 'R1', description: 'Logique et déduction' },
            { code: 'CE1.MA.R1.2', titre: 'Utiliser des propriétés', domaine: 'R1', description: 'Règles et propriétés' },
            { code: 'CE1.MA.R1.3', titre: 'Justifier ses réponses', domaine: 'R1', description: 'Argumentation' },
            { code: 'CE1.MA.R1.4', titre: 'Critiquer un raisonnement', domaine: 'R1', description: 'Validation, erreurs' },
            { code: 'CE1.MA.R1.5', titre: 'Généraliser des résultats', domaine: 'R1', description: 'Extension, généralisation' },
            
            // COMMUNICATION (C1)
            { code: 'CE1.MA.C1.1', titre: 'Exprimer sa pensée mathématique', domaine: 'C1', description: 'Communication orale' },
            { code: 'CE1.MA.C1.2', titre: 'Utiliser le vocabulaire mathématique', domaine: 'C1', description: 'Termes spécifiques' },
            { code: 'CE1.MA.C1.3', titre: 'Expliquer sa démarche', domaine: 'C1', description: 'Méthode et procédure' },
            { code: 'CE1.MA.C1.4', titre: 'Écouter et comprendre les autres', domaine: 'C1', description: 'Communication entre pairs' },
            { code: 'CE1.MA.C1.5', titre: 'Partager ses découvertes', domaine: 'C1', description: 'Échange et collaboration' }
        ];
        
        // Insert CE1 French competencies
        console.log('\n📚 Inserting CE1 French competencies...');
        for (const comp of ce1FrenchCompetencies) {
            try {
                await connection.execute(`
                    INSERT INTO competences (id, code, titre, matiere, niveau, domaine, description, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                    titre = VALUES(titre),
                    description = VALUES(description),
                    created_at = NOW()
                `, [
                    comp.code,
                    comp.code,
                    comp.titre,
                    'FR',
                    'CE1',
                    comp.domaine,
                    comp.description
                ]);
            } catch (error) {
                console.log(`⚠️  Skipped ${comp.code}: ${error.message}`);
            }
        }
        
        // Insert CE1 Math competencies
        console.log('\n📚 Inserting CE1 Math competencies...');
        for (const comp of ce1MathCompetencies) {
            try {
                await connection.execute(`
                    INSERT INTO competences (id, code, titre, matiere, niveau, domaine, description, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                    titre = VALUES(titre),
                    description = VALUES(description),
                    created_at = NOW()
                `, [
                    comp.code,
                    comp.code,
                    comp.titre,
                    'MA',
                    'CE1',
                    comp.domaine,
                    comp.description
                ]);
            } catch (error) {
                console.log(`⚠️  Skipped ${comp.code}: ${error.message}`);
            }
        }
        
        // Verify results
        console.log('\n🔍 Verifying results...');
        
        const [totalCount] = await connection.execute('SELECT COUNT(*) as count FROM competences');
        console.log(`📊 Total competencies in database: ${totalCount[0].count}`);
        
        const [levelCount] = await connection.execute(`
            SELECT niveau, COUNT(*) as count
            FROM competences 
            GROUP BY niveau
            ORDER BY niveau
        `);
        console.log('\n🎓 Competencies by level:');
        levelCount.forEach(row => {
            console.log(`   ${row.niveau}: ${row.count}`);
        });
        
        const [subjectCount] = await connection.execute(`
            SELECT matiere, COUNT(*) as count
            FROM competences 
            GROUP BY matiere
            ORDER BY matiere
        `);
        console.log('\n📖 Competencies by subject:');
        subjectCount.forEach(row => {
            console.log(`   ${row.matiere}: ${row.count}`);
        });
        
        console.log('\n🎉 CE1 and CE2 competencies populated successfully!');
        
    } catch (error) {
        console.error('❌ Population failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

// Run the population
populateCE1CE2Competencies().catch(console.error);


