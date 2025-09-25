import React, { useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mass: number;
  size: number;
  life: number;
  maxLife: number;
  color: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  type: 'fire' | 'water' | 'magic' | 'crystal' | 'lightning' | 'smoke' | 'sparkle' | 'heart' | 'star';
  physics: {
    gravity: number;
    friction: number;
    elasticity: number;
  };
  behavior: 'normal' | 'spiral' | 'orbit' | 'explosion' | 'attract' | 'repel';
  trail: Array<{ x: number; y: number; alpha: number }>;
}

interface AdvancedParticleEngineMobileProps {
  width?: number;
  height?: number;
  particleCount?: number;
  particleType: 'fire' | 'water' | 'magic' | 'crystal' | 'lightning' | 'smoke' | 'sparkle' | 'heart' | 'star';
  behavior?: 'normal' | 'spiral' | 'orbit' | 'explosion' | 'attract' | 'repel';
  intensity: 0 | 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  emitterPosition?: { x: number; y: number };
  attractorPosition?: { x: number; y: number };
  enablePhysics?: boolean;
  enableTrails?: boolean;
  enableCollisions?: boolean;
  windForce?: { x: number; y: number };
  style?: any;
}

const AdvancedParticleEngineMobile: React.FC<AdvancedParticleEngineMobileProps> = ({
  width = screenWidth,
  height = screenHeight,
  particleCount = 50,
  particleType = 'sparkle',
  behavior = 'normal',
  intensity = 3,
  isActive = true,
  emitterPosition = { x: width / 2, y: height / 2 },
  attractorPosition = { x: width / 2, y: height / 2 },
  enablePhysics = true,
  enableTrails = true,
  enableCollisions = false,
  windForce = { x: 0, y: 0 },
  style,
}) => {
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const particleIdCounter = useRef<number>(0);

  // Particle type configurations
  const particleConfigs = {
    sparkle: {
      colors: [
        { r: 255, g: 215, b: 0, a: 1 }, // Gold
        { r: 255, g: 255, b: 255, a: 1 }, // White
        { r: 255, g: 192, b: 203, a: 1 }, // Pink
      ],
      size: { min: 2, max: 8 },
      life: { min: 1000, max: 3000 },
      physics: { gravity: 0.1, friction: 0.98, elasticity: 0.8 },
    },
    star: {
      colors: [
        { r: 255, g: 255, b: 0, a: 1 }, // Yellow
        { r: 255, g: 165, b: 0, a: 1 }, // Orange
        { r: 255, g: 20, b: 147, a: 1 }, // Deep Pink
      ],
      size: { min: 3, max: 12 },
      life: { min: 1500, max: 4000 },
      physics: { gravity: 0.05, friction: 0.99, elasticity: 0.9 },
    },
    magic: {
      colors: [
        { r: 138, g: 43, b: 226, a: 1 }, // Blue Violet
        { r: 75, g: 0, b: 130, a: 1 }, // Indigo
        { r: 148, g: 0, b: 211, a: 1 }, // Dark Violet
      ],
      size: { min: 4, max: 10 },
      life: { min: 2000, max: 5000 },
      physics: { gravity: 0.02, friction: 0.995, elasticity: 0.95 },
    },
    crystal: {
      colors: [
        { r: 0, g: 191, b: 255, a: 1 }, // Deep Sky Blue
        { r: 30, g: 144, b: 255, a: 1 }, // Dodger Blue
        { r: 135, g: 206, b: 235, a: 1 }, // Sky Blue
      ],
      size: { min: 3, max: 9 },
      life: { min: 1800, max: 4500 },
      physics: { gravity: 0.03, friction: 0.99, elasticity: 0.9 },
    },
    heart: {
      colors: [
        { r: 255, g: 105, b: 180, a: 1 }, // Hot Pink
        { r: 255, g: 20, b: 147, a: 1 }, // Deep Pink
        { r: 220, g: 20, b: 60, a: 1 }, // Crimson
      ],
      size: { min: 4, max: 11 },
      life: { min: 1200, max: 3500 },
      physics: { gravity: 0.08, friction: 0.97, elasticity: 0.85 },
    },
  };

  const config = particleConfigs[particleType] || particleConfigs.sparkle;

  // Create a new particle
  const createParticle = useCallback((): Particle => {
    const id = particleIdCounter.current++;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    const size = config.size.min + Math.random() * (config.size.max - config.size.min);
    const life = config.life.min + Math.random() * (config.life.max - config.life.min);
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];

    return {
      id,
      x: emitterPosition.x + (Math.random() - 0.5) * 20,
      y: emitterPosition.y + (Math.random() - 0.5) * 20,
      z: Math.random() * 100,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      vz: (Math.random() - 0.5) * 2,
      mass: size * 0.1,
      size,
      life,
      maxLife: life,
      color,
      type: particleType,
      physics: { ...config.physics },
      behavior,
      trail: [],
    };
  }, [emitterPosition, particleType, behavior, config]);

  // Update particle physics
  const updateParticle = useCallback((particle: Particle, deltaTime: number) => {
    if (!enablePhysics) return;

    // Apply gravity
    particle.vy += particle.physics.gravity * deltaTime * 0.1;

    // Apply wind force
    particle.vx += windForce.x * deltaTime * 0.1;
    particle.vy += windForce.y * deltaTime * 0.1;

    // Apply friction
    particle.vx *= particle.physics.friction;
    particle.vy *= particle.physics.friction;
    particle.vz *= particle.physics.friction;

    // Update position
    particle.x += particle.vx * deltaTime * 0.1;
    particle.y += particle.vy * deltaTime * 0.1;
    particle.z += particle.vz * deltaTime * 0.1;

    // Update trail
    if (enableTrails) {
      particle.trail.push({ x: particle.x, y: particle.y, alpha: 1 });
      if (particle.trail.length > 10) {
        particle.trail.shift();
      }
      // Fade trail
      particle.trail.forEach((point, index) => {
        point.alpha = (index + 1) / particle.trail.length;
      });
    }

    // Update life
    particle.life -= deltaTime;

    // Handle behavior
    switch (particle.behavior) {
      case 'spiral':
        const spiralAngle = Date.now() * 0.001 + particle.id * 0.1;
        const spiralRadius = 50 + particle.life * 0.1;
        particle.x = emitterPosition.x + Math.cos(spiralAngle) * spiralRadius;
        particle.y = emitterPosition.y + Math.sin(spiralAngle) * spiralRadius;
        break;
      case 'orbit':
        const orbitAngle = Date.now() * 0.002 + particle.id * 0.05;
        const orbitRadius = 80;
        particle.x = attractorPosition.x + Math.cos(orbitAngle) * orbitRadius;
        particle.y = attractorPosition.y + Math.sin(orbitAngle) * orbitRadius;
        break;
      case 'attract':
        const dx = attractorPosition.x - particle.x;
        const dy = attractorPosition.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          const force = 0.1 / (distance * distance);
          particle.vx += (dx / distance) * force;
          particle.vy += (dy / distance) * force;
        }
        break;
    }
  }, [enablePhysics, enableTrails, windForce, emitterPosition, attractorPosition]);

  // Animation loop
  const animate = useCallback((currentTime: number) => {
    if (!isActive) return;

    const deltaTime = currentTime - lastTimeRef.current;
    lastTimeRef.current = currentTime;

    // Add new particles based on intensity
    const particlesToAdd = Math.floor(intensity * 2);
    for (let i = 0; i < particlesToAdd; i++) {
      if (particlesRef.current.length < particleCount) {
        particlesRef.current.push(createParticle());
      }
    }

    // Update existing particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      updateParticle(particle, deltaTime);
      return particle.life > 0 && 
             particle.x > -50 && particle.x < width + 50 &&
             particle.y > -50 && particle.y < height + 50;
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [isActive, intensity, particleCount, createParticle, updateParticle, width, height]);

  // Start/stop animation
  useEffect(() => {
    if (isActive) {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, animate]);

  // Render particles
  const renderParticles = () => {
    return particlesRef.current.map((particle) => {
      const alpha = particle.life / particle.maxLife;
      const scale = 0.5 + (particle.life / particle.maxLife) * 0.5;
      
      return (
        <View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: particle.x - particle.size / 2,
              top: particle.y - particle.size / 2,
              width: particle.size * scale,
              height: particle.size * scale,
              backgroundColor: `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`,
              transform: [
                { scale },
                { rotateZ: `${particle.life * 0.1}deg` },
              ],
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { width, height }, style]} pointerEvents="none">
      {renderParticles()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default AdvancedParticleEngineMobile;


