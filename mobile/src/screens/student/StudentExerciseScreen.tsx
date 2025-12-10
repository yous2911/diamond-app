import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Slider from '@react-native-community/slider';

// Mobile versions of hooks
import { useAuth } from '../../contexts/AuthContext';
import { usePremiumFeatures } from '../../contexts/PremiumFeaturesContext';
import { useStudentStats, useExerciseSubmission, useXpTracking, useMascot } from '../../hooks/useApiData';
import XPCrystalsMobile from '../../components/premium/XPCrystalsMobile';
import { User } from '../../types/auth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ExerciseScreenProps {
  route: {
    params: {
      exercise: any;
    };
  };
}

const StudentExerciseScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const currentExercise = route.params?.exercise;

  const { student } = useAuth();
  const { data: statsData } = useStudentStats(student?.id || '');
  const { mutate: submitExercise } = useExerciseSubmission();
  const { refetch: addXp } = useXpTracking(student?.id || '');
  const { data: mascotData, refetch: updateMascotEmotion } = useMascot();

  // Global premium features
  const {
    setMascotEmotion,
    setMascotMessage,
    triggerParticles,
    addXP: addGlobalXP,
    currentXP,
    maxXP,
    level
  } = usePremiumFeatures();

  // Local state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [confidenceLevel, setConfidenceLevel] = useState(50); // 0-100 scale
  const [showResults, setShowResults] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showXPAfterCompletion, setShowXPAfterCompletion] = useState(false);
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const confidenceAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const studentData = useMemo(() => ({
    stars: statsData?.stats?.totalCorrectAnswers || 0,
  }), [statsData]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);

    // Animate confidence slider when answer is selected
    Animated.sequence([
      Animated.timing(confidenceAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(confidenceAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleSubmit = async () => {
    if (!selectedAnswer || exerciseCompleted) return;

    const startTime = Date.now();
    const correctAnswer = currentExercise.correctAnswer || currentExercise.answer;
    const answeredCorrectly = selectedAnswer === correctAnswer;

    setIsCorrect(answeredCorrectly);
    setShowResults(true);
    setExerciseCompleted(true);

    try {
      if (answeredCorrectly) {
        setMascotEmotion('celebrating');
        setMascotMessage('BRAVO ! Tu as réussi ! 🎉');

        // Trigger particles for correct answer
        triggerParticles();

        // Calculate XP based on confidence level
        const baseXP = 15;
        const confidenceBonus = Math.floor((confidenceLevel / 100) * 10);
        const totalXP = baseXP + confidenceBonus;

        const exerciseResult = {
          score: 100,
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
          completed: true,
          answerGiven: selectedAnswer,
          confidenceLevel: confidenceLevel // New field for SuperMemo integration
        };

        const submission = await submitExercise({ exerciseId: currentExercise.id, answer: exerciseResult });

        if (submission && submission.success) {
          // await addXp(totalXP); // refetch doesn't take args in our mock implementation
          addXp();
          addGlobalXP(totalXP);
          setShowXPAfterCompletion(true);
        }

        // await updateMascotEmotion('excellent', 'exercise_complete'); // refetch doesn't take args
        updateMascotEmotion();

        // Return to home after delay
        setTimeout(() => {
          navigation.navigate('Home');
          setMascotEmotion('happy');
          setMascotMessage('Prêt pour le prochain défi ?');
        }, 4000);
      } else {
        setMascotEmotion('thinking');
        setMascotMessage('Essaie encore, tu vas y arriver ! 💪');
        // await updateMascotEmotion('poor', 'mistake_made');
        updateMascotEmotion();

        // Allow retry after 2 seconds
        setTimeout(() => {
          setShowResults(false);
          setSelectedAnswer(null);
          setExerciseCompleted(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error handling answer submission:', error);
    }
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence < 25) return 'Pas sûr 😕';
    if (confidence < 50) return 'Un peu sûr 🤔';
    if (confidence < 75) return 'Assez sûr 😊';
    return 'Très sûr ! 😄';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence < 25) return '#EF4444'; // Red
    if (confidence < 50) return '#F59E0B'; // Orange
    if (confidence < 75) return '#10B981'; // Green
    return '#059669'; // Dark green
  };

  if (!currentExercise) {
    navigation.navigate('Home');
    return null;
  }

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
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.homeIcon}>🏠</Text>
          <Text style={styles.homeText}>Accueil</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Exercice</Text>

        <View style={styles.statsContainer}>
          <Text style={styles.starIcon}>⭐</Text>
          <Text style={styles.statsText}>{studentData.stars}</Text>
        </View>
      </View>

      {/* Show XP System only after exercise completion */}
      {showXPAfterCompletion && (
        <View style={styles.xpContainer}>
          <XPCrystalsMobile
            currentXP={currentXP}
            maxXP={maxXP}
            level={level}
            onLevelUp={(newLevel) => {
              setMascotEmotion('excited');
              setMascotMessage(`Niveau ${newLevel} ! 🎉`);
            }}
            studentName={student?.prenom || student?.name || 'Élève'}
            achievements={[
              'Exercice complété avec succès !',
              'Bonne réponse !',
              'Progression excellente !'
            ]}
          />
        </View>
      )}

      {/* Main Exercise Container */}
      <Animated.View
        style={[
          styles.exerciseContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentExercise.question}</Text>
        </View>

        {/* Answer Options */}
        {currentExercise.options && (
          <View style={styles.optionsContainer}>
            {currentExercise.options.map((option: string, index: number) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedAnswer === option && styles.selectedOption,
                  showResults && option === (currentExercise.correctAnswer || currentExercise.answer) && styles.correctOption,
                  showResults && selectedAnswer === option && selectedAnswer !== (currentExercise.correctAnswer || currentExercise.answer) && styles.incorrectOption
                ]}
                onPress={() => !exerciseCompleted && handleAnswerSelect(option)}
                disabled={exerciseCompleted}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedAnswer === option
                      ? ['#8B5CF6', '#EC4899']
                      : ['#F3F4F6', '#E5E7EB']
                  }
                  style={styles.optionGradient}
                >
                  <Text style={[
                    styles.optionText,
                    selectedAnswer === option && styles.selectedOptionText
                  ]}>
                    {String.fromCharCode(65 + index)}. {option}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Confidence Slider */}
        {selectedAnswer && !showResults && (
          <Animated.View
            style={[
              styles.confidenceContainer,
              { transform: [{ scale: confidenceAnim }] }
            ]}
          >
            <Text style={styles.confidenceTitle}>À quel point es-tu sûr(e) de ta réponse ?</Text>
            <Text style={[styles.confidenceLevel, { color: getConfidenceColor(confidenceLevel) }]}>
              {getConfidenceText(confidenceLevel)} ({confidenceLevel}%)
            </Text>

            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={confidenceLevel}
              onValueChange={setConfidenceLevel}
              minimumTrackTintColor={getConfidenceColor(confidenceLevel)}
              maximumTrackTintColor="#E5E7EB"
            />

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>Pas sûr(e)</Text>
              <Text style={styles.sliderLabel}>Très sûr(e)</Text>
            </View>
          </Animated.View>
        )}

        {/* Submit Button */}
        {selectedAnswer && !showResults && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>Valider ma réponse</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Results */}
        {showResults && (
          <View style={[styles.resultsContainer, isCorrect ? styles.correctResult : styles.incorrectResult]}>
            <Text style={styles.resultEmoji}>{isCorrect ? '🎉' : '😔'}</Text>
            <Text style={styles.resultText}>
              {isCorrect ? 'Excellente réponse !' : 'Ce n\'est pas la bonne réponse'}
            </Text>
            {isCorrect && (
              <Text style={styles.bonusText}>
                +{15 + Math.floor((confidenceLevel / 100) * 10)} XP
                {confidenceLevel > 75 && ' (Bonus confiance !)'}
              </Text>
            )}
            {!isCorrect && (
              <Text style={styles.retryText}>Tu peux réessayer dans un instant !</Text>
            )}
          </View>
        )}
      </Animated.View>
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
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  homeIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  homeText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  starIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  statsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  xpContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 50,
  },
  exerciseContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  selectedOption: {
    transform: [{ scale: 1.02 }],
  },
  correctOption: {
    borderWidth: 3,
    borderColor: '#10B981',
  },
  incorrectOption: {
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  optionGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'left',
  },
  selectedOptionText: {
    color: 'white',
  },
  confidenceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  confidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  confidenceLevel: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  submitButton: {
    borderRadius: 16,
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
  submitGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  resultsContainer: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  correctResult: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  incorrectResult: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  resultEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  bonusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
  },
  retryText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default StudentExerciseScreen;
