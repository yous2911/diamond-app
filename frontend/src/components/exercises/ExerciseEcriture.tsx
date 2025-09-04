import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface ExerciseEcritureProps {
  exercise: any;
  onAnswerChange: (answer: string) => void;
  disabled: boolean;
  currentAnswer: any;
  showValidation: boolean;
}

export const ExerciseEcriture: React.FC<ExerciseEcritureProps> = ({
  exercise,
  onAnswerChange,
  disabled,
  currentAnswer,
  showValidation
}) => {
  const [inputValue, setInputValue] = useState<string>(currentAnswer?.toString() || '');
  const { consigne, theme, typeEcriture, longueurMin, longueurMax } = exercise.configuration || {};

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

  const getEcritureTypeInfo = () => {
    const types = {
      'RECIT': 'Récit',
      'DESCRIPTION': 'Description',
      'DIALOGUE': 'Dialogue',
      'LETTRE': 'Lettre',
      'POEME': 'Poème',
      'INVENTION': 'Histoire inventée',
      'RESUME': 'Résumé',
      'CRITIQUE': 'Critique'
    };
    return types[typeEcriture as keyof typeof types] || 'Écriture libre';
  };

  const getWordCount = () => {
    return inputValue.trim() ? inputValue.trim().split(/\s+/).length : 0;
  };

  const isLengthValid = () => {
    const wordCount = getWordCount();
    return (!longueurMin || wordCount >= longueurMin) && (!longueurMax || wordCount <= longueurMax);
  };

  return (
    <div className="space-y-6">
      {/* Type d'écriture */}
      <div className="text-center">
        <div className="inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
          ✍️ {getEcritureTypeInfo()}
        </div>
      </div>

      {/* Consigne */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📝 Consigne :</h3>
        <div className="text-gray-700 leading-relaxed text-lg">
          {consigne}
        </div>
        {theme && (
          <div className="mt-3 p-3 bg-blue-100 rounded-lg">
            <span className="font-semibold text-blue-800">Thème :</span> {theme}
          </div>
        )}
      </div>

      {/* Contraintes de longueur */}
      {(longueurMin || longueurMax) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-600">📏</span>
            <span className="font-semibold text-yellow-800">Longueur :</span>
          </div>
          <p className="text-yellow-700">
            {longueurMin && longueurMax 
              ? `${longueurMin} à ${longueurMax} mots`
              : longueurMin 
                ? `Minimum ${longueurMin} mots`
                : `Maximum ${longueurMax} mots`
            }
          </p>
        </div>
      )}

      {/* Zone d'écriture */}
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Écris ton texte ici..."
            rows={8}
            className={`
              w-full text-lg p-6 rounded-xl border-2 resize-none
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

        {/* Statistiques */}
        <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
          <div className="flex gap-4">
            <span>📝 {getWordCount()} mots</span>
            <span>📊 {inputValue.length} caractères</span>
          </div>
          {(longueurMin || longueurMax) && (
            <div className={`font-medium ${isLengthValid() ? 'text-green-600' : 'text-orange-600'}`}>
              {isLengthValid() ? '✅ Longueur correcte' : '⚠️ Vérifie la longueur'}
            </div>
          )}
        </div>
      </div>

      {/* Conseils d'écriture */}
      <div className="max-w-md mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600">💡</span>
            <span className="font-semibold text-green-800">Conseils :</span>
          </div>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Relis ton texte</li>
            <li>• Vérifie l'orthographe</li>
            <li>• Sois créatif et original</li>
            <li>• Respecte la consigne</li>
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
                <span className="text-2xl">✍️</span>
                <p className="font-medium mt-2">Excellent travail d'écriture !</p>
                <p className="text-sm mt-1">Tu as bien respecté la consigne</p>
              </div>
            ) : (
              <div className="text-orange-600">
                <span className="text-2xl">🤔</span>
                <p className="font-medium mt-2">Relis ta consigne</p>
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
