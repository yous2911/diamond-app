import React, { Suspense, lazy } from 'react';
import SkeletonLoader from './ui/SkeletonLoader';
import { componentConfig, isComponentEnabled, FallbackComponents } from '../config/componentConfig';

// =============================================================================
// LAZY LOADING SYSTEM FOR PERFORMANCE BOOST
// =============================================================================

// DEACTIVATED: GPU-intensive components disabled to prevent WebGL context leaks
// These components are commented out to ensure they are not loaded
// export const LazyMascotSystem = lazy(() => import('./MascotSystem'));
// export const LazyMascotWardrobe3D = lazy(() => import('./mascot/MascotWardrobe3D'));
// export const LazyAdvancedParticleEngine = lazy(() => import('./AdvancedParticleEngine'));

// Safe lazy loading with configuration check
const createSafeLazyComponent = (importFn: () => Promise<any>, componentName: string) => {
  return lazy(async () => {
    if (!isComponentEnabled(componentName as any)) {
      // Return a fallback component instead of the actual component
      return {
        default: () => (
          <div className="p-4 text-center text-gray-500">
            <p>Component {componentName} is disabled for performance optimization</p>
          </div>
        )
      };
    }
    return importFn();
  });
};


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

// DEACTIVATED: Smart components now use fallbacks instead of GPU-intensive components
export const SmartMascotSystem = (props: any) => {
  if (!isComponentEnabled('mascotSystem')) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <div className={FallbackComponents.mascot.className}>
          {FallbackComponents.mascot.emoji}
        </div>
        <div className="mt-2 text-center">
          <p className="text-white text-sm font-semibold">Mascotte</p>
          <p className="text-white/80 text-xs">{FallbackComponents.mascot.message}</p>
        </div>
      </div>
    );
  }
  return null; // Component disabled
};

// 3D Wardrobe fallback
export const SmartWardrobe3D = (props: any) => {
  if (!isComponentEnabled('wardrobe3D')) {
    return (
      <div className="p-6 text-center bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40">
        <div className="text-4xl mb-2">👔</div>
        <p className="text-gray-600">Garde-robe désactivée pour optimiser les performances</p>
        <p className="text-sm text-gray-500 mt-1">Sera disponible dans une prochaine version</p>
      </div>
    );
  }
  return null; // Component disabled
};

// Particle engine fallback
export const SmartParticleEngine = (props: any) => {
  if (!isComponentEnabled('advancedParticles') && props.isActive) {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse absolute top-4 left-4"></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce absolute -top-2 right-2"></div>
        </div>
      </div>
    );
  }
  return null; // Component disabled or not active
};


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
      // Component loaded successfully
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
  LazyMentalMathExercise,
  LazyDragDropExercise,
  LazyAchievementBadges,
  LazyProgressTracker,
  LazyComponentWrapper,
  SmartMascotSystem,
  SmartWardrobe3D,
  SmartParticleEngine,
  SmartMentalMath,
  SmartAchievementBadges,
  SmartProgressTracker,
  useLazyLoadingPerformance
};
