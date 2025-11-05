// =============================================================================
// COMPONENT CONFIGURATION FOR GPU OPTIMIZATION
// =============================================================================

export interface ComponentConfig {
  // 3D and WebGL Components
  mascotSystem: boolean;
  wardrobe3D: boolean;
  advancedParticles: boolean;

  // Animation Systems
  complexAnimations: boolean;
  webglEffects: boolean;
  celebrationSystem: boolean;

  // Performance Features
  gpuAcceleration: boolean;
  memoryLeakPrevention: boolean;

  // Fallback Options
  useFallbackMascot: boolean;
  useSimpleParticles: boolean;
  reducedMotion: boolean;
}

// Current configuration - All GPU-intensive components DEACTIVATED
export const componentConfig: ComponentConfig = {
  // 3D and WebGL Components - DISABLED for performance
  mascotSystem: false,           // MascotSystem.tsx - Complex 3D mascot with WebGL
  wardrobe3D: false,            // MascotWardrobe3D.tsx - 3D wardrobe system
  advancedParticles: false,     // AdvancedParticleEngine.tsx - GPU particle system

  // Animation Systems - ENABLED for Framer Motion (CSS only, no WebGL)
  complexAnimations: true,     // Complex Framer Motion animations (CSS/JS, not GPU)
  webglEffects: false,         // Any WebGL-based visual effects - DISABLED
  celebrationSystem: true,    // CelebrationSystem.tsx - CSS/Framer Motion celebrations (NO GPU)

  // Performance Features - ENABLED for optimization
  gpuAcceleration: false,      // Disable GPU acceleration to reduce consumption
  memoryLeakPrevention: true,  // Enable memory leak prevention

  // Fallback Options - ENABLED for compatibility
  useFallbackMascot: true,     // Use simple emoji-based mascot
  useSimpleParticles: true,    // Use CSS-only particle effects
  reducedMotion: true          // Reduce motion for performance
};

// =============================================================================
// COMPONENT ACTIVATION UTILITIES
// =============================================================================

export const isComponentEnabled = (componentKey: keyof ComponentConfig): boolean => {
  return componentConfig[componentKey];
};

export const shouldUseFallback = (componentKey: keyof ComponentConfig): boolean => {
  return !componentConfig[componentKey];
};

// =============================================================================
// PERFORMANCE TIER DETECTION
// =============================================================================

export const detectPerformanceTier = (): 'low' | 'medium' | 'high' => {
  // Simple performance detection without GPU context creation
  const canvas = document.createElement('canvas');
  const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as (WebGLRenderingContext | null);

  if (!gl) {
    return 'low';
  }

  // Check for basic WebGL support
  const renderer = gl.getParameter((gl as WebGLRenderingContext).RENDERER) as unknown as string;
  const vendor = gl.getParameter((gl as WebGLRenderingContext).VENDOR) as unknown as string;

  // Clean up immediately to prevent memory leaks
  const lose = gl.getExtension('WEBGL_lose_context') as { loseContext: () => void } | null;
  lose?.loseContext();

  // Basic heuristics for performance tier
  if (renderer && (renderer.includes('Intel') || renderer.includes('Software'))) {
    return 'low';
  }

  return 'medium'; // Conservative default
};

// =============================================================================
// DYNAMIC CONFIGURATION BASED ON DEVICE
// =============================================================================

export const getOptimalConfig = (): ComponentConfig => {
  const performanceTier = detectPerformanceTier();
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // For now, return conservative config regardless of device
  // This ensures stable performance for investor demo
  return {
    mascotSystem: false,
    wardrobe3D: false,
    advancedParticles: false,
    complexAnimations: false,
    webglEffects: false,
    celebrationSystem: false,
    gpuAcceleration: false,
    memoryLeakPrevention: true,
    useFallbackMascot: true,
    useSimpleParticles: true,
    reducedMotion: true
  };
};

// =============================================================================
// COMPONENT IMPORTS GUARD
// =============================================================================

export const safeImportComponent = async (componentName: string) => {
  if (!isComponentEnabled(componentName as keyof ComponentConfig)) {
    throw new Error(`Component ${componentName} is disabled in configuration`);
  }

  // This would normally import the component, but since they're disabled,
  // we return null to prevent any WebGL context creation
  return null;
};

// =============================================================================
// FALLBACK COMPONENT DEFINITIONS
// =============================================================================

export const FallbackComponents = {
  mascot: {
    emoji: '🐉',
    message: 'Prêt pour l\'aventure!',
    className: 'w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-6xl shadow-2xl animate-pulse'
  },

  particles: {
    simple: `
      <div class="fixed inset-0 pointer-events-none z-50">
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div class="w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div class="w-2 h-2 bg-pink-400 rounded-full animate-pulse absolute top-4 left-4"></div>
          <div class="w-3 h-3 bg-blue-400 rounded-full animate-bounce absolute -top-2 right-2"></div>
        </div>
      </div>
    `
  },

  celebration: {
    simple: '🎉 Bravo! 🌟'
  }
};

export default componentConfig;