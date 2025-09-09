import React from 'react';
import { usePremiumFeatures } from '../contexts/PremiumFeaturesContext';

// =============================================================================
// 🎯 EXEMPLE D'UTILISATION DES FONCTIONNALITÉS PREMIUM GLOBALES
// =============================================================================
const PremiumFeaturesExample: React.FC = () => {
  const {
    // XP System
    currentXP,
    maxXP,
    level,
    addXP,
    
    // Particle System
    triggerParticles,
    
    // Mascot System
    setMascotEmotion,
    setMascotMessage,
    
    // Audio System
    playButtonClick,
    playSparkleSound,
    soundEnabled,
    setSoundEnabled
  } = usePremiumFeatures();

  const handleSuccess = () => {
    // Add XP and trigger advanced sparkly effects
    addXP(25, 'exercise');
    triggerParticles('success', 2000);
    setMascotEmotion('celebrating');
    setMascotMessage('Excellent travail ! 🎉');
    playSparkleSound();
  };

  const handleLevelUp = () => {
    // Trigger level up effects with advanced particles
    addXP(maxXP - currentXP + 1, 'exercise'); // Force level up
    triggerParticles('levelup', 3000);
    setMascotEmotion('excited');
    setMascotMessage('NIVEAU SUPÉRIEUR ! 🚀');
  };

  const handleMagic = () => {
    // Trigger magical effects with hybrid mascot
    triggerParticles('magic', 1500);
    setMascotEmotion('happy');
    setMascotMessage('Magie en action ! ✨');
    playSparkleSound();
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">🎯 Premium Features Demo</h3>
      
      {/* XP Display */}
      <div className="mb-4 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
        <p className="text-sm text-gray-600">Niveau {level}</p>
        <p className="text-lg font-bold">{currentXP} / {maxXP} XP</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentXP / maxXP) * 100}%` }}
          />
        </div>
      </div>

      {/* Audio Controls */}
      <div className="mb-4 flex items-center space-x-2">
        <label className="text-sm font-medium">Audio:</label>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`px-3 py-1 rounded-full text-sm ${
            soundEnabled 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {soundEnabled ? '🔊 Activé' : '🔇 Désactivé'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleSuccess}
          onMouseDown={playButtonClick}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          ✅ Succès (+25 XP)
        </button>
        
        <button
          onClick={handleLevelUp}
          onMouseDown={playButtonClick}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          🚀 Level Up
        </button>
        
        <button
          onClick={handleMagic}
          onMouseDown={playButtonClick}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          ✨ Magie
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-4">
        💡 Ces fonctionnalités utilisent maintenant le <strong>Hybrid Mascot System</strong> et l'<strong>Advanced Particle Engine</strong> !
      </p>
    </div>
  );
};

export default PremiumFeaturesExample;
