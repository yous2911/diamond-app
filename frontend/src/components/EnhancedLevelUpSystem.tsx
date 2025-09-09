import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagicalSounds } from '../hooks/useMagicalSounds';

// =============================================================================
// 🎉 SYSTÈME DE LEVEL UP AMÉLIORÉ AVEC CÉLÉBRATIONS ÉPIQUES
// =============================================================================
interface LevelUpCelebration {
  id: string;
  type: 'firework' | 'confetti' | 'sparkle' | 'crown' | 'star';
  x: number;
  y: number;
  delay: number;
  duration: number;
}

interface EnhancedLevelUpSystemProps {
  isLevelingUp: boolean;
  newLevel: number;
  onLevelUpComplete?: () => void;
  studentName?: string;
  achievements?: string[];
}

const EnhancedLevelUpSystem: React.FC<EnhancedLevelUpSystemProps> = ({
  isLevelingUp,
  newLevel,
  onLevelUpComplete,
  studentName = 'Élève',
  achievements = []
}) => {
  const [celebrations, setCelebrations] = useState<LevelUpCelebration[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(0);
  const { playLevelUpFanfare, playSparkleSound } = useMagicalSounds();

  // Create celebration effects
  const createCelebrations = useCallback(() => {
    const newCelebrations: LevelUpCelebration[] = [];
    
    // Fireworks
    for (let i = 0; i < 8; i++) {
      newCelebrations.push({
        id: `firework-${i}`,
        type: 'firework',
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.6,
        delay: i * 200,
        duration: 2000
      });
    }

    // Confetti
    for (let i = 0; i < 20; i++) {
      newCelebrations.push({
        id: `confetti-${i}`,
        type: 'confetti',
        x: Math.random() * window.innerWidth,
        y: -50,
        delay: i * 50,
        duration: 3000
      });
    }

    // Sparkles around the screen
    for (let i = 0; i < 15; i++) {
      newCelebrations.push({
        id: `sparkle-${i}`,
        type: 'sparkle',
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        delay: i * 100,
        duration: 1500
      });
    }

    setCelebrations(newCelebrations);
  }, []);

  // Trigger level up sequence
  useEffect(() => {
    if (isLevelingUp) {
      playLevelUpFanfare();
      createCelebrations();
      setShowModal(true);
      
      // Show achievements one by one
      if (achievements.length > 0) {
        const showAchievements = () => {
          achievements.forEach((achievement, index) => {
            setTimeout(() => {
              setCurrentAchievement(index);
              playSparkleSound();
            }, index * 1000);
          });
        };
        showAchievements();
      }

      // Complete level up after 4 seconds
      setTimeout(() => {
        setShowModal(false);
        setCelebrations([]);
        onLevelUpComplete?.();
      }, 4000);
    }
  }, [isLevelingUp, newLevel, achievements, playLevelUpFanfare, playSparkleSound, createCelebrations, onLevelUpComplete]);

  const renderCelebration = (celebration: LevelUpCelebration) => {
    const { type, x, y, delay } = celebration;

    switch (type) {
      case 'firework':
        return (
          <motion.div
            key={celebration.id}
            className="absolute pointer-events-none"
            style={{ left: x, top: y }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.5, 0.8, 0],
              opacity: [0, 1, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              delay: delay / 1000,
              duration: 2,
              ease: "easeOut"
            }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full animate-ping" />
            </div>
          </motion.div>
        );

      case 'confetti':
        return (
          <motion.div
            key={celebration.id}
            className="absolute pointer-events-none"
            style={{ left: x, top: y }}
            initial={{ y: -50, rotate: 0, opacity: 1 }}
            animate={{ 
              y: window.innerHeight + 50,
              rotate: 720,
              opacity: [1, 1, 0]
            }}
            transition={{ 
              delay: delay / 1000,
              duration: 3,
              ease: "easeIn"
            }}
          >
            <div className={`w-3 h-3 rounded-full ${
              ['bg-yellow-400', 'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500'][Math.floor(Math.random() * 5)]
            }`} />
          </motion.div>
        );

      case 'sparkle':
        return (
          <motion.div
            key={celebration.id}
            className="absolute pointer-events-none"
            style={{ left: x, top: y }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              delay: delay / 1000,
              duration: 1.5,
              ease: "easeInOut"
            }}
          >
            <div className="text-2xl">✨</div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-blue-900/80 to-pink-900/80 backdrop-blur-sm" />
          
          {/* Celebrations */}
          {celebrations.map(renderCelebration)}
          
          {/* Level Up Modal */}
          <motion.div
            className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 max-w-md mx-auto text-center shadow-2xl border-4 border-yellow-400"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Crown */}
            <motion.div
              className="text-6xl mb-4"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              👑
            </motion.div>

            {/* Level Up Text */}
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              NIVEAU SUPÉRIEUR !
            </motion.h1>

            <motion.div
              className="text-6xl font-bold text-yellow-500 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              {newLevel}
            </motion.div>

            <motion.p
              className="text-lg text-gray-700 mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Félicitations {studentName} ! 🎉
            </motion.p>

            {/* Achievements */}
            {achievements.length > 0 && (
              <motion.div
                className="space-y-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <h3 className="text-lg font-semibold text-gray-800">Nouveaux accomplissements :</h3>
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    className={`p-2 rounded-lg ${
                      index <= currentAchievement 
                        ? 'bg-green-100 text-green-800 border border-green-300' 
                        : 'bg-gray-100 text-gray-500'
                    }`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ 
                      x: 0, 
                      opacity: index <= currentAchievement ? 1 : 0.5 
                    }}
                    transition={{ delay: 1.2 + index * 0.2 }}
                  >
                    🏆 {achievement}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Progress Bar */}
            <motion.div
              className="mt-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className="text-sm text-gray-600 mb-2">Progression vers le niveau suivant</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '15%' }}
                  transition={{ delay: 2, duration: 1 }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedLevelUpSystem;
