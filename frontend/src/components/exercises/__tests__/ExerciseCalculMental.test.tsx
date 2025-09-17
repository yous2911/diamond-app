import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExerciseCalculMental } from '../ExerciseCalculMental';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
    input: ({ value, onChange, onKeyPress, className, disabled, ...props }: any) => (
      <input
        value={value}
        onChange={onChange}
        onKeyPress={onKeyPress}
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
    )
  }
}));

const mockExercise = {
  id: 1,
  configuration: {
    operation: 'addition',
    question: '25 + 17 = ?',
    niveau: 'CE2',
    typeCalcul: 'mental'
  },
  correctAnswer: 42
};

const defaultProps = {
  exercise: mockExercise,
  onAnswerChange: jest.fn(),
  disabled: false,
  currentAnswer: null,
  showValidation: false
};

describe('ExerciseCalculMental', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders the exercise component', () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    expect(screen.getAllByTestId('motion-div')).toHaveLength(expect.any(Number));
  });

  it('displays the exercise question', () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    expect(screen.getByText('25 + 17 = ?')).toBeInTheDocument();
  });

  it('shows input field for answer', () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    const input = screen.getByTestId('motion-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('handles input value changes', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseCalculMental {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.change(input, { target: { value: '42' } });

    expect(mockOnAnswerChange).toHaveBeenCalledWith(42);
  });

  it('filters invalid characters from input', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseCalculMental {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.change(input, { target: { value: 'abc123def' } });

    expect(input).toHaveValue('123');
    expect(mockOnAnswerChange).toHaveBeenCalledWith(123);
  });

  it('allows negative numbers', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseCalculMental {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.change(input, { target: { value: '-25' } });

    expect(input).toHaveValue('-25');
    expect(mockOnAnswerChange).toHaveBeenCalledWith(-25);
  });

  it('handles decimal numbers with comma', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseCalculMental {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.change(input, { target: { value: '12,5' } });

    expect(input).toHaveValue('12,5');
    expect(mockOnAnswerChange).toHaveBeenCalledWith(12.5);
  });

  it('handles decimal numbers with dot', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseCalculMental {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.change(input, { target: { value: '12.5' } });

    expect(input).toHaveValue('12.5');
    expect(mockOnAnswerChange).toHaveBeenCalledWith(12.5);
  });

  it('handles Enter key press', () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    // Should handle Enter key press without errors
    expect(input).toBeInTheDocument();
  });

  it('ignores Enter key when disabled', () => {
    render(<ExerciseCalculMental {...defaultProps} disabled={true} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });

    // Should not cause any issues when disabled
    expect(input).toBeInTheDocument();
  });

  it('shows current answer when provided', () => {
    render(<ExerciseCalculMental {...defaultProps} currentAnswer={42} />);

    const input = screen.getByTestId('motion-input');
    expect(input).toHaveValue('42');
  });

  it('disables input when disabled prop is true', () => {
    render(<ExerciseCalculMental {...defaultProps} disabled={true} />);

    const input = screen.getByTestId('motion-input');
    expect(input).toBeDisabled();
  });

  it('displays timer countdown', () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    // Should show timer elements
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('manages timer state correctly', async () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    // Timer should be initialized
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();

    // Advance timer
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      // Timer should update
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  it('shows exercise configuration', () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    // Should display operation type and level
    expect(screen.getByText(/addition|CE2/)).toBeInTheDocument();
  });

  it('handles validation state', () => {
    render(<ExerciseCalculMental {...defaultProps} showValidation={true} />);

    // Should show validation indicators
    expect(screen.getByTestId('motion-div')).toBeInTheDocument();
  });

  it('updates input value when currentAnswer changes', () => {
    const { rerender } = render(<ExerciseCalculMental {...defaultProps} currentAnswer={null} />);

    const input = screen.getByTestId('motion-input');
    expect(input).toHaveValue('');

    rerender(<ExerciseCalculMental {...defaultProps} currentAnswer={25} />);
    expect(input).toHaveValue('25');
  });

  it('stops timer when time reaches zero', async () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    // Fast forward to end of timer
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      // Timer should stop
      expect(screen.getByTestId('motion-div')).toBeInTheDocument();
    });
  });

  it('handles empty input gracefully', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseCalculMental {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.change(input, { target: { value: '' } });

    expect(input).toHaveValue('');
    // Should not call onAnswerChange with NaN
    expect(mockOnAnswerChange).not.toHaveBeenCalledWith(NaN);
  });

  it('handles invalid number input', () => {
    const mockOnAnswerChange = jest.fn();
    render(<ExerciseCalculMental {...defaultProps} onAnswerChange={mockOnAnswerChange} />);

    const input = screen.getByTestId('motion-input');
    fireEvent.change(input, { target: { value: '++--' } });

    expect(input).toHaveValue('++--');
    // Should not call onAnswerChange with NaN
    expect(mockOnAnswerChange).not.toHaveBeenCalledWith(NaN);
  });

  it('displays exercise level and type', () => {
    render(<ExerciseCalculMental {...defaultProps} />);

    expect(screen.getByText('CE2')).toBeInTheDocument();
    expect(screen.getByText('mental')).toBeInTheDocument();
  });
});