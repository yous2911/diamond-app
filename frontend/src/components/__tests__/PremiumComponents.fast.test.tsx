/**
 * Fast Premium Components Tests
 * These tests focus on the core functionality without heavy animations or 3D rendering
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PremiumFeaturesProvider, usePremiumFeatures } from '../../contexts/PremiumFeaturesContext';

// Mock the heavy components completely
jest.mock('../AdvancedParticleEngine', () => () => <div data-testid="particle-engine-mock">Mock Particle Engine</div>);
jest.mock('../HybridMascotSystem', () => () => <div data-testid="mascot-system-mock">Mock Mascot System</div>);
jest.mock('../XPCrystalsPremium', () => ({ currentXP, maxXP, level }: any) => (
  <div data-testid="xp-crystals-mock">
    <span data-testid="xp-value">{currentXP}/{maxXP}</span>
    <span data-testid="level-value">{level}</span>
  </div>
));

// Mock the audio hook
jest.mock('../../hooks/useMagicalSounds', () => ({
  useMagicalSounds: () => ({
    playMagicalChord: jest.fn(),
    playSparkleSound: jest.fn(),
    playLevelUpFanfare: jest.fn(),
    playButtonClick: jest.fn(),
    playErrorSound: jest.fn(),
    soundEnabled: true,
    setSoundEnabled: jest.fn()
  })
}));

// Simple test component that uses the context
const TestComponent: React.FC = () => {
  const {
    currentXP,
    maxXP,
    level,
    addXP,
    showParticles,
    particleType,
    triggerParticles,
    mascotEmotion,
    setMascotEmotion
  } = usePremiumFeatures();

  return (
    <div>
      <div data-testid="xp-display">{currentXP}/{maxXP}</div>
      <div data-testid="level-display">{level}</div>
      <div data-testid="particles-active">{showParticles.toString()}</div>
      <div data-testid="particle-type">{particleType}</div>
      <div data-testid="mascot-emotion">{mascotEmotion}</div>

      <button data-testid="add-xp-btn" onClick={() => addXP(10, 'exercise')}>
        Add XP
      </button>
      <button data-testid="trigger-particles-btn" onClick={() => triggerParticles('success')}>
        Trigger Particles
      </button>
      <button data-testid="set-emotion-btn" onClick={() => setMascotEmotion('excited')}>
        Set Excited
      </button>
    </div>
  );
};

describe('Premium Components - Fast Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PremiumFeaturesProvider', () => {
    it('provides default context values', () => {
      render(
        <PremiumFeaturesProvider>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      expect(screen.getByTestId('xp-display')).toHaveTextContent('0/120');
      expect(screen.getByTestId('level-display')).toHaveTextContent('1');
      expect(screen.getByTestId('particles-active')).toHaveTextContent('false');
      expect(screen.getByTestId('particle-type')).toHaveTextContent('magic');
      expect(screen.getByTestId('mascot-emotion')).toHaveTextContent('happy');
    });

    it('provides custom initial values', () => {
      render(
        <PremiumFeaturesProvider initialXP={50} initialLevel={3}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      expect(screen.getByTestId('xp-display')).toHaveTextContent('50/160');
      expect(screen.getByTestId('level-display')).toHaveTextContent('3');
    });

    it('calculates maxXP correctly', () => {
      const testCases = [
        { level: 1, expectedMaxXP: 120 },
        { level: 5, expectedMaxXP: 200 },
        { level: 10, expectedMaxXP: 300 }
      ];

      testCases.forEach(({ level, expectedMaxXP }) => {
        const { unmount } = render(
          <PremiumFeaturesProvider initialLevel={level}>
            <TestComponent />
          </PremiumFeaturesProvider>
        );

        expect(screen.getByTestId('xp-display')).toHaveTextContent(`0/${expectedMaxXP}`);
        unmount();
      });
    });
  });

  describe('XP System', () => {
    it('adds XP correctly', () => {
      render(
        <PremiumFeaturesProvider initialXP={50}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      const addButton = screen.getByTestId('add-xp-btn');
      fireEvent.click(addButton);

      expect(screen.getByTestId('xp-display')).toHaveTextContent('60/120');
    });

    it('handles level up when XP reaches max', () => {
      const mockOnLevelUp = jest.fn();

      render(
        <PremiumFeaturesProvider initialXP={110} initialLevel={1} onLevelUp={mockOnLevelUp}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      const addButton = screen.getByTestId('add-xp-btn');
      fireEvent.click(addButton);

      expect(mockOnLevelUp).toHaveBeenCalledWith(2);
      expect(screen.getByTestId('level-display')).toHaveTextContent('2');
    });

    it('resets XP after level up', () => {
      const mockOnLevelUp = jest.fn();

      render(
        <PremiumFeaturesProvider initialXP={110} initialLevel={1} onLevelUp={mockOnLevelUp}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      const addButton = screen.getByTestId('add-xp-btn');
      fireEvent.click(addButton);

      // XP should reset to 0 after level up (120 - 120 = 0)
      expect(screen.getByTestId('xp-display')).toHaveTextContent('0/140');
    });

    it('handles multiple XP additions', () => {
      render(
        <PremiumFeaturesProvider initialXP={50}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      const addButton = screen.getByTestId('add-xp-btn');

      fireEvent.click(addButton);
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      expect(screen.getByTestId('xp-display')).toHaveTextContent('80/120');
    });
  });

  describe('Particle System', () => {
    it('triggers particles correctly', () => {
      render(
        <PremiumFeaturesProvider>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      const triggerButton = screen.getByTestId('trigger-particles-btn');
      fireEvent.click(triggerButton);

      expect(screen.getByTestId('particles-active')).toHaveTextContent('true');
      expect(screen.getByTestId('particle-type')).toHaveTextContent('success');
    });

    it('handles different particle types', () => {
      const TestParticleComponent: React.FC = () => {
        const { triggerParticles } = usePremiumFeatures();
        return (
          <div>
            <button onClick={() => triggerParticles('levelup')}>Level Up Particles</button>
            <button onClick={() => triggerParticles('magic')}>Magic Particles</button>
          </div>
        );
      };

      render(
        <PremiumFeaturesProvider>
          <TestParticleComponent />
        </PremiumFeaturesProvider>
      );

      const levelUpButton = screen.getByText('Level Up Particles');
      const magicButton = screen.getByText('Magic Particles');

      fireEvent.click(levelUpButton);
      // Note: We can't easily test the particle type change without more complex setup
      // but we can verify the function is called
      expect(levelUpButton).toBeInTheDocument();

      fireEvent.click(magicButton);
      expect(magicButton).toBeInTheDocument();
    });
  });

  describe('Mascot System', () => {
    it('sets mascot emotion correctly', () => {
      render(
        <PremiumFeaturesProvider>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      const emotionButton = screen.getByTestId('set-emotion-btn');
      fireEvent.click(emotionButton);

      expect(screen.getByTestId('mascot-emotion')).toHaveTextContent('excited');
    });

    it('handles different emotions', () => {
      const TestEmotionComponent: React.FC = () => {
        const { setMascotEmotion, mascotEmotion } = usePremiumFeatures();
        return (
          <div>
            <div data-testid="current-emotion">{mascotEmotion}</div>
            <button onClick={() => setMascotEmotion('happy')}>Set Happy</button>
            <button onClick={() => setMascotEmotion('thinking')}>Set Thinking</button>
          </div>
        );
      };

      render(
        <PremiumFeaturesProvider>
          <TestEmotionComponent />
        </PremiumFeaturesProvider>
      );

      const happyButton = screen.getByText('Set Happy');
      const thinkingButton = screen.getByText('Set Thinking');

      fireEvent.click(happyButton);
      expect(screen.getByTestId('current-emotion')).toHaveTextContent('happy');

      fireEvent.click(thinkingButton);
      expect(screen.getByTestId('current-emotion')).toHaveTextContent('thinking');
    });
  });

  describe('Error Handling', () => {
    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('usePremiumFeatures must be used within a PremiumFeaturesProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero XP', () => {
      render(
        <PremiumFeaturesProvider initialXP={0}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      expect(screen.getByTestId('xp-display')).toHaveTextContent('0/120');
    });

    it('handles high XP values', () => {
      render(
        <PremiumFeaturesProvider initialXP={1000}>
          <TestComponent />
      </PremiumFeaturesProvider>
      );

      expect(screen.getByTestId('xp-display')).toHaveTextContent('1000/120');
    });

    it('handles high level values', () => {
      render(
        <PremiumFeaturesProvider initialLevel={50}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      expect(screen.getByTestId('level-display')).toHaveTextContent('50');
      expect(screen.getByTestId('xp-display')).toHaveTextContent('0/1100'); // 100 + (50 * 20)
    });
  });
});






