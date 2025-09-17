import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseTextLibre, ExerciseTextLibreProps } from '../ExerciseTextLibre';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    ...jest.requireActual('framer-motion'),
    motion: {
        ...jest.requireActual('framer-motion').motion,
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    }
}));


const mockExercise = {
  configuration: {
    question: 'Que penses-tu des dragons ?',
    solution: 'J\'aime les dragons.',
  },
};

describe('ExerciseTextLibre', () => {
  const defaultProps: ExerciseTextLibreProps = {
    exercise: mockExercise,
    onAnswerChange: jest.fn(),
    disabled: false,
    currentAnswer: '',
    showValidation: false,
  };

  it('should render the exercise question', () => {
    render(<ExerciseTextLibre {...defaultProps} />);
    expect(screen.getByText('Que penses-tu des dragons ?')).toBeInTheDocument();
  });

  it('should call onAnswerChange when the user types in the textarea', () => {
    const onAnswerChange = jest.fn();
    render(<ExerciseTextLibre {...defaultProps} onAnswerChange={onAnswerChange} />);
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');

    fireEvent.change(textarea, { target: { value: 'Les dragons sont cool.' } });

    expect(onAnswerChange).toHaveBeenCalledWith('Les dragons sont cool.');
  });

  it('should display the character count', () => {
    render(<ExerciseTextLibre {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');

    fireEvent.change(textarea, { target: { value: 'Test' } });

    expect(screen.getByText('4 caractères')).toBeInTheDocument();
  });

  it('should be disabled when the disabled prop is true', () => {
    render(<ExerciseTextLibre {...defaultProps} disabled={true} />);
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toBeDisabled();
  });

  it('should show validation feedback when showValidation is true (correct answer)', () => {
    render(
      <ExerciseTextLibre
        {...defaultProps}
        currentAnswer="J'aime les dragons."
        showValidation={true}
      />
    );
    expect(screen.getByText('Très bien écrit !')).toBeInTheDocument();
  });

  it('should show validation feedback when showValidation is true (incorrect answer)', () => {
    render(
      <ExerciseTextLibre
        {...defaultProps}
        currentAnswer="Je n'aime pas les dragons."
        showValidation={true}
      />
    );
    expect(screen.getByText('Presque !')).toBeInTheDocument();
    expect(screen.getByText("Réponse attendue :")).toBeInTheDocument();
    expect(screen.getByText("J'aime les dragons.")).toBeInTheDocument();
  });
});
