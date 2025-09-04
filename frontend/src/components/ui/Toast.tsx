import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =====================================================
// TOAST HOOK AND COMPONENT
// =====================================================

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 5000,
  position = 'top-right',
  onClose
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const typeStyles = {
    success: 'bg-green-500 border-green-600',
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600'
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <motion.div
      className={`fixed ${positionStyles[position]} z-50 max-w-sm w-full`}
      initial={{ opacity: 0, x: position.includes('right') ? 100 : -100, y: position.includes('top') ? -100 : 100 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
    >
      <div className={`${typeStyles[type]} text-white p-4 rounded-xl shadow-lg border-l-4 flex items-center gap-3`}>
        <span className="text-lg">{typeIcons[type]}</span>
        <span className="flex-1 font-medium">{message}</span>
        <button
          onClick={() => onClose(id)}
          className="text-white/80 hover:text-white text-lg transition-colors"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
};

interface ToastItem extends Omit<ToastProps, 'onClose'> {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const success = useCallback((message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'success' }), [addToast]);

  const error = useCallback((message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'error' }), [addToast]);

  const warning = useCallback((message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'warning' }), [addToast]);

  const info = useCallback((message: string, options?: Partial<ToastItem>) => 
    addToast({ ...options, message, type: 'info' }), [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
}

// Toast Container
export const ToastContainer: React.FC<{ toasts: ToastItem[]; onClose: (id: string) => void }> = ({
  toasts,
  onClose
}) => {
  return (
    <AnimatePresence>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onClose}
        />
      ))}
    </AnimatePresence>
  );
};
