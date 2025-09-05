import React from 'react';

const SkeletonLoader: React.FC<{ type: 'mascot' | 'xp-bar' | 'wardrobe' | 'exercise' | 'card' }> = ({ type }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'mascot':
        return (
          <div className="w-64 h-64 bg-gradient-to-br from-diamond-100 to-diamond-200 rounded-full animate-pulse">
            <div className="w-full h-full bg-gradient-to-br from-crystal-violet/20 to-crystal-blue/20 rounded-full animate-pulse" />
          </div>
        );
      case 'xp-bar':
        return (
          <div className="w-full h-8 bg-diamond-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-crystal-violet to-crystal-blue animate-pulse" style={{ width: '60%' }} />
          </div>
        );
      case 'wardrobe':
        return (
          <div className="w-full h-96 bg-gradient-to-br from-diamond-100 to-diamond-200 rounded-2xl animate-pulse">
            <div className="grid grid-cols-3 gap-4 p-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-crystal-violet/20 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        );
      case 'exercise':
        return (
          <div className="w-full h-64 bg-gradient-to-br from-diamond-100 to-diamond-200 rounded-2xl animate-pulse p-6">
            <div className="h-8 bg-crystal-violet/20 rounded-lg mb-4 animate-pulse" />
            <div className="h-32 bg-crystal-blue/20 rounded-lg animate-pulse" />
          </div>
        );
      default:
        return (
          <div className="w-full h-32 bg-gradient-to-br from-diamond-100 to-diamond-200 rounded-2xl animate-pulse" />
        );
    }
  };

  return renderSkeleton();
};

export default SkeletonLoader;
