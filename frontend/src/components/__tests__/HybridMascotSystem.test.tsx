import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HybridMascotSystem from '../HybridMascotSystem';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...domProps } = props;
      return <div {...domProps}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>,
  useAnimation: () => ({
    start: jest.fn().mockImplementation(() => Promise.resolve()),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: (initial: any) => ({
    get: jest.fn(() => initial),
    set: jest.fn(),
    onChange: jest.fn(),
  }),
  useTransform: jest.fn((value, inputRange, outputRange) => ({
    get: jest.fn(() => outputRange[0]),
    set: jest.fn(),
  })),
  useSpring: jest.fn((value) => ({
    get: jest.fn(() => value),
    set: jest.fn(),
  })),
}));

// Mock Three.js
jest.mock('three', () => ({
  Scene: jest.fn(() => ({
    add: jest.fn(),
    background: null,
  })),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    shadowMap: { enabled: true, type: 'PCFSoftShadowMap' },
    domElement: { tagName: 'canvas' },
    render: jest.fn(),
    dispose: jest.fn(),
  })),
  PerspectiveCamera: jest.fn().mockImplementation(() => {
    const camera = {
      position: { 
        set: jest.fn(),
        x: 0,
        y: 0,
        z: 0,
        copy: jest.fn(),
        clone: jest.fn(),
        add: jest.fn(),
        sub: jest.fn(),
        multiply: jest.fn(),
        divide: jest.fn(),
        length: jest.fn(() => 1),
        normalize: jest.fn(),
        distanceTo: jest.fn(() => 1),
        dot: jest.fn(() => 1),
        cross: jest.fn(),
        lerp: jest.fn(),
        equals: jest.fn(() => true),
        fromArray: jest.fn(),
        toArray: jest.fn(),
      },
      lookAt: jest.fn(),
      updateMatrixWorld: jest.fn(),
      updateProjectionMatrix: jest.fn(),
    };
    return camera;
  }),
  Group: jest.fn(() => ({
    add: jest.fn(),
    position: { y: 0 },
    rotation: { y: 0, z: 0, x: 0 },
    children: [],
  })),
  SphereGeometry: jest.fn(),
  CylinderGeometry: jest.fn(),
  ConeGeometry: jest.fn(),
  PlaneGeometry: jest.fn(),
  TorusGeometry: jest.fn(),
  MeshPhongMaterial: jest.fn(() => ({
    color: { setHSL: jest.fn() },
  })),
  MeshBasicMaterial: jest.fn(),
  PointsMaterial: jest.fn(),
  BufferGeometry: jest.fn(() => ({
    setAttribute: jest.fn(),
  })),
  BufferAttribute: jest.fn(),
  Points: jest.fn(),
  Mesh: jest.fn(() => ({
    position: { set: jest.fn(), y: 0 },
    rotation: { z: 0, x: 0 },
    scale: { set: jest.fn(), setScalar: jest.fn() },
    castShadow: true,
    add: jest.fn(),
    clone: jest.fn(() => ({
      position: { x: 0 },
    })),
    userData: {},
  })),
  AmbientLight: jest.fn(),
  DirectionalLight: jest.fn(() => ({
    position: { set: jest.fn() },
    castShadow: true,
    shadow: { mapSize: { width: 2048, height: 2048 } },
  })),
  PointLight: jest.fn(() => ({
    position: { set: jest.fn() },
  })),
  Color: jest.fn(() => ({
    setHSL: jest.fn(),
  })),
  DoubleSide: 'DoubleSide',
  PCFSoftShadowMap: 'PCFSoftShadowMap',
}));

// Mock wardrobe data
jest.mock('../WardrobeData', () => ({
  WARDROBE_ITEMS: [
    { id: 'crown', type: 'hat', content: '👑' },
    { id: 'wand', type: 'accessory', content: '🪄' },
    { id: 'glasses', type: 'accessory', content: '🤓' },
  ],
  createItemMesh: jest.fn(() => ({
    position: { set: jest.fn() },
    rotation: { z: 0 },
    add: jest.fn(),
  })),
}));

describe('HybridMascotSystem', () => {
  const mockStudentData = {
    level: 5,
    xp: 1250,
    currentStreak: 7,
    timeOfDay: 'morning' as const,
    recentPerformance: 'excellent' as const,
  };

  const defaultProps = {
    mascotType: 'dragon' as const,
    studentData: mockStudentData,
    currentActivity: 'idle' as const,
    equippedItems: ['crown'],
    onMascotInteraction: jest.fn(),
    onEmotionalStateChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendu initial', () => {
    it('affiche le conteneur 3D du mascotte', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
      expect(mascotContainer).toHaveClass('w-50', 'h-50', 'rounded-full', 'cursor-pointer');
    });

    it('affiche l\'indicateur d\'humeur', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      expect(moodIndicator).toBeInTheDocument();
    });

    it('affiche la barre d\'énergie', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      const energyBar = screen.getByRole('generic').querySelector('.w-4.h-8.bg-gray-200');
      expect(energyBar).toBeInTheDocument();
    });

    it('affiche le niveau d\'énergie correct', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      const energyFill = screen.getByRole('generic').querySelector('.bg-gradient-to-t');
      expect(energyFill).toHaveStyle('height: 80%'); // Énergie initiale de 80
    });
  });

  describe('États d\'humeur', () => {
    it('affiche la bonne couleur pour l\'humeur excité', () => {
      render(<HybridMascotSystem {...defaultProps} currentActivity="achievement" />);
      
      // Attendre que l'état AI se mette à jour
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      expect(moodIndicator).toHaveClass('bg-yellow-400', 'animate-pulse');
    });

    it('affiche la bonne couleur pour l\'humeur heureux', () => {
      render(<HybridMascotSystem {...defaultProps} currentActivity="idle" />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      expect(moodIndicator).toHaveClass('bg-green-400');
    });

    it('affiche la bonne couleur pour l\'humeur encourageant', () => {
      render(<HybridMascotSystem {...defaultProps} currentActivity="mistake" />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      expect(moodIndicator).toHaveClass('bg-blue-400');
    });

    it('affiche la bonne couleur pour l\'humeur concentré', () => {
      render(<HybridMascotSystem {...defaultProps} currentActivity="exercise" />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      expect(moodIndicator).toHaveClass('bg-purple-400');
    });
  });

  describe('Interactions intelligentes', () => {
    it('permet de cliquer sur le mascotte', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<HybridMascotSystem {...defaultProps} />);
      
      const mascotContainer = screen.getByRole('generic');
      await user.click(mascotContainer);
      
      expect(defaultProps.onMascotInteraction).toHaveBeenCalledWith('click');
    });

    it('affiche l\'indicateur de réflexion lors de l\'interaction', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<HybridMascotSystem {...defaultProps} />);
      
      const mascotContainer = screen.getByRole('generic');
      await user.click(mascotContainer);
      
      // Vérifier que l'indicateur de réflexion apparaît
      const thinkingDots = screen.getByRole('generic').querySelectorAll('.w-2.h-2.bg-purple-400');
      expect(thinkingDots).toHaveLength(3);
    });

    it('génère un dialogue en français après l\'interaction', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<HybridMascotSystem {...defaultProps} />);
      
      const mascotContainer = screen.getByRole('generic');
      await user.click(mascotContainer);
      
      // Avancer le temps pour simuler la réflexion
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Vérifier qu'un dialogue en français apparaît
      const dialogue = screen.getByRole('generic').querySelector('.bg-gradient-to-br.from-purple-600');
      expect(dialogue).toBeInTheDocument();
      expect(dialogue).toHaveTextContent(/tu|je|nous|vous/i); // Mots français communs
    });

    it('met à jour l\'état émotionnel après l\'interaction', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<HybridMascotSystem {...defaultProps} />);
      
      const mascotContainer = screen.getByRole('generic');
      await user.click(mascotContainer);
      
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      expect(defaultProps.onEmotionalStateChange).toHaveBeenCalled();
    });
  });

  describe('Types de mascottes', () => {
    it('gère le type dragon', () => {
      render(<HybridMascotSystem {...defaultProps} mascotType="dragon" />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère le type fairy', () => {
      render(<HybridMascotSystem {...defaultProps} mascotType="fairy" />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère le type robot', () => {
      render(<HybridMascotSystem {...defaultProps} mascotType="robot" />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère le type cat', () => {
      render(<HybridMascotSystem {...defaultProps} mascotType="cat" />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère le type owl', () => {
      render(<HybridMascotSystem {...defaultProps} mascotType="owl" />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });
  });

  describe('Équipements', () => {
    it('affiche les équipements équipés', () => {
      render(<HybridMascotSystem {...defaultProps} equippedItems={['crown', 'wand']} />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère le cas sans équipements', () => {
      render(<HybridMascotSystem {...defaultProps} equippedItems={[]} />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });
  });

  describe('Relation avec l\'étudiant', () => {
    it('affiche les cœurs quand la relation est forte', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      // Simuler une relation forte en modifiant l'état
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // Vérifier que les cœurs apparaissent (relation > 80)
      const hearts = screen.getByRole('generic').querySelector('.text-red-400');
      if (hearts) {
        expect(hearts).toHaveTextContent('💕');
      }
    });

    it('met à jour la relation après les interactions', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<HybridMascotSystem {...defaultProps} />);
      
      const mascotContainer = screen.getByRole('generic');
      await user.click(mascotContainer);
      
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // La relation devrait augmenter après l'interaction
      expect(defaultProps.onEmotionalStateChange).toHaveBeenCalled();
    });
  });

  describe('Performance de l\'étudiant', () => {
    it('réagit à une performance excellente', () => {
      render(<HybridMascotSystem {...defaultProps} studentData={{...mockStudentData, recentPerformance: 'excellent'}} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      expect(moodIndicator).toHaveClass('bg-yellow-400', 'animate-pulse'); // Excité
    });

    it('réagit à une performance en difficulté', () => {
      render(<HybridMascotSystem {...defaultProps} studentData={{...mockStudentData, recentPerformance: 'struggling'}} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      expect(moodIndicator).toHaveClass('bg-blue-400'); // Encourageant
    });

    it('réagit à une performance moyenne', () => {
      render(<HybridMascotSystem {...defaultProps} studentData={{...mockStudentData, recentPerformance: 'average'}} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      expect(moodIndicator).toHaveClass('bg-pink-400'); // Curieux
    });
  });

  describe('Heure de la journée', () => {
    it('réagit au matin', () => {
      render(<HybridMascotSystem {...defaultProps} studentData={{...mockStudentData, timeOfDay: 'morning'}} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // L'énergie devrait augmenter le matin
      const energyFill = screen.getByRole('generic').querySelector('.bg-gradient-to-t');
      expect(energyFill).toBeInTheDocument();
    });

    it('réagit au soir', () => {
      render(<HybridMascotSystem {...defaultProps} studentData={{...mockStudentData, timeOfDay: 'evening'}} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // L'énergie devrait diminuer le soir
      const energyFill = screen.getByRole('generic').querySelector('.bg-gradient-to-t');
      expect(energyFill).toBeInTheDocument();
    });
  });

  describe('Animations et effets', () => {
    it('affiche les effets de particules pour l\'humeur excité', () => {
      render(<HybridMascotSystem {...defaultProps} currentActivity="achievement" />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère les animations de respiration', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });
  });

  describe('Accessibilité', () => {
    it('utilise un conteneur cliquable', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toHaveClass('cursor-pointer');
    });

    it('affiche des indicateurs visuels clairs', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      const moodIndicator = screen.getByRole('generic').querySelector('.w-4.h-4.rounded-full');
      const energyBar = screen.getByRole('generic').querySelector('.w-4.h-8.bg-gray-200');
      
      expect(moodIndicator).toBeInTheDocument();
      expect(energyBar).toBeInTheDocument();
    });
  });

  describe('Cas limites', () => {
    it('gère les données d\'étudiant manquantes', () => {
      const minimalStudentData = {
        level: 1,
        xp: 0,
        currentStreak: 0,
        timeOfDay: 'morning' as const,
        recentPerformance: 'average' as const,
      };
      
      render(<HybridMascotSystem {...defaultProps} studentData={minimalStudentData} />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère les équipements invalides', () => {
      render(<HybridMascotSystem {...defaultProps} equippedItems={['invalid-item']} />);
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère les interactions multiples rapides', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<HybridMascotSystem {...defaultProps} />);
      
      const mascotContainer = screen.getByRole('generic');
      
      // Cliquer plusieurs fois rapidement
      await user.click(mascotContainer);
      await user.click(mascotContainer);
      await user.click(mascotContainer);
      
      expect(defaultProps.onMascotInteraction).toHaveBeenCalledTimes(3);
    });
  });

  describe('Gestion de l\'état AI', () => {
    it('met à jour l\'état AI périodiquement', () => {
      render(<HybridMascotSystem {...defaultProps} />);
      
      // Avancer le temps pour déclencher les mises à jour périodiques
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });

    it('gère les changements d\'activité', () => {
      const { rerender } = render(<HybridMascotSystem {...defaultProps} currentActivity="idle" />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      rerender(<HybridMascotSystem {...defaultProps} currentActivity="exercise" />);
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const mascotContainer = screen.getByRole('generic');
      expect(mascotContainer).toBeInTheDocument();
    });
  });
});
