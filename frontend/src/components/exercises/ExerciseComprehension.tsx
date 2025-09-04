import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface ExerciseComprehensionProps {
  exercise: any;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

export const ExerciseComprehension: React.FC<ExerciseComprehensionProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const [inputValue, setInputValue] = useState<string>(currentAnswer?.toString() || '');
  const { texte, question, contexte, typeComprehension } = exercise.configuration || {};

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    onAnswerChange(value.trim());
  }, [onAnswerChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      e.preventDefault();
    }
  }, [disabled]);

  const getValidationColor = () => {
    if (!showValidation) return '';
    const expected = exercise.configuration?.solution?.toString().toLowerCase().trim();
    const given = currentAnswer?.toString().toLowerCase().trim();
    const isCorrect = expected === given;
    return isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50';
  };

  const getExpectedAnswer = () => {
    return exercise.configuration?.solution || exercise.configuration?.bonneReponse;
  };

  const getComprehensionTypeInfo = () => {
    const types = {
      'INFERENCE': 'Déduire des informations implicites',
      'CAUSE_EFFET': 'Comprendre les relations de cause à effet',
      'SEQUENCE': 'Suivre l\'ordre des événements',
      'VOCABULAIRE': 'Comprendre le sens des mots',
      'IDEE_PRINCIPALE': 'Identifier l\'idée principale',
      'DETAILS': 'Repérer les détails importants'
    };
    return types[typeComprehension as keyof typeof types] || 'Compréhension générale';
  };

  return (
    <div className="space-y-6">
      {/* Contexte */}
      {contexte && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">🎭 Contexte :</h3>
          <p className="text-gray-700">{contexte}</p>
        </div>
      )}

      {/* Texte à analyser */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📖 Texte à analyser :</h3>
        <div className="text-gray-700 leading-relaxed text-lg">
          {texte}
        </div>
      </div>

      {/* Type de compréhension */}
      <div className="text-center">
        <div className="inline-block bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium">
          🧠 {getComprehensionTypeInfo()}
        </div>
      </div>

      {/* Question */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {question}
        </h2>
      </div>

      {/* Réponse */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Écris ta réponse ici..."
            rows={4}
            className={`
              w-full text-lg p-4 rounded-xl border-2 resize-none
              transition-all duration-200 focus:outline-none
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${getValidationColor() || 'border-gray-300 focus:border-blue-500'}
            `}
          />
          
          {showValidation && (
            <div className="absolute right-4 top-4 text-2xl">
              {currentAnswer?.toString().toLowerCase().trim() === 
               getExpectedAnswer()?.toString().toLowerCase().trim() ? '✅' : '❌'}
            </div>
          )}
        </div>

        {/* Compteur de caractères */}
        <div className="text-right text-sm text-gray-500 mt-2">
          {inputValue.length} caractères
        </div>
      </div>

      {/* Stratégies de compréhension */}
      <div className="max-w-md mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600">💡</span>
            <span className="font-semibold text-green-800">Stratégies :</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Relis le texte attentivement</li>
            <li>• Surligne les mots-clés</li>
            <li>• Pose-toi des questions</li>
            <li>• Vérifie ta réponse dans le texte</li>
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
            {currentAnswer?.toString().toLowerCase().trim() === 
             getExpectedAnswer()?.toString().toLowerCase().trim() ? (
              <div className="text-green-600">
                <span className="text-2xl">🧠</span>
                <p className="font-medium mt-2">Excellente compréhension !</p>
                <p className="text-sm mt-1">Tu as bien analysé le texte</p>
              </div>
            ) : (
              <div className="text-orange-600">
                <span className="text-2xl">🤔</span>
                <p className="font-medium mt-2">Relis le texte plus attentivement</p>
                <p className="text-sm mt-1">
                  Réponse attendue : <strong>{getExpectedAnswer()}</strong>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
