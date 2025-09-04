import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// PREMIUM MICRO-INTERACTIONS FOR DIAMOND APP
// =============================================================================

// Loading spinner with magical theme
export const MagicalSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-full h-full border-2 border-diamond-200 border-t-crystal-violet rounded-full" />
    </motion.div>
  );
};

// Pulse loading with crystal effect
export const CrystalPulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    className={`w-4 h-4 bg-gradient-to-br from-crystal-violet to-crystal-blue rounded-full ${className}`}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
      boxShadow: [
        "0 0 0 0 rgba(139, 92, 246, 0.4)",
        "0 0 0 10px rgba(139, 92, 246, 0)",
        "0 0 0 0 rgba(139, 92, 246, 0)"
      ]
    }}
    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
  />
);

// Floating particles for loading states
export const FloatingParticles: React.FC<{ count?: number; className?: string }> = ({ 
  count = 5, 
  className = '' 
}) => (
  <div className={`relative ${className}`}>
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-crystal-violet rounded-full"
        animate={{
          y: [0, -20, 0],
          opacity: [0, 1, 0],
          scale: [0, 1, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: i * 0.2,
          ease: "easeInOut"
        }}
        style={{
          left: `${(i / count) * 100}%`
        }}
      />
    ))}
  </div>
);

// Progress bar with magical animation
export const MagicalProgressBar: React.FC<{
  progress: number;
  className?: string;
  showParticles?: boolean;
}> = ({ progress, className = '', showParticles = true }) => (
  <div className={`relative ${className}`}>
    <div className="w-full h-3 bg-diamond-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-crystal-violet via-crystal-blue to-crystal-green"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      
      {showParticles && (
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            backgroundPosition: "-100% 0"
          }}
        />
      )}
    </div>
  </div>
);

// Button with magical hover effects
export const MagicalButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    primary: 'bg-gradient-to-r from-crystal-violet to-crystal-blue hover:from-crystal-blue hover:to-crystal-violet',
    secondary: 'bg-gradient-to-r from-diamond-200 to-diamond-300 hover:from-diamond-300 hover:to-diamond-400',
    success: 'bg-gradient-to-r from-crystal-green to-crystal-blue hover:from-crystal-blue hover:to-crystal-green',
    warning: 'bg-gradient-to-r from-crystal-yellow to-crystal-orange hover:from-crystal-orange hover:to-crystal-yellow'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <motion.button
      className={`
        ${variants[variant]} ${sizes[size]}
        text-white font-semibold rounded-xl shadow-lg
        transform transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      animate={{
        boxShadow: isHovered 
          ? "0 10px 25px rgba(139, 92, 246, 0.4)" 
          : "0 4px 15px rgba(139, 92, 246, 0.2)"
      }}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center justify-center space-x-2"
          >
            <MagicalSpinner size="sm" />
            <span>Chargement...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Magical particles on hover */}
      <AnimatePresence>
        {isHovered && !disabled && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FloatingParticles count={3} className="absolute top-0 left-1/2 transform -translate-x-1/2" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Card with magical hover effects
export const MagicalCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}> = ({ children, className = '', hoverEffect = true }) => (
  <motion.div
    className={`
      bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg
      border border-diamond-100
      ${className}
    `}
    whileHover={hoverEffect ? { 
      scale: 1.02, 
      y: -5,
      boxShadow: "0 20px 40px rgba(139, 92, 246, 0.15)"
    } : {}}
    transition={{ duration: 0.3, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

// Input with magical focus effects
export const MagicalInput: React.FC<{
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  type?: string;
}> = ({ placeholder, value, onChange, className = '', type = 'text' }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <motion.input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="
          w-full px-4 py-3 bg-white/60 backdrop-blur-sm
          border-2 border-diamond-200 rounded-xl
          text-diamond-900 placeholder-diamond-400
          focus:outline-none focus:ring-2 focus:ring-crystal-violet
          transition-all duration-300
        "
        animate={{
          borderColor: isFocused ? "#8b5cf6" : "#e1e8ff",
          boxShadow: isFocused 
            ? "0 0 0 3px rgba(139, 92, 246, 0.1)" 
            : "0 0 0 0 rgba(139, 92, 246, 0)"
        }}
      />
      
      {/* Focus indicator */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              background: "linear-gradient(45deg, transparent, rgba(139, 92, 246, 0.05), transparent)"
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Notification with magical entrance
export const MagicalNotification: React.FC<{
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}> = ({ 
  message, 
  type = 'info', 
  onClose, 
  autoClose = true, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const types = {
    success: 'bg-gradient-to-r from-crystal-green to-crystal-blue border-green-400',
    info: 'bg-gradient-to-r from-crystal-blue to-crystal-violet border-blue-400',
    warning: 'bg-gradient-to-r from-crystal-yellow to-crystal-orange border-yellow-400',
    error: 'bg-gradient-to-r from-crystal-red to-crystal-pink border-red-400'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`
            fixed top-4 right-4 z-50 max-w-sm
            ${types[type]} text-white p-4 rounded-xl shadow-2xl
            border-2 backdrop-blur-sm
          `}
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="flex items-center justify-between">
            <p className="font-medium">{message}</p>
            {onClose && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(() => onClose(), 300);
                }}
                className="ml-4 text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default {
  MagicalSpinner,
  CrystalPulse,
  FloatingParticles,
  MagicalProgressBar,
  MagicalButton,
  MagicalCard,
  MagicalInput,
  MagicalNotification
};
