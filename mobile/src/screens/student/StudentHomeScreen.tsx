import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

// Mobile versions of your hooks (same API calls, different imports)
import { useAuth } from '../../contexts/AuthContext';
import { usePremiumFeatures } from '../../contexts/PremiumFeaturesContext';
import {
  useExercises,
  useMascot,
  useStudentStats,
} from '../../hooks/useApiData';

// Mobile components (converted from web versions)
import XPCrystalsMobile from '../../components/premium/XPCrystalsMobile';
import MascotMobile3D from '../../components/MascotMobile3D';

// NEW AAA MOBILE COMPONENTS
import AdvancedParticleEngineMobile from '../../components/premium/AdvancedParticleEngineMobile';
import MicroInteractionsMobile from '../../components/premium/MicroInteractionsMobile';
import CelebrationSystemMobile from '../../components/premium/CelebrationSystemMobile';
import WardrobeModalMobile from '../../components/premium/WardrobeModalMobile';
import { useGPUPerformanceMobile } from '../../hooks/useGPUPerformanceMobile';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const StudentHomeScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  // Debug logging (same as web)
  console.log('🏠 HomeScreen loaded for student:', user?.name);

  const { celebrations, mascotEmotions } = usePremiumFeatures();

  // Same hooks as web version
  const { data: exercisesData } = useExercises(user?.niveau || 'CP');
  const { data: statsData } = useStudentStats(user?.id || '');
  const { data: mascotData, updateEmotion: updateMascotEmotion } = useMascot();

  // State for mobile-specific features
  const [mascotEmotion, setMascotEmotion] = useState('happy');
  const [mascotMessage, setMascotMessage] = useState('Welcome!');
  const [showMascotSelector, setShowMascotSelector] = useState(false);
  const [equippedItems, setEquippedItems] = useState<string[]>(['crown', 'glasses']);
  const [showWardrobe, setShowWardrobe] = useState(false);
  
  // NEW AAA STATE
  const [showParticles, setShowParticles] = useState(true);
  const [particleType, setParticleType] = useState<'sparkle' | 'star' | 'magic' | 'crystal' | 'heart'>('sparkle');
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<'levelup' | 'achievement' | 'streak' | 'perfect'>('achievement');
  const [celebrationData, setCelebrationData] = useState<any>({});
  const [soundEnabled, setSoundEnabled] = useState(true);

  // GPU Performance Detection
  const {
    performanceData,
    shouldUseComplexAnimation,
    getOptimalParticleCount,
    enablePhysics,
    enableTrails,
    enableGlow,
    isHighEnd,
    isUltraEnd
  } = useGPUPerformanceMobile();

  const studentData = useMemo(() => ({
    prenom: user?.name || 'Élève',
    niveau: user?.niveau || 'CP',
    stars: statsData?.exercisesCompleted || 0,
    hearts: 3, // Mocked
    streak: 0, // Mocked
    currentXP: statsData?.totalXp || 0,
    maxXP: 100 + ((statsData?.level || 1) * 20),
    level: statsData?.level || 1
  }), [user, statsData]);

  // Same subjects logic as web (using backend data)
  const subjects = useMemo(() => {
    if (exercisesData && exercisesData.length > 0) {
      return exercisesData.map((exercise: any) => ({
        id: `subject-${exercise.type}`,
        name: exercise.type === 'math' ? 'Mathématiques' : 'Français',
        emoji: exercise.type === 'math' ? '🔢' : '📚',
        exercises: [exercise],
        gradient: exercise.type === 'math' ? ['#3B82F6', '#06B6D4'] : ['#10B981', '#059669']
      }));
    }
    // Fallback data same as web
    return [
      {
        id: 'mathematiques',
        name: 'Mathématiques',
        emoji: '🔢',
        gradient: ['#3B82F6', '#06B6D4'],
        exercises: [{
          id: 1,
          title: 'Addition magique',
          question: 'Combien font 5 + 3 ?',
          answer: '8',
          options: ['6', '7', '8', '9'],
          difficulty: 'Facile',
          xp: 50,
          completed: true,
          type: 'math'
        }]
      },
      // ... more subjects
    ];
  }, [exercisesData]);

  const handleSubjectClick = async (subject: any) => {
    console.log('🎯 HomeScreen - Subject clicked:', subject.name);

    setMascotEmotion('thinking');
    setMascotMessage("C'est parti pour une nouvelle aventure !");
    
    // Trigger particles
    setParticleType('sparkle');
    setShowParticles(true);

    if (subject.exercises.length > 0) {
      const randomExercise = subject.exercises[Math.floor(Math.random() * subject.exercises.length)];
      console.log('🎯 HomeScreen - Navigating to exercise:', randomExercise);

      // React Native navigation instead of web router
      navigation.navigate('StudentExercise', { exercise: randomExercise });
    } else {
      console.log('🎯 HomeScreen - No exercises available');
      setMascotEmotion('sleepy');
      setMascotMessage('Cette matière arrive bientôt ! 🚧');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // NEW AAA HANDLERS
  const handleLevelUp = useCallback((newLevel: number) => {
    setCelebrationType('levelup');
    setCelebrationData({ level: newLevel });
    setShowCelebration(true);
    setMascotEmotion('excited');
    setMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
    setParticleType('star');
  }, []);

  const handleAchievement = useCallback((achievement: string) => {
    setCelebrationType('achievement');
    setCelebrationData({ achievement });
    setShowCelebration(true);
    setMascotEmotion('excited');
    setMascotMessage('NOUVEAU SUCCÈS ! 🏆');
    setParticleType('heart');
  }, []);

  const handleMascotInteraction = useCallback(() => {
    setMascotEmotion('excited');
    setMascotMessage('Tu es fantastique ! ✨');
    setParticleType('magic');
  }, []);

  const handleEmotionalStateChange = useCallback((emotion: string) => {
    setMascotEmotion(emotion);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#8B5CF6" barStyle="light-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={['#8B5CF6', '#EC4899', '#3B82F6']}
        style={styles.backgroundGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.Text style={[styles.welcomeEmoji]}>🌟</Animated.Text>
          <View>
            <Text style={styles.welcomeTitle}>
              Bonjour {studentData.prenom} ! 👋
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Niveau {studentData.niveau} • Prêt pour l'aventure ?
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.statsBadge}>
            <Text style={styles.statsEmoji}>⭐</Text>
            <Text style={styles.statsText}>{studentData.stars}</Text>
          </View>
          <View style={styles.statsBadge}>
            <Text style={styles.statsEmoji}>❤️</Text>
            <Text style={styles.statsText}>{studentData.hearts}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* XP System */}
        <View style={styles.xpContainer}>
          <XPCrystalsMobile
            currentXP={studentData.currentXP}
            maxXP={studentData.maxXP}
            level={studentData.level}
            onLevelUp={handleLevelUp}
            studentName={studentData.prenom}
            achievements={['Premier exercice réussi !', 'Série de 5 exercices !', 'Niveau supérieur atteint !']}
          />
        </View>

        {/* Subjects Grid */}
        <View style={styles.subjectsGrid}>
          {subjects.map((subject, index) => (
            <MicroInteractionsMobile
              key={subject.id}
              type="card"
              intensity={isHighEnd ? 'high' : 'medium'}
              onPress={() => handleSubjectClick(subject)}
              hapticFeedback={true}
              soundFeedback={soundEnabled}
              rippleEffect={true}
              scaleEffect={true}
              glowEffect={enableGlow}
            >
              <View style={styles.subjectCard}>
                <LinearGradient
                  colors={subject.gradient}
                  style={styles.subjectGradient}
                >
                  <Text style={styles.subjectEmoji}>{subject.emoji}</Text>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectDescription}>
                    📚 {subject.exercises.length} exercices
                  </Text>
                </LinearGradient>
              </View>
            </MicroInteractionsMobile>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <MicroInteractionsMobile
        type="button"
        intensity="high"
        onPress={() => navigation.navigate('Leaderboard')}
        hapticFeedback={true}
        soundFeedback={soundEnabled}
        style={[styles.fab, styles.leaderboardFab]}
      >
        <Text style={styles.fabEmoji}>🏆</Text>
      </MicroInteractionsMobile>

      <MicroInteractionsMobile
        type="button"
        intensity="medium"
        onPress={handleLogout}
        hapticFeedback={true}
        soundFeedback={soundEnabled}
        style={[styles.fab, styles.logoutFab]}
      >
        <Text style={styles.fabEmoji}>🚪</Text>
      </MicroInteractionsMobile>

      {/* Wardrobe Button */}
      <MicroInteractionsMobile
        type="button"
        intensity="medium"
        onPress={() => setShowWardrobe(true)}
        hapticFeedback={true}
        soundFeedback={soundEnabled}
        style={[styles.fab, styles.wardrobeFab]}
      >
        <Text style={styles.fabEmoji}>👕</Text>
      </MicroInteractionsMobile>

      {/* Sound Toggle */}
      <MicroInteractionsMobile
        type="button"
        intensity="low"
        onPress={() => setSoundEnabled(!soundEnabled)}
        hapticFeedback={true}
        soundFeedback={false}
        style={[styles.fab, styles.soundFab]}
      >
        <Text style={styles.fabEmoji}>{soundEnabled ? '🔊' : '🔇'}</Text>
      </MicroInteractionsMobile>

      {/* Mobile Mascot */}
      <MascotMobile3D
        emotion={mascotEmotion}
        message={mascotMessage}
        onInteraction={handleMascotInteraction}
      />

      {/* AAA PARTICLE ENGINE */}
      {showParticles && performanceData && (
        <AdvancedParticleEngineMobile
          width={screenWidth}
          height={screenHeight}
          particleCount={getOptimalParticleCount()}
          particleType={particleType}
          behavior="normal"
          intensity={isUltraEnd ? 5 : isHighEnd ? 4 : 3}
          isActive={showParticles}
          emitterPosition={{ x: screenWidth / 2, y: screenHeight / 2 }}
          enablePhysics={enablePhysics}
          enableTrails={enableTrails}
          style={styles.particleEngine}
        />
      )}

      {/* CELEBRATION SYSTEM */}
      {showCelebration && (
        <CelebrationSystemMobile
          type={celebrationType}
          studentName={studentData.prenom}
          data={celebrationData}
          onComplete={() => setShowCelebration(false)}
        />
      )}

      {/* WARDROBE MODAL */}
      <WardrobeModalMobile
        selectedMascot="dragon"
        equippedItems={equippedItems}
        studentLevel={studentData.level}
        onItemEquip={(itemId) => setEquippedItems(prev => [...prev, itemId])}
        onItemUnequip={(itemId) => setEquippedItems(prev => prev.filter(id => id !== itemId))}
        onClose={() => setShowWardrobe(false)}
        visible={showWardrobe}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: screenHeight,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  welcomeEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 2,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  statsEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  statsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  soundButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  soundEmoji: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  xpContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  subjectCard: {
    width: (screenWidth - 60) / 2,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  subjectGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  subjectEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subjectDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  leaderboardFab: {
    bottom: 100,
    right: 20,
  },
  logoutFab: {
    bottom: 30,
    right: 20,
    backgroundColor: '#EF4444',
  },
  wardrobeFab: {
    bottom: 100,
    left: 20,
    backgroundColor: '#8B5CF6',
  },
  soundFab: {
    bottom: 170,
    right: 20,
    backgroundColor: '#6B7280',
  },
  fabEmoji: {
    fontSize: 24,
  },
  particleEngine: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
});

export default StudentHomeScreen;
