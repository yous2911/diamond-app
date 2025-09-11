import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StudentHomeScreen from '../screens/student/StudentHomeScreen';
import StudentExerciseScreen from '../screens/student/StudentExerciseScreen';
import ProfileScreen from '../screens/student/ProfileScreen';
import LeaderboardScreen from '../screens/student/LeaderboardScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

const StudentNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Exercises') {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Leaderboard') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          }

          return <Ionicons name={iconName as string} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={StudentHomeScreen} options={{ headerShown: false }}/>
      <Tab.Screen name="Exercises" component={StudentExerciseScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default StudentNavigator;
