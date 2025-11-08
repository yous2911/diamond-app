import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { slideIn } from '../utils/animations';
import type { DivisionStep, Explanation } from '../types';

// =============================================================================
// EXPLANATION PANEL COMPONENT
// =============================================================================

interface ExplanationPanelProps {
  currentStep: DivisionStep;
  dividend: string;
  divisor: string;
  workingNumber: number;
  quotient: string;
  rest: number;
  showExplanation: boolean;
  onClose: () => void;
}

export const ExplanationPanel = memo<ExplanationPanelProps>(({
  currentStep,
  dividend,
  divisor,
  workingNumber,
  quotient,
  rest,
  showExplanation,
  onClose
}) => {
  const explanation: Explanation | null = useMemo(() => {
    switch(currentStep) {
      case 'estimate':
        return {
          title: "🎯 Étape 1 : Estimation",
          content: `On cherche combien de fois ${divisor} rentre dans ${workingNumber}. Essayons de deviner le bon chiffre !`,
          tip: "💡 Astuce : Commence par une estimation et vérifie si c'est trop grand ou trop petit.",
          color: "from-blue-400 to-blue-600"
        };
      case 'multiply':
        return {
          title: "🧮 Étape 2 : Multiplication",
          content: `Maintenant, calculons ${divisor} × [estimation] pour vérifier notre estimation.`,
          tip: "💡 Astuce : Si c'est difficile, on peut décomposer la multiplication !",
          color: "from-purple-400 to-purple-600"
        };
      case 'subtract':
        return {
          title: "➖ Étape 3 : Soustraction",
          content: `On soustrait [produit] de ${workingNumber} pour trouver le reste.`,
          tip: `💡 Astuce : Le résultat doit être plus petit que le diviseur ${divisor}.`,
          color: "from-green-400 to-green-600"
        };
      case 'bringDown':
        return {
          title: "📥 Étape 4 : Descendre le chiffre",
          content: `On descend le chiffre suivant et on recommence !`,
          tip: "💡 Astuce : On colle le nouveau chiffre au reste précédent.",
          color: "from-orange-400 to-orange-600"
        };
      case 'complete':
        return {
          title: "🎉 Division Terminée !",
          content: `Bravo ! Tu as trouvé que ${dividend} ÷ ${divisor} = ${quotient}${rest > 0 ? ` reste ${rest}` : ''}.`,
          tip: `💡 Tu peux vérifier : ${quotient} × ${divisor}${rest > 0 ? ` + ${rest}` : ''} = ${dividend}`,
          color: "from-green-400 to-blue-600"
        };
      default:
        return null;
    }
  }, [currentStep, dividend, divisor, workingNumber, quotient, rest]);

  if (!explanation || !showExplanation) return null;

  return (
    <motion.div 
      className="xl:col-span-1 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-purple-100"
      {...slideIn}
      role="region"
      aria-label="Guide étape par étape"
    >
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          📚 Guide Étape par Étape
        </h3>
        <motion.button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          whileHover={{ scale: 1.1, rotate: 90 }}
          transition={{ type: "spring", stiffness: 400 }}
          aria-label="Fermer le guide"
        >
          ×
        </motion.button>
      </div>

      <motion.div 
        className="space-y-6"
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className={`bg-gradient-to-r ${explanation.color} p-6 rounded-2xl text-white border border-white/30`}>
          <h4 className="font-bold text-xl mb-3">{explanation.title}</h4>
          <p className="text-white/90 mb-4 leading-relaxed">{explanation.content}</p>
          <p className="text-sm text-white/80 italic bg-white/20 p-3 rounded-lg">{explanation.tip}</p>
        </div>

        {/* Current working number display */}
        {currentStep !== 'complete' && (
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 rounded-2xl text-center border-2 border-yellow-300">
            <p className="text-lg font-bold text-yellow-800 mb-2">
              🎯 Nombre de travail actuel :
            </p>
            <motion.span 
              className="text-4xl font-bold block text-orange-600"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {workingNumber}
            </motion.span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

ExplanationPanel.displayName = 'ExplanationPanel';

