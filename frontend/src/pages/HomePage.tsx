import React, { useState, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, Volume2, VolumeX, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  useCompetences,
  useExercisesByLevel,
  useMascot,
  useSessionManagement,
  useStudentStats,
  useXpTracking
} from '../hooks/useApiData';
import NextLevelXPSystem from '../components/NextLevelXPSystem';

const HomePage = () => {
  const navigate = useNavigate();
  const { setMascotEmotion, setMascotMessage } = useOutletContext<any>();
  const { student, logout } = useAuth();

  // Hooks API
  const { data: competencesData } = useCompetences();
  const { data: exercisesData } = useExercisesByLevel(student?.niveau || 'CP');
  const { data: statsData } = useStudentStats();
  const { updateEmotion: updateMascotEmotion } = useMascot();
  const { startSession, endSession, data: activeSessionData } = useSessionManagement();
  const { currentXp, currentLevel, addXp } = useXpTracking();

  // This will be passed as props later
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  const subjects = useMemo(() => {
    const competences = competencesData || [];
    const mathCompetences = competences.filter(c => c.matiere === 'MA');
    const frenchCompetences = competences.filter(c => c.matiere === 'FR');

    return [
      {
        id: 'mathematiques',
        name: 'Mathématiques',
        emoji: '🔢',
        gradient: 'from-blue-400 via-blue-500 to-blue-600',
        shadowColor: 'shadow-blue-500/50',
        description: 'Compter, additionner, géométrie',
        competences: mathCompetences,
        exercises: exercisesData?.filter(ex =>
          mathCompetences.some(comp => comp.id === ex.competenceId)
        ) || []
      },
      {
        id: 'francais',
        name: 'Français',
        emoji: '📚',
        gradient: 'from-green-400 via-green-500 to-green-600',
        shadowColor: 'shadow-green-500/50',
        description: 'Lettres, mots, lecture',
        competences: frenchCompetences,
        exercises: exercisesData?.filter(ex =>
          frenchCompetences.some(comp => comp.id === ex.competenceId)
        ) || []
      }
    ];
  }, [competencesData, exercisesData]);

  const handleSubjectClick = async (subject: any) => {
    setMascotEmotion('thinking');
    setMascotMessage('C\'est parti pour une nouvelle aventure !');

    await updateMascotEmotion('good', 'exercise_complete').catch(console.warn);

    if (!activeSessionData?.hasActiveSession) {
      await startSession(subject.competences?.map((c: any) => c.code) || []).catch(console.warn);
    }

    if (subject.exercises.length > 0) {
      const randomExercise = subject.exercises[Math.floor(Math.random() * subject.exercises.length)];
      navigate('/exercise', { state: { exercise: randomExercise } });
    } else {
      setMascotEmotion('sleepy');
      setMascotMessage('Cette matière arrive bientôt ! 🚧');
    }
  };

  const handleLevelUp = (newLevel: number) => {
    setMascotEmotion('excited');
    setMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
    updateMascotEmotion('excellent', 'level_up').catch(console.warn);
  };

  const handleLogout = async () => {
    if (activeSessionData?.hasActiveSession && activeSessionData.session) {
      await endSession(activeSessionData.session.id).catch(console.error);
    }
    await logout();
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center space-x-4">
          <motion.div
            className="text-4xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🌟
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Bonjour {studentData.prenom} !</h1>
            <p className="text-gray-600">Niveau {studentData.niveau}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-white/80 rounded-full px-4 py-2">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
            <span className="font-bold text-gray-800">{studentData.stars}</span>
          </div>
          <div className="flex items-center bg-white/80 rounded-full px-4 py-2">
            <Heart className="w-6 h-6 text-red-500 mr-2" />
            <span className="font-bold text-gray-800">{studentData.hearts}</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-6 h-6 text-green-500" />
            ) : (
              <VolumeX className="w-6 h-6 text-gray-400" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </motion.div>

      <motion.div
        className="mb-8 flex justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <NextLevelXPSystem
          currentXP={studentData.currentXP}
          maxXP={studentData.maxXP}
          level={studentData.level}
          xpGained={15}
          bonusMultiplier={studentData.streak > 3 ? 2 : 1}
          streakActive={studentData.streak > 3}
          recentAchievements={['Premier exercice réussi!', 'Série de 5!']}
          onLevelUp={handleLevelUp}
          onMilestone={(milestone) => {
            setMascotEmotion('excited');
            setMascotMessage(`Progression: ${milestone}% !`);
          }}
          size="large"
          theme="magic"
          enablePhysics={true}
          interactive={true}
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-2 gap-6 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {subjects.map((subject, index) => (
          <motion.button
            key={subject.id}
            onClick={() => handleSubjectClick(subject)}
            className={`
              bg-gradient-to-br ${subject.gradient} p-8 rounded-3xl shadow-xl border-4 border-white/50
              hover:shadow-2xl transform hover:scale-105 transition-all duration-300
              ${subject.shadowColor}
            `}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <div className="text-center text-white">
              <div className="text-6xl mb-4 animate-float">{subject.emoji}</div>
              <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
              <p className="text-sm opacity-90">{subject.description}</p>
              <p className="text-xs opacity-75 mt-2">
                {subject.competences.length} compétences • {subject.exercises.length} exercices
              </p>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {activeSessionData?.hasActiveSession && (
        <motion.div
          className="mt-8 max-w-md mx-auto bg-blue-100 border border-blue-300 rounded-2xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <div className="text-blue-600 font-medium">📚 Session en cours</div>
            <div className="text-sm text-blue-500">
              {activeSessionData.session?.exercisesCompleted || 0} exercices complétés
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default HomePage;
