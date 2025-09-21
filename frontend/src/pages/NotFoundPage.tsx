import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-white text-center p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-8xl font-bold text-purple-400 mb-4">404</h1>
        <h2 className="text-4xl font-semibold mb-2">Page non trouvée</h2>
        <p className="text-lg text-gray-400 mb-8">
          Oups! La page que vous cherchez n'existe pas.
        </p>
        <Link to="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300"
          >
            Retour à l'accueil
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
