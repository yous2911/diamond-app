"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseSetup = exports.resetDatabase = exports.setupDatabase = void 0;
const connection_1 = require("./connection");
const schema_1 = require("./schema");
const drizzle_orm_1 = require("drizzle-orm");
async function setupDatabase() {
    try {
        console.log('🔄 Setting up database...');
        // Test the database connection
        const testResult = await connection_1.db.execute((0, drizzle_orm_1.sql) `SELECT 1 as test`);
        console.log('✅ Database connection test successful');
        // For MySQL with Drizzle, tables should be created using migrations
        // But we can check if tables exist and seed data if needed
        console.log('✅ Using Drizzle schema for table management');
        // Check if we already have data
        try {
            const existingStudents = await connection_1.db.select().from(schema_1.students).limit(1);
            if (existingStudents.length === 0) {
                console.log('🌱 Seeding database with test data...');
                // Insert test students
                const insertedStudents = await connection_1.db.insert(schema_1.students).values([
                    {
                        prenom: 'Alice',
                        nom: 'Dupont',
                        dateNaissance: new Date('2015-03-15'),
                        niveauActuel: 'CP',
                        niveauScolaire: 'CP',
                        totalPoints: 150,
                        serieJours: 5,
                        mascotteType: 'dragon'
                    },
                    {
                        prenom: 'Lucas',
                        nom: 'Martin',
                        dateNaissance: new Date('2014-08-22'),
                        niveauActuel: 'CE1',
                        niveauScolaire: 'CE1',
                        totalPoints: 320,
                        serieJours: 12,
                        mascotteType: 'robot'
                    },
                    {
                        prenom: 'Emma',
                        nom: 'Bernard',
                        dateNaissance: new Date('2015-11-08'),
                        niveauActuel: 'CP',
                        niveauScolaire: 'CP',
                        totalPoints: 85,
                        serieJours: 3,
                        mascotteType: 'fairy'
                    }
                ]);
                // Insert test exercises
                await connection_1.db.insert(schema_1.exercises).values([
                    {
                        titre: 'Addition simple',
                        description: 'Apprendre à additionner des nombres simples',
                        matiere: 'mathematiques',
                        niveau: 'CP',
                        difficulte: 'decouverte',
                        competenceCode: 'MATH_ADD_01',
                        typeExercice: 'calcul',
                        contenu: { question: 'Combien font 2 + 3 ?', type: 'addition' },
                        solution: { bonneReponse: '5' },
                        xp: 10,
                        pointsRecompense: 10
                    },
                    {
                        titre: 'Lecture de mots',
                        description: 'Lire des mots simples',
                        matiere: 'francais',
                        niveau: 'CP',
                        difficulte: 'decouverte',
                        competenceCode: 'FR_READ_01',
                        typeExercice: 'lecture',
                        contenu: { question: 'Lis le mot : "chat"', type: 'lecture' },
                        solution: { bonneReponse: 'chat' },
                        xp: 15,
                        pointsRecompense: 15
                    },
                    {
                        titre: 'Géométrie - Formes',
                        description: 'Reconnaître les formes géométriques',
                        matiere: 'mathematiques',
                        niveau: 'CP',
                        difficulte: 'application',
                        competenceCode: 'MATH_GEO_01',
                        typeExercice: 'geometrie',
                        contenu: { question: 'Quelle forme a 4 côtés égaux ?', type: 'geometrie' },
                        solution: { bonneReponse: 'carré' },
                        xp: 20,
                        pointsRecompense: 20
                    }
                ]);
                console.log('✅ Test data seeded successfully');
            }
            else {
                console.log('✅ Database already has data, skipping seed');
            }
        }
        catch (error) {
            console.log('⚠️  Could not check/seed data - tables may not exist yet');
            console.log('   This is normal if running migrations separately');
        }
        console.log('🎉 Database setup complete!');
    }
    catch (error) {
        console.error('❌ Database setup failed:', error);
        throw error;
    }
}
exports.setupDatabase = setupDatabase;
async function resetDatabase() {
    try {
        console.log('🔄 Resetting database...');
        // Delete all data (but keep table structure)
        await connection_1.db.delete(schema_1.studentProgress);
        await connection_1.db.delete(schema_1.sessions);
        await connection_1.db.delete(schema_1.revisions);
        await connection_1.db.delete(schema_1.exercises);
        await connection_1.db.delete(schema_1.students);
        console.log('✅ Database reset complete');
        // Re-seed with fresh data
        await setupDatabase();
    }
    catch (error) {
        console.error('❌ Database reset failed:', error);
        throw error;
    }
}
exports.resetDatabase = resetDatabase;
async function checkDatabaseSetup() {
    try {
        // Check if key tables exist and have data
        const studentCount = await connection_1.db.select().from(schema_1.students).then(rows => rows.length);
        const exerciseCount = await connection_1.db.select().from(schema_1.exercises).then(rows => rows.length);
        console.log(`📊 Database status: ${studentCount} students, ${exerciseCount} exercises`);
        return {
            isSetup: studentCount > 0 && exerciseCount > 0,
            studentCount,
            exerciseCount
        };
    }
    catch (error) {
        console.error('❌ Database check failed:', error);
        return {
            isSetup: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
exports.checkDatabaseSetup = checkDatabaseSetup;
