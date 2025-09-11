import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import useAuthStore from '../store/authStore';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import ParentNavigator from './ParentNavigator'; // Assuming this will be created

const AppNavigator = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : user?.type === 'student' ? (
        <StudentNavigator />
      ) : (
        <ParentNavigator />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
