import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';

const SettingsScreen = () => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    // After logout, the AppNavigator should automatically navigate to the Auth flow.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {user && <Text style={styles.userInfo}>Logged in as {user.name}</Text>}

      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  userInfo: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
  }
});

export default SettingsScreen;
