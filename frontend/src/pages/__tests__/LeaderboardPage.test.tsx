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
}));

// Mock leaderboard data
const mockLeaderboardData = {
  global: [
    { id: 1, name: 'Lucas Dubois', xp: 2500, level: 8, avatar: 'dragon', rank: 1, change: '+2' },
    { id: 2, name: 'Emma Martin', xp: 2400, level: 7, avatar: 'fairy', rank: 2, change: '+1' },
    { id: 3, name: 'Noah Garcia', xp: 2300, level: 7, avatar: 'robot', rank: 3, change: '-1' },
    { id: 4, name: 'Léa Bernard', xp: 2200, level: 6, avatar: 'cat', rank: 4, change: '+3' },
    { id: 5, name: 'Alice Rodriguez', xp: 2100, level: 6, avatar: 'owl', rank: 5, change: '-2' },
  ],
  class: [
    { id: 1, name: 'Emma Martin', xp: 1250, level: 5, avatar: 'dragon', rank: 1, change: '+1' },
    { id: 2, name: 'Lucas Dubois', xp: 1200, level: 5, avatar: 'fairy', rank: 2, change: '-1' },
    { id: 3, name: 'Noah Garcia', xp: 1150, level: 4, avatar: 'robot', rank: 3, change: '+2' },
  ],
  weekly: [
    { id: 1, name: 'Emma Martin', xp: 450, level: 5, avatar: 'dragon', rank: 1, change: '+1' },
    { id: 2, name: 'Lucas Dubois', xp: 400, level: 5, avatar: 'fairy', rank: 2, change: '-1' },
    { id: 3, name: 'Léa Bernard', xp: 350, level: 4, avatar: 'cat', rank: 3, change: '+3' },
  ],
};

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

      expect(screen.getByText('Classement')).toBeInTheDocument();
      expect(screen.getByText('Classement Global')).toBeInTheDocument();
    });

    it('should display top 3 players with special styling', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('Lucas Dubois')).toBeInTheDocument();
      expect(screen.getByText('Emma Martin')).toBeInTheDocument();
      expect(screen.getByText('Noah Garcia')).toBeInTheDocument();

      // Top 3 should have special styling
      expect(screen.getByText('1er')).toBeInTheDocument();
      expect(screen.getByText('2ème')).toBeInTheDocument();
      expect(screen.getByText('3ème')).toBeInTheDocument();
    });

    it('should show player statistics', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('2,500 XP')).toBeInTheDocument();
      expect(screen.getByText('Niveau 8')).toBeInTheDocument();
      expect(screen.getByText('+2')).toBeInTheDocument(); // rank change
    });

    it('should display current user position', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('Ta position')).toBeInTheDocument();
      expect(screen.getByText('2ème')).toBeInTheDocument(); // Emma Martin is current user
    });
  });

  describe('Filtering and Categories', () => {
    it('should switch between different leaderboard categories', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Initially shows global leaderboard
      expect(screen.getByText('Classement Global')).toBeInTheDocument();

      // Switch to class leaderboard
      const classButton = screen.getByRole('button', { name: /classe/i });
      await user.click(classButton);

      expect(screen.getByText('Classement de la Classe')).toBeInTheDocument();
      expect(screen.getByText('Emma Martin')).toBeInTheDocument(); // Should still be there but different data
    });

    it('should switch to weekly leaderboard', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      const weeklyButton = screen.getByRole('button', { name: /semaine/i });
      await user.click(weeklyButton);

      expect(screen.getByText('Classement de la Semaine')).toBeInTheDocument();
    });

    it('should show different data for different categories', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Global shows higher XP values
      expect(screen.getByText('2,500 XP')).toBeInTheDocument();

      // Switch to class
      const classButton = screen.getByRole('button', { name: /classe/i });
      await user.click(classButton);

      // Class shows lower XP values
      expect(screen.getByText('1,250 XP')).toBeInTheDocument();
    });
  });

  describe('Ranking Display', () => {
    it('should show correct rank numbers', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('1er')).toBeInTheDocument();
      expect(screen.getByText('2ème')).toBeInTheDocument();
      expect(screen.getByText('3ème')).toBeInTheDocument();
      expect(screen.getByText('4ème')).toBeInTheDocument();
      expect(screen.getByText('5ème')).toBeInTheDocument();
    });

    it('should highlight current user in the list', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      const currentUserRow = screen.getByText('Emma Martin').closest('div');
      expect(currentUserRow).toHaveClass(/current-user|highlight/);
    });

    it('should show rank change indicators', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('+2')).toBeInTheDocument(); // Lucas moved up 2
      expect(screen.getByText('+1')).toBeInTheDocument(); // Emma moved up 1
      expect(screen.getByText('-1')).toBeInTheDocument(); // Noah moved down 1
    });

    it('should display appropriate icons for top positions', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // 1st place should have crown
      expect(screen.getAllByTestId('crown-icon')).toHaveLength(1);
      
      // 2nd and 3rd should have medals
      expect(screen.getAllByTestId('medal-icon')).toHaveLength(2);
    });
  });

  describe('User Interactions', () => {
    it('should show player details when player is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      const playerRow = screen.getByText('Lucas Dubois').closest('div');
      await user.click(playerRow!);

      await waitFor(() => {
        expect(screen.getByText('Profil de Lucas Dubois')).toBeInTheDocument();
        expect(screen.getByText('Niveau 8')).toBeInTheDocument();
        expect(screen.getByText('2,500 XP')).toBeInTheDocument();
      });
    });

    it('should close player details when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Open player details
      const playerRow = screen.getByText('Lucas Dubois').closest('div');
      await user.click(playerRow!);

      await waitFor(() => {
        expect(screen.getByText('Profil de Lucas Dubois')).toBeInTheDocument();
      });

      // Close player details
      const closeButton = screen.getByRole('button', { name: /fermer/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Profil de Lucas Dubois')).not.toBeInTheDocument();
      });
    });

    it('should navigate back to home when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      const backButton = screen.getByTestId('arrow-left-icon').closest('button');
      await user.click(backButton!);

      expect(window.location.pathname).toBe('/');
    });
  });

  describe('Motivational Elements', () => {
    it('should show motivational message for current user', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText(/Tu es en 2ème position/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue comme ça/i)).toBeInTheDocument();
    });

    it('should show different messages based on user position', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Switch to class leaderboard where Emma is 1st
      const classButton = screen.getByRole('button', { name: /classe/i });
      await user.click(classButton);

      expect(screen.getByText(/Tu es en 1ère position/i)).toBeInTheDocument();
      expect(screen.getByText(/Excellent travail/i)).toBeInTheDocument();
    });

    it('should show next target to beat', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('Prochain objectif')).toBeInTheDocument();
      expect(screen.getByText('Lucas Dubois')).toBeInTheDocument();
      expect(screen.getByText('100 XP de plus pour le dépasser')).toBeInTheDocument();
    });

    it('should display achievement badges', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('Badges')).toBeInTheDocument();
      expect(screen.getByText('Top 3')).toBeInTheDocument();
      expect(screen.getByText('Série de 7 jours')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should update leaderboard data in real-time', async () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Initially shows current data
      expect(screen.getByText('Lucas Dubois')).toBeInTheDocument();
      expect(screen.getByText('2,500 XP')).toBeInTheDocument();

      // Simulate real-time update
      const updatedData = {
        ...mockLeaderboardData,
        global: [
          { id: 1, name: 'Lucas Dubois', xp: 2600, level: 8, avatar: 'dragon', rank: 1, change: '+2' },
          ...mockLeaderboardData.global.slice(1)
        ]
      };

      // This would trigger a re-render with new data
      await waitFor(() => {
        expect(screen.getByText('2,600 XP')).toBeInTheDocument();
      });
    });

    it('should show notification when user moves up in ranking', async () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Simulate rank change notification
      await waitFor(() => {
        expect(screen.getByText('Félicitations!')).toBeInTheDocument();
        expect(screen.getByText('Tu as gagné une place!')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Statistics', () => {
    it('should display performance statistics', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('Statistiques')).toBeInTheDocument();
      expect(screen.getByText('Exercices terminés: 45')).toBeInTheDocument();
      expect(screen.getByText('Score moyen: 87%')).toBeInTheDocument();
      expect(screen.getByText('Série actuelle: 7 jours')).toBeInTheDocument();
    });

    it('should show progress charts', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('Progrès cette semaine')).toBeInTheDocument();
      expect(screen.getByText('Progrès ce mois')).toBeInTheDocument();
    });

    it('should display comparison with other players', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      expect(screen.getByText('Comparaison')).toBeInTheDocument();
      expect(screen.getByText('Tu es 100 XP derrière Lucas')).toBeInTheDocument();
      expect(screen.getByText('Tu es 50 XP devant Noah')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle leaderboard loading errors', async () => {
      const { apiService } = require('../../services/api');
      apiService.getLeaderboard.mockRejectedValue(new Error('Failed to load leaderboard'));

      render(<LeaderboardPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/erreur de chargement/i)).toBeInTheDocument();
      });
    });

    it('should show retry button when loading fails', async () => {
      const { apiService } = require('../../services/api');
      apiService.getLeaderboard.mockRejectedValue(new Error('Failed to load leaderboard'));

      render(<LeaderboardPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /réessayer/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should retry loading when retry button is clicked', async () => {
      const user = userEvent.setup();
      const { apiService } = require('../../services/api');
      apiService.getLeaderboard
        .mockRejectedValueOnce(new Error('Failed to load leaderboard'))
        .mockResolvedValueOnce(mockLeaderboardData);

      render(<LeaderboardPage />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/erreur de chargement/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /réessayer/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Lucas Dubois')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      const filterButtons = screen.getAllByRole('button');
      filterButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      const classButton = screen.getByRole('button', { name: /classe/i });
      classButton.focus();
      expect(classButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Classement de la Classe')).toBeInTheDocument();
    });

    it('should announce rank changes to screen readers', async () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Should have aria-live region for announcements
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<LeaderboardPage />, { wrapper: TestWrapper });

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Classement');

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile screen size
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Should still display main content
      expect(screen.getByText('Classement')).toBeInTheDocument();
      expect(screen.getByText('Lucas Dubois')).toBeInTheDocument();
    });

    it('should show mobile-optimized player cards', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

      render(<LeaderboardPage />, { wrapper: TestWrapper });

      // Should have mobile-friendly layout
      expect(screen.getByText('Lucas Dubois')).toBeInTheDocument();
    });
  });
});
