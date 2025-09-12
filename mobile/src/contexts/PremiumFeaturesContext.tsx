import React, { createContext, useContext, ReactNode } from 'react';

interface PremiumFeaturesContextType {
  celebrations: boolean;
  mascotEmotions: boolean;
}

const PremiumFeaturesContext = createContext<PremiumFeaturesContextType | undefined>(undefined);

export const PremiumFeaturesProvider = ({ children }: { children: ReactNode }) => {
  const contextValue: PremiumFeaturesContextType = {
    celebrations: true, // Mock value
    mascotEmotions: true, // Mock value
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
