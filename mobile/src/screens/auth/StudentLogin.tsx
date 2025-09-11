import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuthStore from '../../store/authStore';
import { loginWithStudentName } from '../../services/auth';

type FormData = {
  name: string;
};

const StudentLogin = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = React.useState(false);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const user = await loginWithStudentName(data.name);
      login(user);
    } catch (error) {
      Alert.alert('Login Failed', 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

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

      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            placeholder="Enter your name"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
        name="name"
        rules={{ required: 'Name is required' }}
      />
      {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

      {isLoading ? (
        <ActivityIndicator size="large" color="#6366f1" />
      ) : (
        <Button title="Let's Go!" onPress={handleSubmit(onSubmit)} />
      )}
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
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 10,
  },
});

export default StudentLogin;
