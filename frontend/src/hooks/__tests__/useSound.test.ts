import { renderHook } from '@testing-library/react';
import { useSound } from '../useSound';

describe('useSound Hook', () => {
  it('returns all expected functions', () => {
    const { result } = renderHook(() => useSound());
    
    expect(result.current).toHaveProperty('play');
    expect(result.current).toHaveProperty('playSound');
    expect(result.current).toHaveProperty('stop');
    expect(result.current).toHaveProperty('setVolume');
    
    expect(typeof result.current.play).toBe('function');
    expect(typeof result.current.playSound).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.setVolume).toBe('function');
  });

  it('play and playSound reference the same function', () => {
    const { result } = renderHook(() => useSound());
    
    expect(result.current.play).toBe(result.current.playSound);
  });

  it('can call play with soundType parameter', () => {
    const { result } = renderHook(() => useSound());
    
    // Should not throw error
    expect(() => {
      result.current.play('success');
      result.current.play('error');
      result.current.play('click');
    }).not.toThrow();
  });

  it('can call playSound with soundType parameter', () => {
    const { result } = renderHook(() => useSound());
    
    // Should not throw error
    expect(() => {
      result.current.playSound('notification');
      result.current.playSound('beep');
    }).not.toThrow();
  });

  it('can call stop function', () => {
    const { result } = renderHook(() => useSound());
    
    // Should not throw error
    expect(() => {
      result.current.stop();
    }).not.toThrow();
  });

  it('can call setVolume with volume parameter', () => {
    const { result } = renderHook(() => useSound());
    
    // Should not throw error
    expect(() => {
      result.current.setVolume(0.5);
      result.current.setVolume(1.0);
      result.current.setVolume(0.0);
    }).not.toThrow();
  });

  it('functions remain stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useSound());
    
    const firstRender = {
      play: result.current.play,
      playSound: result.current.playSound,
      stop: result.current.stop,
      setVolume: result.current.setVolume
    };
    
    rerender();
    
    const secondRender = {
      play: result.current.play,
      playSound: result.current.playSound,
      stop: result.current.stop,
      setVolume: result.current.setVolume
    };
    
    // Functions should be the same reference (memoized)
    expect(firstRender.play).toBe(secondRender.play);
    expect(firstRender.playSound).toBe(secondRender.playSound);
    expect(firstRender.stop).toBe(secondRender.stop);
    expect(firstRender.setVolume).toBe(secondRender.setVolume);
  });

  it('handles edge cases for setVolume', () => {
    const { result } = renderHook(() => useSound());
    
    // Test with various volume values
    expect(() => {
      result.current.setVolume(-1); // Below range
      result.current.setVolume(0);  // Minimum
      result.current.setVolume(0.5); // Middle
      result.current.setVolume(1);  // Maximum
      result.current.setVolume(2);  // Above range
    }).not.toThrow();
  });

  it('handles edge cases for play functions', () => {
    const { result } = renderHook(() => useSound());
    
    // Test with various sound types
    expect(() => {
      result.current.play('');
      result.current.playSound('');
      result.current.play('very-long-sound-name-that-might-not-exist');
      result.current.playSound('special-chars-!@#$%');
    }).not.toThrow();
  });
});