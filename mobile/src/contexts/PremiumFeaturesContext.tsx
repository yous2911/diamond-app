import React, { createContext, useState, useContext, ReactNode } from 'react';

export type MascotEmotion = 'happy' | 'sad' | 'thinking' | 'excited' | 'sleepy' | 'celebrating';

export interface PremiumFeaturesContextType {
  mascotEmotion: MascotEmotion;
  setMascotEmotion: (emotion: MascotEmotion) => void;
  mascotEmotions: MascotEmotion[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  triggerParticles: () => void;
  celebrations: string[];
  setMascotMessage: (message: string) => void;
  addXP: (amount: number) => void;
  currentXP: number;
  maxXP: number;
  level: number;
}

const PremiumFeaturesContext = createContext<PremiumFeaturesContextType | undefined>(undefined);

export const PremiumFeaturesProvider = ({ children }: { children: ReactNode }) => {
  const [mascotEmotion, setMascotEmotion] = useState<MascotEmotion>('happy');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [currentXP, setCurrentXP] = useState(0);
  const [maxXP] = useState(100);
  const [level] = useState(1);
  const [celebrations] = useState<string[]>(['Confetti', 'Fireworks']);
  const [mascotEmotions] = useState<MascotEmotion[]>(['happy', 'sad', 'thinking', 'excited', 'sleepy', 'celebrating']);

  const triggerParticles = () => {
    console.log('✨ Particles triggered! ✨');
  };

  const setMascotMessage = (message: string) => {
    console.log('Mascot says:', message);
  };

  const addXP = (amount: number) => {
      setCurrentXP(prev => prev + amount);
  }

  const contextValue: PremiumFeaturesContextType = {
    mascotEmotion,
    setMascotEmotion,
    mascotEmotions,
    soundEnabled,
    setSoundEnabled,
    triggerParticles,
    celebrations,
    setMascotMessage,
    addXP,
    currentXP,
    maxXP,
    level,
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
