import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioOptions {
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
  onEnded?: () => void;
  onError?: (error: Error) => void;
}

export const useAudio = (src: string | null, options: UseAudioOptions = {}) => {
  const {
    autoPlay = false,
    loop = false,
    volume: initialVolume = 1,
    onEnded,
    onError,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(initialVolume);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    const audio = new Audio(src);
    audio.loop = loop;
    audio.volume = initialVolume;
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleError = () => {
      setIsLoading(false);
      onError?.(new Error('Erreur lors du chargement de l\'audio'));
    };
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    if (autoPlay) {
      audio.play().catch(() => {
        // Auto-play blocked by browser
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.pause();
      audio.src = '';
    };
  }, [src, loop, initialVolume, autoPlay, onEnded, onError]);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.play().catch((error) => {
      console.error('Error playing audio:', error);
      onError?.(error);
    });
  }, [onError]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const setVolumeValue = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    audio.volume = clampedVolume;
    setVolume(clampedVolume);
    setIsMuted(clampedVolume === 0);
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = muted;
    setIsMuted(muted);
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, time));
  }, [duration]);

  const reset = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    pause();
  }, [pause]);

  return {
    isPlaying,
    isMuted,
    volume,
    duration,
    currentTime,
    isLoading,
    play,
    pause,
    toggle,
    setVolume: setVolumeValue,
    setMuted,
    seek,
    reset,
  };
};

export default useAudio;

