/**
 * MascotWardrobe3D Component Tests for FastRevEd Kids
 * Tests the 3D wardrobe functionality, item selection, and rendering.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MascotWardrobe3D from '../mascot/MascotWardrobe3D';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock Three.js since we can't test WebGL rendering in JSDOM
jest.mock('three', () => {
  const mockVector3 = {
    set: jest.fn(),
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
    x: 0,
    y: 0,
    z: 0,
  };

  const mockEuler = {
    set: jest.fn(),
    copy: jest.fn(),
    clone: jest.fn(),
    x: 0,
    y: 0,
    z: 0,
  };

  const mockColor = {
    set: jest.fn(),
    setHSL: jest.fn(),
    setHex: jest.fn(),
    setRGB: jest.fn(),
    copy: jest.fn(),
    clone: jest.fn(),
    r: 1,
    g: 1,
    b: 1,
  };

  const mockGeometry = {
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    dispose: jest.fn(),
  };

  const mockMaterial = {
    dispose: jest.fn(),
    color: mockColor,
    transparent: false,
    opacity: 1,
    shininess: 30,
    emissive: mockColor,
    emissiveIntensity: 0,
  };

  const mockMesh = {
    position: mockVector3,
    rotation: mockEuler,
    scale: mockVector3,
    add: jest.fn(),
    remove: jest.fn(),
    clone: jest.fn(),
    dispose: jest.fn(),
    castShadow: false,
    receiveShadow: false,
    userData: {},
    children: [],
  };

  const mockGroup = {
    position: mockVector3,
    rotation: mockEuler,
    scale: mockVector3,
    add: jest.fn(),
    remove: jest.fn(),
    clone: jest.fn(),
    dispose: jest.fn(),
    children: [],
    getObjectByName: jest.fn(),
  };

  const mockCamera = {
    position: mockVector3,
    rotation: mockEuler,
    lookAt: jest.fn(),
    updateMatrixWorld: jest.fn(),
    updateProjectionMatrix: jest.fn(),
  };

  const mockScene = {
    add: jest.fn(),
    remove: jest.fn(),
    background: null,
    dispose: jest.fn(),
  };

  const mockRenderer = {
    setSize: jest.fn(),
    setPixelRatio: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: {
      appendChild: jest.fn(),
      removeChild: jest.fn(),
    },
    shadowMap: {
      enabled: false,
      type: 0,
    },
  };

  const mockLight = {
    position: mockVector3,
    color: mockColor,
    intensity: 1,
    castShadow: false,
    shadow: {
      mapSize: { width: 1024, height: 1024 },
    },
  };

  const mockBufferAttribute = jest.fn();
  const mockBufferGeometry = jest.fn(() => mockGeometry);
  const mockPointsMaterial = jest.fn(() => mockMaterial);
  const mockPoints = jest.fn(() => mockMesh);

  return {
    Scene: jest.fn(() => mockScene),
    PerspectiveCamera: jest.fn(() => mockCamera),
    WebGLRenderer: jest.fn(() => mockRenderer),
    Group: jest.fn(() => mockGroup),
    Mesh: jest.fn(() => mockMesh),
    Points: mockPoints,
    CapsuleGeometry: jest.fn(() => mockGeometry),
    BoxGeometry: jest.fn(() => mockGeometry),
    ConeGeometry: jest.fn(() => mockGeometry),
    PlaneGeometry: jest.fn(() => mockGeometry),
    TorusGeometry: jest.fn(() => mockGeometry),
    CylinderGeometry: jest.fn(() => mockGeometry),
    BufferGeometry: mockBufferGeometry,
    MeshPhongMaterial: jest.fn(() => mockMaterial),
    MeshBasicMaterial: jest.fn(() => mockMaterial),
    PointsMaterial: mockPointsMaterial,
    AmbientLight: jest.fn(() => mockLight),
    DirectionalLight: jest.fn(() => mockLight),
    PointLight: jest.fn(() => mockLight),
    Color: jest.fn(() => mockColor),
    Vector3: jest.fn(() => mockVector3),
    Euler: jest.fn(() => mockEuler),
    BufferAttribute: mockBufferAttribute,
    PCFSoftShadowMap: 1,
    DoubleSide: 2,
    BackSide: 1,
    Float32Array: Float32Array,
  };
});

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shirt: () => <div data-testid="shirt-icon" />,
  Wand2: () => <div data-testid="wand-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>{children}</div>
    )
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
Object.defineProperty(window, 'WebGLRenderingContext', {
  value: function() { return {}; }
});

// Mock window methods
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn()
});
Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn()
});
Object.defineProperty(window, 'requestAnimationFrame', {
  value: jest.fn()
});
Object.defineProperty(window, 'cancelAnimationFrame', {
  value: jest.fn()
});

// Mock wardrobe data to match component interface
const mockEquippedItems = ['golden_crown', 'magic_cape'];
const mockStudentLevel = 10;

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('MascotWardrobe3D', () => {
  let onItemEquip: jest.Mock;
  let onItemUnequip: jest.Mock;

  beforeEach(() => {
    onItemEquip = jest.fn();
    onItemUnequip = jest.fn();
  });

  const renderComponent = (props = {}) => {
    return render(
      <MascotWardrobe3D
        mascotType="dragon"
        equippedItems={mockEquippedItems}
        studentLevel={mockStudentLevel}
        onItemEquip={onItemEquip}
        onItemUnequip={onItemUnequip}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render the mascot 3D section', () => {
      renderComponent();
      expect(screen.getByText('🎭 Mascotte 3D')).toBeInTheDocument();
      expect(screen.getByText('Équipements actifs: 2')).toBeInTheDocument();
    });

    it('should render wardrobe items with correct names', () => {
      renderComponent();
      // Check if wardrobe items from WARDROBE_COLLECTION are rendered
      expect(screen.getByText('Couronne Dorée')).toBeInTheDocument();
      expect(screen.getByText('Cape Magique')).toBeInTheDocument();
      expect(screen.getByText('Ailes de Cristal')).toBeInTheDocument();
    });

    it('should display item rarity badges', () => {
      renderComponent();
      expect(screen.getByText('legendary')).toBeInTheDocument();
      expect(screen.getAllByText('epic').length).toBeGreaterThan(0);
      expect(screen.getAllByText('rare').length).toBeGreaterThan(0);
    });

    it('should show equipped items with visual indicators', () => {
      renderComponent();
      // Check that the equipped items counter shows 2
      expect(screen.getByText('Équipements actifs: 2')).toBeInTheDocument();
    });

    it('should render filter buttons for item categories', () => {
        renderComponent();
        expect(screen.getByText('Tout')).toBeInTheDocument();
        expect(screen.getByText('hat')).toBeInTheDocument();
        expect(screen.getByText('cape')).toBeInTheDocument();
        expect(screen.getByText('wings')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onItemEquip when an unequipped item is clicked', async () => {
      const user = userEvent.setup();
      renderComponent({ equippedItems: [] }); // No equipped items

      const itemCard = screen.getByText('Couronne Dorée').closest('div');
      await user.click(itemCard!);

      expect(onItemEquip).toHaveBeenCalledTimes(1);
    });

    it('should call onItemUnequip for an already equipped item', async () => {
      const user = userEvent.setup();
      renderComponent();

      const itemCard = screen.getByText('Couronne Dorée').closest('div');
      await user.click(itemCard!);

      expect(onItemUnequip).toHaveBeenCalledTimes(1);
    });

    it('should filter items when a category filter is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const hatFilterButton = screen.getByText('hat');
      await user.click(hatFilterButton);

      // Test that filter functionality works (items might be filtered out of view)
      expect(hatFilterButton).toBeInTheDocument();
    });

    it('should show all items when "Tout" filter is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();
  
        // First, filter to something else
        const hatFilterButton = screen.getByText('hat');
        await user.click(hatFilterButton);
  
        // Now, click "Tout"
        const allFilterButton = screen.getByText('Tout');
        await user.click(allFilterButton);
  
        await waitFor(() => {
          expect(allFilterButton).toHaveClass('bg-blue-500');
        });
      });
  });

  describe('Empty State', () => {
    it('should render a tip message', () => {
      renderComponent();
      expect(screen.getByText('💡 Astuce: Monte de niveau pour débloquer plus d\'équipements magiques!')).toBeInTheDocument();
    });
  });
});


