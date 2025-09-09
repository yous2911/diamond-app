import React, { useState } from 'react';
import AdvancedParticleEngine from './AdvancedParticleEngine';
import HybridMascotSystem from './HybridMascotSystem';
import XPCrystalsPremium from './XPCrystalsPremium';
import { usePremiumFeatures } from '../contexts/PremiumFeaturesContext';

// =============================================================================
// 🌟 LAYOUT PREMIUM GLOBAL - TOUS LES ÉLÉMENTS PARTAGÉS
// =============================================================================
interface GlobalPremiumLayoutProps {
  children: React.ReactNode;
  showXPBar?: boolean;
  xpPosition?: 'top' | 'bottom' | 'floating';
}

const GlobalPremiumLayout: React.FC<GlobalPremiumLayoutProps> = ({
  children,
  showXPBar = true,
  xpPosition = 'floating'
}) => {
  const {
    showParticles,
    particleType,
    mascotEmotion,
    currentXP,
    maxXP,
    level,
    onLevelUp,
    setMascotEmotion
  } = usePremiumFeatures();

  const [mascotMessage, setMascotMessage] = useState<string>('');

  // Convert particle types for AdvancedParticleEngine
  const getAdvancedParticleType = (type: 'success' | 'levelup' | 'magic') => {
    switch (type) {
      case 'success': return 'sparkle';
      case 'levelup': return 'star';
      case 'magic': return 'magic';
      default: return 'sparkle';
    }
  };

  // Convert mascot emotions to activities
  const getMascotActivity = (emotion: string) => {
    switch (emotion) {
      case 'excited': return 'achievement';
      case 'thinking': return 'exercise';
      case 'happy': return 'learning';
      case 'sleepy': return 'idle';
      case 'celebrating': return 'achievement';
      default: return 'idle';
    }
  };

  const handleLevelUp = (newLevel: number) => {
    setMascotEmotion('excited');
    setMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
    onLevelUp?.(newLevel);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Advanced Sparkly Particle Effects */}
      <AdvancedParticleEngine
        width={window.innerWidth}
        height={window.innerHeight}
        particleType={getAdvancedParticleType(particleType)}
        behavior="explosion"
        intensity={4}
        isActive={showParticles}
        enablePhysics={true}
        enableTrails={true}
        enableCollisions={true}
        className="fixed inset-0 pointer-events-none z-10"
      />

      {/* Main Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Global XP System */}
      {showXPBar && (
        <div className={`fixed z-40 ${
          xpPosition === 'top' ? 'top-6 left-1/2 transform -translate-x-1/2' :
          xpPosition === 'bottom' ? 'bottom-6 left-1/2 transform -translate-x-1/2' :
          'top-6 left-6'
        }`}>
          <XPCrystalsPremium
            currentXP={currentXP}
            maxXP={maxXP}
            level={level}
            onLevelUp={handleLevelUp}
          />
        </div>
      )}

      {/* Advanced Hybrid Mascot System */}
      <div className="fixed bottom-6 right-6 z-40">
        <HybridMascotSystem
          mascotType="dragon"
          studentData={{
            level: level,
            xp: currentXP,
            currentStreak: 5,
            timeOfDay: 'afternoon',
            recentPerformance: 'excellent'
          }}
          currentActivity={getMascotActivity(mascotEmotion)}
          equippedItems={['golden_crown', 'magic_cape']}
          onMascotInteraction={(interaction) => {
            // Mascot interaction handled
            setMascotMessage('Interaction avec le mascot ! 🐉');
          }}
          onEmotionalStateChange={(state) => {
            // Mascot emotional state updated
          }}
        />
      </div>
    </div>
  );
};

export default GlobalPremiumLayout;
