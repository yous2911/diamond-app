import React, { useRef, useEffect, useCallback } from 'react';

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
  type: 'glitch' | 'cyber' | 'neon' | 'matrix' | 'hacker';
  physics: {
    gravity: number;
    friction: number;
    elasticity: number;
  };
  behavior: 'normal' | 'spiral' | 'orbit' | 'explosion' | 'attract' | 'repel' | 'glitch';
  trail: Array<{ x: number; y: number; alpha: number }>;
}

interface GlitchParticleEngineProps {
  width?: number;
  height?: number;
  particleCount?: number;
  particleType: 'glitch' | 'cyber' | 'neon' | 'matrix' | 'hacker';
  behavior?: 'normal' | 'spiral' | 'orbit' | 'explosion' | 'attract' | 'repel' | 'glitch';
  intensity: 0 | 1 | 2 | 3 | 4 | 5;
  isActive: boolean;
  emitterPosition?: { x: number; y: number };
  attractorPosition?: { x: number; y: number };
  enablePhysics?: boolean;
  enableTrails?: boolean;
  enableCollisions?: boolean;
  windForce?: { x: number; y: number };
  className?: string;
}

const GlitchParticleEngine: React.FC<GlitchParticleEngineProps> = ({
  width = 800,
  height = 600,
  particleCount = 100,
  particleType,
  behavior = 'normal',
  intensity,
  isActive,
  emitterPosition = { x: 400, y: 300 },
  attractorPosition,
  enablePhysics = true,
  enableTrails = true,
  enableCollisions = false,
  windForce = { x: 0, y: 0 },
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  const lastTimeRef = useRef<number>(0);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Cyberpunk Intensity configurations
  const intensityConfig = {
    0: { // BLACKOUT - Minimal particles
      maxParticles: Math.min(20, particleCount),
      spawnRate: 1,
      lifespan: 40,
      size: { min: 1, max: 3 }
    },
    1: { // HARD - Low particles
      maxParticles: Math.min(50, particleCount),
      spawnRate: 2,
      lifespan: 60,
      size: { min: 2, max: 4 }
    },
    2: { // DIFFICULT - Moderate particles
      maxParticles: Math.min(100, particleCount),
      spawnRate: 4,
      lifespan: 80,
      size: { min: 2, max: 5 }
    },
    3: { // GOOD - Balanced particles
      maxParticles: Math.min(150, particleCount),
      spawnRate: 5,
      lifespan: 90,
      size: { min: 3, max: 6 }
    },
    4: { // EASY - High particles
      maxParticles: Math.min(300, particleCount),
      spawnRate: 8,
      lifespan: 120,
      size: { min: 4, max: 8 }
    },
    5: { // PERFECT - Maximum particles
      maxParticles: Math.min(500, particleCount),
      spawnRate: 12,
      lifespan: 180,
      size: { min: 5, max: 12 }
    }
  };

  const config = intensityConfig[intensity];

  // Particle configuration interface
  interface ParticleConfig {
    colors: Array<{ r: number; g: number; b: number; a: number }>;
    physics: { gravity: number; friction: number; elasticity: number };
    behavior: 'normal' | 'spiral' | 'orbit' | 'explosion' | 'attract' | 'repel' | 'glitch';
    glow: boolean;
  }

  // Cyberpunk particle type configurations
  const getParticleConfig = useCallback((type: string): ParticleConfig => {
    switch (type) {
      case 'glitch':
        return {
          colors: [
            { r: 0, g: 255, b: 255, a: 1 }, // Cyan
            { r: 255, g: 0, b: 255, a: 1 }, // Magenta
            { r: 255, g: 255, b: 0, a: 1 }, // Yellow
          ],
          physics: { gravity: 0, friction: 0.9, elasticity: 1 },
          behavior: 'glitch' as const,
          glow: true
        };
      case 'cyber':
        return {
          colors: [
            { r: 0, g: 255, b: 127, a: 1 }, // Cyber Green
            { r: 0, g: 191, b: 255, a: 1 }, // Cyber Blue
            { r: 255, g: 0, b: 127, a: 1 }, // Cyber Pink
          ],
          physics: { gravity: 0, friction: 0.95, elasticity: 0.8 },
          behavior: 'spiral' as const,
          glow: true
        };
      case 'neon':
        return {
          colors: [
            { r: 255, g: 0, b: 255, a: 1 }, // Neon Magenta
            { r: 0, g: 255, b: 255, a: 1 }, // Neon Cyan
            { r: 255, g: 255, b: 0, a: 1 }, // Neon Yellow
          ],
          physics: { gravity: 0, friction: 0.98, elasticity: 0.9 },
          behavior: 'orbit' as const,
          glow: true
        };
      case 'matrix':
        return {
          colors: [
            { r: 0, g: 255, b: 0, a: 1 }, // Matrix Green
            { r: 0, g: 200, b: 0, a: 0.8 }, // Darker Green
            { r: 0, g: 150, b: 0, a: 0.6 }, // Even Darker Green
          ],
          physics: { gravity: 2, friction: 0.99, elasticity: 0.1 },
          behavior: 'normal' as const,
          glow: true
        };
      case 'hacker':
        return {
          colors: [
            { r: 255, g: 255, b: 255, a: 1 }, // White
            { r: 0, g: 255, b: 0, a: 1 }, // Green
            { r: 255, g: 0, b: 0, a: 1 }, // Red
          ],
          physics: { gravity: 0, friction: 0.97, elasticity: 0.7 },
          behavior: 'explosion' as const,
          glow: true
        };
      default:
        return getParticleConfig('glitch');
    }
  }, []);

  // Create particle with cyberpunk properties
  const createParticle = useCallback((x: number, y: number): Particle => {
    const particleConfig = getParticleConfig(particleType);
    const color = particleConfig.colors[Math.floor(Math.random() * particleConfig.colors.length)];
    
    // Advanced velocity calculation based on behavior
    let vx, vy, vz;
    
    switch (behavior) {
      case 'explosion':
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 10 + 5;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        vz = (Math.random() - 0.5) * 2;
        break;
      case 'spiral':
        const spiralAngle = Math.random() * Math.PI * 2;
        vx = Math.cos(spiralAngle) * 3;
        vy = Math.sin(spiralAngle) * 3;
        vz = (Math.random() - 0.5) * 2;
        break;
      case 'glitch':
        vx = (Math.random() - 0.5) * 8;
        vy = (Math.random() - 0.5) * 8;
        vz = (Math.random() - 0.5) * 4;
        break;
      default:
        vx = (Math.random() - 0.5) * 4;
        vy = (Math.random() - 0.5) * 4;
        vz = (Math.random() - 0.5) * 2;
    }

    return {
      id: Date.now() + Math.random(),
      x,
      y,
      z: 0,
      vx,
      vy,
      vz,
      mass: Math.random() * 2 + 0.5,
      size: Math.random() * (config.size.max - config.size.min) + config.size.min,
      life: 0,
      maxLife: config.lifespan + Math.random() * 60,
      color,
      type: particleType,
      physics: particleConfig.physics,
      behavior,
      trail: enableTrails ? [] : []
    };
  }, [particleType, behavior, config, enableTrails, getParticleConfig]);

  // Advanced physics simulation with glitch effects
  const updateParticlePhysics = useCallback((particle: Particle, deltaTime: number) => {
    if (!enablePhysics) return;

    // Apply gravity
    particle.vy += particle.physics.gravity * deltaTime * 0.1;

    // Apply wind force
    particle.vx += windForce.x * deltaTime * 0.01;
    particle.vy += windForce.y * deltaTime * 0.01;

    // Behavior-specific forces
    switch (particle.behavior) {
      case 'spiral':
        const spiralForce = particle.life * 0.01;
        particle.vx += Math.cos(particle.life * 0.1) * spiralForce;
        particle.vy += Math.sin(particle.life * 0.1) * spiralForce;
        break;
        
      case 'orbit':
        if (attractorPosition) {
          const dx = attractorPosition.x - particle.x;
          const dy = attractorPosition.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const force = 100 / (distance * distance + 1);
          particle.vx += (dx / distance) * force * deltaTime * 0.01;
          particle.vy += (dy / distance) * force * deltaTime * 0.01;
        }
        break;
        
      case 'glitch':
        // Random glitch forces
        if (Math.random() > 0.95) {
          particle.vx += (Math.random() - 0.5) * 20;
          particle.vy += (Math.random() - 0.5) * 20;
        }
        break;
        
      case 'attract':
        const mouseDistance = Math.sqrt(
          Math.pow(mousePositionRef.current.x - particle.x, 2) + 
          Math.pow(mousePositionRef.current.y - particle.y, 2)
        );
        if (mouseDistance < 100) {
          const attractForce = (100 - mouseDistance) * 0.001;
          const angle = Math.atan2(
            mousePositionRef.current.y - particle.y,
            mousePositionRef.current.x - particle.x
          );
          particle.vx += Math.cos(angle) * attractForce;
          particle.vy += Math.sin(angle) * attractForce;
        }
        break;
        
      case 'repel':
        const repelDistance = Math.sqrt(
          Math.pow(mousePositionRef.current.x - particle.x, 2) + 
          Math.pow(mousePositionRef.current.y - particle.y, 2)
        );
        if (repelDistance < 150) {
          const repelForce = (150 - repelDistance) * 0.002;
          const angle = Math.atan2(
            particle.y - mousePositionRef.current.y,
            particle.x - mousePositionRef.current.x
          );
          particle.vx += Math.cos(angle) * repelForce;
          particle.vy += Math.sin(angle) * repelForce;
        }
        break;
    }

    // Apply friction
    particle.vx *= particle.physics.friction;
    particle.vy *= particle.physics.friction;
    particle.vz *= particle.physics.friction;

    // Update position
    particle.x += particle.vx * deltaTime * 0.1;
    particle.y += particle.vy * deltaTime * 0.1;
    particle.z += particle.vz * deltaTime * 0.1;

    // Boundary collisions with elasticity
    if (enableCollisions) {
      if (particle.x <= particle.size || particle.x >= width - particle.size) {
        particle.vx *= -particle.physics.elasticity;
        particle.x = Math.max(particle.size, Math.min(width - particle.size, particle.x));
      }
      if (particle.y <= particle.size || particle.y >= height - particle.size) {
        particle.vy *= -particle.physics.elasticity;
        particle.y = Math.max(particle.size, Math.min(height - particle.size, particle.y));
      }
    }

    // Update trail
    if (enableTrails && particle.trail) {
      particle.trail.push({
        x: particle.x,
        y: particle.y,
        alpha: 1
      });
      
      // Fade and limit trail length
      particle.trail = particle.trail
        .map((point, index) => ({
          ...point,
          alpha: point.alpha * 0.95
        }))
        .filter(point => point.alpha > 0.1)
        .slice(-20);
    }

    // Age particle
    particle.life += deltaTime;
  }, [enablePhysics, windForce, attractorPosition, enableCollisions, enableTrails, width, height]);

  // Cyberpunk rendering with glitch effects
  const renderParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, width, height);
    
    // Sort particles by depth for proper 3D rendering
    const sortedParticles = [...particlesRef.current].sort((a, b) => a.z - b.z);
    
    sortedParticles.forEach(particle => {
      const alpha = 1 - (particle.life / particle.maxLife);
      const size = Math.max(particle.size * (1 + particle.z * 0.1), 0.5);
      
      ctx.save();
      
      // 3D positioning
      const screenX = particle.x + particle.z * 0.1;
      const screenY = particle.y + particle.z * 0.05;
      
      // Render trail first
      if (enableTrails && particle.trail && particle.trail.length > 1 && size > 0) {
        ctx.strokeStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.3})`;
        ctx.lineWidth = Math.max(size * 0.5, 0.5);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
        
        for (let i = 1; i < particle.trail.length; i++) {
          const trailAlpha = particle.trail[i].alpha * alpha * 0.3;
          ctx.globalAlpha = trailAlpha;
          ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
        }
        ctx.stroke();
      }
      
      ctx.globalAlpha = alpha;
      
      // Glow effect for cyberpunk particles
      const particleConfig = getParticleConfig(particle.type);
      if (particleConfig.glow && size > 0) {
        const glowRadius = Math.max(size * 3, 2); // Larger glow for cyberpunk
        const gradient = ctx.createRadialGradient(
          screenX, screenY, 0,
          screenX, screenY, glowRadius
        );
        gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`);
        gradient.addColorStop(0.3, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.7})`);
        gradient.addColorStop(0.7, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Main particle body with cyberpunk shapes
      switch (particle.type) {
        case 'glitch':
          // Glitchy rectangle with corruption
          ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.fillRect(screenX - size / 2, screenY - size / 2, size, size);
          if (Math.random() > 0.9) {
            ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, ${alpha * 0.5})`;
            ctx.fillRect(screenX - size / 2 + (Math.random() - 0.5) * 10, screenY - size / 2 + (Math.random() - 0.5) * 10, size, size);
          }
          break;
          
        case 'cyber':
          // Cyber hexagon
          ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.translate(screenX, screenY);
          ctx.rotate(particle.life * 0.05);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (i * 2 * Math.PI) / 6;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'neon':
          // Neon circle with pulse
          const pulseSize = size * (1 + Math.sin(particle.life * 0.1) * 0.3);
          ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'matrix':
          // Matrix-style character
          ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.font = `${size}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const chars = ['0', '1', 'A', 'B', 'C', 'D', 'E', 'F'];
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], screenX, screenY);
          break;
          
        case 'hacker':
          // Hacker terminal cursor
          ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.fillRect(screenX - size / 4, screenY - size / 2, size / 2, size);
          if (Math.random() > 0.5) {
            ctx.fillRect(screenX + size / 4, screenY - size / 2, size / 2, size);
          }
          break;
          
        default:
          // Default circle
          ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
          ctx.fill();
      }
      
      ctx.restore();
    });
  }, [width, height, enableTrails, getParticleConfig]);

  // Main animation loop
  const animate = useCallback((currentTime: number) => {
    if (!isActive) return;
    
    const deltaTime = currentTime - lastTimeRef.current;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Spawn new particles
    if (particlesRef.current.length < config.maxParticles) {
      for (let i = 0; i < config.spawnRate; i++) {
        const x = emitterPosition.x + (Math.random() - 0.5) * 20;
        const y = emitterPosition.y + (Math.random() - 0.5) * 20;
        particlesRef.current.push(createParticle(x, y));
      }
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(particle => {
      updateParticlePhysics(particle, deltaTime);
      return particle.life < particle.maxLife && 
             particle.x > -50 && particle.x < width + 50 &&
             particle.y > -50 && particle.y < height + 50;
    });

    // Render
    renderParticles(ctx);
    
    lastTimeRef.current = currentTime;
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isActive, config, emitterPosition, createParticle, updateParticlePhysics, renderParticles, height, width]);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mousePositionRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, []);

  // Initialize and cleanup
  useEffect(() => {
    if (isActive) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particlesRef.current = [];
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, animate]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pointer-events-auto ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        imageRendering: 'crisp-edges',
        background: 'transparent'
      }}
    />
  );
};

export default GlitchParticleEngine;
