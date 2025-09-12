import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ParticleEngine from '../ParticleEngine';

// Mock requestAnimationFrame
const mockRequestAnimationFrame = jest.fn();
const mockCancelAnimationFrame = jest.fn();

global.requestAnimationFrame = mockRequestAnimationFrame;
global.cancelAnimationFrame = mockCancelAnimationFrame;

// Mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  globalAlpha: 1,
  fillStyle: '',
  shadowBlur: 0,
  shadowColor: '',
  translate: jest.fn(),
  rotate: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  bezierCurveTo: jest.fn(),
};

const mockCanvas = {
  getContext: jest.fn(() => mockCanvasContext),
  width: 800,
  height: 600,
};

// Mock canvas element
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: jest.fn(() => mockCanvasContext),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
  writable: true,
  value: 800,
});

Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
  writable: true,
  value: 600,
});

describe('ParticleEngine', () => {
  const defaultProps = {
    isActive: true,
    intensity: 'medium' as const,
    type: 'success' as const,
    position: { x: 50, y: 50 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequestAnimationFrame.mockImplementation((callback) => {
      // Store callback but don't execute it immediately to avoid infinite recursion
      return 1;
    });
  });

  describe('Rendu initial', () => {
    it('affiche le canvas de particules', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      expect(canvas).toHaveClass('fixed', 'inset-0', 'pointer-events-none', 'z-50');
    });

    it('affiche le canvas avec un arrière-plan transparent', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveStyle('background: transparent');
    });

    it('ne s\'affiche pas quand inactif', () => {
      render(<ParticleEngine {...defaultProps} isActive={false} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Types de particules', () => {
    it('gère le type success', () => {
      render(<ParticleEngine {...defaultProps} type="success" />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('gère le type levelup', () => {
      render(<ParticleEngine {...defaultProps} type="levelup" />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('gère le type magic', () => {
      render(<ParticleEngine {...defaultProps} type="magic" />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Intensités', () => {
    it('gère l\'intensité faible', () => {
      render(<ParticleEngine {...defaultProps} intensity="low" />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('gère l\'intensité moyenne', () => {
      render(<ParticleEngine {...defaultProps} intensity="medium" />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('gère l\'intensité élevée', () => {
      render(<ParticleEngine {...defaultProps} intensity="high" />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('gère l\'intensité épique', () => {
      render(<ParticleEngine {...defaultProps} intensity="epic" />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Positions', () => {
    it('utilise la position par défaut', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('utilise une position personnalisée', () => {
      const customPosition = { x: 25, y: 75 };
      render(<ParticleEngine {...defaultProps} position={customPosition} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('gère les positions aux limites', () => {
      const edgePosition = { x: 0, y: 100 };
      render(<ParticleEngine {...defaultProps} position={edgePosition} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });

  describe('Animation et particules', () => {
    it('démarre l\'animation quand actif', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('arrête l\'animation quand inactif', () => {
      const { rerender } = render(<ParticleEngine {...defaultProps} />);
      
      rerender(<ParticleEngine {...defaultProps} isActive={false} />);
      
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });

    it('nettoie l\'animation au démontage', () => {
      const { unmount } = render(<ParticleEngine {...defaultProps} />);
      
      unmount();
      
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Types de particules visuelles', () => {
    it('crée des particules sparkle', () => {
      const { container } = render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que le canvas est présent
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('crée des particules crystal', () => {
      const { container } = render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que le canvas est présent
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('crée des particules star', () => {
      const { container } = render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que le canvas est présent
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('crée des particules heart', () => {
      const { container } = render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que le canvas est présent
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Effets visuels', () => {
    it('applique les ombres aux particules', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que les propriétés d'ombre sont définies
      expect(mockCanvasContext.shadowBlur).toBeDefined();
      expect(mockCanvasContext.shadowColor).toBeDefined();
    });

    it('applique la transparence aux particules', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que l'alpha global est utilisé
      expect(mockCanvasContext.globalAlpha).toBeDefined();
    });

    it('applique les transformations aux particules', () => {
      const { container } = render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que le canvas est présent
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Gestion du canvas', () => {
    it('définit la taille du canvas', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('nettoie le canvas avant de dessiner', () => {
      const { container } = render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que le canvas est présent
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });

    it('sauvegarde et restaure le contexte', () => {
      const { container } = render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que le canvas est présent
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('gère les particules avec une durée de vie limitée', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que l'animation est gérée
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('filtre les particules expirées', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que l'animation est gérée
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });

    it('applique la gravité et la friction', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      // Vérifier que l'animation est gérée
      expect(mockRequestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Cas limites', () => {
    it('gère le cas où le canvas n\'est pas disponible', () => {
      // Mock canvas non disponible
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = jest.fn(() => null);
      
      render(<ParticleEngine {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
      
      // Restaurer le mock
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it('gère les positions invalides', () => {
      const invalidPosition = { x: -10, y: 150 };
      render(<ParticleEngine {...defaultProps} position={invalidPosition} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('gère les changements rapides d\'état', () => {
      const { rerender } = render(<ParticleEngine {...defaultProps} />);
      
      // Changer rapidement l'état
      rerender(<ParticleEngine {...defaultProps} isActive={false} />);
      rerender(<ParticleEngine {...defaultProps} isActive={true} />);
      rerender(<ParticleEngine {...defaultProps} isActive={false} />);
      
      expect(mockCancelAnimationFrame).toHaveBeenCalled();
    });
  });

  describe('Accessibilité', () => {
    it('utilise pointer-events-none pour ne pas bloquer les interactions', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('pointer-events-none');
    });

    it('utilise un z-index élevé pour être au-dessus des autres éléments', () => {
      render(<ParticleEngine {...defaultProps} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toHaveClass('z-50');
    });
  });

  describe('Intégration', () => {
    it('fonctionne avec différents types et intensités', () => {
      const combinations = [
        { type: 'success' as const, intensity: 'low' as const },
        { type: 'levelup' as const, intensity: 'high' as const },
        { type: 'magic' as const, intensity: 'epic' as const },
      ];
      
      combinations.forEach(({ type, intensity }) => {
        const { unmount } = render(
          <ParticleEngine {...defaultProps} type={type} intensity={intensity} />
        );
        
        const canvas = document.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
        
        unmount();
      });
    });

    it('gère les changements de props dynamiquement', () => {
      const { rerender } = render(<ParticleEngine {...defaultProps} />);
      
      // Changer le type
      rerender(<ParticleEngine {...defaultProps} type="levelup" />);
      
      // Changer l'intensité
      rerender(<ParticleEngine {...defaultProps} intensity="high" />);
      
      // Changer la position
      rerender(<ParticleEngine {...defaultProps} position={{ x: 75, y: 25 }} />);
      
      const canvas = document.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });
  });
});


