import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Home, Volume2, VolumeX, Trophy, Sparkles } from 'lucide-react';
import { useMagicalSounds } from '../hooks/useMagicalSounds';
import ParticleEngine from './ParticleEngine';
import MascottePremium from './MascottePremium';
import XPCrystalsPremium from './XPCrystalsPremium';

// =============================================================================
// 🎯 APP PRINCIPALE DIAMANT PREMIUM
// =============================================================================
interface DiamondCP_CE2InterfaceProps {
  onSubjectClick?: (subject: any) => void;
  onExerciseStart?: (exercise: any) => void;
  studentData?: {
    prenom: string;
    niveau: string;
    stars: number;
    hearts: number;
    streak: number;
    currentXP: number;
    maxXP: number;
    level: number;
  };
}

const DiamondCP_CE2Interface: React.FC<DiamondCP_CE2InterfaceProps> = ({
  onSubjectClick,
  onExerciseStart,
  studentData = {
    prenom: 'Emma',
    niveau: 'CE1',
    stars: 47,
    hearts: 3,
    streak: 5,
    currentXP: 75,
    maxXP: 100,
    level: 3
  }
}) => {
  // Removed currentView and currentExercise - navigation handled by parent
  const [mascotEmotion, setMascotEmotion] = useState<'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy'>('happy');
  const [mascotMessage, setMascotMessage] = useState('');
  const [showParticles, setShowParticles] = useState(false);
  const [particleType, setParticleType] = useState<'success' | 'levelup' | 'magic'>('magic');
  
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
      exercises: [
        {
          id: 1,
          type: 'CALCUL',
          question: 'Combien font 5 + 3 ?',
          operation: '5 + 3 = ?',
          bonneReponse: 8,
          choix: [6, 7, 8, 9],
          xp: 15
        }
      ]
    },
    {
      id: 'francais',
      name: 'Français',
      emoji: '📚',
      gradient: 'from-green-400 via-green-500 to-green-600',
      shadowColor: 'shadow-green-500/50',
      description: 'Lettres, mots, lecture',
      exercises: [
        {
          id: 2,
          type: 'QCM',
          question: 'Quel mot commence par "B" ?',
          choix: ['Pomme', 'Banane', 'Orange', 'Cerise'],
          bonneReponse: 'Banane',
          xp: 12
        }
      ]
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
    console.log('🎯 DiamondCP_CE2Interface - Subject clicked:', subject.name);
    console.log('🎯 DiamondCP_CE2Interface - onSubjectClick callback exists:', !!onSubjectClick);
    
    // Temporarily disable audio to debug
    // playButtonClick();
    setMascotEmotion('thinking');
    setMascotMessage('C\'est parti pour une nouvelle aventure !');
    
    // Just call the parent callback - don't handle navigation here
    if (onSubjectClick) {
      console.log('🎯 DiamondCP_CE2Interface - Calling parent onSubjectClick...');
      onSubjectClick(subject);
    } else {
      console.error('🎯 DiamondCP_CE2Interface - No onSubjectClick callback provided!');
    }
  };

  const handleLevelUp = (newLevel: number) => {
    setMascotEmotion('excited');
    setMascotMessage('NIVEAU SUPÉRIEUR ! 🎉');
    
    // Trigger amazing particle effects!
    setParticleType('levelup');
    setShowParticles(true);
    setTimeout(() => setShowParticles(false), 3000);
  };

  const handleMascotInteraction = () => {
    playSparkleSound();
    setMascotEmotion('excited');
    setMascotMessage('Tu es fantastique ! ✨');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Particle Effects */}
      <ParticleEngine
        isActive={showParticles}
        intensity="epic"
        type={particleType}
        position={{ x: 50, y: 30 }}
      />

      {/* Header */}
      <motion.div
        className="flex justify-between items-center p-6 bg-white/80 backdrop-blur-sm border-b border-white/20"
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bonjour {studentData.prenom} ! 👋
            </h1>
            <p className="text-gray-600 text-lg">Niveau {studentData.niveau} • Prêt pour l'aventure ?</p>
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
        </div>
      </motion.div>

      {/* XP System */}
      <motion.div
        className="flex justify-center py-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <XPCrystalsPremium
          currentXP={studentData.currentXP}
          maxXP={studentData.maxXP}
          level={studentData.level}
          onLevelUp={handleLevelUp}
        />
      </motion.div>

      {/* Subjects Grid */}
      <motion.div
        className="grid grid-cols-2 gap-8 max-w-6xl mx-auto p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {subjects.map((subject, index) => (
          <motion.button
            key={subject.id}
            onClick={() => handleSubjectClick(subject)}
            className={`
              bg-gradient-to-br ${subject.gradient} p-8 rounded-3xl shadow-2xl border-4 border-white/50
              hover:shadow-3xl transform hover:scale-105 transition-all duration-500
              ${subject.shadowColor} relative overflow-hidden
            `}
            whileHover={{ scale: 1.05, rotate: 1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 100 }}
          >
            {/* Premium Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative text-center text-white">
              <motion.div 
                className="text-7xl mb-6"
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {subject.emoji}
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-3 text-white drop-shadow-lg">{subject.name}</h3>
              <p className="text-sm opacity-90 mb-4">{subject.description}</p>
              
              {/* Exercise Count */}
              <div className="flex justify-center items-center text-xs">
                <span>📚</span>
                <span className="ml-1">{subject.exercises.length} exercices</span>
              </div>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Premium Mascot */}
      <MascottePremium
        emotion={mascotEmotion}
        message={mascotMessage}
        onInteraction={handleMascotInteraction}
      />
    </div>
  );
};

export default DiamondCP_CE2Interface;
