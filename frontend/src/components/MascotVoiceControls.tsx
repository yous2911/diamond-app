/**
 * MascotVoiceControls Component
 * Provides UI controls for mascot voice settings
 */

import React, { useState } from 'react';
import { Volume2, VolumeX, Settings, X } from 'lucide-react';
import { useMascotVoice, MascotVoiceConfig } from '../hooks/useMascotVoice';
import { motion, AnimatePresence } from 'framer-motion';

interface MascotVoiceControlsProps {
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  locale: 'fr' | 'en';
  className?: string;
}

export const MascotVoiceControls: React.FC<MascotVoiceControlsProps> = ({
  mascotType,
  locale,
  className = '',
}) => {
  const { config, updateConfig, toggleEnabled, isSupported, isSpeaking, availableVoices } = useMascotVoice(mascotType, locale);
  const [showSettings, setShowSettings] = useState(false);

  if (!isSupported) {
    return null; // Don't show controls if TTS is not supported
  }

  const voicesForLang = availableVoices.filter(v => 
    v.lang.startsWith(locale === 'fr' ? 'fr' : 'en')
  );

  return (
    <div className={`relative ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={toggleEnabled}
        className={`p-2 rounded-full transition-all duration-200 ${
          config.enabled
            ? 'bg-purple-500 hover:bg-purple-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
        } ${isSpeaking ? 'animate-pulse' : ''}`}
        aria-label={config.enabled ? 'Désactiver la voix' : 'Activer la voix'}
        title={config.enabled ? 'Voix activée' : 'Voix désactivée'}
      >
        {config.enabled ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
            />

            {/* Settings Panel */}
            <motion.div
              className="fixed bottom-20 right-4 bg-white rounded-2xl shadow-2xl p-6 z-50 w-80 max-w-[90vw]"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Réglages de la voix</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Volume Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume: {Math.round(config.volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.volume}
                    onChange={(e) => updateConfig({ volume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Rate Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vitesse: {config.rate.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={config.rate}
                    onChange={(e) => updateConfig({ rate: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Pitch Control */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hauteur: {config.pitch.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={config.pitch}
                    onChange={(e) => updateConfig({ pitch: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Voice Selection */}
                {voicesForLang.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voix
                    </label>
                    <select
                      value={config.voiceName || ''}
                      onChange={(e) => updateConfig({ voiceName: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="">Voix par défaut</option>
                      {voicesForLang.map((voice) => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name} {voice.localService ? '(Locale)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status */}
                {isSpeaking && (
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    La mascotte parle...
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Paramètres de la voix"
        title="Paramètres"
      >
        <Settings className="w-3 h-3 text-gray-600" />
      </button>
    </div>
  );
};

export default MascotVoiceControls;


