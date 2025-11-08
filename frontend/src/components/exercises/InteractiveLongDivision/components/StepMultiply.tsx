import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { slideIn } from '../utils/animations';

// =============================================================================
// STEP MULTIPLY COMPONENT
// =============================================================================

interface StepMultiplyProps {
  divisor: number;
  userEstimate: string;
  userMultiplication: string;
  onMultiplicationChange: (value: string) => void;
  onValidate: () => void;
  onShowDecomposition: () => void;
  isAnimating: boolean;
}

export const StepMultiply = memo<StepMultiplyProps>(({
  divisor,
  userEstimate,
  userMultiplication,
  onMultiplicationChange,
  onValidate,
  onShowDecomposition,
  isAnimating
}) => {
  const estimateNum = parseInt(userEstimate) || 0;
  const showDecompositionHint = estimateNum >= 6;

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userMultiplication && !isAnimating) {
      onValidate();
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-purple-50 to-pink-100 p-8 rounded-2xl border-2 border-purple-200"
      {...slideIn}
      role="region"
      aria-label="Étape multiplication"
    >
      <h4 className="text-2xl font-bold mb-6 text-purple-800 text-center">
        🧮 Multiplication
      </h4>
      <p className="mb-6 text-gray-700 text-center leading-relaxed">
        Calcule : <span className="font-bold text-red-600 text-xl">{divisor}</span> × <span className="font-bold text-blue-600 text-xl">{userEstimate}</span> = ?
      </p>

      {/* Decomposition preview for complex multiplications */}
      {showDecompositionHint && (
        <motion.div 
          className="mb-6 bg-white/70 p-4 rounded-xl border border-purple-200"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-purple-600 mb-2 font-bold text-center">💡 Décomposition possible :</p>
          <p className="text-sm text-center font-mono">{divisor} × {userEstimate} = {divisor} × ... = ?</p>
          <button
            onClick={onShowDecomposition}
            className="text-xs text-center text-purple-500 mt-2 hover:text-purple-700 underline"
            aria-label="Voir la décomposition de la multiplication"
          >
            Clique sur "Décomposer" si tu as besoin d'aide !
          </button>
        </motion.div>
      )}

      <div className="flex space-x-3">
        <input
          type="number"
          value={userMultiplication}
          onChange={(e) => onMultiplicationChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-4 border-3 border-purple-300 rounded-xl text-2xl font-bold text-center focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none transition-all bg-white/80"
          placeholder="?"
          aria-label={`Résultat de ${divisor} fois ${userEstimate}`}
          aria-required="true"
        />
        <motion.button
          onClick={onValidate}
          disabled={!userMultiplication || isAnimating}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          whileHover={!isAnimating && userMultiplication ? { scale: 1.05, boxShadow: "0 10px 25px rgba(147, 51, 234, 0.3)" } : {}}
          whileTap={!isAnimating && userMultiplication ? { scale: 0.95 } : {}}
          aria-label="Vérifier la multiplication"
        >
          ✨ Vérifier
        </motion.button>
      </div>
    </motion.div>
  );
});

StepMultiply.displayName = 'StepMultiply';

