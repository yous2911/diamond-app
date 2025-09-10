/**
 * ExerciseQCM Component Tests
 * Tests the multiple-choice question exercise component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExerciseQCM from '../ExerciseQCM'; // Adjust the import path as needed

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('ExerciseQCM', () => {
  const defaultProps = {
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correctAnswerIndex: 2,
    onAnswerSelected: jest.fn(),
  };

  const renderComponent = (props = defaultProps) => {
    return render(<ExerciseQCM {...props} />);
  };

  beforeEach(() => {
    // Clear mock calls before each test
    defaultProps.onAnswerSelected.mockClear();
  });

  describe('Rendering', () => {
    it('should render the question text', () => {
      renderComponent();
      expect(screen.getByText(defaultProps.question)).toBeInTheDocument();
    });

    it('should render all answer options as buttons', () => {
      renderComponent();
      defaultProps.options.forEach(option => {
        expect(screen.getByRole('button', { name: option })).toBeInTheDocument();
      });
    });

    it('should not show any feedback before an answer is selected', () => {
        renderComponent();
        expect(screen.queryByText(/Correct/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Incorrect/i)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onAnswerSelected with correct parameters for a correct answer', async () => {
      const user = userEvent.setup();
      renderComponent();

      const correctOption = screen.getByRole('button', { name: 'Paris' });
      await user.click(correctOption);

      expect(defaultProps.onAnswerSelected).toHaveBeenCalledTimes(1);
      expect(defaultProps.onAnswerSelected).toHaveBeenCalledWith(2, true);
    });

    it('should call onAnswerSelected with correct parameters for an incorrect answer', async () => {
      const user = userEvent.setup();
      renderComponent();

      const incorrectOption = screen.getByRole('button', { name: 'London' });
      await user.click(incorrectOption);

      expect(defaultProps.onAnswerSelected).toHaveBeenCalledTimes(1);
      expect(defaultProps.onAnswerSelected).toHaveBeenCalledWith(0, false);
    });

    it('should highlight the selected answer', async () => {
        const user = userEvent.setup();
        renderComponent();

        const option = screen.getByRole('button', { name: 'Berlin' });
        await user.click(option);

        // This assumes the component adds a class like 'selected' or uses aria-pressed
        expect(option).toHaveAttribute('aria-pressed', 'true');
    });

    it('should disable all options after an answer has been selected', async () => {
        const user = userEvent.setup();
        renderComponent();

        const option = screen.getByRole('button', { name: 'Paris' });
        await user.click(option);

        // Check that all buttons are disabled
        defaultProps.options.forEach(opt => {
            const button = screen.getByRole('button', { name: opt });
            expect(button).toBeDisabled();
        });
    });
  });
});
