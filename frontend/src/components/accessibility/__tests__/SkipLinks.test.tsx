import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkipLinks from '../SkipLinks';

// Mock timers
jest.useFakeTimers();

describe('SkipLinks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<SkipLinks />);
      expect(container).toBeInTheDocument();
    });

    it('renders with additional links', () => {
      const additionalLinks = [
        { id: 'test', label: 'Skip to test', target: '#test' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      expect(screen.getByText('Skip Navigation')).toBeInTheDocument();
      expect(screen.getByText('Skip to test')).toBeInTheDocument();
    });

    it('applies custom className when provided', () => {
      const additionalLinks = [
        { id: 'test', label: 'Skip to test', target: '#test' }
      ];

      const { container } = render(<SkipLinks className="custom-skip-links" additionalLinks={additionalLinks} />);

      const skipLinksContainer = container.querySelector('.skip-links');
      expect(skipLinksContainer).toHaveClass('custom-skip-links');
    });
  });

  describe('Additional Links', () => {
    it('renders additional custom links', () => {
      const additionalLinks = [
        { id: 'custom-1', label: 'Skip to search', target: '#search-form' },
        { id: 'custom-2', label: 'Skip to sidebar', target: '#sidebar' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      expect(screen.getByText('Skip to search')).toBeInTheDocument();
      expect(screen.getByText('Skip to sidebar')).toBeInTheDocument();
    });

    it('renders buttons for additional links', () => {
      const additionalLinks = [
        { id: 'search-link', label: 'Skip to search', target: '#search-form' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      const searchButton = screen.getByText('Skip to search');
      expect(searchButton.tagName).toBe('BUTTON');
    });
  });

  describe('Link Interaction', () => {
    it('handles keyboard navigation', () => {
      const additionalLinks = [
        { id: 'link1', label: 'Skip to section 1', target: '#section1' },
        { id: 'link2', label: 'Skip to section 2', target: '#section2' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      const firstLink = screen.getByText('Skip to section 1');
      const secondLink = screen.getByText('Skip to section 2');

      firstLink.focus();
      expect(document.activeElement).toBe(firstLink);

      fireEvent.keyDown(firstLink, { key: 'Tab' });
      secondLink.focus();
      expect(document.activeElement).toBe(secondLink);
    });

    it('shows links when they exist', () => {
      const additionalLinks = [
        { id: 'test', label: 'Skip to test', target: '#test' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      const skipLinksContainer = screen.getByText('Skip Navigation').closest('.skip-links');
      expect(skipLinksContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing target elements', () => {
      const additionalLinks = [
        { id: 'missing', label: 'Skip to missing', target: '#non-existent' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      const missingLink = screen.getByText('Skip to missing');
      fireEvent.click(missingLink);

      expect(missingLink).toBeInTheDocument();
    });
  });

  describe('Accessibility Standards', () => {
    it('uses semantic HTML structure', () => {
      const additionalLinks = [
        { id: 'test', label: 'Skip to test', target: '#test' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      expect(screen.getByText('Skip Navigation')).toBeInTheDocument();
      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('provides proper focus management', () => {
      const additionalLinks = [
        { id: 'test', label: 'Skip to test', target: '#test' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      const button = screen.getByText('Skip to test');
      expect(button.tagName).toBe('BUTTON');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('has proper button structure', () => {
      const additionalLinks = [
        { id: 'test', label: 'Skip to test', target: '#test' }
      ];

      render(<SkipLinks additionalLinks={additionalLinks} />);

      const button = screen.getByRole('button', { name: 'Skip to test' });
      expect(button).toBeInTheDocument();
    });
  });
});