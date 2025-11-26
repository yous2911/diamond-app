import { db } from './connection';
import * as schema from './schema';

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed students
    console.log('📚 Seeding students...');
    const students = await db.insert(schema.students).values([
      {
        prenom: 'Lucas',
        nom: 'Martin',
        dateNaissance: new Date('2014-05-15'),
        niveauActuel: 'CE2',
        niveauScolaire: 'CE2',
        totalPoints: 150,
        serieJours: 3,
        mascotteType: 'dragon',
        dernierAcces: null,
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        prenom: 'Emma',
        nom: 'Dubois',
        dateNaissance: new Date('2013-09-22'),
        niveauActuel: 'CE2',
        niveauScolaire: 'CE2',
        totalPoints: 220,
        serieJours: 7,
        mascotteType: 'unicorn',
        dernierAcces: null,
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        prenom: 'Noah',
        nom: 'Lefevre',
        dateNaissance: new Date('2015-01-10'),
        niveauActuel: 'CE1',
        niveauScolaire: 'CE1',
        totalPoints: 95,
        serieJours: 2,
        mascotteType: 'robot',
        dernierAcces: null,
        estConnecte: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('✅ Students seeded successfully');

    // Seed modules
    console.log('📖 Seeding modules...');
    const modules = await db.insert(schema.modules).values([
      {
        titre: 'Les nombres jusqu\'à 100',
        matiere: 'mathematiques',
        niveau: 'CE1',
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        titre: 'Les verbes du premier groupe',
        matiere: 'francais',
        niveau: 'CE2',
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        titre: 'Les planètes',
        matiere: 'sciences',
        niveau: 'CM1',
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('✅ Modules seeded successfully');

    // Seed exercises
    console.log('🎯 Seeding exercises...');
    const exercisesToInsert: NewExercise[] = [
      {
        titre: 'Compter de 10 en 10',
        description: 'Complète la suite : 10, 20, ___, 40, 50',
        matiere: 'mathematiques',
        niveau: 'CE1',
        difficulte: 'decouverte',
        competenceCode: 'MATH_COUNT_01',
        typeExercice: 'multiple-choice',
        contenu: {
          question: 'Complète la suite : 10, 20, ___, 40, 50',
          options: ['25', '30', '35', '45'],
          type: 'multiple-choice'
        },
        solution: {
          correctAnswer: '30',
          explanation: 'En comptant de 10 en 10, après 20 vient 30'
        },
        xp: 10,
        pointsRecompense: 10,
        tempsEstime: 60,
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        titre: 'Addition simple',
        description: 'Calcule : 15 + 8',
        matiere: 'mathematiques',
        niveau: 'CE1',
        difficulte: 'decouverte',
        competenceCode: 'MATH_ADD_01',
        typeExercice: 'calculation',
        contenu: {
          question: 'Calcule : 15 + 8',
          operand1: 15,
          operand2: 8,
          operator: '+',
          type: 'calculation'
        },
        solution: {
          correctAnswer: '23',
          explanation: '15 + 8 = 23'
        },
        xp: 10,
        pointsRecompense: 10,
        tempsEstime: 90,
        ordre: 2,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        titre: 'Conjugaison présent',
        description: 'Conjugue le verbe "manger" à la 3ème personne du singulier',
        matiere: 'francais',
        niveau: 'CE2',
        difficulte: 'application',
        competenceCode: 'FR_CONJ_01',
        typeExercice: 'text-input',
        contenu: {
          question: 'Il/Elle ... (manger)',
          verb: 'manger',
          tense: 'present',
          person: 'third_singular',
          type: 'conjugation'
        },
        solution: {
          correctAnswer: 'mange',
          explanation: 'Le verbe "manger" à la 3ème personne du singulier au présent : il/elle mange'
        },
        xp: 15,
        pointsRecompense: 15,
        tempsEstime: 120,
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    await db.insert(schema.exercises).values(exercisesToInsert);
    console.log('✅ Exercises seeded successfully');

    // Seed some sample progress
    console.log('📈 Seeding sample progress...');
    await db.insert(schema.studentProgress).values([
      {
        studentId: 1,
        exerciseId: 1,
        competenceCode: 'MATH_COUNT_01',
        masteryLevel: 'mastered',
        totalAttempts: 1,
        successfulAttempts: 1,
        averageScore: '85.00',
        bestScore: '85.00',
        progressPercent: '100.00',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        studentId: 1,
        exerciseId: 2,
        competenceCode: 'MATH_ADD_01',
        masteryLevel: 'mastered',
        totalAttempts: 1,
        successfulAttempts: 1,
        averageScore: '90.00',
        bestScore: '90.00',
        progressPercent: '100.00',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);

    console.log('✅ Sample progress seeded successfully');
    console.log('🎉 Database seeding completed successfully!');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Database seeding failed:', errorMessage);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(errorMessage);
  }
}

// CLI interface
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Seeding failed:', errorMessage);
      process.exit(1);
    });
}