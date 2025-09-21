import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MascotWardrobe3D from './mascot/MascotWardrobe3D';
import MicroInteraction from './MicroInteractions';

interface WardrobeModalProps {
  selectedMascot: 'dragon' | 'fairy' | 'robot';
  equippedItems: string[];
  studentLevel: number;
  onItemEquip: (itemId: string) => void;
  onItemUnequip: (itemId: string) => void;
}

const WardrobeModal = ({
  selectedMascot,
  equippedItems,
  studentLevel,
  onItemEquip,
  onItemUnequip,
}: WardrobeModalProps) => {
  const [showWardrobe, setShowWardrobe] = useState(false);

  return (
    <>
      {/* Wardrobe Button with Premium Micro-Interactions */}
      <div className="fixed top-6 right-20 z-40">
        <div title="Garde-robe du mascot">
          <MicroInteraction
            type="button"
            intensity="medium"
            onClick={() => setShowWardrobe(true)}
            className="bg-white/80 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-all duration-300 border border-gray-200/50 shadow-lg hover:shadow-xl"
          >
            <span className="text-xl filter drop-shadow-sm">👕</span>
          </MicroInteraction>
        </div>
      </div>

      {/* 3D Mascot Wardrobe Modal */}
      {showWardrobe && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowWardrobe(false)}
        >
          <motion.div
            className="bg-white rounded-3xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Garde-robe du Mascot</h2>
              <button
                onClick={() => setShowWardrobe(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <MascotWardrobe3D
              mascotType={selectedMascot}
              equippedItems={equippedItems}
              studentLevel={studentLevel}
              onItemEquip={onItemEquip}
              onItemUnequip={onItemUnequip}
            />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default WardrobeModal;
