/**
 * HomePage Component Tests for FastRevEd Kids
 * Tests main dashboard, student profile, mascot interactions, and navigation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../HomePage';
import { AuthProvider } from '../../contexts/AuthContext';
import { CelebrationProvider } from '../../contexts/CelebrationContext';
import { PremiumFeaturesProvider } from '../../contexts/PremiumFeaturesContext';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock the API service
jest.mock('../../services/api', () => ({
  apiService: {
    getStudentProfile: jest.fn(),
    updateStudentProfile: jest.fn(),
    getExercises: jest.fn(),
    submitExerciseResult: jest.fn(),
    getMascotData: jest.fn(),
    updateMascotEmotion: jest.fn(),
    getWardrobeItems: jest.fn(),
    equipWardrobeItem: jest.fn(),
    getAchievements: jest.fn(),
    getLeaderboard: jest.fn(),
  }
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...domProps } = props;
      return <button {...domProps}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  BookOpen: () => <div data-testid="book-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Play: () => <div data-testid="play-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
}));

// Mock window dimensions
Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 });
Object.defineProperty(window, 'innerHeight', { writable: true, value: 768 });

// Mock student data
const mockStudent = {
  id: 1,
  prenom: 'Emma',
  nom: 'Martin',
  identifiant: 'emma.martin',
  classe: '5A',
  niveau: 'CE1',
  ageGroup: '6-8' as const,
  totalXp: 1250,
  currentLevel: 5,
  currentStreak: 7,
  heartsRemaining: 5,
  dateInscription: '2024-01-15',
  lastLogin: '2024-01-20T10:30:00Z',
  preferences: {
    mascotType: 'dragon',
    difficulty: 'normal',
    soundEnabled: true
  },
  statistics: {
    exercisesCompleted: 45,
    averageScore: 87,
    timeSpent: 1200, // minutes
    achievementsUnlocked: 12,
    currentWeekProgress: 85,
    monthlyGoal: 100,
  }
};

// Mock mascot data
const mockMascotData = {
  type: 'dragon',
  emotion: 'happy',
  level: 5,
  xp: 1250,
  equippedItems: ['magic_wand', 'crown'],
  unlockedItems: ['magic_wand', 'crown', 'cape', 'glasses'],
  personality: {
    encouragement: 85,
    playfulness: 70,
    wisdom: 90,
  }
};

// Mock wardrobe data
const mockWardrobeItems = [
  {
    id: 'magic_wand',
    name: 'Baguette Magique',
    type: 'accessory',
    rarity: 'rare',
    unlocked: true,
    equipped: true,
    unlockLevel: 3,
  },
  {
    id: 'crown',
    name: 'Couronne Royale',
    type: 'hat',
    rarity: 'epic',
    unlocked: true,
    equipped: true,
    unlockLevel: 5,
  },
  {
    id: 'cape',
    name: 'Cape Héroïque',
    type: 'cape',
    rarity: 'common',
    unlocked: true,
    equipped: false,
    unlockLevel: 2,
  },
];

// Mock achievements data
const mockAchievements = [
  {
    id: 'math_master',
    title: 'Maître des Maths',
    description: 'Terminer 10 exercices de mathématiques',
    icon: 'calculator',
    unlocked: true,
    unlockedAt: '2024-01-18T14:30:00Z',
    xpReward: 100,
  },
  {
    id: 'streak_warrior',
    title: 'Guerrier de la Série',
    description: 'Maintenir une série de 7 jours',
    icon: 'flame',
    unlocked: true,
    unlockedAt: '2024-01-20T09:00:00Z',
    xpReward: 150,
  },
];

// Test wrapper with all providers
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
// HOMEPAGE COMPONENT TESTS
// =============================================================================

describe('HomePage', () => {
  describe('Rendering', () => {
    it('should render homepage with all main sections', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Check main sections
      expect(screen.getByText('FastRevEd Kids')).toBeInTheDocument();
      expect(screen.getByText('Interface Diamant 💎')).toBeInTheDocument();
      
      // Check student profile section
      expect(screen.getByText('Emma Martin')).toBeInTheDocument();
      expect(screen.getByText('Niveau 5')).toBeInTheDocument();
      expect(screen.getByText('1,250 XP')).toBeInTheDocument();
      
      // Check mascot section
      expect(screen.getByText('Ton Mascot')).toBeInTheDocument();
      
      // Check quick actions
      expect(screen.getByText('Exercices')).toBeInTheDocument();
      expect(screen.getByText('Classement')).toBeInTheDocument();
      expect(screen.getByText('Garde-robe')).toBeInTheDocument();
    });

    it('should display student statistics correctly', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('45')).toBeInTheDocument(); // exercises completed
      expect(screen.getByText('87%')).toBeInTheDocument(); // average score
      expect(screen.getByText('7')).toBeInTheDocument(); // current streak
      expect(screen.getByText('12')).toBeInTheDocument(); // achievements unlocked
    });

    it('should show progress indicators', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // XP progress bar
      expect(screen.getByText(/1,250 \/ 1,500 XP/)).toBeInTheDocument();
      
      // Weekly progress
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Progrès de la semaine')).toBeInTheDocument();
      
      // Monthly goal
      expect(screen.getByText('85 / 100')).toBeInTheDocument();
      expect(screen.getByText('Objectif mensuel')).toBeInTheDocument();
    });

    it('should display mascot information', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Dragon')).toBeInTheDocument();
      expect(screen.getByText('Heureux')).toBeInTheDocument();
      expect(screen.getByText('Niveau 5')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to exercises page when exercises button is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const exercisesButton = screen.getByRole('button', { name: /exercices/i });
      await user.click(exercisesButton);

      // Should navigate to exercises page
      expect(window.location.pathname).toBe('/exercises');
    });

    it('should navigate to leaderboard page when leaderboard button is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const leaderboardButton = screen.getByRole('button', { name: /classement/i });
      await user.click(leaderboardButton);

      // Should navigate to leaderboard page
      expect(window.location.pathname).toBe('/leaderboard');
    });

    it('should open wardrobe modal when wardrobe button is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const wardrobeButton = screen.getByRole('button', { name: /garde-robe/i });
      await user.click(wardrobeButton);

      await waitFor(() => {
        expect(screen.getByText('Garde-robe du Mascot')).toBeInTheDocument();
      });
    });

    it('should open settings modal when settings button is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText('Paramètres')).toBeInTheDocument();
      });
    });
  });

  describe('Mascot Interactions', () => {
    it('should display mascot with correct emotion and level', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Dragon')).toBeInTheDocument();
      expect(screen.getByText('Heureux')).toBeInTheDocument();
      expect(screen.getByText('Niveau 5')).toBeInTheDocument();
    });

    it('should show equipped wardrobe items on mascot', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Baguette Magique')).toBeInTheDocument();
      expect(screen.getByText('Couronne Royale')).toBeInTheDocument();
    });

    it('should update mascot emotion when clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const mascot = screen.getByText('Dragon').closest('div');
      await user.click(mascot!);

      // Should cycle through emotions
      await waitFor(() => {
        expect(screen.getByText(/Pensif|Excited|Sleepy/)).toBeInTheDocument();
      });
    });

    it('should show mascot personality stats', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Encouragement')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Joueur')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();
      expect(screen.getByText('Sagesse')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });

  describe('Achievements Section', () => {
    it('should display recent achievements', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Récompenses Récentes')).toBeInTheDocument();
      expect(screen.getByText('Maître des Maths')).toBeInTheDocument();
      expect(screen.getByText('Guerrier de la Série')).toBeInTheDocument();
    });

    it('should show achievement details when clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const achievement = screen.getByText('Maître des Maths');
      await user.click(achievement);

      await waitFor(() => {
        expect(screen.getByText('Terminer 10 exercices de mathématiques')).toBeInTheDocument();
        expect(screen.getByText('+100 XP')).toBeInTheDocument();
      });
    });

    it('should navigate to full achievements page when view all is clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const viewAllButton = screen.getByText(/voir toutes les récompenses/i);
      await user.click(viewAllButton);

      // Should navigate to achievements page
      expect(window.location.pathname).toBe('/achievements');
    });
  });

  describe('Progress Tracking', () => {
    it('should display XP progress bar with correct values', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '1250');
      expect(progressBar).toHaveAttribute('aria-valuemax', '1500');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    });

    it('should show level progression information', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('250 XP jusqu\'au niveau 6')).toBeInTheDocument();
    });

    it('should display weekly progress chart', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Progrès de la semaine')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    it('should show monthly goal progress', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Objectif mensuel')).toBeInTheDocument();
      expect(screen.getByText('85 / 100')).toBeInTheDocument();
      expect(screen.getByText('15 exercices restants')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should display all quick action buttons', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByRole('button', { name: /exercices/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /classement/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /garde-robe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /récompenses/i })).toBeInTheDocument();
    });

    it('should show exercise recommendations based on progress', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Recommandé pour toi')).toBeInTheDocument();
      expect(screen.getByText('Mathématiques - Niveau CE1')).toBeInTheDocument();
      expect(screen.getByText('Français - Conjugaison')).toBeInTheDocument();
    });

    it('should start recommended exercise when clicked', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const recommendedExercise = screen.getByText('Mathématiques - Niveau CE1');
      await user.click(recommendedExercise);

      // Should navigate to specific exercise
      expect(window.location.pathname).toBe('/exercises/math-ce1');
    });
  });

  describe('Wardrobe Modal', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const wardrobeButton = screen.getByRole('button', { name: /garde-robe/i });
      await user.click(wardrobeButton);

      await waitFor(() => {
        expect(screen.getByText('Garde-robe du Mascot')).toBeInTheDocument();
      });
    });

    it('should display all wardrobe items', () => {
      expect(screen.getByText('Baguette Magique')).toBeInTheDocument();
      expect(screen.getByText('Couronne Royale')).toBeInTheDocument();
      expect(screen.getByText('Cape Héroïque')).toBeInTheDocument();
    });

    it('should show item rarity and unlock level', () => {
      expect(screen.getByText('Rare')).toBeInTheDocument();
      expect(screen.getByText('Épique')).toBeInTheDocument();
      expect(screen.getByText('Commun')).toBeInTheDocument();
      expect(screen.getByText('Niveau 3')).toBeInTheDocument();
      expect(screen.getByText('Niveau 5')).toBeInTheDocument();
    });

    it('should equip/unequip items when clicked', async () => {
      const user = userEvent.setup();

      const capeItem = screen.getByText('Cape Héroïque');
      await user.click(capeItem);

      // Should show equipped state
      expect(screen.getByText('Équipé')).toBeInTheDocument();
    });

    it('should close wardrobe modal when close button is clicked', async () => {
      const user = userEvent.setup();

      const closeButton = screen.getByRole('button', { name: /fermer/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Garde-robe du Mascot')).not.toBeInTheDocument();
      });
    });
  });

  describe('Settings Modal', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const settingsButton = screen.getByTestId('settings-icon').closest('button');
      await user.click(settingsButton!);

      await waitFor(() => {
        expect(screen.getByText('Paramètres')).toBeInTheDocument();
      });
    });

    it('should display all settings options', () => {
      expect(screen.getByText('Son')).toBeInTheDocument();
      expect(screen.getByText('Animations')).toBeInTheDocument();
      expect(screen.getByText('Difficulté')).toBeInTheDocument();
      expect(screen.getByText('Type de Mascot')).toBeInTheDocument();
    });

    it('should toggle sound setting', async () => {
      const user = userEvent.setup();

      const soundToggle = screen.getByRole('switch', { name: /son/i });
      await user.click(soundToggle);

      expect(soundToggle).toBeChecked();
    });

    it('should change mascot type', async () => {
      const user = userEvent.setup();

      const mascotSelect = screen.getByDisplayValue('Dragon');
      await user.selectOptions(mascotSelect, 'fairy');

      expect(screen.getByDisplayValue('Fairy')).toBeInTheDocument();
    });

    it('should save settings when save button is clicked', async () => {
      const user = userEvent.setup();

      const saveButton = screen.getByRole('button', { name: /sauvegarder/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Paramètres sauvegardés!')).toBeInTheDocument();
      });
    });
  });

  describe('User Profile', () => {
    it('should display student information correctly', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Emma Martin')).toBeInTheDocument();
      expect(screen.getByText('Classe 5A')).toBeInTheDocument();
      expect(screen.getByText('Niveau CE1')).toBeInTheDocument();
      expect(screen.getByText('6-8 ans')).toBeInTheDocument();
    });

    it('should show login information', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Dernière connexion')).toBeInTheDocument();
      expect(screen.getByText(/il y a/i)).toBeInTheDocument();
    });

    it('should display hearts/lives remaining', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      expect(screen.getByText('Cœurs')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile screen size
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });
      Object.defineProperty(window, 'innerHeight', { writable: true, value: 667 });

      render(<HomePage />, { wrapper: TestWrapper });

      // Should still display main content
      expect(screen.getByText('FastRevEd Kids')).toBeInTheDocument();
      expect(screen.getByText('Emma Martin')).toBeInTheDocument();
    });

    it('should show mobile navigation menu', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

      render(<HomePage />, { wrapper: TestWrapper });

      // Should have mobile menu button
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API error
      const { apiService } = require('../../services/api');
      apiService.getStudentProfile.mockRejectedValue(new Error('API Error'));

      render(<HomePage />, { wrapper: TestWrapper });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/erreur de chargement/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while data is being fetched', () => {
      // Mock slow API response
      const { apiService } = require('../../services/api');
      apiService.getStudentProfile.mockImplementation(() => new Promise(() => {}));

      render(<HomePage />, { wrapper: TestWrapper });

      // Should show loading indicators
      expect(screen.getByText(/chargement/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      const exercisesButton = screen.getByRole('button', { name: /exercices/i });
      expect(exercisesButton).toHaveAttribute('aria-label');

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<HomePage />, { wrapper: TestWrapper });

      const exercisesButton = screen.getByRole('button', { name: /exercices/i });
      
      // Should be focusable
      exercisesButton.focus();
      expect(exercisesButton).toHaveFocus();

      // Should activate with Enter key
      await user.keyboard('{Enter}');
      expect(window.location.pathname).toBe('/exercises');
    });

    it('should have proper heading hierarchy', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('FastRevEd Kids');

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      const TestComponent = () => {
        renderSpy();
        return <HomePage />;
      };

      render(<TestComponent />, { wrapper: TestWrapper });

      // Should only render once initially
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should lazy load heavy components', () => {
      render(<HomePage />, { wrapper: TestWrapper });

      // Heavy components should be lazy loaded
      expect(screen.getByText(/chargement/i)).toBeInTheDocument();
    });
  });
});
