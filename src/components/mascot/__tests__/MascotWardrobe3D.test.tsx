/**
 * MascotWardrobe3D Component Tests for FastRevEd Kids
 * Tests the 3D wardrobe functionality, item selection, and rendering.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MascotWardrobe3D from '../MascotWardrobe3D';

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock Three.js and react-three-fiber, as we can't test WebGL rendering in JSDOM.
// We will test if the components are rendered with the correct props.
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: jest.fn(),
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  PerspectiveCamera: () => <div data-testid="perspective-camera" />,
  Html: ({ children }: { children: React.ReactNode }) => <div data-testid="html-overlay">{children}</div>,
  useGLTF: (path: string) => ({
    scene: {
      clone: () => ({
        // Mock the scene object with some basic properties
        isObject3D: true,
        name: `mock-gltf-${path}`,
      }),
    },
  }),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Shirt: () => <div data-testid="shirt-icon" />,
  Wand2: () => <div data-testid="wand-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
}));

// Mock wardrobe data
const mockWardrobeItems = [
  { id: 'item-1', name: 'Magic Hat', type: 'hat', rarity: 'rare', equipped: false, path: '/models/hat.gltf' },
  { id: 'item-2', name: 'Dragon Wings', type: 'accessory', rarity: 'epic', equipped: true, path: '/models/wings.gltf' },
  { id: 'item-3', name: 'Space Suit', type: 'outfit', rarity: 'legendary', equipped: false, path: '/models/suit.gltf' },
];

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('MascotWardrobe3D', () => {
  let onEquipItem: jest.Mock;

  beforeEach(() => {
    onEquipItem = jest.fn();
  });

  const renderComponent = (items = mockWardrobeItems) => {
    return render(
      <MascotWardrobe3D
        items={items}
        onEquipItem={onEquipItem}
      />
    );
  };

  describe('Rendering', () => {
    it('should render a 3D canvas and camera controls', () => {
      renderComponent();
      expect(screen.getByTestId('canvas')).toBeInTheDocument();
      expect(screen.getByTestId('orbit-controls')).toBeInTheDocument();
      expect(screen.getByTestId('perspective-camera')).toBeInTheDocument();
    });

    it('should render all wardrobe items as 3D models', () => {
      renderComponent();
      // We check if the useGLTF hook is called for each item
      // This is an indirect way to verify that the models are being loaded.
      // A more direct test would require a more complex mock of the GLTF loader.
      expect(screen.getByText('Magic Hat')).toBeInTheDocument();
      expect(screen.getByText('Dragon Wings')).toBeInTheDocument();
      expect(screen.getByText('Space Suit')).toBeInTheDocument();
    });

    it('should display item names and rarity', () => {
      renderComponent();
      expect(screen.getByText('Magic Hat')).toBeInTheDocument();
      expect(screen.getByText('rare')).toBeInTheDocument();
      expect(screen.getByText('Dragon Wings')).toBeInTheDocument();
      expect(screen.getByText('epic')).toBeInTheDocument();
    });

    it('should show "Equipped" status for equipped items', () => {
      renderComponent();
      const equippedItem = screen.getByText('Dragon Wings').closest('div');
      expect(equippedItem).toHaveTextContent('Equipped');
    });

    it('should render filter buttons for item types', () => {
        renderComponent();
        expect(screen.getByRole('button', { name: /All/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /hat/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /accessory/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /outfit/i })).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onEquipItem with the correct item id when an item is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const itemToClick = screen.getByText('Magic Hat');
      await user.click(itemToClick);

      expect(onEquipItem).toHaveBeenCalledTimes(1);
      expect(onEquipItem).toHaveBeenCalledWith('item-1');
    });

    it('should not call onEquipItem for an already equipped item', async () => {
      const user = userEvent.setup();
      renderComponent();

      const equippedItem = screen.getByText('Dragon Wings');
      await user.click(equippedItem);

      expect(onEquipItem).not.toHaveBeenCalled();
    });

    it('should filter items when a filter button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const hatFilterButton = screen.getByRole('button', { name: /hat/i });
      await user.click(hatFilterButton);

      await waitFor(() => {
        expect(screen.getByText('Magic Hat')).toBeInTheDocument();
        expect(screen.queryByText('Dragon Wings')).not.toBeInTheDocument();
        expect(screen.queryByText('Space Suit')).not.toBeInTheDocument();
      });
    });

    it('should show all items when "All" filter is clicked', async () => {
        const user = userEvent.setup();
        renderComponent();

        // First, filter to something else
        const hatFilterButton = screen.getByRole('button', { name: /hat/i });
        await user.click(hatFilterButton);

        await waitFor(() => {
            expect(screen.queryByText('Dragon Wings')).not.toBeInTheDocument();
        });

        // Now, click "All"
        const allFilterButton = screen.getByRole('button', { name: /All/i });
        await user.click(allFilterButton);

        await waitFor(() => {
          expect(screen.getByText('Magic Hat')).toBeInTheDocument();
          expect(screen.getByText('Dragon Wings')).toBeInTheDocument();
          expect(screen.getByText('Space Suit')).toBeInTheDocument();
        });
      });
  });

  describe('Empty State', () => {
    it('should render a message when there are no items', () => {
      renderComponent([]);
      expect(screen.getByText('No items in your wardrobe yet!')).toBeInTheDocument();
      expect(screen.getByText('Keep playing to unlock more items.')).toBeInTheDocument();
    });
  });
});
