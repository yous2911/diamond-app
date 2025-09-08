import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import newly extracted components
import SkeletonLoader from './components/ui/SkeletonLoader';
import ParticleEngine from './components/ParticleEngine';
import MascottePremium from './components/MascottePremium';

// Lazy load pages for code-splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ExercisePage = lazy(() => import('./pages/ExercisePage'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));

// =============================================================================
//  LAYOUT PRINCIPAL AVEC ÉLÉMENTS PARTAGÉS
// =============================================================================
const MainLayout = () => {
  // State for shared UI elements like particles and mascot messages
  const [showParticles, setShowParticles] = useState(false);
  const [particleType, setParticleType] = useState<'success' | 'levelup' | 'magic'>('magic');
  const [mascotEmotion, setMascotEmotion] = useState<'idle' | 'happy' | 'excited' | 'thinking' | 'celebrating' | 'sleepy'>('happy');
  const [mascotMessage, setMascotMessage] = useState('');

  // This layout will wrap all authenticated pages
  return (
    <div className="min-h-screen bg-gradient-to-br from-magic-sky/30 via-magic-ocean/20 to-magic-forest/30">
      <ParticleEngine
        isActive={showParticles}
        intensity={4}
        type={particleType}
        position={{ x: 50, y: 50 }}
      />
      <MascottePremium
        emotion={mascotEmotion}
        message={mascotMessage}
      />
      {/* Outlet renders the current page component from the router */}
      <Outlet context={{ setShowParticles, setParticleType, setMascotEmotion, setMascotMessage }} />
    </div>
  );
};


// =============================================================================
// ROUTEUR DE L'APPLICATION
// =============================================================================
const AppRouter = () => {
  return (
    <Suspense fallback={<SkeletonLoader type="card" />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/exercise" element={<ExercisePage />} />
          {/* Add other routes here, e.g., /leaderboard, /wardrobe */}
        </Route>
      </Routes>
    </Suspense>
  );
};

// =============================================================================
// GESTIONNAIRE D'AUTHENTIFICATION
// =============================================================================
const AppWithAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-blue-500 flex items-center justify-center">
        <motion.div
          className="text-white text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="text-6xl mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ✨
          </motion.div>
          <h2 className="text-2xl font-bold">FastRevEd Kids</h2>
          <p className="text-lg opacity-90">Chargement...</p>
        </motion.div>
      </div>
    );
  }

  return isAuthenticated ? <AppRouter /> : (
    <Suspense fallback={<SkeletonLoader type="card" />}>
      <LoginScreen />
    </Suspense>
  );
};

// =============================================================================
// APP PRINCIPALE AVEC PROVIDERS
// =============================================================================
function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

export default App;