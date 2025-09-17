import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { WARDROBE_ITEMS, createItemMesh } from './WardrobeData';

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
interface MascotAIState {
  mood: 'happy' | 'excited' | 'focused' | 'tired' | 'curious' | 'proud' | 'encouraging';
  energy: number; // 0-100
  attention: number; // 0-100
  relationship: number; // 0-100 (bond with student)
  personality: {
    extroversion: number;
    patience: number;
    playfulness: number;
    intelligence: number;
  };
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

// --- UNIFIED MASCOT COMPONENT ---
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

  const [aiState, setAiState] = useState<MascotAIState>({
    mood: 'happy',
    energy: 80,
    attention: 90,
    relationship: 50,
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

  const mascotConfig = useMemo(() => ({
    dragon: { primaryColor: 0x8A2BE2, secondaryColor: 0x4F46E5, eyes: 0xFFD700 },
    fairy: { primaryColor: 0xEC4899, secondaryColor: 0x10B981, eyes: 0x87CEEB },
    robot: { primaryColor: 0x6B7280, secondaryColor: 0x3B82F6, eyes: 0x00FFFF },
    cat: { primaryColor: 0xF59E0B, secondaryColor: 0xFFFBEB, eyes: 0x22C55E },
    owl: { primaryColor: 0x8B4513, secondaryColor: 0xDEB887, eyes: 0xFFD700 }
  }), []);

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

    let dialogue = lang[mood] || lang.default;

    if (recentPerformance === 'struggling' && relationship > 70) {
      dialogue = lang.struggling_support;
    }

    dialogue = dialogue.replace('{level}', studentData.level.toString()).replace('{streak}', studentData.currentStreak.toString());

    if (energy < 30) {
      dialogue = dialogue.replace('!', '.').toLowerCase();
    }

    return dialogue;
  }, [aiState, studentData, locale]);

  const createMascotModel = useCallback(() => {
    const group = new THREE.Group();
    const config = mascotConfig[mascotType];

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

    const eyeMaterial = new THREE.MeshPhongMaterial({ color: config.eyes, emissive: config.eyes, emissiveIntensity: aiState.attention / 200 });
    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(eyeSize, 16, 16), eyeMaterial);
    leftEye.position.set(-0.2 + eyeTracking.x * 0.1, 1.6 + eyeTracking.y * 0.1, 0.5);
    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(eyeSize, 16, 16), eyeMaterial);
    rightEye.position.set(0.2 + eyeTracking.x * 0.1, 1.6 + eyeTracking.y * 0.1, 0.5);
    group.add(leftEye, rightEye);

    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 24), headMaterial.clone());
    body.scale.set(bodyScale, bodyScale * (1 + Math.sin(breathingPhase) * 0.05), bodyScale);
    body.castShadow = true;
    group.add(body);

    // Type-specific features
    switch (mascotType) {
      case 'dragon': {
        const wingGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
        const wingMat = new THREE.MeshPhongMaterial({ color: config.secondaryColor, transparent: true, opacity: 0.8 });
        const leftWing = new THREE.Mesh(wingGeo, wingMat);
        leftWing.position.set(-1.2, 0.5, -0.2);
        leftWing.rotation.z = Math.PI / 4;
        const rightWing = leftWing.clone();
        rightWing.position.x *= -1;
        rightWing.rotation.z *= -1;
        group.add(leftWing, rightWing);
        break;
      }
      case 'cat': {
        const earGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
        const earMat = new THREE.MeshPhongMaterial({ color: config.primaryColor });
        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-0.3, 2.0, 0);
        const rightEar = leftEar.clone();
        rightEar.position.x *= -1;
        group.add(leftEar, rightEar);
        break;
      }
    }

    if (aiState.mood === 'excited') {
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(100 * 3);
      for (let i = 0; i < 100 * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 5;
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particleMaterial = new THREE.PointsMaterial({ color: 0xFFD700, size: 0.1, transparent: true, opacity: 0.8 });
      group.add(new THREE.Points(particleGeometry, particleMaterial));
    }

    return group;
  }, [aiState, eyeTracking, breathingPhase, mascotType, mascotConfig, equippedItems]);

  const updateMascotAnimation = useCallback((time: number) => {
    if (!mascotGroupRef.current) return;
    const mascot = mascotGroupRef.current;
    setBreathingPhase(time * 0.002);

    switch (aiState.mood) {
      case 'excited':
        mascot.position.y = Math.sin(time * 0.01) * 0.3 + 0.2;
        mascot.rotation.z = Math.sin(time * 0.008) * 0.1;
        break;
      default:
        mascot.position.y = Math.sin(time * 0.004) * 0.15;
        mascot.rotation.y = Math.sin(time * 0.002) * 0.05;
    }
    if (Math.random() < 0.01) {
      setEyeTracking({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 });
    }
  }, [aiState]);

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

  useEffect(() => {
    if (!mountRef.current || process.env.NODE_ENV === 'test') return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 4;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
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

    mountRef.current.appendChild(renderer.domElement);

    const animate = (time: number) => {
      updateMascotAnimation(time);
      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate(0);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mountRef.current && renderer.domElement) mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [createMascotModel, updateMascotAnimation]);

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
