/**
 * ExercisePage Component Tests for FastRevEd Kids
 * Tests exercise loading, submission, progress tracking, and gamification
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExercisePage from '../ExercisePage';
import { AuthProvider } from '../../contexts/AuthContext';
import { CelebrationProvider } from '../../contexts/CelebrationContext';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getExercises: jest.fn(),
    submitExerciseResult: jest.fn(),
    getStudentProfile: jest.fn(),
    updateStudentProfile: jest.fn(),
  }
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon" />,
  Check: () => <div data-testid="check-icon" />,
  X: () => <div data-testid="x-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Target: () => <div data-testid="target-icon" />,
  BookOpen: () => <div data-testid="book-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  ArrowRight: () => <div data-testid="arrow-right-icon" />,
}));

// Mock exercise data
const mockExercise = {
  id: 'math_001',
  title: 'Addition Simple',
  description: 'Résous ces additions',
  type: 'multiple_choice',
  difficulty: 'easy',
  subject: 'mathématiques',
  level: 'CE1',
  questions: [
    {
      id: 'q1',
      question: 'Combien font 5 + 3 ?',
      options: ['6', '7', '8', '9'],
      correctAnswer: 2,
      explanation: '5 + 3 = 8'
    },
    {
      id: 'q2',
      question: 'Combien font 7 + 2 ?',
      options: ['8', '9', '10', '11'],
      correctAnswer: 1,
      explanation: '7 + 2 = 9'
    }
  ],
  timeLimit: 300, // 5 minutes
  xpReward: 50,
  unlockLevel: 1,
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <CelebrationProvider>
      {children}
    </CelebrationProvider>
  </AuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// EXERCISE PAGE COMPONENT TESTS
// =============================================================================

describe('ExercisePage', () => {
  describe('Rendering', () => {
    it('should render exercise page with all elements', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Exercices')).toBeInTheDocument();
      expect(screen.getByText('Addition Simple')).toBeInTheDocument();
      expect(screen.getByText('Résous ces additions')).toBeInTheDocument();
    });

    it('should display exercise progress', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Question 1 sur 2')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show timer and XP reward', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('5:00')).toBeInTheDocument();
      expect(screen.getByText('+50 XP')).toBeInTheDocument();
    });

    it('should display hearts/lives remaining', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Cœurs')).toBeInTheDocument();
      expect(screen.getAllByTestId('heart-icon')).toHaveLength(5);
    });
  });

  describe('Question Navigation', () => {
    it('should display first question initially', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Combien font 5 + 3 ?')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('should navigate to next question when next button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Answer first question
      const correctAnswer = screen.getByText('8');
      await user.click(correctAnswer);

      // Click next
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      expect(screen.getByText('Question 2 sur 2')).toBeInTheDocument();
      expect(screen.getByText('Combien font 7 + 2 ?')).toBeInTheDocument();
    });

    it('should navigate to previous question when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Go to second question first
      const correctAnswer = screen.getByText('8');
      await user.click(correctAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      // Go back
      const backButton = screen.getByRole('button', { name: /précédent/i });
      await user.click(backButton);

      expect(screen.getByText('Question 1 sur 2')).toBeInTheDocument();
      expect(screen.getByText('Combien font 5 + 3 ?')).toBeInTheDocument();
    });

    it('should disable navigation buttons appropriately', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      const backButton = screen.getByRole('button', { name: /précédent/i });
      expect(backButton).toBeDisabled();

      const nextButton = screen.getByRole('button', { name: /suivant/i });
      expect(nextButton).toBeDisabled(); // No answer selected yet
    });
  });

  describe('Answer Selection', () => {
    it('should highlight selected answer', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const answerOption = screen.getByText('8');
      await user.click(answerOption);

      expect(answerOption.closest('button')).toHaveClass(/selected|active/);
    });

    it('should allow changing selected answer', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const firstAnswer = screen.getByText('7');
      const secondAnswer = screen.getByText('8');

      await user.click(firstAnswer);
      expect(firstAnswer.closest('button')).toHaveClass(/selected|active/);

      await user.click(secondAnswer);
      expect(firstAnswer.closest('button')).not.toHaveClass(/selected|active/);
      expect(secondAnswer.closest('button')).toHaveClass(/selected|active/);
    });

    it('should enable next button when answer is selected', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const nextButton = screen.getByRole('button', { name: /suivant/i });
      expect(nextButton).toBeDisabled();

      const answerOption = screen.getByText('8');
      await user.click(answerOption);

      expect(nextButton).toBeEnabled();
    });
  });

  describe('Answer Validation', () => {
    it('should show correct answer feedback', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const correctAnswer = screen.getByText('8');
      await user.click(correctAnswer);

      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Correct!')).toBeInTheDocument();
        expect(screen.getByText('5 + 3 = 8')).toBeInTheDocument();
      });
    });

    it('should show incorrect answer feedback', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const incorrectAnswer = screen.getByText('7');
      await user.click(incorrectAnswer);

      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Incorrect')).toBeInTheDocument();
        expect(screen.getByText('La bonne réponse est: 8')).toBeInTheDocument();
        expect(screen.getByText('5 + 3 = 8')).toBeInTheDocument();
      });
    });

    it('should reduce hearts for incorrect answers', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const incorrectAnswer = screen.getByText('7');
      await user.click(incorrectAnswer);

      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      await waitFor(() => {
        // Should have 4 hearts instead of 5
        expect(screen.getAllByTestId('heart-icon')).toHaveLength(4);
      });
    });
  });

  describe('Exercise Completion', () => {
    it('should show completion screen when all questions are answered', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Answer first question
      const firstAnswer = screen.getByText('8');
      await user.click(firstAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      // Answer second question
      const secondAnswer = screen.getByText('9');
      await user.click(secondAnswer);
      const finishButton = screen.getByRole('button', { name: /terminer/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText('Exercice Terminé!')).toBeInTheDocument();
        expect(screen.getByText('Félicitations!')).toBeInTheDocument();
      });
    });

    it('should display final score and XP gained', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Complete exercise with correct answers
      const firstAnswer = screen.getByText('8');
      await user.click(firstAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      const secondAnswer = screen.getByText('9');
      await user.click(secondAnswer);
      const finishButton = screen.getByRole('button', { name: /terminer/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText('Score: 100%')).toBeInTheDocument();
        expect(screen.getByText('+50 XP')).toBeInTheDocument();
        expect(screen.getByText('+10 XP Bonus')).toBeInTheDocument();
      });
    });

    it('should show performance breakdown', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Complete exercise
      const firstAnswer = screen.getByText('8');
      await user.click(firstAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      const secondAnswer = screen.getByText('9');
      await user.click(secondAnswer);
      const finishButton = screen.getByRole('button', { name: /terminer/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText('Questions correctes: 2/2')).toBeInTheDocument();
        expect(screen.getByText('Temps utilisé: 2:30')).toBeInTheDocument();
        expect(screen.getByText('Cœurs restants: 5')).toBeInTheDocument();
      });
    });
  });

  describe('Timer Functionality', () => {
    it('should start timer when exercise begins', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('5:00')).toBeInTheDocument();
    });

    it('should update timer countdown', async () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Wait for timer to update
      await waitFor(() => {
        expect(screen.getByText('4:59')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show time warning when time is running low', async () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Mock low time (30 seconds remaining)
      // This would require mocking the timer state
      await waitFor(() => {
        expect(screen.getByText('0:30')).toBeInTheDocument();
        expect(screen.getByText(/temps restant/i)).toBeInTheDocument();
      });
    });

    it('should auto-submit when time runs out', async () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Mock timer expiration
      await waitFor(() => {
        expect(screen.getByText('0:00')).toBeInTheDocument();
        expect(screen.getByText('Temps écoulé!')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Actions', () => {
    it('should navigate back to home when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const backButton = screen.getByTestId('arrow-left-icon').closest('button');
      await user.click(backButton!);

      expect(window.location.pathname).toBe('/');
    });

    it('should navigate to next exercise when continue button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Complete exercise first
      const firstAnswer = screen.getByText('8');
      await user.click(firstAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      const secondAnswer = screen.getByText('9');
      await user.click(secondAnswer);
      const finishButton = screen.getByRole('button', { name: /terminer/i });
      await user.click(finishButton);

      // Click continue
      const continueButton = screen.getByRole('button', { name: /continuer/i });
      await user.click(continueButton);

      expect(window.location.pathname).toBe('/exercises/math_002');
    });

    it('should navigate to home when done button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Complete exercise
      const firstAnswer = screen.getByText('8');
      await user.click(firstAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      const secondAnswer = screen.getByText('9');
      await user.click(secondAnswer);
      const finishButton = screen.getByRole('button', { name: /terminer/i });
      await user.click(finishButton);

      // Click done
      const doneButton = screen.getByRole('button', { name: /terminé/i });
      await user.click(doneButton);

      expect(window.location.pathname).toBe('/');
    });
  });

  describe('Gamification Elements', () => {
    it('should show streak counter', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Série: 7 jours')).toBeInTheDocument();
    });

    it('should display level progress', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Niveau 5')).toBeInTheDocument();
      expect(screen.getByText('1,250 / 1,500 XP')).toBeInTheDocument();
    });

    it('should show achievement notifications', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      // Complete exercise perfectly
      const firstAnswer = screen.getByText('8');
      await user.click(firstAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      const secondAnswer = screen.getByText('9');
      await user.click(secondAnswer);
      const finishButton = screen.getByRole('button', { name: /terminer/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText('Nouveau Badge!')).toBeInTheDocument();
        expect(screen.getByText('Parfait!')).toBeInTheDocument();
      });
    });

    it('should show mascot reactions to answers', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const correctAnswer = screen.getByText('8');
      await user.click(correctAnswer);

      await waitFor(() => {
        expect(screen.getByText('Bravo!')).toBeInTheDocument();
        // Mascot should show happy emotion
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle exercise loading errors', async () => {
      const { apiService } = require('../../services/api');
      apiService.getExercises.mockRejectedValue(new Error('Failed to load exercise'));

      render(<ExercisePage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/erreur de chargement/i)).toBeInTheDocument();
      });
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const { apiService } = require('../../services/api');
      apiService.submitExerciseResult.mockRejectedValue(new Error('Failed to submit'));

      render(<ExercisePage />, { wrapper: TestWrapper });

      // Complete exercise
      const firstAnswer = screen.getByText('8');
      await user.click(firstAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      const secondAnswer = screen.getByText('9');
      await user.click(secondAnswer);
      const finishButton = screen.getByRole('button', { name: /terminer/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(screen.getByText(/erreur de soumission/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      const answerButtons = screen.getAllByRole('button');
      answerButtons.forEach(button => {
        if (button.textContent?.match(/^\d+$/)) {
          expect(button).toHaveAttribute('aria-label');
        }
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const firstAnswer = screen.getByText('8');
      firstAnswer.focus();
      expect(firstAnswer).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(firstAnswer.closest('button')).toHaveClass(/selected|active/);
    });

    it('should announce question changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const firstAnswer = screen.getByText('8');
      await user.click(firstAnswer);
      const nextButton = screen.getByRole('button', { name: /suivant/i });
      await user.click(nextButton);

      // Should have aria-live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
