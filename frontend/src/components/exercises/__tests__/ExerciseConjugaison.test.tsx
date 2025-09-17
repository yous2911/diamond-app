import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExerciseConjugaison } from '../ExerciseConjugaison';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    input: ({ value, onChange, className, disabled, ...props }: any) => (
      <input
        value={value}
        onChange={onChange}
        className={className}
        disabled={disabled}
        data-testid="motion-input"
        {...props}
      />
    ),
    button: ({ children, onClick, className, disabled, ...props }: any) => (
      <button
        onClick={onClick}
        className={className}
        disabled={disabled}
        data-testid="motion-button"
        {...props}
      >
        {children}
      </button>
    ),
    h3: ({ children, className, ...props }: any) => (
      <h3 className={className} data-testid="motion-h3" {...props}>
        {children}
      </h3>
    ),
    span: ({ children, className, ...props }: any) => (
      <span className={className} data-testid="motion-span" {...props}>
        {children}
      </span>
    )
  }
}));

const mockExercise = {
  id: 1,
  configuration: {
    verbe: 'chanter',
    temps: 'présent',
    personnes: ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles']
  }
};

const defaultProps = {
  exercise: mockExercise,
  onAnswerChange: jest.fn(),
  disabled: false,
  mascotType: 'dragon'
};

describe('ExerciseConjugaison', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the exercise component', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('displays the verb to conjugate', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    expect(screen.getByText('chanter')).toBeInTheDocument();
  });

  it('displays the tense', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    expect(screen.getByText('présent')).toBeInTheDocument();
  });

  it('shows input fields for each person', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    const inputs = screen.getAllByTestId('motion-input');
    expect(inputs).toHaveLength(6); // je, tu, il/elle, nous, vous, ils/elles
  });

  it('displays person pronouns', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    expect(screen.getByText('je')).toBeInTheDocument();
    expect(screen.getByText('tu')).toBeInTheDocument();
    expect(screen.getByText('il/elle')).toBeInTheDocument();
    expect(screen.getByText('nous')).toBeInTheDocument();
    expect(screen.getByText('vous')).toBeInTheDocument();
    expect(screen.getByText('ils/elles')).toBeInTheDocument();
  });

  it('handles answer input changes', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseConjugaison {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const inputs = screen.getAllByTestId('motion-input');
    fireEvent.change(inputs[0], { target: { value: 'chante' } });

    expect(inputs[0]).toHaveValue('chante');
  });

  it('updates answers array when input changes', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    const inputs = screen.getAllByTestId('motion-input');
    fireEvent.change(inputs[0], { target: { value: 'chante' } });
    fireEvent.change(inputs[1], { target: { value: 'chantes' } });

    expect(inputs[0]).toHaveValue('chante');
    expect(inputs[1]).toHaveValue('chantes');
  });

  it('disables inputs when disabled prop is true', () => {
    render(<ExerciseConjugaison {...defaultProps} disabled={true} />);

    const inputs = screen.getAllByTestId('motion-input');
    inputs.forEach(input => {
      expect(input).toBeDisabled();
    });
  });

  it('shows submit button', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    const submitButton = screen.getByTestId('motion-button');
    expect(submitButton).toBeInTheDocument();
  });

  it('handles submit button click', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseConjugaison {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const inputs = screen.getAllByTestId('motion-input');
    fireEvent.change(inputs[0], { target: { value: 'chante' } });
    fireEvent.change(inputs[1], { target: { value: 'chantes' } });

    const submitButton = screen.getByTestId('motion-button');
    fireEvent.click(submitButton);

    expect(mockOnAnswerChange).toHaveBeenCalled();
  });

  it('handles empty configuration gracefully', () => {
    const exerciseWithoutConfig = { id: 1, configuration: {} };
    render(<ExerciseConjugaison {...defaultProps} exercise={exerciseWithoutConfig} />);

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles missing configuration gracefully', () => {
    const exerciseWithoutConfig = { id: 1 };
    render(<ExerciseConjugaison {...defaultProps} exercise={exerciseWithoutConfig} />);

    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('uses default values when configuration is missing', () => {
    const exerciseWithoutConfig = { id: 1, configuration: {} };
    render(<ExerciseConjugaison {...defaultProps} exercise={exerciseWithoutConfig} />);

    // Should show default persons
    const inputs = screen.getAllByTestId('motion-input');
    expect(inputs).toHaveLength(3); // Default: je, tu, il/elle
  });

  it('handles different verb types', () => {
    const exerciseWithIrregularVerb = {
      ...mockExercise,
      configuration: {
        ...mockExercise.configuration,
        verbe: 'être'
      }
    };

    render(<ExerciseConjugaison {...defaultProps} exercise={exerciseWithIrregularVerb} />);

    expect(screen.getByText('être')).toBeInTheDocument();
  });

  it('handles different tenses', () => {
    const exerciseWithDifferentTense = {
      ...mockExercise,
      configuration: {
        ...mockExercise.configuration,
        temps: 'imparfait'
      }
    };

    render(<ExerciseConjugaison {...defaultProps} exercise={exerciseWithDifferentTense} />);

    expect(screen.getByText('imparfait')).toBeInTheDocument();
  });

  it('manages animation state', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    // Should handle animation state
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('handles all person forms correctly', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    const inputs = screen.getAllByTestId('motion-input');

    // Test all person forms
    fireEvent.change(inputs[0], { target: { value: 'chante' } });
    fireEvent.change(inputs[1], { target: { value: 'chantes' } });
    fireEvent.change(inputs[2], { target: { value: 'chante' } });
    fireEvent.change(inputs[3], { target: { value: 'chantons' } });
    fireEvent.change(inputs[4], { target: { value: 'chantez' } });
    fireEvent.change(inputs[5], { target: { value: 'chantent' } });

    expect(inputs[0]).toHaveValue('chante');
    expect(inputs[1]).toHaveValue('chantes');
    expect(inputs[2]).toHaveValue('chante');
    expect(inputs[3]).toHaveValue('chantons');
    expect(inputs[4]).toHaveValue('chantez');
    expect(inputs[5]).toHaveValue('chantent');
  });

  it('passes mascot type as prop', () => {
    render(<ExerciseConjugaison {...defaultProps} mascotType="fairy" />);

    // Component should render with fairy mascot type
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('maintains answer state across interactions', () => {
    render(<ExerciseConjugaison {...defaultProps} />);

    const inputs = screen.getAllByTestId('motion-input');

    fireEvent.change(inputs[0], { target: { value: 'chante' } });
    fireEvent.change(inputs[1], { target: { value: 'chantes' } });

    // Values should persist
    expect(inputs[0]).toHaveValue('chante');
    expect(inputs[1]).toHaveValue('chantes');

    // Change another input
    fireEvent.change(inputs[2], { target: { value: 'chante' } });

    // Previous values should still be there
    expect(inputs[0]).toHaveValue('chante');
    expect(inputs[1]).toHaveValue('chantes');
    expect(inputs[2]).toHaveValue('chante');
  });

  it('handles empty answer submissions', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseConjugaison {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const submitButton = screen.getByTestId('motion-button');
    fireEvent.click(submitButton);

    // Should handle empty answers gracefully
    expect(mockOnAnswerChange).toHaveBeenCalled();
  });
});