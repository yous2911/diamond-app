import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ParentHomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Parent HomeScreen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ParentHomeScreen;
