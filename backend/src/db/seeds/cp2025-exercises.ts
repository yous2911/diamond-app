import { db } from '../connection';
import * as schema from '../schema';
import type { NewExercise } from '../schema';

async function seedCP2025Exercises(): Promise<void> {
  try {
    console.log('🌱 Seeding CP2025 exercises...');

    // Create sample exercises data with correct schema structure
    const exercisesData: NewExercise[] = [
      {
        titre: 'Addition simple',
        description: 'Combien font 2 + 3 ?',
        matiere: 'mathematiques',
        niveau: 'CP',
        difficulte: 'decouverte',
        competenceCode: 'MATH_ADD_01',
        typeExercice: 'multiple-choice',
        type: 'multiple-choice',
        contenu: {
          question: 'Combien font 2 + 3 ?',
          options: ['4', '5', '6', '7'],
          type: 'multiple-choice'
        },
        solution: {
          correctAnswer: '5',
          explanation: '2 + 3 = 5'
        },
        pointsRecompense: 10,
        tempsEstime: 60,
        xp: 10,
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        titre: 'Soustraction simple',
        description: 'Combien font 10 - 4 ?',
        matiere: 'mathematiques',
        niveau: 'CP',
        difficulte: 'decouverte',
        competenceCode: 'MATH_SUB_01',
        typeExercice: 'fill-in-blank',
        type: 'fill-in-blank',
        contenu: {
          question: 'Combien font 10 - 4 ?',
          type: 'calculation'
        },
        solution: {
          correctAnswer: '6',
          explanation: '10 - 4 = 6'
        },
        pointsRecompense: 10,
        tempsEstime: 90,
        xp: 10,
        ordre: 2,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        titre: 'Lecture de mots simples',
        description: 'Lis le mot affiché',
        matiere: 'francais',
        niveau: 'CP',
        difficulte: 'decouverte',
        competenceCode: 'FR_READ_01',
        typeExercice: 'text-input',
        type: 'text-input',
        contenu: {
          question: 'Lis ce mot : "CHAT"',
          word: 'chat',
          type: 'reading'
        },
        solution: {
          correctAnswer: 'chat',
          explanation: 'Le mot est "chat"'
        },
        pointsRecompense: 15,
        tempsEstime: 120,
        xp: 15,
        ordre: 1,
        estActif: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Insert the exercises
    await db.insert(schema.exercises).values(exercisesData);
    
    console.log('✅ CP2025 exercises seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding CP2025 exercises:', error);
    throw error;
  }
}

export { seedCP2025Exercises };

// Run if called directly
if (require.main === module) {
  seedCP2025Exercises()
    .then(() => {
      console.log('✅ CP2025 seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ CP2025 seeding failed:', error);
      process.exit(1);
    });
}