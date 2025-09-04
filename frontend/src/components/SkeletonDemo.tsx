import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SkeletonLoader from './ui/SkeletonLoader';

const SkeletonDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  const toggleLoading = () => {
    setIsLoading(!isLoading);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-diamond-50 to-diamond-100 p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold text-diamond-900 mb-4">
            ✨ Skeleton Loading System ✨
          </h1>
          <p className="text-xl text-diamond-700 mb-6">
            Premium loading states for the Diamond app
          </p>
          <motion.button
            onClick={toggleLoading}
            className="px-8 py-3 bg-gradient-to-r from-crystal-violet to-crystal-blue text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? 'Show Content' : 'Show Skeleton'}
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mascot Skeleton */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-diamond-800 mb-4 flex items-center">
              🐉 Mascot Loading
            </h2>
            {isLoading ? (
              <SkeletonLoader type="mascot" />
            ) : (
              <div className="w-64 h-64 bg-gradient-to-br from-crystal-violet to-crystal-blue rounded-full flex items-center justify-center">
                <div className="text-6xl">🐉</div>
              </div>
            )}
          </motion.div>

          {/* XP Bar Skeleton */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-diamond-800 mb-4 flex items-center">
              ⚡ XP Progress
            </h2>
            {isLoading ? (
              <SkeletonLoader type="xp-bar" />
            ) : (
              <div className="h-8 bg-gradient-to-r from-diamond-200 to-diamond-300 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-crystal-violet to-crystal-blue rounded-full w-3/4" />
              </div>
            )}
          </motion.div>

          {/* Wardrobe Skeleton */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-diamond-800 mb-4 flex items-center">
              👕 Wardrobe Items
            </h2>
            {isLoading ? (
              <SkeletonLoader type="wardrobe" />
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="w-20 h-20 bg-gradient-to-br from-crystal-green to-crystal-blue rounded-xl flex items-center justify-center text-2xl"
                  >
                    {item === 1 ? '👑' : item === 2 ? '🦸' : item === 3 ? '⚔️' : item === 4 ? '🛡️' : item === 5 ? '👟' : '💎'}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Exercise Skeleton */}
          <motion.div
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-diamond-800 mb-4 flex items-center">
              🧮 Math Exercise
            </h2>
            {isLoading ? (
              <SkeletonLoader type="exercise" />
            ) : (
              <div className="p-6 bg-gradient-to-br from-crystal-yellow to-crystal-orange rounded-2xl text-center">
                <div className="text-3xl font-bold text-white mb-4">7 + 8 = ?</div>
                <div className="flex gap-3 justify-center">
                  <button className="w-20 h-10 bg-white/20 rounded-lg text-white font-semibold hover:bg-white/30 transition-colors">
                    15
                  </button>
                  <button className="w-20 h-10 bg-white/20 rounded-lg text-white font-semibold hover:bg-white/30 transition-colors">
                    16
                  </button>
                  <button className="w-20 h-10 bg-white/20 rounded-lg text-white font-semibold hover:bg-white/30 transition-colors">
                    14
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Performance Info */}
        <motion.div
          className="mt-12 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
        >
          <h3 className="text-xl font-bold text-diamond-800 mb-3">
            🚀 Performance Optimizations Applied
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-diamond-700">
            <div className="bg-diamond-50 rounded-lg p-3">
              <div className="font-semibold text-diamond-800">React.memo</div>
              <div>Prevents unnecessary re-renders</div>
            </div>
            <div className="bg-diamond-50 rounded-lg p-3">
              <div className="font-semibold text-diamond-800">useMemo</div>
              <div>Optimizes expensive calculations</div>
            </div>
            <div className="bg-diamond-50 rounded-lg p-3">
              <div className="font-semibold text-diamond-800">Skeleton Loading</div>
              <div>Premium user experience</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SkeletonDemo;
