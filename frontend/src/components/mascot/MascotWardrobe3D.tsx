import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';

// Wardrobe item types with 3D attachment points
interface WardrobeItem {
  id: string;
  name: string;
  type: 'hat' | 'cape' | 'accessory' | 'wings' | 'armor' | 'glasses' | 'necklace' | 'boots';
  attachmentPoint: string; // 3D bone/node name
  meshUrl?: string; // 3D model URL
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects: {
    particles: boolean;
    glow: boolean;
    animation: string;
  };
  unlockLevel: number;
  description: string;
}

// 3D Attachment Points for different mascot types
const ATTACHMENT_POINTS = {
  dragon: {
    head: new THREE.Vector3(0, 1.5, 0),
    neck: new THREE.Vector3(0, 1.2, 0),
    back: new THREE.Vector3(0, 0.8, -0.3),
    wings: new THREE.Vector3(0, 0.9, -0.4),
    feet: new THREE.Vector3(0, -1.2, 0),
    tail: new THREE.Vector3(0, 0, -1.2)
  },
  fairy: {
    head: new THREE.Vector3(0, 1.3, 0),
    neck: new THREE.Vector3(0, 1.0, 0),
    back: new THREE.Vector3(0, 0.7, -0.2),
    wings: new THREE.Vector3(0, 0.8, -0.3),
    feet: new THREE.Vector3(0, -1.0, 0),
    hands: new THREE.Vector3(0.5, 0.5, 0)
  },
  robot: {
    head: new THREE.Vector3(0, 1.4, 0),
    chest: new THREE.Vector3(0, 0.6, 0),
    back: new THREE.Vector3(0, 0.6, -0.3),
    arms: new THREE.Vector3(0.6, 0.4, 0),
    legs: new THREE.Vector3(0, -0.8, 0)
  }
};

// Premium wardrobe collection
const WARDROBE_COLLECTION: WardrobeItem[] = [
  {
    id: 'golden_crown',
    name: 'Couronne Dorée',
    type: 'hat',
    attachmentPoint: 'head',
    color: '#FFD700',
    rarity: 'legendary',
    effects: { particles: true, glow: true, animation: 'float' },
    unlockLevel: 10,
    description: 'Une couronne majestueuse qui brille de mille feux!'
  },
  {
    id: 'magic_cape',
    name: 'Cape Magique',
    type: 'cape',
    attachmentPoint: 'back',
    color: '#8A2BE2',
    rarity: 'epic',
    effects: { particles: true, glow: false, animation: 'wave' },
    unlockLevel: 5,
    description: 'Une cape qui ondule dans le vent magique'
  },
  {
    id: 'crystal_wings',
    name: 'Ailes de Cristal',
    type: 'wings',
    attachmentPoint: 'wings',
    color: '#00BFFF',
    rarity: 'epic',
    effects: { particles: true, glow: true, animation: 'flutter' },
    unlockLevel: 8,
    description: 'Des ailes translucides qui scintillent'
  },
  {
    id: 'rainbow_necklace',
    name: 'Collier Arc-en-ciel',
    type: 'necklace',
    attachmentPoint: 'neck',
    color: '#FF69B4',
    rarity: 'rare',
    effects: { particles: false, glow: true, animation: 'pulse' },
    unlockLevel: 3,
    description: 'Un collier aux couleurs chatoyantes'
  },
  {
    id: 'star_glasses',
    name: 'Lunettes Étoilées',
    type: 'glasses',
    attachmentPoint: 'head',
    color: '#FFB6C1',
    rarity: 'rare',
    effects: { particles: true, glow: false, animation: 'sparkle' },
    unlockLevel: 4,
    description: 'Des lunettes qui font briller les yeux'
  }
];

interface MascotWardrobe3DProps {
  mascotType: 'dragon' | 'fairy' | 'robot';
  equippedItems: string[];
  studentLevel: number;
  onItemEquip: (itemId: string) => void;
  onItemUnequip: (itemId: string) => void;
}

const MascotWardrobe3D: React.FC<MascotWardrobe3DProps> = ({
  mascotType,
  equippedItems,
  studentLevel,
  onItemEquip,
  onItemUnequip
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mascotRef = useRef<THREE.Group | null>(null);
  const wardrobeItemsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewItem, setPreviewItem] = useState<string | null>(null);

  // Available items based on student level
  const availableItems = useMemo(() => 
    WARDROBE_COLLECTION.filter(item => item.unlockLevel <= studentLevel),
    [studentLevel]
  );

  // Create beautiful 3D mascot with wardrobe attachment points
  const createMascot = useCallback(() => {
    if (!sceneRef.current) return;

    const mascotGroup = new THREE.Group();
    
    // Create base mascot geometry based on type
    let mascotGeometry: THREE.BufferGeometry;
    let mascotMaterial: THREE.Material;

    switch (mascotType) {
      case 'dragon':
        // Dragon body
        mascotGeometry = new THREE.CapsuleGeometry(0.3, 1.2, 8, 16);
        mascotMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x228B22, 
          shininess: 30,
          transparent: true,
          opacity: 0.9
        });
        break;
      case 'fairy':
        // Fairy body
        mascotGeometry = new THREE.CapsuleGeometry(0.25, 1.0, 6, 12);
        mascotMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xFFB6C1, 
          shininess: 50,
          transparent: true,
          opacity: 0.95
        });
        break;
      case 'robot':
        // Robot body
        mascotGeometry = new THREE.BoxGeometry(0.6, 1.4, 0.4);
        mascotMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x4169E1, 
          shininess: 100
        });
        break;
    }

    const mascotMesh = new THREE.Mesh(mascotGeometry, mascotMaterial);
    mascotGroup.add(mascotMesh);

    // Add attachment points as invisible objects for reference
    const attachmentPoints = ATTACHMENT_POINTS[mascotType];
    Object.entries(attachmentPoints).forEach(([pointName, position]) => {
      const attachmentPoint = new THREE.Object3D();
      attachmentPoint.position.copy(position);
      attachmentPoint.name = pointName;
      mascotGroup.add(attachmentPoint);
    });

    mascotRef.current = mascotGroup;
    sceneRef.current.add(mascotGroup);
    
    return mascotGroup;
  }, [mascotType]);

  // Create beautiful 3D wardrobe item
  const create3DWardrobeItem = useCallback((item: WardrobeItem): THREE.Object3D => {
    const itemGroup = new THREE.Group();
    itemGroup.name = item.id;

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (item.type) {
      case 'hat':
        geometry = new THREE.ConeGeometry(0.3, 0.4, 8);
        material = new THREE.MeshPhongMaterial({ 
          color: item.color,
          shininess: item.rarity === 'legendary' ? 100 : 50
        });
        break;
      case 'cape':
        geometry = new THREE.PlaneGeometry(0.8, 1.2);
        material = new THREE.MeshPhongMaterial({ 
          color: item.color,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        break;
      case 'wings':
        const wingGeometry = new THREE.PlaneGeometry(0.6, 0.8);
        const wingMaterial = new THREE.MeshPhongMaterial({ 
          color: item.color,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide
        });
        
        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(-0.3, 0, 0);
        leftWing.rotation.y = Math.PI / 6;
        
        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0.3, 0, 0);
        rightWing.rotation.y = -Math.PI / 6;
        
        itemGroup.add(leftWing, rightWing);
        return itemGroup;
      case 'necklace':
        geometry = new THREE.TorusGeometry(0.25, 0.05, 8, 16);
        material = new THREE.MeshPhongMaterial({ 
          color: item.color,
          shininess: 80
        });
        break;
      case 'glasses':
        const frameGeometry = new THREE.TorusGeometry(0.15, 0.02, 8, 16);
        const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftLens = new THREE.Mesh(frameGeometry, frameMaterial);
        leftLens.position.set(-0.2, 0, 0);
        
        const rightLens = new THREE.Mesh(frameGeometry, frameMaterial);
        rightLens.position.set(0.2, 0, 0);
        
        // Bridge
        const bridgeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.1);
        const bridge = new THREE.Mesh(bridgeGeometry, frameMaterial);
        bridge.rotation.z = Math.PI / 2;
        bridge.position.set(0, 0.02, 0);
        
        itemGroup.add(leftLens, rightLens, bridge);
        return itemGroup;
      default:
        geometry = new THREE.SphereGeometry(0.1);
        material = new THREE.MeshPhongMaterial({ color: item.color });
    }

    const mesh = new THREE.Mesh(geometry, material);
    itemGroup.add(mesh);

    // Add particle effects for rare items
    if (item.effects.particles) {
      const particleCount = item.rarity === 'legendary' ? 50 : 20;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 2;
        positions[i + 1] = (Math.random() - 0.5) * 2;
        positions[i + 2] = (Math.random() - 0.5) * 2;
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: item.color,
        size: 0.02,
        transparent: true,
        opacity: 0.6
      });
      
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      itemGroup.add(particles);
    }

    // Add glow effect
    if (item.effects.glow) {
      const glowGeometry = mesh.geometry.clone();
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: item.color,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.scale.multiplyScalar(1.1);
      itemGroup.add(glow);
    }

    return itemGroup;
  }, []);

  // Attach wardrobe item to mascot
  const attachItemToMascot = useCallback((item: WardrobeItem) => {
    if (!mascotRef.current) return;

    const itemObject = create3DWardrobeItem(item);
    const attachmentPoint = mascotRef.current.getObjectByName(item.attachmentPoint);
    
    if (attachmentPoint) {
      // Position item at attachment point
      itemObject.position.copy(attachmentPoint.position);
      
      // Apply specific positioning adjustments
      switch (item.type) {
        case 'hat':
          itemObject.position.y += 0.3;
          break;
        case 'cape':
          itemObject.position.z -= 0.2;
          itemObject.rotation.x = Math.PI;
          break;
        case 'wings':
          itemObject.position.z -= 0.1;
          break;
        case 'necklace':
          itemObject.position.y -= 0.1;
          break;
        case 'glasses':
          itemObject.position.z += 0.15;
          break;
      }

      mascotRef.current.add(itemObject);
      wardrobeItemsRef.current.set(item.id, itemObject);

      // Start animation based on item type
      animateWardrobeItem(itemObject, item);
    }
  }, [create3DWardrobeItem]);

  // Animate wardrobe items
  const animateWardrobeItem = (itemObject: THREE.Object3D, item: WardrobeItem) => {
    const animate = () => {
      switch (item.effects.animation) {
        case 'float':
          itemObject.position.y += Math.sin(Date.now() * 0.005) * 0.01;
          break;
        case 'wave':
          if (itemObject.children[0] && 'rotation' in itemObject.children[0]) {
            (itemObject.children[0] as THREE.Mesh).rotation.x = Math.sin(Date.now() * 0.003) * 0.2;
          }
          break;
        case 'flutter':
          itemObject.children.forEach((wing, index) => {
            if ('rotation' in wing) {
              (wing as THREE.Mesh).rotation.z = Math.sin(Date.now() * 0.01 + index * Math.PI) * 0.3;
            }
          });
          break;
        case 'pulse':
          const scale = 1 + Math.sin(Date.now() * 0.008) * 0.1;
          itemObject.scale.setScalar(scale);
          break;
        case 'sparkle':
          itemObject.rotation.y += 0.02;
          break;
      }
      requestAnimationFrame(animate);
    };
    animate();
  };

  // Remove wardrobe item
  const removeItemFromMascot = useCallback((itemId: string) => {
    const itemObject = wardrobeItemsRef.current.get(itemId);
    if (itemObject && mascotRef.current) {
      mascotRef.current.remove(itemObject);
      wardrobeItemsRef.current.delete(itemId);
    }
  }, []);

  // Initialize 3D scene
  useEffect(() => {
    if (!mountRef.current) return;
    if (process.env.NODE_ENV === 'test') return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f8ff);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 3);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(400, 400);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create mascot
    createMascot();

    mountRef.current.appendChild(renderer.domElement);

    // Animation loop
    const animate = () => {
      if (mascotRef.current) {
        mascotRef.current.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [mascotType, createMascot]);

  // Update equipped items
  useEffect(() => {
    // Remove all current items
    wardrobeItemsRef.current.forEach((_, itemId) => {
      removeItemFromMascot(itemId);
    });

    // Add equipped items
    equippedItems.forEach(itemId => {
      const item = WARDROBE_COLLECTION.find(i => i.id === itemId);
      if (item) {
        attachItemToMascot(item);
      }
    });
  }, [equippedItems, attachItemToMascot, removeItemFromMascot]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100';
      case 'rare': return 'text-blue-600 bg-blue-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      case 'legendary': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const categories = ['all', 'hat', 'cape', 'wings', 'accessory', 'glasses'];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
      {/* 3D Mascot Display */}
      <div className="flex-1">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🎭 Mascotte 3D
          </h3>
          <div 
            ref={mountRef} 
            className="w-full h-96 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-dashed border-blue-200"
          />
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Équipements actifs: {equippedItems.length}
            </p>
          </div>
        </div>
      </div>

      {/* Wardrobe Panel */}
      <div className="flex-1">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            👗 Garde-robe Magique
          </h3>

          {/* Category Filter */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category === 'all' ? 'Tout' : category}
              </button>
            ))}
          </div>

          {/* Wardrobe Items */}
          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {availableItems
                .filter(item => selectedCategory === 'all' || item.type === selectedCategory)
                .map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    equippedItems.includes(item.id)
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                  onClick={() => {
                    if (equippedItems.includes(item.id)) {
                      onItemUnequip(item.id);
                    } else {
                      onItemEquip(item.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">
                      {item.type === 'hat' && '👑'}
                      {item.type === 'cape' && '🦸'}
                      {item.type === 'wings' && '🧚'}
                      {item.type === 'glasses' && '🤓'}
                      {item.type === 'necklace' && '📿'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(item.rarity)}`}>
                      {item.rarity}
                    </span>
                  </div>
                  
                  <h4 className="font-medium text-sm text-gray-800 mb-1">
                    {item.name}
                  </h4>
                  
                  <p className="text-xs text-gray-600 mb-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">
                      Niveau {item.unlockLevel}
                    </span>
                    {equippedItems.includes(item.id) && (
                      <span className="text-xs text-green-600 font-medium">
                        ✓ Équipé
                      </span>
                    )}
                  </div>

                  {item.effects.particles && (
                    <div className="text-xs text-yellow-600 mt-1">
                      ✨ Effets spéciaux
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 Astuce: Monte de niveau pour débloquer plus d'équipements magiques!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MascotWardrobe3D;