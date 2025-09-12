import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface DiamondMobileInterfaceProps {
  diamondCount: number;
  onPress?: () => void;
}

const DiamondMobileInterface: React.FC<DiamondMobileInterfaceProps> = ({ diamondCount, onPress }) => {
  return (
    <View style={styles.container}>
      <Svg height="100" width="100" viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#a2d2ff" stopOpacity="1" />
            <Stop offset="1" stopColor="#bde0fe" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Path
          d="M50 0 L100 50 L50 100 L0 50 Z"
          fill="url(#grad)"
          stroke="#a2d2ff"
          strokeWidth="2"
        />
        <Path
          d="M50 0 L25 50 L50 100 L75 50 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
        <Path
          d="M0 50 L100 50"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.diamondText}>{diamondCount}</Text>
        <Text style={styles.subText}>Diamonds</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f0f8ff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  textContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  diamondText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0077b6',
  },
  subText: {
    fontSize: 14,
    color: '#023e8a',
  },
});

export default DiamondMobileInterface;
