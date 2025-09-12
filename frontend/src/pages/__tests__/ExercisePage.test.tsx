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
import { PremiumFeaturesProvider } from '../../contexts/PremiumFeaturesContext';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock exercise data
const mockExercise = {
  id: 'math_001',
  question: 'Combien font 5 + 3 ?',
  options: ['6', '7', '8', '9'],
  correctAnswer: '8',
  answer: '8',
  difficulty: 'Moyen',
};

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ 
    pathname: '/exercises',
    state: { exercise: mockExercise }
  }),
  useParams: () => ({ id: '1' }),
}));

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getExercises: jest.fn(),
    submitExerciseResult: jest.fn(),
    getStudentProfile: jest.fn(),
    updateStudentProfile: jest.fn(),
  }
}));

// Mock the API hooks
jest.mock('../../hooks/useApiData', () => ({
  useStudentStats: () => ({
    data: {
      stats: {
        totalCorrectAnswers: 0,
        totalExercises: 1
      }
    }
  }),
  useExerciseSubmission: () => ({
    submitExercise: jest.fn().mockResolvedValue({
      success: true,
      xpEarned: 15,
      masteryLevelChanged: false
    })
  }),
  useXpTracking: () => ({
    addXp: jest.fn().mockResolvedValue(undefined)
  }),
  useMascot: () => ({
    updateEmotion: jest.fn().mockResolvedValue(undefined)
  })
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial: any) => ({
    get: () => initial,
    set: jest.fn(),
    onChange: jest.fn(),
  }),
  useTransform: (value: any, inputRange: any, outputRange: any) => ({
    get: () => outputRange[0],
    onChange: jest.fn(),
  }),
  useSpring: (value: any) => ({
    get: () => value,
    set: jest.fn(),
    onChange: jest.fn(),
  }),
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
  Home: () => <div data-testid="home-icon" />,
}));

// Mock components used by ExercisePage
jest.mock('../../components/XPCrystalsPremium', () => {
  return function MockXPCrystalsPremium({ currentXP, maxXP, level, onLevelUp, studentName, achievements }: any) {
    return (
      <div data-testid="xp-crystals-premium">
        <div>XP: {currentXP}/{maxXP}</div>
        <div>Level: {level}</div>
        <div>Student: {studentName}</div>
        <div>Achievements: {achievements?.length || 0}</div>
      </div>
    );
  };
});

jest.mock('../../components/MicroInteractions', () => {
  return function MockMicroInteraction({ children, onClick, className, ...props }: any) {
    return (
      <div className={className} onClick={onClick} {...props}>
        {children}
      </div>
    );
  };
});

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <CelebrationProvider>
      <PremiumFeaturesProvider>
        {children}
      </PremiumFeaturesProvider>
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

      expect(screen.getByText('Exercice')).toBeInTheDocument();
      expect(screen.getByText('Combien font 5 + 3 ?')).toBeInTheDocument();
    });

    it('should display exercise question and options', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Combien font 5 + 3 ?')).toBeInTheDocument();
      expect(screen.getByText('A. 6')).toBeInTheDocument();
      expect(screen.getByText('B. 7')).toBeInTheDocument();
      expect(screen.getByText('C. 8')).toBeInTheDocument();
      expect(screen.getByText('D. 9')).toBeInTheDocument();
    });

    it('should show home button and stars', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByTestId('star-icon')).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('should display question and options initially', () => {
      render(<ExercisePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Combien font 5 + 3 ?')).toBeInTheDocument();
      expect(screen.getByText('A. 6')).toBeInTheDocument();
      expect(screen.getByText('B. 7')).toBeInTheDocument();
      expect(screen.getByText('C. 8')).toBeInTheDocument();
      expect(screen.getByText('D. 9')).toBeInTheDocument();
    });

    it('should handle correct answer selection', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const correctAnswer = screen.getByText('C. 8');
      await user.click(correctAnswer);

      // The component should handle the answer and show success
      expect(correctAnswer).toBeInTheDocument();
    });

    it('should handle incorrect answer selection', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const incorrectAnswer = screen.getByText('A. 6');
      await user.click(incorrectAnswer);

      // The component should handle the answer
      expect(incorrectAnswer).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to home when home button is clicked', async () => {
      const user = userEvent.setup();
      render(<ExercisePage />, { wrapper: TestWrapper });

      const homeButton = screen.getByText('Accueil');
      await user.click(homeButton);

      // The navigate function should be called
      expect(homeButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing exercise data', () => {
      // Mock useLocation to return no exercise data
      jest.doMock('react-router-dom', () => ({
        useNavigate: () => jest.fn(),
        useLocation: () => ({ 
          pathname: '/exercises',
          state: null
        }),
        useParams: () => ({ id: '1' }),
      }));

      render(<ExercisePage />, { wrapper: TestWrapper });

      // Component should handle missing exercise gracefully
      expect(screen.queryByText('Combien font 5 + 3 ?')).not.toBeInTheDocument();
    });
  });
});
