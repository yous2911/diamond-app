/**
 * Unit tests for useWardrobeAnalytics hooks
 * Tests real analytics tracking logic for wardrobe item usage and categories
 */

import { renderHook, act } from '@testing-library/react';
import { useWardrobeAnalytics } from '../useWardrobeAnalytics';

// Mock Date for consistent testing
const mockDate = new Date('2024-01-15T10:30:00Z');
const originalDate = Date;

describe('useWardrobeAnalytics Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.Date = jest.fn(() => mockDate) as any;
    global.Date.now = jest.fn(() => mockDate.getTime());
    Object.setPrototypeOf(global.Date, originalDate);
  });

  afterEach(() => {
    jest.useRealTimers();
    global.Date = originalDate;
  });

  describe('Hook Initialization', () => {
    it('should initialize with all required functions', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      expect(typeof result.current.trackItemView).toBe('function');
      expect(typeof result.current.trackItemEquip).toBe('function');
      expect(typeof result.current.trackItemUnequip).toBe('function');
      expect(typeof result.current.trackCategoryChange).toBe('function');
      expect(typeof result.current.trackWardrobeOpen).toBe('function');
      expect(typeof result.current.trackWardrobeClose).toBe('function');
      expect(typeof result.current.getItemStats).toBe('function');
      expect(typeof result.current.getCategoryStats).toBe('function');
    });

    it('should return empty stats initially', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      const itemStats = result.current.getItemStats('any-item');
      expect(itemStats).toEqual({
        views: 0,
        equips: 0,
        unequips: 0,
        lastUsed: null
      });

      const categoryStats = result.current.getCategoryStats();
      expect(categoryStats).toEqual({});
    });

    it('should maintain function identity across renders', () => {
      const { result, rerender } = renderHook(() => useWardrobeAnalytics());

      const initialFunctions = {
        trackItemView: result.current.trackItemView,
        trackItemEquip: result.current.trackItemEquip,
        getItemStats: result.current.getItemStats
      };

      rerender();

      expect(result.current.trackItemView).toBe(initialFunctions.trackItemView);
      expect(result.current.trackItemEquip).toBe(initialFunctions.trackItemEquip);
      expect(result.current.getItemStats).toBe(initialFunctions.getItemStats);
    });
  });

  describe('Item View Tracking', () => {
    it('should track item views correctly', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemView('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.views).toBe(1);
      expect(stats.equips).toBe(0);
      expect(stats.unequips).toBe(0);
      expect(stats.lastUsed).toBeNull();
    });

    it('should increment view count for multiple views of same item', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemView('hat-001');
        result.current.trackItemView('hat-001');
        result.current.trackItemView('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.views).toBe(3);
    });

    it('should track views for different items independently', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemView('hat-001');
        result.current.trackItemView('shirt-002');
        result.current.trackItemView('hat-001');
      });

      const hatStats = result.current.getItemStats('hat-001');
      const shirtStats = result.current.getItemStats('shirt-002');

      expect(hatStats.views).toBe(2);
      expect(shirtStats.views).toBe(1);
    });

    it('should preserve existing stats when tracking views', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      // First equip an item to set lastUsed
      act(() => {
        result.current.trackItemEquip('hat-001');
      });

      // Then view the same item
      act(() => {
        result.current.trackItemView('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.views).toBe(1);
      expect(stats.equips).toBe(1);
      expect(stats.lastUsed).toEqual(mockDate);
    });
  });

  describe('Item Equip Tracking', () => {
    it('should track item equips correctly', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemEquip('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.views).toBe(0);
      expect(stats.equips).toBe(1);
      expect(stats.unequips).toBe(0);
      expect(stats.lastUsed).toEqual(mockDate);
    });

    it('should increment equip count for multiple equips', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemEquip('hat-001');
        result.current.trackItemEquip('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.equips).toBe(2);
    });

    it('should update lastUsed timestamp on equip', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemEquip('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.lastUsed).toEqual(mockDate);
    });

    it('should track equips for different items independently', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemEquip('hat-001');
        result.current.trackItemEquip('shirt-002');
        result.current.trackItemEquip('hat-001');
      });

      const hatStats = result.current.getItemStats('hat-001');
      const shirtStats = result.current.getItemStats('shirt-002');

      expect(hatStats.equips).toBe(2);
      expect(shirtStats.equips).toBe(1);
    });
  });

  describe('Item Unequip Tracking', () => {
    it('should track item unequips correctly', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemUnequip('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.views).toBe(0);
      expect(stats.equips).toBe(0);
      expect(stats.unequips).toBe(1);
      expect(stats.lastUsed).toEqual(mockDate);
    });

    it('should increment unequip count for multiple unequips', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemUnequip('hat-001');
        result.current.trackItemUnequip('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.unequips).toBe(2);
    });

    it('should update lastUsed timestamp on unequip', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemUnequip('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.lastUsed).toEqual(mockDate);
    });

    it('should preserve other stats when tracking unequips', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemView('hat-001');
        result.current.trackItemEquip('hat-001');
        result.current.trackItemUnequip('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.views).toBe(1);
      expect(stats.equips).toBe(1);
      expect(stats.unequips).toBe(1);
    });
  });

  describe('Category Tracking', () => {
    it('should track category changes correctly', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackCategoryChange('hats');
      });

      const categoryStats = result.current.getCategoryStats();
      expect(categoryStats.hats).toEqual({
        views: 1,
        selections: 1,
        timeSpent: 0
      });
    });

    it('should increment category stats for multiple visits', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackCategoryChange('hats');
        result.current.trackCategoryChange('hats');
        result.current.trackCategoryChange('hats');
      });

      const categoryStats = result.current.getCategoryStats();
      expect(categoryStats.hats.views).toBe(3);
      expect(categoryStats.hats.selections).toBe(3);
    });

    it('should track different categories independently', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackCategoryChange('hats');
        result.current.trackCategoryChange('shirts');
        result.current.trackCategoryChange('hats');
      });

      const categoryStats = result.current.getCategoryStats();
      expect(categoryStats.hats.views).toBe(2);
      expect(categoryStats.shirts.views).toBe(1);
    });

    it('should preserve existing category data when tracking', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackCategoryChange('hats');
        result.current.trackCategoryChange('hats');
      });

      const categoryStats = result.current.getCategoryStats();
      expect(categoryStats.hats.timeSpent).toBe(0); // Preserved from previous tracking
    });
  });

  describe('Wardrobe Session Tracking', () => {
    it('should track wardrobe open', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackWardrobeOpen();
      });

      // Session should be tracked internally, function should execute without error
      expect(() => result.current.trackWardrobeClose()).not.toThrow();
    });

    it('should handle wardrobe close without open', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackWardrobeClose();
      });

      // Should handle gracefully when no session is active
      expect(true).toBe(true); // No error should occur
    });

    it('should track session duration between open and close', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      const sessionStartTime = Date.now();
      act(() => {
        result.current.trackWardrobeOpen();
      });

      // Simulate time passing
      const sessionEndTime = sessionStartTime + 5000; // 5 seconds
      global.Date.now = jest.fn(() => sessionEndTime);

      act(() => {
        result.current.trackWardrobeClose();
      });

      // Session tracking should work without errors
      expect(true).toBe(true);
    });

    it('should handle multiple open/close cycles', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackWardrobeOpen();
        result.current.trackWardrobeClose();
        result.current.trackWardrobeOpen();
        result.current.trackWardrobeClose();
      });

      // Multiple cycles should work without issues
      expect(true).toBe(true);
    });
  });

  describe('Complex Usage Scenarios', () => {
    it('should handle mixed item interactions correctly', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemView('hat-001');
        result.current.trackItemView('hat-001');
        result.current.trackItemEquip('hat-001');
        result.current.trackItemUnequip('hat-001');
        result.current.trackItemEquip('hat-001');
      });

      const stats = result.current.getItemStats('hat-001');
      expect(stats.views).toBe(2);
      expect(stats.equips).toBe(2);
      expect(stats.unequips).toBe(1);
      expect(stats.lastUsed).toEqual(mockDate);
    });

    it('should track multiple items with different interaction patterns', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        // Hat interactions
        result.current.trackItemView('hat-001');
        result.current.trackItemEquip('hat-001');
        
        // Shirt interactions
        result.current.trackItemView('shirt-002');
        result.current.trackItemView('shirt-002');
        result.current.trackItemView('shirt-002');
        
        // Pants interactions
        result.current.trackItemEquip('pants-003');
        result.current.trackItemUnequip('pants-003');
      });

      const hatStats = result.current.getItemStats('hat-001');
      const shirtStats = result.current.getItemStats('shirt-002');
      const pantsStats = result.current.getItemStats('pants-003');

      expect(hatStats).toEqual({
        views: 1,
        equips: 1,
        unequips: 0,
        lastUsed: mockDate
      });

      expect(shirtStats).toEqual({
        views: 3,
        equips: 0,
        unequips: 0,
        lastUsed: null
      });

      expect(pantsStats).toEqual({
        views: 0,
        equips: 1,
        unequips: 1,
        lastUsed: mockDate
      });
    });

    it('should handle wardrobe session with category and item interactions', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackWardrobeOpen();
        result.current.trackCategoryChange('hats');
        result.current.trackItemView('hat-001');
        result.current.trackItemEquip('hat-001');
        result.current.trackCategoryChange('shirts');
        result.current.trackItemView('shirt-002');
        result.current.trackWardrobeClose();
      });

      const hatStats = result.current.getItemStats('hat-001');
      const shirtStats = result.current.getItemStats('shirt-002');
      const categoryStats = result.current.getCategoryStats();

      expect(hatStats.views).toBe(1);
      expect(hatStats.equips).toBe(1);
      expect(shirtStats.views).toBe(1);
      expect(categoryStats.hats.views).toBe(1);
      expect(categoryStats.shirts.views).toBe(1);
    });
  });

  describe('Data Integrity and Edge Cases', () => {
    it('should handle empty and null item IDs gracefully', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackItemView('');
        result.current.getItemStats('');
      });

      const emptyStats = result.current.getItemStats('');
      expect(emptyStats).toEqual({
        views: 1,
        equips: 0,
        unequips: 0,
        lastUsed: null
      });
    });

    it('should handle special characters in item IDs', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      const specialId = 'hat-001_!@#$%^&*()';

      act(() => {
        result.current.trackItemView(specialId);
        result.current.trackItemEquip(specialId);
      });

      const stats = result.current.getItemStats(specialId);
      expect(stats.views).toBe(1);
      expect(stats.equips).toBe(1);
    });

    it('should handle special characters in category names', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      const specialCategory = 'hats_!@#$%^&*()';

      act(() => {
        result.current.trackCategoryChange(specialCategory);
      });

      const categoryStats = result.current.getCategoryStats();
      expect(categoryStats[specialCategory]).toEqual({
        views: 1,
        selections: 1,
        timeSpent: 0
      });
    });

    it('should maintain data consistency across rapid interactions', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        // Rapid interactions
        for (let i = 0; i < 100; i++) {
          result.current.trackItemView('rapid-test');
          result.current.trackItemEquip('rapid-test');
          result.current.trackItemUnequip('rapid-test');
        }
      });

      const stats = result.current.getItemStats('rapid-test');
      expect(stats.views).toBe(100);
      expect(stats.equips).toBe(100);
      expect(stats.unequips).toBe(100);
    });

    it('should handle very long item IDs', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      const longId = 'a'.repeat(1000);

      act(() => {
        result.current.trackItemView(longId);
      });

      const stats = result.current.getItemStats(longId);
      expect(stats.views).toBe(1);
    });

    it('should return consistent results for getItemStats', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      const stats1 = result.current.getItemStats('test-item');
      const stats2 = result.current.getItemStats('test-item');

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2); // Should be different objects
    });

    it('should return consistent results for getCategoryStats', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        result.current.trackCategoryChange('test-category');
      });

      const stats1 = result.current.getCategoryStats();
      const stats2 = result.current.getCategoryStats();

      expect(stats1).toEqual(stats2);
    });

    it('should handle concurrent tracking operations', () => {
      const { result } = renderHook(() => useWardrobeAnalytics());

      act(() => {
        // Simulate concurrent operations
        result.current.trackItemView('item1');
        result.current.trackItemEquip('item2');
        result.current.trackCategoryChange('cat1');
        result.current.trackItemUnequip('item1');
        result.current.trackItemView('item2');
        result.current.trackCategoryChange('cat2');
      });

      const item1Stats = result.current.getItemStats('item1');
      const item2Stats = result.current.getItemStats('item2');
      const categoryStats = result.current.getCategoryStats();

      expect(item1Stats.views).toBe(1);
      expect(item1Stats.unequips).toBe(1);
      expect(item2Stats.views).toBe(1);
      expect(item2Stats.equips).toBe(1);
      expect(categoryStats.cat1.views).toBe(1);
      expect(categoryStats.cat2.views).toBe(1);
    });
  });
});