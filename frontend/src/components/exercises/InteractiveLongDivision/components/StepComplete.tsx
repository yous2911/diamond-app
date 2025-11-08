import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { slideIn, celebration } from '../utils/animations';
import { SuccessParticles } from './SuccessParticles';

// =============================================================================
// STEP COMPLETE COMPONENT
// =============================================================================

interface StepCompleteProps {
  dividend: string;
  divisor: string;
  quotient: string;
  rest: number;
  onReset: () => void;
}

export const StepComplete = memo<StepCompleteProps>(({
  dividend,
  divisor,
  quotient,
  rest,
  onReset
}) => {
  const verification = useMemo(() => {
    const quotientNum = parseInt(quotient);
    const divisorNum = parseInt(divisor);
    return quotientNum * divisorNum + rest;
  }, [quotient, divisor, rest]);

  return (
    <motion.div 
      className="bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 p-8 rounded-2xl text-white border-2 border-green-300 relative overflow-hidden"
      {...slideIn}
      role="region"
      aria-label="Division terminée"
    >
      <SuccessParticles trigger={true} />

      <motion.h4 
        className="text-3xl font-bold mb-6 text-center"
        {...celebration}
      >
        🎉 Division Réussie ! 🎉
      </motion.h4>

      <div className="text-center space-y-4">
        <motion.p 
          className="text-2xl font-bold"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-yellow-200">{dividend}</span> ÷ <span className="text-yellow-200">{divisor}</span> = <span className="text-yellow-100 text-3xl">{quotient}</span>
        </motion.p>

        {rest > 0 && (
          <motion.p 
            className="text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Reste : <span className="font-bold text-yellow-200 text-2xl">{rest}</span>
          </motion.p>
        )}

        {/* Verification section */}
        <motion.div 
          className="bg-white/20 backdrop-blur-sm p-6 rounded-xl mt-6 border border-white/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <p className="text-sm mb-3 text-white/90">🔍 Vérification :</p>
          <p className="font-mono text-lg font-bold">
            {quotient} × {divisor}{rest > 0 ? ` + ${rest}` : ''} = {verification}
          </p>
          <p className="text-sm mt-2 text-white/80">✅ C'est parfait !</p>
        </motion.div>

        <div className="pt-6">
          <motion.button
            onClick={onReset}
            className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 shadow-lg text-xl"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(255, 255, 255, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            aria-label="Nouvelle division"
          >
            🔄 Nouvelle Division !
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

StepComplete.displayName = 'StepComplete';

