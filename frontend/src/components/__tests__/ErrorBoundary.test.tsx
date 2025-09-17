import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

const ProblematicComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal component</div>;
};

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal component')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Oups ! Quelque chose s'est mal passé")).toBeInTheDocument();
    expect(screen.getByText(/Ne t'inquiète pas/)).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('calls onError callback when error occurs', () => {
    const mockOnError = jest.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('successfully retries and renders children', () => {
    let shouldThrow = true;
    const VolatileComponent = () => {
      if (shouldThrow) {
        throw new Error('I will only throw once');
      }
      return <div>I am back!</div>;
    };

    render(
      <ErrorBoundary>
        <VolatileComponent />
      </ErrorBoundary>
    );

    // Initially, the error boundary shows the fallback UI
    expect(screen.getByText("Oups ! Quelque chose s'est mal passé")).toBeInTheDocument();

    // After clicking retry, the component should no longer throw
    shouldThrow = false;
    fireEvent.click(screen.getByText('🔄 Réessayer'));

    // The ErrorBoundary should now render the children component
    expect(screen.getByText('I am back!')).toBeInTheDocument();
    expect(screen.queryByText("Oups ! Quelque chose s'est mal passé")).not.toBeInTheDocument();
  });

  it('shows home button and handles navigation', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, href: '' };

    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('🏠 Retour à l\'accueil'));

    expect(window.location.href).toBe('/');

    window.location = originalLocation;
  });

  it('shows development error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Détails techniques (développement)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('does not show development error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Détails techniques (développement)')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('shows help text for persistent issues', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Si le problème persiste/)).toBeInTheDocument();
  });

  it('logs error to console in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ProblematicComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('🚨 Error Boundary caught an error:'),
      expect.any(Error),
      expect.any(Object)
    );

    process.env.NODE_ENV = originalEnv;
  });
});
