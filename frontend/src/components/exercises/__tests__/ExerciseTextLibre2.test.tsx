import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseTextLibre } from '../ExerciseTextLibre';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      const { initial, animate, ...domProps } = props;
      return <div className={className} {...domProps}>{children}</div>;
    }
  }
}));

describe('ExerciseTextLibre', () => {
  const mockOnAnswerChange = jest.fn();
  
  const defaultExercise = {
    configuration: {
      question: 'Écris un petit paragraphe sur ton animal préféré.',
      solution: 'Mon animal préféré est le chat.'
    }
  };

  const defaultProps = {
    exercise: defaultExercise,
    onAnswerChange: mockOnAnswerChange,
    disabled: false,
    currentAnswer: '',
    showValidation: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the question', () => {
    render(<ExerciseTextLibre {...defaultProps} />);
    
    expect(screen.getByText('Écris un petit paragraphe sur ton animal préféré.')).toBeInTheDocument();
  });

  it('renders textarea for answer input', () => {
    render(<ExerciseTextLibre {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('calls onAnswerChange when text is typed', async () => {
    const user = userEvent.setup();
    render(<ExerciseTextLibre {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    await user.type(textarea, 'Ma réponse');
    
    expect(mockOnAnswerChange).toHaveBeenCalledWith('Ma réponse');
  });

  it('trims whitespace when calling onAnswerChange', async () => {
    const user = userEvent.setup();
    render(<ExerciseTextLibre {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    await user.type(textarea, '  test  ');
    
    expect(mockOnAnswerChange).toHaveBeenLastCalledWith('test');
  });

  it('displays current answer in textarea', () => {
    render(<ExerciseTextLibre {...defaultProps} currentAnswer="Ma réponse actuelle" />);
    
    const textarea = screen.getByDisplayValue('Ma réponse actuelle');
    expect(textarea).toBeInTheDocument();
  });

  it('shows character counter', async () => {
    const user = userEvent.setup();
    render(<ExerciseTextLibre {...defaultProps} />);
    
    expect(screen.getByText('0 caractères')).toBeInTheDocument();
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    await user.type(textarea, 'Hello');
    
    expect(screen.getByText('5 caractères')).toBeInTheDocument();
  });

  it('disables textarea when disabled prop is true', () => {
    render(<ExerciseTextLibre {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toBeDisabled();
  });

  it('shows conjugation tip for CONJUGAISON type exercises', () => {
    const conjugationExercise = { ...defaultExercise, type: 'CONJUGAISON' };
    render(<ExerciseTextLibre {...defaultProps} exercise={conjugationExercise} />);
    
    expect(screen.getByText('💡 Pense au temps, à la personne et aux terminaisons')).toBeInTheDocument();
  });

  it('shows reading tip for LECTURE type exercises', () => {
    const lectureExercise = { ...defaultExercise, type: 'LECTURE' };
    render(<ExerciseTextLibre {...defaultProps} exercise={lectureExercise} />);
    
    expect(screen.getByText('📖 Relis le texte si tu as besoin')).toBeInTheDocument();
  });

  it('does not show tips for other exercise types', () => {
    const otherExercise = { ...defaultExercise, type: 'OTHER' };
    render(<ExerciseTextLibre {...defaultProps} exercise={otherExercise} />);
    
    expect(screen.queryByText('💡 Pense au temps, à la personne et aux terminaisons')).not.toBeInTheDocument();
    expect(screen.queryByText('📖 Relis le texte si tu as besoin')).not.toBeInTheDocument();
  });

  it('shows correct validation styling for correct answer', () => {
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        currentAnswer="Mon animal préféré est le chat."
        showValidation={true}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toHaveClass('border-green-500', 'bg-green-50');
  });

  it('shows incorrect validation styling for wrong answer', () => {
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        currentAnswer="Mauvaise réponse"
        showValidation={true}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toHaveClass('border-red-500', 'bg-red-50');
  });

  it('shows checkmark for correct answer when validation is shown', () => {
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        currentAnswer="Mon animal préféré est le chat."
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('shows X mark for wrong answer when validation is shown', () => {
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        currentAnswer="Mauvaise réponse"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('shows success feedback for correct answer', () => {
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        currentAnswer="Mon animal préféré est le chat."
        showValidation={true}
      />
    );
    
    expect(screen.getByText('📝')).toBeInTheDocument();
    expect(screen.getByText('Très bien écrit !')).toBeInTheDocument();
  });

  it('shows failure feedback with expected answer for wrong answer', () => {
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        currentAnswer="Mauvaise réponse"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✏️')).toBeInTheDocument();
    expect(screen.getByText('Presque !')).toBeInTheDocument();
    expect(screen.getByText('Réponse attendue :')).toBeInTheDocument();
    expect(screen.getByText('Mon animal préféré est le chat.')).toBeInTheDocument();
  });

  it('handles case-insensitive comparison', () => {
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        currentAnswer="MON ANIMAL PRÉFÉRÉ EST LE CHAT."
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('Très bien écrit !')).toBeInTheDocument();
  });

  it('handles answers with extra whitespace', () => {
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        currentAnswer="  Mon animal préféré est le chat.  "
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('uses bonneReponse as fallback for expected answer', () => {
    const exerciseWithBonneReponse = {
      configuration: {
        question: 'Question?',
        bonneReponse: 'Bonne réponse'
      }
    };
    
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        exercise={exerciseWithBonneReponse}
        currentAnswer="Mauvaise réponse"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('Bonne réponse')).toBeInTheDocument();
  });

  it('handles exercise without configuration', () => {
    const exerciseWithoutConfig = { configuration: null };
    render(<ExerciseTextLibre {...defaultProps} exercise={exerciseWithoutConfig} />);
    
    // Should not crash
    expect(screen.getByPlaceholderText('Écris ta réponse ici...')).toBeInTheDocument();
  });

  it('handles missing question gracefully', () => {
    const exerciseWithoutQuestion = {
      configuration: {
        solution: 'Answer'
      }
    };
    
    render(<ExerciseTextLibre {...defaultProps} exercise={exerciseWithoutQuestion} />);
    
    expect(screen.getByPlaceholderText('Écris ta réponse ici...')).toBeInTheDocument();
  });

  it('handles numeric answers correctly', () => {
    const numericExercise = {
      configuration: {
        question: 'Combien font 2 + 2?',
        solution: 4
      }
    };
    
    render(
      <ExerciseTextLibre 
        {...defaultProps} 
        exercise={numericExercise}
        currentAnswer={4}
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('prevents Enter key when disabled', async () => {
    const user = userEvent.setup();
    render(<ExerciseTextLibre {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    await user.type(textarea, '{enter}');
    
    // Should not crash or cause issues
    expect(textarea).toBeDisabled();
  });

  it('applies correct CSS classes to textarea', () => {
    render(<ExerciseTextLibre {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toHaveClass(
      'w-full', 'text-lg', 'p-4', 'rounded-xl', 'border-2',
      'resize-none', 'transition-all', 'duration-200', 'focus:outline-none',
      'border-gray-300', 'focus:border-blue-500'
    );
  });

  it('applies disabled styles when disabled', () => {
    render(<ExerciseTextLibre {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
  });

  it('maintains focus and cursor position during typing', async () => {
    const user = userEvent.setup();
    render(<ExerciseTextLibre {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    await user.click(textarea);
    await user.type(textarea, 'Test');
    
    expect(textarea).toHaveFocus();
    expect(textarea).toHaveValue('Test');
  });
});