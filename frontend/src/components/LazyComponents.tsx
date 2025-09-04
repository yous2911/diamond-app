import React, { Suspense, lazy } from 'react';
import SkeletonLoader from './ui/SkeletonLoader';

// =============================================================================
// LAZY LOADING SYSTEM FOR PERFORMANCE BOOST
// =============================================================================

// Lazy load heavy 3D components - these have default exports
export const LazyAdvancedMascotSystem = lazy(() => import('./AdvancedMascotSystem'));
export const LazyMascotWardrobe3D = lazy(() => import('./mascot/MascotWardrobe3D'));
export const LazyAdvancedParticleEngine = lazy(() => import('./AdvancedParticleEngine'));

// Lazy load complex game components - EnhancedMathGame has named export, others have default
export const LazyEnhancedMathGame = lazy(() => 
  import('./games/EnhancedMathGame').then(module => ({ 
    default: module.EnhancedMathGame 
  }))
);
export const LazyFrenchPhonicsGame = lazy(() => 
  import('./games/FrenchPhonicsGame').then(module => ({ 
    default: module.FrenchPhonicsGame 
  }))
);
export const LazyMysteryWordGame = lazy(() => import('./games/MysteryWordGame'));

// Lazy load exercise components - these have default exports
export const LazyMentalMathExercise = lazy(() => import('./exercises/MentalMathExercise'));
export const LazyDragDropExercise = lazy(() => import('./exercises/DragDropExercise'));

// Lazy load dashboard components - these have default exports
export const LazyAchievementBadges = lazy(() => import('./dashboard/AchievementBadges'));
export const LazyProgressTracker = lazy(() => import('./progress/ProgressTracker'));

// =============================================================================
// SMART LOADING WRAPPER WITH SKELETON
// =============================================================================

interface LazyComponentWrapperProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  skeletonType?: 'mascot' | 'xp-bar' | 'wardrobe' | 'exercise' | 'card';
  className?: string;
  [key: string]: any; // Allow any props to pass through
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  component: Component,
  fallback,
  skeletonType = 'card',
  className = '',
  ...props
}) => {
  const defaultFallback = (
    <div className={`flex items-center justify-center ${className}`}>
      <SkeletonLoader type={skeletonType} />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component {...props} />
    </Suspense>
  );
};

// =============================================================================
// PERFORMANCE-OPTIMIZED COMPONENT EXPORTS
// =============================================================================

// Mascot system with smart loading
export const SmartMascotSystem = (props: any) => (
  <LazyComponentWrapper
    component={LazyAdvancedMascotSystem}
    skeletonType="mascot"
    className="w-64 h-64"
    {...props}
  />
);

// 3D Wardrobe with loading state
export const SmartWardrobe3D = (props: any) => (
  <LazyComponentWrapper
    component={LazyMascotWardrobe3D}
    skeletonType="wardrobe"
    className="w-full h-96"
    {...props}
  />
);

// Particle engine with loading
export const SmartParticleEngine = (props: any) => (
  <LazyComponentWrapper
    component={LazyAdvancedParticleEngine}
    skeletonType="card"
    className="w-full h-64"
    {...props}
  />
);

// Games with smart loading
export const SmartMathGame = (props: any) => (
  <LazyComponentWrapper
    component={LazyEnhancedMathGame}
    skeletonType="exercise"
    className="w-full h-96"
    {...props}
  />
);

export const SmartPhonicsGame = (props: any) => (
  <LazyComponentWrapper
    component={LazyFrenchPhonicsGame}
    skeletonType="exercise"
    className="w-full h-96"
    {...props}
  />
);

// Exercises with loading states
export const SmartMentalMath = (props: any) => (
  <LazyComponentWrapper
    component={LazyMentalMathExercise}
    skeletonType="exercise"
    className="w-full h-64"
    {...props}
  />
);

// Dashboard components
export const SmartAchievementBadges = (props: any) => (
  <LazyComponentWrapper
    component={LazyAchievementBadges}
    skeletonType="card"
    className="w-full"
    {...props}
  />
);

export const SmartProgressTracker = (props: any) => (
  <LazyComponentWrapper
    component={LazyProgressTracker}
    skeletonType="xp-bar"
    className="w-full"
    {...props}
  />
);

// =============================================================================
// PERFORMANCE MONITORING HOOK
// =============================================================================

export const useLazyLoadingPerformance = () => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
  const [loadTimes, setLoadTimes] = React.useState<Record<string, number>>({});

  const trackComponentLoad = React.useCallback((componentName: string) => {
    const startTime = performance.now();
    
    setLoadingStates(prev => ({ ...prev, [componentName]: true }));
    
    return () => {
      const loadTime = performance.now() - startTime;
      setLoadTimes(prev => ({ ...prev, [componentName]: loadTime }));
      setLoadingStates(prev => ({ ...prev, [componentName]: false }));
      
      // Log performance metrics
      console.log(`🚀 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    };
  }, []);

  return {
    loadingStates,
    loadTimes,
    trackComponentLoad,
    isAnyLoading: Object.values(loadingStates).some(Boolean),
    averageLoadTime: Object.values(loadTimes).length > 0 
      ? Object.values(loadTimes).reduce((a, b) => a + b, 0) / Object.values(loadTimes).length
      : 0
  };
};

export default {
  LazyAdvancedMascotSystem,
  LazyMascotWardrobe3D,
  LazyAdvancedParticleEngine,
  LazyEnhancedMathGame,
  LazyFrenchPhonicsGame,
  LazyMysteryWordGame,
  LazyMentalMathExercise,
  LazyDragDropExercise,
  LazyAchievementBadges,
  LazyProgressTracker,
  LazyComponentWrapper,
  SmartMascotSystem,
  SmartWardrobe3D,
  SmartParticleEngine,
  SmartMathGame,
  SmartPhonicsGame,
  SmartMentalMath,
  SmartAchievementBadges,
  SmartProgressTracker,
  useLazyLoadingPerformance
};
