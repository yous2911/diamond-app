import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';

// Import MascotEmotion from shared context definition if possible,
// or redefine to match what's used in the app.
// It seems `MascotEmotion` in PremiumFeaturesContext includes 'celebrating'.
export type MascotEmotion = 'happy' | 'sad' | 'thinking' | 'excited' | 'sleepy' | 'celebrating';

interface MascotMobile3DProps {
  emotion?: MascotEmotion;
  message?: string;
  onInteraction?: () => void;
}

const MascotMobile3D: React.FC<MascotMobile3DProps> = ({
  emotion = 'happy',
  message,
  onInteraction,
}) => {
  // Map emotions to paths
  const eyePath = {
    happy: 'M10 20 Q15 25 20 20',
    sad: 'M10 20 Q15 15 20 20',
    thinking: 'M10 20 L20 20',
    excited: 'M10 20 Q15 25 20 20',
    sleepy: 'M10 20 L20 20',
    celebrating: 'M10 20 Q15 25 20 20', // Same as excited for now
  };

  const mouthPath = {
    happy: 'M30 65 Q40 75 50 65',
    sad: 'M30 65 Q40 55 50 65',
    thinking: 'M30 65 L50 65',
    excited: 'M30 65 Q40 80 50 65',
    sleepy: 'M30 65 Q40 70 50 65',
    celebrating: 'M30 65 Q40 80 50 65', // Same as excited for now
  };

  // Safe fallback if emotion is not in the map (e.g. if new emotions added)
  const currentMouthPath = mouthPath[emotion] || mouthPath.happy;

  return (
    <TouchableOpacity onPress={onInteraction} style={styles.container}>
      <Svg height="150" width="150" viewBox="0 0 80 80">
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor="#80ed99" stopOpacity="1" />
            <Stop offset="100%" stopColor="#57cc99" stopOpacity="1" />
          </RadialGradient>
        </Defs>
        {/* Body */}
        <Circle cx="40" cy="40" r="35" fill="url(#grad)" />

        {/* Eyes */}
        <Circle cx="25" cy="35" r="5" fill="white" />
        <Circle cx="55" cy="35" r="5" fill="white" />
        <Circle cx="25" cy="35" r="2" fill="black" />
        <Circle cx="55" cy="35" r="2" fill="black" />

        {/* Mouth */}
        <Path d={currentMouthPath} stroke="black" strokeWidth="2" fill="none" />
      </Svg>
      {message && (
        <View style={styles.messageBubble}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MascotMobile3D;
