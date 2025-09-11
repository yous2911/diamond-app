import { MathExercise } from '../types/exercise';

// This is a mock service. In a real app, this would fetch from an API.
export const getMathExercise = async (): Promise<MathExercise> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const num1 = Math.floor(Math.random() * 10) + 1;
      const num2 = Math.floor(Math.random() * 10) + 1;
      const exercise: MathExercise = {
        id: `math-${Date.now()}`,
        type: 'math',
        question: `${num1} + ${num2} = ?`,
        answer: num1 + num2,
      };
      resolve(exercise);
    }, 500);
  });
};
