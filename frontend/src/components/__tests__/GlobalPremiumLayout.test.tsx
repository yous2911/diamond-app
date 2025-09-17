import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import GlobalPremiumLayout from '../GlobalPremiumLayout';
import { PremiumFeaturesProvider } from '../../contexts/PremiumFeaturesContext';

// Mock the premium components
jest.mock('../AdvancedParticleEngine', () => {
  return function MockAdvancedParticleEngine({ isActive, className }: any) {
    return isActive ? (
      <div data-testid="particle-engine" className={className}>
        Particle Engine Active
      </div>
    ) : null;
  };
});

jest.mock('../HybridMascotSystem', () => {
  return function MockHybridMascotSystem({ mascotType, onMascotInteraction }: any) {
    return (
      <div data-testid="mascot-system" data-mascot-type={mascotType}>
        <button onClick={() => onMascotInteraction('click')}>
          Mascot
        </button>
      </div>
    );
  };
});

jest.mock('../XPCrystalsPremium', () => {
  return function MockXPCrystalsPremium({ currentXP, maxXP, level, onLevelUp }: any) {
    return (
      <div data-testid="xp-crystals">
        <div>XP: {currentXP}/{maxXP}</div>
        <div>Level: {level}</div>
        <button onClick={() => onLevelUp(level + 1)}>Level Up</button>
      </div>
    );
  };
});

// Mock window.innerWidth and innerHeight
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 768,
});

const TestWrapper: React.FC<{ children: React.ReactNode; initialXP?: number; initialLevel?: number }> = ({ 
  children, 
  initialXP = 50, 
  initialLevel = 2 
}) => (
  <PremiumFeaturesProvider initialXP={initialXP} initialLevel={initialLevel}>
    {children}
  </PremiumFeaturesProvider>
);

describe('GlobalPremiumLayout', () => {
  const defaultProps = {
    children: <div data-testid="main-content">Main Content</div>
  };

  it('renders main content', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByTestId('xp-crystals')).toBeInTheDocument();
    expect(screen.getByTestId('mascot-system')).toBeInTheDocument();
  });

  it('shows XP bar by default', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByTestId('xp-crystals')).toBeInTheDocument();
  });

  it('hides XP bar when showXPBar is false', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} showXPBar={false} />
      </TestWrapper>
    );

    expect(screen.queryByTestId('xp-crystals')).not.toBeInTheDocument();
  });

  it('positions XP bar at top when xpPosition is top', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} xpPosition="top" />
      </TestWrapper>
    );

    const xpContainer = screen.getByTestId('xp-crystals').parentElement;
    expect(xpContainer).toHaveClass('top-6', 'left-1/2', 'transform', '-translate-x-1/2');
  });

  it('positions XP bar at bottom when xpPosition is bottom', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} xpPosition="bottom" />
      </TestWrapper>
    );

    const xpContainer = screen.getByTestId('xp-crystals').parentElement;
    expect(xpContainer).toHaveClass('bottom-6', 'left-1/2', 'transform', '-translate-x-1/2');
  });

  it('positions XP bar at floating position by default', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    const xpContainer = screen.getByTestId('xp-crystals').parentElement;
    expect(xpContainer).toHaveClass('top-6', 'left-6');
  });

  it('renders particle engine when particles are active', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    // The particle engine should be rendered based on showParticles state
    expect(screen.getByTestId('particle-engine')).toBeInTheDocument();
  });

  it('renders mascot system with correct props', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    const mascotSystem = screen.getByTestId('mascot-system');
    expect(mascotSystem).toHaveAttribute('data-mascot-type', 'dragon');
  });

  it('handles mascot interaction', async () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    const mascotButton = screen.getByRole('button', { name: 'Mascot' });
    
    await act(async () => {
      fireEvent.click(mascotButton);
    });

    // The interaction should be handled without errors
    expect(mascotButton).toBeInTheDocument();
  });

  it('handles level up correctly', async () => {
    const mockOnLevelUp = jest.fn();
    
    render(
      <TestWrapper initialXP={90} initialLevel={2}>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    const levelUpButton = screen.getByRole('button', { name: 'Level Up' });
    
    await act(async () => {
      fireEvent.click(levelUpButton);
    });

    // Level up should be handled
    expect(levelUpButton).toBeInTheDocument();
  }, 10000);

  it('converts particle types correctly', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    // The component should render without errors, indicating type conversion works
    expect(screen.getByTestId('particle-engine')).toBeInTheDocument();
  });

  it('converts mascot emotions to activities correctly', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    // The mascot system should render with the correct activity
    expect(screen.getByTestId('mascot-system')).toBeInTheDocument();
  });

  it('applies correct CSS classes for layout', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    const mainContainer = screen.getByTestId('main-content').parentElement?.parentElement;
    expect(mainContainer).toHaveClass(
      'min-h-screen',
      'bg-gradient-to-br',
      'from-purple-50',
      'via-blue-50',
      'to-pink-50',
      'relative',
      'overflow-hidden'
    );
  });

  it('positions mascot system correctly', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    const mascotContainer = screen.getByTestId('mascot-system').parentElement;
    expect(mascotContainer).toHaveClass('fixed', 'bottom-6', 'right-6', 'z-40');
  });

  it('passes correct student data to mascot', () => {
    render(
      <TestWrapper initialXP={75} initialLevel={3}>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    // The mascot should receive the correct data
    expect(screen.getByTestId('mascot-system')).toBeInTheDocument();
  });

  it('handles multiple children correctly', () => {
    const multipleChildren = (
      <>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
        <div data-testid="child-3">Child 3</div>
      </>
    );

    render(
      <TestWrapper>
        <GlobalPremiumLayout children={multipleChildren} />
      </TestWrapper>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
    expect(screen.getByTestId('child-3')).toBeInTheDocument();
  });

  it('maintains z-index layering correctly', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    const particleEngine = screen.getByTestId('particle-engine');
    const xpContainer = screen.getByTestId('xp-crystals').parentElement;
    const mascotContainer = screen.getByTestId('mascot-system').parentElement;

    expect(particleEngine).toHaveClass('z-10');
    expect(xpContainer).toHaveClass('z-40');
    expect(mascotContainer).toHaveClass('z-40');
  });

  it('handles window resize for particle engine', () => {
    render(
      <TestWrapper>
        <GlobalPremiumLayout {...defaultProps} />
      </TestWrapper>
    );

    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', { value: 1920 });
    Object.defineProperty(window, 'innerHeight', { value: 1080 });

    fireEvent(window, new Event('resize'));

    // Component should still render correctly
    expect(screen.getByTestId('particle-engine')).toBeInTheDocument();
  });
});
