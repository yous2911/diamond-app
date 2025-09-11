import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import StudentLogin from '../screens/auth/StudentLogin';
import ParentLogin from '../screens/auth/ParentLogin';
import AvatarSelection from '../screens/auth/AvatarSelection';
import StudentHomeScreen from '../screens/student/HomeScreen';
import ExerciseScreen from '../screens/student/ExerciseScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import LeaderboardScreen from '../screens/student/LeaderboardScreen';
import ParentHomeScreen from '../screens/parent/ParentHomeScreen';
import ChildProgressScreen from '../screens/parent/ChildProgressScreen';
import SettingsScreen from '../screens/parent/SettingsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="StudentLogin">
        <Stack.Screen name="StudentLogin" component={StudentLogin} />
        <Stack.Screen name="ParentLogin" component={ParentLogin} />
        <Stack.Screen name="AvatarSelection" component={AvatarSelection} />
        <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
        <Stack.Screen name="Exercise" component={ExerciseScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="ParentHome" component={ParentHomeScreen} />
        <Stack.Screen name="ChildProgress" component={ChildProgressScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
