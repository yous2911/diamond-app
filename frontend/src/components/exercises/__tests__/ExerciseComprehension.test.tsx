import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseComprehension } from '../ExerciseComprehension';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    textarea: ({ value, onChange, onKeyPress, className, disabled, ...props }: any) => (
      <textarea
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
        className={className}
        disabled={disabled}
        data-testid="motion-textarea"
        {...props}
      />
    ),
    p: ({ children, className, ...props }: any) => (
      <p className={className} data-testid="motion-p" {...props}>
        {children}
      </p>
    ),
    h3: ({ children, className, ...props }: any) => (
      <h3 className={className} data-testid="motion-h3" {...props}>
        {children}
      </h3>
    )
  }
}));

const mockExercise = {
  id: 1,
  configuration: {
    texte: 'Il était une fois un petit prince qui habitait sur une planète.',
    question: 'Où habitait le petit prince ?',
    contexte: 'Lecture d\'un extrait du Petit Prince',
    typeComprehension: 'littérale'
  }
};

const defaultProps = {
  exercise: mockExercise,
  onAnswerChange: jest.fn(),
  disabled: false,
  currentAnswer: null,
  showValidation: false
};

describe('ExerciseComprehension', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the exercise component', () => {
    render(<ExerciseComprehension {...defaultProps} />);

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('displays the text to read', () => {
    render(<ExerciseComprehension {...defaultProps} />);

    expect(screen.getByText('Il était une fois un petit prince qui habitait sur une planète.')).toBeInTheDocument();
  });

  it('displays the comprehension question', () => {
    render(<ExerciseComprehension {...defaultProps} />);

    expect(screen.getByText('Où habitait le petit prince ?')).toBeInTheDocument();
  });

  it('shows context information', () => {
    render(<ExerciseComprehension {...defaultProps} />);

    expect(screen.getByText('Lecture d\'un extrait du Petit Prince')).toBeInTheDocument();
  });

  it('displays comprehension type', () => {
    render(<ExerciseComprehension {...defaultProps} />);

    expect(screen.getByText('littérale')).toBeInTheDocument();
  });

  it('shows textarea for answer input', () => {
    render(<ExerciseComprehension {...defaultProps} />);

    const textarea = screen.getByTestId('motion-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('handles answer input changes', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseComprehension {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const textarea = screen.getByTestId('motion-textarea');
    fireEvent.change(textarea, { target: { value: 'Sur une planète' } });

    expect(textarea).toHaveValue('Sur une planète');
    expect(mockOnAnswerChange).toHaveBeenCalledWith('Sur une planète');
  });

  it('trims whitespace from answers', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseComprehension {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const textarea = screen.getByTestId('motion-textarea');
    fireEvent.change(textarea, { target: { value: '  Sur une planète  ' } });

    expect(mockOnAnswerChange).toHaveBeenCalledWith('Sur une planète');
  });

  it('handles Enter key press', () => {
    render(<ExerciseComprehension {...defaultProps} />);

    const textarea = screen.getByTestId('motion-textarea');
    fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter' });

    expect(textarea).toBeInTheDocument();
  });

  it('ignores Enter key when disabled', () => {
    render(<ExerciseComprehension {...defaultProps} disabled={true} />);

    const textarea = screen.getByTestId('motion-textarea');
    fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter' });

    expect(textarea).toBeInTheDocument();
  });

  it('shows current answer when provided', () => {
    render(<ExerciseComprehension {...defaultProps} currentAnswer="Sur une planète" />);

    const textarea = screen.getByTestId('motion-textarea');
    expect(textarea).toHaveValue('Sur une planète');
  });

  it('disables textarea when disabled prop is true', () => {
    render(<ExerciseComprehension {...defaultProps} disabled={true} />);

    const textarea = screen.getByTestId('motion-textarea');
    expect(textarea).toBeDisabled();
  });

  it('handles empty configuration gracefully', () => {
    const exerciseWithoutConfig = { id: 1, configuration: {} };
    render(<ExerciseComprehension {...defaultProps} exercise={exerciseWithoutConfig} />);

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles missing configuration gracefully', () => {
    const exerciseWithoutConfig = { id: 1 };
    render(<ExerciseComprehension {...defaultProps} exercise={exerciseWithoutConfig} />);

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('updates input value when currentAnswer changes', () => {
    const { rerender } = render(<ExerciseComprehension {...defaultProps} currentAnswer={null} />);

    const textarea = screen.getByTestId('motion-textarea');
    expect(textarea).toHaveValue('');

    rerender(<ExerciseComprehension {...defaultProps} currentAnswer="Nouvelle réponse" />);
    expect(textarea).toHaveValue('Nouvelle réponse');
  });

  it('handles validation state', () => {
    render(<ExerciseComprehension {...defaultProps} showValidation={true} />);

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles long text content', () => {
    const longTextExercise = {
      ...mockExercise,
      configuration: {
        ...mockExercise.configuration,
        texte: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)
      }
    };

    render(<ExerciseComprehension {...defaultProps} exercise={longTextExercise} />);

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles different comprehension types', () => {
    const inferentialExercise = {
      ...mockExercise,
      configuration: {
        ...mockExercise.configuration,
        typeComprehension: 'inférentielle'
      }
    };

    render(<ExerciseComprehension {...defaultProps} exercise={inferentialExercise} />);

    expect(screen.getByText('inférentielle')).toBeInTheDocument();
  });

  it('handles empty text input', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseComprehension {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const textarea = screen.getByTestId('motion-textarea');
    fireEvent.change(textarea, { target: { value: '' } });

    expect(textarea).toHaveValue('');
    expect(mockOnAnswerChange).toHaveBeenCalledWith('');
  });

  it('handles multiline answers', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseComprehension {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const textarea = screen.getByTestId('motion-textarea');
    const multilineAnswer = 'Première ligne\nDeuxième ligne\nTroisième ligne';
    fireEvent.change(textarea, { target: { value: multilineAnswer } });

    expect(textarea).toHaveValue(multilineAnswer);
    expect(mockOnAnswerChange).toHaveBeenCalledWith(multilineAnswer);
  });

  it('preserves formatting in answers', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseComprehension {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const textarea = screen.getByTestId('motion-textarea');
    const formattedAnswer = 'Réponse avec    espaces    multiples';
    fireEvent.change(textarea, { target: { value: formattedAnswer } });

    expect(textarea).toHaveValue(formattedAnswer);
    // Should trim only leading/trailing whitespace
    expect(mockOnAnswerChange).toHaveBeenCalledWith('Réponse avec    espaces    multiples');
  });
});