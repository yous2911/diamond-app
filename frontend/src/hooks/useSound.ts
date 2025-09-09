import { useCallback } from 'react';

export const useSound = () => {
  const play = useCallback((soundType: string) => {
    // Simple sound hook - production would use actual audio files
    // Playing sound effect
  }, []);

  const stop = useCallback(() => {
    // Stopping sound
  }, []);

  const setVolume = useCallback((volume: number) => {
    // Setting volume level
  }, []);

  return { play, playSound: play, stop, setVolume };
};