import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import StudentLogin from '../screens/auth/StudentLogin';
import ParentLogin from '../screens/auth/ParentLogin';
import AvatarSelection from '../screens/auth/AvatarSelection';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="StudentLogin" component={StudentLogin} options={{ headerShown: false }} />
      <Stack.Screen name="ParentLogin" component={ParentLogin} options={{ title: 'Parent Zone' }} />
      <Stack.Screen name="AvatarSelection" component={AvatarSelection} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
