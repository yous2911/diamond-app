import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useMagicalSounds } from '../../hooks/useMagicalSounds';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WardrobeItem {
  id: string;
  name: string;
  type: 'hat' | 'accessory' | 'color' | 'pattern';
  emoji: string;
  unlocked: boolean;
  requiredLevel: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description: string;
}

interface WardrobeModalMobileProps {
  selectedMascot?: string;
  equippedItems: string[];
  studentLevel: number;
  onItemEquip: (itemId: string) => void;
  onItemUnequip: (itemId: string) => void;
  onClose: () => void;
  visible: boolean;
}

const WardrobeModalMobile: React.FC<WardrobeModalMobileProps> = ({
  selectedMascot = 'dragon',
  equippedItems = [],
  studentLevel = 1,
  onItemEquip,
  onItemUnequip,
  onClose,
  visible = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'hat' | 'accessory' | 'color' | 'pattern'>('hat');
  const { playSparkleSound } = useMagicalSounds();

  // Wardrobe items database
  const wardrobeItems: WardrobeItem[] = [
    // Hats
    { id: 'crown', name: 'Couronne Dorée', type: 'hat', emoji: '👑', unlocked: true, requiredLevel: 1, rarity: 'common', description: 'Une couronne royale' },
    { id: 'wizard_hat', name: 'Chapeau de Magicien', type: 'hat', emoji: '🧙‍♂️', unlocked: studentLevel >= 3, requiredLevel: 3, rarity: 'rare', description: 'Pour les apprentis magiciens' },
    { id: 'cowboy_hat', name: 'Chapeau de Cowboy', type: 'hat', emoji: '🤠', unlocked: studentLevel >= 5, requiredLevel: 5, rarity: 'epic', description: 'Pour les aventuriers' },
    { id: 'crown_legendary', name: 'Couronne Légendaire', type: 'hat', emoji: '💎', unlocked: studentLevel >= 10, requiredLevel: 10, rarity: 'legendary', description: 'La couronne ultime' },

    // Accessories
    { id: 'glasses', name: 'Lunettes', type: 'accessory', emoji: '🤓', unlocked: true, requiredLevel: 1, rarity: 'common', description: 'Pour voir plus clair' },
    { id: 'cape', name: 'Cape Magique', type: 'accessory', emoji: '🦸‍♂️', unlocked: studentLevel >= 2, requiredLevel: 2, rarity: 'rare', description: 'Une cape qui vole' },
    { id: 'wings', name: 'Ailes d\'Ange', type: 'accessory', emoji: '👼', unlocked: studentLevel >= 7, requiredLevel: 7, rarity: 'epic', description: 'Pour voler dans les nuages' },
    { id: 'halo', name: 'Auréole', type: 'accessory', emoji: '😇', unlocked: studentLevel >= 15, requiredLevel: 15, rarity: 'legendary', description: 'L\'auréole divine' },

    // Colors
    { id: 'blue', name: 'Bleu Océan', type: 'color', emoji: '🔵', unlocked: true, requiredLevel: 1, rarity: 'common', description: 'Couleur de l\'océan' },
    { id: 'purple', name: 'Violet Mystique', type: 'color', emoji: '🟣', unlocked: studentLevel >= 4, requiredLevel: 4, rarity: 'rare', description: 'Couleur mystérieuse' },
    { id: 'rainbow', name: 'Arc-en-ciel', type: 'color', emoji: '🌈', unlocked: studentLevel >= 8, requiredLevel: 8, rarity: 'epic', description: 'Toutes les couleurs' },
    { id: 'gold', name: 'Or Pur', type: 'color', emoji: '🟡', unlocked: studentLevel >= 12, requiredLevel: 12, rarity: 'legendary', description: 'Couleur dorée' },

    // Patterns
    { id: 'stripes', name: 'Rayures', type: 'pattern', emoji: '〰️', unlocked: true, requiredLevel: 1, rarity: 'common', description: 'Motif rayé' },
    { id: 'dots', name: 'Points', type: 'pattern', emoji: '⚫', unlocked: studentLevel >= 3, requiredLevel: 3, rarity: 'rare', description: 'Motif à pois' },
    { id: 'stars', name: 'Étoiles', type: 'pattern', emoji: '⭐', unlocked: studentLevel >= 6, requiredLevel: 6, rarity: 'epic', description: 'Motif étoilé' },
    { id: 'galaxy', name: 'Galaxie', type: 'pattern', emoji: '🌌', unlocked: studentLevel >= 20, requiredLevel: 20, rarity: 'legendary', description: 'Motif galactique' },
  ];

  // Filter items by category
  const categoryItems = wardrobeItems.filter(item => item.type === selectedCategory);

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  // Handle item equip/unequip
  const handleItemPress = (item: WardrobeItem) => {
    if (!item.unlocked) return;

    playSparkleSound();

    if (equippedItems.includes(item.id)) {
      onItemUnequip(item.id);
    } else {
      onItemEquip(item.id);
    }
  };

  // Category buttons
  const categories = [
    { key: 'hat', emoji: '👑', name: 'Chapeaux' },
    { key: 'accessory', emoji: '🦸‍♂️', name: 'Accessoires' },
    { key: 'color', emoji: '🎨', name: 'Couleurs' },
    { key: 'pattern', emoji: '✨', name: 'Motifs' },
  ] as const;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎭 Garde-robe</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Category Selector */}
          <View style={styles.categorySelector}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.key && styles.categoryTextActive,
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Items Grid */}
          <ScrollView style={styles.itemsContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.itemsGrid}>
              {categoryItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    !item.unlocked && styles.itemCardLocked,
                    equippedItems.includes(item.id) && styles.itemCardEquipped,
                  ]}
                  onPress={() => handleItemPress(item)}
                  disabled={!item.unlocked}
                >
                  {/* Item Emoji */}
                  <Text style={[
                    styles.itemEmoji,
                    !item.unlocked && styles.itemEmojiLocked,
                  ]}>
                    {item.unlocked ? item.emoji : '🔒'}
                  </Text>

                  {/* Item Name */}
                  <Text style={[
                    styles.itemName,
                    !item.unlocked && styles.itemNameLocked,
                  ]}>
                    {item.name}
                  </Text>

                  {/* Rarity Badge */}
                  <View style={[
                    styles.rarityBadge,
                    { backgroundColor: getRarityColor(item.rarity) },
                  ]}>
                    <Text style={styles.rarityText}>
                      {item.rarity.toUpperCase()}
                    </Text>
                  </View>

                  {/* Level Requirement */}
                  {!item.unlocked && (
                    <Text style={styles.levelRequirement}>
                      Niveau {item.requiredLevel}
                    </Text>
                  )}

                  {/* Equipped Badge */}
                  {equippedItems.includes(item.id) && (
                    <View style={styles.equippedBadge}>
                      <Text style={styles.equippedText}>ÉQUIPÉ</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Equipped Items Summary */}
          <View style={styles.equippedSummary}>
            <Text style={styles.equippedTitle}>Éléments équipés:</Text>
            <Text style={styles.equippedCount}>
              {equippedItems.length} / {wardrobeItems.length}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.8,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#6B7280',
  },
  categorySelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 4,
  },
  categoryButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  categoryButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  itemsContainer: {
    flex: 1,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  itemCard: {
    width: (screenWidth * 0.9 - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemCardLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  itemCardEquipped: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  itemEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  itemEmojiLocked: {
    opacity: 0.5,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  itemNameLocked: {
    color: '#9CA3AF',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  levelRequirement: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  equippedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  equippedText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  equippedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  equippedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  equippedCount: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default WardrobeModalMobile;






