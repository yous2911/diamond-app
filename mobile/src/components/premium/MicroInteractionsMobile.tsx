import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  Vibration,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useMagicalSounds } from '../../hooks/useMagicalSounds';

interface MicroInteractionsMobileProps {
  type: 'button' | 'card' | 'icon' | 'text';
  intensity: 'low' | 'medium' | 'high' | 'epic';
  onPress?: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
  hapticFeedback?: boolean;
  soundFeedback?: boolean;
  rippleEffect?: boolean;
  scaleEffect?: boolean;
  glowEffect?: boolean;
}

const MicroInteractionsMobile: React.FC<MicroInteractionsMobileProps> = ({
  type = 'button',
  intensity = 'medium',
  onPress,
  children,
  style,
  disabled = false,
  hapticFeedback = true,
  soundFeedback = true,
  rippleEffect = true,
  scaleEffect = true,
  glowEffect = false,
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const ripple = useSharedValue(0);
  const rotation = useSharedValue(0);
  const { playSparkleSound } = useMagicalSounds();

  // Haptic feedback patterns
  const hapticPatterns = {
    low: Platform.OS === 'ios' ? 'light' : 10,
    medium: Platform.OS === 'ios' ? 'medium' : 50,
    high: Platform.OS === 'ios' ? 'heavy' : 100,
    epic: Platform.OS === 'ios' ? 'heavy' : [0, 50, 100, 50],
  };

  // Trigger haptic feedback
  const triggerHaptic = () => {
    if (!hapticFeedback || disabled) return;

    const pattern = hapticPatterns[intensity];
    
    if (Platform.OS === 'ios') {
      // iOS haptic feedback
      const { HapticFeedback } = require('react-native-haptic-feedback');
      HapticFeedback.trigger(pattern);
    } else {
      // Android vibration
      if (Array.isArray(pattern)) {
        Vibration.vibrate(pattern);
      } else {
        Vibration.vibrate(pattern);
      }
    }
  };

  // Trigger sound feedback
  const triggerSound = () => {
    if (!soundFeedback || disabled) return;
    playSparkleSound();
  };

  // Handle press animation
  const handlePressIn = () => {
    if (disabled) return;

    // Scale down
    if (scaleEffect) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    }

    // Glow effect
    if (glowEffect) {
      glow.value = withTiming(1, { duration: 150 });
    }

    // Ripple effect
    if (rippleEffect) {
      ripple.value = withTiming(1, { duration: 300 });
    }

    // Rotation for epic intensity
    if (intensity === 'epic') {
      rotation.value = withSequence(
        withTiming(5, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }

    // Trigger feedback
    runOnJS(triggerHaptic)();
    runOnJS(triggerSound)();
  };

  const handlePressOut = () => {
    if (disabled) return;

    // Scale back up
    if (scaleEffect) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }

    // Glow fade
    if (glowEffect) {
      glow.value = withTiming(0, { duration: 300 });
    }

    // Ripple fade
    if (rippleEffect) {
      ripple.value = withTiming(0, { duration: 200 });
    }
  };

  const handlePress = () => {
    if (disabled || !onPress) return;
    
    // Epic celebration for high intensity
    if (intensity === 'epic') {
      scale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 15, stiffness: 300 })
      );
    }

    onPress();
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotateZ: `${rotation.value}deg` },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (!glowEffect) return {};
    
    const opacity = interpolate(glow.value, [0, 1], [0, 0.3]);
    const shadowRadius = interpolate(glow.value, [0, 1], [0, 20]);
    
    return {
      shadowOpacity: opacity,
      shadowRadius,
      elevation: glow.value * 10,
    };
  });

  const rippleStyle = useAnimatedStyle(() => {
    if (!rippleEffect) return {};
    
    const scale = interpolate(ripple.value, [0, 1], [0, 2]);
    const opacity = interpolate(ripple.value, [0, 1], [0.6, 0]);
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Get intensity-based colors
  const getIntensityColors = () => {
    switch (intensity) {
      case 'low':
        return { primary: '#6B7280', secondary: '#9CA3AF' };
      case 'medium':
        return { primary: '#3B82F6', secondary: '#60A5FA' };
      case 'high':
        return { primary: '#8B5CF6', secondary: '#A78BFA' };
      case 'epic':
        return { primary: '#EC4899', secondary: '#F472B6' };
      default:
        return { primary: '#3B82F6', secondary: '#60A5FA' };
    }
  };

  const colors = getIntensityColors();

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      disabled={disabled}
      style={[styles.container, style]}
    >
      <Animated.View style={[styles.content, animatedStyle, glowStyle]}>
        {children}
        
        {/* Ripple Effect */}
        {rippleEffect && (
          <Animated.View
            style={[
              styles.ripple,
              {
                backgroundColor: colors.primary,
              },
              rippleStyle,
            ]}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: -10,
    marginLeft: -10,
    zIndex: 0,
  },
});

export default MicroInteractionsMobile;


