/**
 * Unit tests for useMagicalSounds hooks
 * Tests real audio hook functionality and sound management logic
 */

import { renderHook, act } from '@testing-library/react';
import { useMagicalSounds } from '../useMagicalSounds';

// Mock AudioContext and related APIs
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  frequency: {
    setValueAtTime: jest.fn()
  },
  type: 'sine' as OscillatorType
};

const mockGainNode = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn()
  }
};

const mockAudioContext = {
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGainNode),
  destination: {},
  currentTime: 0
};

// Mock window.AudioContext
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn(() => mockAudioContext)
});

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;

describe('useMagicalSounds Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    console.warn = jest.fn();
    mockAudioContext.currentTime = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
    console.warn = originalConsoleWarn;
  });

  describe('Hook Initialization', () => {
    it('should initialize with sound enabled by default', () => {
      const { result } = renderHook(() => useMagicalSounds());

      expect(result.current.soundEnabled).toBe(true);
      expect(typeof result.current.playMagicalChord).toBe('function');
      expect(typeof result.current.playSparkleSound).toBe('function');
      expect(typeof result.current.playLevelUpFanfare).toBe('function');
      expect(typeof result.current.playButtonClick).toBe('function');
      expect(typeof result.current.playErrorSound).toBe('function');
      expect(typeof result.current.setSoundEnabled).toBe('function');
    });

    it('should provide all required sound functions', () => {
      const { result } = renderHook(() => useMagicalSounds());

      expect(typeof result.current.playMagicalChord).toBe('function');
      expect(typeof result.current.playSparkleSound).toBe('function');
      expect(typeof result.current.playLevelUpFanfare).toBe('function');
      expect(typeof result.current.playButtonClick).toBe('function');
      expect(typeof result.current.playErrorSound).toBe('function');
      expect(typeof result.current.setSoundEnabled).toBe('function');
    });

    it('should handle AudioContext creation failure gracefully', () => {
      // Mock AudioContext to throw
      const mockAudioContextFail = jest.fn(() => {
        throw new Error('Audio context not supported');
      });
      Object.defineProperty(window, 'AudioContext', {
        writable: true,
        value: mockAudioContextFail
      });

      const { result } = renderHook(() => useMagicalSounds());

      expect(result.current.soundEnabled).toBe(true);
      expect(console.warn).toHaveBeenCalledWith('Audio context not supported');
      
      // Restore
      Object.defineProperty(window, 'AudioContext', {
        writable: true,
        value: jest.fn(() => mockAudioContext)
      });
    });

    it('should support webkit audio context fallback', () => {
      // Remove AudioContext and add webkitAudioContext
      delete (window as any).AudioContext;
      (window as any).webkitAudioContext = jest.fn(() => mockAudioContext);

      const { result } = renderHook(() => useMagicalSounds());

      expect(result.current.soundEnabled).toBe(true);
      expect((window as any).webkitAudioContext).toHaveBeenCalled();
      
      // Restore
      (window as any).AudioContext = jest.fn(() => mockAudioContext);
    });
  });

  describe('Sound Enable/Disable Functionality', () => {
    it('should toggle sound enabled state', () => {
      const { result } = renderHook(() => useMagicalSounds());

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(result.current.soundEnabled).toBe(false);

      act(() => {
        result.current.setSoundEnabled(true);
      });

      expect(result.current.soundEnabled).toBe(true);
    });

    it('should handle sound state changes correctly', () => {
      const { result } = renderHook(() => useMagicalSounds());

      // Should start enabled
      expect(result.current.soundEnabled).toBe(true);

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(result.current.soundEnabled).toBe(false);
    });

    it('should maintain function references after state changes', () => {
      const { result } = renderHook(() => useMagicalSounds());

      const initialFunctions = {
        playButtonClick: result.current.playButtonClick,
        playMagicalChord: result.current.playMagicalChord,
        setSoundEnabled: result.current.setSoundEnabled
      };

      act(() => {
        result.current.setSoundEnabled(false);
        result.current.setSoundEnabled(true);
      });

      expect(result.current.playButtonClick).toBe(initialFunctions.playButtonClick);
      expect(result.current.playMagicalChord).toBe(initialFunctions.playMagicalChord);
      expect(result.current.setSoundEnabled).toBe(initialFunctions.setSoundEnabled);
    });
  });

  describe('Sound Function Behavior', () => {
    it('should not throw errors when calling sound functions', () => {
      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          result.current.playButtonClick();
          result.current.playMagicalChord();
          result.current.playSparkleSound();
          result.current.playLevelUpFanfare();
          result.current.playErrorSound();
        });
      }).not.toThrow();
    });

    it('should handle sound functions when disabled', () => {
      const { result } = renderHook(() => useMagicalSounds());

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(() => {
        act(() => {
          result.current.playButtonClick();
          result.current.playMagicalChord();
          result.current.playSparkleSound();
          result.current.playLevelUpFanfare();
          result.current.playErrorSound();
        });
      }).not.toThrow();
    });

    it('should handle rapid successive calls', () => {
      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          for (let i = 0; i < 10; i++) {
            result.current.playButtonClick();
            result.current.playSparkleSound();
          }
        });
      }).not.toThrow();
    });

    it('should work correctly after toggling sound on/off', () => {
      const { result } = renderHook(() => useMagicalSounds());

      act(() => {
        result.current.setSoundEnabled(false);
        result.current.playButtonClick(); // Should not throw
        result.current.setSoundEnabled(true);
        result.current.playButtonClick(); // Should not throw
      });

      expect(result.current.soundEnabled).toBe(true);
    });
  });

  describe('Timer-based Sound Effects', () => {
    it('should handle magical chord with timing', () => {
      const { result } = renderHook(() => useMagicalSounds());

      act(() => {
        result.current.playMagicalChord();
      });

      // Fast-forward timers
      act(() => {
        jest.runAllTimers();
      });

      // Should complete without errors
      expect(result.current.soundEnabled).toBe(true);
    });

    it('should handle sparkle sound with random timing', () => {
      const { result } = renderHook(() => useMagicalSounds());

      act(() => {
        result.current.playSparkleSound();
      });

      // Fast-forward timers
      act(() => {
        jest.runAllTimers();
      });

      // Should complete without errors
      expect(result.current.soundEnabled).toBe(true);
    });

    it('should handle level up fanfare sequence', () => {
      const { result } = renderHook(() => useMagicalSounds());

      act(() => {
        result.current.playLevelUpFanfare();
      });

      // Fast-forward timers
      act(() => {
        jest.runAllTimers();
      });

      // Should complete without errors
      expect(result.current.soundEnabled).toBe(true);
    });

    it('should handle error sound timing', () => {
      const { result } = renderHook(() => useMagicalSounds());

      act(() => {
        result.current.playErrorSound();
      });

      // Fast-forward timers
      act(() => {
        jest.runAllTimers();
      });

      // Should complete without errors
      expect(result.current.soundEnabled).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle oscillator creation errors gracefully', () => {
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new Error('Oscillator creation failed');
      });

      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          result.current.playButtonClick();
        });
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
    });

    it('should handle gain node creation failure', () => {
      mockAudioContext.createGain.mockImplementationOnce(() => {
        throw new Error('Gain node creation failed');
      });

      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          result.current.playButtonClick();
        });
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
    });

    it('should handle oscillator parameter setting errors', () => {
      mockOscillator.frequency.setValueAtTime.mockImplementationOnce(() => {
        throw new Error('Parameter setting failed');
      });

      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          result.current.playButtonClick();
        });
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith('Error playing sound:', expect.any(Error));
    });

    it('should not crash when audio context is null', () => {
      const mockNullContext = jest.fn(() => null);
      Object.defineProperty(window, 'AudioContext', {
        writable: true,
        value: mockNullContext
      });

      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          result.current.playButtonClick();
        });
      }).not.toThrow();

      expect(result.current.soundEnabled).toBe(true);
    });

    it('should handle missing AudioContext gracefully', () => {
      // Store original values
      const originalAudioContext = (window as any).AudioContext;
      const originalWebkitAudioContext = (window as any).webkitAudioContext;
      
      delete (window as any).AudioContext;
      delete (window as any).webkitAudioContext;

      const { result } = renderHook(() => useMagicalSounds());

      expect(result.current.soundEnabled).toBe(true);
      expect(console.warn).toHaveBeenCalledWith('Audio context not supported');
      
      // Restore original values
      (window as any).AudioContext = originalAudioContext;
      (window as any).webkitAudioContext = originalWebkitAudioContext;
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large numbers of sound calls', () => {
      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          for (let i = 0; i < 100; i++) {
            result.current.playButtonClick();
          }
        });
      }).not.toThrow();
    });

    it('should handle mixed sound types in sequence', () => {
      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          result.current.playButtonClick();
          result.current.playMagicalChord();
          result.current.playSparkleSound();
          result.current.playLevelUpFanfare();
          result.current.playErrorSound();
        });
      }).not.toThrow();
    });

    it('should handle concurrent timer-based sounds', () => {
      const { result } = renderHook(() => useMagicalSounds());

      expect(() => {
        act(() => {
          result.current.playMagicalChord();
          result.current.playSparkleSound();
          result.current.playLevelUpFanfare();
          
          // Fast-forward all timers
          jest.runAllTimers();
        });
      }).not.toThrow();
    });

    it('should maintain performance when disabled', () => {
      const { result } = renderHook(() => useMagicalSounds());

      act(() => {
        result.current.setSoundEnabled(false);
      });

      expect(() => {
        act(() => {
          for (let i = 0; i < 50; i++) {
            result.current.playMagicalChord();
            result.current.playSparkleSound();
          }
        });
      }).not.toThrow();
    });
  });

  describe('Function Consistency and Identity', () => {
    it('should maintain function identity across re-renders', () => {
      const { result, rerender } = renderHook(() => useMagicalSounds());

      const initialFunctions = {
        playButtonClick: result.current.playButtonClick,
        playMagicalChord: result.current.playMagicalChord,
        playSparkleSound: result.current.playSparkleSound,
        playLevelUpFanfare: result.current.playLevelUpFanfare,
        playErrorSound: result.current.playErrorSound,
        setSoundEnabled: result.current.setSoundEnabled
      };

      rerender();

      expect(result.current.playButtonClick).toBe(initialFunctions.playButtonClick);
      expect(result.current.playMagicalChord).toBe(initialFunctions.playMagicalChord);
      expect(result.current.playSparkleSound).toBe(initialFunctions.playSparkleSound);
      expect(result.current.playLevelUpFanfare).toBe(initialFunctions.playLevelUpFanfare);
      expect(result.current.playErrorSound).toBe(initialFunctions.playErrorSound);
      expect(result.current.setSoundEnabled).toBe(initialFunctions.setSoundEnabled);
    });

    it('should provide consistent behavior across calls', () => {
      const { result } = renderHook(() => useMagicalSounds());

      // Multiple calls should behave consistently
      for (let i = 0; i < 5; i++) {
        expect(() => {
          act(() => {
            result.current.playButtonClick();
          });
        }).not.toThrow();
      }
    });

    it('should handle state changes consistently', () => {
      const { result } = renderHook(() => useMagicalSounds());

      for (let i = 0; i < 3; i++) {
        act(() => {
          result.current.setSoundEnabled(false);
        });
        expect(result.current.soundEnabled).toBe(false);

        act(() => {
          result.current.setSoundEnabled(true);
        });
        expect(result.current.soundEnabled).toBe(true);
      }
    });
  });
});