/**
 * ErrorBoundary Component Tests
 * Tests that the component catches errors and displays a fallback UI.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary'; // Adjust path if needed

// =============================================================================
// TEST SETUP & MOCKS
// =============================================================================

// Mock console.error to prevent Jest from logging expected errors during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

// A component designed to throw an error to test the boundary
const ProblemChild = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('This is a test error.');
  }
  return <div data-testid="child-content">Everything is fine!</div>;
};

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe('ErrorBoundary', () => {
  it('should render children correctly when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Everything is fine!')).toBeInTheDocument();
  });

  it('should render a fallback UI when a child component throws an error', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check for the elements of the fallback UI
    expect(screen.getByRole('heading', { name: /Oops! Something went wrong/i })).toBeInTheDocument();
    expect(screen.getByText(/We're sorry, but the application has encountered an error./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });

  it('should not render the broken component when an error is caught', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    // Ensure no part of the broken component is rendered
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
  });

  it('should allow recovering from an error', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    // The error UI is showing
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();

    // In a real component, clicking "Try again" would reset the error state.
    // We simulate this by re-rendering with a valid child.
    rerender(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    );

    // The fallback UI should be gone, and the new child should be rendered.
    expect(screen.getByText('Everything is fine!')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Oops! Something went wrong/i })).not.toBeInTheDocument();
  });
});
