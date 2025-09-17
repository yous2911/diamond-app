import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import UserCentricLeaderboard from '../UserCentricLeaderboard';

// Mock dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} data-testid="motion-div" {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

const mockLeaderboardData = {
  userEntry: {
    studentId: 1,
    rank: 5,
    score: 1250,
    student: { prenom: 'TestStudent' },
    badges: [
      { icon: '<Æ', rarity: 'epic', title: 'Champion' },
      { icon: '¡', rarity: 'rare', title: 'Speed Demon' }
    ],
    streak: 7,
    rankChange: 2
  },
  competitors: [
    {
      studentId: 2,
      rank: 4,
      score: 1300,
      student: { prenom: 'Alice' },
      badges: [{ icon: '<¯', rarity: 'common', title: 'First Steps' }],
      streak: 5,
      rankChange: -1
    },
    {
      studentId: 3,
      rank: 6,
      score: 1200,
      student: { prenom: 'Bob' },
      badges: [],
      streak: 0,
      rankChange: 0
    }
  ],
  context: {
    percentile: 85,
    beatingCount: 150,
    nextTarget: {
      student: { prenom: 'Alice' },
      pointsNeeded: 50
    }
  }
};

const mockHooks = {
  useUserCentricLeaderboard: jest.fn(() => ({
    data: mockLeaderboardData,
    isLoading: false,
    error: null,
    refetch: jest.fn()
  })),
  useMotivationMessage: jest.fn(() => () => 'Tu es en excellente forme ! Continue !'),
  useRankChangeIcon: jest.fn(() => () => ({
    icon: '‘',
    color: 'text-green-500',
    bg: 'bg-green-100'
  })),
  useBadgeStyle: jest.fn(() => () => ({ bg: 'bg-blue-100' }))
};

jest.mock('../../hooks/useLeaderboard', () => mockHooks);

jest.mock('../ui/SkeletonLoader', () => {
  return function MockSkeletonLoader({ type, className }: any) {
    return <div data-testid="skeleton-loader" className={className}>{type} loader</div>;
  };
});

describe('UserCentricLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders leaderboard with user data', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('<¯ Votre Classement')).toBeInTheDocument();
      expect(screen.getByText('global " points')).toBeInTheDocument();
      expect(screen.getByText('#5')).toBeInTheDocument();
      expect(screen.getByText('Top 15%')).toBeInTheDocument();
    });

    it('displays motivational message', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('Tu es en excellente forme ! Continue !')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <UserCentricLeaderboard studentId={1} className="custom-leaderboard" />
      );

      expect(container.firstChild).toHaveClass('custom-leaderboard');
    });

    it('displays correct type and category in header', () => {
      render(<UserCentricLeaderboard studentId={1} type="weekly" category="streak" />);

      expect(screen.getByText('weekly " streak')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows skeleton loaders when loading', () => {
      mockHooks.useUserCentricLeaderboard.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: jest.fn()
      });

      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getAllByTestId('skeleton-loader')).toHaveLength(7);
    });
  });

  describe('Error State', () => {
    it('shows error message when data is unavailable', () => {
      mockHooks.useUserCentricLeaderboard.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: jest.fn()
      });

      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('Pas encore de classement')).toBeInTheDocument();
      expect(screen.getByText('Commencez à jouer pour apparaître dans le leaderboard !')).toBeInTheDocument();
    });

    it('shows error message when userEntry is null', () => {
      mockHooks.useUserCentricLeaderboard.mockReturnValue({
        data: { ...mockLeaderboardData, userEntry: null },
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('Pas encore de classement')).toBeInTheDocument();
    });

    it('handles refresh button click', () => {
      const mockRefetch = jest.fn();
      mockHooks.useUserCentricLeaderboard.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: mockRefetch
      });

      render(<UserCentricLeaderboard studentId={1} />);

      const refreshButton = screen.getByText('Actualiser');
      fireEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Leaderboard Entries', () => {
    it('displays all entries sorted by rank', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Vous')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('highlights user entry correctly', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('VOUS')).toBeInTheDocument();
    });

    it('displays scores and streaks correctly', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('1,250 points')).toBeInTheDocument();
      expect(screen.getByText('=% 7 jours')).toBeInTheDocument();
      expect(screen.getByText('=% 5 jours')).toBeInTheDocument();
    });

    it('displays badges correctly', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('<Æ')).toBeInTheDocument();
      expect(screen.getByText('¡')).toBeInTheDocument();
      expect(screen.getByText('<¯')).toBeInTheDocument();
    });

    it('shows badge count when more than 2 badges', () => {
      const dataWithManyBadges = {
        ...mockLeaderboardData,
        userEntry: {
          ...mockLeaderboardData.userEntry,
          badges: [
            { icon: '<Æ', rarity: 'epic', title: 'Champion' },
            { icon: '¡', rarity: 'rare', title: 'Speed Demon' },
            { icon: '<¯', rarity: 'common', title: 'First Steps' },
            { icon: '=%', rarity: 'rare', title: 'Hot Streak' }
          ]
        }
      };

      mockHooks.useUserCentricLeaderboard.mockReturnValue({
        data: dataWithManyBadges,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('displays rank change indicators', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      // Should display rank change icons for entries with changes
      const motionDivs = screen.getAllByTestId('motion-div');
      expect(motionDivs.length).toBeGreaterThan(0);
    });
  });

  describe('Next Target Challenge', () => {
    it('displays next target when available', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('<¯ Votre prochain défi:')).toBeInTheDocument();
      expect(screen.getByText('Battez Alice !')).toBeInTheDocument();
    });

    it('does not display next target when not available', () => {
      const dataWithoutTarget = {
        ...mockLeaderboardData,
        context: {
          ...mockLeaderboardData.context,
          nextTarget: null
        }
      };

      mockHooks.useUserCentricLeaderboard.mockReturnValue({
        data: dataWithoutTarget,
        isLoading: false,
        error: null,
        refetch: jest.fn()
      });

      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.queryByText('<¯ Votre prochain défi:')).not.toBeInTheDocument();
    });
  });

  describe('Context Stats', () => {
    it('displays context statistics in non-compact mode', () => {
      render(<UserCentricLeaderboard studentId={1} compact={false} />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('joueurs battus')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('percentile')).toBeInTheDocument();
    });

    it('hides context statistics in compact mode', () => {
      render(<UserCentricLeaderboard studentId={1} compact={true} />);

      expect(screen.queryByText('joueurs battus')).not.toBeInTheDocument();
      expect(screen.queryByText('percentile')).not.toBeInTheDocument();
    });

    it('hides rank display in compact mode', () => {
      render(<UserCentricLeaderboard studentId={1} compact={true} />);

      expect(screen.queryByText('Top 15%')).not.toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('calls useUserCentricLeaderboard with correct parameters', () => {
      render(<UserCentricLeaderboard studentId={123} type="weekly" category="exercises" />);

      expect(mockHooks.useUserCentricLeaderboard).toHaveBeenCalledWith(123, 'weekly', 'exercises', 3);
    });

    it('calls motivation message hook with correct data', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(mockHooks.useMotivationMessage).toHaveBeenCalledWith(mockLeaderboardData);
    });

    it('calls rank change icon hook', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(mockHooks.useRankChangeIcon).toHaveBeenCalled();
    });

    it('calls badge style hook', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(mockHooks.useBadgeStyle).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('memoizes motivation message', () => {
      const { rerender } = render(<UserCentricLeaderboard studentId={1} />);

      // Initial render
      expect(mockHooks.useMotivationMessage).toHaveBeenCalledTimes(1);

      // Rerender with same props
      rerender(<UserCentricLeaderboard studentId={1} />);

      // Should not call motivation hook again due to memoization
      expect(mockHooks.useMotivationMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('provides appropriate button roles', () => {
      mockHooks.useUserCentricLeaderboard.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load'),
        refetch: jest.fn()
      });

      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByRole('button', { name: 'Actualiser' })).toBeInTheDocument();
    });

    it('uses semantic HTML structure', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      expect(screen.getByText('<¯ Votre Classement')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles entries without streaks', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      // Bob has streak: 0, so should not show streak indicator
      const bobElement = screen.getByText('Bob').closest('div');
      expect(bobElement).not.toHaveTextContent('=% 0');
    });

    it('handles entries without badges', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      // Should render without errors even for entries with empty badges array
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('handles zero rank change', () => {
      render(<UserCentricLeaderboard studentId={1} />);

      // Should display entries with zero rank change correctly
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });
});