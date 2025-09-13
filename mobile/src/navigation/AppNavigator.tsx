import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import StudentNavigator from './StudentNavigator';
import ParentNavigator from './ParentNavigator';

const AppNavigator = () => {
  const { isLoggedIn, user } = useAuth();

  return (
    <NavigationContainer>
      {!isLoggedIn ? (
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
