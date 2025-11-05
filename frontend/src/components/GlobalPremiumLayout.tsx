import React from 'react';
// import AdvancedParticleEngine from './AdvancedParticleEngine'; // DISABLED for demo - GPU intensive
import SimpleDragonMascot from './SimpleDragonMascot'; // LIGHTWEIGHT CSS 3D mascot
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
      {/* Simple CSS Particles (Lightweight alternative) */}
      {showParticles && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
              50% { transform: translateY(-20px) scale(1.2); opacity: 0.6; }
            }
          `}</style>
        </div>
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

      {/* Simple Dragon Mascot (CSS 3D - Lightweight and impressive) */}
      <div className="fixed bottom-6 right-6 z-40">
        <SimpleDragonMascot
          studentName="Élève"
          level={level}
          xp={currentXP}
          onInteraction={(type) => {
            if (type === 'click') {
              setMascotEmotion('excited');
            }
          }}
        />
      </div>
    </div>
  );
};

export default GlobalPremiumLayout;