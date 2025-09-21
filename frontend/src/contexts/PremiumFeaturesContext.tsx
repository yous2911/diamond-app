import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useMagicalSounds } from '../hooks/useMagicalSounds';

// =============================================================================
// 🎯 CONTEXTE PREMIUM DIAMANT GLOBAL
// =============================================================================
interface PremiumFeaturesContextType {
  // XP System
  currentXP: number;
  maxXP: number;
  level: number;
  addXP: (amount: number, reason?: string) => void;
  onLevelUp?: (newLevel: number) => void;
  
  // Particle System
  showParticles: boolean;
  particleType: 'success' | 'levelup' | 'magic';
  triggerParticles: (type: 'success' | 'levelup' | 'magic', duration?: number) => void;
  
  // Mascot System
  mascotEmotion: 'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy';
  mascotMessage: string;
  setMascotEmotion: (emotion: 'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy') => void;
  setMascotMessage: (message: string) => void;
  
  // Audio System
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playMagicalChord: () => void;
  playSparkleSound: () => void;
  playLevelUpFanfare: () => void;
  playButtonClick: () => void;
  playErrorSound: () => void;
}

export const PremiumFeaturesContext = createContext<PremiumFeaturesContextType | undefined>(undefined);

interface PremiumFeaturesProviderProps {
  children: ReactNode;
  initialXP?: number;
  initialLevel?: number;
  onLevelUp?: (newLevel: number) => void;
}

export const PremiumFeaturesProvider: React.FC<PremiumFeaturesProviderProps> = ({
  children,
  initialXP = 0,
  initialLevel = 1,
  onLevelUp
}) => {
  // XP System State
  const [currentXP, setCurrentXP] = useState(initialXP);
  const [level, setLevel] = useState(initialLevel);
  const maxXP = 100 + (level * 20); // XP required increases with level

  // Particle System State
  const [showParticles, setShowParticles] = useState(false);
  const [particleType, setParticleType] = useState<'success' | 'levelup' | 'magic'>('magic');

  // Mascot System State
  const [mascotEmotion, setMascotEmotion] = useState<'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy'>('happy');
  const [mascotMessage, setMascotMessage] = useState('');

  // Audio System
  const {
    playMagicalChord,
    playSparkleSound,
    playLevelUpFanfare,
    playButtonClick,
    playErrorSound,
    soundEnabled,
    setSoundEnabled
  } = useMagicalSounds();

  // Particle System
  const triggerParticles = useCallback((type: 'success' | 'levelup' | 'magic', duration = 2000) => {
    setParticleType(type);
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), duration);
  }, []);

  // XP Management - Only for exercise completion
  const addXP = useCallback((amount: number, reason: string = 'exercise') => {
    setCurrentXP(prev => {
      const newXP = prev + amount;
      
      // Check for level up
      if (newXP >= maxXP) {
        const newLevel = level + 1;
        setLevel(newLevel);
        setMascotEmotion('excited');
        setMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
        playLevelUpFanfare();
        triggerParticles('levelup', 3000);
        onLevelUp?.(newLevel);
        
        // Reset XP for new level
        return newXP - maxXP;
      }
      
      // Normal XP gain from exercise completion
      if (reason === 'exercise') {
        setMascotEmotion('happy');
        setMascotMessage(`+${amount} XP ! Exercice réussi ! ✨`);
        playSparkleSound();
        triggerParticles('success', 1500);
      }
      
      return newXP;
    });
  }, [level, maxXP, onLevelUp, playLevelUpFanfare, playSparkleSound, triggerParticles]);

  const contextValue: PremiumFeaturesContextType = {
    // XP System
    currentXP,
    maxXP,
    level,
    addXP,
    onLevelUp,
    
    // Particle System
    showParticles,
    particleType,
    triggerParticles,
    
    // Mascot System
    mascotEmotion,
    mascotMessage,
    setMascotEmotion,
    setMascotMessage,
    
    // Audio System
    soundEnabled,
    setSoundEnabled,
    playMagicalChord,
    playSparkleSound,
    playLevelUpFanfare,
    playButtonClick,
    playErrorSound
  };

  return (
    <PremiumFeaturesContext.Provider value={contextValue}>
      {children}
    </PremiumFeaturesContext.Provider>
  );
};

export const usePremiumFeatures = (): PremiumFeaturesContextType => {
  const context = useContext(PremiumFeaturesContext);
  if (context === undefined) {
    throw new Error('usePremiumFeatures must be used within a PremiumFeaturesProvider');
  }
  return context;
};
