// Advanced Wardrobe Management Service
export interface WardrobeItem {
  id: string;
  name: string;
  nameEn: string;
  type: 'hat' | 'cape' | 'accessory' | 'wings' | 'armor' | 'glasses' | 'necklace' | 'boots' | 'crown' | 'wand';
  attachmentPoint: string;
  meshData?: string; // Base64 encoded 3D model or procedural definition
  color: string;
  secondaryColor?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  effects: {
    particles: boolean;
    particleType?: 'stars' | 'sparkles' | 'magic' | 'fire' | 'ice';
    glow: boolean;
    glowColor?: string;
    animation: 'none' | 'float' | 'wave' | 'flutter' | 'pulse' | 'sparkle' | 'rotate' | 'bounce';
    sound?: string; // Sound effect when equipped
  };
  unlockLevel: number;
  unlockConditions?: {
    achievements?: string[];
    streaks?: number;
    timeSpent?: number; // minutes
    exercisesCompleted?: number;
  };
  description: string;
  lore: string; // Backstory for the item
  stats?: {
    xpBonus: number; // % bonus
    streakMultiplier: number;
    specialPower?: string;
  };
  seasonal?: {
    season: 'spring' | 'summer' | 'autumn' | 'winter' | 'christmas' | 'halloween';
    startDate: string;
    endDate: string;
  };
  price?: number; // For premium items
  category: 'starter' | 'achievement' | 'seasonal' | 'premium' | 'special';
}

// Complete wardrobe collection with French CP-aligned themes
export const COMPLETE_WARDROBE_COLLECTION: WardrobeItem[] = [
  // === STARTER ITEMS ===
  {
    id: 'basic_hat',
    name: 'Petit Chapeau',
    nameEn: 'Basic Hat',
    type: 'hat',
    attachmentPoint: 'head',
    color: '#8B4513',
    rarity: 'common',
    effects: { particles: false, glow: false, animation: 'none' },
    unlockLevel: 1,
    description: 'Ton premier chapeau d\'aventurier!',
    lore: 'Chaque grand héros commence par un simple chapeau.',
    category: 'starter'
  },
  
  // === MATH ACHIEVEMENT ITEMS ===
  {
    id: 'golden_calculator_crown',
    name: 'Couronne Calculatrice',
    nameEn: 'Calculator Crown',
    type: 'crown',
    attachmentPoint: 'head',
    color: '#FFD700',
    secondaryColor: '#FF6B6B',
    rarity: 'epic',
    effects: { 
      particles: true, 
      particleType: 'stars',
      glow: true, 
      glowColor: '#FFD700',
      animation: 'float',
      sound: 'achievement_math'
    },
    unlockLevel: 5,
    unlockConditions: { achievements: ['math_master_10'] },
    description: 'Une couronne qui brille de génie mathématique!',
    lore: 'Forgée dans l\'or pur par les anciens maîtres du calcul.',
    stats: { xpBonus: 15, streakMultiplier: 1.2, specialPower: 'math_insight' },
    category: 'achievement'
  },
  
  {
    id: 'numbers_cape',
    name: 'Cape des Nombres',
    nameEn: 'Numbers Cape',
    type: 'cape',
    attachmentPoint: 'back',
    color: '#4169E1',
    secondaryColor: '#FFD700',
    rarity: 'rare',
    effects: { 
      particles: true, 
      particleType: 'sparkles',
      glow: false, 
      animation: 'wave',
      sound: 'woosh_magic'
    },
    unlockLevel: 3,
    unlockConditions: { exercisesCompleted: 50 },
    description: 'Une cape ornée de chiffres magiques qui dansent!',
    lore: 'Tissée avec les fils de l\'arithmétique éternelle.',
    stats: { xpBonus: 10, streakMultiplier: 1.1 },
    category: 'achievement'
  },

  // === FRENCH ACHIEVEMENT ITEMS ===
  {
    id: 'phonics_wand',
    name: 'Baguette Phonétique',
    nameEn: 'Phonics Wand',
    type: 'wand',
    attachmentPoint: 'hand',
    color: '#FF69B4',
    secondaryColor: '#9370DB',
    rarity: 'epic',
    effects: { 
      particles: true, 
      particleType: 'magic',
      glow: true, 
      glowColor: '#FF69B4',
      animation: 'sparkle',
      sound: 'magic_chime'
    },
    unlockLevel: 4,
    unlockConditions: { achievements: ['french_phonics_master'] },
    description: 'Une baguette qui fait chanter les lettres!',
    lore: 'Sculptée dans le bois du Grand Chêne des Mots.',
    stats: { xpBonus: 12, streakMultiplier: 1.15, specialPower: 'letter_magic' },
    category: 'achievement'
  },

  {
    id: 'abc_necklace',
    name: 'Collier ABC',
    nameEn: 'ABC Necklace',
    type: 'necklace',
    attachmentPoint: 'neck',
    color: '#FF1493',
    rarity: 'rare',
    effects: { 
      particles: false,
      glow: true, 
      glowColor: '#FF1493',
      animation: 'pulse',
      sound: 'gentle_chime'
    },
    unlockLevel: 2,
    unlockConditions: { streaks: 5 },
    description: 'Un collier scintillant avec toutes les lettres!',
    lore: 'Chaque perle contient la sagesse d\'une lettre.',
    stats: { xpBonus: 8, streakMultiplier: 1.05 },
    category: 'achievement'
  },

  // === LEGENDARY ACHIEVEMENT ITEMS ===
  {
    id: 'wisdom_glasses',
    name: 'Lunettes de Sagesse',
    nameEn: 'Wisdom Glasses',
    type: 'glasses',
    attachmentPoint: 'head',
    color: '#4B0082',
    secondaryColor: '#FFD700',
    rarity: 'legendary',
    effects: { 
      particles: true, 
      particleType: 'stars',
      glow: true, 
      glowColor: '#FFD700',
      animation: 'sparkle',
      sound: 'wise_whoosh'
    },
    unlockLevel: 10,
    unlockConditions: { 
      achievements: ['perfect_week', 'math_master_50', 'french_master_50'],
      timeSpent: 600 
    },
    description: 'Des lunettes qui révèlent tous les secrets!',
    lore: 'Créées par le Premier Sage, elles percent tous les mystères.',
    stats: { xpBonus: 25, streakMultiplier: 1.5, specialPower: 'perfect_insight' },
    category: 'achievement'
  },

  {
    id: 'rainbow_wings',
    name: 'Ailes Arc-en-ciel',
    nameEn: 'Rainbow Wings',
    type: 'wings',
    attachmentPoint: 'wings',
    color: '#FF69B4',
    rarity: 'legendary',
    effects: { 
      particles: true, 
      particleType: 'magic',
      glow: true, 
      glowColor: '#FFFFFF',
      animation: 'flutter',
      sound: 'angelic_wings'
    },
    unlockLevel: 15,
    unlockConditions: { 
      achievements: ['streak_champion_30'],
      exercisesCompleted: 500
    },
    description: 'Des ailes qui brillent de toutes les couleurs!',
    lore: 'Nées d\'un arc-en-ciel après une tempête de connaissance.',
    stats: { xpBonus: 30, streakMultiplier: 2.0, specialPower: 'rainbow_boost' },
    category: 'achievement'
  },

  // === SEASONAL ITEMS ===
  {
    id: 'christmas_hat',
    name: 'Bonnet de Noël',
    nameEn: 'Christmas Hat',
    type: 'hat',
    attachmentPoint: 'head',
    color: '#DC143C',
    secondaryColor: '#FFFFFF',
    rarity: 'rare',
    effects: { 
      particles: true, 
      particleType: 'sparkles',
      glow: true, 
      glowColor: '#FFFFFF',
      animation: 'bounce',
      sound: 'jingle_bell'
    },
    unlockLevel: 1,
    seasonal: {
      season: 'christmas',
      startDate: '2024-12-01',
      endDate: '2024-12-31'
    },
    description: 'Ho ho ho! Un bonnet festif et magique!',
    lore: 'Tricoté par les elfes du Père Noël en personne.',
    stats: { xpBonus: 20, streakMultiplier: 1.3 },
    category: 'seasonal'
  },

  {
    id: 'halloween_cape',
    name: 'Cape d\'Halloween',
    nameEn: 'Halloween Cape',
    type: 'cape',
    attachmentPoint: 'back',
    color: '#800080',
    secondaryColor: '#FF8C00',
    rarity: 'epic',
    effects: { 
      particles: true, 
      particleType: 'magic',
      glow: true, 
      glowColor: '#FF8C00',
      animation: 'wave',
      sound: 'spooky_whoosh'
    },
    unlockLevel: 1,
    seasonal: {
      season: 'halloween',
      startDate: '2024-10-15',
      endDate: '2024-11-01'
    },
    description: 'Une cape mystérieuse aux pouvoirs surnaturels!',
    lore: 'Tissée dans les brumes d\'une nuit de pleine lune.',
    stats: { xpBonus: 25, streakMultiplier: 1.4 },
    category: 'seasonal'
  },

  // === PREMIUM ITEMS ===
  {
    id: 'diamond_crown',
    name: 'Couronne de Diamant',
    nameEn: 'Diamond Crown',
    type: 'crown',
    attachmentPoint: 'head',
    color: '#E0E0E0',
    secondaryColor: '#87CEEB',
    rarity: 'mythic',
    effects: { 
      particles: true, 
      particleType: 'stars',
      glow: true, 
      glowColor: '#FFFFFF',
      animation: 'float',
      sound: 'crystal_chime'
    },
    unlockLevel: 1,
    price: 499, // Premium currency
    description: 'La couronne ultime des champions!',
    lore: 'Taillée dans un diamant tombé des étoiles.',
    stats: { xpBonus: 50, streakMultiplier: 2.5, specialPower: 'diamond_brilliance' },
    category: 'premium'
  },

  // === SPECIAL THEMED ITEMS ===
  {
    id: 'scientist_goggles',
    name: 'Lunettes de Scientifique',
    nameEn: 'Scientist Goggles',
    type: 'glasses',
    attachmentPoint: 'head',
    color: '#228B22',
    rarity: 'rare',
    effects: { 
      particles: false,
      glow: true, 
      glowColor: '#00FF00',
      animation: 'pulse',
      sound: 'tech_beep'
    },
    unlockLevel: 6,
    unlockConditions: { achievements: ['science_explorer'] },
    description: 'Des lunettes pour explorer les sciences!',
    lore: 'Utilisées par les plus grands inventeurs de l\'histoire.',
    stats: { xpBonus: 15, streakMultiplier: 1.2, specialPower: 'scientific_method' },
    category: 'achievement'
  },

  {
    id: 'artist_beret',
    name: 'Béret d\'Artiste',
    nameEn: 'Artist Beret',
    type: 'hat',
    attachmentPoint: 'head',
    color: '#800000',
    rarity: 'rare',
    effects: { 
      particles: true, 
      particleType: 'sparkles',
      glow: false,
      animation: 'none',
      sound: 'creative_brush'
    },
    unlockLevel: 4,
    unlockConditions: { achievements: ['creative_genius'] },
    description: 'Un béret qui inspire la créativité!',
    lore: 'Porté par les plus grands artistes de Montmartre.',
    stats: { xpBonus: 12, streakMultiplier: 1.15, specialPower: 'artistic_vision' },
    category: 'achievement'
  }
];

class WardrobeService {
  private equippedItems: Set<string> = new Set();
  private unlockedItems: Set<string> = new Set();
  private studentLevel: number = 1;
  private achievements: Set<string> = new Set();
  private stats = {
    streaks: 0,
    timeSpent: 0,
    exercisesCompleted: 0
  };

  // Initialize with student data
  initialize(studentData: {
    level: number;
    equippedItems: string[];
    unlockedItems: string[];
    achievements: string[];
    stats: { streaks: number; timeSpent: number; exercisesCompleted: number; };
  }) {
    this.studentLevel = studentData.level;
    this.equippedItems = new Set(studentData.equippedItems);
    this.unlockedItems = new Set(studentData.unlockedItems);
    this.achievements = new Set(studentData.achievements);
    this.stats = studentData.stats;

    // Auto-unlock starter items
    this.checkAutoUnlocks();
  }

  // Get all available items for current student
  getAvailableItems(): WardrobeItem[] {
    return COMPLETE_WARDROBE_COLLECTION.filter(item => 
      item.unlockLevel <= this.studentLevel && this.checkUnlockConditions(item)
    );
  }

  // Get unlocked items
  getUnlockedItems(): WardrobeItem[] {
    return COMPLETE_WARDROBE_COLLECTION.filter(item => 
      this.unlockedItems.has(item.id)
    );
  }

  // Get equipped items
  getEquippedItems(): WardrobeItem[] {
    return COMPLETE_WARDROBE_COLLECTION.filter(item => 
      this.equippedItems.has(item.id)
    );
  }

  // Check if item can be unlocked
  checkUnlockConditions(item: WardrobeItem): boolean {
    if (!item.unlockConditions) return true;

    const conditions = item.unlockConditions;

    // Check achievements
    if (conditions.achievements) {
      const hasAllAchievements = conditions.achievements.every(achievement => 
        this.achievements.has(achievement)
      );
      if (!hasAllAchievements) return false;
    }

    // Check streaks
    if (conditions.streaks && this.stats.streaks < conditions.streaks) {
      return false;
    }

    // Check time spent
    if (conditions.timeSpent && this.stats.timeSpent < conditions.timeSpent) {
      return false;
    }

    // Check exercises completed
    if (conditions.exercisesCompleted && this.stats.exercisesCompleted < conditions.exercisesCompleted) {
      return false;
    }

    return true;
  }

  // Check for auto-unlocks based on current progress
  checkAutoUnlocks(): string[] {
    const newUnlocks: string[] = [];

    COMPLETE_WARDROBE_COLLECTION.forEach(item => {
      if (!this.unlockedItems.has(item.id) && 
          item.unlockLevel <= this.studentLevel && 
          this.checkUnlockConditions(item)) {
        
        this.unlockedItems.add(item.id);
        newUnlocks.push(item.id);
      }
    });

    return newUnlocks;
  }

  // Equip an item
  equipItem(itemId: string): boolean {
    const item = COMPLETE_WARDROBE_COLLECTION.find(i => i.id === itemId);
    if (!item || !this.unlockedItems.has(itemId)) {
      return false;
    }

    // Unequip items of the same type (only one hat, one cape, etc.)
    const sameTypeItems = Array.from(this.equippedItems).filter(equippedId => {
      const equippedItem = COMPLETE_WARDROBE_COLLECTION.find(i => i.id === equippedId);
      return equippedItem && equippedItem.type === item.type;
    });

    sameTypeItems.forEach(equippedId => {
      this.equippedItems.delete(equippedId);
    });

    this.equippedItems.add(itemId);
    return true;
  }

  // Unequip an item
  unequipItem(itemId: string): boolean {
    return this.equippedItems.delete(itemId);
  }

  // Get total XP bonus from equipped items
  getTotalXPBonus(): number {
    return this.getEquippedItems().reduce((total, item) => 
      total + (item.stats?.xpBonus || 0), 0
    );
  }

  // Get total streak multiplier from equipped items
  getTotalStreakMultiplier(): number {
    return this.getEquippedItems().reduce((total, item) => 
      total + (item.stats?.streakMultiplier || 1) - 1, 1
    );
  }

  // Get active special powers
  getActiveSpecialPowers(): string[] {
    return this.getEquippedItems()
      .filter(item => item.stats?.specialPower)
      .map(item => item.stats!.specialPower!);
  }

  // Update student progress (called when achievements/stats change)
  updateProgress(updates: {
    level?: number;
    achievements?: string[];
    stats?: Partial<{ streaks: number; timeSpent: number; exercisesCompleted: number; }>;
  }): string[] {
    if (updates.level) this.studentLevel = updates.level;
    
    if (updates.achievements) {
      updates.achievements.forEach(achievement => {
        this.achievements.add(achievement);
      });
    }

    if (updates.stats) {
      this.stats = { ...this.stats, ...updates.stats };
    }

    return this.checkAutoUnlocks();
  }

  // Get seasonal items currently available
  getSeasonalItems(): WardrobeItem[] {
    const now = new Date();
    return COMPLETE_WARDROBE_COLLECTION.filter(item => {
      if (!item.seasonal) return false;
      
      const startDate = new Date(item.seasonal.startDate);
      const endDate = new Date(item.seasonal.endDate);
      
      return now >= startDate && now <= endDate;
    });
  }

  // Export current wardrobe state
  exportState() {
    return {
      equippedItems: Array.from(this.equippedItems),
      unlockedItems: Array.from(this.unlockedItems),
      level: this.studentLevel,
      achievements: Array.from(this.achievements),
      stats: this.stats
    };
  }
}

export const wardrobeService = new WardrobeService();
export default wardrobeService;