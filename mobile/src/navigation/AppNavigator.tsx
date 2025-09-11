import React, { Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const AuthNavigator = React.lazy(() => import('./AuthNavigator'));
const StudentNavigator = React.lazy(() => import('./StudentNavigator'));
const ParentNavigator = React.lazy(() => import('./ParentNavigator'));

const AppNavigator = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      <Suspense fallback={<View style={styles.container}><ActivityIndicator /></View>}>
        {!isAuthenticated ? (
          <AuthNavigator />
        ) : user?.type === 'student' ? (
          <StudentNavigator />
        ) : (
          <ParentNavigator />
        )}
      </Suspense>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});


export default AppNavigator;
