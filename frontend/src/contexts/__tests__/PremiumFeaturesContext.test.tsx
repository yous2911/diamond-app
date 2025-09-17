import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { PremiumFeaturesProvider, usePremiumFeatures } from '../PremiumFeaturesContext';

// Mock useMagicalSounds hook
const mockPlayMagicalChord = jest.fn();
const mockPlaySparkleSound = jest.fn();
const mockPlayLevelUpFanfare = jest.fn();
const mockPlayButtonClick = jest.fn();
const mockPlayErrorSound = jest.fn();

jest.mock('../../hooks/useMagicalSounds', () => ({
  useMagicalSounds: () => ({
    playMagicalChord: mockPlayMagicalChord,
    playSparkleSound: mockPlaySparkleSound,
    playLevelUpFanfare: mockPlayLevelUpFanfare,
    playButtonClick: mockPlayButtonClick,
    playErrorSound: mockPlayErrorSound,
    soundEnabled: true,
    setSoundEnabled: jest.fn()
  })
}));

// Test component that uses the context
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
    mascotMessage,
    setMascotEmotion,
    setMascotMessage,
    soundEnabled,
    setSoundEnabled,
    playMagicalChord,
    playSparkleSound,
    playLevelUpFanfare,
    playButtonClick,
    playErrorSound
  } = usePremiumFeatures();

  return (
    <div>
      <div data-testid="current-xp">{currentXP}</div>
      <div data-testid="max-xp">{maxXP}</div>
      <div data-testid="level">{level}</div>
      <div data-testid="show-particles">{showParticles.toString()}</div>
      <div data-testid="particle-type">{particleType}</div>
      <div data-testid="mascot-emotion">{mascotEmotion}</div>
      <div data-testid="mascot-message">{mascotMessage}</div>
      <div data-testid="sound-enabled">{soundEnabled.toString()}</div>
      
      <button onClick={() => addXP(10, 'exercise')}>Add XP</button>
      <button onClick={() => addXP(50, 'achievement')}>Add Achievement XP</button>
      <button onClick={() => triggerParticles('success')}>Trigger Success Particles</button>
      <button onClick={() => triggerParticles('levelup')}>Trigger Level Up Particles</button>
      <button onClick={() => triggerParticles('magic')}>Trigger Magic Particles</button>
      <button onClick={() => setMascotEmotion('excited')}>Set Excited</button>
      <button onClick={() => setMascotEmotion('happy')}>Set Happy</button>
      <button onClick={() => setMascotMessage('Test message')}>Set Message</button>
      <button onClick={() => setSoundEnabled(false)}>Disable Sound</button>
      <button onClick={() => playMagicalChord()}>Play Magical Chord</button>
      <button onClick={() => playSparkleSound()}>Play Sparkle</button>
      <button onClick={() => playLevelUpFanfare()}>Play Level Up</button>
      <button onClick={() => playButtonClick()}>Play Button Click</button>
      <button onClick={() => playErrorSound()}>Play Error</button>
    </div>
  );
};

describe('PremiumFeaturesContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides default values', () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    expect(screen.getByTestId('current-xp')).toHaveTextContent('0');
    expect(screen.getByTestId('max-xp')).toHaveTextContent('120'); // 100 + (1 * 20)
    expect(screen.getByTestId('level')).toHaveTextContent('1');
    expect(screen.getByTestId('show-particles')).toHaveTextContent('false');
    expect(screen.getByTestId('particle-type')).toHaveTextContent('magic');
    expect(screen.getByTestId('mascot-emotion')).toHaveTextContent('happy');
    expect(screen.getByTestId('mascot-message')).toHaveTextContent('');
    expect(screen.getByTestId('sound-enabled')).toHaveTextContent('true');
  });

  it('provides custom initial values', () => {
    render(
      <PremiumFeaturesProvider initialXP={50} initialLevel={3}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    expect(screen.getByTestId('current-xp')).toHaveTextContent('50');
    expect(screen.getByTestId('max-xp')).toHaveTextContent('160'); // 100 + (3 * 20)
    expect(screen.getByTestId('level')).toHaveTextContent('3');
  });

  it('adds XP correctly', async () => {
    render(
      <PremiumFeaturesProvider initialXP={50}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addXPButton = screen.getByText('Add XP');
    
    await act(async () => {
      fireEvent.click(addXPButton);
    });

    expect(screen.getByTestId('current-xp')).toHaveTextContent('60');
    expect(mockPlaySparkleSound).toHaveBeenCalled();
  });

  it('triggers level up when XP reaches max', async () => {
    const mockOnLevelUp = jest.fn();
    render(
      <PremiumFeaturesProvider initialXP={90} initialLevel={1} onLevelUp={mockOnLevelUp}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addXPButton = screen.getByText('Add XP');
    
    await act(async () => {
      fireEvent.click(addXPButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('level')).toHaveTextContent('2');
      expect(screen.getByTestId('current-xp')).toHaveTextContent('0'); // Reset after level up
    });

    expect(mockOnLevelUp).toHaveBeenCalledWith(2);
    expect(mockPlayLevelUpFanfare).toHaveBeenCalled();
  });

  it('handles multiple level ups', async () => {
    const mockOnLevelUp = jest.fn();
    render(
      <PremiumFeaturesProvider initialXP={90} initialLevel={1} onLevelUp={mockOnLevelUp}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addAchievementButton = screen.getByText('Add Achievement XP');
    
    await act(async () => {
      fireEvent.click(addAchievementButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('level')).toHaveTextContent('2');
    });

    expect(mockOnLevelUp).toHaveBeenCalledWith(2);
  });

  it('triggers particles correctly', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const successButton = screen.getByText('Trigger Success Particles');
    
    await act(async () => {
      fireEvent.click(successButton);
    });

    expect(screen.getByTestId('show-particles')).toHaveTextContent('true');
    expect(screen.getByTestId('particle-type')).toHaveTextContent('success');

    // Particles should stop after duration
    await waitFor(() => {
      expect(screen.getByTestId('show-particles')).toHaveTextContent('false');
    }, { timeout: 3000 });
  });

  it('triggers level up particles', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const levelUpButton = screen.getByText('Trigger Level Up Particles');
    
    await act(async () => {
      fireEvent.click(levelUpButton);
    });

    expect(screen.getByTestId('show-particles')).toHaveTextContent('true');
    expect(screen.getByTestId('particle-type')).toHaveTextContent('levelup');
  });

  it('triggers magic particles', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const magicButton = screen.getByText('Trigger Magic Particles');
    
    await act(async () => {
      fireEvent.click(magicButton);
    });

    expect(screen.getByTestId('show-particles')).toHaveTextContent('true');
    expect(screen.getByTestId('particle-type')).toHaveTextContent('magic');
  });

  it('sets mascot emotion correctly', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const excitedButton = screen.getByText('Set Excited');
    
    await act(async () => {
      fireEvent.click(excitedButton);
    });

    expect(screen.getByTestId('mascot-emotion')).toHaveTextContent('excited');
  });

  it('sets mascot message correctly', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const messageButton = screen.getByText('Set Message');
    
    await act(async () => {
      fireEvent.click(messageButton);
    });

    expect(screen.getByTestId('mascot-message')).toHaveTextContent('Test message');
  });

  it('handles sound controls', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const disableSoundButton = screen.getByText('Disable Sound');
    
    await act(async () => {
      fireEvent.click(disableSoundButton);
    });

    expect(screen.getByTestId('sound-enabled')).toHaveTextContent('false');
  });

  it('plays audio functions', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const magicalChordButton = screen.getByText('Play Magical Chord');
    const sparkleButton = screen.getByText('Play Sparkle');
    const levelUpButton = screen.getByText('Play Level Up');
    const buttonClickButton = screen.getByText('Play Button Click');
    const errorButton = screen.getByText('Play Error');

    await act(async () => {
      fireEvent.click(magicalChordButton);
    });
    expect(mockPlayMagicalChord).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(sparkleButton);
    });
    expect(mockPlaySparkleSound).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(levelUpButton);
    });
    expect(mockPlayLevelUpFanfare).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(buttonClickButton);
    });
    expect(mockPlayButtonClick).toHaveBeenCalled();

    await act(async () => {
      fireEvent.click(errorButton);
    });
    expect(mockPlayErrorSound).toHaveBeenCalled();
  });

  it('handles exercise XP gain with mascot response', async () => {
    render(
      <PremiumFeaturesProvider initialXP={50}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addXPButton = screen.getByText('Add XP');
    
    await act(async () => {
      fireEvent.click(addXPButton);
    });

    expect(screen.getByTestId('current-xp')).toHaveTextContent('60');
    expect(screen.getByTestId('mascot-emotion')).toHaveTextContent('happy');
    expect(screen.getByTestId('mascot-message')).toHaveTextContent('+10 XP ! Exercice réussi ! ✨');
  });

  it('handles achievement XP gain', async () => {
    render(
      <PremiumFeaturesProvider initialXP={50}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addAchievementButton = screen.getByText('Add Achievement XP');
    
    await act(async () => {
      fireEvent.click(addAchievementButton);
    });

    expect(screen.getByTestId('current-xp')).toHaveTextContent('100');
  });

  it('calculates maxXP correctly for different levels', () => {
    const levels = [1, 5, 10, 20];
    
    levels.forEach(level => {
      const { unmount } = render(
        <PremiumFeaturesProvider initialLevel={level}>
          <TestComponent />
        </PremiumFeaturesProvider>
      );
      
      const expectedMaxXP = 100 + (level * 20);
      expect(screen.getByTestId('max-xp')).toHaveTextContent(expectedMaxXP.toString());
      unmount();
    });
  });

  it('handles rapid XP additions', async () => {
    render(
      <PremiumFeaturesProvider initialXP={50}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addXPButton = screen.getByText('Add XP');
    
    // Rapid clicks
    await act(async () => {
      fireEvent.click(addXPButton);
      fireEvent.click(addXPButton);
      fireEvent.click(addXPButton);
    });

    expect(screen.getByTestId('current-xp')).toHaveTextContent('80');
  });

  it('handles edge cases for XP values', async () => {
    render(
      <PremiumFeaturesProvider initialXP={0} initialLevel={1}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addXPButton = screen.getByText('Add XP');
    
    await act(async () => {
      fireEvent.click(addXPButton);
    });

    expect(screen.getByTestId('current-xp')).toHaveTextContent('10');
  });

  it('handles very high XP values', async () => {
    render(
      <PremiumFeaturesProvider initialXP={1000} initialLevel={10}>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const addXPButton = screen.getByText('Add XP');
    
    await act(async () => {
      fireEvent.click(addXPButton);
    });

    expect(screen.getByTestId('current-xp')).toHaveTextContent('1010');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('usePremiumFeatures must be used within a PremiumFeaturesProvider');
    
    consoleSpy.mockRestore();
  });

  it('handles multiple particle triggers', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const successButton = screen.getByText('Trigger Success Particles');
    const magicButton = screen.getByText('Trigger Magic Particles');
    
    await act(async () => {
      fireEvent.click(successButton);
    });

    expect(screen.getByTestId('particle-type')).toHaveTextContent('success');

    await act(async () => {
      fireEvent.click(magicButton);
    });

    expect(screen.getByTestId('particle-type')).toHaveTextContent('magic');
  });

  it('handles mascot emotion changes', async () => {
    render(
      <PremiumFeaturesProvider>
        <TestComponent />
      </PremiumFeaturesProvider>
    );

    const excitedButton = screen.getByText('Set Excited');
    const happyButton = screen.getByText('Set Happy');
    
    await act(async () => {
      fireEvent.click(excitedButton);
    });

    expect(screen.getByTestId('mascot-emotion')).toHaveTextContent('excited');

    await act(async () => {
      fireEvent.click(happyButton);
    });

    expect(screen.getByTestId('mascot-emotion')).toHaveTextContent('happy');
  });
});


