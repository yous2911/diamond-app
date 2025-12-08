import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ExerciseDivisionLongueProps {
  exercise: any;
  onAnswerChange: (answer: { quotient: number; reste: number }) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

interface DivisionStep {
  step: number;
  dividend: number;
  divisor: number;
  partialDividend: number;
  quotientDigit: number;
  product: number;
  remainder: number;
  description: string;
}

export const ExerciseDivisionLongue: React.FC<ExerciseDivisionLongueProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const { dividende, diviseur, quotient, reste } = exercise.configuration || {};
  
  const [showSteps, setShowSteps] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<DivisionStep[]>([]);
  const [userQuotient, setUserQuotient] = useState<string>('');
  const [userReste, setUserReste] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Generate division steps
  useEffect(() => {
    if (dividende && diviseur) {
      const divisionSteps = calculateDivisionSteps(dividende, diviseur);
      setSteps(divisionSteps);
    }
  }, [dividende, diviseur]);

  // Calculate division steps for animation
  const calculateDivisionSteps = (dividend: number, divisor: number): DivisionStep[] => {
    const steps: DivisionStep[] = [];
    let currentDividend = dividend;
    let result = '';
    let stepNumber = 0;

    // Convert to string to work digit by digit
    const dividendStr = dividend.toString();
    let workingNumber = 0;

    for (let i = 0; i < dividendStr.length; i++) {
      workingNumber = workingNumber * 10 + parseInt(dividendStr[i]);
      
      if (workingNumber >= divisor) {
        const quotientDigit = Math.floor(workingNumber / divisor);
        const product = quotientDigit * divisor;
        const remainder = workingNumber - product;
        
        steps.push({
          step: stepNumber++,
          dividend: currentDividend,
          divisor: divisor,
          partialDividend: workingNumber,
          quotientDigit: quotientDigit,
          product: product,
          remainder: remainder,
          description: `On divise ${workingNumber} par ${divisor} : ${quotientDigit} × ${divisor} = ${product}, reste ${remainder}`
        });

        result += quotientDigit.toString();
        workingNumber = remainder;
      } else if (result.length > 0) {
        result += '0';
      }
    }

    return steps;
  };

  const handleShowSteps = () => {
    setShowSteps(true);
    setCurrentStep(0);
    setIsAnimating(true);
    
    // Animate through steps
    steps.forEach((_, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        if (index === steps.length - 1) {
          setIsAnimating(false);
        }
      }, index * 2000);
    });
  };

  const handleQuotientChange = useCallback((value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    setUserQuotient(cleanValue);
    if (cleanValue && userReste) {
      onAnswerChange({
        quotient: parseInt(cleanValue),
        reste: parseInt(userReste) || 0
      });
    }
  }, [userReste, onAnswerChange]);

  const handleResteChange = useCallback((value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    setUserReste(cleanValue);
    if (userQuotient && cleanValue) {
      onAnswerChange({
        quotient: parseInt(userQuotient),
        reste: parseInt(cleanValue) || 0
      });
    }
  }, [userQuotient, onAnswerChange]);

  const isCorrect = showValidation && 
    Number(userQuotient) === quotient && 
    Number(userReste) === (reste || 0);

  const numberPadButtons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '⌫']
  ];

  const handleNumberClick = useCallback((num: string, field: 'quotient' | 'reste') => {
    if (disabled) return;
    
    const currentValue = field === 'quotient' ? userQuotient : userReste;
    
    if (num === 'C') {
      if (field === 'quotient') setUserQuotient('');
      else setUserReste('');
    } else if (num === '⌫') {
      const newValue = currentValue.slice(0, -1);
      if (field === 'quotient') setUserQuotient(newValue);
      else setUserReste(newValue);
    } else {
      const newValue = currentValue + num;
      if (field === 'quotient') handleQuotientChange(newValue);
      else handleResteChange(newValue);
    }
  }, [disabled, userQuotient, userReste, handleQuotientChange, handleResteChange]);

  return (
    <div className="space-y-6 px-4 max-w-md mx-auto">
      {/* Question Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Division posée
        </h2>
        <p className="text-lg text-gray-600">
          Calcule {dividende} ÷ {diviseur}
        </p>
      </motion.div>

      {/* Long Division Display */}
      <motion.div
        className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="font-mono text-2xl text-right space-y-2">
          {/* Traditional long division format */}
          <div className="flex justify-end items-baseline gap-2">
            <span className="text-gray-500">Quotient:</span>
            <div className="border-b-2 border-gray-800 pb-1 min-w-[100px] text-right">
              {userQuotient || '?'}
            </div>
          </div>
          
          <div className="flex justify-end items-baseline gap-2 mt-4">
            <span className="text-gray-500">Reste:</span>
            <div className="border-b-2 border-gray-800 pb-1 min-w-[100px] text-right">
              {userReste || '?'}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gray-300">
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {diviseur} ⟌ {dividende}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Step-by-step Animation Button */}
      {!showSteps && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={handleShowSteps}
            disabled={disabled || isAnimating}
            className="px-6 py-3 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📚 Voir les étapes
          </motion.button>
        </motion.div>
      )}

      {/* Animated Steps */}
      <AnimatePresence>
        {showSteps && steps.length > 0 && (
          <motion.div
            className="max-w-2xl mx-auto bg-blue-50 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <h3 className="text-xl font-bold text-blue-800 mb-4">
              Étapes de la division
            </h3>
            
            <div className="space-y-4">
              {steps.slice(0, currentStep + 1).map((step, index) => (
                <motion.div
                  key={step.step}
                  className="bg-white rounded-lg p-4 shadow-md"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                      {step.step + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-mono text-lg mb-2">
                        {step.partialDividend} ÷ {step.divisor} = {step.quotientDigit}
                      </div>
                      <div className="text-sm text-gray-600">
                        {step.quotientDigit} × {step.divisor} = {step.product}
                      </div>
                      <div className="text-sm text-gray-600">
                        {step.partialDividend} - {step.product} = {step.remainder}
                      </div>
                    </div>
                    <motion.div
                      className="text-2xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.2 + 0.3, type: "spring" }}
                    >
                      ✅
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Answer Inputs */}
      <div className="max-w-md mx-auto space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quotient
          </label>
          <input
            type="text"
            value={userQuotient}
            onChange={(e) => handleQuotientChange(e.target.value)}
            disabled={disabled}
            placeholder="Quotient..."
            className={`
              w-full text-center text-2xl font-bold py-3 px-4 rounded-xl
              border-2 transition-all duration-200 focus:outline-none
              ${showValidation 
                ? isCorrect 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
              }
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Reste
          </label>
          <input
            type="text"
            value={userReste}
            onChange={(e) => handleResteChange(e.target.value)}
            disabled={disabled}
            placeholder="Reste..."
            className={`
              w-full text-center text-2xl font-bold py-3 px-4 rounded-xl
              border-2 transition-all duration-200 focus:outline-none
              ${showValidation 
                ? isCorrect 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300 focus:border-blue-500'
              }
              disabled:bg-gray-100 disabled:cursor-not-allowed
            `}
          />
        </div>
      </div>

      {/* Number Pad */}
      <div className="max-w-xs mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-3 gap-3">
            {numberPadButtons.flat().map((btn, index) => (
              <motion.button
                key={index}
                onClick={() => handleNumberClick(btn, userQuotient ? 'reste' : 'quotient')}
                disabled={disabled}
                className={`
                  aspect-square text-xl font-bold rounded-lg transition-all duration-200
                  ${btn === 'C' ? 'bg-red-500 hover:bg-red-600 text-white' : 
                    btn === '⌫' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 
                    'bg-gray-200 hover:bg-gray-300 text-gray-800'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {btn}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {showValidation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mt-6"
          >
            <div className={`max-w-md mx-auto rounded-xl shadow-lg p-6 ${
              isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
            }`}>
              {isCorrect ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-green-600"
                >
                  <span className="text-4xl block mb-2">🎉</span>
                  <p className="font-bold text-xl">Parfait !</p>
                  <p className="text-sm mt-2">
                    {dividende} ÷ {diviseur} = {quotient} reste {reste || 0}
                  </p>
                </motion.div>
              ) : (
                <div className="text-red-600">
                  <span className="text-4xl block mb-2">🤔</span>
                  <p className="font-bold text-xl">Pas tout à fait...</p>
                  <p className="text-sm mt-2">
                    La bonne réponse est : Quotient = {quotient}, Reste = {reste || 0}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


