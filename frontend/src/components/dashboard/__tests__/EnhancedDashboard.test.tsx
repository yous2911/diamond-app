import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import EnhancedDashboard from '../EnhancedDashboard';
import { useAuth } from '../../../contexts/AuthContext';
import { useCompetitions, useLeaderboardStats, useStudentBadges, useUserCentricLeaderboard, useMotivationMessage, useRankChangeIcon, useBadgeStyle } from '../../../hooks/useLeaderboard';

// Mock the hooks and context
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../hooks/useLeaderboard');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { variants, initial, animate, transition, whileHover, whileTap, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
    h1: ({ children, ...props }: any) => {
      const { variants, initial, animate, transition, whileHover, whileTap, ...domProps } = props;
      return <h1 {...domProps}>{children}</h1>;
    },
    p: ({ children, ...props }: any) => {
      const { variants, initial, animate, transition, whileHover, whileTap, ...domProps } = props;
      return <p {...domProps}>{children}</p>;
    },
    button: ({ children, ...props }: any) => {
      const { variants, initial, animate, transition, whileHover, whileTap, ...domProps } = props;
      return <button {...domProps}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// To help with type inference
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseCompetitions = useCompetitions as jest.MockedFunction<typeof useCompetitions>;
const mockUseLeaderboardStats = useLeaderboardStats as jest.MockedFunction<typeof useLeaderboardStats>;
const mockUseStudentBadges = useStudentBadges as jest.MockedFunction<typeof useStudentBadges>;
const mockUseUserCentricLeaderboard = useUserCentricLeaderboard as jest.MockedFunction<typeof useUserCentricLeaderboard>;
const mockUseMotivationMessage = useMotivationMessage as jest.MockedFunction<typeof useMotivationMessage>;
const mockUseRankChangeIcon = useRankChangeIcon as jest.MockedFunction<typeof useRankChangeIcon>;
const mockUseBadgeStyle = useBadgeStyle as jest.MockedFunction<typeof useBadgeStyle>;

describe('EnhancedDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    jest.clearAllMocks();
    // Provide a default mock implementation for useAuth
    mockUseAuth.mockReturnValue({ student: { id: 1, name: 'Test Student' } });
    // Provide a default mock implementation for useStudentBadges
    mockUseStudentBadges.mockReturnValue({ data: [], isLoading: false, error: null, refetch: jest.fn() });
    // Provide a default mock implementation for useUserCentricLeaderboard
    mockUseUserCentricLeaderboard.mockReturnValue({ 
      data: null, 
      isLoading: false, 
      error: null, 
      refetch: jest.fn() 
    });
    // Provide a default mock implementation for useMotivationMessage
    mockUseMotivationMessage.mockReturnValue(jest.fn(() => 'Test motivation message'));
    // Provide a default mock implementation for useRankChangeIcon
    mockUseRankChangeIcon.mockReturnValue(jest.fn(() => ({ 
      icon: '➖', 
      color: 'text-gray-500', 
      bg: 'bg-gray-100' 
    })));
    // Provide a default mock implementation for useBadgeStyle
    mockUseBadgeStyle.mockReturnValue(jest.fn(() => ({ 
      bg: 'bg-gray-100', 
      border: 'border-gray-300', 
      text: 'text-gray-700', 
      glow: 'shadow-sm' 
    })));
  });

  it('renders the main heading correctly', () => {
    // Arrange: Set up mock return values for a non-loading, no-data state
    mockUseCompetitions.mockReturnValue({ data: [], isLoading: false });
    mockUseLeaderboardStats.mockReturnValue({ data: null, isLoading: false });

    // Act
    render(<EnhancedDashboard />);

    // Assert
    expect(screen.getByRole('heading', { name: /Tableau de Bord Gamifié/i })).toBeInTheDocument();
  });

  it('renders skeleton loaders when data is loading', () => {
    // Arrange: Simulate loading state
    mockUseCompetitions.mockReturnValue({ data: null, isLoading: true });
    mockUseLeaderboardStats.mockReturnValue({ data: null, isLoading: true });

    // Act
    render(<EnhancedDashboard />);

    // Assert: Check for competition skeleton loaders using the new data-testid
    const competitionSkeletons = screen.getAllByTestId('skeleton-card');
    expect(competitionSkeletons.length).toBeGreaterThan(0);

    // Assert: Check that the stats bar is not rendered
    expect(screen.queryByText(/Joueurs actifs/i)).not.toBeInTheDocument();
  });

  it('renders data correctly when loaded successfully', () => {
    // Arrange: Provide mock data for competitions and stats
    const competitionsData = [
      { id: 1, name: 'Math Challenge', description: 'A fun challenge for all', participants: 10, progress: { percentage: 50 }, rewards: ['Gold Badge'] },
      { id: 2, name: 'Reading Sprint', description: 'Read 5 books in a week', participants: 25, progress: { percentage: 80 }, rewards: ['Bookworm Badge'] },
    ];
    const statsData = {
      totalParticipants: 150,
      totalBadgesEarned: 500,
      averageStreak: 5,
    };
    mockUseCompetitions.mockReturnValue({ data: competitionsData, isLoading: false });
    mockUseLeaderboardStats.mockReturnValue({ data: statsData, isLoading: false });

    // Act
    render(<EnhancedDashboard />);

    // Assert: Check for stats values
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText(/Joueurs actifs/i)).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.getByText(/Badges gagnés/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/Série moyenne/i)).toBeInTheDocument();

    // Assert: Check for competition details
    expect(screen.getByText('Math Challenge')).toBeInTheDocument();
    expect(screen.getByText(/A fun challenge for all/i)).toBeInTheDocument();
    expect(screen.getByText('Reading Sprint')).toBeInTheDocument();
  });

  it('renders a message when there are no active competitions', () => {
    // Arrange: Mock an empty array for competitions
    mockUseCompetitions.mockReturnValue({ data: [], isLoading: false });
    mockUseLeaderboardStats.mockReturnValue({ data: { totalParticipants: 10, totalBadgesEarned: 20, averageStreak: 3 }, isLoading: false });

    // Act
    render(<EnhancedDashboard />);

    // Assert
    expect(screen.getByText(/Aucune compétition active pour le moment/i)).toBeInTheDocument();
  });
});
