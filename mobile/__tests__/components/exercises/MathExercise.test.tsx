import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import MathExercise from '../../../src/components/exercises/MathExercise';
import { MathExercise as MathExerciseType } from '../../../src/types/exercise';
import useExerciseStore from '../../../src/store/exerciseStore';

const mockExercise: MathExerciseType = {
  id: '1',
  type: 'math',
  question: '5 + 3 = ?',
  answer: 8,
};

// Mock the store
jest.mock('../../../src/store/exerciseStore');

describe('MathExercise', () => {
  it('renders the question', () => {
    (useExerciseStore as jest.Mock).mockReturnValue({
      submitAnswer: jest.fn(),
      userAnswer: null,
      isCorrect: null
    });
    render(<MathExercise exercise={mockExercise} />);
    const question = screen.getByText('5 + 3 = ?');
    expect(question).toBeDefined();
  });

  it('calls submitAnswer on button press', () => {
    const submitAnswerMock = jest.fn();
    (useExerciseStore as jest.Mock).mockReturnValue({
      submitAnswer: submitAnswerMock,
      userAnswer: null,
      isCorrect: null
    });
    render(<MathExercise exercise={mockExercise} />);
    const input = screen.getByPlaceholderText('Your answer');
    fireEvent.changeText(input, '8');
    const button = screen.getByText('Submit');
    fireEvent.press(button);
    expect(submitAnswerMock).toHaveBeenCalledWith('8');
  });
});
