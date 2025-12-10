import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Alert, Platform } from 'react-native';

export const usePermissions = () => {
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setHasMicrophonePermission(status === 'granted');
      } catch (error) {
        console.error('Erreur lors de la demande de permissions microphone:', error);
        setHasMicrophonePermission(false);
      }
    })();
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasMicrophonePermission(status === 'granted');
      if (status !== 'granted') {
         Alert.alert(
            "Permission refusée",
            "Vous devez autoriser l'accès au microphone pour utiliser cette fonctionnalité.",
            [{ text: "OK" }]
         );
      }
      return status === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande manuelle de permissions:', error);
      return false;
    }
  };

  return {
    hasMicrophonePermission,
    requestMicrophonePermission,
  };
};
