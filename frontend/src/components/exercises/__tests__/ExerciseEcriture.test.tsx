import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseEcriture, ExerciseEcritureProps } from '../ExerciseEcriture';

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
    consigne: 'Écris une histoire sur un dragon.',
    theme: 'Fantastique',
    typeEcriture: 'RECIT',
    longueurMin: 10,
    longueurMax: 50,
    solution: 'This is not checked in this exercise type usually.',
  },
};

describe('ExerciseEcriture', () => {
  const defaultProps: ExerciseEcritureProps = {
    exercise: mockExercise,
    onAnswerChange: jest.fn(),
    disabled: false,
    currentAnswer: '',
    showValidation: false,
  };

  it('should render the exercise instructions and constraints', () => {
    render(<ExerciseEcriture {...defaultProps} />);
    expect(screen.getByText('📝 Consigne :')).toBeInTheDocument();
    expect(screen.getByText('Écris une histoire sur un dragon.')).toBeInTheDocument();
    expect(screen.getByText('Thème :')).toBeInTheDocument();
    expect(screen.getByText('Fantastique')).toBeInTheDocument();
    expect(screen.getByText(/10 à 50 mots/i)).toBeInTheDocument();
  });

  it('should call onAnswerChange when the user types in the textarea', () => {
    const onAnswerChange = jest.fn();
    render(<ExerciseEcriture {...defaultProps} onAnswerChange={onAnswerChange} />);
    const textarea = screen.getByPlaceholderText('Écris ton texte ici...');

    fireEvent.change(textarea, { target: { value: 'Il était une fois' } });

    expect(onAnswerChange).toHaveBeenCalledWith('Il était une fois');
  });

  it('should display the correct word and character count', () => {
    render(<ExerciseEcriture {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Écris ton texte ici...');

    fireEvent.change(textarea, { target: { value: 'Un dragon rouge.' } });

    expect(screen.getByText('📝 3 mots')).toBeInTheDocument();
    expect(screen.getByText('📊 16 caractères')).toBeInTheDocument();
  });

  it('should show length validation feedback', () => {
    render(<ExerciseEcriture {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Écris ton texte ici...');

    // Too short
    fireEvent.change(textarea, { target: { value: 'Trop court.' } });
    expect(screen.getByText('⚠️ Vérifie la longueur')).toBeInTheDocument();

    // Just right
    fireEvent.change(textarea, { target: { value: 'Il était une fois un grand dragon qui dormait dans une caverne.' } });
    expect(screen.getByText('✅ Longueur correcte')).toBeInTheDocument();
  });

  it('should show validation feedback when showValidation is true', () => {
    const exerciseWithSolution = {
      configuration: {
        ...mockExercise.configuration,
        // For écriture, validation is often simpler, let's assume it checks for a keyword
        solution: 'dragon',
      }
    };

    // "Correct" case (let's pretend it's a simple contains check for the test)
    const { rerender } = render(
      <ExerciseEcriture
        {...defaultProps}
        exercise={exerciseWithSolution}
        currentAnswer="un gentil dragon"
        showValidation={true}
      />
    );
    // This component's validation logic is based on exact match.
    // Let's adjust the test to match the component's logic.
    rerender(
        <ExerciseEcriture
          {...defaultProps}
          exercise={{configuration: {solution: 'dragon'}}}
          currentAnswer="dragon"
          showValidation={true}
        />
      );
    expect(screen.getByText('Excellent travail d\'écriture !')).toBeInTheDocument();

    // Incorrect case
    rerender(
      <ExerciseEcriture
        {...defaultProps}
        exercise={{configuration: {solution: 'dragon'}}}
        currentAnswer="un gentil chat"
        showValidation={true}
      />
    );
    expect(screen.getByText('Relis ta consigne')).toBeInTheDocument();
    expect(screen.getByText('Réponse attendue :')).toBeInTheDocument();
  });
});
