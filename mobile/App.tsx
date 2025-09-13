import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { PremiumFeaturesProvider } from './src/contexts/PremiumFeaturesContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PremiumFeaturesProvider>
          <AppNavigator />
        </PremiumFeaturesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
