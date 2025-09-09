import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserCentricLeaderboard from '../components/dashboard/UserCentricLeaderboard';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { student } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-6">
      <motion.div
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 bg-white/80 rounded-xl px-4 py-2 hover:bg-white transition-colors"
        >
          <Home className="w-5 h-5" />
          <span>Accueil</span>
        </button>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🏆 Classement
        </h1>

        <div></div>
      </motion.div>

      <UserCentricLeaderboard studentId={student?.id || 1} />
    </div>
  );
};

export default LeaderboardPage;