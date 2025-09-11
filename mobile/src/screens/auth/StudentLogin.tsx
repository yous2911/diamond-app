import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

const StudentLogin = () => {
  const [name, setName] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Kiddo!</Text>

      <TouchableOpacity style={styles.avatarContainer}>
        <Image
          source={{ uri: 'https://placekitten.com/150/150' }}
          style={styles.avatar}
        />
        <Text style={styles.avatarText}>Choose your Avatar</Text>
      </TouchableOpacity>

      <Input
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />

      <Button title="Let's Go!" onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  avatarText: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
});

export default StudentLogin;
