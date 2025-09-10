import React, { Suspense, lazy } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PremiumFeaturesProvider } from './contexts/PremiumFeaturesContext';
import { CelebrationProvider } from './contexts/CelebrationContext';
import GlobalPremiumLayout from './components/GlobalPremiumLayout';
import RealTimeNotifications from './components/RealTimeNotifications';

// Import newly extracted components
import SkeletonLoader from './components/ui/SkeletonLoader';

// Lazy load pages for code-splitting
const HomePage = lazy(() => import('./pages/HomePage'));
const ExercisePage = lazy(() => import('./pages/ExercisePage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const LoginScreen = lazy(() => import('./components/LoginScreen'));

// =============================================================================
//  LAYOUT PRINCIPAL AVEC ÉLÉMENTS PARTAGÉS
// =============================================================================
const MainLayout = () => {
  const { student } = useAuth();
  
  // This layout will wrap all authenticated pages with premium features
  return (
    <PremiumFeaturesProvider initialXP={75} initialLevel={3}>
      <CelebrationProvider>
        <GlobalPremiumLayout showXPBar={false} xpPosition="floating">
          {/* Real-time notifications for students */}
          {student && (
            <RealTimeNotifications 
              userId={student.id} 
              userType="student" 
            />
          )}
          
          {/* Outlet renders the current page component from the router */}
          <Outlet />
        </GlobalPremiumLayout>
      </CelebrationProvider>
    </PremiumFeaturesProvider>
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
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          {/* Add other routes here, e.g., /wardrobe */}
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