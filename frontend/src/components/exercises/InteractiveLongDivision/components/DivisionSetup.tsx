import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { slideIn } from '../utils/animations';

// =============================================================================
// DIVISION SETUP COMPONENT
// =============================================================================

interface DivisionSetupProps {
  dividend: string;
  divisor: string;
  onDividendChange: (value: string) => void;
  onDivisorChange: (value: string) => void;
  onStart: () => void;
  disabled?: boolean;
}

export const DivisionSetup = memo<DivisionSetupProps>(({
  dividend,
  divisor,
  onDividendChange,
  onDivisorChange,
  onStart,
  disabled = false
}) => {
  const canStart = dividend && divisor && !disabled;

  return (
    <motion.div 
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-6 border border-purple-100"
      {...slideIn}
      role="region"
      aria-label="Configuration de la division"
    >
      <h2 className="text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
        🎯 Choisis ta Division
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-md mx-auto">
        <motion.div 
          className="space-y-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <label 
            htmlFor="dividend-input"
            className="block text-xl font-bold text-gray-700"
          >
            📊 Dividende
          </label>
          <input
            id="dividend-input"
            type="number"
            value={dividend}
            onChange={(e) => onDividendChange(e.target.value)}
            className="w-full p-4 border-3 border-blue-300 rounded-2xl text-2xl font-bold text-center focus:border-blue-500 focus:ring-4 focus:ring-blue-200 focus:outline-none transition-all bg-gradient-to-br from-blue-50 to-indigo-50"
            placeholder="847"
            min="10"
            aria-label="Dividende - Le nombre à diviser"
          />
          <p className="text-sm text-blue-600 text-center font-medium">Le nombre à diviser</p>
        </motion.div>

        <motion.div 
          className="space-y-3"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <label 
            htmlFor="divisor-input"
            className="block text-xl font-bold text-gray-700"
          >
            🔢 Diviseur
          </label>
          <input
            id="divisor-input"
            type="number"
            value={divisor}
            onChange={(e) => onDivisorChange(e.target.value)}
            className="w-full p-4 border-3 border-red-300 rounded-2xl text-2xl font-bold text-center focus:border-red-500 focus:ring-4 focus:ring-red-200 focus:outline-none transition-all bg-gradient-to-br from-red-50 to-pink-50"
            placeholder="23"
            min="2"
            aria-label="Diviseur - On divise par ce nombre"
          />
          <p className="text-sm text-red-600 text-center font-medium">On divise par ce nombre</p>
        </motion.div>
      </div>

      <div className="text-center mt-10">
        <motion.button
          onClick={onStart}
          disabled={!canStart}
          className="px-10 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-purple-300 disabled:opacity-50 disabled:cursor-not-allowed text-xl"
          whileHover={canStart ? { scale: 1.05, boxShadow: "0 20px 40px rgba(139, 69, 234, 0.3)" } : {}}
          whileTap={canStart ? { scale: 0.95 } : {}}
          transition={{ type: "spring", stiffness: 400 }}
          aria-label="Commencer la division"
        >
          🚀 Commencer la Division !
        </motion.button>
      </div>
    </motion.div>
  );
});

DivisionSetup.displayName = 'DivisionSetup';

