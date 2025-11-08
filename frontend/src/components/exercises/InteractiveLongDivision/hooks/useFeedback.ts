import { useState, useCallback, useRef } from 'react';
import { playSound, speak } from '../utils/audioUtils';
import type { FeedbackType, Feedback } from '../types';

// =============================================================================
// CUSTOM HOOK FOR FEEDBACK MANAGEMENT
// =============================================================================

export const useFeedback = () => {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerFeedback = useCallback((
    type: FeedbackType, 
    message: string, 
    duration: number = 3000,
    speakText?: string
  ) => {
    // Clear previous timeout
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }

    const newFeedback: Feedback = {
      type,
      message,
      id: Date.now(),
    };

    setFeedback(newFeedback);
    playSound(type);

    if (speakText) {
      speak(speakText);
    }

    // Auto-hide feedback
    feedbackTimeoutRef.current = setTimeout(() => {
      setFeedback(null);
    }, duration);

    return newFeedback;
  }, []);

  const clearFeedback = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setFeedback(null);
  }, []);

  return {
    feedback,
    triggerFeedback,
    clearFeedback,
  };
};

