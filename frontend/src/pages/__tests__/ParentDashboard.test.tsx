/**
 * ParentDashboard Component Tests for FastRevEd Kids
 * Tests parent analytics, child progress tracking, and dashboard functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ParentDashboard from '../ParentDashboard';
import { AuthProvider } from '../../contexts/AuthContext';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/parent-dashboard' }),
  useParams: () => ({}),
}));

// Mock the parent API service
jest.mock('../../services/parentApi', () => ({
  parentApi: {
    getChildrenData: jest.fn(),
    getChildAnalytics: jest.fn(),
    getSuperMemoStats: jest.fn(),
    getProgressReports: jest.fn(),
    getAchievements: jest.fn(),
    updateChildSettings: jest.fn(),
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
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  Brain: () => <div data-testid="brain-icon" />,
  Award: () => <div data-testid="award-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Target: () => <div data-testid="target-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  BookOpen: () => <div data-testid="book-icon" />,
  Zap: () => <div data-testid="zap-icon" />,
  Star: () => <div data-testid="star-icon" />,
  Heart: () => <div data-testid="heart-icon" />,
  Trophy: () => <div data-testid="trophy-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
  BarChart3: () => <div data-testid="bar-chart-icon" />,
  PieChart: () => <div data-testid="pie-chart-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
}));

// Mock child data
const mockChildrenData = [
  {
    id: 1,
    name: 'Emma Martin',
    age: 7,
    grade: 'CE1',
    avatar: 'dragon',
    lastActivity: '2024-01-20T10:30:00Z',
    totalXp: 1250,
    currentLevel: 5,
    currentStreak: 7,
    exercisesCompleted: 45,
    averageScore: 87,
    timeSpent: 1200, // minutes
    achievementsUnlocked: 12,
  },
  {
    id: 2,
    name: 'Lucas Dubois',
    age: 8,
    grade: 'CE2',
    avatar: 'fairy',
    lastActivity: '2024-01-20T09:15:00Z',
    totalXp: 2100,
    currentLevel: 7,
    currentStreak: 5,
    exercisesCompleted: 78,
    averageScore: 92,
    timeSpent: 1800,
    achievementsUnlocked: 18,
  }
];

// Mock analytics data
const mockAnalytics = {
  weeklyProgress: {
    monday: 85,
    tuesday: 92,
    wednesday: 78,
    thursday: 95,
    friday: 88,
    saturday: 70,
    sunday: 65,
  },
  subjectPerformance: {
    mathématiques: 89,
    français: 85,
    sciences: 92,
    histoire: 78,
  },
  timeDistribution: {
    exercises: 60,
    games: 25,
    reading: 15,
  },
  improvementAreas: ['Conjugaison', 'Géométrie'],
  strengths: ['Calcul mental', 'Lecture'],
};

// Mock SuperMemo stats
const mockSuperMemoStats = {
  totalCards: 150,
  newCards: 25,
  reviewCards: 45,
  masteredCards: 80,
  retentionRate: 87.5,
  averageInterval: 3.2,
  nextReview: '2024-01-21T14:00:00Z',
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
// PARENT DASHBOARD COMPONENT TESTS
// =============================================================================

describe('ParentDashboard', () => {
  describe('Rendering', () => {
    it('should render parent dashboard with all main sections', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('Tableau de Bord Parent')).toBeInTheDocument();
      expect(screen.getByText('Vue d\'ensemble')).toBeInTheDocument();
      expect(screen.getByText('Progrès')).toBeInTheDocument();
      expect(screen.getByText('Insights')).toBeInTheDocument();
      expect(screen.getByText('Paramètres')).toBeInTheDocument();
    });

    it('should display children selection', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('Emma Martin')).toBeInTheDocument();
      expect(screen.getByText('Lucas Dubois')).toBeInTheDocument();
    });

    it('should show time frame selector', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('Cette semaine')).toBeInTheDocument();
      expect(screen.getByText('Ce mois')).toBeInTheDocument();
      expect(screen.getByText('Cette année')).toBeInTheDocument();
    });

    it('should display overview statistics', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('1,250 XP')).toBeInTheDocument();
      expect(screen.getByText('Niveau 5')).toBeInTheDocument();
      expect(screen.getByText('7 jours')).toBeInTheDocument();
      expect(screen.getByText('45 exercices')).toBeInTheDocument();
    });
  });

  describe('Child Selection', () => {
    it('should switch between children when selected', async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      // Initially shows Emma's data
      expect(screen.getByText('Emma Martin')).toBeInTheDocument();
      expect(screen.getByText('1,250 XP')).toBeInTheDocument();

      // Switch to Lucas
      const lucasButton = screen.getByText('Lucas Dubois');
      await user.click(lucasButton);

      expect(screen.getByText('2,100 XP')).toBeInTheDocument();
      expect(screen.getByText('Niveau 7')).toBeInTheDocument();
    });

    it('should highlight selected child', async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const emmaButton = screen.getByText('Emma Martin');
      const lucasButton = screen.getByText('Lucas Dubois');

      // Emma should be selected initially
      expect(emmaButton.closest('button')).toHaveClass(/selected|active/);

      // Click Lucas
      await user.click(lucasButton);

      expect(lucasButton.closest('button')).toHaveClass(/selected|active/);
      expect(emmaButton.closest('button')).not.toHaveClass(/selected|active/);
    });
  });

  describe('Time Frame Selection', () => {
    it('should switch between different time frames', async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      // Initially shows weekly data
      expect(screen.getByText('Cette semaine')).toBeInTheDocument();

      // Switch to monthly
      const monthlyButton = screen.getByRole('button', { name: /ce mois/i });
      await user.click(monthlyButton);

      expect(screen.getByText('Ce mois')).toBeInTheDocument();
    });

    it('should update charts and data when time frame changes', async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      // Switch to monthly view
      const monthlyButton = screen.getByRole('button', { name: /ce mois/i });
      await user.click(monthlyButton);

      // Should show monthly data
      expect(screen.getByText('Progrès mensuel')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display key performance indicators', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('XP Total')).toBeInTheDocument();
      expect(screen.getByText('Niveau Actuel')).toBeInTheDocument();
      expect(screen.getByText('Série Actuelle')).toBeInTheDocument();
      expect(screen.getByText('Exercices Terminés')).toBeInTheDocument();
    });

    it('should show progress charts', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('Progrès Hebdomadaire')).toBeInTheDocument();
      expect(screen.getByText('Performance par Matière')).toBeInTheDocument();
    });

    it('should display recent activity', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('Activité Récente')).toBeInTheDocument();
      expect(screen.getByText('Dernière connexion: il y a 2 heures')).toBeInTheDocument();
    });
  });

  describe('Progress Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const progressTab = screen.getByRole('button', { name: /progrès/i });
      await user.click(progressTab);
    });

    it('should display detailed progress information', () => {
      expect(screen.getByText('Détails du Progrès')).toBeInTheDocument();
      expect(screen.getByText('Statistiques SuperMemo')).toBeInTheDocument();
    });

    it('should show SuperMemo algorithm statistics', () => {
      expect(screen.getByText('150 cartes')).toBeInTheDocument();
      expect(screen.getByText('87.5%')).toBeInTheDocument(); // retention rate
      expect(screen.getByText('25 nouvelles')).toBeInTheDocument();
      expect(screen.getByText('45 révisions')).toBeInTheDocument();
    });

    it('should display learning curve', () => {
      expect(screen.getByText('Courbe d\'Apprentissage')).toBeInTheDocument();
    });

    it('should show subject breakdown', () => {
      expect(screen.getByText('Mathématiques: 89%')).toBeInTheDocument();
      expect(screen.getByText('Français: 85%')).toBeInTheDocument();
      expect(screen.getByText('Sciences: 92%')).toBeInTheDocument();
    });
  });

  describe('Insights Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const insightsTab = screen.getByRole('button', { name: /insights/i });
      await user.click(insightsTab);
    });

    it('should display AI-powered insights', () => {
      expect(screen.getByText('Insights IA')).toBeInTheDocument();
      expect(screen.getByText('Recommandations')).toBeInTheDocument();
    });

    it('should show improvement areas', () => {
      expect(screen.getByText('Domaines à Améliorer')).toBeInTheDocument();
      expect(screen.getByText('Conjugaison')).toBeInTheDocument();
      expect(screen.getByText('Géométrie')).toBeInTheDocument();
    });

    it('should display strengths', () => {
      expect(screen.getByText('Points Forts')).toBeInTheDocument();
      expect(screen.getByText('Calcul mental')).toBeInTheDocument();
      expect(screen.getByText('Lecture')).toBeInTheDocument();
    });

    it('should show learning patterns', () => {
      expect(screen.getByText('Patterns d\'Apprentissage')).toBeInTheDocument();
      expect(screen.getByText('Meilleur moment: 14h-16h')).toBeInTheDocument();
    });

    it('should provide personalized recommendations', () => {
      expect(screen.getByText('Recommandations Personnalisées')).toBeInTheDocument();
      expect(screen.getByText('Augmenter les exercices de conjugaison')).toBeInTheDocument();
    });
  });

  describe('Settings Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const settingsTab = screen.getByRole('button', { name: /paramètres/i });
      await user.click(settingsTab);
    });

    it('should display child settings', () => {
      expect(screen.getByText('Paramètres de l\'Enfant')).toBeInTheDocument();
      expect(screen.getByText('Difficulté')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should allow changing difficulty level', async () => {
      const user = userEvent.setup();

      const difficultySelect = screen.getByDisplayValue('Normal');
      await user.selectOptions(difficultySelect, 'difficile');

      expect(screen.getByDisplayValue('Difficile')).toBeInTheDocument();
    });

    it('should allow toggling notifications', async () => {
      const user = userEvent.setup();

      const notificationToggle = screen.getByRole('switch', { name: /notifications/i });
      await user.click(notificationToggle);

      expect(notificationToggle).toBeChecked();
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

  describe('Real-time Updates', () => {
    it('should update data in real-time', async () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      // Initially shows current data
      expect(screen.getByText('1,250 XP')).toBeInTheDocument();

      // Simulate real-time update
      await waitFor(() => {
        expect(screen.getByText('1,300 XP')).toBeInTheDocument();
      });
    });

    it('should show live activity indicators', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('En ligne')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('should display real-time notifications', async () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      // Simulate notification
      await waitFor(() => {
        expect(screen.getByText('Emma a terminé un exercice!')).toBeInTheDocument();
        expect(screen.getByText('+50 XP')).toBeInTheDocument();
      });
    });
  });

  describe('Charts and Visualizations', () => {
    it('should display weekly progress chart', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('Progrès Hebdomadaire')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
    });

    it('should show subject performance pie chart', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('Performance par Matière')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart-icon')).toBeInTheDocument();
    });

    it('should display time distribution chart', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      expect(screen.getByText('Répartition du Temps')).toBeInTheDocument();
      expect(screen.getByText('Exercices: 60%')).toBeInTheDocument();
      expect(screen.getByText('Jeux: 25%')).toBeInTheDocument();
      expect(screen.getByText('Lecture: 15%')).toBeInTheDocument();
    });
  });

  describe('Export and Reporting', () => {
    it('should allow exporting progress reports', async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const exportButton = screen.getByRole('button', { name: /exporter/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Rapport exporté!')).toBeInTheDocument();
      });
    });

    it('should generate weekly reports', async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const reportButton = screen.getByRole('button', { name: /rapport hebdomadaire/i });
      await user.click(reportButton);

      await waitFor(() => {
        expect(screen.getByText('Rapport Hebdomadaire')).toBeInTheDocument();
        expect(screen.getByText('Résumé de la semaine')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle data loading errors', async () => {
      const { parentApi } = require('../../services/parentApi');
      parentApi.getChildrenData.mockRejectedValue(new Error('Failed to load data'));

      render(<ParentDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        expect(screen.getByText(/erreur de chargement/i)).toBeInTheDocument();
      });
    });

    it('should show retry button when loading fails', async () => {
      const { parentApi } = require('../../services/parentApi');
      parentApi.getChildrenData.mockRejectedValue(new Error('Failed to load data'));

      render(<ParentDashboard />, { wrapper: TestWrapper });

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /réessayer/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const tabButtons = screen.getAllByRole('button');
      tabButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const progressTab = screen.getByRole('button', { name: /progrès/i });
      progressTab.focus();
      expect(progressTab).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByText('Détails du Progrès')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<ParentDashboard />, { wrapper: TestWrapper });

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Tableau de Bord Parent');

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile screen size
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

      render(<ParentDashboard />, { wrapper: TestWrapper });

      // Should still display main content
      expect(screen.getByText('Tableau de Bord Parent')).toBeInTheDocument();
      expect(screen.getByText('Emma Martin')).toBeInTheDocument();
    });

    it('should show mobile-optimized charts', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 });

      render(<ParentDashboard />, { wrapper: TestWrapper });

      // Should have mobile-friendly chart layout
      expect(screen.getByText('Progrès Hebdomadaire')).toBeInTheDocument();
    });
  });
});
