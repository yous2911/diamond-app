import { useCallback, useRef } from 'react';

// =============================================================================
// 🎵 VOICE SYSTEM - ELEVENLABS MP3 INTEGRATION
// =============================================================================

interface VoiceConfig {
  volume: number;
  playbackRate: number;
  preload: boolean;
}

const VOICE_FILES = {
  // Correct Answer Voices
  correct_answer_1: '/voices/correct-answer-1.mp3',
  correct_answer_2: '/voices/correct-answer-2.mp3',
  correct_answer_3: '/voices/correct-answer-3.mp3',
  
  // Perfect Score Voices
  perfect_score_1: '/voices/perfect-score-1.mp3',
  perfect_score_2: '/voices/perfect-score-2.mp3',
  perfect_score_3: '/voices/perfect-score-3.mp3',
  
  // Level Up Voices
  level_up_1: '/voices/level-up-1.mp3',
  level_up_2: '/voices/level-up-2.mp3',
  level_up_3: '/voices/level-up-3.mp3',
  
  // Streak Bonus Voices
  streak_bonus_1: '/voices/streak-bonus-1.mp3',
  streak_bonus_2: '/voices/streak-bonus-2.mp3',
  streak_bonus_3: '/voices/streak-bonus-3.mp3',
  
  // Mascot Mood Voices
  mascot_happy: '/voices/mascot-happy.mp3',
  mascot_excited: '/voices/mascot-excited.mp3',
  mascot_proud: '/voices/mascot-proud.mp3',
  mascot_encouraging: '/voices/mascot-encouraging.mp3',
  mascot_curious: '/voices/mascot-curious.mp3',
  
  // Exercise Instructions
  exercise_start: '/voices/exercise-start.mp3',
  exercise_complete: '/voices/exercise-complete.mp3',
  exercise_hint: '/voices/exercise-hint.mp3',
  
  // Motivational
  keep_going: '/voices/keep-going.mp3',
  great_job: '/voices/great-job.mp3',
  almost_there: '/voices/almost-there.mp3',
  you_got_this: '/voices/you-got-this.mp3'
};

export const useVoiceSystem = () => {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // Preload voice files for instant playback
  const preloadVoices = useCallback(() => {
    Object.entries(VOICE_FILES).forEach(([key, url]) => {
      if (!audioCache.current.has(key)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = 0.7;
        audioCache.current.set(key, audio);
      }
    });
  }, []);

  // Play voice with fallback
  const playVoice = useCallback((voiceKey: keyof typeof VOICE_FILES, config?: Partial<VoiceConfig>) => {
    try {
      // Stop current audio
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current.currentTime = 0;
      }

      // Get or create audio element
      let audio = audioCache.current.get(voiceKey);
      if (!audio) {
        audio = new Audio(VOICE_FILES[voiceKey]);
        audioCache.current.set(voiceKey, audio);
      }

      // Configure audio
      audio.volume = config?.volume ?? 0.7;
      audio.playbackRate = config?.playbackRate ?? 1.0;
      currentAudio.current = audio;

      // Play with error handling
      audio.play().catch((error) => {
        console.warn(`Voice playback failed for ${voiceKey}:`, error);
        // Fallback to synthetic sound if available
        playFallbackSound(voiceKey);
      });

    } catch (error) {
      console.warn('Voice system error:', error);
      playFallbackSound(voiceKey);
    }
  }, []);

  // Fallback synthetic sounds
  const playFallbackSound = useCallback((voiceKey: string) => {
    // Create simple beep sounds as fallback
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different voice types
    let frequency = 800;
    let duration = 0.3;
    
    if (voiceKey.includes('perfect')) {
      frequency = 1000;
      duration = 0.5;
    } else if (voiceKey.includes('level_up')) {
      frequency = 600;
      duration = 0.8;
    } else if (voiceKey.includes('streak')) {
      frequency = 700;
      duration = 0.4;
    }
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, []);

  // Specific voice functions
  const playCorrectAnswer = useCallback(() => {
    const voices = ['correct_answer_1', 'correct_answer_2', 'correct_answer_3'];
    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
    playVoice(randomVoice as keyof typeof VOICE_FILES);
  }, [playVoice]);

  const playPerfectScore = useCallback(() => {
    const voices = ['perfect_score_1', 'perfect_score_2', 'perfect_score_3'];
    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
    playVoice(randomVoice as keyof typeof VOICE_FILES);
  }, [playVoice]);

  const playLevelUp = useCallback(() => {
    const voices = ['level_up_1', 'level_up_2', 'level_up_3'];
    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
    playVoice(randomVoice as keyof typeof VOICE_FILES);
  }, [playVoice]);

  const playStreakBonus = useCallback(() => {
    const voices = ['streak_bonus_1', 'streak_bonus_2', 'streak_bonus_3'];
    const randomVoice = voices[Math.floor(Math.random() * voices.length)];
    playVoice(randomVoice as keyof typeof VOICE_FILES);
  }, [playVoice]);

  const playMascotMood = useCallback((mood: string) => {
    const moodVoices: Record<string, keyof typeof VOICE_FILES> = {
      'happy': 'mascot_happy',
      'excited': 'mascot_excited',
      'proud': 'mascot_proud',
      'encouraging': 'mascot_encouraging',
      'curious': 'mascot_curious'
    };
    
    const voiceKey = moodVoices[mood] || 'mascot_happy';
    playVoice(voiceKey);
  }, [playVoice]);

  const playExerciseInstruction = useCallback((type: 'start' | 'complete' | 'hint') => {
    const instructionVoices: Record<string, keyof typeof VOICE_FILES> = {
      'start': 'exercise_start',
      'complete': 'exercise_complete',
      'hint': 'exercise_hint'
    };
    
    const voiceKey = instructionVoices[type];
    if (voiceKey) {
      playVoice(voiceKey);
    }
  }, [playVoice]);

  const playMotivational = useCallback(() => {
    const motivationalVoices = ['keep_going', 'great_job', 'almost_there', 'you_got_this'];
    const randomVoice = motivationalVoices[Math.floor(Math.random() * motivationalVoices.length)];
    playVoice(randomVoice as keyof typeof VOICE_FILES);
  }, [playVoice]);

  return {
    preloadVoices,
    playVoice,
    playCorrectAnswer,
    playPerfectScore,
    playLevelUp,
    playStreakBonus,
    playMascotMood,
    playExerciseInstruction,
    playMotivational
  };
};

