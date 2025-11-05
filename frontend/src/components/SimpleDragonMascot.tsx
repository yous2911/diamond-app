import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface SimpleDragonMascotProps {
  studentName: string;
  level: number;
  xp: number;
  onInteraction: (type: string) => void;
}

const SimpleDragonMascot: React.FC<SimpleDragonMascotProps> = ({
  studentName,
  level,
  xp,
  onInteraction
}) => {
  const [mood, setMood] = useState<'happy' | 'excited' | 'thinking'>('happy');
  const [message, setMessage] = useState<string>('');
  const [showBubble, setShowBubble] = useState(false);

  const dialogues = {
    happy: [
      `Salut ${studentName}! Prêt pour apprendre?`,
      'Encore une belle journée pour progresser!',
      'Tes efforts portent leurs fruits!'
    ],
    excited: [
      'Super! Allons-y!',
      'Je suis avec toi pour cette aventure!',
      'Wow, quelle énergie!'
    ],
    thinking: [
      'Hmm, réfléchissons ensemble...',
      'Un petit défi pour toi!',
      'Je suis sûr que tu vas y arriver!'
    ]
  };

  const getRandomDialogue = (currentMood: 'happy' | 'excited' | 'thinking') => {
    const options = dialogues[currentMood];
    return options[Math.floor(Math.random() * options.length)];
  };

  const handleMascotClick = () => {
    setMood('excited');
    setMessage(getRandomDialogue('excited'));
    setShowBubble(true);
    onInteraction('click');

    setTimeout(() => {
      setShowBubble(false);
      setMood('happy');
    }, 3000);
  };

  useEffect(() => {
    // Simulate mood changes based on XP or level
    if (xp > 100 && mood === 'happy') {
      setMood('excited');
      setMessage(getRandomDialogue('excited'));
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 3000);
    }
  }, [xp, mood]);

  return (
    <motion.div
      className="relative w-40 h-40 cursor-pointer"
      onClick={handleMascotClick}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 10 }}
    >
      {/* 3D Dragon Body with CSS 3D transforms */}
      <motion.div
        className="absolute inset-0"
        style={{
          transform: 'perspective(1000px) rotateX(20deg) rotateY(15deg)',
          transformStyle: 'preserve-3d'
        }}
        animate={{
          rotateY: [0, 360],
          rotateX: [20, 30, 20],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Main Dragon Body */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 rounded-full shadow-2xl"
          style={{
            boxShadow: '0 25px 50px rgba(0,0,0,0.4), inset 0 0 30px rgba(255,255,255,0.2)',
            transform: 'translateZ(20px)'
          }}
        >
          {/* Dragon Head */}
          <div 
            className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-green-300 to-emerald-500 rounded-full"
            style={{ transform: 'translateZ(30px)' }}
          >
            {/* Eyes */}
            <div className="absolute top-2 left-2 w-3 h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg"></div>
            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-300 rounded-full animate-pulse shadow-lg"></div>
            {/* Snout */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-green-400 rounded-full"></div>
          </div>
          
          {/* Wings */}
          <div 
            className="absolute top-4 -left-6 w-8 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transform -rotate-45 opacity-90"
            style={{ transform: 'translateZ(10px) rotate(-45deg)' }}
          ></div>
          <div 
            className="absolute top-4 -right-6 w-8 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transform rotate-45 opacity-90"
            style={{ transform: 'translateZ(10px) rotate(45deg)' }}
          ></div>
          
          {/* Tail */}
          <div 
            className="absolute bottom-4 -right-4 w-6 h-8 bg-gradient-to-b from-green-500 to-emerald-700 rounded-full transform rotate-12"
            style={{ transform: 'translateZ(15px) rotate(12deg)' }}
          ></div>
          
          {/* Dragon Emoji Overlay */}
          <div className="absolute inset-0 flex items-center justify-center text-6xl">
            🐉
          </div>
        </div>

        {/* 3D Shadow */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full opacity-30"
          style={{
            transform: 'translateZ(-20px) translateX(5px) translateY(5px)'
          }}
        ></div>
      </motion.div>

      {/* Speech Bubble */}
      <motion.div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 w-56 bg-white text-gray-800 p-3 rounded-xl shadow-lg text-center text-sm font-medium"
        initial={{ opacity: 0, y: 10 }}
        animate={showBubble ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}
      >
        {message}
        {/* Speech bubble arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
      </motion.div>

      {/* Stats Overlay */}
      <div className="absolute top-0 right-0 bg-black/70 text-white text-xs px-3 py-2 rounded-bl-xl rounded-tr-xl">
        <div className="font-bold">Level: {level}</div>
        <div className="font-bold">XP: {xp}</div>
      </div>

      {/* Magical Sparkles */}
      <motion.div
        className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-300 rounded-full"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.5, 0.5],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -bottom-2 -left-2 w-2 h-2 bg-pink-300 rounded-full"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1.2, 0.5],
          rotate: [0, -180, -360]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
    </motion.div>
  );
};

export default SimpleDragonMascot;






