import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { Toast, ToastContainer, useToast } from '../Toast';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, exit, transition, ...props }: any) => (
      <div 
        className={className}
        data-testid="motion-div"
        data-initial={JSON.stringify(initial)}
        data-animate={JSON.stringify(animate)}
        data-exit={JSON.stringify(exit)}
        data-transition={JSON.stringify(transition)}
        {...props}
      >
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div data-testid="animate-presence">{children}</div>
}));

describe('Toast', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders toast with correct message', () => {
    render(
      <Toast 
        id="test-1" 
        type="success" 
        message="Test message" 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies correct type styling', () => {
    const { rerender } = render(
      <Toast id="test-1" type="success" message="Success" onClose={mockOnClose} />
    );
    
    let container = screen.getByText('Success').closest('div');
    expect(container).toHaveClass('bg-green-500', 'border-green-600');

    rerender(<Toast id="test-2" type="error" message="Error" onClose={mockOnClose} />);
    container = screen.getByText('Error').closest('div');
    expect(container).toHaveClass('bg-red-500', 'border-red-600');

    rerender(<Toast id="test-3" type="warning" message="Warning" onClose={mockOnClose} />);
    container = screen.getByText('Warning').closest('div');
    expect(container).toHaveClass('bg-yellow-500', 'border-yellow-600');

    rerender(<Toast id="test-4" type="info" message="Info" onClose={mockOnClose} />);
    container = screen.getByText('Info').closest('div');
    expect(container).toHaveClass('bg-blue-500', 'border-blue-600');
  });

  it('displays correct icons for each type', () => {
    const { rerender } = render(
      <Toast id="test-1" type="success" message="Success" onClose={mockOnClose} />
    );
    expect(screen.getByText('✅')).toBeInTheDocument();

    rerender(<Toast id="test-2" type="error" message="Error" onClose={mockOnClose} />);
    expect(screen.getByText('❌')).toBeInTheDocument();

    rerender(<Toast id="test-3" type="warning" message="Warning" onClose={mockOnClose} />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<Toast id="test-4" type="info" message="Info" onClose={mockOnClose} />);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('applies correct position styling', () => {
    const { rerender } = render(
      <Toast id="test-1" type="info" message="Top Right" position="top-right" onClose={mockOnClose} />
    );
    let motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('top-4', 'right-4');

    rerender(<Toast id="test-2" type="info" message="Top Left" position="top-left" onClose={mockOnClose} />);
    motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('top-4', 'left-4');

    rerender(<Toast id="test-3" type="info" message="Bottom Right" position="bottom-right" onClose={mockOnClose} />);
    motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('bottom-4', 'right-4');

    rerender(<Toast id="test-4" type="info" message="Bottom Left" position="bottom-left" onClose={mockOnClose} />);
    motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('bottom-4', 'left-4');
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast id="test-1" type="info" message="Test" onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledWith('test-1');
  });

  it('auto-closes after duration', async () => {
    render(<Toast id="test-1" type="info" message="Auto close" duration={1000} onClose={mockOnClose} />);
    
    expect(mockOnClose).not.toHaveBeenCalled();
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockOnClose).toHaveBeenCalledWith('test-1');
  });

  it('does not auto-close when duration is 0', () => {
    render(<Toast id="test-1" type="info" message="No auto close" duration={0} onClose={mockOnClose} />);
    
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('clears timer on unmount', () => {
    const { unmount } = render(
      <Toast id="test-1" type="info" message="Unmount test" duration={5000} onClose={mockOnClose} />
    );
    
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    
    unmount();
    
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});

describe('useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with empty toasts array', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
  });

  it('adds toast with addToast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.addToast({ type: 'success', message: 'Test toast' });
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Test toast');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('removes toast with removeToast', () => {
    const { result } = renderHook(() => useToast());
    
    let toastId: string;
    
    act(() => {
      toastId = result.current.addToast({ type: 'info', message: 'Remove me' });
    });
    
    expect(result.current.toasts).toHaveLength(1);
    
    act(() => {
      result.current.removeToast(toastId);
    });
    
    expect(result.current.toasts).toHaveLength(0);
  });

  it('adds success toast with success method', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('Success message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].message).toBe('Success message');
  });

  it('adds error toast with error method', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.error('Error message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('error');
    expect(result.current.toasts[0].message).toBe('Error message');
  });

  it('adds warning toast with warning method', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.warning('Warning message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('warning');
    expect(result.current.toasts[0].message).toBe('Warning message');
  });

  it('adds info toast with info method', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.info('Info message');
    });
    
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('info');
    expect(result.current.toasts[0].message).toBe('Info message');
  });

  it('accepts options with toast methods', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('Success with options', { 
        duration: 3000, 
        position: 'bottom-left' 
      });
    });
    
    expect(result.current.toasts[0].duration).toBe(3000);
    expect(result.current.toasts[0].position).toBe('bottom-left');
  });

  it('generates unique IDs for toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.success('First toast');
      result.current.error('Second toast');
    });
    
    expect(result.current.toasts).toHaveLength(2);
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
  });
});

describe('ToastContainer', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty container when no toasts', () => {
    render(<ToastContainer toasts={[]} onClose={mockOnClose} />);
    
    expect(screen.getByTestId('animate-presence')).toBeInTheDocument();
  });

  it('renders all toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Toast 1' },
      { id: '2', type: 'error' as const, message: 'Toast 2' },
    ];
    
    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);
    
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('passes onClose to each toast', () => {
    const toasts = [
      { id: '1', type: 'info' as const, message: 'Test toast' }
    ];
    
    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledWith('1');
  });
});