/**
 * MascotSystem-OPTIMIZED.tsx
 * Version optimisée pour meilleures performances
 * 
 * OPTIMISATIONS APPLIQUÉES:
 * 1. Mémorisation des géométries statiques
 * 2. Séparation création/animation
 * 3. Cleanup complet des ressources
 * 4. Réduction complexité géométries
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { WARDROBE_ITEMS, createItemMesh } from './WardrobeData';
import { MASCOT_CONFIGS, EnhancedMascotState } from './mascot/MascotEnhanced-Part1';
import {
  createDragonWings,
  createDragonTail,
  createFairyWings,
  createRobotArms,
  createRobotScreen,
  createCatTail,
  createOwlBook,
  createOwlFeathers
} from './mascot/MascotEnhanced-Part3';

// --- DIALOGUE INTERNATIONALIZATION ---
const DIALOGUES = {
  en: {
    proud: "Incredible! You've mastered {level} levels!",
    encouraging: "Everyone learns differently - you're doing great!",
    excited: "WOW! That was AMAZING! 🎉",
    curious: "I wonder what you'll discover next?",
    struggling_support: "Remember when you solved that hard problem? You can do this too!",
    default: "Ready for a new challenge? 🤔"
  },
  fr: {
    proud: "Incroyable ! Tu as maîtrisé {level} niveaux !",
    encouraging: "Chacun apprend différemment - tu fais du bon travail !",
    excited: "WOW ! C'était INCROYABLE ! 🎉",
    curious: "Je me demande ce que tu vas découvrir ensuite ?",
    struggling_support: "Tu te souviens quand tu as résolu ce problème difficile ? Tu peux le faire aussi !",
    default: "Prêt pour un nouveau défi ? 🤔"
  },
};

// --- TYPE DEFINITIONS ---
interface MascotAIState extends EnhancedMascotState {
  memory: {
    lastInteraction: Date;
    favoriteActivities: string[];
    studentProgress: number;
    mistakePatterns: string[];
  };
}

interface MascotSystemProps {
  locale: 'en' | 'fr';
  mascotType: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  studentData: {
    level: number;
    xp: number;
    currentStreak: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    recentPerformance: 'struggling' | 'average' | 'excellent';
  };
  currentActivity: 'idle' | 'exercise' | 'achievement' | 'mistake' | 'learning';
  equippedItems: string[];
  onMascotInteraction: (interaction: string) => void;
  onEmotionalStateChange: (state: MascotAIState) => void;
}

// --- UNIFIED MASCOT COMPONENT (OPTIMIZED) ---
const MascotSystem: React.FC<MascotSystemProps> = ({
  locale,
  mascotType,
  studentData,
  currentActivity,
  equippedItems,
  onMascotInteraction,
  onEmotionalStateChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const mascotGroupRef = useRef<THREE.Group>();
  const animationRef = useRef<number>();
  const previousMascotRef = useRef<THREE.Group | null>(null); // Pour cleanup

  const [aiState, setAiState] = useState<MascotAIState>({
    mood: 'happy',
    energy: 80,
    attention: 90,
    relationship: 50,
    emotions: {
      joy: 50,
      sadness: 10,
      surprise: 20,
      fear: 5,
      trust: 50,
      anticipation: 30
    },
    personality: {
      extroversion: 0.7,
      patience: 0.6,
      playfulness: 0.8,
      intelligence: 0.9
    },
    memory: {
      lastInteraction: new Date(),
      favoriteActivities: ['exercises', 'achievements'],
      studentProgress: studentData.level,
      mistakePatterns: []
    }
  });

  const [currentDialogue, setCurrentDialogue] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [eyeTracking, setEyeTracking] = useState({ x: 0, y: 0 });
  const [breathingPhase, setBreathingPhase] = useState(0);

  // Use enhanced mascot configs (mémorisé)
  const config = useMemo(() => MASCOT_CONFIGS[mascotType], [mascotType]);

  // Helper function to dispose geometries and materials
  const disposeMascot = useCallback((group: THREE.Group | null) => {
    if (!group) return;
    
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Dispose geometry
        if (child.geometry) {
          child.geometry.dispose();
        }
        
        // Dispose materials
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            if (material.map) material.map.dispose();
            if (material.normalMap) material.normalMap.dispose();
            if (material.emissiveMap) material.emissiveMap.dispose();
            material.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          if (child.material.normalMap) child.material.normalMap.dispose();
          if (child.material.emissiveMap) child.material.emissiveMap.dispose();
          child.material.dispose();
        }
      }
    });
  }, []);

  const calculateMoodShift = useCallback(() => {
    let newMood = aiState.mood;
    let energyChange = 0;
    let relationshipChange = 0;

    switch (studentData.timeOfDay) {
      case 'morning': energyChange = 5; break;
      case 'evening': energyChange = -10; break;
    }

    switch (studentData.recentPerformance) {
      case 'excellent':
        newMood = 'proud';
        relationshipChange = 5;
        energyChange += 10;
        break;
      case 'struggling':
        newMood = aiState.personality.patience > 0.5 ? 'encouraging' : 'focused';
        relationshipChange = 2;
        break;
      case 'average':
        newMood = 'curious';
        relationshipChange = 1;
        break;
    }

    switch (currentActivity) {
      case 'achievement': newMood = 'excited'; energyChange += 15; break;
      case 'mistake': newMood = 'encouraging'; break;
      case 'exercise': newMood = 'focused'; energyChange -= 5; break;
    }

    setAiState(prev => ({
      ...prev,
      mood: newMood,
      energy: Math.max(0, Math.min(100, prev.energy + energyChange)),
      relationship: Math.max(0, Math.min(100, prev.relationship + relationshipChange)),
      memory: { ...prev.memory, lastInteraction: new Date(), studentProgress: studentData.level }
    }));
  }, [aiState, studentData, currentActivity]);

  const generateDialogue = useCallback(() => {
    const { mood, energy, relationship } = aiState;
    const { recentPerformance } = studentData;
    const lang = DIALOGUES[locale];

    const moodMap: Record<string, keyof typeof lang> = {
      'happy': 'excited',
      'focused': 'curious',
      'tired': 'encouraging',
      'excited': 'excited',
      'curious': 'curious',
      'proud': 'proud',
      'encouraging': 'encouraging'
    };
    
    const dialogueKey = moodMap[mood] || 'default';
    let dialogue = lang[dialogueKey] || lang.default;

    if (recentPerformance === 'struggling' && relationship > 70) {
      dialogue = lang.struggling_support;
    }

    dialogue = dialogue.replace('{level}', studentData.level.toString()).replace('{streak}', studentData.currentStreak.toString());

    if (energy < 30) {
      dialogue = dialogue.replace('!', '.').toLowerCase();
    }

    return dialogue;
  }, [aiState, studentData, locale]);

  // OPTIMIZED: Créer le modèle seulement quand nécessaire (mascotType, config, equippedItems changent)
  // Ne pas recréer pour breathingPhase ou eyeTracking (animés séparément)
  const createMascotModel = useCallback(() => {
    const group = new THREE.Group();

    equippedItems.forEach(itemId => {
      const item = WARDROBE_ITEMS.find(w => w.id === itemId);
      if (item) group.add(createItemMesh(item));
    });

    const headSize = 0.7 + (aiState.personality.extroversion * 0.2);
    const eyeSize = 0.15 + (aiState.personality.intelligence * 0.05);
    const bodyScale = 1 + (aiState.energy / 500);

    const headMaterial = new THREE.MeshPhongMaterial({
      color: new THREE.Color().setHSL((aiState.relationship / 100) * 0.3, 0.8, 0.6 + (aiState.energy / 200)),
      shininess: 100,
      transparent: true,
      opacity: 0.9 + (aiState.attention / 1000)
    });

    const head = new THREE.Mesh(new THREE.SphereGeometry(headSize, 32, 32), headMaterial);
    head.position.set(0, 1.5, 0);
    head.castShadow = true;
    group.add(head);

    const eyeMaterial = new THREE.MeshPhongMaterial({ 
      color: config.colors.eyes, 
      emissive: config.colors.eyes, 
      emissiveIntensity: aiState.attention / 200 
    });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(eyeSize, 16, 16), eyeMaterial);
    leftEye.position.set(-0.2, 1.6, 0.5); // eyeTracking appliqué dans animation
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(eyeSize, 16, 16), eyeMaterial);
    rightEye.position.set(0.2, 1.6, 0.5);
    
    // Store eye refs for animation
    group.userData.leftEye = leftEye;
    group.userData.rightEye = rightEye;
    group.userData.body = null; // Sera ajouté après
    
    group.add(leftEye, rightEye);

    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 24), headMaterial.clone());
    body.scale.set(bodyScale, bodyScale, bodyScale); // breathingPhase appliqué dans animation
    body.castShadow = true;
    group.userData.body = body;
    group.add(body);

    // Enhanced type-specific features
    switch (mascotType) {
      case 'dragon': {
        const wings = createDragonWings(config, aiState);
        const tail = createDragonTail(config, aiState);
        group.add(wings, tail);
        group.userData.wings = wings;
        group.userData.tail = tail;
        break;
      }
      case 'fairy': {
        const wings = createFairyWings(config, aiState);
        group.add(wings);
        group.userData.wings = wings;
        break;
      }
      case 'robot': {
        const arms = createRobotArms(config, aiState);
        const screen = createRobotScreen(config, aiState);
        group.add(arms, screen);
        group.userData.arms = arms;
        group.userData.screen = screen;
        break;
      }
      case 'cat': {
        const earGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
        const earMat = new THREE.MeshPhongMaterial({ color: config.colors.primary });
        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-0.3, 2.0, 0);
        const rightEar = leftEar.clone();
        rightEar.position.x *= -1;
        group.add(leftEar, rightEar);
        const tail = createCatTail(config, aiState);
        group.add(tail);
        group.userData.tail = tail;
        break;
      }
      case 'owl': {
        const book = createOwlBook(config);
        const feathers = createOwlFeathers(config, bodyScale);
        group.add(book, feathers);
        group.userData.feathers = feathers;
        break;
      }
    }

    // Particules seulement si excité (peut être optimisé avec instancing)
    if (aiState.mood === 'excited') {
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(100 * 3);
      for (let i = 0; i < 100 * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 5;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({ 
        color: config.colors.glow, 
        size: 0.1, 
        transparent: true, 
        opacity: 0.8 
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      group.add(particles);
      group.userData.particles = particles;
    }

    return group;
  }, [mascotType, config, equippedItems, aiState.personality, aiState.relationship, aiState.energy, aiState.attention, aiState.mood]); // OPTIMIZED: Moins de dépendances

  // OPTIMIZED: Animation séparée - ne recrée pas les géométries
  const updateMascotAnimation = useCallback((time: number) => {
    if (!mascotGroupRef.current) return;
    const mascot = mascotGroupRef.current;
    
    // Update breathing phase
    const newBreathingPhase = time * 0.002;
    setBreathingPhase(newBreathingPhase);
    
    // Update body breathing (scale)
    if (mascot.userData.body) {
      const bodyScale = 1 + (aiState.energy / 500);
      mascot.userData.body.scale.set(
        bodyScale, 
        bodyScale * (1 + Math.sin(newBreathingPhase) * 0.05), 
        bodyScale
      );
    }
    
    // Update eye tracking
    if (Math.random() < 0.01) {
      const newEyeTracking = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
      setEyeTracking(newEyeTracking);
      
      if (mascot.userData.leftEye && mascot.userData.rightEye) {
        mascot.userData.leftEye.position.set(-0.2 + newEyeTracking.x * 0.1, 1.6 + newEyeTracking.y * 0.1, 0.5);
        mascot.userData.rightEye.position.set(0.2 + newEyeTracking.x * 0.1, 1.6 + newEyeTracking.y * 0.1, 0.5);
      }
    } else if (mascot.userData.leftEye && mascot.userData.rightEye) {
      // Apply current eye tracking
      mascot.userData.leftEye.position.set(-0.2 + eyeTracking.x * 0.1, 1.6 + eyeTracking.y * 0.1, 0.5);
      mascot.userData.rightEye.position.set(0.2 + eyeTracking.x * 0.1, 1.6 + eyeTracking.y * 0.1, 0.5);
    }

    // Update mascot position/rotation based on mood
    switch (aiState.mood) {
      case 'excited':
        mascot.position.y = Math.sin(time * 0.01) * 0.3 + 0.2;
        mascot.rotation.z = Math.sin(time * 0.008) * 0.1;
        break;
      default:
        mascot.position.y = Math.sin(time * 0.004) * 0.15;
        mascot.rotation.y = Math.sin(time * 0.002) * 0.05;
    }
    
    // Animate wings if dragon/fairy
    if (mascot.userData.wings) {
      const wingAnimation = Math.sin(time * 0.005) * 0.1;
      if (mascot.userData.wings.userData.leftWing) {
        mascot.userData.wings.userData.leftWing.rotation.y = -0.4 + wingAnimation;
      }
      if (mascot.userData.wings.userData.rightWing) {
        mascot.userData.wings.userData.rightWing.rotation.y = 0.4 - wingAnimation;
      }
    }
    
    // Animate tail if dragon/cat
    if (mascot.userData.tail) {
      const tailSway = Math.sin(time * 0.003) * 0.2;
      mascot.userData.tail.rotation.z = tailSway;
    }
  }, [aiState.mood, aiState.energy, eyeTracking]);

  const handleInteraction = useCallback(() => {
    setIsThinking(true);
    const thinkingTime = (1 - aiState.personality.intelligence) * 1000 + 500;

    setTimeout(() => {
      setCurrentDialogue(generateDialogue());
      setIsThinking(false);
      setAiState(prev => ({ ...prev, relationship: Math.min(100, prev.relationship + 1) }));
      onMascotInteraction('click');
      onEmotionalStateChange(aiState);
    }, thinkingTime);
  }, [aiState, generateDialogue, onMascotInteraction, onEmotionalStateChange]);

  // OPTIMIZED: useEffect avec cleanup complet
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 4;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: "high-performance" 
    });
    renderer.setSize(200, 200);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(ambientLight, directionalLight);

    const mascot = createMascotModel();
    scene.add(mascot);
    mascotGroupRef.current = mascot;
    previousMascotRef.current = mascot;

    mountRef.current.appendChild(renderer.domElement);

    const animate = (time: number) => {
      updateMascotAnimation(time);
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate(0);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // OPTIMIZED: Cleanup complet
      disposeMascot(previousMascotRef.current);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      scene.clear();
    };
  }, [createMascotModel, updateMascotAnimation, disposeMascot]);

  // Recreate mascot only when type/config/equippedItems change
  useEffect(() => {
    if (!sceneRef.current || !mascotGroupRef.current) return;
    
    // Dispose old mascot
    disposeMascot(previousMascotRef.current);
    sceneRef.current.remove(mascotGroupRef.current);
    
    // Create new mascot
    const newMascot = createMascotModel();
    sceneRef.current.add(newMascot);
    mascotGroupRef.current = newMascot;
    previousMascotRef.current = newMascot;
  }, [mascotType, config, equippedItems, createMascotModel, disposeMascot]);

  useEffect(() => {
    const interval = setInterval(calculateMoodShift, 5000);
    return () => clearInterval(interval);
  }, [calculateMoodShift]);

  const moodColor = useMemo(() => {
    switch (aiState.mood) {
      case 'excited': return 'bg-yellow-400 animate-pulse';
      case 'happy': return 'bg-green-400';
      case 'encouraging': return 'bg-blue-400';
      default: return 'bg-pink-400';
    }
  }, [aiState.mood]);

  return (
    <div className="relative w-52 h-52">
      <div ref={mountRef} className="w-full h-full cursor-pointer" onClick={handleInteraction} />

      <div className="absolute -top-2 -right-2 space-y-1">
        <div className={`w-4 h-4 rounded-full ${moodColor}`} />
        <div className="w-4 h-8 bg-gray-200 rounded-full overflow-hidden">
          <div className="bg-gradient-to-t from-red-400 to-green-400" style={{ height: `${aiState.energy}%` }} />
        </div>
      </div>

      <AnimatePresence>
        {currentDialogue && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="bg-purple-600 text-white p-3 rounded-lg shadow-lg text-center text-sm">
              <p>{currentDialogue}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MascotSystem;


