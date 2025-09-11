import React from 'react';
import { render, screen, act } from '@testing-library/react-native';
import ExerciseScreen from '../../../src/screens/student/ExerciseScreen';
import * as exerciseService from '../../../src/services/exerciseService';
import { MathExercise } from '../../../src/types/exercise';

jest.mock('../../../src/services/exerciseService');

const mockExercise: MathExercise = {
  id: '1',
  type: 'math',
  question: '10 + 5 = ?',
  answer: 15,
};

describe('ExerciseScreen', () => {
  it('fetches and displays an exercise', async () => {
    (exerciseService.getMathExercise as jest.Mock).mockResolvedValue(mockExercise);

    render(<ExerciseScreen />);

    // The component shows a loader initially, then fetches the exercise.
    // We need to wait for the exercise to be displayed.
    await act(async () => {
      // Let the useEffect run
    });

    const question = await screen.findByText('10 + 5 = ?');
    expect(question).toBeDefined();
  });
});
