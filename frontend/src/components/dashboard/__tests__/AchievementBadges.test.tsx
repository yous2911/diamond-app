import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementBadges from '../AchievementBadges';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }: any) => (
      <div 
        className={className}
        data-testid="motion-div"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    )
  }
}));

const mockAchievements = [
  {
    id: 1,
    achievementCode: 'math_master',
    title: 'Maître des Maths',
    description: 'Réussis 10 exercices de maths',
    category: 'academic',
    difficulty: 'bronze',
    xpReward: 100,
    badgeIconUrl: 'math.png',
    currentProgress: 10,
    maxProgress: 10,
    progressPercentage: 100,
    isCompleted: true,
    completedAt: '2023-01-01',
    displayOrder: 1
  },
  {
    id: 2,
    achievementCode: 'reading_pro',
    title: 'Pro de la Lecture',
    description: 'Réussis 5 exercices de lecture',
    category: 'academic',
    difficulty: 'silver',
    xpReward: 200,
    badgeIconUrl: 'reading.png',
    currentProgress: 5,
    maxProgress: 5,
    progressPercentage: 100,
    isCompleted: true,
    completedAt: '2023-01-02',
    displayOrder: 2
  },
  {
    id: 3,
    achievementCode: 'streak_starter',
    title: 'Début de Série',
    description: 'Maintiens une série de 7 jours',
    category: 'engagement',
    difficulty: 'gold',
    xpReward: 300,
    badgeIconUrl: 'streak.png',
    currentProgress: 5,
    maxProgress: 7,
    progressPercentage: 71,
    isCompleted: false,
    displayOrder: 3
  },
  {
    id: 4,
    achievementCode: 'social_butterfly',
    title: 'Papillon Social',
    description: 'Participe à 3 activités sociales',
    category: 'social',
    difficulty: 'platinum',
    xpReward: 500,
    badgeIconUrl: 'social.png',
    currentProgress: 1,
    maxProgress: 3,
    progressPercentage: 33,
    isCompleted: false,
    displayOrder: 4
  }
];

describe('AchievementBadges', () => {
  const mockOnViewAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', () => {
    render(<AchievementBadges achievements={[]} loading={true} onViewAll={mockOnViewAll} />);
    
    expect(screen.getByText('🏆 Récompenses')).toBeInTheDocument();
    expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-pulse');
  });

  it('renders empty state when no achievements', () => {
    render(<AchievementBadges achievements={[]} loading={false} onViewAll={mockOnViewAll} />);
    
    expect(screen.getByText('🏆')).toBeInTheDocument();
    expect(screen.getByText('Aucune récompense pour le moment')).toBeInTheDocument();
    expect(screen.getByText('Continue tes exercices pour débloquer des badges !')).toBeInTheDocument();
  });

  it('renders achievements list with stats', () => {
    render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    // Check title and view all button
    expect(screen.getByText('🏆 Récompenses')).toBeInTheDocument();
    expect(screen.getByText('Voir tout →')).toBeInTheDocument();
    
    // Check stats summary
    expect(screen.getByText('2')).toBeInTheDocument(); // Completed achievements
    expect(screen.getByText('Obtenues')).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument(); // Total XP (100 + 200)
    expect(screen.getByText('XP total')).toBeInTheDocument();
  });

  it('displays recently completed achievements', () => {
    render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    expect(screen.getByText('Récemment obtenues :')).toBeInTheDocument();
    expect(screen.getByText('Maître des Maths')).toBeInTheDocument();
    expect(screen.getByText('Pro de la Lecture')).toBeInTheDocument();
    expect(screen.getByText('+100 XP')).toBeInTheDocument();
    expect(screen.getByText('+200 XP')).toBeInTheDocument();
  });

  it('displays in-progress achievements', () => {
    render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    expect(screen.getByText('Presque réussies :')).toBeInTheDocument();
    expect(screen.getByText('Début de Série')).toBeInTheDocument();
    expect(screen.getByText('71%')).toBeInTheDocument();
    expect(screen.getByText('5/7')).toBeInTheDocument();
  });

  it('calls onViewAll when view all button is clicked', () => {
    render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    const viewAllButton = screen.getByText('Voir tout →');
    fireEvent.click(viewAllButton);
    
    expect(mockOnViewAll).toHaveBeenCalledTimes(1);
  });

  it('does not render view all button when no achievements', () => {
    render(<AchievementBadges achievements={[]} loading={false} onViewAll={mockOnViewAll} />);
    
    expect(screen.queryByText('Voir tout →')).not.toBeInTheDocument();
  });

  describe('getDifficultyColor function', () => {
    it('applies correct difficulty colors and icons', () => {
      render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
      
      // Check bronze difficulty
      const bronzeBadge = screen.getByText('bronze').closest('span');
      expect(bronzeBadge).toHaveClass('bg-amber-100', 'text-amber-700', 'border-amber-300');
      expect(screen.getByText('🥉')).toBeInTheDocument();
      
      // Check silver difficulty  
      const silverBadge = screen.getByText('silver').closest('span');
      expect(silverBadge).toHaveClass('bg-gray-100', 'text-gray-700', 'border-gray-300');
      expect(screen.getByText('🥈')).toBeInTheDocument();
    });
  });

  describe('getCategoryIcon function', () => {
    it('displays correct category icons', () => {
      render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
      
      // Academic category should show 📚
      expect(screen.getByText('📚')).toBeInTheDocument();
      // Engagement category should show 💪  
      expect(screen.getByText('💪')).toBeInTheDocument();
      // Social category should show 👥
      expect(screen.getByText('👥')).toBeInTheDocument();
    });
  });

  it('displays category summary', () => {
    render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    expect(screen.getByText('Récompenses par catégorie :')).toBeInTheDocument();
    // Should show academic category with count 2 (both completed achievements are academic)
    const categoryElements = screen.getAllByText('📚');
    expect(categoryElements.length).toBeGreaterThan(0);
  });

  it('shows correct completion status', () => {
    render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    // Completed achievements should show checkmark
    expect(screen.getAllByText('✅')).toHaveLength(2);
  });

  it('shows progress bars for in-progress achievements', () => {
    render(<AchievementBadges achievements={mockAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    // Should have progress bars for in-progress achievements
    const progressBars = screen.getAllByTestId('motion-div').filter(div => 
      div.className.includes('bg-blue-500')
    );
    expect(progressBars.length).toBeGreaterThan(0);
  });

  it('limits recently completed achievements to 3', () => {
    const manyCompletedAchievements = Array(5).fill(null).map((_, index) => ({
      ...mockAchievements[0],
      id: index + 10,
      title: `Achievement ${index + 1}`
    }));
    
    render(<AchievementBadges achievements={manyCompletedAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    // Should only show first 3 in recent section
    expect(screen.getByText('Achievement 1')).toBeInTheDocument();
    expect(screen.getByText('Achievement 2')).toBeInTheDocument();
    expect(screen.getByText('Achievement 3')).toBeInTheDocument();
    expect(screen.queryByText('Achievement 4')).not.toBeInTheDocument();
  });

  it('limits in-progress achievements to 2', () => {
    const manyInProgressAchievements = Array(4).fill(null).map((_, index) => ({
      ...mockAchievements[2],
      id: index + 20,
      title: `In Progress ${index + 1}`,
      isCompleted: false,
      currentProgress: 1
    }));
    
    render(<AchievementBadges achievements={manyInProgressAchievements} loading={false} onViewAll={mockOnViewAll} />);
    
    // Should only show first 2 in progress section
    expect(screen.getByText('In Progress 1')).toBeInTheDocument();
    expect(screen.getByText('In Progress 2')).toBeInTheDocument();
    expect(screen.queryByText('In Progress 3')).not.toBeInTheDocument();
  });
});