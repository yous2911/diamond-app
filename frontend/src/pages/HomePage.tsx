import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePremiumFeatures } from '../contexts/PremiumFeaturesContext';
import { apiService } from '../services/api';
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
import { StreakFlame, SevenDayChest } from '../components/ui';
import AnimatedSection from '../components/ui/AnimatedSection';

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
  const { data: exercisesData, isLoading: isLoadingExercises, error: exercisesError } = useExercisesByLevel(student?.niveau || 'CP', {
    matiere: 'MATHEMATIQUES',
    type: 'QCM',
    difficulty: 'FACILE',
    limit: 10
  });
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
  const [hasClaimedReward, setHasClaimedReward] = useState(() => {
    // Check if reward was already claimed today
    const lastClaimDate = localStorage.getItem('streak-reward-claimed-date');
    const today = new Date().toDateString();
    return lastClaimDate === today;
  });
  
  // GPU performance integration
  const { } = useGPUPerformance();

  // ✅ GAMIFICATION 2.0: Check exercises completed today (not just login)
  const [todayActivity, setTodayActivity] = useState<{
    exercisesCompletedToday: number;
    currentStreak: number;
    streakFreezes: number;
    isFrozen: boolean;
  } | null>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  React.useEffect(() => {
    if (student?.id) {
      setIsLoadingActivity(true);
      apiService.getTodayActivity(student.id).then(response => {
        setIsLoadingActivity(false);
        if (response.success && response.data) {
          setTodayActivity({
            exercisesCompletedToday: response.data.exercisesCompletedToday,
            currentStreak: response.data.currentStreak,
            streakFreezes: response.data.streakFreezes,
            isFrozen: response.data.isFrozen
          });
        }
      }).catch(() => setIsLoadingActivity(false));
    }
  }, [student?.id]);

  const hasPlayedToday = useMemo(() => {
    // ✅ Only active if they completed at least 1 exercise today
    return (todayActivity?.exercisesCompletedToday || 0) >= 1;
  }, [todayActivity?.exercisesCompletedToday]);

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

  // Check if we should show milestone chests (3, 7, 14, 30 days)
  const shouldShowChest = useMemo(() => {
    const streak = todayActivity?.currentStreak || studentData.streak;
    const milestones = [3, 7, 14, 30];
    return streak > 0 && milestones.includes(streak) && !hasClaimedReward;
  }, [todayActivity?.currentStreak, studentData.streak, hasClaimedReward]);

  const getChestTitle = useMemo(() => {
    const streak = todayActivity?.currentStreak || studentData.streak;
    if (streak === 3) return '🎁 Récompense de 3 Jours ! (Boost XP)';
    if (streak === 7) return '🎁 Récompense de 7 Jours !';
    if (streak === 14) return '🎁 Récompense de 14 Jours ! (Mode Rapide)';
    if (streak === 30) return '🎁 Récompense de 30 Jours ! (Objet Premium)';
    return '🎁 Récompense Spéciale !';
  }, [todayActivity?.currentStreak, studentData.streak]);

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

  const handleChestOpen = async () => {
    // Mark reward as claimed
    const today = new Date().toDateString();
    localStorage.setItem('streak-reward-claimed-date', today);
    setHasClaimedReward(true);
    
    // Trigger celebration
    setMascotEmotion('excited');
    setMascotMessage('Félicitations ! Tu as gagné une récompense spéciale ! 🎁');
    triggerParticles('levelup', 3000);
    
    // Ping streak to get reward (backend handles milestone rewards)
    if (student?.id) {
      await apiService.pingStreak(student.id).then(response => {
        if (response.success && response.data?.rewardUnlocked) {
          const reward = response.data.rewardUnlocked;
          if (reward === 'chest_reward') {
            setMascotMessage('🎁 Nouvel objet débloqué !');
          } else if (reward === 'mode_rapide_unlock') {
            setMascotMessage('⚡ Mode Rapide débloqué !');
          }
        }
      });
    }
  };

  // Show loading state while fetching data
  if (isLoadingExercises && !exercisesData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 pb-20">
      {/* Memorable Entrance - World-Class First Experience */}
      {showEntrance && (
        <MemorableEntrance
          studentName={studentData.prenom}
          level={String(studentData.level)}
          onComplete={handleEntranceComplete}
        />
      )}

      {/* Show Milestone Chest Reward if applicable */}
      {shouldShowChest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <SevenDayChest 
            onOpen={handleChestOpen}
            title={getChestTitle}
          />
        </div>
      )}

      {/* Show XP System on HomePage - Mobile responsive positioning */}
      <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-auto z-40 max-w-xs sm:max-w-none">
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

      {/* Streak Flame Component - Mobile responsive positioning */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        {isLoadingActivity ? (
          <div className="w-24 h-32 bg-gray-200 rounded-xl animate-pulse" />
        ) : (
          <StreakFlame 
            days={todayActivity?.currentStreak || studentData.streak} 
            isActive={hasPlayedToday}
            isFrozen={todayActivity?.isFrozen || false}
            streakFreezes={todayActivity?.streakFreezes || 0}
            onUseFreeze={async () => {
              if (student?.id && todayActivity && todayActivity.streakFreezes > 0) {
                const response = await apiService.useStreakFreeze(student.id);
                if (response.success && response.data) {
                  setTodayActivity(prev => prev ? {
                    ...prev,
                    streakFreezes: response.data!.streakFreezesRemaining,
                    isFrozen: true
                  } : null);
                  setMascotEmotion('excited');
                  setMascotMessage('Ton streak est protégé ! ❄️');
                }
              }
            }}
          />
        )}
      </div>

      {/* Premium Diamond Interface */}
      <AnimatedSection delay={0.2}>
        {isLoadingExercises ? (
          <div className="flex justify-center items-center h-64">
            <SkeletonLoader type="dashboard" />
          </div>
        ) : exercisesError ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-red-500 bg-red-100 p-4 rounded-lg"
          >
            <p className="font-bold">Erreur de chargement</p>
            <p>Nous n'avons pas pu charger les exercices. Veuillez réessayer plus tard.</p>
          </motion.div>
        ) : (
          <DiamondCP_CE2Interface
            onSubjectClick={handleSubjectClick}
            onExerciseStart={handleExerciseStart}
            studentData={studentData}
            subjects={subjects}
          />
        )}
      </AnimatedSection>

      <WardrobeModal
        selectedMascot={selectedMascot}
        equippedItems={equippedItems}
        studentLevel={studentData.level}
        onItemEquip={(itemId) => setEquippedItems(prev => [...prev, itemId])}
        onItemUnequip={(itemId) => setEquippedItems(prev => prev.filter(id => id !== itemId))}
      />

      {/* Logout Button with Premium Micro-Interactions - Mobile responsive */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40">
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
