import { create } from 'zustand';
import { ExerciseState, Exercise } from '../types/exercise';

const useExerciseStore = create<ExerciseState>((set) => ({
  currentExercise: null,
  userAnswer: null,
  isCorrect: null,
  score: 0,
  startExercise: (exercise: Exercise) => set({ currentExercise: exercise, userAnswer: null, isCorrect: null }),
  submitAnswer: (answer: string) => set((state) => {
    if (!state.currentExercise) return {};
    let isCorrect = false;
    if (state.currentExercise.type === 'math') {
      isCorrect = parseInt(answer, 10) === (state.currentExercise as any).answer;
    }
    return {
      userAnswer: answer,
      isCorrect,
      score: isCorrect ? state.score + 1 : state.score,
    };
  }),
  nextExercise: () => set({ currentExercise: null, userAnswer: null, isCorrect: null }),
}));

export default useExerciseStore;
