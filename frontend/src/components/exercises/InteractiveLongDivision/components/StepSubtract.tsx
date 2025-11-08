import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { slideIn } from '../utils/animations';

// =============================================================================
// STEP SUBTRACT COMPONENT
// =============================================================================

interface StepSubtractProps {
  workingNumber: number;
  correctProduct: number;
  userSubtraction: string;
  onSubtractionChange: (value: string) => void;
  onValidate: () => void;
  isAnimating: boolean;
}

export const StepSubtract = memo<StepSubtractProps>(({
  workingNumber,
  correctProduct,
  userSubtraction,
  onSubtractionChange,
  onValidate,
  isAnimating
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userSubtraction && !isAnimating) {
      onValidate();
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-green-50 to-emerald-100 p-8 rounded-2xl border-2 border-green-200"
      {...slideIn}
      role="region"
      aria-label="Étape soustraction"
    >
      <h4 className="text-2xl font-bold mb-6 text-green-800 text-center">
        ➖ Soustraction
      </h4>
      <p className="mb-6 text-gray-700 text-center leading-relaxed">
        Calcule : <span className="font-bold text-yellow-600 text-xl">{workingNumber}</span> - <span className="font-bold text-purple-600 text-xl">{correctProduct}</span> = ?
      </p>

      {/* Visual subtraction helper */}
      <motion.div 
        className="mb-6 bg-white/70 p-6 rounded-xl border border-green-200 font-mono text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        role="group"
        aria-label="Aide visuelle pour la soustraction"
      >
        <div className="text-2xl font-bold text-yellow-700">{workingNumber}</div>
        <div className="text-2xl font-bold text-purple-700">- {correctProduct}</div>
        <div className="border-t-4 border-green-400 pt-2 text-2xl font-bold text-green-700">
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
            aria-hidden="true"
          >
            ___
          </motion.span>
        </div>
      </motion.div>

      <div className="flex space-x-3">
        <input
          type="number"
          value={userSubtraction}
          onChange={(e) => onSubtractionChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-4 border-3 border-green-300 rounded-xl text-2xl font-bold text-center focus:border-green-500 focus:ring-4 focus:ring-green-200 focus:outline-none transition-all bg-white/80"
          placeholder="?"
          min="0"
          aria-label={`Résultat de ${workingNumber} moins ${correctProduct}`}
          aria-required="true"
        />
        <motion.button
          onClick={onValidate}
          disabled={userSubtraction === '' || isAnimating}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          whileHover={!isAnimating && userSubtraction ? { scale: 1.05, boxShadow: "0 10px 25px rgba(34, 197, 94, 0.3)" } : {}}
          whileTap={!isAnimating && userSubtraction ? { scale: 0.95 } : {}}
          aria-label="Vérifier la soustraction"
        >
          ✨ Vérifier
        </motion.button>
      </div>
    </motion.div>
  );
});

StepSubtract.displayName = 'StepSubtract';

