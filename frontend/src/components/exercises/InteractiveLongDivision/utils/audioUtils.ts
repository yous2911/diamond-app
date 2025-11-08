// =============================================================================
// AUDIO UTILITIES FOR INTERACTIVE LONG DIVISION
// =============================================================================

// Singleton AudioContext to prevent memory leaks
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Cleanup function for the singleton context
export const cleanupAudioContext = (): void => {
  if (audioContext && audioContext.state !== 'closed') {
    audioContext.close();
    audioContext = null;
  }
};

export const playSound = (type: 'success' | 'error' | 'hint' | 'info'): void => {
  console.log(`🔊 ${type} sound`);

  try {
    const audioCtx = getAudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const frequencies = {
      success: [523.25, 659.25, 783.99], // C5, E5, G5
      error: [220, 196], // A3, G3
      hint: [440, 523.25], // A4, C5
      info: [440], // A4
    };

    const frequenciesList = frequencies[type] || [440];

    frequenciesList.forEach((freq, index) => {
      setTimeout(() => {
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      }, index * 100);
    });

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.log('Audio not supported');
  }
};

export const speak = (text: string, lang: string = 'fr-FR'): void => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  }
};

