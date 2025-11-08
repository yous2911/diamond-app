import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { slideIn } from '../utils/animations';

// =============================================================================
// STEP ESTIMATE COMPONENT
// =============================================================================

interface StepEstimateProps {
  divisor: number;
  workingNumber: number;
  userEstimate: string;
  onEstimateChange: (value: string) => void;
  onValidate: () => void;
  isAnimating: boolean;
}

export const StepEstimate = memo<StepEstimateProps>(({
  divisor,
  workingNumber,
  userEstimate,
  onEstimateChange,
  onValidate,
  isAnimating
}) => {
  const quickReference = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => {
      const product = (i + 1) * divisor;
      const isValid = product <= workingNumber;
      const isOptimal = isValid && (i + 2) * divisor > workingNumber;
      return { num: i + 1, product, isValid, isOptimal };
    });
  }, [divisor, workingNumber]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && userEstimate && !isAnimating) {
      onValidate();
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl border-2 border-blue-200"
      {...slideIn}
      role="region"
      aria-label="Étape estimation"
    >
      <h4 className="text-2xl font-bold mb-6 text-blue-800 text-center">
        🎯 Estimation
      </h4>
      <p className="mb-6 text-gray-700 text-center leading-relaxed">
        Combien de fois <span className="font-bold text-red-600 text-xl">{divisor}</span> rentre-t-il dans <span className="font-bold text-yellow-600 text-xl">{workingNumber}</span> ?
      </p>

      {/* Quick reference table */}
      <motion.div 
        className="mb-6 bg-white/70 p-4 rounded-xl border border-blue-200"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ delay: 0.3 }}
        role="table"
        aria-label="Table d'aide pour l'estimation"
      >
        <p className="text-sm font-bold mb-3 text-blue-700 text-center">💡 Table d'aide :</p>
        <div className="grid grid-cols-2 gap-2 text-sm font-mono" role="rowgroup">
          {quickReference.map((item) => (
            <motion.div 
              key={item.num}
              className={`flex justify-between p-2 rounded ${
                item.isOptimal ? 'bg-green-200 border-2 border-green-400 font-bold' :
                item.isValid ? 'bg-blue-100 text-blue-700' : 
                'bg-gray-100 text-gray-400'
              }`}
              whileHover={{ scale: item.isValid ? 1.05 : 1 }}
              role="row"
              aria-label={`${item.num} fois ${divisor} égale ${item.product}${item.isOptimal ? ' - optimal' : ''}`}
            >
              <span>{item.num} × {divisor}</span>
              <span>= {item.product}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="flex space-x-3">
        <input
          type="number"
          value={userEstimate}
          onChange={(e) => onEstimateChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 p-4 border-3 border-blue-300 rounded-xl text-2xl font-bold text-center focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all bg-white/80"
          placeholder="?"
          min="0"
          max="9"
          aria-label="Estimation - Combien de fois le diviseur rentre dans le nombre de travail"
          aria-required="true"
        />
        <motion.button
          onClick={onValidate}
          disabled={!userEstimate || isAnimating}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          whileHover={!isAnimating && userEstimate ? { scale: 1.05, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" } : {}}
          whileTap={!isAnimating && userEstimate ? { scale: 0.95 } : {}}
          aria-label="Vérifier l'estimation"
        >
          ✨ Vérifier
        </motion.button>
      </div>
    </motion.div>
  );
});

StepEstimate.displayName = 'StepEstimate';

