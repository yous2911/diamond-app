import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { smoothAppear } from '../utils/animations';
import { SuccessParticles } from './SuccessParticles';
import type { FeedbackType } from '../types';

// =============================================================================
// FEEDBACK TOAST COMPONENT
// =============================================================================

interface FeedbackToastProps {
  feedback: { type: FeedbackType; message: string; id: number } | null;
}

export const FeedbackToast = memo<FeedbackToastProps>(({ feedback }) => {
  if (!feedback) return null;

  const getFeedbackStyles = () => {
    switch (feedback.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-300';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-pink-500 border-red-300';
      case 'hint':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-300';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-300';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 max-w-sm"
        {...smoothAppear}
        role="alert"
        aria-live="polite"
      >
        <div className={`px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-center border-2 ${getFeedbackStyles()}`}>
          {feedback.message}
          <SuccessParticles trigger={feedback.type === 'success'} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

FeedbackToast.displayName = 'FeedbackToast';

