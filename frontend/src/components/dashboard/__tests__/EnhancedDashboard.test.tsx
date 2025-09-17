import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EnhancedDashboard from '../EnhancedDashboard';
import { useAuth } from '../../../contexts/AuthContext';
import { useCompetitions, useLeaderboardStats } from '../../../hooks/useLeaderboard';

// Mock the hooks and context
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../hooks/useLeaderboard', () => ({
  useCompetitions: vi.fn(),
  useLeaderboardStats: vi.fn(),
}));

// To help with type inference
const mockUseAuth = useAuth as vi.Mock;
const mockUseCompetitions = useCompetitions as vi.Mock;
const mockUseLeaderboardStats = useLeaderboardStats as vi.Mock;

describe('EnhancedDashboard', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure test isolation
    vi.resetAllMocks();
    // Provide a default mock implementation for useAuth
    mockUseAuth.mockReturnValue({ student: { id: 1, name: 'Test Student' } });
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
