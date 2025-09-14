import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExerciseQCM } from '../ExerciseQCM';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => {
      const { initial, animate, transition, delay, ...domProps } = props;
      return <div className={className} {...domProps}>{children}</div>;
    }
  }
}));

describe('ExerciseQCM', () => {
  const mockOnAnswerChange = jest.fn();
  
  const defaultExercise = {
    configuration: {
      question: 'What is 2 + 2?',
      choix: ['3', '4', '5', '6'],
      bonneReponse: '4'
    }
  };

  const defaultProps = {
    exercise: defaultExercise,
    onAnswerChange: mockOnAnswerChange,
    disabled: false,
    currentAnswer: null,
    showValidation: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the question correctly', () => {
    render(<ExerciseQCM {...defaultProps} />);
    
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('renders all answer choices', () => {
    render(<ExerciseQCM {...defaultProps} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('calls onAnswerChange when a choice is clicked', async () => {
    const user = userEvent.setup();
    render(<ExerciseQCM {...defaultProps} />);
    
    const choice = screen.getByText('4');
    await user.click(choice);
    
    expect(mockOnAnswerChange).toHaveBeenCalledWith('4');
  });

  it('does not call onAnswerChange when disabled', async () => {
    const user = userEvent.setup();
    render(<ExerciseQCM {...defaultProps} disabled={true} />);
    
    const choice = screen.getByText('4');
    await user.click(choice);
    
    expect(mockOnAnswerChange).not.toHaveBeenCalled();
  });

  it('highlights selected answer with primary style', () => {
    render(<ExerciseQCM {...defaultProps} currentAnswer="4" />);
    
    const selectedButton = screen.getByText('4').closest('button');
    expect(selectedButton).toHaveClass('bg-blue-500', 'border-blue-500', 'text-white');
  });

  it('shows radio button indicator for selected answer', () => {
    render(<ExerciseQCM {...defaultProps} currentAnswer="4" />);
    
    const selectedButton = screen.getByText('4').closest('button');
    const radioIndicator = selectedButton?.querySelector('.w-3.h-3.rounded-full');
    expect(radioIndicator).toBeInTheDocument();
  });

  it('shows correct answer in green when validation is shown', () => {
    render(
      <ExerciseQCM 
        {...defaultProps} 
        currentAnswer="3"
        showValidation={true}
      />
    );
    
    const correctButton = screen.getByText('4').closest('button');
    expect(correctButton).toHaveClass('bg-green-500', 'border-green-500', 'text-white');
  });

  it('shows wrong answer in red when validation is shown', () => {
    render(
      <ExerciseQCM 
        {...defaultProps} 
        currentAnswer="3"
        showValidation={true}
      />
    );
    
    const wrongButton = screen.getByText('3').closest('button');
    expect(wrongButton).toHaveClass('bg-red-500', 'border-red-500', 'text-white');
  });

  it('shows checkmark for correct answer when validation is shown', () => {
    render(
      <ExerciseQCM 
        {...defaultProps} 
        currentAnswer="4"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('shows X mark for wrong answer when validation is shown', () => {
    render(
      <ExerciseQCM 
        {...defaultProps} 
        currentAnswer="3"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('❌')).toBeInTheDocument();
  });

  it('shows success feedback for correct answer', () => {
    render(
      <ExerciseQCM 
        {...defaultProps} 
        currentAnswer="4"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('Excellente réponse !')).toBeInTheDocument();
  });

  it('shows failure feedback with correct answer for wrong answer', () => {
    render(
      <ExerciseQCM 
        {...defaultProps} 
        currentAnswer="3"
        showValidation={true}
      />
    );
    
    expect(screen.getByText('🤔')).toBeInTheDocument();
    expect(screen.getByText('Pas tout à fait...')).toBeInTheDocument();
    expect(screen.getByText('La bonne réponse était : 4')).toBeInTheDocument();
  });

  it('handles exercise without configuration', () => {
    const exerciseWithoutConfig = { configuration: null };
    render(<ExerciseQCM {...defaultProps} exercise={exerciseWithoutConfig} />);
    
    // Should not crash and show empty state
    expect(screen.queryByText('What is 2 + 2?')).not.toBeInTheDocument();
  });

  it('handles exercise with empty choices array', () => {
    const exerciseWithEmptyChoices = {
      configuration: {
        question: 'Test question',
        choix: [],
        bonneReponse: 'answer'
      }
    };
    render(<ExerciseQCM {...defaultProps} exercise={exerciseWithEmptyChoices} />);
    
    expect(screen.getByText('Test question')).toBeInTheDocument();
    // Should not show any choice buttons
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles exercise without choices property', () => {
    const exerciseWithoutChoices = {
      configuration: {
        question: 'Test question',
        bonneReponse: 'answer'
      }
    };
    render(<ExerciseQCM {...defaultProps} exercise={exerciseWithoutChoices} />);
    
    expect(screen.getByText('Test question')).toBeInTheDocument();
    // Should use empty array as default
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies disabled styles to buttons when disabled', () => {
    render(<ExerciseQCM {...defaultProps} disabled={true} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  it('applies hover effects when not disabled', () => {
    render(<ExerciseQCM {...defaultProps} />);
    
    const button = screen.getByText('3').closest('button');
    expect(button).toHaveClass('hover:border-blue-300', 'hover:bg-blue-50', 'hover:scale-102');
  });

  it('does not apply hover effects when disabled', () => {
    render(<ExerciseQCM {...defaultProps} disabled={true} />);
    
    const button = screen.getByText('3').closest('button');
    expect(button).not.toHaveClass('hover:scale-102');
  });

  it('handles different answer types correctly', async () => {
    const user = userEvent.setup();
    render(<ExerciseQCM {...defaultProps} />);
    
    // Test clicking different choices
    await user.click(screen.getByText('3'));
    expect(mockOnAnswerChange).toHaveBeenLastCalledWith('3');
    
    await user.click(screen.getByText('5'));
    expect(mockOnAnswerChange).toHaveBeenLastCalledWith('5');
  });

  it('handles multiple clicks on the same choice', async () => {
    const user = userEvent.setup();
    render(<ExerciseQCM {...defaultProps} />);
    
    const choice = screen.getByText('4');
    await user.click(choice);
    await user.click(choice);
    
    expect(mockOnAnswerChange).toHaveBeenCalledTimes(2);
    expect(mockOnAnswerChange).toHaveBeenNthCalledWith(1, '4');
    expect(mockOnAnswerChange).toHaveBeenNthCalledWith(2, '4');
  });

  it('renders with complex choice text', () => {
    const exerciseWithComplexChoices = {
      configuration: {
        question: 'Complex question?',
        choix: ['Choice with (parentheses)', 'Choice with "quotes"', 'Choice with émojis 🎉', 'Very long choice that might wrap to multiple lines'],
        bonneReponse: 'Choice with émojis 🎉'
      }
    };
    
    render(<ExerciseQCM {...defaultProps} exercise={exerciseWithComplexChoices} />);
    
    expect(screen.getByText('Choice with (parentheses)')).toBeInTheDocument();
    expect(screen.getByText('Choice with "quotes"')).toBeInTheDocument();
    expect(screen.getByText('Choice with émojis 🎉')).toBeInTheDocument();
    expect(screen.getByText('Very long choice that might wrap to multiple lines')).toBeInTheDocument();
  });
});