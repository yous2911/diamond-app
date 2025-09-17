import React, { useRef, useCallback, useEffect, useState, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// ✨ AAA QUALITY PARTICLE ENGINE WITH ADVANCED PHYSICS
// =============================================================================

interface AdvancedParticle {
  id: string;
  x: number;
  y: number;
  z: number; // 3D depth
  vx: number;
  vy: number;
  vz: number;
  ax: number; // acceleration
  ay: number;
  size: number;
  targetSize: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
  type: ParticleType;
  trail: { x: number; y: number; alpha: number }[];
  physics: {
    mass: number;
    drag: number;
    bounce: number;
    gravity: number;
  };
  glow: {
    intensity: number;
    radius: number;
    pulsing: boolean;
  };
}

type ParticleType = 
  | 'sparkle' 
  | 'crystal' 
  | 'energy' 
  | 'magic_dust' 
  | 'flame'
  | 'ice'
  | 'lightning'
  | 'rainbow'
  | 'diamond'
  | 'heart'
  | 'star_burst'
  | 'plasma';

interface ParticleEngineProps {
  isActive: boolean;
  intensity: 'low' | 'medium' | 'high' | 'epic' | 'legendary';
  type: 'success' | 'levelup' | 'magic' | 'celebration' | 'ambient' | 'interactive';
  position?: { x: number; y: number };
  follow?: boolean; // Follow mouse cursor
  interactive?: boolean; // React to mouse proximity
  className?: string;
}

const AdvancedParticleEngineAAA = memo<ParticleEngineProps>(({ 
  isActive, 
  intensity, 
  type, 
  position = { x: 50, y: 50 },
  follow = false,
  interactive = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<AdvancedParticle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastFrameTimeRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Memoized AAA Color Palettes with HDR-like gradients
  const colorPalettes = useMemo(() => ({
    success: {
      primary: ['#10b981', '#34d399', '#6ee7b7', '#86efac'],
      secondary: ['#047857', '#065f46', '#064e3b'],
      glow: ['#d1fae5', '#a7f3d0', '#6ee7b7']
    },
    levelup: {
      primary: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
      secondary: ['#7c3aed', '#6d28d9', '#5b21b6'],
      glow: ['#f3e8ff', '#e9d5ff', '#d8b4fe']
    },
    magic: {
      primary: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
      secondary: ['#1e40af', '#1d4ed8', '#2563eb'],
      glow: ['#dbeafe', '#bfdbfe', '#93c5fd']
    },
    celebration: {
      primary: ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a'],
      secondary: ['#d97706', '#b45309', '#92400e'],
      glow: ['#fef3c7', '#fef3c7', '#fde68a']
    },
    ambient: {
      primary: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc'],
      secondary: ['#4338ca', '#7c3aed', '#9333ea'],
      glow: ['#e0e7ff', '#ddd6fe', '#c4b5fd']
    },
    interactive: {
      primary: ['#ec4899', '#f472b6', '#f9a8d4', '#fbb6ce'],
      secondary: ['#be185d', '#9d174d', '#831843'],
      glow: ['#fce7f3', '#fbcfe8', '#f9a8d4']
    }
  }), []);

  // Advanced particle configurations
  const particleConfigs = {
    low: { count: 15, spawnRate: 0.3, size: [2, 4], speed: [1, 3] },
    medium: { count: 35, spawnRate: 0.5, size: [3, 6], speed: [2, 5] },
    high: { count: 60, spawnRate: 0.7, size: [4, 8], speed: [3, 7] },
    epic: { count: 100, spawnRate: 1.0, size: [5, 12], speed: [4, 9] },
    legendary: { count: 150, spawnRate: 1.5, size: [6, 15], speed: [5, 12] }
  };

  // Create particle with advanced physics
  const createAdvancedParticle = useCallback((x: number, y: number, particleType?: ParticleType): AdvancedParticle => {
    const config = particleConfigs[intensity];
    const palette = colorPalettes[type];
    const types: ParticleType[] = ['sparkle', 'crystal', 'energy', 'magic_dust', 'diamond'];
    
    const selectedType = particleType || types[Math.floor(Math.random() * types.length)];
    const color = palette.primary[Math.floor(Math.random() * palette.primary.length)];
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      z: Math.random() * 100, // 3D depth
      vx: (Math.random() - 0.5) * config.speed[1],
      vy: (Math.random() - 0.5) * config.speed[1] - 2,
      vz: (Math.random() - 0.5) * 2,
      ax: 0,
      ay: 0.1, // gravity
      size: Math.random() * (config.size[1] - config.size[0]) + config.size[0],
      targetSize: Math.random() * (config.size[1] - config.size[0]) + config.size[0],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      color,
      life: 1.0,
      maxLife: Math.random() * 3 + 2,
      alpha: 1.0,
      type: selectedType,
      trail: [],
      physics: {
        mass: Math.random() * 2 + 0.5,
        drag: 0.98,
        bounce: 0.7,
        gravity: selectedType === 'flame' ? -0.1 : 0.1
      },
      glow: {
        intensity: Math.random() * 0.8 + 0.2,
        radius: Math.random() * 10 + 5,
        pulsing: Math.random() > 0.5
      }
    };
  }, [intensity, type]);

  // Advanced physics simulation
  const updateParticle = useCallback((particle: AdvancedParticle, deltaTime: number, mouse: {x: number, y: number}) => {
    // Advanced physics
    particle.vx += particle.ax * deltaTime;
    particle.vy += particle.ay * deltaTime;
    particle.vz += (Math.random() - 0.5) * 0.1; // 3D movement
    
    // Interactive forces
    if (interactive) {
      const dx = mouse.x - particle.x;
      const dy = mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 150) {
        const force = (150 - distance) / 150 * 0.5;
        const angle = Math.atan2(dy, dx);
        particle.vx -= Math.cos(angle) * force;
        particle.vy -= Math.sin(angle) * force;
      }
    }
    
    // Apply drag
    particle.vx *= particle.physics.drag;
    particle.vy *= particle.physics.drag;
    particle.vz *= particle.physics.drag;
    
    // Update position
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
    particle.z += particle.vz * deltaTime;
    
    // Update rotation
    particle.rotation += particle.rotationSpeed * deltaTime;
    
    // Size interpolation
    particle.size += (particle.targetSize - particle.size) * 0.05;
    
    // Trail system
    if (particle.trail.length > 10) {
      particle.trail.shift();
    }
    particle.trail.push({ 
      x: particle.x, 
      y: particle.y, 
      alpha: particle.alpha * 0.5 
    });
    
    // Life and alpha decay
    particle.life -= deltaTime / particle.maxLife;
    particle.alpha = Math.max(0, particle.life);
    
    // Glow pulsing
    if (particle.glow.pulsing) {
      particle.glow.intensity = 0.3 + Math.sin(Date.now() * 0.01) * 0.3;
    }
    
    // Boundary checking with bounce
    if (particle.x < 0 || particle.x > dimensions.width) {
      particle.vx *= -particle.physics.bounce;
      particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
    }
    
    if (particle.y < 0 || particle.y > dimensions.height) {
      particle.vy *= -particle.physics.bounce;
      particle.y = Math.max(0, Math.min(dimensions.height, particle.y));
    }
  }, [interactive, dimensions]);

  // Advanced rendering with HDR-like effects
  const renderParticle = useCallback((ctx: CanvasRenderingContext2D, particle: AdvancedParticle) => {
    const { x, y, z, size, rotation, color, alpha, glow } = particle;
    
    // 3D perspective scaling
    const scale = 1 + z / 200;
    const scaledSize = size * scale;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Glow effect
    if (glow.intensity > 0) {
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glow.radius * scale);
      gradient.addColorStop(0, `${color}${Math.floor(glow.intensity * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${color}00`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(-glow.radius * scale, -glow.radius * scale, glow.radius * 2 * scale, glow.radius * 2 * scale);
    }
    
    // Particle body based on type
    switch (particle.type) {
      case 'crystal':
        // Crystal shape
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const px = Math.cos(angle) * scaledSize;
          const py = Math.sin(angle) * scaledSize;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'diamond':
        // Diamond shape
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -scaledSize);
        ctx.lineTo(scaledSize * 0.7, 0);
        ctx.lineTo(0, scaledSize);
        ctx.lineTo(-scaledSize * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'energy':
        // Energy orb with pulsing
        const energyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, scaledSize);
        energyGradient.addColorStop(0, `${color}FF`);
        energyGradient.addColorStop(0.7, `${color}80`);
        energyGradient.addColorStop(1, `${color}00`);
        
        ctx.fillStyle = energyGradient;
        ctx.beginPath();
        ctx.arc(0, 0, scaledSize, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case 'star_burst':
        // Star burst
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * scaledSize, Math.sin(angle) * scaledSize);
          ctx.stroke();
        }
        break;
        
      default:
        // Default sparkle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, scaledSize, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Trail rendering
    if (particle.trail.length > 1) {
      ctx.strokeStyle = `${color}40`;
      ctx.lineWidth = scaledSize * 0.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      
      for (let i = 0; i < particle.trail.length - 1; i++) {
        const current = particle.trail[i];
        const next = particle.trail[i + 1];
        
        if (i === 0) {
          ctx.moveTo(current.x - x, current.y - y);
        }
        ctx.lineTo(next.x - x, next.y - y);
      }
      
      ctx.stroke();
    }
    
    ctx.restore();
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Main animation loop
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const config = particleConfigs[intensity];
    
    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      setDimensions({ width: rect.width, height: rect.height });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    let lastTime = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Clear canvas with slight trail effect for smoother animation
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Spawn new particles
      if (particlesRef.current.length < config.count && Math.random() < config.spawnRate * deltaTime) {
        const spawnX = follow ? mouseRef.current.x : (position.x / 100) * canvas.width;
        const spawnY = follow ? mouseRef.current.y : (position.y / 100) * canvas.height;
        
        particlesRef.current.push(createAdvancedParticle(
          spawnX + (Math.random() - 0.5) * 50,
          spawnY + (Math.random() - 0.5) * 50
        ));
      }
      
      // Update and render particles
      particlesRef.current = particlesRef.current.filter(particle => {
        updateParticle(particle, deltaTime, mouseRef.current);
        
        if (particle.life > 0) {
          renderParticle(ctx, particle);
          return true;
        }
        return false;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', updateSize);
      particlesRef.current = [];
    };
  }, [isActive, intensity, type, position, follow, createAdvancedParticle, updateParticle, renderParticle]);

  if (!isActive) return null;

  return (
    <motion.div
      className={`fixed inset-0 pointer-events-none z-40 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          mixBlendMode: type === 'ambient' ? 'screen' : 'normal'
        }}
      />
    </motion.div>
  );
});

AdvancedParticleEngineAAA.displayName = 'AdvancedParticleEngineAAA';

export default AdvancedParticleEngineAAA;


