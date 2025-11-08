import React, { memo, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { slideIn } from './utils/animations';
import { useDivisionLogic } from './hooks/useDivisionLogic';
import { useFeedback } from './hooks/useFeedback';
import { speak, cleanupAudioContext } from './utils/audioUtils';
import { DivisionSetup } from './components/DivisionSetup';
import { DivisionLayout } from './components/DivisionLayout';
import { ExplanationPanel } from './components/ExplanationPanel';
import { StepEstimate } from './components/StepEstimate';
import { StepMultiply } from './components/StepMultiply';
import { StepSubtract } from './components/StepSubtract';
import { StepBringDown } from './components/StepBringDown';
import { StepComplete } from './components/StepComplete';
import { FeedbackToast } from './components/FeedbackToast';
import { DecompositionModal } from './components/DecompositionModal';
import type { InteractiveLongDivisionProps } from './types';

// =============================================================================
// INTERACTIVE LONG DIVISION - MAIN COMPONENT (REFACTORED)
// =============================================================================

const InteractiveLongDivision: React.FC<InteractiveLongDivisionProps> = ({
  onComplete,
  onProgress,
  onXPEarned,
  initialDividend = '',
  initialDivisor = '',
}) => {
  const {
    state,
    inputs,
    calculations,
    initializeDivision,
    validateEstimate: validateEstimateLogic,
    validateMultiplication: validateMultiplicationLogic,
    validateSubtraction: validateSubtractionLogic,
    bringDownNext: bringDownNextLogic,
    resetDivision,
    updateState,
    updateInputs,
  } = useDivisionLogic();

  const { feedback, triggerFeedback } = useFeedback();
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightedArea, setHighlightedArea] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [showDecomposition, setShowDecomposition] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [showWorkingCalculations, setShowWorkingCalculations] = useState(false);

  // Initialize with props if provided
  useEffect(() => {
    if (initialDividend && initialDivisor) {
      updateState({ dividend: initialDividend, divisor: initialDivisor });
    }
  }, [initialDividend, initialDivisor, updateState]);

  // Cleanup AudioContext on component unmount
  useEffect(() => {
    return () => {
      cleanupAudioContext();
    };
  }, []);

  // Animate verification
  const animateVerification = useCallback(async (
    operation: string,
    userAnswer: number,
    correctAnswer: number | string,
    isEquation: boolean = false
  ): Promise<boolean> => {
    setShowVerification(true);
    setIsAnimating(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (typeof correctAnswer === 'number' && userAnswer === correctAnswer) {
      triggerFeedback('success', '✅ Parfait ! Continue.');
      setShowVerification(false);
      setIsAnimating(false);
      return true;
    } else {
      const message = isEquation 
        ? `❌ Vérifions : ${operation} = ${correctAnswer}` 
        : `❌ ${operation} donne ${correctAnswer}, pas ${userAnswer}`;
      triggerFeedback('error', message);
      setShowVerification(false);
      setIsAnimating(false);
      return false;
    }
  }, [triggerFeedback]);

  // Validate estimate
  const validateEstimate = useCallback(async () => {
    const estimate = parseInt(inputs.userEstimate);
    if (isNaN(estimate) && estimate !== 0) return;

    setHighlightedArea('estimate');

    // Check if estimate is too high
    if (estimate * calculations.currentDivisor > state.workingNumber) {
      triggerFeedback('error', '🔍 Trop grand ! Essayons un nombre plus petit.');
      updateInputs({ userEstimate: '' });
      setHighlightedArea(null);
      return;
    }

    // Check if estimate is too low
    if ((estimate + 1) * calculations.currentDivisor <= state.workingNumber) {
      triggerFeedback('error', '🔍 On peut faire mieux ! Essayons un nombre plus grand.');
      updateInputs({ userEstimate: '' });
      setHighlightedArea(null);
      return;
    }

    // Correct estimate
    const isCorrect = await animateVerification(
      `${calculations.currentDivisor} × ${estimate}`,
      estimate * calculations.currentDivisor,
      calculations.correctProduct,
      true
    );

    if (isCorrect) {
      const result = validateEstimateLogic();
      if (result?.success) {
        setShowWorkingCalculations(true);
        setHighlightedArea(null);
      }
    }
  }, [inputs.userEstimate, calculations, state.workingNumber, animateVerification, triggerFeedback, updateInputs, validateEstimateLogic]);

  // Validate multiplication
  const validateMultiplication = useCallback(async () => {
    const product = parseInt(inputs.userMultiplication);
    if (isNaN(product) && product !== 0) return;

    setHighlightedArea('multiply');

    if (product !== calculations.correctProduct) {
      triggerFeedback('hint', '🧮 Décomposons ce calcul ensemble !');
      setShowDecomposition(true);
      updateInputs({ userMultiplication: '' });
      setHighlightedArea(null);
      return;
    }

    const isCorrect = await animateVerification(
      `${calculations.currentDivisor} × ${inputs.userEstimate}`,
      product,
      calculations.correctProduct,
      true
    );

    if (isCorrect) {
      validateMultiplicationLogic();
      setHighlightedArea(null);
    }
  }, [inputs.userMultiplication, inputs.userEstimate, calculations, animateVerification, triggerFeedback, updateInputs, validateMultiplicationLogic]);

  // Validate subtraction
  const validateSubtraction = useCallback(async () => {
    const subtraction = parseInt(inputs.userSubtraction);
    if (isNaN(subtraction) && subtraction !== 0) return;

    setHighlightedArea('subtract');

    if (subtraction !== calculations.correctSubtraction) {
      triggerFeedback('error', `🔍 Vérifions : ${calculations.correctProduct} + ${subtraction} = ${calculations.correctProduct + subtraction}, mais on avait ${state.workingNumber}`);
      updateInputs({ userSubtraction: '' });
      setHighlightedArea(null);
      return;
    }

    const isCorrect = await animateVerification(
      `${state.workingNumber} - ${calculations.correctProduct}`,
      subtraction,
      calculations.correctSubtraction,
      true
    );

    if (isCorrect) {
      validateSubtractionLogic();
      setHighlightedArea(null);
    }
  }, [inputs.userSubtraction, calculations, state.workingNumber, animateVerification, triggerFeedback, updateInputs, validateSubtractionLogic]);

  // Bring down next
  const bringDownNext = useCallback(() => {
    const result = bringDownNextLogic();
    if (result) {
      triggerFeedback('info', `📥 On descend le ${result.nextDigit}. Nouveau nombre : ${result.newWorkingNumber}`);
      speak(`On descend le ${result.nextDigit}`);
      setShowWorkingCalculations(false);
    }
  }, [bringDownNextLogic, triggerFeedback]);

  // Handle division initialization
  const handleInitializeDivision = useCallback(() => {
    const success = initializeDivision();
    if (!success) {
      triggerFeedback('error', '⚠️ Le dividende doit être plus grand que le diviseur !');
      return;
    }

    const dividendNum = parseInt(state.dividend);
    const divisorNum = parseInt(state.divisor);
    speak(`Commençons ! ${dividendNum} divisé par ${divisorNum}`);
    triggerFeedback('info', `🎯 Combien de fois ${divisorNum} rentre dans ${state.workingNumber} ?`);

    onProgress?.(state.currentStep, { dividend: state.dividend, divisor: state.divisor });
  }, [initializeDivision, state, triggerFeedback, onProgress]);

  // Handle reset
  const handleReset = useCallback(() => {
    resetDivision();
    setShowExplanation(true);
    setShowWorkingCalculations(false);
  }, [resetDivision]);

  // Handle division complete
  useEffect(() => {
    if (state.currentStep === 'complete') {
      const result = {
        quotient: state.quotient,
        rest: state.finalRest,
        dividend: state.dividend,
        divisor: state.divisor,
      };
      onComplete?.(result);
      onXPEarned?.(50); // Award XP for completion
    }
  }, [state.currentStep, state.quotient, state.finalRest, state.dividend, state.divisor, onComplete, onXPEarned]);

  // Get next digit for bring down
  const nextDigit = state.currentPosition + 1 < state.dividend.toString().length
    ? state.dividend.toString()[state.currentPosition + 1]
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-8" {...slideIn}>
          <motion.h1 
            className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 mb-4"
            animate={{ 
              backgroundPosition: ['0%', '100%', '0%'],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            🧮 Division Longue Interactive
          </motion.h1>
          <motion.p 
            className="text-xl sm:text-2xl text-gray-700 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Maîtrise la division posée étape par étape
          </motion.p>
        </motion.div>

        {/* Feedback Toast */}
        <FeedbackToast feedback={feedback} />

        {/* Setup Phase */}
        {!state.isSetupComplete && (
          <DivisionSetup
            dividend={state.dividend}
            divisor={state.divisor}
            onDividendChange={(value) => updateState({ dividend: value })}
            onDivisorChange={(value) => updateState({ divisor: value })}
            onStart={handleInitializeDivision}
          />
        )}

        {/* Division Interface */}
        {state.isSetupComplete && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Explanation Panel */}
            <ExplanationPanel
              currentStep={state.currentStep}
              dividend={state.dividend}
              divisor={state.divisor}
              workingNumber={state.workingNumber}
              quotient={state.quotient}
              rest={state.finalRest}
              showExplanation={showExplanation}
              onClose={() => setShowExplanation(false)}
            />

            {/* Division Layout */}
            <DivisionLayout
              dividend={state.dividend}
              divisor={state.divisor}
              quotient={state.quotient}
              rest={state.finalRest}
              workingNumber={state.workingNumber}
              correctSubtraction={calculations.correctSubtraction}
              currentStep={state.currentStep}
              showExplanation={showExplanation}
              highlightedArea={highlightedArea}
            />

            {/* Interactive Steps */}
            <motion.div 
              className={`${showExplanation ? 'xl:col-span-1' : 'xl:col-span-1'} bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-100`}
              {...slideIn}
              role="region"
              aria-label="Étape actuelle"
            >
              <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-center mb-8">
                🎯 Étape Actuelle
              </h3>

              {/* Step Estimate */}
              {state.currentStep === 'estimate' && (
                <StepEstimate
                  divisor={calculations.currentDivisor}
                  workingNumber={state.workingNumber}
                  userEstimate={inputs.userEstimate}
                  onEstimateChange={(value) => updateInputs({ userEstimate: value })}
                  onValidate={validateEstimate}
                  isAnimating={isAnimating}
                />
              )}

              {/* Step Multiply */}
              {state.currentStep === 'multiply' && (
                <StepMultiply
                  divisor={calculations.currentDivisor}
                  userEstimate={inputs.userEstimate}
                  userMultiplication={inputs.userMultiplication}
                  onMultiplicationChange={(value) => updateInputs({ userMultiplication: value })}
                  onValidate={validateMultiplication}
                  onShowDecomposition={() => setShowDecomposition(true)}
                  isAnimating={isAnimating}
                />
              )}

              {/* Step Subtract */}
              {state.currentStep === 'subtract' && (
                <StepSubtract
                  workingNumber={state.workingNumber}
                  correctProduct={calculations.correctProduct}
                  userSubtraction={inputs.userSubtraction}
                  onSubtractionChange={(value) => updateInputs({ userSubtraction: value })}
                  onValidate={validateSubtraction}
                  isAnimating={isAnimating}
                />
              )}

              {/* Step Bring Down */}
              {state.currentStep === 'bringDown' && (
                <StepBringDown
                  correctSubtraction={calculations.correctSubtraction}
                  nextDigit={nextDigit}
                  onBringDown={bringDownNext}
                />
              )}

              {/* Step Complete */}
              {state.currentStep === 'complete' && (
                <StepComplete
                  dividend={state.dividend}
                  divisor={state.divisor}
                  quotient={state.quotient}
                  rest={state.finalRest}
                  onReset={handleReset}
                />
              )}
            </motion.div>
          </div>
        )}

        {/* Reset Button */}
        {state.isSetupComplete && state.currentStep !== 'complete' && (
          <motion.div className="text-center mt-8" {...slideIn}>
            <motion.button
              onClick={handleReset}
              className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-bold hover:from-gray-700 hover:to-gray-800 shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Recommencer avec de nouveaux nombres"
            >
              🏠 Recommencer avec de Nouveaux Nombres
            </motion.button>
          </motion.div>
        )}

        {/* Verification Animation */}
        <AnimatePresence>
          {showVerification && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="dialog"
              aria-modal="true"
              aria-label="Vérification en cours"
            >
              <motion.div
                className="bg-white rounded-3xl p-10 text-center shadow-2xl border-4 border-purple-200 relative overflow-hidden"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <motion.div 
                  className="text-8xl mb-6"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  aria-hidden="true"
                >
                  🔍
                </motion.div>
                <motion.div 
                  className="text-2xl font-bold text-gray-800 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Vérification en cours...
                </motion.div>
                <div className="flex justify-center">
                  <motion.div 
                    className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    aria-hidden="true"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decomposition Modal */}
        <DecompositionModal
          show={showDecomposition}
          divisor={calculations.currentDivisor}
          estimate={parseInt(inputs.userEstimate) || 0}
          onClose={() => setShowDecomposition(false)}
        />

        {/* Floating Help Button */}
        {state.isSetupComplete && !showExplanation && (
          <motion.button
            onClick={() => setShowExplanation(true)}
            className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl z-30"
            whileHover={{ 
              scale: 1.1, 
              boxShadow: "0 20px 40px rgba(139, 69, 234, 0.4)" 
            }}
            whileTap={{ scale: 0.9 }}
            animate={{ 
              y: [0, -10, 0],
              boxShadow: [
                "0 10px 20px rgba(139, 69, 234, 0.3)",
                "0 20px 40px rgba(139, 69, 234, 0.4)",
                "0 10px 20px rgba(139, 69, 234, 0.3)"
              ]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            aria-label="Afficher l'aide"
          >
            💡
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default memo(InteractiveLongDivision);

