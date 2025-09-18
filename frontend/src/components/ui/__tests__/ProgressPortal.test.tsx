import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressPortal, ProgressPortalProps } from '../ProgressPortal';

// Mock child components
jest.mock('./XPCrystal', () => (props: any) => <div data-testid="xp-crystal">{props.level}</div>);

// Mock framer-motion for easier testing
jest.mock('framer-motion', () => {
  const original = jest.requireActual('framer-motion');
  return {
    ...original,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...original.motion,
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
  };
});

const mockProgressData: ProgressPortalProps['progressData'] = {
  currentXP: 50,
  maxXP: 100,
  level: 5,
  nextLevelXP: 100,
  currentStreak: 10,
  maxStreak: 20,
  totalExercises: 50,
  completedExercises: 40,
  badges: [
    { id: 'b1', name: 'Badge 1', description: '', icon: '🌟', rarity: 'rare', isNew: true },
  ],
  recentAchievements: [
    { id: 'a1', title: 'Ach 1', description: '', xpReward: 10, completedAt: new Date(), icon: '🏆' },
  ],
  weeklyProgress: [
    { day: 'L', xpGained: 10, exercisesCompleted: 2, streakActive: true },
  ],
};

const mockIslandsData: ProgressPortalProps['magicalIslands'] = [
    { id: 'i1', name: 'Island 1', description: '', progress: 0.5, isUnlocked: true, isCompleted: false, theme: 'forest', exerciseCount: 10, completedCount: 5, icon: '🌲', position: { x: 10, y: 10 } },
    { id: 'i2', name: 'Island 2', description: '', progress: 0, isUnlocked: false, isCompleted: false, theme: 'castle', exerciseCount: 10, completedCount: 0, icon: '🏰', prerequisiteIsland: 'i1', position: { x: 50, y: 50 } },
];


describe('ProgressPortal', () => {
  const defaultProps: ProgressPortalProps = {
    progressData: mockProgressData,
    magicalIslands: mockIslandsData,
  };

  it('should render the trigger button', () => {
    render(<ProgressPortal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /🚪/i })).toBeInTheDocument();
  });

  it('should open the portal when the trigger button is clicked', () => {
    render(<ProgressPortal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /🚪/i }));
    expect(screen.getByText('Portail de Progression')).toBeInTheDocument();
  });

  it('should display the overview view by default', () => {
    render(<ProgressPortal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /🚪/i }));
    expect(screen.getByText('Progression hebdomadaire')).toBeInTheDocument();
    expect(screen.getByTestId('xp-crystal')).toHaveTextContent(mockProgressData.level.toString());
  });

  it('should switch to the journey view', () => {
    const onViewChange = jest.fn();
    render(<ProgressPortal {...defaultProps} onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole('button', { name: /🚪/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Voyage' }));

    expect(screen.getByText('Carte du Voyage Magique')).toBeInTheDocument();
    expect(onViewChange).toHaveBeenCalledWith('journey');
  });

  it('should switch to the achievements view', () => {
    render(<ProgressPortal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /🚪/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Réalisations' }));

    expect(screen.getByText('Badges et Réalisations')).toBeInTheDocument();
    expect(screen.getByText('Badge 1')).toBeInTheDocument();
  });

  it('should switch to the stats view', () => {
    render(<ProgressPortal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /🚪/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Statistiques' }));

    expect(screen.getByText('Statistiques Détaillées')).toBeInTheDocument();
    expect(screen.getByText(/Progression du niveau/i)).toBeInTheDocument();
  });

  it('should call onIslandSelect when an accessible island is clicked', () => {
    const onIslandSelect = jest.fn();
    render(<ProgressPortal {...defaultProps} onIslandSelect={onIslandSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /🚪/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Voyage' }));

    // There's no good way to select the island div, so we find by text inside it
    fireEvent.click(screen.getByText('🌲').parentElement!);
    expect(onIslandSelect).toHaveBeenCalledWith(mockIslandsData[0]);
  });

  it('should not call onIslandSelect when an inaccessible island is clicked', () => {
    const onIslandSelect = jest.fn();
    render(<ProgressPortal {...defaultProps} onIslandSelect={onIslandSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /🚪/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Voyage' }));

    fireEvent.click(screen.getByText('🏰').parentElement!);
    expect(onIslandSelect).not.toHaveBeenCalled();
  });

  it('should call onBadgeClick when a badge is clicked', () => {
    const onBadgeClick = jest.fn();
    render(<ProgressPortal {...defaultProps} onBadgeClick={onBadgeClick} />);
    fireEvent.click(screen.getByRole('button', { name: /🚪/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Réalisations' }));

    fireEvent.click(screen.getByText('Badge 1'));
    expect(onBadgeClick).toHaveBeenCalledWith(mockProgressData.badges[0]);
  });
});
