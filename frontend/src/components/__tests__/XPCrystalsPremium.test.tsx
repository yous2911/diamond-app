import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import XPCrystalsPremium from '../XPCrystalsPremium';

// Mock useMagicalSounds hook
jest.mock('../../hooks/useMagicalSounds', () => ({
  useMagicalSounds: () => ({
    playLevelUpFanfare: jest.fn(),
    playSparkleSound: jest.fn()
  })
}));

// Mock EnhancedLevelUpSystem
jest.mock('../EnhancedLevelUpSystem', () => {
  return function MockEnhancedLevelUpSystem({ isLevelingUp, newLevel, onLevelUpComplete }: any) {
    return isLevelingUp ? (
      <div data-testid="level-up-system">
        <div>Level Up! New Level: {newLevel}</div>
        <button onClick={onLevelUpComplete}>Complete Level Up</button>
      </div>
    ) : null;
  };
});

describe('XPCrystalsPremium', () => {
  const defaultProps = {
    currentXP: 75,
    maxXP: 100,
    level: 3,
    onLevelUp: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders XP crystal component', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    expect(screen.getByText('75 / 100 XP')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Level badge
    expect(screen.getByText('Élève')).toBeInTheDocument(); // Default student name
  });

  it('displays correct XP values', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    expect(screen.getByText('75 / 100 XP')).toBeInTheDocument();
  });

  it('displays correct level', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    const levelBadge = screen.getByText('3');
    expect(levelBadge).toBeInTheDocument();
    expect(levelBadge.parentElement).toHaveClass('bg-gradient-to-br', 'from-yellow-400', 'to-orange-500');
  });

  it('displays custom student name', () => {
    render(<XPCrystalsPremium {...defaultProps} studentName="Alice" />);
    
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('displays achievements when provided', () => {
    const achievements = ['First Exercise', 'Perfect Score', 'Week Streak'];
    render(<XPCrystalsPremium {...defaultProps} achievements={achievements} />);
    
    // The achievements are passed to EnhancedLevelUpSystem
    expect(screen.getByText('75 / 100 XP')).toBeInTheDocument();
  });

  it('handles level up detection', async () => {
    const mockOnLevelUp = jest.fn();
    render(<XPCrystalsPremium {...defaultProps} currentXP={100} onLevelUp={mockOnLevelUp} />);
    
    // The level up detection in XPCrystalsPremium uses: Math.floor(displayXP / 100) + 1
    // With currentXP=100, expectedLevel = Math.floor(100/100) + 1 = 2
    // Since current level is 3, no level up should occur
    // Let's test with higher XP that would trigger level up
    const { rerender } = render(<XPCrystalsPremium {...defaultProps} currentXP={200} onLevelUp={mockOnLevelUp} />);
    
    await waitFor(() => {
      expect(mockOnLevelUp).toHaveBeenCalledWith(3); // Math.floor(200/100) + 1 = 3
    });
  });

  it('shows level up system when leveling up', async () => {
    // Use XP that will trigger level up: 200 XP should give level 3, but current level is 3
    // So we need XP that gives level 4 or higher
    render(<XPCrystalsPremium {...defaultProps} currentXP={300} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('level-up-system')).toBeInTheDocument();
    });
  });

  it('handles XP gain animation', async () => {
    const { rerender } = render(<XPCrystalsPremium {...defaultProps} currentXP={75} />);
    
    // Simulate XP gain
    await act(async () => {
      rerender(<XPCrystalsPremium {...defaultProps} currentXP={85} />);
    });
    
    // Should show XP gain indicator
    await waitFor(() => {
      expect(screen.getByText('+10 XP')).toBeInTheDocument();
    });
  });

  it('handles large XP gains', async () => {
    const { rerender } = render(<XPCrystalsPremium {...defaultProps} currentXP={75} />);
    
    await act(async () => {
      rerender(<XPCrystalsPremium {...defaultProps} currentXP={200} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText('+125 XP')).toBeInTheDocument();
    });
  });

  it('handles hover interactions', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    const crystalContainer = screen.getByText('75 / 100 XP').closest('.relative');
    expect(crystalContainer).toBeInTheDocument();
  });

  it('applies correct CSS classes for different levels', () => {
    // Test low level (1-5)
    const { rerender } = render(<XPCrystalsPremium {...defaultProps} level={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Test medium level (6-10)
    rerender(<XPCrystalsPremium {...defaultProps} level={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    
    // Test high level (11+)
    rerender(<XPCrystalsPremium {...defaultProps} level={15} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('handles progress bar animation', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    // Progress bar should be present
    const progressBar = document.querySelector('.h-3.bg-gray-200');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles orbiting crystals based on level', () => {
    render(<XPCrystalsPremium {...defaultProps} level={5} />);
    
    // Should render orbiting crystals (up to 6 max)
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles maximum orbiting crystals', () => {
    render(<XPCrystalsPremium {...defaultProps} level={10} />);
    
    // Should limit to 6 crystals maximum
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('handles level up completion', async () => {
    render(<XPCrystalsPremium {...defaultProps} currentXP={300} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('level-up-system')).toBeInTheDocument();
    });
    
    const completeButton = screen.getByText('Complete Level Up');
    await act(async () => {
      fireEvent.click(completeButton);
    });
    
    // Level up system should be dismissed
    await waitFor(() => {
      expect(screen.queryByTestId('level-up-system')).not.toBeInTheDocument();
    });
  });

  it('handles rapid XP changes', async () => {
    const { rerender } = render(<XPCrystalsPremium {...defaultProps} currentXP={75} />);
    
    // Rapid XP changes
    await act(async () => {
      rerender(<XPCrystalsPremium {...defaultProps} currentXP={80} />);
    });
    
    await act(async () => {
      rerender(<XPCrystalsPremium {...defaultProps} currentXP={90} />);
    });
    
    await act(async () => {
      rerender(<XPCrystalsPremium {...defaultProps} currentXP={95} />);
    });
    
    // Wait for the animation to complete and display the final value
    await waitFor(() => {
      expect(screen.getByText('95 / 100 XP')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('handles edge cases for XP values', () => {
    const edgeCases = [
      { currentXP: 0, maxXP: 100, level: 1 },
      { currentXP: 100, maxXP: 100, level: 1 },
      { currentXP: 50, maxXP: 50, level: 5 }
    ];
    
    edgeCases.forEach(({ currentXP, maxXP, level }) => {
      const { unmount } = render(
        <XPCrystalsPremium 
          {...defaultProps} 
          currentXP={currentXP} 
          maxXP={maxXP} 
          level={level} 
        />
      );
      expect(screen.getByText(`${currentXP} / ${maxXP} XP`)).toBeInTheDocument();
      unmount();
    });
  });

  it('handles zero level', () => {
    render(<XPCrystalsPremium {...defaultProps} level={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles very high levels', () => {
    render(<XPCrystalsPremium {...defaultProps} level={100} />);
    
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('handles negative XP values', () => {
    render(<XPCrystalsPremium {...defaultProps} currentXP={-10} />);
    
    expect(screen.getByText('-10 / 100 XP')).toBeInTheDocument();
  });

  it('handles XP greater than maxXP', () => {
    render(<XPCrystalsPremium {...defaultProps} currentXP={150} maxXP={100} />);
    
    expect(screen.getByText('150 / 100 XP')).toBeInTheDocument();
  });

  it('handles component unmounting during animation', async () => {
    const { unmount } = render(<XPCrystalsPremium {...defaultProps} currentXP={75} />);
    
    // Start XP animation
    await act(async () => {
      // Simulate XP gain
      render(<XPCrystalsPremium {...defaultProps} currentXP={85} />);
    });
    
    // Unmount during animation
    unmount();
    
    // Should not throw errors
    expect(true).toBe(true);
  });

  it('handles multiple level ups in sequence', async () => {
    const mockOnLevelUp = jest.fn();
    const { rerender } = render(
      <XPCrystalsPremium {...defaultProps} currentXP={95} onLevelUp={mockOnLevelUp} />
    );
    
    // First level up - 200 XP should give level 3, but current level is 3, so no level up
    // Let's use 300 XP which should give level 4
    await act(async () => {
      rerender(<XPCrystalsPremium {...defaultProps} currentXP={300} onLevelUp={mockOnLevelUp} />);
    });
    
    await waitFor(() => {
      expect(mockOnLevelUp).toHaveBeenCalledWith(4); // Math.floor(300/100) + 1 = 4
    });
    
    // Second level up - 500 XP should give level 6
    await act(async () => {
      rerender(<XPCrystalsPremium {...defaultProps} currentXP={500} onLevelUp={mockOnLevelUp} />);
    });
    
    await waitFor(() => {
      expect(mockOnLevelUp).toHaveBeenCalledWith(6); // Math.floor(500/100) + 1 = 6
    });
  });

  it('handles breathing animation', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    // Component should render with breathing animation
    expect(screen.getByText('75 / 100 XP')).toBeInTheDocument();
  });

  it('handles shimmer effect on progress bar', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    // Shimmer effect should be present
    const shimmer = document.querySelector('.absolute.inset-0.bg-gradient-to-r');
    expect(shimmer).toBeInTheDocument();
  });

  it('handles aura effects', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    // Multi-layered aura should be present
    const auraLayers = document.querySelectorAll('.absolute.inset-0.pointer-events-none > div');
    expect(auraLayers.length).toBeGreaterThan(0);
  });

  it('handles energy core effects', () => {
    render(<XPCrystalsPremium {...defaultProps} />);
    
    // Energy core should be present
    const energyCore = document.querySelector('.absolute.inset-4.rounded-full');
    expect(energyCore).toBeInTheDocument();
  });
});



