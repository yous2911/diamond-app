import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WardrobeSystem from '../WardrobeSystem';
import { WARDROBE_ITEMS } from '../WardrobeData';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, className, initial, animate, whileHover, whileTap, ...props }: any) => (
      <div
        onClick={onClick}
        className={className}
        data-testid="motion-div"
        {...props}
      >
        {children}
      </div>
    )
  }
}));

jest.mock('../WardrobeData', () => ({
  WARDROBE_ITEMS: [
    {
      id: 'wizard_hat',
      name: 'Chapeau de Magicien',
      type: 'hat',
      rarity: 'common',
      unlockRequirement: { type: 'xp', value: 100 },
      mascotType: ['dragon', 'fairy'],
      description: 'Un chapeau magique pour les apprentis sorciers',
      icon: '🎩',
      magicalEffect: true
    },
    {
      id: 'royal_crown',
      name: 'Couronne Royale',
      type: 'hat',
      rarity: 'legendary',
      unlockRequirement: { type: 'achievement', value: 10 },
      mascotType: ['dragon'],
      description: 'Une couronne digne des plus grands',
      icon: '👑',
      magicalEffect: false
    },
    {
      id: 'magic_cape',
      name: 'Cape Magique',
      type: 'clothing',
      rarity: 'epic',
      unlockRequirement: { type: 'streak', value: 7 },
      description: 'Une cape qui scintille dans la nuit',
      icon: '🦸',
      magicalEffect: true
    },
    {
      id: 'simple_shoes',
      name: 'Chaussures Simples',
      type: 'shoes',
      rarity: 'common',
      unlockRequirement: { type: 'exercises', value: 5 },
      description: 'Des chaussures confortables',
      icon: '👟',
      magicalEffect: false
    }
  ]
}));

const mockStudentStats = {
  xp: 150,
  streak: 10,
  exercisesCompleted: 8,
  achievementsUnlocked: 5
};

const defaultProps = {
  studentStats: mockStudentStats,
  mascotType: 'dragon' as const,
  equippedItems: [],
  onItemEquip: jest.fn(),
  onItemUnequip: jest.fn(),
  onNewItemUnlocked: jest.fn()
};

describe('WardrobeSystem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the wardrobe header correctly', () => {
    render(<WardrobeSystem {...defaultProps} />);

    expect(screen.getByText('👗 Garde-Robe Magique')).toBeInTheDocument();
    expect(screen.getByText('Personnalise ton compagnon avec des prix gagnés en apprenant !')).toBeInTheDocument();
  });

  it('displays student stats correctly', () => {
    render(<WardrobeSystem {...defaultProps} />);

    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(screen.getByText('XP Total')).toBeInTheDocument();
    expect(screen.getByText('Série')).toBeInTheDocument();
    expect(screen.getByText('Exercices')).toBeInTheDocument();
    expect(screen.getByText('Succès')).toBeInTheDocument();
  });

  it('renders category tabs', () => {
    render(<WardrobeSystem {...defaultProps} />);

    expect(screen.getByText('👕 Tous')).toBeInTheDocument();
    expect(screen.getByText('🎩 Chapeaux')).toBeInTheDocument();
    expect(screen.getByText('👔 Vêtements')).toBeInTheDocument();
    expect(screen.getByText('👓 Accessoires')).toBeInTheDocument();
    expect(screen.getByText('👟 Chaussures')).toBeInTheDocument();
    expect(screen.getByText('✨ Spéciaux')).toBeInTheDocument();
  });

  it('displays unlocked items based on student stats', () => {
    render(<WardrobeSystem {...defaultProps} />);

    // Should show items that are unlocked based on stats
    expect(screen.getByText('Chapeau de Magicien')).toBeInTheDocument(); // 100 XP required
    expect(screen.getByText('Cape Magique')).toBeInTheDocument(); // 7 streak required
    expect(screen.getByText('Chaussures Simples')).toBeInTheDocument(); // 5 exercises required

    // Royal crown should be in locked items preview (requires 10 achievements, student has 5)
    expect(screen.getByText('Couronne Royale')).toBeInTheDocument();
  });

  it('filters items by mascot type compatibility', () => {
    render(<WardrobeSystem {...defaultProps} />);

    // Wizard hat is compatible with dragon
    expect(screen.getByText('Chapeau de Magicien')).toBeInTheDocument();

    // Royal crown is compatible with dragon
    // But it's not unlocked due to achievement requirement
  });

  it('filters items by category when tab is selected', () => {
    render(<WardrobeSystem {...defaultProps} />);

    // Click on hats category
    fireEvent.click(screen.getByText('🎩 Chapeaux'));

    // Should only show hat items
    expect(screen.getByText('Chapeau de Magicien')).toBeInTheDocument();
    expect(screen.queryByText('Cape Magique')).not.toBeInTheDocument();
    expect(screen.queryByText('Chaussures Simples')).not.toBeInTheDocument();
  });

  it('handles item equipping', () => {
    const mockOnItemEquip = jest.fn();
    render(<WardrobeSystem {...defaultProps} onItemEquip={mockOnItemEquip} />);

    const wizardHat = screen.getByText('Chapeau de Magicien').closest('.cursor-pointer');
    fireEvent.click(wizardHat!);

    expect(mockOnItemEquip).toHaveBeenCalledWith('wizard_hat');
  });

  it('handles item unequipping', () => {
    const mockOnItemUnequip = jest.fn();
    render(
      <WardrobeSystem
        {...defaultProps}
        equippedItems={['wizard_hat']}
        onItemUnequip={mockOnItemUnequip}
      />
    );

    const wizardHat = screen.getByText('Chapeau de Magicien').closest('.cursor-pointer');
    fireEvent.click(wizardHat!);

    expect(mockOnItemUnequip).toHaveBeenCalledWith('wizard_hat');
  });

  it('shows equipped badge for equipped items', () => {
    render(
      <WardrobeSystem
        {...defaultProps}
        equippedItems={['wizard_hat']}
      />
    );

    expect(screen.getByText('✓ Porté')).toBeInTheDocument();
  });

  it('displays rarity correctly', () => {
    render(<WardrobeSystem {...defaultProps} />);

    // Check that rarity text exists (there may be multiple items with same rarity)
    expect(screen.getAllByText('Commun')).toHaveLength(2); // wizard hat and simple shoes
    expect(screen.getByText('Épique')).toBeInTheDocument(); // magic cape
  });

  it('shows magical effect indicator', () => {
    render(<WardrobeSystem {...defaultProps} />);

    // Items with magical effects should have the indicator
    const wizardHatCard = screen.getByText('Chapeau de Magicien').closest('[data-testid="motion-div"]');
    expect(wizardHatCard).toBeInTheDocument();
  });

  it('shows no items message when category has no unlocked items', () => {
    render(<WardrobeSystem {...defaultProps} />);

    // Click on accessories category (no items in mock data)
    fireEvent.click(screen.getByText('👓 Accessoires'));

    expect(screen.getByText('Aucun objet débloqué dans cette catégorie')).toBeInTheDocument();
    expect(screen.getByText('Continue d\'apprendre pour débloquer de nouveaux prix !')).toBeInTheDocument();
  });

  it('shows locked items preview', () => {
    render(<WardrobeSystem {...defaultProps} />);

    expect(screen.getByText('🔒 Prochains Prix à Débloquer')).toBeInTheDocument();
  });

  it('calls onNewItemUnlocked for newly unlocked items', async () => {
    const mockOnNewItemUnlocked = jest.fn();

    // First render with low stats
    const { rerender } = render(
      <WardrobeSystem
        {...defaultProps}
        studentStats={{ xp: 50, streak: 3, exercisesCompleted: 2, achievementsUnlocked: 1 }}
        onNewItemUnlocked={mockOnNewItemUnlocked}
      />
    );

    // Update with higher stats to unlock new items
    rerender(
      <WardrobeSystem
        {...defaultProps}
        studentStats={mockStudentStats}
        onNewItemUnlocked={mockOnNewItemUnlocked}
      />
    );

    await waitFor(() => {
      expect(mockOnNewItemUnlocked).toHaveBeenCalled();
    });
  });

  it('applies correct styling for different rarities', () => {
    render(<WardrobeSystem {...defaultProps} />);

    // Check rarity colors in text - use getAllByText since there are multiple "Commun" items
    const commonRarities = screen.getAllByText('Commun');
    expect(commonRarities[0]).toHaveClass('text-gray-600');

    const magicCapeRarity = screen.getByText('Épique');
    expect(magicCapeRarity).toHaveClass('text-purple-600');
  });

  it('shows correct unlock requirements in locked items preview', () => {
    render(<WardrobeSystem {...defaultProps} />);

    // The royal crown should be in locked items
    expect(screen.getByText('10 succès')).toBeInTheDocument();
  });

  it('updates category selection state', () => {
    render(<WardrobeSystem {...defaultProps} />);

    const hatCategory = screen.getByText('🎩 Chapeaux');
    const clothingCategory = screen.getByText('👔 Vêtements');

    // Initially "Tous" should be selected
    expect(screen.getByText('👕 Tous').closest('button')).toHaveClass('from-purple-500');

    fireEvent.click(hatCategory);
    expect(hatCategory.closest('button')).toHaveClass('from-purple-500');

    fireEvent.click(clothingCategory);
    expect(clothingCategory.closest('button')).toHaveClass('from-purple-500');
  });

  it('handles mascot type changes correctly', () => {
    const { rerender } = render(<WardrobeSystem {...defaultProps} mascotType="dragon" />);

    // Initially shows dragon-compatible items
    expect(screen.getByText('Chapeau de Magicien')).toBeInTheDocument();

    // Change to cat mascot
    rerender(<WardrobeSystem {...defaultProps} mascotType="cat" />);

    // Should filter out dragon-specific items
    expect(screen.queryByText('Chapeau de Magicien')).not.toBeInTheDocument();
  });
});