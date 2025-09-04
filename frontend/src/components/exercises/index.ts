// Export all exercise components
export { ExerciseQCM } from './ExerciseQCM';
export { ExerciseCalcul } from './ExerciseCalcul';
export { ExerciseTextLibre } from './ExerciseTextLibre';
export { ExerciseConjugaison } from './ExerciseConjugaison';
export { ExerciseLecture } from './ExerciseLecture';
export { ExerciseComprehension } from './ExerciseComprehension';
export { ExerciseEcriture } from './ExerciseEcriture';
export { ExerciseCalculMental } from './ExerciseCalculMental';

// Export existing components
export { default as DragDropExercise } from './DragDropExercise';
export { default as MentalMathExercise } from './MentalMathExercise';

// Exercise type mapping
export const EXERCISE_COMPONENTS = {
  QCM: 'ExerciseQCM',
  CALCUL: 'ExerciseCalcul',
  TEXT_LIBRE: 'ExerciseTextLibre',
  CONJUGAISON: 'ExerciseConjugaison',
  LECTURE: 'ExerciseLecture',
  COMPREHENSION: 'ExerciseComprehension',
  ECRITURE: 'ExerciseEcriture',
  CALCUL_MENTAL: 'ExerciseCalculMental',
  DRAG_DROP: 'DragDropExercise',
  MENTAL_MATH: 'MentalMathExercise'
} as const;

export type ExerciseType = keyof typeof EXERCISE_COMPONENTS;
