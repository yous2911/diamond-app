export type ExerciseType = 'math' | 'french' | 'qcm' | 'drag_drop' | 'audio' | 'story';

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
}

export interface MathExercise extends Exercise {
  type: 'math';
  answer: number;
}

export interface QCMExercise extends Exercise {
  type: 'qcm';
  options: string[];
  correctOptionIndex: number;
}

export interface ExerciseState {
  currentExercise: Exercise | null;
  userAnswer: string | null;
  isCorrect: boolean | null;
  score: number;
  startExercise: (exercise: Exercise) => void;
  submitAnswer: (answer: string) => void;
  nextExercise: () => void;
}
