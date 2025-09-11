import React, { useState, useMemo } from 'react';
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
  useCompetences,
  useExercisesByLevel,
  useMascot,
  useSessionManagement,
  useStudentStats,
  useXpTracking
} from '../../hooks/useApiData';

// Mobile components (converted from web versions)
import DiamondMobileInterface from '../../components/DiamondMobileInterface';
import XPCrystalsMobile from '../../components/premium/XPCrystalsMobile';
import MascotMobile3D from '../../components/MascotMobile3D';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const StudentHomeScreen = () => {
  const navigation = useNavigation();
  const { student, logout } = useAuth();

  // Debug logging (same as web)
  console.log('🏠 HomeScreen loaded for student:', student?.prenom);

  const {
    setMascotEmotion,
    setMascotMessage,
    addXP,
    triggerParticles,
    soundEnabled,
    setSoundEnabled
  } = usePremiumFeatures();

  // Same hooks as web version
  const { data: competencesData } = useCompetences();
  const { data: exercisesData } = useExercisesByLevel(student?.niveau || 'CP');
  const { data: statsData } = useStudentStats();
  const { updateEmotion: updateMascotEmotion } = useMascot();
  const { startSession, endSession, data: activeSessionData } = useSessionManagement();
  const { currentXp, currentLevel, addXp } = useXpTracking();

  // State for mobile-specific features
  const [selectedMascot, setSelectedMascot] = useState<'dragon' | 'fairy' | 'robot'>('dragon');
  const [showMascotSelector, setShowMascotSelector] = useState(false);
  const [equippedItems, setEquippedItems] = useState<string[]>(['golden_crown', 'magic_cape']);
  const [showWardrobe, setShowWardrobe] = useState(false);

  const studentData = useMemo(() => ({
    prenom: student?.prenom || 'Élève',
    niveau: student?.niveau || 'CP',
    stars: statsData?.stats?.totalCorrectAnswers || 0,
    hearts: student?.heartsRemaining || 3,
    streak: student?.currentStreak || 0,
    currentXP: currentXp,
    maxXP: 100 + (currentLevel * 20),
    level: currentLevel
  }), [student, statsData, currentXp, currentLevel]);

  // Same subjects logic as web (using backend data)
  const subjects = useMemo(() => {
    if (exercisesData && exercisesData.length > 0) {
      return exercisesData.map((exercise: any) => ({
        id: `subject-${exercise.matiere}`,
        name: exercise.matiere === 'mathematiques' ? 'Mathématiques' :
              exercise.matiere === 'francais' ? 'Français' : 'Sciences',
        emoji: exercise.matiere === 'mathematiques' ? '🔢' :
               exercise.matiere === 'francais' ? '📚' : '🔬',
        exercises: [exercise],
        gradient: exercise.matiere === 'mathematiques' ? ['#3B82F6', '#06B6D4'] :
                 exercise.matiere === 'francais' ? ['#10B981', '#059669'] : ['#8B5CF6', '#EC4899']
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

    await updateMascotEmotion('good', 'exercise_complete').catch(console.warn);

    if (!activeSessionData?.hasActiveSession) {
      await startSession(subject.competences?.map((c: any) => c.code) || []).catch(console.warn);
    }

    if (subject.exercises.length > 0) {
      const randomExercise = subject.exercises[Math.floor(Math.random() * subject.exercises.length)];
      console.log('🎯 HomeScreen - Navigating to exercise:', randomExercise);

      // React Native navigation instead of web router
      navigation.navigate('Exercise', { exercise: randomExercise });
    } else {
      console.log('🎯 HomeScreen - No exercises available');
      setMascotEmotion('sleepy');
      setMascotMessage('Cette matière arrive bientôt ! 🚧');
    }
  };

  const handleLogout = async () => {
    if (activeSessionData?.hasActiveSession && activeSessionData.session) {
      await endSession(activeSessionData.session.id).catch(console.error);
    }
    await logout();
  };

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
          <TouchableOpacity
            style={styles.soundButton}
            onPress={() => setSoundEnabled(!soundEnabled)}
          >
            <Text style={styles.soundEmoji}>
              {soundEnabled ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>
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
            onLevelUp={(newLevel) => {
              setMascotEmotion('excited');
              setMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
            }}
            studentName={studentData.prenom}
          />
        </View>

        {/* Subjects Grid */}
        <View style={styles.subjectsGrid}>
          {subjects.map((subject, index) => (
            <TouchableOpacity
              key={subject.id}
              style={styles.subjectCard}
              onPress={() => handleSubjectClick(subject)}
              activeOpacity={0.8}
            >
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
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Buttons */}
      <TouchableOpacity
        style={[styles.fab, styles.leaderboardFab]}
        onPress={() => navigation.navigate('Leaderboard')}
      >
        <Text style={styles.fabEmoji}>🏆</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.fab, styles.logoutFab]}
        onPress={handleLogout}
      >
        <Text style={styles.fabEmoji}>🚪</Text>
      </TouchableOpacity>

      {/* Mobile Mascot */}
      <MascotMobile3D
        emotion={mascotEmotion}
        message={mascotMessage}
        onInteraction={() => {
          setMascotEmotion('excited');
          setMascotMessage('Tu es fantastique ! ✨');
        }}
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
  fabEmoji: {
    fontSize: 24,
  },
});

export default StudentHomeScreen;
