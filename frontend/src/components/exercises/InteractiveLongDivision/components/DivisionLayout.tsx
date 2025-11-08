import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { slideIn, celebration, pulse } from '../utils/animations';
import type { DivisionStep } from '../types';

// =============================================================================
// DIVISION LAYOUT (L-SHAPED POTENCE) COMPONENT
// =============================================================================

interface DivisionLayoutProps {
  dividend: string;
  divisor: string;
  quotient: string;
  rest: number;
  workingNumber: number;
  correctSubtraction: number;
  currentStep: DivisionStep;
  showExplanation: boolean;
  highlightedArea: string | null;
}

export const DivisionLayout = memo<DivisionLayoutProps>(({
  dividend,
  divisor,
  quotient,
  rest,
  workingNumber,
  correctSubtraction,
  currentStep,
  showExplanation,
  highlightedArea
}) => {
  const progressPercent = useMemo(() => {
    return ((quotient.length) / dividend.toString().length) * 100;
  }, [quotient.length, dividend]);

  const dividendDigits = useMemo(() => dividend.toString().split(''), [dividend]);

  return (
    <motion.div 
      className={`${showExplanation ? 'xl:col-span-1' : 'xl:col-span-2'} bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-100`}
      {...slideIn}
      role="region"
      aria-label="Division posée"
    >
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          📐 Division Posée
        </h3>
      </div>

      {/* TRUE L-SHAPED POTENCE LAYOUT */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-2xl border-2 border-gray-200 overflow-x-auto">
        <div className="min-w-max">
          <div className="relative font-mono text-2xl">
            {/* Top Row: Dividende | Diviseur */}
            <div className="flex items-center justify-center mb-4">
              {/* Dividende */}
              <motion.div 
                className="bg-blue-100 border-2 border-gray-800 border-r-0 border-b-0 p-6 rounded-tl-lg flex-1 max-w-xs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                aria-label={`Dividende: ${dividend}`}
              >
                <div className="text-sm font-bold text-blue-600 mb-2 text-center">DIVIDENDE</div>
                <motion.div 
                  className="text-3xl font-bold text-blue-800 text-center"
                  animate={currentStep === 'setup' ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: currentStep === 'setup' ? Infinity : 0 }}
                >
                  {dividend}
                </motion.div>
              </motion.div>

              {/* Vertical divider */}
              <div className="w-0 h-20 border-l-4 border-gray-800" aria-hidden="true"></div>

              {/* Diviseur */}
              <motion.div 
                className="bg-red-100 border-2 border-gray-800 border-l-0 border-b-0 p-6 rounded-tr-lg flex-1 max-w-xs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                aria-label={`Diviseur: ${divisor}`}
              >
                <div className="text-sm font-bold text-red-600 mb-2 text-center">DIVISEUR</div>
                <motion.div 
                  className="text-3xl font-bold text-red-800 text-center"
                  animate={currentStep === 'setup' ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: currentStep === 'setup' ? Infinity : 0, delay: 0.5 }}
                >
                  {divisor}
                </motion.div>
              </motion.div>
            </div>

            {/* Horizontal divider */}
            <div className="w-full h-0 border-t-4 border-gray-800 mb-4" aria-hidden="true"></div>

            {/* Bottom Row: Reste | Quotient */}
            <div className="flex items-center justify-center">
              {/* Reste */}
              <motion.div 
                className="bg-green-100 border-2 border-gray-800 border-r-0 border-t-0 p-6 rounded-bl-lg flex-1 max-w-xs"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                aria-label={`Reste: ${currentStep === 'complete' ? rest : (highlightedArea === 'subtract' ? correctSubtraction : 0)}`}
              >
                <div className="text-sm font-bold text-green-600 mb-2 text-center">RESTE</div>
                <motion.div 
                  className="text-3xl font-bold text-green-800 text-center"
                  {...celebration}
                  key={`rest-${rest}-${currentStep}`}
                >
                  {currentStep === 'complete' ? rest : (highlightedArea === 'subtract' ? correctSubtraction : 0)}
                </motion.div>
              </motion.div>

              {/* Vertical divider */}
              <div className="w-0 h-20 border-l-4 border-gray-800" aria-hidden="true"></div>

              {/* Quotient */}
              <motion.div 
                className="bg-purple-100 border-2 border-gray-800 border-l-0 border-t-0 p-6 rounded-br-lg flex-1 max-w-xs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                aria-label={`Quotient: ${quotient || 'en cours'}`}
              >
                <div className="text-sm font-bold text-purple-600 mb-2 text-center">QUOTIENT</div>
                <div className="text-3xl font-bold text-purple-800 flex justify-center items-center">
                  {quotient.split('').map((digit, index) => (
                    <motion.span
                      key={index}
                      className="inline-block"
                      initial={{ y: -30, opacity: 0, scale: 1.2 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.2, type: "spring", stiffness: 300, damping: 25 }}
                    >
                      {digit}
                    </motion.span>
                  ))}
                  {currentStep !== 'complete' && (
                    <motion.span 
                      className="inline-block text-purple-400 animate-pulse ml-1"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      aria-hidden="true"
                    >
                      _
                    </motion.span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Progress Visualization */}
          <div className="mt-8">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
              <span className="font-bold">📈 Progression</span>
              <span className="font-bold">{quotient.length}/{dividendDigits.length} chiffres</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <motion.div
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 h-4 rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  animate={{ x: ['0%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2" role="list" aria-label="Chiffres du dividende">
              {dividendDigits.map((digit, index) => (
                <motion.span 
                  key={index} 
                  className={`font-bold ${index < quotient.length ? 'text-purple-600' : 'text-gray-400'}`}
                  animate={{ 
                    scale: index === quotient.length ? [1, 1.2, 1] : 1,
                    color: index < quotient.length ? '#9333EA' : '#9CA3AF'
                  }}
                  transition={{ duration: 0.3 }}
                  role="listitem"
                >
                  {digit}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

DivisionLayout.displayName = 'DivisionLayout';

