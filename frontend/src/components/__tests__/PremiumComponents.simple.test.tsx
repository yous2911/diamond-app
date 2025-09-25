import React from 'react';
import { render, screen } from '@testing-library/react';
import { PremiumFeaturesProvider } from '../../contexts/PremiumFeaturesContext';

// Mock all the heavy components to avoid timeout issues
jest.mock('../AdvancedParticleEngine', () => {
  return function MockAdvancedParticleEngine() {
    return <div data-testid="particle-engine">Particle Engine</div>;
  };
});

jest.mock('../HybridMascotSystem', () => {
  return function MockHybridMascotSystem() {
    return <div data-testid="mascot-system">Mascot System</div>;
  };
});

jest.mock('../XPCrystalsPremium', () => {
  return function MockXPCrystalsPremium({ currentXP, maxXP, level }: any) {
    return (
      <div data-testid="xp-crystals">
        <div>XP: {currentXP}/{maxXP}</div>
        <div>Level: {level}</div>
      </div>
    );
  };
});

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

// Simple test component
const TestComponent: React.FC = () => {
  const { currentXP, maxXP, level, addXP } = usePremiumFeatures();

  return (
    <div>
      <div data-testid="xp-display">{currentXP}/{maxXP}</div>
      <div data-testid="level-display">{level}</div>
      <button onClick={() => addXP(10)}>Add XP</button>
    </div>
  );
};

describe('Premium Components - Simple Tests', () => {
  it('renders PremiumFeaturesProvider with default values', () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    expect(screen.getByTestId('xp-display')).toHaveTextContent('0/120');
    expect(screen.getByTestId('level-display')).toHaveTextContent('1');
  });

  it('renders PremiumFeaturesProvider with custom values', () => {
    render(
      <PremiumFeaturesProvider initialXP={50} initialLevel={3}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    expect(screen.getByTestId('xp-display')).toHaveTextContent('50/160');
    expect(screen.getByTestId('level-display')).toHaveTextContent('3');
  });

  it('adds XP correctly', () => {
    render(
      <PremiumFeaturesProvider initialXP={50}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addButton = screen.getByText('Add XP');
    addButton.click();

    expect(screen.getByTestId('xp-display')).toHaveTextContent('60/120');
  });

  it('renders mocked particle engine', () => {
    const { AdvancedParticleEngine } = require('../AdvancedParticleEngine');
    const { render: renderComponent } = require('@testing-library/react');

    const { container } = renderComponent(<AdvancedParticleEngine />);
    expect(container.querySelector('[data-testid="particle-engine"]')).toBeInTheDocument();
  });

  it('renders mocked mascot system', () => {
    const { HybridMascotSystem } = require('../HybridMascotSystem');
    const { render: renderComponent } = require('@testing-library/react');

    const { container } = renderComponent(<HybridMascotSystem />);
    expect(container.querySelector('[data-testid="mascot-system"]')).toBeInTheDocument();
  });

  it('renders mocked XP crystals', () => {
    const { XPCrystalsPremium } = require('../XPCrystalsPremium');
    const { render: renderComponent } = require('@testing-library/react');

    const { container } = renderComponent(
      <XPCrystalsPremium currentXP={75} maxXP={100} level={3} onLevelUp={jest.fn()} />
    );
    expect(container.querySelector('[data-testid="xp-crystals"]')).toBeInTheDocument();
  });

  it('handles level up when XP reaches max', () => {
    const mockOnLevelUp = jest.fn();

    render(
      <PremiumFeaturesProvider initialXP={110} initialLevel={1} onLevelUp={mockOnLevelUp}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addButton = screen.getByText('Add XP');
    addButton.click();

    // Should trigger level up
    expect(mockOnLevelUp).toHaveBeenCalledWith(2);
  });

  it('calculates maxXP correctly for different levels', () => {
    const levels = [1, 5, 10];
    const expectedMaxXPs = [120, 200, 300]; // 100 + (level * 20)

    levels.forEach((level, index) => {
      const { unmount } = render(
        <PremiumFeaturesProvider initialLevel={level}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      expect(screen.getByTestId('xp-display')).toHaveTextContent(`0/${expectedMaxXPs[index]}`);
      unmount();
    });
  });

  it('handles multiple XP additions', () => {
    render(
      <PremiumFeaturesProvider initialXP={50}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addButton = screen.getByText('Add XP');

    // Add XP multiple times
    addButton.click();
    addButton.click();
    addButton.click();

    expect(screen.getByTestId('xp-display')).toHaveTextContent('80/120');
  });

  it('handles edge cases for XP values', () => {
    const edgeCases = [
      { initialXP: 0, expected: '0/120' },
      { initialXP: 100, expected: '100/120' },
      { initialXP: 200, expected: '200/120' }
    ];

    edgeCases.forEach(({ initialXP, expected }) => {
      const { unmount } = render(
        <PremiumFeaturesProvider initialXP={initialXP}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      expect(screen.getByTestId('xp-display')).toHaveTextContent(expected);
      unmount();
    });
  });

  it('handles different initial levels', () => {
    const levels = [1, 5, 10, 20];

    levels.forEach(level => {
      const { unmount } = render(
        <PremiumFeaturesProvider initialLevel={level}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );

      expect(screen.getByTestId('level-display')).toHaveTextContent(level.toString());
      unmount();
    });
  });

  it('provides all required context values', () => {
    const TestContextComponent: React.FC = () => {
      const context = usePremiumFeatures();

      return (
        <div>
          <div data-testid="has-current-xp">{typeof context.currentXP}</div>
          <div data-testid="has-max-xp">{typeof context.maxXP}</div>
          <div data-testid="has-level">{typeof context.level}</div>
          <div data-testid="has-add-xp">{typeof context.addXP}</div>
          <div data-testid="has-show-particles">{typeof context.showParticles}</div>
          <div data-testid="has-particle-type">{typeof context.particleType}</div>
          <div data-testid="has-mascot-emotion">{typeof context.mascotEmotion}</div>
        </div>
      );
    };

    render(
      <PremiumFeaturesProvider>
        <TestContextComponent />
      </PremiumFeaturesProvider>
    );

    expect(screen.getByTestId('has-current-xp')).toHaveTextContent('number');
    expect(screen.getByTestId('has-max-xp')).toHaveTextContent('number');
    expect(screen.getByTestId('has-level')).toHaveTextContent('number');
    expect(screen.getByTestId('has-add-xp')).toHaveTextContent('function');
    expect(screen.getByTestId('has-show-particles')).toHaveTextContent('boolean');
    expect(screen.getByTestId('has-particle-type')).toHaveTextContent('string');
    expect(screen.getByTestId('has-mascot-emotion')).toHaveTextContent('string');
  });
});






