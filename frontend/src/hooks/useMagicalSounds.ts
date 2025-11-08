import { useCallback, useRef, useState, useEffect } from 'react';

// =============================================================================
// 🎵 MAGICAL SOUND SYSTEM - PERFECT AUDIO FEEDBACK
// =============================================================================

const SOUND_EFFECTS = {
  correct_answer: {
    url: '/sounds/correct.mp3',
    config: { volume: 0.7, playbackRate: 1.0, loop: false }
  },
  perfect_score: {
    url: '/sounds/perfect.mp3',
    config: { volume: 0.8, playbackRate: 1.0, loop: false }
  },
  level_up: {
    url: '/sounds/levelup.mp3',
    config: { volume: 0.9, playbackRate: 1.0, loop: false }
  },
  streak_bonus: {
    url: '/sounds/streak.mp3',
    config: { volume: 0.8, playbackRate: 1.0, loop: false }
  },
  celebration: {
    url: '/sounds/celebration.mp3',
    config: { volume: 0.6, playbackRate: 1.0, loop: false }
  },
  mascot_happy: {
    url: '/sounds/mascot-happy.mp3',
    config: { volume: 0.5, playbackRate: 1.0, loop: false }
  },
  mascot_excited: {
    url: '/sounds/mascot-excited.mp3',
    config: { volume: 0.6, playbackRate: 1.0, loop: false }
  },
  particle_magic: {
    url: '/sounds/particle-magic.mp3',
    config: { volume: 0.4, playbackRate: 1.0, loop: false }
  },
  particle_crystal: {
    url: '/sounds/particle-crystal.mp3',
    config: { volume: 0.5, playbackRate: 1.0, loop: false }
  }
};

export const useMagicalSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Create synthetic sounds using Web Audio API (fallback when files don't exist)
  const createSyntheticSound = useCallback((type: string, frequency: number, duration: number = 0.5) => {
    const audioContext = initAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [initAudioContext]);

  // Play sound effect
  const playSound = useCallback((soundType: keyof typeof SOUND_EFFECTS) => {
    try {
      const soundConfig = SOUND_EFFECTS[soundType];
      
      // Try to play actual sound file first
      const audio = new Audio(soundConfig.url);
      audio.volume = soundConfig.config.volume;
      audio.playbackRate = soundConfig.config.playbackRate;
      
      audio.play().catch(() => {
        // Fallback to synthetic sounds
        switch (soundType) {
          case 'correct_answer':
            createSyntheticSound('correct', 800, 0.3);
            break;
          case 'perfect_score':
            createSyntheticSound('perfect', 1000, 0.5);
            setTimeout(() => createSyntheticSound('perfect', 1200, 0.3), 200);
            break;
          case 'level_up':
            createSyntheticSound('levelup', 600, 0.8);
            setTimeout(() => createSyntheticSound('levelup', 800, 0.6), 300);
            setTimeout(() => createSyntheticSound('levelup', 1000, 0.4), 600);
            break;
          case 'streak_bonus':
            createSyntheticSound('streak', 700, 0.4);
            setTimeout(() => createSyntheticSound('streak', 900, 0.3), 150);
            break;
          case 'celebration':
            createSyntheticSound('celebration', 500, 1.0);
            break;
          case 'mascot_happy':
            createSyntheticSound('mascot', 400, 0.3);
            break;
          case 'mascot_excited':
            createSyntheticSound('mascot', 600, 0.4);
            setTimeout(() => createSyntheticSound('mascot', 800, 0.3), 200);
            break;
          case 'particle_magic':
            createSyntheticSound('magic', 300, 0.2);
            break;
          case 'particle_crystal':
            createSyntheticSound('crystal', 1200, 0.3);
            break;
        }
      });
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, [createSyntheticSound]);

  // Specific sound functions for easy use
  const playCorrectAnswer = useCallback(() => playSound('correct_answer'), [playSound]);
  const playPerfectScore = useCallback(() => playSound('perfect_score'), [playSound]);
  const playLevelUp = useCallback(() => playSound('level_up'), [playSound]);
  const playStreakBonus = useCallback(() => playSound('streak_bonus'), [playSound]);
  const playCelebration = useCallback(() => playSound('celebration'), [playSound]);
  const playMascotHappy = useCallback(() => playSound('mascot_happy'), [playSound]);
  const playMascotExcited = useCallback(() => playSound('mascot_excited'), [playSound]);
  const playParticleMagic = useCallback(() => playSound('particle_magic'), [playSound]);
  const playParticleCrystal = useCallback(() => playSound('particle_crystal'), [playSound]);

  // Additional methods for compatibility
  const playLevelUpFanfare = useCallback(() => playSound('level_up'), [playSound]);
  const playSparkleSound = useCallback(() => playSound('particle_crystal'), [playSound]);
  const playMagicalChord = useCallback(() => playSound('celebration'), [playSound]);
  const playButtonClick = useCallback(() => playSound('correct_answer'), [playSound]);
  const playErrorSound = useCallback(() => {
    // Create a lower frequency error sound
    createSyntheticSound('error', 200, 0.5);
  }, [createSyntheticSound]);

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Cleanup AudioContext on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    playSound,
    playCorrectAnswer,
    playPerfectScore,
    playLevelUp,
    playStreakBonus,
    playCelebration,
    playMascotHappy,
    playMascotExcited,
    playParticleMagic,
    playParticleCrystal,
    // Additional methods for compatibility
    playLevelUpFanfare,
    playSparkleSound,
    playMagicalChord,
    playButtonClick,
    playErrorSound,
    soundEnabled,
    setSoundEnabled
  };
};