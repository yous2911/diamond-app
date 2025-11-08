import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { smoothAppear } from '../utils/animations';
import { SuccessParticles } from './SuccessParticles';

// =============================================================================
// DECOMPOSITION MODAL COMPONENT
// =============================================================================

interface DecompositionModalProps {
  show: boolean;
  divisor: number;
  estimate: number;
  onClose: () => void;
}

export const DecompositionModal = memo<DecompositionModalProps>(({
  show,
  divisor,
  estimate,
  onClose
}) => {
  const [decompositionStep, setDecompositionStep] = useState(0);

  useEffect(() => {
    if (!show) {
      setDecompositionStep(0);
      return;
    }

    const steps = [1, 2, 3, 4];
    steps.forEach((step, index) => {
      setTimeout(() => setDecompositionStep(step), (index + 1) * 1500);
    });
  }, [show]);

  if (!show) return null;

  const shouldDecomposeB = estimate >= 10;
  const tens = shouldDecomposeB ? Math.floor(estimate / 10) * 10 : 0;
  const units = shouldDecomposeB ? estimate % 10 : estimate;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Décomposition de la multiplication"
      >
        <motion.div
          className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border-4 border-purple-200"
          {...smoothAppear}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              🧮 Décomposons {divisor} × {estimate}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 text-lg">
            {shouldDecomposeB ? (
              <>
                <motion.div
                  className={`p-4 rounded-xl transition-all text-center font-bold ${
                    decompositionStep >= 1 ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-300 text-blue-800' : 'bg-gray-100 text-gray-500'
                  }`}
                  animate={{ scale: decompositionStep === 1 ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {divisor} × {estimate} = {divisor} × ({tens} + {units})
                </motion.div>

                <motion.div
                  className={`p-4 rounded-xl transition-all text-center font-bold ${
                    decompositionStep >= 2 ? 'bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-300 text-green-800' : 'bg-gray-100 text-gray-500'
                  }`}
                  animate={{ scale: decompositionStep === 2 ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  = ({divisor} × {tens}) + ({divisor} × {units})
                </motion.div>

                <motion.div
                  className={`p-4 rounded-xl transition-all text-center font-bold ${
                    decompositionStep >= 3 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300 text-yellow-800' : 'bg-gray-100 text-gray-500'
                  }`}
                  animate={{ scale: decompositionStep === 3 ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  = {divisor * tens} + {divisor * units}
                </motion.div>

                <motion.div
                  className={`p-4 rounded-xl transition-all text-center font-bold text-xl ${
                    decompositionStep >= 4 ? 'bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-300 text-purple-800' : 'bg-gray-100 text-gray-500'
                  }`}
                  animate={{ scale: decompositionStep === 4 ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  = {divisor * estimate}
                </motion.div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <motion.div
                  className={`p-4 rounded-xl transition-all font-bold ${
                    decompositionStep >= 1 ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-2 border-blue-300 text-blue-800' : 'bg-gray-100 text-gray-500'
                  }`}
                  animate={{ scale: decompositionStep === 1 ? [1, 1.05, 1] : 1 }}
                >
                  {divisor} × {estimate}
                </motion.div>

                <motion.div
                  className={`p-4 rounded-xl transition-all font-bold text-xl ${
                    decompositionStep >= 4 ? 'bg-gradient-to-r from-purple-100 to-purple-200 border-2 border-purple-300 text-purple-800' : 'bg-gray-100 text-gray-500'
                  }`}
                  animate={{ scale: decompositionStep === 4 ? [1, 1.1, 1] : 1 }}
                >
                  = {divisor * estimate}
                </motion.div>
              </div>
            )}
          </div>

          <SuccessParticles trigger={decompositionStep === 4} color="#9333EA" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

DecompositionModal.displayName = 'DecompositionModal';

