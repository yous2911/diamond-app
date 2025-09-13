import React, { createContext, useState, useContext, ReactNode } from 'react';

type MascotEmotion = 'happy' | 'sad' | 'thinking' | 'excited' | 'sleepy';

interface PremiumFeaturesContextType {
  mascotEmotion: MascotEmotion;
  setMascotEmotion: (emotion: MascotEmotion) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  triggerParticles: () => void;
}

const PremiumFeaturesContext = createContext<PremiumFeaturesContextType | undefined>(undefined);

export const PremiumFeaturesProvider = ({ children }: { children: ReactNode }) => {
  const [mascotEmotion, setMascotEmotion] = useState<MascotEmotion>('happy');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const triggerParticles = () => {
    console.log('✨ Particles triggered! ✨');
  };

  const contextValue: PremiumFeaturesContextType = {
    mascotEmotion,
    setMascotEmotion,
    soundEnabled,
    setSoundEnabled,
    triggerParticles,
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
