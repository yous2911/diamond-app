import React, { useEffect, useState } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './src/hooks/useAuth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { registerForPushNotificationsAsync } from './src/services/notifications';

const queryClient = new QueryClient();

export default function App() {
  const { checkAuth, updateUserPushToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      await checkAuth();
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await updateUserPushToken(token);
      }
      setIsLoading(false);
    };
    bootstrap();
  }, [checkAuth, updateUserPushToken]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
