import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePremiumFeatures } from '../contexts/PremiumFeaturesContext';
import { useCelebrations } from '../contexts/CelebrationContext';
import { useStudentStats, useExerciseSubmission, useXpTracking, useMascot } from '../hooks/useApiData';
import XPCrystalsPremium from '../components/XPCrystalsPremium';
import MicroInteraction from '../components/MicroInteractions';
import AnimatedSection from '../components/ui/AnimatedSection';

const ExercisePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentExercise = location.state?.exercise;

  const { student } = useAuth();
  const { data: statsData } = useStudentStats();
  const { submitExercise } = useExerciseSubmission();
  const { addXp } = useXpTracking();
  const { updateEmotion: updateMascotEmotion } = useMascot();
  const { checkForCelebrations } = useCelebrations();
  
  // Use global premium features
  const { 
    setMascotEmotion, 
    setMascotMessage, 
    triggerParticles,
    addXP: addGlobalXP,
    currentXP,
    maxXP,
    level
  } = usePremiumFeatures();

  // Local state for showing XP after exercise completion
  const [showXPAfterCompletion, setShowXPAfterCompletion] = useState(false);

  const studentData = useMemo(() => ({
    stars: statsData?.stats?.totalCorrectAnswers || 0,
  }), [statsData]);

  const handleAnswerSubmit = async (answer: any, isCorrect: boolean) => {
    const startTime = Date.now();

    try {
      if (isCorrect) {
        setMascotEmotion('celebrating');
        setMascotMessage('BRAVO ! Tu as réussi ! 🎉');
        
        // Use global particle system
        triggerParticles('success', 2000);

        const exerciseResult = {
          score: 100,
          timeSpent: Math.floor((Date.now() - startTime) / 1000),
          completed: true,
          answerGiven: answer?.toString()
        };

        const submission = await submitExercise(currentExercise.id, exerciseResult);

        if (submission.success) {
          await addXp(submission.xpEarned || 15);
          // Add XP to global system for exercise completion
          addGlobalXP(submission.xpEarned || 15, 'exercise');
          
          // Trigger contextual celebrations based on performance
          checkForCelebrations({
            score: 100,
            timeSpent: Math.floor((Date.now() - startTime) / 1000),
            difficulty: currentExercise.difficulty || 'Moyen',
            isCorrect: true,
            xpGained: submission.xpEarned || 15,
            streakBefore: student?.currentStreak || 0,
            streakAfter: (student?.currentStreak || 0) + 1
          }, {
            totalExercises: statsData?.stats?.totalExercises || 1,
            correctAnswers: (statsData?.stats?.totalCorrectAnswers || 0) + 1,
            currentLevel: level,
            previousLevel: Math.max(1, level - (submission.masteryLevelChanged ? 1 : 0)) // Detect level ups properly
          });
          
          setShowXPAfterCompletion(true);
        }

        await updateMascotEmotion('excellent', 'exercise_complete');

        setTimeout(() => {
          navigate('/');
          setMascotEmotion('happy');
          setMascotMessage('Prêt pour le prochain défi ?');
        }, 3000);
      } else {
        setMascotEmotion('thinking');
        setMascotMessage('Essaie encore, tu vas y arriver ! 💪');
        await updateMascotEmotion('poor', 'mistake_made');
      }
    } catch (error) {
      console.error('Error handling answer submission:', error);
    }
  };

  if (!currentExercise) {
    // Automatically redirect to homepage if no exercise data
    navigate('/', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      {/* Show XP System only after exercise completion */}
      {showXPAfterCompletion && (
        <div className="fixed top-6 left-6 z-40">
          <XPCrystalsPremium
            currentXP={currentXP}
            maxXP={maxXP}
            level={level}
            onLevelUp={(newLevel) => {
              setMascotEmotion('excited');
              setMascotMessage(`Niveau ${newLevel} ! 🎉`);
            }}
            studentName={student?.prenom || 'Élève'}
            achievements={[
              'Exercice complété avec succès !',
              'Bonne réponse !',
              'Progression excellente !'
            ]}
          />
        </div>
      )}

      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <MicroInteraction
          type="button"
          intensity="medium"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 hover:bg-white transition-all duration-300 border border-gray-200/30 shadow-md hover:shadow-lg"
        >
          <Home className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-700">Accueil</span>
        </MicroInteraction>

        <h2 className="text-2xl font-bold text-gray-800">Exercice</h2>

        <div className="flex items-center space-x-4">
          <Star className="w-6 h-6 text-yellow-500" />
          <span className="font-bold">{studentData.stars}</span>
        </div>
      </motion.div>

      <motion.div
        className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-2xl mx-auto"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h3 className="text-xl font-bold text-center mb-6">{currentExercise.question}</h3>

        {currentExercise.options && (
          <div className="space-y-4">
            {currentExercise.options.map((option: string, index: number) => (
              <motion.button
                key={index}
                onClick={() => handleAnswerSubmit(option, option === (currentExercise.correctAnswer || currentExercise.answer))}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 text-left"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                {String.fromCharCode(65 + index)}. {option}
              </motion.button>
            ))}
          </div>
        )}

        {!currentExercise.options && (
          <div className="text-center">
            <div className="text-4xl font-bold mb-6">{currentExercise.question}</div>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                onClick={() => handleAnswerSubmit('correct', true)}
                className="bg-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✓ Correct
              </motion.button>
              <motion.button
                onClick={() => handleAnswerSubmit('incorrect', false)}
                className="bg-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✗ Test Erreur
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ExercisePage;
