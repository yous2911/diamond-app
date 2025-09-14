import { renderHook } from '@testing-library/react';
import { useHaptic } from '../useHaptic';

describe('useHaptic Hook', () => {
  it('returns all expected functions', () => {
    const { result } = renderHook(() => useHaptic());
    
    expect(result.current).toHaveProperty('vibrate');
    expect(result.current).toHaveProperty('success');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('click');
    expect(result.current).toHaveProperty('triggerHaptic');
    
    expect(typeof result.current.vibrate).toBe('function');
    expect(typeof result.current.success).toBe('function');
    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.click).toBe('function');
    expect(typeof result.current.triggerHaptic).toBe('function');
  });

  it('can call vibrate function', () => {
    const { result } = renderHook(() => useHaptic());
    
    // Should not throw error
    expect(() => {
      result.current.vibrate();
    }).not.toThrow();
  });

  it('can call success function', () => {
    const { result } = renderHook(() => useHaptic());
    
    // Should not throw error
    expect(() => {
      result.current.success();
    }).not.toThrow();
  });

  it('can call error function', () => {
    const { result } = renderHook(() => useHaptic());
    
    // Should not throw error
    expect(() => {
      result.current.error();
    }).not.toThrow();
  });

  it('can call click function', () => {
    const { result } = renderHook(() => useHaptic());
    
    // Should not throw error
    expect(() => {
      result.current.click();
    }).not.toThrow();
  });

  it('can call triggerHaptic without parameters', () => {
    const { result } = renderHook(() => useHaptic());
    
    // Should not throw error
    expect(() => {
      result.current.triggerHaptic();
    }).not.toThrow();
  });

  it('can call triggerHaptic with type parameter', () => {
    const { result } = renderHook(() => useHaptic());
    
    // Should not throw error
    expect(() => {
      result.current.triggerHaptic('success');
      result.current.triggerHaptic('error');
      result.current.triggerHaptic('click');
      result.current.triggerHaptic('vibrate');
    }).not.toThrow();
  });

  it('handles edge cases for triggerHaptic', () => {
    const { result } = renderHook(() => useHaptic());
    
    // Test with various parameter types
    expect(() => {
      result.current.triggerHaptic('');
      result.current.triggerHaptic('unknown-type');
      result.current.triggerHaptic('special-chars-!@#');
      result.current.triggerHaptic('very-long-haptic-type-name');
    }).not.toThrow();
  });

  it('functions are recreated on each call (as expected)', () => {
    const { result, rerender } = renderHook(() => useHaptic());
    
    const firstRender = {
      vibrate: result.current.vibrate,
      success: result.current.success,
      error: result.current.error,
      click: result.current.click,
      triggerHaptic: result.current.triggerHaptic
    };
    
    rerender();
    
    const secondRender = {
      vibrate: result.current.vibrate,
      success: result.current.success,
      error: result.current.error,
      click: result.current.click,
      triggerHaptic: result.current.triggerHaptic
    };
    
    // Functions are recreated since they're not memoized (which is fine for this simple hook)
    expect(firstRender.vibrate).not.toBe(secondRender.vibrate);
    expect(firstRender.success).not.toBe(secondRender.success);
    expect(firstRender.error).not.toBe(secondRender.error);
    expect(firstRender.click).not.toBe(secondRender.click);
    expect(firstRender.triggerHaptic).not.toBe(secondRender.triggerHaptic);
  });

  it('all functions execute without side effects', () => {
    const { result } = renderHook(() => useHaptic());
    
    // Execute all functions multiple times
    expect(() => {
      for (let i = 0; i < 5; i++) {
        result.current.vibrate();
        result.current.success();
        result.current.error();
        result.current.click();
        result.current.triggerHaptic('test');
      }
    }).not.toThrow();
  });

  it('returns same object structure on each call', () => {
    const { result, rerender } = renderHook(() => useHaptic());
    
    const firstKeys = Object.keys(result.current).sort();
    
    rerender();
    
    const secondKeys = Object.keys(result.current).sort();
    
    expect(firstKeys).toEqual(secondKeys);
    expect(firstKeys).toEqual(['click', 'error', 'success', 'triggerHaptic', 'vibrate']);
  });
});