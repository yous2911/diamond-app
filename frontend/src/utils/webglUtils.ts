// =============================================================================
// 🌐 WEBGL UTILITIES - SAFE WEBGL CONTEXT MANAGEMENT
// =============================================================================

let webglAvailable: boolean | null = null;
let webglContextCount = 0;
const MAX_WEBGL_CONTEXTS = 8; // Limit to prevent context loss

export const checkWebGLAvailability = (): boolean => {
  if (webglAvailable !== null) {
    return webglAvailable;
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    webglAvailable = !!gl;
    
    if (webglAvailable) {
      console.log('✅ WebGL is available');
    } else {
      console.warn('⚠️ WebGL is not available');
    }
  } catch (error) {
    console.warn('⚠️ WebGL check failed:', error);
    webglAvailable = false;
  }

  return webglAvailable;
};

export const canCreateWebGLContext = (): boolean => {
  if (!checkWebGLAvailability()) {
    return false;
  }

  if (webglContextCount >= MAX_WEBGL_CONTEXTS) {
    console.warn(`⚠️ Maximum WebGL contexts (${MAX_WEBGL_CONTEXTS}) reached`);
    return false;
  }

  return true;
};

export const registerWebGLContext = (): boolean => {
  if (canCreateWebGLContext()) {
    webglContextCount++;
    console.log(`📊 WebGL contexts: ${webglContextCount}/${MAX_WEBGL_CONTEXTS}`);
    return true;
  }
  return false;
};

export const unregisterWebGLContext = (): void => {
  if (webglContextCount > 0) {
    webglContextCount--;
    console.log(`📊 WebGL contexts: ${webglContextCount}/${MAX_WEBGL_CONTEXTS}`);
  }
};

export const getWebGLFallback = (type: 'mascot' | 'wardrobe' | 'particles' = 'mascot'): string => {
  const fallbacks = {
    mascot: `
      <div style="
        width: 200px; 
        height: 200px; 
        background: linear-gradient(45deg, #8A2BE2, #4F46E5); 
        border-radius: 50%; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 48px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      ">
        🐉
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      </style>
    `,
    wardrobe: `
      <div style="
        width: 400px; 
        height: 400px; 
        background: linear-gradient(45deg, #8A2BE2, #4F46E5); 
        border-radius: 20px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-size: 64px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      ">
        👕
      </div>
    `,
    particles: `
      <div style="
        width: 100%; 
        height: 100%; 
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 48px;
          animation: sparkle 1.5s infinite;
        ">
          ✨
        </div>
      </div>
      <style>
        @keyframes sparkle {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }
      </style>
    `
  };

  return fallbacks[type];
};
