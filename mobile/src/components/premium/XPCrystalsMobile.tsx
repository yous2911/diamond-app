import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import Svg, { 
  Defs, 
  LinearGradient as SvgLinearGradient, 
  Stop, 
  Circle, 
  Path,
  Text as SvgText 
} from 'react-native-svg';
import { useMagicalSounds } from '../hooks/useMagicalSounds';

// =============================================================================
// 💎 MOBILE XP CRYSTALS WITH 3D PHYSICS
// =============================================================================
interface XPCrystalsMobileProps {
  currentXP: number;
  maxXP: number;
  level: number;
  onLevelUp?: (newLevel: number) => void;
  studentName?: string;
  achievements?: string[];
}

const { width: screenWidth } = Dimensions.get('window');
const crystalSize = Math.min(screenWidth * 0.7, 280);

const XPCrystalsMobile: React.FC<XPCrystalsMobileProps> = ({ 
  currentXP, 
  maxXP, 
  level, 
  onLevelUp,
  studentName = 'Élève',
  achievements = []
}) => {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showXPGain, setShowXPGain] = useState<number | null>(null);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const xpGainAnim = useRef(new Animated.Value(0)).current;
  
  const { playLevelUpFanfare, playSparkleSound } = useMagicalSounds();

  const progress = Math.min((displayXP / maxXP) * 100, 100);

  // XP gain animation (same logic as web version)
  useEffect(() => {
    if (currentXP > displayXP) {
      const difference = currentXP - displayXP;
      setShowXPGain(difference);
      playSparkleSound();
      
      // Mobile-optimized animation
      const duration = 1000;
      const steps = 30;
      const increment = difference / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setDisplayXP(prev => Math.min(prev + increment, currentXP));
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayXP(currentXP);
          setShowXPGain(null);
        }
      }, duration / steps);

      // XP gain floating animation
      Animated.sequence([
        Animated.timing(xpGainAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(xpGainAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        })
      ]).start();

      return () => clearInterval(timer);
    }
  }, [currentXP, displayXP, playSparkleSound, xpGainAnim]);

  // Level up detection
  useEffect(() => {
    if (displayXP >= maxXP && !isLevelingUp) {
      setIsLevelingUp(true);
      playLevelUpFanfare();
      
      // Epic level up animation
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.5,
            duration: 300,
            useNativeDriver: true,
          })
        ])
      ]).start(() => {
        if (onLevelUp) {
          onLevelUp(level + 1);
        }
        setIsLevelingUp(false);
      });
    }
  }, [displayXP, maxXP, isLevelingUp, level, onLevelUp, playLevelUpFanfare, scaleAnim, glowAnim]);

  // Continuous crystal rotation
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    );
    rotateAnimation.start();
    return () => rotateAnimation.stop();
  }, [rotateAnim]);

  // Continuous glow animation
  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, [glowAnim]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const xpGainTranslateY = xpGainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -50],
  });

  const xpGainOpacity = xpGainAnim.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.container}>
      {/* Level Badge */}
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>NIVEAU {level}</Text>
        <Text style={styles.levelSubtext}>{studentName}</Text>
      </View>

      {/* Main Crystal Container */}
      <Animated.View 
        style={[
          styles.crystalContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: rotateInterpolate }
            ],
            shadowOpacity: glowAnim,
          }
        ]}
      >
        <Svg width={crystalSize} height={crystalSize} viewBox="0 0 280 280">
          <Defs>
            {/* Crystal gradient */}
            <SvgLinearGradient id="crystalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.9" />
              <Stop offset="50%" stopColor="#EC4899" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0.9" />
            </SvgLinearGradient>
            
            {/* Progress gradient */}
            <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
              <Stop offset="50%" stopColor="#059669" stopOpacity="1" />
              <Stop offset="100%" stopColor="#047857" stopOpacity="1" />
            </SvgLinearGradient>

            {/* Glow effect */}
            <SvgLinearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FBBF24" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6" />
            </SvgLinearGradient>
          </Defs>
          
          {/* Outer crystal shell */}
          <Circle
            cx="140"
            cy="140"
            r="120"
            fill="url(#crystalGradient)"
            stroke="url(#glowGradient)"
            strokeWidth="4"
          />
          
          {/* Inner glow ring */}
          <Circle
            cx="140"
            cy="140"
            r="100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2"
          />
          
          {/* Progress ring */}
          <Circle
            cx="140"
            cy="140"
            r="90"
            fill="none"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="8"
          />
          <Circle
            cx="140"
            cy="140"
            r="90"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="8"
            strokeDasharray={`${progress * 5.65} 565`}
            strokeLinecap="round"
            transform="rotate(-90 140 140)"
          />
          
          {/* Center XP display */}
          <Circle
            cx="140"
            cy="140"
            r="60"
            fill="rgba(255, 255, 255, 0.9)"
          />
          
          {/* XP Text */}
          <SvgText
            x="140"
            y="135"
            fontSize="18"
            fill="#1F2937"
            textAnchor="middle"
            fontWeight="bold"
          >
            {Math.round(displayXP)} XP
          </SvgText>
          <SvgText
            x="140"
            y="155"
            fontSize="14"
            fill="#6B7280"
            textAnchor="middle"
          >
            {maxXP} XP max
          </SvgText>
        </Svg>

        {/* Crystal facets (decorative elements) */}
        <View style={[styles.facet, styles.facet1]} />
        <View style={[styles.facet, styles.facet2]} />
        <View style={[styles.facet, styles.facet3]} />
      </Animated.View>

      {/* XP Gain Floating Text */}
      {showXPGain && (
        <Animated.View
          style={[
            styles.xpGainContainer,
            {
              transform: [{ translateY: xpGainTranslateY }],
              opacity: xpGainOpacity,
            }
          ]}
        >
          <Text style={styles.xpGainText}>+{showXPGain} XP</Text>
        </Animated.View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              { width: `${progress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progress)}% • {maxXP - displayXP} XP jusqu'au niveau {level + 1}
        </Text>
      </View>

      {/* Achievements Preview */}
      {achievements.length > 0 && (
        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementsTitle}>🏆 Derniers succès</Text>
          {achievements.slice(0, 2).map((achievement, index) => (
            <Text key={index} style={styles.achievementText}>
              ✨ {achievement}
            </Text>
          ))}
        </View>
      )}

      {/* Level Up Overlay */}
      {isLevelingUp && (
        <View style={styles.levelUpOverlay}>
          <Text style={styles.levelUpText}>NIVEAU SUPÉRIEUR!</Text>
          <Text style={styles.levelUpLevel}>NIVEAU {level + 1}</Text>
          <Text style={styles.levelUpCongrats}>Félicitations {studentName}! 🎉</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  levelBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  levelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  levelSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  crystalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowRadius: 20,
    elevation: 10,
  },
  facet: {
    position: 'absolute',
    width: 20,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
  },
  facet1: {
    top: 50,
    left: 80,
    transform: [{ rotate: '45deg' }],
  },
  facet2: {
    bottom: 80,
    right: 60,
    transform: [{ rotate: '-30deg' }],
  },
  facet3: {
    top: 120,
    right: 40,
    transform: [{ rotate: '60deg' }],
  },
  xpGainContainer: {
    position: 'absolute',
    top: 80,
    alignItems: 'center',
  },
  xpGainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  progressBarContainer: {
    width: crystalSize,
    marginTop: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  achievementsContainer: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(249, 250, 251, 0.9)',
    padding: 12,
    borderRadius: 12,
    width: crystalSize,
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  achievementText: {
    fontSize: 11,
    color: '#4B5563',
    marginBottom: 2,
  },
  levelUpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 92, 246, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  levelUpText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  levelUpLevel: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FBBF24',
    textAlign: 'center',
    marginBottom: 12,
  },
  levelUpCongrats: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});

export default XPCrystalsMobile;