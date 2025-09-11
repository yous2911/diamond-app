import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChildProgressScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Parent ChildProgressScreen</Text>
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

export default ChildProgressScreen;
