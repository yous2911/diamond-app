import { useCallback } from 'react';

export const useSound = () => {
  const play = useCallback((soundType: string) => {
    // Simple sound hook - production would use actual audio files
    console.log(`Playing sound: ${soundType}`);
  }, []);

  const stop = useCallback(() => {
    console.log('Stopping sound');
  }, []);

  const setVolume = useCallback((volume: number) => {
    console.log(`Setting volume: ${volume}`);
  }, []);

  return { play, playSound: play, stop, setVolume };
};