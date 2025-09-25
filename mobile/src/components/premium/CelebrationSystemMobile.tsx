import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useMagicalSounds } from '../../hooks/useMagicalSounds';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CelebrationSystemMobileProps {
  type: 'levelup' | 'achievement' | 'streak' | 'perfect' | 'first_complete' | 'milestone';
  studentName?: string;
  data?: {
    level?: number;
    achievement?: string;
    streak?: number;
    score?: number;
    milestone?: string;
  };
  onComplete?: () => void;
  duration?: number;
}

const CelebrationSystemMobile: React.FC<CelebrationSystemMobileProps> = ({
  type = 'achievement',
  studentName = 'Élève',
  data = {},
  onComplete,
  duration = 3000,
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const rotation = useSharedValue(0);
  const confettiY = useSharedValue(-100);
  const confettiRotation = useSharedValue(0);
  const { playLevelUpFanfare } = useMagicalSounds();

  // Celebration configurations
  const celebrations = {
    levelup: {
      emoji: '🎉',
      title: 'NIVEAU SUPÉRIEUR!',
      subtitle: `Niveau ${data.level || 'Nouveau'}`,
      message: `Félicitations ${studentName}!`,
      colors: ['#8B5CF6', '#EC4899', '#3B82F6'],
      confetti: ['🎊', '⭐', '✨', '🌟', '💫'],
    },
    achievement: {
      emoji: '🏆',
      title: 'NOUVEAU SUCCÈS!',
      subtitle: data.achievement || 'Succès débloqué',
      message: `Bravo ${studentName}!`,
      colors: ['#F59E0B', '#FBBF24', '#FCD34D'],
      confetti: ['🏆', '🥇', '⭐', '✨', '🎖️'],
    },
    streak: {
      emoji: '🔥',
      title: 'SÉRIE INCROYABLE!',
      subtitle: `${data.streak || 0} jours consécutifs`,
      message: `Tu es en feu ${studentName}!`,
      colors: ['#EF4444', '#F97316', '#F59E0B'],
      confetti: ['🔥', '⚡', '💥', '✨', '🌟'],
    },
    perfect: {
      emoji: '💯',
      title: 'PARFAIT!',
      subtitle: `${data.score || 100}% de réussite`,
      message: `Incroyable ${studentName}!`,
      colors: ['#10B981', '#059669', '#047857'],
      confetti: ['💯', '🎯', '⭐', '✨', '🏆'],
    },
    first_complete: {
      emoji: '🎊',
      title: 'PREMIER EXERCICE!',
      subtitle: 'Tu as commencé ton aventure',
      message: `Bienvenue ${studentName}!`,
      colors: ['#3B82F6', '#1D4ED8', '#1E40AF'],
      confetti: ['🎊', '🎉', '⭐', '✨', '🌟'],
    },
    milestone: {
      emoji: '🎯',
      title: 'ÉTAPE FRANCHIE!',
      subtitle: data.milestone || 'Objectif atteint',
      message: `Tu progresses ${studentName}!`,
      colors: ['#8B5CF6', '#7C3AED', '#6D28D9'],
      confetti: ['🎯', '🏆', '⭐', '✨', '💎'],
    },
  };

  const config = celebrations[type];

  // Start celebration animation
  useEffect(() => {
    // Play sound
    playLevelUpFanfare();

    // Main celebration animation
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    rotation.value = withSequence(
      withTiming(5, { duration: 200 }),
      withTiming(-5, { duration: 200 }),
      withTiming(0, { duration: 200 })
    );

    // Confetti animation
    confettiY.value = withTiming(screenHeight + 100, { duration: 2000 });
    confettiRotation.value = withTiming(360, { duration: 2000 });

    // Auto-hide after duration
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, () => {
        runOnJS(onComplete || (() => {}))();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [opacity, scale, rotation, confettiY, confettiRotation, playLevelUpFanfare, onComplete, duration]);

  // Main celebration animated style
  const celebrationStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { rotateZ: `${rotation.value}deg` },
      ],
    };
  });

  // Confetti animated style
  const confettiStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: confettiY.value },
        { rotateZ: `${confettiRotation.value}deg` },
      ],
    };
  });

  // Render confetti
  const renderConfetti = () => {
    return config.confetti.map((emoji, index) => (
      <Animated.Text
        key={index}
        style={[
          styles.confetti,
          {
            left: (screenWidth / config.confetti.length) * index,
            animationDelay: `${index * 100}ms`,
          },
          confettiStyle,
        ]}
      >
        {emoji}
      </Animated.Text>
    ));
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      {/* Confetti */}
      {renderConfetti()}

      {/* Main Celebration */}
      <Animated.View style={[styles.celebration, celebrationStyle]}>
        <View style={[styles.celebrationCard, { backgroundColor: config.colors[0] }]}>
          {/* Emoji */}
          <Text style={styles.emoji}>{config.emoji}</Text>

          {/* Title */}
          <Text style={styles.title}>{config.title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{config.subtitle}</Text>

          {/* Message */}
          <Text style={styles.message}>{config.message}</Text>

          {/* Decorative elements */}
          <View style={styles.decorations}>
            <Text style={styles.decoration}>✨</Text>
            <Text style={styles.decoration}>⭐</Text>
            <Text style={styles.decoration}>✨</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    top: -50,
    fontSize: 24,
    zIndex: 1,
  },
  celebration: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  celebrationCard: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    minWidth: screenWidth * 0.8,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
  },
  decorations: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  decoration: {
    fontSize: 20,
    opacity: 0.8,
  },
});

export default CelebrationSystemMobile;


