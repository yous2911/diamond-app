// =============================================================================
// 🔄 EXERCISE ADAPTER - CONVERTS LEGACY EXERCISES TO FRONTEND FORMAT
// =============================================================================

interface LegacyExercise {
  id: number;
  titre: string;
  competence_id: string;
  niveau: string;
  matiere: string;
  contenu: any;
  difficulty_level: number;
  created_at: string;
  updated_at: string;
}

interface FrontendExercise {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  type: string;
  explanation?: string;
}

export function adaptLegacyExercise(legacy: LegacyExercise): FrontendExercise {
  try {
    const content = typeof legacy.contenu === 'string' 
      ? JSON.parse(legacy.contenu) 
      : legacy.contenu;

    // Handle different exercise types
    switch (content.type) {
      case 'multiple_choice':
        return {
          id: legacy.id.toString(),
          question: content.question || legacy.titre,
          options: content.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: content.correct_answer || 0,
          difficulty: getDifficultyFromLevel(legacy.difficulty_level),
          subject: getSubjectName(legacy.matiere),
          type: 'qcm',
          explanation: content.explanation
        };

      case 'drag_drop':
        return {
          id: legacy.id.toString(),
          question: content.instruction || legacy.titre,
          options: content.items?.map((item: any) => item.text) || ['Élément 1', 'Élément 2', 'Élément 3'],
          correctAnswer: 0, // Default for drag & drop
          difficulty: getDifficultyFromLevel(legacy.difficulty_level),
          subject: getSubjectName(legacy.matiere),
          type: 'drag_drop',
          explanation: 'Glisse les éléments aux bons endroits'
        };

      case 'texte_libre':
        return {
          id: legacy.id.toString(),
          question: content.instruction || legacy.titre,
          options: ['Réponse libre'], // For text input
          correctAnswer: 0,
          difficulty: getDifficultyFromLevel(legacy.difficulty_level),
          subject: getSubjectName(legacy.matiere),
          type: 'text_input',
          explanation: content.hints?.[0] || 'Écris ta réponse'
        };

      default:
        // Fallback for unknown types
        return {
          id: legacy.id.toString(),
          question: legacy.titre,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          difficulty: getDifficultyFromLevel(legacy.difficulty_level),
          subject: getSubjectName(legacy.matiere),
          type: 'qcm',
          explanation: 'Réponds à la question'
        };
    }
  } catch (error) {
    console.warn('Error adapting exercise:', error);
    // Return a safe fallback
    return {
      id: legacy.id.toString(),
      question: legacy.titre,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      difficulty: getDifficultyFromLevel(legacy.difficulty_level),
      subject: getSubjectName(legacy.matiere),
      type: 'qcm',
      explanation: 'Réponds à la question'
    };
  }
}

function getDifficultyFromLevel(level: number): 'easy' | 'medium' | 'hard' {
  if (level <= 1) return 'easy';
  if (level <= 2) return 'medium';
  return 'hard';
}

function getSubjectName(matiere: string): string {
  switch (matiere.toLowerCase()) {
    case 'ma':
    case 'mathematiques':
      return 'Mathématiques';
    case 'fr':
    case 'francais':
      return 'Français';
    case 'sc':
    case 'sciences':
      return 'Sciences';
    case 'hg':
    case 'histoire_geographie':
      return 'Histoire-Géographie';
    case 'en':
    case 'anglais':
      return 'Anglais';
    default:
      return matiere;
  }
}

export function adaptLegacyExercises(legacyExercises: LegacyExercise[]): FrontendExercise[] {
  return legacyExercises.map(adaptLegacyExercise);
}

// Type guard to check if an exercise is a legacy exercise
function isLegacyExercise(exercise: any): exercise is LegacyExercise {
  return exercise && typeof exercise.titre === 'string' && typeof exercise.competence_id === 'string';
}

// Adapter function that can handle both Exercise and LegacyExercise types
export function adaptExercises(exercises: any[]): FrontendExercise[] {
  return exercises.map(exercise => {
    if (isLegacyExercise(exercise)) {
      return adaptLegacyExercise(exercise);
    } else {
      // Handle modern Exercise type
      return {
        id: exercise.id.toString(),
        question: exercise.question || 'Question',
        options: exercise.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof exercise.correctAnswer === 'string' 
          ? exercise.options?.indexOf(exercise.correctAnswer) || 0
          : exercise.correctAnswer || 0,
        difficulty: getDifficultyFromLevel(exercise.difficultyLevel || 1),
        subject: exercise.metadata?.subject || getSubjectFromCompetenceId(exercise.competenceId),
        type: exercise.type?.toLowerCase() || 'qcm',
        explanation: exercise.metadata?.explanation
      };
    }
  });
}

function getSubjectFromCompetenceId(competenceId: number): string {
  // Map competence IDs to subjects (this would need to be updated based on your actual competence mapping)
  const competenceMap: { [key: number]: string } = {
    1: 'Mathématiques',
    2: 'Mathématiques', 
    3: 'Français',
    4: 'Mathématiques',
    5: 'Français',
    6: 'Mathématiques',
    7: 'Français',
    8: 'Mathématiques',
    9: 'Sciences',
    10: 'Histoire-Géographie',
    11: 'Anglais'
  };
  return competenceMap[competenceId] || 'Général';
}

