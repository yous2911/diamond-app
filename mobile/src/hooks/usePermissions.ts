import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export interface PermissionsState {
  microphone: boolean;
  loading: boolean;
  requestMicrophone: () => Promise<boolean>;
}

export const usePermissions = (): PermissionsState => {
  const [microphone, setMicrophone] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      setMicrophone(status === 'granted');
    } catch (error) {
      console.error('Error checking permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestMicrophone = async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';
      setMicrophone(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  };

  return {
    microphone,
    loading,
    requestMicrophone,
  };
};
