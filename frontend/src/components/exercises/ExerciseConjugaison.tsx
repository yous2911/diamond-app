import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ExerciseConjugaisonProps {
  exercise: any;
  onAnswerChange: (answer: string[]) => void;
  disabled: boolean;
  mascotType: string;
}

export const ExerciseConjugaison: React.FC<ExerciseConjugaisonProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  mascotType
}) => {
  const [answers, setAnswers] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const verbe = exercise.configuration?.verbe || '';
  const temps = exercise.configuration?.temps || '';
  const personnes = exercise.configuration?.personnes || ['je', 'tu', 'il/elle'];

  const handleAnswerChange = useCallback((index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  }, [answers]);

  const handleSubmit = useCallback(() => {
    if (disabled || isAnimating || answers.some(r => !r.trim())) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      onAnswerChange(answers.map(r => r.trim()));
      setIsAnimating(false);
    }, 500);
  }, [disabled, isAnimating, answers, onAnswerChange]);

  const isComplete = answers.length === personnes.length && answers.every(r => r.trim());

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Conjugue le verbe "{verbe}" au {temps}
        </h2>
        <p className="text-gray-600">Complète chaque forme de conjugaison</p>
      </motion.div>

      <motion.div
        className="max-w-2xl mx-auto space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {personnes.map((personne: string, index: number) => (
          <motion.div
            key={index}
            className="flex items-center gap-4 bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-500 transition-all"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
          >
            <div className="flex-shrink-0 w-20 text-lg font-medium text-gray-700">
              {personne}
            </div>
            <input
              type="text"
              value={answers[index] || ''}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              disabled={disabled}
              placeholder={`${verbe}...`}
              className="flex-1 text-lg p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
              autoFocus={index === 0}
            />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="text-center mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <motion.button
          onClick={handleSubmit}
          disabled={disabled || !isComplete || isAnimating}
          className={`
            px-8 py-4 rounded-xl font-bold text-xl transition-all duration-300
            ${!disabled && isComplete && !isAnimating
              ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg hover:shadow-2xl hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
          whileHover={!disabled && isComplete && !isAnimating ? { scale: 1.05 } : {}}
          whileTap={!disabled && isComplete && !isAnimating ? { scale: 0.95 } : {}}
        >
          {isAnimating ? (
            <motion.div
              className="flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              Vérification...
            </motion.div>
          ) : (
            '✅ Valider ma conjugaison'
          )}
        </motion.button>
      </motion.div>

      <motion.div
        className="text-center mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p className="text-blue-600 font-medium">
          💡 Réfléchis bien aux terminaisons selon la personne !
        </p>
      </motion.div>
    </div>
  );
};
