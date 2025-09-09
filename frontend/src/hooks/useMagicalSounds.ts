import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// 🔊 SYSTÈME AUDIO PREMIUM DIAMANT
// =============================================================================
export const useMagicalSounds = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (soundEnabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported');
      }
    }
  }, [soundEnabled]);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [soundEnabled]);

  const playMagicalChord = useCallback(() => {
    setTimeout(() => playTone(523.25, 0.3), 0);    // C5
    setTimeout(() => playTone(659.25, 0.3), 100);  // E5
    setTimeout(() => playTone(783.99, 0.3), 200);  // G5
    setTimeout(() => playTone(1046.50, 0.5), 300); // C6
  }, [playTone]);

  const playSparkleSound = useCallback(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(800 + Math.random() * 600, 0.1, 'sine');
      }, i * 80);
    }
  }, [playTone]);

  const playLevelUpFanfare = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((note, index) => {
      setTimeout(() => playTone(note, 0.4), index * 150);
    });
  }, [playTone]);

  const playButtonClick = useCallback(() => {
    playTone(600, 0.1, 'sine'); // Softer sine wave instead of harsh square wave
  }, [playTone]);

  const playErrorSound = useCallback(() => {
    playTone(200, 0.3, 'square');
    setTimeout(() => playTone(150, 0.3, 'square'), 200);
  }, [playTone]);

  return {
    playMagicalChord,
    playSparkleSound,
    playLevelUpFanfare,
    playButtonClick,
    playErrorSound,
    soundEnabled,
    setSoundEnabled
  };
};
