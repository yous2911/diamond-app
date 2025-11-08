import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useExercisesByLevel } from '../hooks/useApiData';
import { adaptExercises } from '../utils/exerciseAdapter';

// Import ALL the advanced components - TEMPORARILY DISABLED
// import MicroInteraction from '../components/MicroInteractions';
// import AdvancedParticleEngine from '../components/AdvancedParticleEngine';
// import MascotSystem from '../components/MascotSystem';
// import CelebrationSystem from '../components/CelebrationSystem';
import MemorableEntrance from '../components/MemorableEntrance';
// import WardrobeModal from '../components/WardrobeModal';
// import { useGPUPerformance } from '../hooks/useGPUPerformance';

// =============================================================================
// 🔊 SYSTÈME AUDIO PREMIUM DIAMANT
// =============================================================================
const useMagicalSounds = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (soundEnabled) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Audio context not supported');
      }
    }
  }, [soundEnabled]);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [soundEnabled]);

  const playMagicalChord = useCallback(() => {
    setTimeout(() => playTone(523.25, 0.3), 0);    // C5
    setTimeout(() => playTone(659.25, 0.3), 100);  // E5
    setTimeout(() => playTone(783.99, 0.3), 200);  // G5
    setTimeout(() => playTone(1046.50, 0.5), 300); // C6
  }, [playTone]);

  const playSparkleSound = useCallback(() => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(800 + Math.random() * 600, 0.1, 'sine');
      }, i * 80);
    }
  }, [playTone]);

  const playLevelUpFanfare = useCallback(() => {
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((note, index) => {
      setTimeout(() => playTone(note, 0.4), index * 150);
    });
  }, [playTone]);

  const playButtonClick = useCallback(() => {
    playTone(800, 0.1, 'square');
  }, [playTone]);

  const playErrorSound = useCallback(() => {
    playTone(200, 0.3, 'square');
    setTimeout(() => playTone(150, 0.3, 'square'), 200);
  }, [playTone]);

  return {
    playMagicalChord,
    playSparkleSound,
    playLevelUpFanfare,
    playButtonClick,
    playErrorSound,
    soundEnabled,
    setSoundEnabled
  };
};

// =============================================================================
// 💎 CRISTAUX XP PREMIUM AVEC PHYSIQUE 3D
// =============================================================================
const XPCrystalsPremium: React.FC<{
  currentXP: number;
  maxXP: number;
  level: number;
  onLevelUp?: (newLevel: number) => void;
}> = ({ currentXP, maxXP, level, onLevelUp }) => {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [showXPGain, setShowXPGain] = useState<number | null>(null);
  const { playLevelUpFanfare, playSparkleSound } = useMagicalSounds();

  const progress = Math.min((displayXP / maxXP) * 100, 100);

  // Animation XP gain
  useEffect(() => {
    if (currentXP > displayXP) {
      const difference = currentXP - displayXP;
      setShowXPGain(difference);
      playSparkleSound();
      
      // Animation progressive
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
          setTimeout(() => setShowXPGain(null), 1000);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [currentXP, displayXP, playSparkleSound]);

  // Détection level up
  useEffect(() => {
    if (displayXP >= maxXP && !isLevelingUp) {
      setIsLevelingUp(true);
      playLevelUpFanfare();
      
      setTimeout(() => {
        onLevelUp?.(level + 1);
        setIsLevelingUp(false);
      }, 2000);
    }
  }, [displayXP, maxXP, isLevelingUp, level, onLevelUp, playLevelUpFanfare]);

  return (
    <div className="relative flex flex-col items-center space-y-4">
      {/* Niveau avec couronne */}
      <motion.div
        className="relative"
        animate={isLevelingUp ? { 
          scale: [1, 1.3, 1], 
          rotate: [0, 360, 0] 
        } : {}}
        transition={{ duration: 2 }}
      >
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg">
          Niveau {level}
        </div>
        
        {isLevelingUp && (
          <motion.div
            className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-3xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            👑
          </motion.div>
        )}
      </motion.div>

      {/* Cristal principal rotatif */}
      <motion.div
        className="relative"
        animate={{
          rotate: [0, 360],
          scale: isLevelingUp ? [1, 1.2, 1] : 1
        }}
        transition={{
          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
          scale: { duration: 2 }
        }}
      >
        {/* Aura du cristal */}
        <div className="absolute inset-0 w-20 h-20 bg-purple-400 rounded-full blur-lg opacity-50 animate-pulse" />
        
        {/* Cristal 3D */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg transform rotate-45 shadow-xl">
          {/* Facettes */}
          <div className="absolute inset-2 bg-gradient-to-br from-white/40 to-transparent rounded-lg" />
          <div className="absolute top-1 left-1 w-3 h-3 bg-white/60 rounded-full blur-sm" />
          
          {/* Reflet animé */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-lg"
            animate={{ x: [-60, 60] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Cristaux satellites */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400 rounded-full"
            animate={{
              x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
              y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
            }}
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}
      </motion.div>

      {/* Barre de progression liquide */}
      <div className="relative w-64 h-6 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full relative overflow-hidden"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* Effet liquide ondulant */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Bulles dans le liquide */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/50 rounded-full"
              animate={{
                y: [15, -5],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
              style={{ left: `${i * 30 + 10}%`, bottom: 0 }}
            />
          ))}
        </motion.div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700">
            {Math.round(displayXP)} / {maxXP} XP
          </span>
        </div>
      </div>

      {/* XP flottant */}
      <AnimatePresence>
        {showXPGain && (
          <motion.div
            className="absolute text-xl font-bold text-yellow-500 pointer-events-none z-50"
            style={{ top: '10%', left: '60%' }}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0.5, 1.2, 1.2, 0.8], 
              y: [-30, -60, -80, -100] 
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 2 }}
          >
            +{showXPGain} XP ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// =============================================================================
// 🎯 APP PRINCIPALE DIAMANT PREMIUM WITH ALL ADVANCED COMPONENTS
// =============================================================================
const HomePage = () => {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  
  // Advanced state management
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentView, setCurrentView] = useState('home');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentExercise, setCurrentExercise] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mascotEmotion, setMascotEmotion] = useState<'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy'>('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showParticles, setShowParticles] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [particleType, setParticleType] = useState<'success' | 'levelup' | 'magic'>('magic');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showCelebration, setShowCelebration] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [celebrationType, setCelebrationType] = useState<'exercise_complete' | 'level_up' | 'streak' | 'first_time' | 'perfect_score' | 'comeback' | 'milestone' | 'achievement_unlocked' | 'daily_goal' | 'weekly_champion'>('exercise_complete');
  const [showEntrance, setShowEntrance] = useState(() => {
    return !localStorage.getItem('diamond-app-visited');
  });
  
  // Wardrobe state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [equippedItems] = useState<string[]>(['golden_crown', 'magic_cape']);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedMascot, setSelectedMascot] = useState<'dragon' | 'fairy' | 'robot'>('dragon');

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [studentData, setStudentData] = useState({
    prenom: student?.prenom || 'Élève',
    niveau: student?.niveau || 'CP',
    stars: 47,
    hearts: 3,
    streak: 5,
    currentXP: 75,
    maxXP: 100,
    level: 3
  });

  // Load exercises data
  const { data: exercisesData, isLoading: isLoadingExercises } = useExercisesByLevel(student?.niveau || 'CP', {
    limit: 20
  });

  // GPU Performance detection - TEMPORARILY DISABLED TO FIX INFINITE LOOP
  // const { 
  //   performanceTier, 
  //   getOptimalParticleCount, 
  //   shouldUseComplexAnimation,
  //   canUseBlur,
  //   canUseShadows 
  // } = useGPUPerformance();

  // Temporary fixed values
  const performanceTier = 'ultra';
  const getOptimalParticleCount = () => 100;
  const shouldUseComplexAnimation = () => true;
  const canUseBlur = true;
  const canUseShadows = true;

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Set loading to false when data is ready
  useEffect(() => {
    if (exercisesData && student) {
      setIsLoading(false);
    }
  }, [exercisesData, student]);

  const { 
    playMagicalChord, 
    playSparkleSound, 
    playButtonClick, 
    playErrorSound,
    soundEnabled, 
    setSoundEnabled 
  } = useMagicalSounds();

  // Matières avec animations
  const subjects = [
    {
      id: 'mathematiques',
          name: 'Mathématiques',
          emoji: '🔢',
      gradient: 'from-blue-400 via-blue-500 to-blue-600',
      shadowColor: 'shadow-blue-500/50',
      description: 'Compter, additionner, géométrie',
      exercises: exercisesData ? adaptExercises(exercisesData).filter(ex => ex.subject === 'Mathématiques') : []
        },
        {
      id: 'francais',
          name: 'Français',
          emoji: '📚',
      gradient: 'from-green-400 via-green-500 to-green-600',
      shadowColor: 'shadow-green-500/50',
      description: 'Lettres, mots, lecture',
      exercises: exercisesData ? adaptExercises(exercisesData).filter(ex => ex.subject === 'Français') : []
        },
        {
      id: 'sciences',
          name: 'Sciences',
          emoji: '🔬',
      gradient: 'from-purple-400 via-purple-500 to-purple-600',
      shadowColor: 'shadow-purple-500/50',
      description: 'Animaux, plantes, corps humain',
      exercises: []
    },
    {
      id: 'geographie',
      name: 'Géographie',
      emoji: '🌍',
      gradient: 'from-orange-400 via-orange-500 to-orange-600',
      shadowColor: 'shadow-orange-500/50',
      description: 'Pays, villes, cartes',
      exercises: []
    }
  ];

  const handleSubjectClick = (subject: any) => {
    playButtonClick();
    setMascotEmotion('thinking');
    setMascotMessage('C\'est parti pour une nouvelle aventure !');

    if (subject.exercises.length > 0) {
      setCurrentView('exercise');
      setCurrentExercise(subject.exercises[0]);
      navigate('/exercise', { state: { exercise: subject.exercises[0] } });
    } else {
      setMascotEmotion('sleepy');
      setMascotMessage('Cette matière arrive bientôt ! 🚧');
    }
  };

  const handleExerciseComplete = (success: boolean) => {
    if (success) {
      setMascotEmotion('celebrating');
      setMascotMessage('BRAVO ! Tu as réussi ! 🎉');
      setShowParticles(true);
      setParticleType('success');
      setShowCelebration(true);
      setCelebrationType('exercise_complete');
      playSparkleSound();
      
      setTimeout(() => {
        setShowParticles(false);
        setShowCelebration(false);
        setMascotEmotion('happy');
        setMascotMessage('Prêt pour le prochain défi ?');
      }, 3000);
    } else {
      setMascotEmotion('thinking');
      setMascotMessage('Pas de problème, on va y arriver ! 💪');
      playErrorSound();
    }
  };

  const handleLevelUp = (newLevel: number) => {
    setMascotEmotion('excited');
    setMascotMessage('NIVEAU SUPÉRIEUR ! 🚀');
    setShowParticles(true);
    setParticleType('levelup');
    setShowCelebration(true);
    setCelebrationType('level_up');
    playMagicalChord();
    
    setTimeout(() => {
      setShowParticles(false);
      setShowCelebration(false);
      setMascotEmotion('celebrating');
      setMascotMessage('Tu es incroyable ! 🌟');
    }, 4000);
  };

  const handleLogout = async () => {
    await logout();
  };

  const handleEntranceComplete = () => {
    localStorage.setItem('diamond-app-visited', 'true');
    setShowEntrance(false);
  };

  const handleMascotInteraction = (type: string) => {
    if (type === 'click') {
      setMascotEmotion('excited');
      setMascotMessage('C\'est parti pour une nouvelle aventure !');
      playSparkleSound();
    }
  };

  const handleEmotionalStateChange = (state: any) => {
    // Handle mascot emotional state changes
    console.log('Mascot emotional state changed:', state);
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cognitive-gold mx-auto mb-8"></div>
          <h2 className="text-2xl font-bold text-white mb-4">Chargement de l'aventure...</h2>
          <p className="text-white/80">Initialisation des systèmes premium</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Memorable Entrance - CSS/Framer Motion (NO GPU) - ACTIVE FOR DEMO */}
      {showEntrance && (
        <MemorableEntrance
          studentName={studentData.prenom}
          level={String(studentData.level)}
          onComplete={() => {
            setShowEntrance(false);
            localStorage.setItem('diamond-app-visited', 'true');
          }}
        />
      )}

      {/* TEMPORARILY DISABLED - WebGL Context Leak */}
      {/* <AdvancedParticleEngine
        isActive={showParticles}
        intensity={performanceTier === 'ultra' ? 5 : performanceTier === 'high' ? 4 : 3}
        particleType={particleType === 'success' ? 'sparkle' : particleType === 'levelup' ? 'star' : 'magic'}
        emitterPosition={{ x: 50, y: 50 }}
        enablePhysics={shouldUseComplexAnimation()}
        enableTrails={shouldUseComplexAnimation()}
        className="fixed inset-0 pointer-events-none z-50"
      /> */}

      {/* Simple CSS Particles Fallback */}
      {showParticles && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse absolute top-4 left-4"></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce absolute -top-2 right-2"></div>
          </div>
        </div>
      )}

      {/* TEMPORARILY DISABLED - WebGL Context Leak */}
      {/* {showCelebration && (
        <CelebrationSystem
          type={celebrationType}
          studentName={studentData.prenom}
          data={{
            score: 100,
            newLevel: studentData.level + 1,
            streakCount: studentData.streak,
            xpGained: 25,
            timeSpent: 30,
            difficulty: 'FACILE',
            enhanced: shouldUseComplexAnimation()
          }}
          onComplete={() => setShowCelebration(false)}
        />
      )} */}

      {/* XP System */}
      <div className="fixed top-6 left-6 z-40">
        <XPCrystalsPremium
          currentXP={studentData.currentXP}
          maxXP={studentData.maxXP}
          level={studentData.level}
          onLevelUp={handleLevelUp}
        />
      </div>

      {/* Advanced Logout Button with Micro-Interactions */}
      <div className="fixed top-6 right-6 z-40">
        <button
          onClick={handleLogout}
          className="bg-white/80 backdrop-blur-sm rounded-full p-3 border border-gray-200/50 shadow-lg hover:bg-white transition-all duration-300"
        >
          <LogOut className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
        </button>
      </div>

      {/* Advanced Sound Toggle with Micro-Interactions */}
      <div className="fixed top-6 right-20 z-40">
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="bg-white/80 backdrop-blur-sm rounded-full p-3 border border-gray-200/50 shadow-lg hover:scale-105 transition-transform duration-200"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-gray-600 hover:text-green-500 transition-colors" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" />
          )}
        </button>
      </div>

      {/* TEMPORARILY DISABLED - WebGL Context Leak */}
      {/* <WardrobeModal
        selectedMascot={selectedMascot}
        equippedItems={equippedItems}
        studentLevel={studentData.level}
        onItemEquip={(itemId) => setEquippedItems(prev => [...prev, itemId])}
        onItemUnequip={(itemId) => setEquippedItems(prev => prev.filter(id => id !== itemId))}
      /> */}

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-20 px-6">
        {/* Welcome Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ✨
          </motion.div>
          <motion.h1 
            className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Bonjour {studentData.prenom} ! 👋
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 font-semibold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Prêt pour une nouvelle aventure d'apprentissage ? 💎
          </motion.p>
        </motion.div>

        {/* Subjects Grid with Advanced Micro-Interactions */}
        {isLoadingExercises ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              className="text-6xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              ⏳
            </motion.div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <motion.h2 
              className="text-2xl font-bold text-gray-800 mb-8 text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Choisis ta matière préférée ! 📚
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  onClick={() => handleSubjectClick(subject)}
                  className={`
                    bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white/40 
                    hover:border-white/60 transition-all duration-300 cursor-pointer group 
                    shadow-lg ${subject.shadowColor}
                  `}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  >
                    <motion.div 
                      className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      {subject.emoji}
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {subject.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {subject.description}
                    </p>
                    <div className="flex justify-center">
                      <motion.div
                        className={`
                          bg-gradient-to-r ${subject.gradient} text-white px-6 py-3 
                          rounded-xl font-bold text-lg shadow-lg border border-white/20
                        `}
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {subject.exercises.length > 0 ? 'Commencer ✨' : 'Bientôt 🚧'}
                      </motion.div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {subject.exercises.length} exercices disponibles
                    </p>
                </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TEMPORARILY DISABLED - WebGL Context Leak */}
      {/* <MascotSystem
        locale="fr"
        mascotType={selectedMascot}
        studentData={{
          level: studentData.level,
          xp: studentData.currentXP,
          currentStreak: studentData.streak,
          timeOfDay: 'afternoon',
          recentPerformance: 'excellent'
        }}
        currentActivity="learning"
        equippedItems={equippedItems}
        onMascotInteraction={handleMascotInteraction}
        onEmotionalStateChange={handleEmotionalStateChange}
      /> */}

      {/* Simple Fallback Mascot */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-6xl shadow-2xl animate-pulse">
          🐉
        </div>
        <div className="mt-2 text-center">
          <p className="text-white text-sm font-semibold">Mascotte</p>
          <p className="text-white/80 text-xs">{mascotMessage || "Prêt pour l'aventure!"}</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;