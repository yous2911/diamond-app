import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PsychologyDrivenDashboard from '../PsychologyDrivenDashboard';
import { useAuth } from '../../../contexts/AuthContext';
import {
  useGamificationProfile,
  useUserCentricLeaderboard,
  useXpProgression,
  useStreakManagement,
  useKudosSystem,
  useMotivationEngine,
  useAchievementStyling
} from '../../../hooks/useGamification';

// Mock all dependencies
vi.mock('../../../contexts/AuthContext');
vi.mock('../../../hooks/useGamification');
vi.mock('react-confetti', () => ({
  __esModule: true,
  default: () => <div data-testid="confetti" />,
}));

// Type-safe mock references
const mockUseAuth = useAuth as vi.Mock;
const mockUseGamificationProfile = useGamificationProfile as vi.Mock;
const mockUseUserCentricLeaderboard = useUserCentricLeaderboard as vi.Mock;
const mockUseXpProgression = useXpProgression as vi.Mock;
const mockUseStreakManagement = useStreakManagement as vi.Mock;
const mockUseKudosSystem = useKudosSystem as vi.Mock;
const mockUseMotivationEngine = useMotivationEngine as vi.Mock;
const mockUseAchievementStyling = useAchievementStyling as vi.Mock;

const mockAwardXp = vi.fn();
const mockPingStreak = vi.fn();
const mockGiveKudos = vi.fn();
const mockRefetchProfile = vi.fn();
const mockRefetchLeaderboard = vi.fn();

const defaultProfile = {
  level: 5,
  xp: 1200,
  xpToNext: 800,
  progressPercent: 60,
  rank: { position: 42, percentile: 88 },
  streak: { current: 10, best: 25 },
  badges: [{ id: 1, name: 'Pionnier', rarity: 'rare', icon: '🚀' }],
};

const defaultLeaderboard = {
  context: { beatingCount: 50, nextTarget: { name: 'Rival', pointsNeeded: 100 } },
  entries: [
    { id: 1, prenom: 'Vous', rank: 42, score: 1200, level: 5, streak: 10, isMe: true },
    { id: 2, prenom: 'Rival', rank: 41, score: 1300, level: 6, streak: 12, isMe: false },
  ],
};

describe('PsychologyDrivenDashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseAuth.mockReturnValue({ student: { id: 1 } });
    mockUseGamificationProfile.mockReturnValue({ data: defaultProfile, isLoading: false, refetch: mockRefetchProfile });
    mockUseUserCentricLeaderboard.mockReturnValue({ data: defaultLeaderboard, isLoading: false, refetch: mockRefetchLeaderboard });
    mockUseXpProgression.mockReturnValue({ awardXp: mockAwardXp, isAwarding: false });
    mockUseStreakManagement.mockReturnValue({ pingStreak: mockPingStreak, isPinging: false });
    mockUseKudosSystem.mockReturnValue({ giveKudos: mockGiveKudos, isGiving: false });
    mockUseMotivationEngine.mockReturnValue(() => 'Keep up the great work!');
    mockUseAchievementStyling.mockReturnValue(() => ({ bg: 'bg-yellow-100', glow: 'shadow-yellow' }));
  });

  it('renders loading state correctly', () => {
    mockUseGamificationProfile.mockReturnValue({ data: null, isLoading: true, refetch: mockRefetchProfile });
    render(<PsychologyDrivenDashboard />);
    expect(screen.getAllByTestId('skeleton-card').length).toBeGreaterThan(0);
  });

  it('renders error state if data is missing', () => {
    mockUseGamificationProfile.mockReturnValue({ data: null, isLoading: false, refetch: mockRefetchProfile });
    render(<PsychologyDrivenDashboard />);
    expect(screen.getByText(/Données de gamification indisponibles/i)).toBeInTheDocument();
  });

  it('renders dashboard with data successfully', () => {
    render(<PsychologyDrivenDashboard />);
    expect(screen.getByText(/Votre Arena Personnelle/i)).toBeInTheDocument();
    expect(screen.getByText(/Niveau 5/i)).toBeInTheDocument();
    expect(screen.getByText(/#42/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep up the great work!/i)).toBeInTheDocument();
    expect(screen.getByText(/Rival/i)).toBeInTheDocument();
  });

  it('handles awarding XP and shows celebration', async () => {
    vi.useFakeTimers();
    mockAwardXp.mockResolvedValue({ success: true, shouldCelebrate: true });
    render(<PsychologyDrivenDashboard />);

    const xpButton = screen.getByRole('button', { name: /Terminer un exercice/i });
    fireEvent.click(xpButton);

    await waitFor(() => expect(mockAwardXp).toHaveBeenCalledWith(1, 50, 'exercise_complete'));

    // Check for celebration modal
    expect(screen.getByText(/NIVEAU 5!/i)).toBeInTheDocument();
    expect(screen.getByTestId('confetti')).toBeInTheDocument();

    // Fast-forward timers to hide celebration and refetch
    vi.advanceTimeBy(4000);
    await waitFor(() => {
      expect(screen.queryByText(/NIVEAU 5!/i)).not.toBeInTheDocument();
      expect(mockRefetchProfile).toHaveBeenCalled();
      expect(mockRefetchLeaderboard).toHaveBeenCalled();
    });
    vi.useRealTimers();
  });

  it('handles pinging a streak', async () => {
    vi.useFakeTimers();
    mockPingStreak.mockResolvedValue({ success: true, shouldCelebrate: true, bonusAwarded: 25 });
    render(<PsychologyDrivenDashboard />);

    const streakButton = screen.getByRole('button', { name: /Série quotidienne/i });
    fireEvent.click(streakButton);

    await waitFor(() => expect(mockPingStreak).toHaveBeenCalledWith(1));

    // Check for streak notification
    expect(screen.getByText(/Série Milestone!/i)).toBeInTheDocument();

    // Check that bonus XP is awarded
    vi.advanceTimeBy(1000);
    await waitFor(() => expect(mockAwardXp).toHaveBeenCalledWith(1, 25, 'streak_bonus'));

    vi.useRealTimers();
  });

  it('handles giving kudos to another user', async () => {
    render(<PsychologyDrivenDashboard />);
    const kudosButton = screen.getByRole('button', { name: /Donner des kudos à Rival/i });
    fireEvent.click(kudosButton);

    await waitFor(() => expect(mockGiveKudos).toHaveBeenCalledWith(1, 2));
    await waitFor(() => expect(mockRefetchLeaderboard).toHaveBeenCalled());
  });
});
