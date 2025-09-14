import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseLecture } from '../ExerciseLecture';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      const { initial, animate, ...domProps } = props;
      return <div className={className} {...domProps}>{children}</div>;
    }
  }
}));

describe('ExerciseLecture', () => {
  const mockOnAnswerChange = jest.fn();
  
  const defaultExercise = {
    configuration: {
      texte: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      question: 'Que signifie Lorem ipsum?',
      typeQuestion: 'Compréhension',
      solution: 'Un texte de remplissage'
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

  it('renders the text to read', () => {
    render(<ExerciseLecture {...defaultProps} />);
    
    expect(screen.getByText('📖 Texte à lire :')).toBeInTheDocument();
    expect(screen.getByText('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')).toBeInTheDocument();
  });

  it('renders the question', () => {
    render(<ExerciseLecture {...defaultProps} />);
    
    expect(screen.getByText('Que signifie Lorem ipsum?')).toBeInTheDocument();
  });

  it('renders the question type when provided', () => {
    render(<ExerciseLecture {...defaultProps} />);
    
    expect(screen.getByText('Type de question :')).toBeInTheDocument();
    expect(screen.getByText('Compréhension')).toBeInTheDocument();
  });

  it('does not render question type when not provided', () => {
    const exerciseWithoutType = {
      configuration: {
        texte: 'Text',
        question: 'Question?',
        solution: 'Answer'
      }
    };
    
    render(<ExerciseLecture {...defaultProps} exercise={exerciseWithoutType} />);
    
    expect(screen.queryByText('Type de question :')).not.toBeInTheDocument();
  });

  it('renders textarea for answer input', () => {
    render(<ExerciseLecture {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('calls onAnswerChange when text is typed', async () => {
    const user = userEvent.setup();
    render(<ExerciseLecture {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    await user.type(textarea, 'Ma réponse');
    
    expect(mockOnAnswerChange).toHaveBeenCalledWith('Ma réponse');
  });

  it('trims whitespace when calling onAnswerChange', async () => {
    const user = userEvent.setup();
    render(<ExerciseLecture {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    await user.type(textarea, '  test  ');
    
    expect(mockOnAnswerChange).toHaveBeenLastCalledWith('test');
  });

  it('displays current answer in textarea', () => {
    render(<ExerciseLecture {...defaultProps} currentAnswer="Ma réponse actuelle" />);
    
    const textarea = screen.getByDisplayValue('Ma réponse actuelle');
    expect(textarea).toBeInTheDocument();
  });

  it('shows character counter', async () => {
    const user = userEvent.setup();
    render(<ExerciseLecture {...defaultProps} />);
    
    expect(screen.getByText('0 caractères')).toBeInTheDocument();
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    await user.type(textarea, 'Hello');
    
    expect(screen.getByText('5 caractères')).toBeInTheDocument();
  });

  it('disables textarea when disabled prop is true', () => {
    render(<ExerciseLecture {...defaultProps} disabled={true} />);
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toBeDisabled();
  });

  it('shows reading tips', () => {
    render(<ExerciseLecture {...defaultProps} />);
    
    expect(screen.getByText('💡')).toBeInTheDocument();
    expect(screen.getByText('Conseils :')).toBeInTheDocument();
    expect(screen.getByText('• Relis le texte plusieurs fois si nécessaire')).toBeInTheDocument();
    expect(screen.getByText('• Surligne les informations importantes')).toBeInTheDocument();
    expect(screen.getByText('• Vérifie ta réponse dans le texte')).toBeInTheDocument();
  });

  it('shows correct validation styling for correct answer', () => {
    render(
      <ExerciseLecture 
        {...defaultProps} 
        currentAnswer="Un texte de remplissage"
        showValidation={true}
      />
    );
    
    const textarea = screen.getByPlaceholderText('Écris ta réponse ici...');
    expect(textarea).toHaveClass('border-green-500', 'bg-green-50');
  });

  it('shows incorrect validation styling for wrong answer', () => {
    render(
      <ExerciseLecture 
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
      <ExerciseLecture 
        {...defaultProps} 
        currentAnswer="Un texte de remplissage"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('shows X mark for wrong answer when validation is shown', () => {
    render(
      <ExerciseLecture 
        {...defaultProps} 
        currentAnswer="Mauvaise réponse"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('shows success feedback for correct answer', () => {
    render(
      <ExerciseLecture 
        {...defaultProps} 
        currentAnswer="Un texte de remplissage"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('📚')).toBeInTheDocument();
    expect(screen.getByText('Excellente compréhension !')).toBeInTheDocument();
  });

  it('shows failure feedback with expected answer for wrong answer', () => {
    render(
      <ExerciseLecture 
        {...defaultProps} 
        currentAnswer="Mauvaise réponse"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('🤔')).toBeInTheDocument();
    expect(screen.getByText('Relis le texte attentivement')).toBeInTheDocument();
    expect(screen.getByText('Réponse attendue :')).toBeInTheDocument();
    expect(screen.getByText('Un texte de remplissage')).toBeInTheDocument();
  });

  it('handles case-insensitive comparison', () => {
    render(
      <ExerciseLecture 
        {...defaultProps} 
        currentAnswer="UN TEXTE DE REMPLISSAGE"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('Excellente compréhension !')).toBeInTheDocument();
  });

  it('handles answers with extra whitespace', () => {
    render(
      <ExerciseLecture 
        {...defaultProps} 
        currentAnswer="  Un texte de remplissage  "
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('uses bonneReponse as fallback for expected answer', () => {
    const exerciseWithBonneReponse = {
      configuration: {
        texte: 'Text',
        question: 'Question?',
        bonneReponse: 'Bonne réponse'
      }
    };
    
    render(
      <ExerciseLecture 
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
    render(<ExerciseLecture {...defaultProps} exercise={exerciseWithoutConfig} />);
    
    // Should not crash
    expect(screen.getByPlaceholderText('Écris ta réponse ici...')).toBeInTheDocument();
  });

  it('handles missing text gracefully', () => {
    const exerciseWithoutText = {
      configuration: {
        question: 'Question without text?',
        solution: 'Answer'
      }
    };
    
    render(<ExerciseLecture {...defaultProps} exercise={exerciseWithoutText} />);
    
    expect(screen.getByText('Question without text?')).toBeInTheDocument();
  });

  it('handles numeric answers correctly', () => {
    const numericExercise = {
      configuration: {
        texte: 'Il y a 42 pommes.',
        question: 'Combien de pommes?',
        solution: 42
      }
    };
    
    render(
      <ExerciseLecture 
        {...defaultProps} 
        exercise={numericExercise}
        currentAnswer={42}
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });
});