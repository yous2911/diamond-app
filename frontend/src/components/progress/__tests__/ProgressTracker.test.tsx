import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ProgressTracker } from '../ProgressTracker';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, transition, whileHover, whileTap, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
}));

// Mock hooks
jest.mock('../../../hooks/useFastRevKidsApi', () => ({
  useStudentProgress: jest.fn(),
  useStudentStats: jest.fn(),
}));

// Mock data
const mockProgressData = [
  {
    id: 'progress-1',
    competenceId: 'COMP001',
    status: 'mastered' as const,
    difficulty: 3,
    attempts: 10,
    successes: 9,
    progress: 90,
    timeSpent: 45,
    lastPracticed: '2024-01-15T10:30:00Z',
    repetitionNumber: 5,
    easinessFactor: 2.5,
    nextReview: '2024-01-20T10:30:00Z',
  },
  {
    id: 'progress-2',
    competenceId: 'COMP002',
    status: 'learning' as const,
    difficulty: 2,
    attempts: 5,
    successes: 3,
    progress: 60,
    timeSpent: 25,
    lastPracticed: '2024-01-14T15:20:00Z',
    repetitionNumber: 2,
    easinessFactor: 2.1,
    nextReview: '2024-01-16T15:20:00Z',
  },
  {
    id: 'progress-3',
    competenceId: 'COMP003',
    status: 'not_started' as const,
    difficulty: 1,
    attempts: 0,
    successes: 0,
    progress: 0,
    timeSpent: 0,
    lastPracticed: null,
    repetitionNumber: 0,
    easinessFactor: 2.5,
    nextReview: null,
  },
];

const mockStatsData = {
  stats: {
    averageSuccessRate: 75,
    masteredCompetences: 1,
    totalTimeSpent: 70,
  },
};

describe('ProgressTracker', () => {
  const { useStudentProgress, useStudentStats } = require('../../../hooks/useFastRevKidsApi');

  beforeEach(() => {
    jest.clearAllMocks();
    useStudentProgress.mockReturnValue({
      data: mockProgressData,
      isLoading: false,
    });
    useStudentStats.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
    });
  });

  describe('Rendu initial', () => {
    it('affiche le titre et le nombre de compétences', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('📊 Progression')).toBeInTheDocument();
      expect(screen.getByText('3 compétences')).toBeInTheDocument();
    });

    it('affiche les statistiques globales', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Taux de réussite')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Maîtrisées')).toBeInTheDocument();
      expect(screen.getByText('1h 10min')).toBeInTheDocument();
      expect(screen.getByText('Temps total')).toBeInTheDocument();
    });

    it('affiche la liste des compétences', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('Compétence COMP001')).toBeInTheDocument();
      expect(screen.getByText('Compétence COMP002')).toBeInTheDocument();
      expect(screen.getByText('Compétence COMP003')).toBeInTheDocument();
    });
  });

  describe('États des compétences', () => {
    it('affiche l\'état maîtrisé avec la bonne couleur et icône', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('Maîtrisé')).toBeInTheDocument();
      expect(screen.getByText('Compétence COMP001')).toBeInTheDocument();
    });

    it('affiche l\'état en cours avec la bonne couleur et icône', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getByText('En cours')).toBeInTheDocument();
      expect(screen.getByText('Compétence COMP002')).toBeInTheDocument();
    });

    it('affiche l\'état non commencé avec la bonne couleur et icône', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('⏳')).toBeInTheDocument();
      expect(screen.getByText('Non commencé')).toBeInTheDocument();
      expect(screen.getByText('Compétence COMP003')).toBeInTheDocument();
    });
  });

  describe('Informations des compétences', () => {
    it('affiche le niveau et le nombre de tentatives', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('Niveau 3 • 10 tentatives')).toBeInTheDocument();
      expect(screen.getByText('Niveau 2 • 5 tentatives')).toBeInTheDocument();
      expect(screen.getByText('Niveau 1 • 0 tentatives')).toBeInTheDocument();
    });

    it('affiche le taux de réussite', () => {
      render(<ProgressTracker />);
      
      // Use getAllByText to handle multiple elements with same percentage
      const successRates = screen.getAllByText('90%');
      expect(successRates.length).toBeGreaterThan(0);
      
      const sixtyPercent = screen.getAllByText('60%');
      expect(sixtyPercent.length).toBeGreaterThan(0);
      
      const zeroPercent = screen.getAllByText('0%');
      expect(zeroPercent.length).toBeGreaterThan(0);
    });

    it('affiche le ratio de réussite', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('9/10')).toBeInTheDocument();
      expect(screen.getByText('3/5')).toBeInTheDocument();
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('affiche la barre de progression', () => {
      render(<ProgressTracker />);
      
      // Look for progress bar elements more specifically
      const progressBars = screen.getAllByRole('generic').filter(element => 
        element.className?.includes('bg-blue-500') && element.className?.includes('h-2')
      );
      expect(progressBars).toHaveLength(3);
    });

    it('affiche le temps passé', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('Temps: 45min')).toBeInTheDocument();
      expect(screen.getByText('Temps: 25min')).toBeInTheDocument();
      expect(screen.getByText('Temps: 0min')).toBeInTheDocument();
    });

    it('affiche la date de dernière pratique', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText(/Dernière pratique: 15\/01\/2024/)).toBeInTheDocument();
      expect(screen.getByText(/Dernière pratique: 14\/01\/2024/)).toBeInTheDocument();
    });
  });

  describe('Modal de détails', () => {
    it('ouvre la modal quand on clique sur une compétence', async () => {
      const user = userEvent.setup();
      render(<ProgressTracker />);
      
      const competenceItem = screen.getByText('Compétence COMP001');
      await user.click(competenceItem);
      
      expect(screen.getByText('Détails de la compétence')).toBeInTheDocument();
    });

    it('affiche les détails de la compétence sélectionnée', async () => {
      const user = userEvent.setup();
      render(<ProgressTracker />);
      
      const competenceItem = screen.getByText('Compétence COMP001');
      await user.click(competenceItem);
      
      expect(screen.getByText('Statut actuel')).toBeInTheDocument();
      expect(screen.getByText('Niveau actuel')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      // Use getAllByText to handle multiple "Taux de réussite" elements
      const successRateElements = screen.getAllByText('Taux de réussite');
      expect(successRateElements.length).toBeGreaterThan(0);
      const successRateText = screen.getAllByText('90%');
      expect(successRateText.length).toBeGreaterThan(0);
    });

    it('affiche les informations de répétition espacée', async () => {
      const user = userEvent.setup();
      render(<ProgressTracker />);
      
      const competenceItem = screen.getByText('Compétence COMP001');
      await user.click(competenceItem);
      
      expect(screen.getByText('Système de répétition espacée')).toBeInTheDocument();
      expect(screen.getByText(/Répétition #5/)).toBeInTheDocument();
      expect(screen.getByText(/Facteur de facilité: 2\.50/)).toBeInTheDocument();
      expect(screen.getByText(/Prochaine révision: 20\/01\/2024/)).toBeInTheDocument();
    });

    it('ferme la modal quand on clique sur le bouton de fermeture', async () => {
      const user = userEvent.setup();
      render(<ProgressTracker />);
      
      const competenceItem = screen.getByText('Compétence COMP001');
      await user.click(competenceItem);
      
      const closeButton = screen.getByText('✕');
      await user.click(closeButton);
      
      expect(screen.queryByText('Détails de la compétence')).not.toBeInTheDocument();
    });

    it('ferme la modal quand on clique en dehors', async () => {
      const user = userEvent.setup();
      render(<ProgressTracker />);
      
      const competenceItem = screen.getByText('Compétence COMP001');
      await user.click(competenceItem);
      
      const modal = screen.getByText('Détails de la compétence').closest('.fixed');
      await user.click(modal!);
      
      expect(screen.queryByText('Détails de la compétence')).not.toBeInTheDocument();
    });
  });

  describe('Limitation du nombre d\'éléments', () => {
    it('affiche seulement le nombre maximum d\'éléments', () => {
      render(<ProgressTracker maxItems={2} />);
      
      expect(screen.getByText('Compétence COMP001')).toBeInTheDocument();
      expect(screen.getByText('Compétence COMP002')).toBeInTheDocument();
      expect(screen.queryByText('Compétence COMP003')).not.toBeInTheDocument();
    });

    it('affiche le bouton "Voir plus" quand il y a plus d\'éléments', () => {
      render(<ProgressTracker maxItems={2} />);
      
      expect(screen.getByText('Voir 1 compétences de plus')).toBeInTheDocument();
    });

    it('n\'affiche pas le bouton "Voir plus" quand tous les éléments sont affichés', () => {
      render(<ProgressTracker maxItems={5} />);
      
      expect(screen.queryByText(/Voir .* compétences de plus/)).not.toBeInTheDocument();
    });
  });

  describe('État de chargement', () => {
    it('affiche le skeleton de chargement', () => {
      useStudentProgress.mockReturnValue({
        data: null,
        isLoading: true,
      });
      useStudentStats.mockReturnValue({
        data: null,
        isLoading: true,
      });
      
      render(<ProgressTracker />);
      
      // Check for the skeleton loading animation
      const pulseElement = document.querySelector('.animate-pulse');
      expect(pulseElement).toBeInTheDocument();
    });
  });

  describe('Données vides', () => {
    it('gère le cas où il n\'y a pas de données de progression', () => {
      useStudentProgress.mockReturnValue({
        data: null,
        isLoading: false,
      });
      useStudentStats.mockReturnValue({
        data: null,
        isLoading: false,
      });
      
      render(<ProgressTracker />);
      
      expect(screen.getByText('0 compétences')).toBeInTheDocument();
    });

    it('gère le cas où il n\'y a pas de statistiques', () => {
      useStudentProgress.mockReturnValue({
        data: mockProgressData,
        isLoading: false,
      });
      useStudentStats.mockReturnValue({
        data: null,
        isLoading: false,
      });
      
      render(<ProgressTracker />);
      
      // Check for the default values when stats are null
      const zeroPercentElements = screen.getAllByText('0%');
      expect(zeroPercentElements.length).toBeGreaterThan(0);
      expect(screen.getByText('0min')).toBeInTheDocument();
    });
  });

  describe('Formatage du temps', () => {
    it('affiche les minutes pour moins d\'une heure', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('Temps: 45min')).toBeInTheDocument();
      expect(screen.getByText('Temps: 25min')).toBeInTheDocument();
    });

    it('affiche les heures et minutes pour plus d\'une heure', () => {
      const longTimeData = [{
        ...mockProgressData[0],
        timeSpent: 90, // 1h 30min
      }];
      
      useStudentProgress.mockReturnValue({
        data: longTimeData,
        isLoading: false,
      });
      
      render(<ProgressTracker />);
      
      expect(screen.getByText('Temps: 1h 30min')).toBeInTheDocument();
    });
  });

  describe('Props personnalisées', () => {
    it('applique la classe CSS personnalisée', () => {
      render(<ProgressTracker className="custom-class" />);
      
      const container = screen.getByText('📊 Progression').closest('div')?.parentElement;
      expect(container).toHaveClass('custom-class');
    });

    it('désactive la modal de détails', () => {
      render(<ProgressTracker showDetails={false} />);
      
      const competenceItem = screen.getByText('Compétence COMP001');
      fireEvent.click(competenceItem);
      
      expect(screen.queryByText('Détails de la compétence')).not.toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('utilise des éléments sémantiques appropriés', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      expect(screen.getByText('📊 Progression')).toBeInTheDocument();
    });

    it('utilise des boutons pour les interactions', () => {
      render(<ProgressTracker maxItems={2} />);
      
      const showMoreButton = screen.getByText('Voir 1 compétences de plus');
      expect(showMoreButton.tagName).toBe('BUTTON');
    });

    it('utilise des boutons pour fermer la modal', async () => {
      const user = userEvent.setup();
      render(<ProgressTracker />);
      
      const competenceItem = screen.getByText('Compétence COMP001');
      await user.click(competenceItem);
      
      const closeButton = screen.getByText('✕');
      expect(closeButton.tagName).toBe('BUTTON');
    });
  });

  describe('Cas limites', () => {
    it('gère les compétences sans date de dernière pratique', () => {
      const dataWithoutLastPracticed = [{
        ...mockProgressData[2],
        lastPracticed: null,
      }];
      
      useStudentProgress.mockReturnValue({
        data: dataWithoutLastPracticed,
        isLoading: false,
      });
      
      render(<ProgressTracker />);
      
      expect(screen.getByText('Compétence COMP003')).toBeInTheDocument();
      expect(screen.queryByText(/Dernière pratique:/)).not.toBeInTheDocument();
    });

    it('gère les compétences sans prochaine révision', async () => {
      const user = userEvent.setup();
      const dataWithoutNextReview = [{
        ...mockProgressData[2],
        nextReview: null,
      }];
      
      useStudentProgress.mockReturnValue({
        data: dataWithoutNextReview,
        isLoading: false,
      });
      
      render(<ProgressTracker />);
      
      const competenceItem = screen.getByText('Compétence COMP003');
      await user.click(competenceItem);
      
      expect(screen.getByText('Système de répétition espacée')).toBeInTheDocument();
      expect(screen.queryByText(/Prochaine révision:/)).not.toBeInTheDocument();
    });

    it('gère les tentatives à zéro', () => {
      render(<ProgressTracker />);
      
      expect(screen.getByText('0/0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
