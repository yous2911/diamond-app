import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMascot } from '../hooks/useApiData';

const MascottePremium: React.FC<{
  emotion: 'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy';
  message?: string;
  onInteraction?: () => void;
}> = ({ emotion, message, onInteraction }) => {
  const [currentEmotion, setCurrentEmotion] = useState(emotion);
  const [showMessage, setShowMessage] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [dialogueText, setDialogueText] = useState<string>('');

  // Utilisation du hook mascot API
  const { data: mascotApiData, getDialogue } = useMascot();

  const emotionEmojis = {
    idle: mascotApiData?.mascot?.type === 'dragon' ? '🐲' :
          mascotApiData?.mascot?.type === 'fairy' ? '🧚‍♀️' :
          mascotApiData?.mascot?.type === 'robot' ? '🤖' :
          mascotApiData?.mascot?.type === 'cat' ? '🐱' :
          mascotApiData?.mascot?.type === 'owl' ? '🦉' : '🐸',
    happy: '😊',
    excited: '🤩',
    thinking: '🤔',
    celebrating: '🎉',
    sleepy: '😴'
  };

  const emotionMessages = {
    idle: ['Prêt pour l\'aventure ?', 'Que veux-tu apprendre ?'],
    happy: ['Super travail !', 'Tu es fantastique !'],
    excited: ['INCROYABLE !', 'Tu es un génie !'],
    thinking: ['Réfléchissons ensemble...', 'Prenons notre temps'],
    celebrating: ['BRAVO ! 🎉', 'Tu as réussi !'],
    sleepy: ['Zzz... Prêt à continuer ?', '*bâille*']
  };

  useEffect(() => {
    setCurrentEmotion(emotion);
    if (message) {
      setShowMessage(true);
      setDialogueText(message);
      setTimeout(() => setShowMessage(false), 3000);
    }
  }, [emotion, message]);

  const handleClick = async () => {
    setIsInteracting(true);
    setCurrentEmotion('excited');

    // Obtenir un dialogue contextuel de l'API
    try {
      const dialogueData = await getDialogue('greeting');
      if (dialogueData) {
        setDialogueText(dialogueData.dialogue);
      } else {
        setDialogueText(emotionMessages.excited[Math.floor(Math.random() * emotionMessages.excited.length)]);
      }
    } catch (error) {
      setDialogueText(emotionMessages.excited[Math.floor(Math.random() * emotionMessages.excited.length)]);
    }

    setShowMessage(true);

    setTimeout(() => {
      setCurrentEmotion('happy');
      setIsInteracting(false);
      setShowMessage(false);
    }, 2000);

    onInteraction?.();
  };

  const getEmotionAnimation = () => {
    switch (currentEmotion) {
      case 'happy':
        return 'animate-bounce';
      case 'excited':
        return 'animate-pulse';
      case 'thinking':
        return 'animate-pulse';
      case 'celebrating':
        return 'animate-spin';
      default:
        return '';
    }
  };

  return (
    <div className="mascot-container fixed bottom-4 right-4 z-40">
      {/* Aura magique */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-green-400/20 blur-xl animate-pulse" />

      {/* Particules autour de la mascotte */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              top: `${20 + Math.sin(i * 60) * 30}%`,
              left: `${20 + Math.cos(i * 60) * 30}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Mascotte principale */}
      <motion.div
        className={`
          text-6xl cursor-pointer relative z-10 filter drop-shadow-lg
          ${getEmotionAnimation()}
          ${isInteracting ? 'scale-125' : 'hover:scale-110'}
          transition-all duration-300
        `}
        onClick={handleClick}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        {emotionEmojis[currentEmotion]}
      </motion.div>

      {/* Bulle de dialogue */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            className="absolute bottom-full right-0 mb-4 bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-2xl px-4 py-2 shadow-xl max-w-xs"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="absolute bottom-0 right-4 transform translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white/95" />
            </div>

            <p className="text-sm font-medium text-gray-800 text-center">
              {dialogueText || emotionMessages[currentEmotion][Math.floor(Math.random() * emotionMessages[currentEmotion].length)]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Effet de clic */}
      <AnimatePresence>
        {isInteracting && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-yellow-400"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MascottePremium;
