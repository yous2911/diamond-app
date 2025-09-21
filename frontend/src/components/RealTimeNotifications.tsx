/**
 * REAL-TIME NOTIFICATIONS COMPONENT
 * Shows live progress updates and celebrations
 * Connects to WebSocket for instant feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, BellOff, Star, Target, Flame, Trophy, BookOpen } from 'lucide-react';

interface Notification {
  id: string;
  type: 'progress_update' | 'level_up_celebration' | 'streak_celebration' | 'competency_mastery_celebration' | 'daily_goal_achieved';
  title: string;
  message: string;
  icon: string;
  color: string;
  duration?: number;
  celebration?: {
    confetti: boolean;
    duration: number;
  };
  timestamp: Date;
}

interface RealTimeNotificationsProps {
  userId: number;
  userType: 'student' | 'parent';
  onNotificationReceived?: (notification: Notification) => void;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  userId,
  userType,
  onNotificationReceived
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showCelebration, setShowCelebration] = useState<Notification | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
  // Ensure WS_URL is properly constructed - remove any existing path and add /ws
  const baseUrl = API_URL.replace(/\/api.*$/, '').replace('http', 'ws');
  const WS_URL = baseUrl + '/ws';

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        console.log('Attempting to connect to WebSocket:', WS_URL);
        const websocket = new WebSocket(WS_URL);
        
        websocket.onopen = () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
          
          // Register user connection
          websocket.send(JSON.stringify({
            type: 'register',
            userId,
            userType
          }));
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        websocket.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        websocket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setIsConnected(false);
        };

        setWs(websocket);
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setIsConnected(false);
        // Fallback: try to reconnect after 5 seconds (only if not in test env)
        if (process.env.NODE_ENV !== 'test') {
          setTimeout(connectWebSocket, 5000);
        }
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [userId, userType, WS_URL]);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'progress_update':
        addNotification({
          id: generateId(),
          type: 'progress_update',
          title: 'Exercice terminé !',
          message: `Score: ${data.update.data.score}%`,
          icon: '📝',
          color: 'bg-blue-500',
          duration: 3000,
          timestamp: new Date(data.update.timestamp)
        });
        break;

      case 'level_up_celebration':
        const levelUpNotification: Notification = {
          id: generateId(),
          type: 'level_up_celebration',
          title: data.celebration.title,
          message: data.celebration.message,
          icon: '⭐',
          color: 'bg-yellow-500',
          duration: data.celebration.duration,
          celebration: {
            confetti: data.celebration.confetti,
            duration: data.celebration.duration
          },
          timestamp: new Date(data.update.timestamp)
        };
        
        addNotification(levelUpNotification);
        if (data.celebration.confetti) {
          setShowCelebration(levelUpNotification);
          setTimeout(() => setShowCelebration(null), data.celebration.duration);
        }
        break;

      case 'streak_celebration':
        const streakNotification: Notification = {
          id: generateId(),
          type: 'streak_celebration',
          title: data.celebration.title,
          message: data.celebration.message,
          icon: '🔥',
          color: 'bg-orange-500',
          duration: data.celebration.duration,
          celebration: {
            confetti: data.celebration.confetti,
            duration: data.celebration.duration
          },
          timestamp: new Date(data.update.timestamp)
        };
        
        addNotification(streakNotification);
        if (data.celebration.confetti) {
          setShowCelebration(streakNotification);
          setTimeout(() => setShowCelebration(null), data.celebration.duration);
        }
        break;

      case 'competency_mastery_celebration':
        const masteryNotification: Notification = {
          id: generateId(),
          type: 'competency_mastery_celebration',
          title: data.celebration.title,
          message: data.celebration.message,
          icon: '🎯',
          color: 'bg-green-500',
          duration: data.celebration.duration,
          celebration: {
            confetti: data.celebration.confetti,
            duration: data.celebration.duration
          },
          timestamp: new Date(data.update.timestamp)
        };
        
        addNotification(masteryNotification);
        if (data.celebration.confetti) {
          setShowCelebration(masteryNotification);
          setTimeout(() => setShowCelebration(null), data.celebration.duration);
        }
        break;

      case 'daily_goal_achieved':
        addNotification({
          id: generateId(),
          type: 'daily_goal_achieved',
          title: 'Objectif quotidien atteint !',
          message: data.data.message,
          icon: '🏆',
          color: 'bg-purple-500',
          duration: 4000,
          timestamp: new Date()
        });
        break;

      case 'child_progress_notification':
        // For parent notifications
        if (userType === 'parent') {
          addNotification({
            id: generateId(),
            type: 'progress_update',
            title: data.notification.title,
            message: data.notification.message,
            icon: data.notification.icon,
            color: data.notification.color,
            duration: 5000,
            timestamp: new Date()
          });
        }
        break;
    }
  }, [userType]);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
    
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  const getIconComponent = (iconString: string) => {
    switch (iconString) {
      case '📝': return <BookOpen className="w-5 h-5" />;
      case '⭐': return <Star className="w-5 h-5" />;
      case '🔥': return <Flame className="w-5 h-5" />;
      case '🎯': return <Target className="w-5 h-5" />;
      case '🏆': return <Trophy className="w-5 h-5" />;
      default: return <span className="text-lg">{iconString}</span>;
    }
  };

  return (
    <>
      {/* Connection Status */}
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
            isConnected
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {isConnected ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {isConnected ? 'Notifications actives' : 'Reconnexion...'}
        </motion.div>
      </div>

      {/* Notifications Container */}
      <div className="fixed top-20 right-4 z-40 w-80 max-w-sm space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              className={`${notification.color} rounded-xl p-4 text-white shadow-lg backdrop-blur-sm`}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                mass: 0.8
              }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-white/20 rounded-lg p-2">
                    {getIconComponent(notification.icon)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{notification.title}</h3>
                    <p className="text-sm opacity-90 mt-1">{notification.message}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {notification.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="bg-white/20 rounded-lg p-1 hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Full-Screen Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Confetti Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10px'
                  }}
                  animate={{
                    y: window.innerHeight + 20,
                    rotate: 360,
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                />
              ))}
            </div>

            {/* Celebration Content */}
            <motion.div
              className="bg-white rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20 
              }}
            >
              <motion.div
                className="text-8xl mb-4"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {showCelebration.icon}
              </motion.div>
              
              <motion.h1
                className="text-3xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {showCelebration.title}
              </motion.h1>
              
              <motion.p
                className="text-lg text-gray-600 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {showCelebration.message}
              </motion.p>
              
              <motion.button
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-semibold shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCelebration(null)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Continuer ! ✨
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RealTimeNotifications;