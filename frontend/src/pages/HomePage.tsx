import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePremiumFeatures } from '../contexts/PremiumFeaturesContext';
import {
  useCompetences,
  useExercisesByLevel,
  useMascot,
  useSessionManagement,
  useStudentStats,
  useXpTracking
} from '../hooks/useApiData';
import DiamondCP_CE2Interface from '../components/DiamondCP_CE2Interface';
import XPCrystalsPremium from '../components/XPCrystalsPremium';
import MemorableEntrance from '../components/MemorableEntrance';
import MicroInteraction from '../components/MicroInteractions';
import { useGPUPerformance } from '../hooks/useGPUPerformance';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import WardrobeModal from '../components/WardrobeModal';

const HomePage = () => {
  const navigate = useNavigate();
  const { student, logout } = useAuth();
  
  // HomePage loaded for student
  
  // Ensure we're on the correct route
  React.useEffect(() => {
    if (window.location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [navigate]);
  const { 
    setMascotEmotion, 
    setMascotMessage, 
    triggerParticles
  } = usePremiumFeatures();

  // Hooks API
  const { data: exercisesData, isLoading: isLoadingExercises, error: exercisesError } = useExercisesByLevel(student?.niveau || 'CP');
  const { data: statsData } = useStudentStats();
  const { updateEmotion: updateMascotEmotion } = useMascot();
  const { startSession, endSession, data: activeSessionData } = useSessionManagement();
  const { currentXp, currentLevel } = useXpTracking();

  // Local state for wardrobe and memorable moments
  const [equippedItems, setEquippedItems] = useState<string[]>(['golden_crown', 'magic_cape']);
  const [selectedMascot, setSelectedMascot] = useState<'dragon' | 'fairy' | 'robot'>('dragon');
  const [showEntrance, setShowEntrance] = useState(() => {
    // Only show entrance for first visit
    return !localStorage.getItem('diamond-app-visited');
  });
  
  // GPU performance integration
  const { } = useGPUPerformance();

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
    if (!exercisesData) {
      return [];
    }

    return exercisesData.map((exercise: any) => ({
      id: `subject-${exercise.matiere}`,
      name: exercise.matiere === 'mathematiques' ? 'Mathématiques' :
            exercise.matiere === 'francais' ? 'Français' : 'Sciences',
      emoji: exercise.matiere === 'mathematiques' ? '🔢' :
             exercise.matiere === 'francais' ? '📚' : '🔬',
      exercises: [exercise]
    }));
  }, [exercisesData]);

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

  const handleExerciseStart = (exercise: any) => {
    navigate('/exercise', { state: { exercise } });
  };

  const handleLevelUp = (newLevel: number) => {
    setMascotEmotion('excited');
    setMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
    updateMascotEmotion('excellent', 'level_up').catch(console.warn);
    
    // Trigger amazing particle effects using global system!
    triggerParticles('levelup', 3000);
  };
  

  const handleLogout = async () => {
    if (activeSessionData?.hasActiveSession && activeSessionData.session) {
      await endSession(activeSessionData.session.id).catch(console.error);
    }
    await logout();
  };

  const handleEntranceComplete = () => {
    localStorage.setItem('diamond-app-visited', 'true');
    setShowEntrance(false);
  };

  return (
    <div className="relative">
      {/* Memorable Entrance - World-Class First Experience */}
      {showEntrance && (
        <MemorableEntrance
          studentName={studentData.prenom}
          level={String(studentData.level)}
          onComplete={handleEntranceComplete}
        />
      )}

      {/* Show XP System on HomePage */}
      <div className="fixed top-6 left-6 z-40">
        <XPCrystalsPremium
          currentXP={studentData.currentXP}
          maxXP={studentData.maxXP}
          level={studentData.level}
          onLevelUp={handleLevelUp}
          studentName={studentData.prenom}
          achievements={[
            'Premier exercice réussi !',
            'Série de 5 exercices !',
            'Niveau supérieur atteint !'
          ]}
        />
      </div>

      {/* Premium Diamond Interface */}
      {isLoadingExercises ? (
        <div className="flex justify-center items-center h-64">
          <SkeletonLoader type="dashboard" />
        </div>
      ) : exercisesError ? (
        <div className="text-center text-red-500 bg-red-100 p-4 rounded-lg">
          <p className="font-bold">Erreur de chargement</p>
          <p>Nous n'avons pas pu charger les exercices. Veuillez réessayer plus tard.</p>
        </div>
      ) : (
        <DiamondCP_CE2Interface
          onSubjectClick={handleSubjectClick}
          onExerciseStart={handleExerciseStart}
          studentData={studentData}
          subjects={subjects}
        />
      )}

      <WardrobeModal
        selectedMascot={selectedMascot}
        equippedItems={equippedItems}
        studentLevel={studentData.level}
        onItemEquip={(itemId) => setEquippedItems(prev => [...prev, itemId])}
        onItemUnequip={(itemId) => setEquippedItems(prev => prev.filter(id => id !== itemId))}
      />

      {/* Logout Button with Premium Micro-Interactions */}
      <div className="fixed top-6 right-6 z-40">
        <div title="Se déconnecter">
          <MicroInteraction
            type="button"
            intensity="high"
            onClick={handleLogout}
            className="bg-white/80 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all duration-300 border border-gray-200/50 shadow-lg hover:shadow-xl"
          >
            <LogOut className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
          </MicroInteraction>
        </div>
      </div>

      {activeSessionData?.hasActiveSession && (
        <motion.div
          className="fixed bottom-6 left-6 max-w-md bg-blue-100 border border-blue-300 rounded-2xl p-4 z-40"
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
