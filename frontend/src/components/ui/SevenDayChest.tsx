import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMagicalSounds } from '../../hooks/useMagicalSounds';

interface ChestProps {
  onOpen: () => void; // Function to call when opened (unlock reward)
  rewardImage?: string; // Optional image of the item won
  title?: string; // Custom title for the chest
}

export const SevenDayChest: React.FC<ChestProps> = ({ onOpen, rewardImage, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { playLevelUpFanfare, playButtonClick } = useMagicalSounds();

  const handleOpen = () => {
    if (isOpen) return;
    playButtonClick();
    setIsOpen(true);
    
    // Delay callback to let animation play
    setTimeout(() => {
      playLevelUpFanfare();
      onOpen();
    }, 800);
  };

  return (
    <motion.div 
      layout
      className="flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-indigo-900/10 to-purple-900/10 rounded-3xl backdrop-blur-sm border-2 border-indigo-100 max-w-sm mx-auto"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <h3 className="text-2xl font-black text-indigo-800 mb-8 text-center">
        {title || '🎁 Récompense de 7 Jours !'}
      </h3>

      <div className="relative w-64 h-64 cursor-pointer group" onClick={handleOpen}
           onMouseEnter={() => setIsHovered(true)}
           onMouseLeave={() => setIsHovered(false)}>
        
        {/* Glow Effect */}
        <motion.div
          className="absolute inset-0 bg-yellow-400 rounded-full blur-3xl opacity-20"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <AnimatePresence>
          {!isOpen ? (
            /* CLOSED CHEST STATE */
            <motion.div
              key="closed"
              className="relative w-full h-full"
              initial={{ scale: 0.8 }}
              animate={isHovered ? { scale: 1.05, rotate: [0, -2, 2, 0] } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Chest Visual */}
              <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-orange-700 rounded-2xl border-4 border-yellow-300 shadow-2xl flex items-center justify-center relative overflow-hidden">
                <motion.div 
                  className="w-16 h-20 bg-yellow-300 rounded-lg shadow-inner border-2 border-yellow-500 z-20 flex items-center justify-center"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-3xl">🔒</span>
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent w-[200%] h-full transform -skew-x-12 animate-shine" />
              </div>
              
              {/* CTA */}
              <motion.div 
                className="absolute -bottom-12 left-0 right-0 text-center"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <span className="bg-white px-6 py-2 rounded-full font-bold text-indigo-600 shadow-xl border border-indigo-100">
                  Touche pour ouvrir ! 👇
                </span>
              </motion.div>
            </motion.div>
          ) : (
            /* OPEN STATE */
            <motion.div
              key="open"
              className="relative w-full h-full flex items-center justify-center"
            >
              <motion.div
                className="absolute inset-0 bg-yellow-200 rounded-full blur-xl"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />

              <motion.div
                initial={{ y: 50, scale: 0, opacity: 0 }}
                animate={{ y: -20, scale: 1.2, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="z-30 filter drop-shadow-2xl flex flex-col items-center"
              >
                {rewardImage ? (
                  <img src={rewardImage} alt="Reward" className="w-32 h-32 object-contain" />
                ) : (
                  <span className="text-8xl">👑</span>
                )}
                <span className="mt-4 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full font-bold text-sm">
                  Nouvel Objet !
                </span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

