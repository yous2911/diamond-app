import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserCentricLeaderboard from '../components/dashboard/UserCentricLeaderboard';
import AnimatedSection from '../components/ui/AnimatedSection';
import MagneticButton from '../components/ui/MagneticButton';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { student } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <AnimatedSection delay={0}>
        <motion.div
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MagneticButton
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Home className="w-5 h-5" />
            <span>Accueil</span>
          </MagneticButton>

          <motion.h1
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
          >
            🏆 Classement
          </motion.h1>

          <div></div>
        </motion.div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <UserCentricLeaderboard studentId={student?.id || 1} />
      </AnimatedSection>
    </div>
  );
};

export default LeaderboardPage;