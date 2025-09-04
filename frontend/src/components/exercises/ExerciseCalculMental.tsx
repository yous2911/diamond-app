import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface ExerciseCalculMentalProps {
  exercise: any;
  onAnswerChange: (answer: number) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

export const ExerciseCalculMental: React.FC<ExerciseCalculMentalProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const [inputValue, setInputValue] = useState<string>(currentAnswer?.toString() || '');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const { operation, question, niveau, typeCalcul } = exercise.configuration || {};

  const handleInputChange = useCallback((value: string) => {
    // Only allow numbers and basic math characters
    const cleanValue = value.replace(/[^0-9\-+.,]/g, '');
    setInputValue(cleanValue);
    
    const numericValue = parseFloat(cleanValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      onAnswerChange(numericValue);
    }
  }, [onAnswerChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      e.preventDefault();
      // Auto-submit when Enter is pressed
    }
  }, [disabled]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      // Auto-submit when time runs out
      if (inputValue && !disabled) {
        onAnswerChange(parseFloat(inputValue.replace(',', '.')));
      }
    }
  }, [isTimerRunning, timeLeft, inputValue, disabled, onAnswerChange]);

  // Start timer when component mounts
  useEffect(() => {
    setIsTimerRunning(true);
  }, []);

  // Number pad for younger students
  const handleNumberClick = useCallback((num: string) => {
    if (disabled) return;
    
    if (num === 'C') {
      setInputValue('');
      onAnswerChange(0);
    } else if (num === '⌫') {
      const newValue = inputValue.slice(0, -1);
      setInputValue(newValue);
      const numericValue = parseFloat(newValue.replace(',', '.'));
      onAnswerChange(isNaN(numericValue) ? 0 : numericValue);
    } else {
      const newValue = inputValue + num;
      handleInputChange(newValue);
    }
  }, [disabled, inputValue, handleInputChange, onAnswerChange]);

  const getValidationColor = () => {
    if (!showValidation) return '';
    const isCorrect = Number(currentAnswer) === Number(exercise.configuration?.resultat);
    return isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
  };

  const getCalculTypeInfo = () => {
    const types = {
      'ADDITION': 'Addition',
      'SOUSTRACTION': 'Soustraction',
      'MULTIPLICATION': 'Multiplication',
      'DIVISION': 'Division',
      'MELANGE': 'Mélange d\'opérations'
    };
    return types[typeCalcul as keyof typeof types] || 'Calcul mental';
  };

  const getNiveauInfo = () => {
    const niveaux = {
      'DEBUTANT': 'Débutant',
      'INTERMEDIAIRE': 'Intermédiaire',
      'AVANCE': 'Avancé',
      'EXPERT': 'Expert'
    };
    return niveaux[niveau as keyof typeof niveaux] || 'Niveau standard';
  };

  const numberPadButtons = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['C', '0', '⌫']
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header avec timer et niveau */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{getCalculTypeInfo()}</div>
            <div className="text-sm opacity-90">{getNiveauInfo()}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold font-mono">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm opacity-90">Temps restant</div>
          </div>
        </div>
        
        {/* Progress bar du timer */}
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            className="bg-white h-2 rounded-full"
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft / 30) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {question || 'Calcule mentalement'}
        </h2>
        
        {operation && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-mono font-bold text-blue-600 mb-6 p-8 bg-blue-50 rounded-2xl inline-block"
          >
            {operation} = ?
          </motion.div>
        )}
      </div>

      {/* Answer Input */}
      <div className="max-w-md mx-auto">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Ta réponse..."
            className={`
              w-full text-center text-3xl font-bold py-6 px-6 rounded-xl
              border-2 transition-all duration-200 focus:outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${getValidationColor() || 'border-gray-300 focus:border-blue-500'}
            `}
          />
          
          {showValidation && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl">
              {Number(currentAnswer) === Number(exercise.configuration?.resultat) ? '✅' : '❌'}
            </div>
          )}
        </div>
      </div>

      {/* Number Pad */}
      <div className="max-w-xs mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-3 gap-3">
            {numberPadButtons.flat().map((btn, index) => (
              <button
                key={index}
                onClick={() => handleNumberClick(btn)}
                disabled={disabled}
                className={`
                  aspect-square text-xl font-bold rounded-lg transition-all duration-200
                  ${btn === 'C' ? 'bg-red-500 hover:bg-red-600 text-white' : 
                    btn === '⌫' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 
                    'bg-gray-200 hover:bg-gray-300 text-gray-800'}
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conseils de calcul mental */}
      <div className="max-w-md mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600">💡</span>
            <span className="font-semibold text-green-800">Stratégies :</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Décompose les nombres</li>
            <li>• Utilise les propriétés</li>
            <li>• Vérifie ton calcul</li>
            <li>• Reste calme et concentré</li>
          </ul>
        </div>
      </div>

      {/* Feedback */}
      {showValidation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-6"
        >
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
            {Number(currentAnswer) === Number(exercise.configuration?.resultat) ? (
              <div className="text-green-600">
                <span className="text-2xl">🧠</span>
                <p className="font-medium mt-2">Calcul mental parfait !</p>
                <p className="text-sm mt-1">
                  Temps utilisé : {30 - timeLeft} secondes
                </p>
              </div>
            ) : (
              <div className="text-orange-600">
                <span className="text-2xl">🤔</span>
                <p className="font-medium mt-2">Vérifie ton calcul</p>
                <p className="text-sm mt-1">
                  La bonne réponse était : <strong>{exercise.configuration?.resultat}</strong>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
