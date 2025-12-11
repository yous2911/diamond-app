/**
 * useMascotVoice Hook
 * Provides Text-to-Speech functionality for the mascot using Web Speech Synthesis API
 * Supports multiple languages, voice customization, and emotion-based voice modulation
 */

import { useRef, useCallback, useEffect, useState } from 'react';

export interface MascotVoiceConfig {
  enabled: boolean;
  volume: number; // 0-1
  rate: number; // 0.1-10, default 1
  pitch: number; // 0-2, default 1
  lang: 'fr-FR' | 'en-US' | 'en-GB';
  voiceName?: string; // Specific voice to use
}

export interface VoiceOptions {
  emotion?: 'happy' | 'excited' | 'encouraging' | 'thinking' | 'celebrating' | 'sleepy';
  interrupt?: boolean; // Whether to interrupt current speech
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

const DEFAULT_CONFIG: MascotVoiceConfig = {
  enabled: true,
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0,
  lang: 'fr-FR',
};

// Voice modulation based on emotion
const EMOTION_MODULATION: Record<string, Partial<MascotVoiceConfig>> = {
  excited: { rate: 1.2, pitch: 1.15, volume: 0.9 },
  celebrating: { rate: 1.3, pitch: 1.2, volume: 0.95 },
  happy: { rate: 1.0, pitch: 1.05, volume: 0.85 },
  encouraging: { rate: 0.9, pitch: 1.0, volume: 0.8 },
  thinking: { rate: 0.85, pitch: 0.95, volume: 0.75 },
  sleepy: { rate: 0.7, pitch: 0.9, volume: 0.7 },
};

// Mascot-specific voice preferences
const MASCOT_VOICE_PREFERENCES: Record<string, Partial<MascotVoiceConfig>> = {
  dragon: { pitch: 0.9, rate: 0.95 }, // Deeper, slower
  fairy: { pitch: 1.2, rate: 1.1 }, // Higher, faster
  robot: { pitch: 0.85, rate: 0.9 }, // Robotic, slower
  cat: { pitch: 1.1, rate: 1.05 }, // Playful, medium
  owl: { pitch: 0.95, rate: 0.85 }, // Wise, slower
};

export const useMascotVoice = (
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl',
  locale: 'fr' | 'en' = 'fr'
) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [config, setConfig] = useState<MascotVoiceConfig>(() => {
    // Load from localStorage or use default
    const saved = localStorage.getItem('mascot_voice_config');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const callbacksRef = useRef<VoiceOptions>({});

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
      setIsSupported(true);

      // Load voices (may need to wait for voiceschanged event)
      const loadVoices = () => {
        const voices = synthRef.current?.getVoices() || [];
        setAvailableVoices(voices);
      };

      loadVoices();
      synthRef.current?.addEventListener('voiceschanged', loadVoices);

      return () => {
        synthRef.current?.removeEventListener('voiceschanged', loadVoices);
      };
    } else {
      setIsSupported(false);
    }
  }, []);

  // Update config language based on locale
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      lang: locale === 'fr' ? 'fr-FR' : 'en-US',
    }));
  }, [locale]);

  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('mascot_voice_config', JSON.stringify(config));
  }, [config]);

  // Get best voice for current language and mascot type
  const getBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!synthRef.current || availableVoices.length === 0) return null;

    const lang = config.lang;
    const mascotPrefs = MASCOT_VOICE_PREFERENCES[mascotType] || {};

    // Filter voices by language
    let candidates = availableVoices.filter(
      v => v.lang.startsWith(lang.split('-')[0])
    );

    if (candidates.length === 0) {
      // Fallback to any voice
      candidates = availableVoices;
    }

    // Prefer local voices over remote
    const localVoices = candidates.filter(v => v.localService);
    if (localVoices.length > 0) {
      candidates = localVoices;
    }

    // If specific voice name is set, try to use it
    if (config.voiceName) {
      const specificVoice = candidates.find(v => v.name === config.voiceName);
      if (specificVoice) return specificVoice;
    }

    // Prefer default voice
    const defaultVoice = candidates.find(v => v.default);
    if (defaultVoice) return defaultVoice;

    // Return first available
    return candidates[0] || null;
  }, [availableVoices, config.lang, config.voiceName, mascotType]);

  // Stop current speech
  const stop = useCallback(() => {
    if (synthRef.current && isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
      callbacksRef.current = {};
    }
  }, [isSpeaking]);

  // Speak text with optional emotion modulation
  const speak = useCallback(
    (text: string, options: VoiceOptions = {}) => {
      if (!isSupported || !config.enabled || !synthRef.current) {
        return;
      }

      // Stop current speech if interrupt is true or if already speaking
      if (options.interrupt !== false && isSpeaking) {
        stop();
      }

      // Wait a bit if we just stopped
      if (options.interrupt === false && isSpeaking) {
        return; // Don't queue if not interrupting
      }

      const voice = getBestVoice();
      if (!voice) {
        console.warn('No voice available for speech synthesis');
        return;
      }

      // Apply emotion modulation
      const emotionMod = options.emotion
        ? EMOTION_MODULATION[options.emotion] || {}
        : {};
      const mascotMod = MASCOT_VOICE_PREFERENCES[mascotType] || {};

      // Merge configs: base config < mascot prefs < emotion mod
      const finalConfig = {
        volume: emotionMod.volume ?? mascotMod.volume ?? config.volume,
        rate: emotionMod.rate ?? mascotMod.rate ?? config.rate,
        pitch: emotionMod.pitch ?? mascotMod.pitch ?? config.pitch,
      };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = config.lang;
      utterance.volume = finalConfig.volume;
      utterance.rate = finalConfig.rate;
      utterance.pitch = finalConfig.pitch;

      // Store callbacks
      callbacksRef.current = options;

      utterance.onstart = () => {
        setIsSpeaking(true);
        options.onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        callbacksRef.current = {};
        options.onEnd?.();
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        currentUtteranceRef.current = null;
        callbacksRef.current = {};
        const error = new Error(
          `Speech synthesis error: ${event.error}`
        );
        options.onError?.(error);
        console.error('Speech synthesis error:', event);
      };

      currentUtteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    },
    [
      isSupported,
      config,
      isSpeaking,
      getBestVoice,
      mascotType,
      stop,
    ]
  );

  // Update config
  const updateConfig = useCallback((updates: Partial<MascotVoiceConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  // Toggle enabled state
  const toggleEnabled = useCallback(() => {
    if (isSpeaking) stop();
    setConfig(prev => ({ ...prev, enabled: !prev.enabled }));
  }, [isSpeaking, stop]);

  return {
    isSupported,
    isSpeaking,
    availableVoices,
    config,
    speak,
    stop,
    updateConfig,
    toggleEnabled,
  };
};

export default useMascotVoice;


