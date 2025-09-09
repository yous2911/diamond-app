import React, { useRef, useCallback, useEffect } from 'react';

// =============================================================================
// ✨ MOTEUR DE PARTICULES DIAMANT 3D
// =============================================================================
interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'crystal' | 'star' | 'heart';
}

interface ParticleEngineProps {
  isActive: boolean;
  intensity: 'low' | 'medium' | 'high' | 'epic';
  type: 'success' | 'levelup' | 'magic';
  position?: { x: number; y: number };
}

const ParticleEngine: React.FC<ParticleEngineProps> = ({ 
  isActive, 
  intensity, 
  type, 
  position = { x: 50, y: 50 } 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  const colors = {
    success: ['#10b981', '#34d399', '#6ee7b7', '#d1fae5'],
    levelup: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ede9fe'],
    magic: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
  };

  const createParticle = useCallback((x: number, y: number): Particle => {
    const particleColors = colors[type];
    return {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8 - 3,
      size: Math.random() * 6 + 3,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      life: 0,
      maxLife: Math.random() * 80 + 40,
      type: (['sparkle', 'crystal', 'star', 'heart'] as const)[Math.floor(Math.random() * 4)]
    };
  }, [type, colors]);

  const updateParticles = useCallback(() => {
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.life++;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.15; // Gravité magique
      particle.vx *= 0.98; // Friction
      return particle.life < particle.maxLife;
    });
  }, []);

  const drawParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particlesRef.current.forEach(particle => {
      const alpha = Math.max(0, 1 - (particle.life / particle.maxLife));
      ctx.save();
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.life * 0.1);
      
      // Dessiner selon le type avec effets 3D
      switch (particle.type) {
        case 'sparkle':
          // Étoile brillante
          ctx.shadowBlur = 10;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? particle.size : particle.size * 0.4;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'crystal':
          // Cristal 3D
          ctx.shadowBlur = 8;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          ctx.moveTo(0, -particle.size);
          ctx.lineTo(particle.size * 0.7, 0);
          ctx.lineTo(0, particle.size);
          ctx.lineTo(-particle.size * 0.7, 0);
          ctx.closePath();
          ctx.fill();
          // Reflet
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath();
          ctx.moveTo(0, -particle.size * 0.6);
          ctx.lineTo(particle.size * 0.3, -particle.size * 0.2);
          ctx.lineTo(0, particle.size * 0.2);
          ctx.lineTo(-particle.size * 0.3, -particle.size * 0.2);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'star':
          // Étoile 5 branches
          ctx.shadowBlur = 6;
          ctx.shadowColor = particle.color;
          ctx.beginPath();
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5;
            const radius = i % 2 === 0 ? particle.size : particle.size * 0.5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'heart':
          // Cœur 3D
          ctx.shadowBlur = 8;
          ctx.shadowColor = particle.color;
          const size = particle.size;
          ctx.beginPath();
          ctx.moveTo(0, size * 0.3);
          ctx.bezierCurveTo(-size, -size * 0.5, -size, size * 0.3, 0, size);
          ctx.bezierCurveTo(size, size * 0.3, size, -size * 0.5, 0, size * 0.3);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    });
  }, []);

  const animate = useCallback(() => {
    updateParticles();
    drawParticles();
    animationRef.current = requestAnimationFrame(animate);
  }, [updateParticles, drawParticles]);

  useEffect(() => {
    if (isActive) {
      const intensityConfig = {
        low: { count: 15, interval: 80 },
        medium: { count: 30, interval: 50 },
        high: { count: 60, interval: 30 },
        epic: { count: 120, interval: 15 }
      };

      const config = intensityConfig[intensity];
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Créer les particules
      for (let i = 0; i < config.count; i++) {
        setTimeout(() => {
          const x = (position.x / 100) * canvas.width + (Math.random() - 0.5) * 200;
          const y = (position.y / 100) * canvas.height + (Math.random() - 0.5) * 200;
          particlesRef.current.push(createParticle(x, y));
        }, i * config.interval);
      }

      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, intensity, position, createParticle, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  );
};

export default ParticleEngine;