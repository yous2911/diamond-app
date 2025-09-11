import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ParentLogin = () => {
  return (
    <View style={styles.container}>
      <Text>ParentLogin Screen</Text>
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

export default ParentLogin;
