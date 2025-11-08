import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { slideIn } from '../utils/animations';

// =============================================================================
// STEP BRING DOWN COMPONENT
// =============================================================================

interface StepBringDownProps {
  correctSubtraction: number;
  nextDigit: string;
  onBringDown: () => void;
}

export const StepBringDown = memo<StepBringDownProps>(({
  correctSubtraction,
  nextDigit,
  onBringDown
}) => {
  return (
    <motion.div 
      className="bg-gradient-to-br from-orange-50 to-yellow-100 p-8 rounded-2xl border-2 border-orange-200"
      {...slideIn}
      role="region"
      aria-label="Étape descendre le chiffre"
    >
      <h4 className="text-2xl font-bold mb-6 text-orange-800 text-center">
        📥 Descendre le Chiffre
      </h4>
      <p className="mb-6 text-gray-700 text-center leading-relaxed">
        Descends le chiffre suivant et continue !
      </p>

      {/* Visual representation of bringing down */}
      <motion.div 
        className="mb-6 bg-white/70 p-6 rounded-xl border border-orange-200 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm text-gray-600 mb-3">Reste actuel :</p>
        <motion.p 
          className="text-3xl font-bold text-green-600 mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {correctSubtraction}
        </motion.p>
        <p className="text-sm text-gray-600 mb-3">Chiffre à descendre :</p>
        <motion.p 
          className="text-3xl font-bold text-orange-600 mb-4"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {nextDigit}
        </motion.p>
        <p className="text-sm text-gray-600 mb-3">Nouveau nombre :</p>
        <motion.p 
          className="text-4xl font-bold text-blue-600"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
        >
          {correctSubtraction}{nextDigit}
        </motion.p>
      </motion.div>

      <motion.button
        onClick={onBringDown}
        className="w-full py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-yellow-700 shadow-lg text-xl"
        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(251, 146, 60, 0.3)" }}
        whileTap={{ scale: 0.98 }}
        aria-label={`Descendre le chiffre ${nextDigit}`}
      >
        📥 Descendre le {nextDigit}
      </motion.button>
    </motion.div>
  );
});

StepBringDown.displayName = 'StepBringDown';

