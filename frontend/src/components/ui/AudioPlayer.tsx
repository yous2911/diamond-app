import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  showControls?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  autoPlay = false,
  showControls = true,
  className = '',
  onPlay,
  onPause,
  onEnded,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError('Erreur de chargement audio');
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
    };
  }, [onPlay, onPause, onEnded]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (autoPlay && audioRef.current && !isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('Auto-play failed:', err);
        setError('Lecture automatique impossible');
      });
    }
  }, [autoPlay, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error('Play failed:', err);
        setError('Impossible de lire l\'audio');
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  if (!audioUrl) {
    return null;
  }

  return (
    <div className={`audio-player flex items-center gap-2 ${className}`}>
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        className="hidden"
      />

      {showControls && (
        <>
          <button
            onClick={togglePlay}
            disabled={isLoading || !!error}
            className={`
              flex items-center justify-center w-10 h-10 rounded-full
              transition-all duration-200
              ${isPlaying
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600
                [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:border-0"
              aria-label="Volume"
            />
          </div>
        </>
      )}

      {error && (
        <span className="text-sm text-red-600" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

// Composant simplifié pour bouton "Lire" uniquement
export const AudioPlayButton: React.FC<{
  audioUrl: string;
  label?: string;
  className?: string;
}> = ({ audioUrl, label = '🔊 Lire', className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((err) => {
        console.error('Play failed:', err);
      });
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  if (!audioUrl) return null;

  return (
    <>
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
      <button
        onClick={togglePlay}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg
          transition-all duration-200
          ${isPlaying
            ? 'bg-blue-600 text-white'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${className}
        `}
        aria-label={isPlaying ? 'Pause' : 'Lire'}
      >
        {isPlaying ? '⏸️ Pause' : label}
      </button>
    </>
  );
};

