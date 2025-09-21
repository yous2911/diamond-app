import React from 'react';
import { render, screen, act } from '@testing-library/react';
import GlobalPremiumLayout from '../GlobalPremiumLayout';
import { PremiumFeaturesContext } from '../../contexts/PremiumFeaturesContext';

// Mock child components to isolate the layout component and capture props
let capturedOnLevelUp: (newLevel: number) => void;
jest.mock('../AdvancedParticleEngine', () => (props: any) => <div data-testid="particle-engine" data-props={JSON.stringify(props)} />);
jest.mock('../MascotSystem', () => (props: any) => (
  <div data-testid="mascot-system" data-props={JSON.stringify(props)} />
));
jest.mock('../XPCrystalsPremium', () => (props: any) => {
    capturedOnLevelUp = props.onLevelUp;
    return <div data-testid="xp-crystals" data-props={JSON.stringify(props)} />;
});

describe('GlobalPremiumLayout', () => {
  const mockSetMascotEmotion = jest.fn();
  const mockOnLevelUp = jest.fn();

  // A default context value for the provider
  const defaultContextValue = {
    showParticles: false,
    particleType: 'success' as 'success' | 'levelup' | 'magic',
    mascotEmotion: 'happy',
    currentXP: 50,
    maxXP: 100,
    level: 5,
    triggerParticles: jest.fn(),
    setMascotEmotion: mockSetMascotEmotion,
    onLevelUp: mockOnLevelUp,
    addXP: jest.fn(),
  };

  // Helper function to render components with the context provider
  const renderWithProvider = (
    ui: React.ReactElement,
    providerProps?: Partial<typeof defaultContextValue>
  ) => {
    return render(
      <PremiumFeaturesContext.Provider value={{ ...defaultContextValue, ...providerProps }}>
        {ui}
      </PremiumFeaturesContext.Provider>
    );
  };

  it('renders children correctly', () => {
    renderWithProvider(
      <GlobalPremiumLayout>
        <div data-testid="child-content">Child Content</div>
      </GlobalPremiumLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders the mascot system and XP crystals by default', () => {
    renderWithProvider(<GlobalPremiumLayout><div></div></GlobalPremiumLayout>);
    expect(screen.getByTestId('mascot-system')).toBeInTheDocument();
    expect(screen.getByTestId('xp-crystals')).toBeInTheDocument();
  });

  it('does not render XP bar when showXPBar is false', () => {
    renderWithProvider(<GlobalPremiumLayout showXPBar={false}><div></div></GlobalPremiumLayout>);
    expect(screen.queryByTestId('xp-crystals')).not.toBeInTheDocument();
  });

  it('renders particle engine when showParticles is true from context', () => {
    renderWithProvider(
      <GlobalPremiumLayout><div></div></GlobalPremiumLayout>,
      { showParticles: true }
    );
    expect(screen.getByTestId('particle-engine')).toBeInTheDocument();
  });

  it('does not render particle engine when showParticles is false from context', () => {
    renderWithProvider(
      <GlobalPremiumLayout><div></div></GlobalPremiumLayout>,
      { showParticles: false }
    );
    expect(screen.queryByTestId('particle-engine')).not.toBeInTheDocument();
  });

  it('passes the correct locale to the MascotSystem', () => {
    renderWithProvider(<GlobalPremiumLayout locale="en"><div></div></GlobalPremiumLayout>);
    const mascot = screen.getByTestId('mascot-system');
    const props = JSON.parse(mascot.dataset.props as string);
    expect(props.locale).toBe('en');
  });

  it('defaults locale to "fr" when not provided', () => {
    renderWithProvider(<GlobalPremiumLayout><div></div></GlobalPremiumLayout>);
    const mascot = screen.getByTestId('mascot-system');
    const props = JSON.parse(mascot.dataset.props as string);
    expect(props.locale).toBe('fr');
  });

  it('positions the XP bar at the top when xpPosition is "top"', () => {
    renderWithProvider(<GlobalPremiumLayout xpPosition="top"><div></div></GlobalPremiumLayout>);
    const xpBarContainer = screen.getByTestId('xp-crystals').parentElement;
    expect(xpBarContainer).toHaveClass('top-6');
  });

  it('positions the XP bar at the bottom when xpPosition is "bottom"', () => {
    renderWithProvider(<GlobalPremiumLayout xpPosition="bottom"><div></div></GlobalPremiumLayout>);
    const xpBarContainer = screen.getByTestId('xp-crystals').parentElement;
    expect(xpBarContainer).toHaveClass('bottom-6');
  });

  it('positions the XP bar with floating position by default', () => {
    renderWithProvider(<GlobalPremiumLayout><div></div></GlobalPremiumLayout>);
    const xpBarContainer = screen.getByTestId('xp-crystals').parentElement;
    expect(xpBarContainer).toHaveClass('top-6 left-6');
  });

  it('triggers onLevelUp and sets mascot emotion when level up occurs', () => {
    renderWithProvider(<GlobalPremiumLayout><div></div></GlobalPremiumLayout>);

    act(() => {
        capturedOnLevelUp(6);
    });

    expect(mockOnLevelUp).toHaveBeenCalledWith(6);
    expect(mockSetMascotEmotion).toHaveBeenCalledWith('excited');
  });

  it('passes correct translated particle type to AdvancedParticleEngine', () => {
    renderWithProvider(
      <GlobalPremiumLayout><div></div></GlobalPremiumLayout>,
      { showParticles: true, particleType: 'levelup' }
    );
    const particleEngine = screen.getByTestId('particle-engine');
    const props = JSON.parse(particleEngine.dataset.props as string);
    expect(props.particleType).toBe('star');
  });

  it('passes correct translated activity to MascotSystem', () => {
    renderWithProvider(
      <GlobalPremiumLayout><div></div></GlobalPremiumLayout>,
      { mascotEmotion: 'celebrating' }
    );
    const mascot = screen.getByTestId('mascot-system');
    const props = JSON.parse(mascot.dataset.props as string);
    expect(props.currentActivity).toBe('achievement');
  });

  it('passes student streak and equipped items to MascotSystem', () => {
    renderWithProvider(
      <GlobalPremiumLayout studentStreak={15} equippedMascotItems={['test_item']}>
        <div></div>
      </GlobalPremiumLayout>
    );
    const mascot = screen.getByTestId('mascot-system');
    const props = JSON.parse(mascot.dataset.props as string);
    expect(props.studentData.currentStreak).toBe(15);
    expect(props.equippedItems).toEqual(['test_item']);
  });
});
