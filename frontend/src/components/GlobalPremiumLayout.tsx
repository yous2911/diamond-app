import React from 'react';
import AdvancedParticleEngine from './AdvancedParticleEngine';
import MascotSystem from './MascotSystem'; // <-- UPDATED to use new MascotSystem
import XPCrystalsPremium from './XPCrystalsPremium';
import { usePremiumFeatures } from '../contexts/PremiumFeaturesContext';

// =============================================================================
// 🌟 LAYOUT PREMIUM GLOBAL - TOUS LES ÉLÉMENTS PARTAGÉS
// =============================================================================
interface GlobalPremiumLayoutProps {
  children: React.ReactNode;
  locale?: 'en' | 'fr'; // <-- ADDED locale prop
  showXPBar?: boolean;
  xpPosition?: 'top' | 'bottom' | 'floating';
  // ADDED props to make component more testable and less hardcoded
  studentStreak?: number;
  equippedMascotItems?: string[];
}

const GlobalPremiumLayout: React.FC<GlobalPremiumLayoutProps> = ({
  children,
  locale = 'fr', // Default to French
  showXPBar = true,
  xpPosition = 'floating',
  studentStreak = 0,
  equippedMascotItems = [],
}) => {
  const {
    showParticles,
    particleType,
    mascotEmotion,
    currentXP,
    maxXP,
    level,
    onLevelUp,
    setMascotEmotion,
  } = usePremiumFeatures();

  // Helper to convert particle types for the engine
  const getAdvancedParticleType = (type: 'success' | 'levelup' | 'magic') => {
    switch (type) {
      case 'success': return 'sparkle';
      case 'levelup': return 'star';
      case 'magic': return 'magic';
      default: return 'sparkle';
    }
  };

  // Helper to convert mascot emotions to activities
  const getMascotActivity = (emotion: string) => {
    switch (emotion) {
      case 'excited': case 'celebrating': return 'achievement';
      case 'thinking': return 'exercise';
      case 'happy': return 'learning';
      default: return 'idle';
    }
  };

  const handleLevelUp = (newLevel: number) => {
    setMascotEmotion('excited');
    onLevelUp?.(newLevel);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Advanced Particle Effects */}
      {showParticles && (
        <AdvancedParticleEngine
          width={window.innerWidth}
          height={window.innerHeight}
          particleType={getAdvancedParticleType(particleType)}
          behavior="explosion"
          intensity={4}
          isActive={showParticles}
          enablePhysics={true}
          enableTrails={true}
          className="fixed inset-0 pointer-events-none z-10"
        />
      )}

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

      {/* UPDATED to use new MascotSystem */}
      <div className="fixed bottom-6 right-6 z-40">
        <MascotSystem
          locale={locale}
          mascotType="dragon"
          studentData={{
            level: level,
            xp: currentXP,
            currentStreak: studentStreak,
            timeOfDay: 'afternoon',
            recentPerformance: 'excellent'
          }}
          currentActivity={getMascotActivity(mascotEmotion)}
          equippedItems={equippedMascotItems}
          onMascotInteraction={() => {}}
          onEmotionalStateChange={() => {}}
        />
      </div>
    </div>
  );
};

export default GlobalPremiumLayout;