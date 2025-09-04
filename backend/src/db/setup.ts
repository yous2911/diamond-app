import { db } from './connection';
import { 
  students, 
  exercises, 
  studentProgress,
  sessions,
  revisions,
  modules,
  parentalConsent,
  gdprRequests,
  auditLogs,
  encryptionKeys,
  retentionPolicies,
  consentPreferences,
  gdprConsentRequests,
  gdprDataProcessingLog
} from './schema';
import { sql } from 'drizzle-orm';
import { config } from '../config/config';

export async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Test the database connection
    const testResult = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection test successful');

    // For MySQL with Drizzle, tables should be created using migrations
    // But we can check if tables exist and seed data if needed
    console.log('✅ Using Drizzle schema for table management');

    // Check if we already have data
    try {
      const existingStudents = await db.select().from(students).limit(1);
      
      if (existingStudents.length === 0) {
        console.log('🌱 Seeding database with test data...');
        
        // Insert test students
        const insertedStudents = await db.insert(students).values([
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
        await db.insert(exercises).values([
          {
            titre: 'Addition simple',
            description: 'Apprendre à additionner des nombres simples',
            matiere: 'mathematiques',
            niveau: 'CP',
            difficulte: 'decouverte',
            competenceCode: 'MATH_ADD_01',
            typeExercice: 'calcul',
            type: 'CALCUL',
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
            type: 'LECTURE',
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
            type: 'GEOMETRIE',
            contenu: { question: 'Quelle forme a 4 côtés égaux ?', type: 'geometrie' },
            solution: { bonneReponse: 'carré' },
            xp: 20,
            pointsRecompense: 20
          }
        ]);

        console.log('✅ Test data seeded successfully');
      } else {
        console.log('✅ Database already has data, skipping seed');
      }
    } catch (error) {
      console.log('⚠️  Could not check/seed data - tables may not exist yet');
      console.log('   This is normal if running migrations separately');
    }

    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

export async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Delete all data (but keep table structure)
    await db.delete(studentProgress);
    await db.delete(sessions);
    await db.delete(revisions);
    await db.delete(exercises);
    await db.delete(students);
    
    console.log('✅ Database reset complete');
    
    // Re-seed with fresh data
    await setupDatabase();
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  }
}

export async function checkDatabaseSetup() {
  try {
    // Check if key tables exist and have data
    const studentCount = await db.select().from(students).then(rows => rows.length);
    const exerciseCount = await db.select().from(exercises).then(rows => rows.length);
    
    console.log(`📊 Database status: ${studentCount} students, ${exerciseCount} exercises`);
    
    return {
      isSetup: studentCount > 0 && exerciseCount > 0,
      studentCount,
      exerciseCount
    };
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return {
      isSetup: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}