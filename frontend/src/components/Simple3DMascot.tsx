import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Simple3DMascotProps {
  studentName: string;
  level: number;
  xp: number;
  onInteraction: (type: string) => void;
}

const Simple3DMascot: React.FC<Simple3DMascotProps> = ({ 
  studentName, 
  level, 
  xp, 
  onInteraction 
}) => {
  const [mood, setMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [rotation, setRotation] = useState(0);

  const mascotMessages = {
    happy: `Salut ${studentName}! Prêt à apprendre ? 🎓`,
    excited: `Wow ! Tu es formidable ! Continue comme ça ! ⭐`,
    thinking: `Hmm, laisse-moi réfléchir à cet exercice... 🤔`,
    celebrating: `Incroyable ! Tu as gagné ${xp} XP ! 🎉`
  };

  useEffect(() => {
    setMessage(mascotMessages[mood]);
  }, [mood, studentName, xp]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    const moods: Array<'happy' | 'excited' | 'thinking' | 'celebrating'> = 
      ['happy', 'excited', 'thinking', 'celebrating'];
    const randomMood = moods[Math.floor(Math.random() * moods.length)];
    setMood(randomMood);
    onInteraction('click');
  };

  const handleFeed = () => {
    setMood('excited');
    onInteraction('feed');
  };

  const handlePlay = () => {
    setMood('celebrating');
    onInteraction('play');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl shadow-xl p-6 mb-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-purple-800">🐉 Ton Dragon Magique</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-purple-400 hover:text-purple-600 text-lg"
        >
          ✕
        </button>
      </div>
      
      <div className="flex items-center space-x-6">
        {/* 3D Dragon Avatar */}
        <div 
          className="relative w-24 h-24 cursor-pointer transform hover:scale-110 transition-transform duration-300"
          onClick={handleClick}
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Dragon Body */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full shadow-lg">
            {/* Dragon Head */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-green-300 to-green-500 rounded-full">
              {/* Eyes */}
              <div className="absolute top-1 left-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              {/* Snout */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-green-400 rounded-full"></div>
            </div>
            
            {/* Wings */}
            <div className="absolute top-2 -left-2 w-6 h-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transform -rotate-45 opacity-80"></div>
            <div className="absolute top-2 -right-2 w-6 h-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transform rotate-45 opacity-80"></div>
            
            {/* Tail */}
            <div className="absolute bottom-2 -right-2 w-4 h-6 bg-gradient-to-b from-green-500 to-emerald-700 rounded-full transform rotate-12"></div>
            
            {/* Mood indicator */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full flex items-center justify-center text-xs">
              {mood === 'happy' && '😊'}
              {mood === 'excited' && '🤩'}
              {mood === 'thinking' && '🤔'}
              {mood === 'celebrating' && '🎉'}
            </div>
          </div>
          
          {/* 3D Effect Shadow */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full transform translate-x-1 translate-y-1 opacity-30 -z-10"></div>
        </div>
        
        {/* Mascot Info */}
        <div className="flex-1">
          <div className="bg-white/80 rounded-lg p-4 mb-3 shadow-md">
            <p className="text-gray-700 font-medium text-sm">{message}</p>
          </div>
          
          <div className="flex space-x-2">
            <motion.button
              onClick={handleFeed}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Nourrir 🍎
            </motion.button>
            <motion.button
              onClick={handlePlay}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Jouer 🎮
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mascot Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <div className="font-medium text-blue-800">Niveau</div>
          <div className="text-blue-600 font-bold">{level}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <div className="font-medium text-green-800">XP</div>
          <div className="text-green-600 font-bold">{xp}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-2 text-center">
          <div className="font-medium text-purple-800">Série</div>
          <div className="text-purple-600 font-bold">5 🔥</div>
        </div>
      </div>
      
      {/* Dragon Breath Effect */}
      <motion.div
        className="absolute -top-2 -right-2 w-2 h-2 bg-yellow-300 rounded-full opacity-0"
        animate={{
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5],
          x: [0, 10, 20],
          y: [0, -5, -10]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      />
    </div>
  );
};

export default Simple3DMascot;






