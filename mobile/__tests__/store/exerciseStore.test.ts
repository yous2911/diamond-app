import useExerciseStore from '../../src/store/exerciseStore';
import { MathExercise } from '../../src/types/exercise';

const initialStoreState = useExerciseStore.getState();

describe('exerciseStore', () => {
  beforeEach(() => {
    useExerciseStore.setState(initialStoreState);
  });

  it('should start an exercise', () => {
    const exercise: MathExercise = {
      id: '1',
      type: 'math',
      question: '2 + 2 = ?',
      answer: 4,
    };
    useExerciseStore.getState().startExercise(exercise);
    expect(useExerciseStore.getState().currentExercise).toEqual(exercise);
    expect(useExerciseStore.getState().userAnswer).toBeNull();
    expect(useExerciseStore.getState().isCorrect).toBeNull();
  });

  it('should handle a correct answer', () => {
    const exercise: MathExercise = {
      id: '1',
      type: 'math',
      question: '2 + 2 = ?',
      answer: 4,
    };
    useExerciseStore.getState().startExercise(exercise);
    useExerciseStore.getState().submitAnswer('4');
    expect(useExerciseStore.getState().isCorrect).toBe(true);
    expect(useExerciseStore.getState().score).toBe(1);
  });

  it('should handle an incorrect answer', () => {
    const exercise: MathExercise = {
      id: '1',
      type: 'math',
      question: '2 + 2 = ?',
      answer: 4,
    };
    useExerciseStore.getState().startExercise(exercise);
    useExerciseStore.getState().submitAnswer('5');
    expect(useExerciseStore.getState().isCorrect).toBe(false);
    expect(useExerciseStore.getState().score).toBe(0);
  });
});
