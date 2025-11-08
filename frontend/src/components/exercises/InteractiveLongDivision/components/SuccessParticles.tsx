import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// SUCCESS PARTICLES COMPONENT
// =============================================================================

interface SuccessParticlesProps {
  trigger: boolean;
  color?: string;
  count?: number;
}

export const SuccessParticles = memo<SuccessParticlesProps>(({ 
  trigger, 
  color = "#22C55E",
  count = 12 
}) => {
  return (
    <AnimatePresence>
      {trigger && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {[...Array(count)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
              initial={{
                x: "50%",
                y: "50%",
                scale: 0,
                opacity: 1
              }}
              animate={{
                x: `${50 + (Math.random() - 0.5) * 100}%`,
                y: `${50 + (Math.random() - 0.5) * 100}%`,
                scale: [0, 1, 0],
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
});

SuccessParticles.displayName = 'SuccessParticles';

