import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, Volume2, VolumeX, LogOut } from 'lucide-react';
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
import MascotWardrobe3D from '../components/mascot/MascotWardrobe3D';
import MemorableEntrance from '../components/MemorableEntrance';
import CelebrationSystem from '../components/CelebrationSystem';
import MicroInteraction from '../components/MicroInteractions';
import { useGPUPerformance } from '../hooks/useGPUPerformance';

const HomePage = () => {
  const navigate = useNavigate();
  const { student, logout } = useAuth();
  
  // Debug logging
  console.log('🏠 HomePage loaded for student:', student?.prenom);
  console.log('🏠 Current URL:', window.location.pathname);
  
  // Ensure we're on the correct route
  React.useEffect(() => {
    if (window.location.pathname !== '/') {
      console.log('🏠 Redirecting from', window.location.pathname, 'to /');
      navigate('/', { replace: true });
    }
  }, [navigate]);
  const { 
    setMascotEmotion, 
    setMascotMessage, 
    addXP, 
    triggerParticles,
    soundEnabled,
    setSoundEnabled 
  } = usePremiumFeatures();

  // Hooks API
  const { data: competencesData } = useCompetences();
  const { data: exercisesData } = useExercisesByLevel(student?.niveau || 'CP');
  const { data: statsData } = useStudentStats();
  const { updateEmotion: updateMascotEmotion } = useMascot();
  const { startSession, endSession, data: activeSessionData } = useSessionManagement();
  const { currentXp, currentLevel, addXp } = useXpTracking();

  // Local state for wardrobe and memorable moments
  const [selectedMascot, setSelectedMascot] = useState<'dragon' | 'fairy' | 'robot'>('dragon');
  const [showMascotSelector, setShowMascotSelector] = useState(false);
  const [equippedItems, setEquippedItems] = useState<string[]>(['golden_crown', 'magic_cape']);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showEntrance, setShowEntrance] = useState(() => {
    // Only show entrance for first visit
    return !localStorage.getItem('diamond-app-visited');
  });
  const [celebrationData, setCelebrationData] = useState<{
    show: boolean;
    type: 'exercise_complete' | 'level_up' | 'streak' | 'first_time' | 'perfect_score' | 'comeback';
    data?: any;
  }>({ show: false, type: 'exercise_complete' });
  
  // GPU performance integration
  const { performanceTier, shouldUseComplexAnimation } = useGPUPerformance();

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
    // Use backend exercises if available, fallback to mock data
    if (exercisesData && exercisesData.length > 0) {
      return exercisesData.map((exercise: any) => ({
        id: `subject-${exercise.matiere}`,
        name: exercise.matiere === 'mathematiques' ? 'Mathématiques' : 
              exercise.matiere === 'francais' ? 'Français' : 'Sciences',
        emoji: exercise.matiere === 'mathematiques' ? '🔢' : 
               exercise.matiere === 'francais' ? '📚' : '🔬',
        exercises: [exercise]
      }));
    }
    // Fallback mock data
    return [
      {
        id: 'mathematiques',
        name: 'Mathématiques',
        emoji: '🔢',
        gradient: 'from-blue-500 to-cyan-500',
        shadowColor: 'shadow-blue-500/25',
        description: 'Compter, additionner, géométrie',
        competences: [
          { id: 1, name: 'Addition', progress: 85, total: 100 },
          { id: 2, name: 'Soustraction', progress: 70, total: 100 },
          { id: 3, name: 'Multiplication', progress: 45, total: 100 }
        ],
        exercises: [
          { 
            id: 1, 
            title: 'Addition magique', 
            question: 'Combien font 5 + 3 ?',
            answer: '8',
            options: ['6', '7', '8', '9'],
            difficulty: 'Facile', 
            xp: 50, 
            completed: true,
            type: 'math'
          },
          { 
            id: 2, 
            title: 'Soustraction des étoiles', 
            question: 'Combien font 10 - 4 ?',
            answer: '6',
            options: ['4', '5', '6', '7'],
            difficulty: 'Moyen', 
            xp: 75, 
            completed: false,
            type: 'math'
          },
          { 
            id: 3, 
            title: 'Multiplication des dragons', 
            question: 'Combien font 3 × 4 ?',
            answer: '12',
            options: ['10', '11', '12', '13'],
            difficulty: 'Difficile', 
            xp: 100, 
            completed: false,
            type: 'math'
          }
        ],
        get totalXP() { return this.exercises.filter(ex => ex.completed).reduce((sum, ex) => sum + ex.xp, 0); },
        completedExercises: 1,
        totalExercises: 3
      },
      {
        id: 'francais',
        name: 'Français',
        emoji: '📚',
        gradient: 'from-green-500 to-emerald-500',
        shadowColor: 'shadow-green-500/25',
        description: 'Lettres, mots, lecture',
        competences: [
          { id: 4, name: 'Lecture', progress: 90, total: 100 },
          { id: 5, name: 'Écriture', progress: 60, total: 100 },
          { id: 6, name: 'Grammaire', progress: 30, total: 100 }
        ],
        exercises: [
          { 
            id: 4, 
            title: 'Lecture des contes', 
            question: 'Quel est le mot qui manque : "Le chat ___ sur le toit" ?',
            answer: 'monte',
            options: ['monte', 'descend', 'court', 'dort'],
            difficulty: 'Facile', 
            xp: 50, 
            completed: true,
            type: 'french'
          },
          { 
            id: 5, 
            title: 'Écriture magique', 
            question: 'Comment écrit-on le mot "maison" ?',
            answer: 'maison',
            options: ['maison', 'maizon', 'mezon', 'mazon'],
            difficulty: 'Moyen', 
            xp: 75, 
            completed: true,
            type: 'french'
          },
          { 
            id: 6, 
            title: 'Grammaire des fées', 
            question: 'Conjugue : "Je ___ (être) content"',
            answer: 'suis',
            options: ['suis', 'es', 'est', 'sommes'],
            difficulty: 'Difficile', 
            xp: 100, 
            completed: false,
            type: 'french'
          }
        ],
        get totalXP() { return this.exercises.filter(ex => ex.completed).reduce((sum, ex) => sum + ex.xp, 0); },
        completedExercises: 2,
        totalExercises: 3
      },
      {
        id: 'sciences',
        name: 'Sciences',
        emoji: '🔬',
        gradient: 'from-purple-500 to-pink-500',
        shadowColor: 'shadow-purple-500/25',
        description: 'Découverte du monde',
        competences: [
          { id: 7, name: 'Nature', progress: 40, total: 100 },
          { id: 8, name: 'Animaux', progress: 25, total: 100 }
        ],
        exercises: [
          { 
            id: 7, 
            title: 'Les animaux de la forêt', 
            question: 'Quel animal vit dans la forêt ?',
            answer: 'renard',
            options: ['renard', 'requin', 'dauphin', 'pélican'],
            difficulty: 'Facile', 
            xp: 50, 
            completed: false,
            type: 'science'
          },
          { 
            id: 8, 
            title: 'Les plantes magiques', 
            question: 'Quelle couleur sont les feuilles ?',
            answer: 'vert',
            options: ['vert', 'rouge', 'bleu', 'jaune'],
            difficulty: 'Moyen', 
            xp: 75, 
            completed: false,
            type: 'science'
          }
        ],
        get totalXP() { return this.exercises.filter(ex => ex.completed).reduce((sum, ex) => sum + ex.xp, 0); },
        completedExercises: 0,
        totalExercises: 2
      },
      {
        id: 'arts',
        name: 'Arts',
        emoji: '🎨',
        gradient: 'from-orange-500 to-red-500',
        shadowColor: 'shadow-orange-500/25',
        description: 'Créativité et imagination',
        competences: [
          { id: 9, name: 'Dessin', progress: 65, total: 100 },
          { id: 10, name: 'Couleurs', progress: 80, total: 100 }
        ],
        exercises: [
          { 
            id: 9, 
            title: 'Dessin des mascottes', 
            question: 'Quelle couleur pour dessiner un dragon ?',
            answer: 'vert',
            options: ['vert', 'blanc', 'transparent', 'arc-en-ciel'],
            difficulty: 'Facile', 
            xp: 50, 
            completed: true,
            type: 'art'
          },
          { 
            id: 10, 
            title: 'Palette des couleurs', 
            question: 'Quelle couleur fait rouge + bleu ?',
            answer: 'violet',
            options: ['violet', 'orange', 'marron', 'gris'],
            difficulty: 'Moyen', 
            xp: 75, 
            completed: false,
            type: 'art'
          }
        ],
        get totalXP() { return this.exercises.filter(ex => ex.completed).reduce((sum, ex) => sum + ex.xp, 0); },
        completedExercises: 1,
        totalExercises: 2
      }
    ];
  }, []);

  const handleSubjectClick = async (subject: any) => {
    console.log('🎯 HomePage - Subject clicked:', subject.name);
    console.log('🎯 HomePage - Exercises available:', subject.exercises.length);
    console.log('🎯 HomePage - Full subject data:', subject);
    
    setMascotEmotion('thinking');
    setMascotMessage('C\'est parti pour une nouvelle aventure !');

    await updateMascotEmotion('good', 'exercise_complete').catch(console.warn);

    if (!activeSessionData?.hasActiveSession) {
      await startSession(subject.competences?.map((c: any) => c.code) || []).catch(console.warn);
    }

    if (subject.exercises.length > 0) {
      const randomExercise = subject.exercises[Math.floor(Math.random() * subject.exercises.length)];
      console.log('🎯 HomePage - Navigating to exercise:', randomExercise);
      console.log('🎯 HomePage - Exercise data structure:', JSON.stringify(randomExercise, null, 2));
      console.log('🎯 HomePage - About to call navigate...');
      navigate('/exercise', { state: { exercise: randomExercise } });
      console.log('🎯 HomePage - Navigate called successfully');
    } else {
      console.log('🎯 HomePage - No exercises available');
      setMascotEmotion('sleepy');
      setMascotMessage('Cette matière arrive bientôt ! 🚧');
    }
  };

  const handleExerciseStart = (exercise: any) => {
    console.log('🎯 Starting exercise:', exercise);
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
      <DiamondCP_CE2Interface
        onSubjectClick={handleSubjectClick}
        onExerciseStart={handleExerciseStart}
        studentData={studentData}
      />

      {/* 3D Mascot Wardrobe Modal */}
      {showWardrobe && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowWardrobe(false)}
        >
          <motion.div
            className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Garde-robe du Mascot</h2>
              <button
                onClick={() => setShowWardrobe(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <MascotWardrobe3D
              mascotType={selectedMascot}
              equippedItems={equippedItems}
              studentLevel={studentData.level}
              onItemEquip={(itemId) => setEquippedItems(prev => [...prev, itemId])}
              onItemUnequip={(itemId) => setEquippedItems(prev => prev.filter(id => id !== itemId))}
            />
          </motion.div>
        </motion.div>
      )}

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

      {/* Wardrobe Button with Premium Micro-Interactions */}
      <div className="fixed top-6 right-20 z-40">
        <div title="Garde-robe du mascot">
          <MicroInteraction
            type="button"
            intensity="medium"
            onClick={() => setShowWardrobe(!showWardrobe)}
            className="bg-white/80 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all duration-300 border border-gray-200/50 shadow-lg hover:shadow-xl"
          >
            <span className="text-xl filter drop-shadow-sm">👕</span>
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
