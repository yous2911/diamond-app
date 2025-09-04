import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingElementProps {
  isVisible?: boolean;
  className?: string;
}

// Sparkle elements for magical effects
export const SparkleElements: React.FC<FloatingElementProps> = ({ isVisible = true, className = '' }) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Magic elements for spell effects
export const MagicElements: React.FC<FloatingElementProps> = ({ isVisible = true, className = '' }) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-purple-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 0],
                opacity: [0, 0.8, 0],
                y: [0, -20, 0],
                x: [0, Math.random() * 40 - 20, 0]
              }}
              transition={{
                duration: 2,
                delay: i * 0.2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Celebration elements for achievements
export const CelebrationElements: React.FC<FloatingElementProps> = ({ isVisible = true, className = '' }) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [0, -30, -60],
                x: [0, Math.random() * 60 - 30, Math.random() * 100 - 50]
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
