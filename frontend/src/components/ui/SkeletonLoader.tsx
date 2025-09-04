import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  type: 'mascot' | 'xp-bar' | 'wardrobe' | 'exercise' | 'card';
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'mascot':
        return (
          <motion.div 
            className={`w-64 h-64 bg-gradient-to-br from-diamond-200 to-diamond-300 rounded-full ${className}`}
            animate={{ 
              opacity: [0.5, 1, 0.5],
              scale: [0.98, 1, 0.98]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mt-8" />
            <div className="w-24 h-4 bg-white/20 rounded mx-auto mt-4" />
            <div className="w-20 h-3 bg-white/20 rounded mx-auto mt-3" />
          </motion.div>
        );

      case 'xp-bar':
        return (
          <motion.div 
            className={`h-8 bg-gradient-to-r from-diamond-100 to-diamond-200 rounded-full overflow-hidden ${className}`}
            animate={{ 
              background: [
                "linear-gradient(90deg, #e1e8ff 0%, #c7d2ff 50%, #a5b4ff 100%)",
                "linear-gradient(90deg, #a5b4ff 0%, #8b9fff 50%, #6366f1 100%)",
                "linear-gradient(90deg, #e1e8ff 0%, #c7d2ff 50%, #a5b4ff 100%)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-full bg-gradient-to-r from-crystal-violet to-crystal-blue rounded-full w-1/3" />
          </motion.div>
        );

      case 'wardrobe':
        return (
          <div className={`grid grid-cols-3 gap-4 ${className}`}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <motion.div
                key={item}
                className="w-20 h-20 bg-gradient-to-br from-diamond-200 to-diamond-300 rounded-xl"
                animate={{ 
                  opacity: [0.6, 1, 0.6],
                  scale: [0.95, 1, 0.95]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: item * 0.1,
                  ease: "easeInOut" 
                }}
              />
            ))}
          </div>
        );

      case 'exercise':
        return (
          <motion.div 
            className={`p-6 bg-white/80 rounded-2xl backdrop-blur-sm ${className}`}
            animate={{ 
              opacity: [0.7, 1, 0.7],
              y: [0, -2, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-32 h-6 bg-diamond-200 rounded mb-4" />
            <div className="w-48 h-4 bg-diamond-200 rounded mb-3" />
            <div className="w-40 h-4 bg-diamond-200 rounded mb-4" />
            <div className="flex gap-3">
              <div className="w-20 h-10 bg-diamond-200 rounded-lg" />
              <div className="w-20 h-10 bg-diamond-200 rounded-lg" />
              <div className="w-20 h-10 bg-diamond-200 rounded-lg" />
            </div>
          </motion.div>
        );

      case 'card':
        return (
          <motion.div 
            className={`p-4 bg-white/60 rounded-xl backdrop-blur-sm ${className}`}
            animate={{ 
              opacity: [0.8, 1, 0.8],
              scale: [0.98, 1, 0.98]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="w-full h-4 bg-diamond-200 rounded mb-3" />
            <div className="w-3/4 h-3 bg-diamond-200 rounded mb-2" />
            <div className="w-1/2 h-3 bg-diamond-200 rounded" />
          </motion.div>
        );

      default:
        return (
          <motion.div 
            className={`w-32 h-32 bg-gradient-to-br from-diamond-200 to-diamond-300 rounded-lg ${className}`}
            animate={{ 
              opacity: [0.5, 1, 0.5],
              rotate: [0, 5, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;
