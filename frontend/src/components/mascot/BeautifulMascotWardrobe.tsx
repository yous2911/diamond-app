import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MascotWardrobe3D from './MascotWardrobe3D';
import { wardrobeService, WardrobeItem, COMPLETE_WARDROBE_COLLECTION } from '../../services/wardrobe.service';
import { useSound } from '../../hooks/useSound';
import { useHaptic } from '../../hooks/useHaptic';

interface BeautifulMascotWardrobeProps {
  studentData: {
    id: string;
    level: number;
    equippedItems: string[];
    unlockedItems: string[];
    achievements: string[];
    stats: {
      streaks: number;
      timeSpent: number;
      exercisesCompleted: number;
    };
  };
  mascotType: 'dragon' | 'fairy' | 'robot';
  onWardrobeUpdate: (data: {
    equippedItems: string[];
    unlockedItems: string[];
    newUnlocks?: string[];
  }) => void;
}

const BeautifulMascotWardrobe: React.FC<BeautifulMascotWardrobeProps> = ({
  studentData,
  mascotType,
  onWardrobeUpdate
}) => {
  const [selectedTab, setSelectedTab] = useState<'all' | 'equipped' | 'unlocked' | 'locked' | 'seasonal'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showingNewUnlock, setShowingNewUnlock] = useState<WardrobeItem | null>(null);
  const [previewingItem, setPreviewingItem] = useState<string | null>(null);
  
  const { play: playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  // Initialize wardrobe service
  useEffect(() => {
    wardrobeService.initialize(studentData);
  }, [studentData]);

  // Get filtered items based on current tab
  const filteredItems = useMemo(() => {
    let items: WardrobeItem[] = [];
    
    switch (selectedTab) {
      case 'equipped':
        items = wardrobeService.getEquippedItems();
        break;
      case 'unlocked':
        items = wardrobeService.getUnlockedItems();
        break;
      case 'locked':
        items = wardrobeService.getAvailableItems().filter(item => 
          !wardrobeService.getUnlockedItems().find(unlocked => unlocked.id === item.id)
        );
        break;
      case 'seasonal':
        items = wardrobeService.getSeasonalItems();
        break;
      default:
        items = wardrobeService.getAvailableItems();
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.type === selectedCategory);
    }

    return items;
  }, [selectedTab, selectedCategory, studentData]);

  // Handle item equip/unequip
  const handleItemToggle = (item: WardrobeItem) => {
    const isEquipped = wardrobeService.getEquippedItems().some(equipped => equipped.id === item.id);
    const isUnlocked = wardrobeService.getUnlockedItems().some(unlocked => unlocked.id === item.id);

    if (!isUnlocked) {
      // Show preview or unlock requirements
      setPreviewingItem(item.id);
      return;
    }

    if (isEquipped) {
      wardrobeService.unequipItem(item.id);
      playSound('item_unequip');
      triggerHaptic('light');
    } else {
      if (wardrobeService.equipItem(item.id)) {
        playSound(item.effects.sound || 'item_equip');
        triggerHaptic(item.rarity === 'legendary' ? 'success' : 'light');
      }
    }

    // Update parent component
    onWardrobeUpdate({
      equippedItems: wardrobeService.exportState().equippedItems,
      unlockedItems: wardrobeService.exportState().unlockedItems
    });
  };

  // Check for new unlocks when progress changes
  useEffect(() => {
    const newUnlocks = wardrobeService.checkAutoUnlocks();
    if (newUnlocks.length > 0) {
      const firstNewItem = COMPLETE_WARDROBE_COLLECTION.find(item => item.id === newUnlocks[0]);
      if (firstNewItem) {
        setShowingNewUnlock(firstNewItem);
        playSound('achievement_unlock');
        triggerHaptic('success');
      }
      
      onWardrobeUpdate({
        equippedItems: wardrobeService.exportState().equippedItems,
        unlockedItems: wardrobeService.exportState().unlockedItems,
        newUnlocks
      });
    }
  }, [studentData.level, studentData.achievements, studentData.stats, onWardrobeUpdate]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      case 'mythic': return 'from-pink-400 to-pink-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityEmoji = (rarity: string) => {
    switch (rarity) {
      case 'common': return '⚪';
      case 'rare': return '🔵';
      case 'epic': return '🟣';
      case 'legendary': return '🟡';
      case 'mythic': return '🌸';
      default: return '⚪';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'hat': return '🎩';
      case 'crown': return '👑';
      case 'cape': return '🦸';
      case 'wings': return '🧚';
      case 'glasses': return '🤓';
      case 'necklace': return '📿';
      case 'wand': return '🪄';
      case 'boots': return '👢';
      case 'armor': return '🛡️';
      default: return '✨';
    }
  };

  const categories = ['all', 'hat', 'crown', 'cape', 'wings', 'glasses', 'necklace', 'wand', 'accessory'];
  const tabs = [
    { id: 'all', name: 'Tous', icon: '👁️' },
    { id: 'equipped', name: 'Équipés', icon: '✅' },
    { id: 'unlocked', name: 'Débloqués', icon: '🔓' },
    { id: 'locked', name: 'Verrouillés', icon: '🔒' },
    { id: 'seasonal', name: 'Saisonnier', icon: '🎃' }
  ];

  const currentStats = {
    xpBonus: wardrobeService.getTotalXPBonus(),
    streakMultiplier: wardrobeService.getTotalStreakMultiplier(),
    specialPowers: wardrobeService.getActiveSpecialPowers()
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl shadow-2xl">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🎭 Garde-robe Magique
            </h1>
            <p className="text-gray-600 mt-1">Personnalise ton mascotte avec des équipements extraordinaires!</p>
          </div>
          
          {/* Active Bonuses */}
          <div className="flex gap-3">
            {currentStats.xpBonus > 0 && (
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium">
                ⚡ +{currentStats.xpBonus}% XP
              </div>
            )}
            {currentStats.streakMultiplier > 1 && (
              <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium">
                🔥 x{currentStats.streakMultiplier.toFixed(1)} Streak
              </div>
            )}
            {currentStats.specialPowers.length > 0 && (
              <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded-full text-sm font-medium">
                ✨ {currentStats.specialPowers.length} Pouvoir{currentStats.specialPowers.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 3D Mascot Display */}
        <div className="xl:col-span-1">
          <MascotWardrobe3D
            mascotType={mascotType}
            equippedItems={wardrobeService.exportState().equippedItems}
            studentLevel={studentData.level}
            onItemEquip={(itemId: string) => {
              const item = COMPLETE_WARDROBE_COLLECTION.find(i => i.id === itemId);
              if (item) handleItemToggle(item);
            }}
            onItemUnequip={(itemId) => {
              const item = COMPLETE_WARDROBE_COLLECTION.find(i => i.id === itemId);
              if (item) handleItemToggle(item);
            }}
          />
        </div>

        {/* Wardrobe Panel */}
        <div className="xl:col-span-2">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-6 h-full">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'Tous' : getTypeEmoji(category)}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {filteredItems.map(item => {
                  const isEquipped = wardrobeService.getEquippedItems().some(equipped => equipped.id === item.id);
                  const isUnlocked = wardrobeService.getUnlockedItems().some(unlocked => unlocked.id === item.id);
                  const canUnlock = wardrobeService.checkUnlockConditions(item) && item.unlockLevel <= studentData.level;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                        isEquipped
                          ? 'border-green-400 bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg'
                          : isUnlocked
                          ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-100 hover:border-blue-400 hover:shadow-lg'
                          : canUnlock
                          ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-100 hover:border-yellow-400'
                          : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 opacity-75'
                      }`}
                      onClick={() => handleItemToggle(item)}
                    >
                      {/* Rarity Glow */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(item.rarity)} opacity-10 rounded-xl`} />
                      
                      {/* Item Header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{getTypeEmoji(item.type)}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{getRarityEmoji(item.rarity)}</span>
                          {item.effects.particles && <span className="text-xs">✨</span>}
                          {item.stats?.specialPower && <span className="text-xs">🌟</span>}
                        </div>
                      </div>

                      {/* Item Name */}
                      <h4 className="font-bold text-sm text-gray-800 mb-1 leading-tight">
                        {item.name}
                      </h4>

                      {/* Item Description */}
                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Stats */}
                      {item.stats && (
                        <div className="space-y-1 mb-3">
                          {item.stats.xpBonus > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              ⚡ +{item.stats.xpBonus}% XP
                            </div>
                          )}
                          {item.stats.streakMultiplier > 1 && (
                            <div className="text-xs text-blue-600 font-medium">
                              🔥 x{item.stats.streakMultiplier} Streak
                            </div>
                          )}
                        </div>
                      )}

                      {/* Unlock Level */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-indigo-600 font-medium">
                          Niveau {item.unlockLevel}
                        </span>
                        
                        {/* Status Indicator */}
                        {isEquipped && (
                          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            ✓ ON
                          </div>
                        )}
                        {!isUnlocked && canUnlock && (
                          <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            🔓 NEW
                          </div>
                        )}
                        {!isUnlocked && !canUnlock && (
                          <div className="bg-gray-400 text-white px-2 py-1 rounded-full text-xs font-bold">
                            🔒
                          </div>
                        )}
                      </div>

                      {/* Seasonal Badge */}
                      {item.seasonal && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          🎃 {item.seasonal.season.toUpperCase()}
                        </div>
                      )}

                      {/* Premium Badge */}
                      {item.category === 'premium' && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          💎 VIP
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucun équipement trouvé
                </h3>
                <p className="text-gray-600 text-sm">
                  Continue à apprendre pour débloquer plus d'équipements!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Unlock Modal */}
      <AnimatePresence>
        {showingNewUnlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowingNewUnlock(null)}
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 50 }}
              className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 max-w-md w-full text-white text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold mb-2">Nouvel équipement débloqué!</h3>
              <div className="text-4xl mb-4">{getTypeEmoji(showingNewUnlock.type)}</div>
              <h4 className="text-xl font-bold mb-2">{showingNewUnlock.name}</h4>
              <p className="text-purple-100 mb-6">{showingNewUnlock.description}</p>
              
              <button
                onClick={() => {
                  setShowingNewUnlock(null);
                  handleItemToggle(showingNewUnlock);
                }}
                className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold hover:bg-purple-50 transition-colors"
              >
                Équiper maintenant!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BeautifulMascotWardrobe;