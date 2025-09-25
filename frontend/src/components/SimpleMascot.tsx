import React, { useState, useEffect } from 'react';

interface SimpleMascotProps {
  studentName: string;
  level: number;
  xp: number;
  onInteraction: (type: string) => void;
}

const SimpleMascot: React.FC<SimpleMascotProps> = ({ 
  studentName, 
  level, 
  xp, 
  onInteraction 
}) => {
  const [mood, setMood] = useState<'happy' | 'excited' | 'thinking' | 'celebrating'>('happy');
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const mascotMessages = {
    happy: `Hello ${studentName}! Ready to learn? 🎓`,
    excited: `Wow! You're doing great! Keep it up! ⭐`,
    thinking: `Hmm, let me think about this exercise... 🤔`,
    celebrating: `Amazing! You earned ${xp} XP! 🎉`
  };

  useEffect(() => {
    setMessage(mascotMessages[mood]);
  }, [mood, studentName, xp]);

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
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Your Learning Companion</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Mascot Avatar */}
        <div 
          className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center cursor-pointer transform hover:scale-105 transition-transform"
          onClick={handleClick}
        >
          <span className="text-4xl">
            {mood === 'happy' && '😊'}
            {mood === 'excited' && '🤩'}
            {mood === 'thinking' && '🤔'}
            {mood === 'celebrating' && '🎉'}
          </span>
        </div>
        
        {/* Mascot Info */}
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-gray-700 font-medium">{message}</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleFeed}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
            >
              Feed 🍎
            </button>
            <button
              onClick={handlePlay}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
            >
              Play 🎮
            </button>
          </div>
        </div>
      </div>
      
      {/* Mascot Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-blue-50 rounded p-2">
          <div className="font-medium text-blue-800">Level</div>
          <div className="text-blue-600">{level}</div>
        </div>
        <div className="bg-green-50 rounded p-2">
          <div className="font-medium text-green-800">XP</div>
          <div className="text-green-600">{xp}</div>
        </div>
      </div>
    </div>
  );
};

export default SimpleMascot;


