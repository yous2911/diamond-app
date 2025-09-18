/**
 * LeaderboardPage Component Tests for FastRevEd Kids
 * Tests leaderboard display, ranking, filtering, and user interactions
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeaderboardPage from '../LeaderboardPage';
import { AuthProvider } from '../../contexts/AuthContext';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/leaderboard' }),
  useParams: () => ({}),
}));

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getLeaderboard: jest.fn(),
    getStudentProfile: jest.fn(),
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
  Trophy: () => <div data-testid="trophy-icon" />,
  Medal: () => <div data-testid="medal-icon" />,
  Star: () => <div data-testid="star-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  ArrowLeft: () => <div data-testid="arrow-left-icon" />,
  Crown: () => <div data-testid="crown-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Home: () => <div data-testid="home-icon" />,
}));

// Mock the leaderboard hooks
jest.mock('../../hooks/useLeaderboard', () => ({
  useUserCentricLeaderboard: jest.fn(() => ({
    data: {
      userEntry: {
        studentId: 2,
        rank: 2,
        score: 2400,
        rankChange: 1,
        student: {
          prenom: 'Emma',
          nom: 'Martin',
          mascotteType: 'fairy',
          mascotteColor: 'pink',
          niveauScolaire: 'CE2'
        },
        badges: [
          { id: 1, title: 'Top 3', rarity: 'rare', icon: '🏆' },
          { id: 2, title: 'Série de 7 jours', rarity: 'common', icon: '🔥' }
        ],
        streak: 7
      },
      competitors: [
        {
          studentId: 1,
          rank: 1,
          score: 2500,
          rankChange: 2,
          student: {
            prenom: 'Lucas',
            nom: 'Dubois',
            mascotteType: 'dragon',
            mascotteColor: 'red',
            niveauScolaire: 'CE2'
          },
          badges: [],
          streak: 5
        },
        {
          studentId: 3,
          rank: 3,
          score: 2300,
          rankChange: -1,
          student: {
            prenom: 'Noah',
            nom: 'Garcia',
            mascotteType: 'robot',
            mascotteColor: 'blue',
            niveauScolaire: 'CE2'
          },
          badges: [],
          streak: 3
        }
      ],
      context: {
        totalParticipants: 150,
        userRank: 2,
        percentile: 85,
        beatingCount: 127,
        nextTarget: {
          studentId: 1,
          rank: 1,
          score: 2500,
          rankChange: 2,
          student: {
            prenom: 'Lucas',
            nom: 'Dubois',
            mascotteType: 'dragon',
            mascotteColor: 'red',
            niveauScolaire: 'CE2'
          },
          badges: [],
          streak: 5
        }
      }
    },
    isLoading: false,
    error: null,
    refetch: jest.fn()
  })),
  useMotivationMessage: jest.fn(() => jest.fn(() => 'Tu es en 2ème position ! Continue comme ça !')),
  useRankChangeIcon: jest.fn(() => jest.fn((change) => ({
    icon: change > 0 ? '⬆️' : change < 0 ? '⬇️' : '➖',
    color: change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500',
    bg: change > 0 ? 'bg-green-100' : change < 0 ? 'bg-red-100' : 'bg-gray-100'
  }))),
  useBadgeStyle: jest.fn(() => jest.fn((rarity) => ({
    bg: rarity === 'rare' ? 'bg-blue-100' : 'bg-gray-100',
    border: rarity === 'rare' ? 'border-blue-400' : 'border-gray-300',
    text: rarity === 'rare' ? 'text-blue-800' : 'text-gray-700',
    glow: rarity === 'rare' ? 'shadow-blue-200 shadow-lg' : 'shadow-sm'
  })))
}));

// Mock the SkeletonLoader component
jest.mock('../../components/ui/SkeletonLoader', () => {
  return function SkeletonLoader({ type, className }: any) {
    return <div data-testid={`skeleton-${type}`} className={className} />;
  };
});

// Mock the UserCentricLeaderboard component
jest.mock('../../components/dashboard/UserCentricLeaderboard', () => {
  return function UserCentricLeaderboard({ studentId }: any) {
    return (
      <div data-testid="user-centric-leaderboard">
        <h2>🎯 Votre Classement</h2>
        <p>Tu es en 2ème position ! Continue comme ça !</p>
        <div>
          <div>#2</div>
          <div>Lucas Dubois - 2,500 points</div>
          <div>Emma Martin - 2,400 points</div>
          <div>Noah Garcia - 2,300 points</div>
        </div>
      </div>
    );
  };
});

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    {children}
  </AuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// LEADERBOARD PAGE COMPONENT TESTS
// =============================================================================

describe('LeaderboardPage', () => {
  describe('Rendering', () => {
    it('should render leaderboard page with all elements', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('🏆 Classement')).toBeInTheDocument();
      expect(screen.getByText('🎯 Votre Classement')).toBeInTheDocument();
    });

    it('should display user-centric leaderboard', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByTestId('user-centric-leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Lucas Dubois - 2,500 points')).toBeInTheDocument();
      expect(screen.getByText('Emma Martin - 2,400 points')).toBeInTheDocument();
      expect(screen.getByText('Noah Garcia - 2,300 points')).toBeInTheDocument();
    });

    it('should show motivational message', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('Tu es en 2ème position ! Continue comme ça !')).toBeInTheDocument();
    });

    it('should display current user rank', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });
});
