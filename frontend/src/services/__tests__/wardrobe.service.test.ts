import wardrobeService, { WardrobeItem, COMPLETE_WARDROBE_COLLECTION } from '../wardrobe.service';

// Mock student data for testing
const getMockStudentData = () => ({
  level: 1,
  equippedItems: [],
  unlockedItems: [],
  achievements: [],
  stats: {
    streaks: 0,
    timeSpent: 0,
    exercisesCompleted: 0,
  },
});

describe('WardrobeService', () => {
  beforeEach(() => {
    // Reset the service's state before each test
    wardrobeService.initialize(getMockStudentData());
  });

  describe('Initialization', () => {
    it('should initialize with student data and unlock starter items', () => {
      const initialData = {
        level: 2,
        equippedItems: ['basic_hat'],
        unlockedItems: ['basic_hat', 'abc_necklace'],
        achievements: ['some_achievement'],
        stats: { streaks: 5, timeSpent: 100, exercisesCompleted: 20 },
      };
      wardrobeService.initialize(initialData);

      const state = wardrobeService.exportState();
      expect(state.level).toBe(2);
      expect(state.equippedItems).toContain('basic_hat');
      expect(state.unlockedItems).toContain('abc_necklace');
      expect(state.achievements).toContain('some_achievement');
      expect(state.stats.streaks).toBe(5);
    });

    it('should auto-unlock starter items on initialization', () => {
        // The basic_hat is unlockLevel 1, should be unlocked
        const unlocked = wardrobeService.getUnlockedItems();
        const starterHat = unlocked.find(item => item.id === 'basic_hat');
        expect(starterHat).toBeDefined();
    });
  });

  describe('Unlock Logic', () => {
    it('should correctly check unlock conditions', () => {
      const itemWithAchievement = COMPLETE_WARDROBE_COLLECTION.find(i => i.id === 'golden_calculator_crown')!;
      wardrobeService.updateProgress({ achievements: ['math_master_10'] });
      expect(wardrobeService.checkUnlockConditions(itemWithAchievement)).toBe(true);

      const itemWithStreak = COMPLETE_WARDROBE_COLLECTION.find(i => i.id === 'abc_necklace')!;
      wardrobeService.updateProgress({ stats: { streaks: 5 } });
      expect(wardrobeService.checkUnlockConditions(itemWithStreak)).toBe(true);
      wardrobeService.updateProgress({ stats: { streaks: 4 } });
      expect(wardrobeService.checkUnlockConditions(itemWithStreak)).toBe(false);
    });

    it('should not return items if level is too low', () => {
        wardrobeService.initialize({ ...getMockStudentData(), level: 1 });
        const availableItems = wardrobeService.getAvailableItems();
        const highLevelItem = availableItems.find(item => item.unlockLevel > 1);
        expect(highLevelItem).toBeUndefined();
    });
  });

  describe('Equip/Unequip', () => {
    it('should not equip a locked item', () => {
      const success = wardrobeService.equipItem('golden_calculator_crown');
      expect(success).toBe(false);
      expect(wardrobeService.getEquippedItems()).toHaveLength(0);
    });

    it('should equip an unlocked item', () => {
      wardrobeService.updateProgress({ level: 10, achievements: ['math_master_10'] });
      wardrobeService.equipItem('golden_calculator_crown');
      const equipped = wardrobeService.getEquippedItems();
      expect(equipped.some(i => i.id === 'golden_calculator_crown')).toBe(true);
    });

    it('should unequip an item', () => {
      wardrobeService.updateProgress({ level: 1, achievements: [] }); // basic hat is unlocked
      wardrobeService.equipItem('basic_hat');
      expect(wardrobeService.getEquippedItems().length).toBe(1);
      wardrobeService.unequipItem('basic_hat');
      expect(wardrobeService.getEquippedItems().length).toBe(0);
    });

    it('should automatically unequip an item of the same type', () => {
        // Unlock two hats
        wardrobeService.updateProgress({ level: 4, achievements: ['creative_genius'] });

        wardrobeService.equipItem('basic_hat');
        expect(wardrobeService.getEquippedItems().find(i => i.id === 'basic_hat')).toBeDefined();

        wardrobeService.equipItem('artist_beret');
        const equipped = wardrobeService.getEquippedItems();
        expect(equipped.find(i => i.id === 'artist_beret')).toBeDefined();
        expect(equipped.find(i => i.id === 'basic_hat')).toBeUndefined(); // old hat should be gone
        expect(equipped.length).toBe(1);
    });
  });

  describe('Stat Calculation', () => {
    it('should calculate total XP bonus from equipped items', () => {
        wardrobeService.updateProgress({ level: 10, achievements: ['math_master_10'] });
        wardrobeService.equipItem('golden_calculator_crown'); // +15% XP
        expect(wardrobeService.getTotalXPBonus()).toBe(15);
    });

    it('should calculate total streak multiplier', () => {
        wardrobeService.updateProgress({ level: 10, achievements: ['math_master_10'] });
        wardrobeService.equipItem('golden_calculator_crown'); // 1.2 multiplier
        expect(wardrobeService.getTotalStreakMultiplier()).toBeCloseTo(1.2);
    });

    it('should get active special powers', () => {
        wardrobeService.updateProgress({ level: 10, achievements: ['math_master_10'] });
        wardrobeService.equipItem('golden_calculator_crown'); // specialPower: 'math_insight'
        expect(wardrobeService.getActiveSpecialPowers()).toContain('math_insight');
    });
  });

  describe('Seasonal Items', () => {
    it('should return seasonal items if within date range', () => {
      // Mock date to be Christmas
      jest.useFakeTimers().setSystemTime(new Date('2024-12-15'));
      const seasonalItems = wardrobeService.getSeasonalItems();
      expect(seasonalItems.some(i => i.id === 'christmas_hat')).toBe(true);
      jest.useRealTimers();
    });

    it('should not return seasonal items if outside date range', () => {
      // Mock date to be in January
      jest.useFakeTimers().setSystemTime(new Date('2025-01-15'));
      const seasonalItems = wardrobeService.getSeasonalItems();
      expect(seasonalItems.some(i => i.id === 'christmas_hat')).toBe(false);
      jest.useRealTimers();
    });
  });
});
