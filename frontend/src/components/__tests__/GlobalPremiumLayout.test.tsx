import React from 'react';
import { render, screen } from '@testing-library/react';
import GlobalPremiumLayout from '../GlobalPremiumLayout';
import { PremiumFeaturesContext } from '../../contexts/PremiumFeaturesContext';

// Mock child components to isolate the layout component
jest.mock('../AdvancedParticleEngine', () => () => <div data-testid="particle-engine" />);
jest.mock('../MascotSystem', () => (props: { locale: string }) => (
  <div data-testid="mascot-system" data-locale={props.locale} />
));
jest.mock('../XPCrystalsPremium', () => () => <div data-testid="xp-crystals" />);

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
    expect(mascot).toHaveAttribute('data-locale', 'en');
  });

  it('defaults locale to "fr" when not provided', () => {
    renderWithProvider(<GlobalPremiumLayout><div></div></GlobalPremiumLayout>);
    const mascot = screen.getByTestId('mascot-system');
    expect(mascot).toHaveAttribute('data-locale', 'fr');
  });

  it('positions the XP bar at the top when xpPosition is "top"', () => {
    renderWithProvider(<GlobalPremiumLayout xpPosition="top"><div></div></GlobalPremiumLayout>);
    const xpBarContainer = screen.getByTestId('xp-crystals').parentElement;
    expect(xpBarContainer).toHaveClass('top-6');
  });
});
