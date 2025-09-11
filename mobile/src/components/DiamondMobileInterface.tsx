import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import XPCrystalsMobile from './premium/XPCrystalsMobile';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const DiamondMobileInterface = () => {
  const navigation = useNavigation();
  const shimmer = useSharedValue(0);

  React.useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = shimmer.value < 0.5 ? '#FFD700' : '#FFA500';
    return {
      backgroundColor,
    };
  });

  const handleStorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // navigation.navigate('PremiumStore'); // Assuming a PremiumStore screen exists
  };

  return (
    <View style={styles.container}>
        <LinearGradient
            colors={['#4c669f', '#3b5998', '#192f6a']}
            style={styles.background}
        />
      <XPCrystalsMobile
        currentXP={75}
        maxXP={100}
        level={3}
        studentName="Emma"
        achievements={['First Steps', 'Math Whiz']}
      />
      <AnimatedTouchableOpacity style={[styles.storeButton, animatedStyle]} onPress={handleStorePress}>
        <Text style={styles.storeButtonText}>💎 Premium Store</Text>
      </AnimatedTouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  storeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFD700',
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
  storeButtonText: {
    color: '#4B0082',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default DiamondMobileInterface;
