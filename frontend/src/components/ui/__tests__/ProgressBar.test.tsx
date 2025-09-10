import React from 'react';
import { render, screen } from '@testing-library/react';
import { 
  ProgressBar, 
  LevelProgressBar, 
  SkillProgressBar, 
  GameProgressBar, 
  AchievementProgressBar 
} from '../ProgressBar';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, transition, ...props }: any) => (
      <div 
        className={className} 
        data-testid="motion-div-progress"
        data-animate={JSON.stringify(animate)}
        {...props}
      >
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

describe('ProgressBar', () => {
  it('renders with default props', () => {
    render(<ProgressBar progress={50} />);
    
    const container = screen.getByRole('generic');
    expect(container).toBeInTheDocument();
  });

  it('clamps progress between 0 and 100', () => {
    const { rerender } = render(<ProgressBar progress={150} />);
    
    let progressBar = screen.getByTestId('motion-div');
    expect(JSON.parse(progressBar.getAttribute('data-animate') || '{}')).toEqual({ width: '100%' });

    rerender(<ProgressBar progress={-10} />);
    progressBar = screen.getByTestId('motion-div');
    expect(JSON.parse(progressBar.getAttribute('data-animate') || '{}')).toEqual({ width: '0%' });
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<ProgressBar progress={50} size="sm" />);
    expect(screen.getByRole('generic')).toHaveClass('h-2');

    rerender(<ProgressBar progress={50} size="md" />);
    expect(screen.getByRole('generic')).toHaveClass('h-4');

    rerender(<ProgressBar progress={50} size="lg" />);
    expect(screen.getByRole('generic')).toHaveClass('h-6');
  });

  it('applies correct color classes', () => {
    const { rerender } = render(<ProgressBar progress={50} color="blue" />);
    let motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('bg-blue-500');

    rerender(<ProgressBar progress={50} color="green" />);
    motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('bg-green-500');

    rerender(<ProgressBar progress={50} color="red" />);
    motionDiv = screen.getByTestId('motion-div');
    expect(motionDiv).toHaveClass('bg-red-500');
  });

  it('shows percentage when enabled and size is not sm', () => {
    render(<ProgressBar progress={75} showPercentage={true} size="md" />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides percentage when disabled', () => {
    render(<ProgressBar progress={75} showPercentage={false} />);
    
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('hides percentage for small size', () => {
    render(<ProgressBar progress={75} showPercentage={true} size="sm" />);
    
    expect(screen.queryByText('75%')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ProgressBar progress={50} className="custom-class" />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('custom-class');
  });

  it('applies glow effect when enabled', () => {
    render(<ProgressBar progress={50} glow={true} color="purple" />);
    
    const motionDiv = screen.getByTestId('motion-div-progress');
    expect(motionDiv).toHaveClass('shadow-lg', 'shadow-purple-500/50');
  });

  it('applies striped pattern when enabled', () => {
    render(<ProgressBar progress={50} striped={true} />);
    
    const motionDiv = screen.getByTestId('motion-div-progress');
    expect(motionDiv).toHaveClass('bg-striped');
  });

  it('shows success celebration at 100%', () => {
    render(<ProgressBar progress={100} animated={true} />);
    
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('does not show success celebration when not animated', () => {
    render(<ProgressBar progress={100} animated={false} />);
    
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });
});

describe('ProgressBar Presets', () => {
  it('LevelProgressBar has correct props', () => {
    render(<LevelProgressBar progress={60} />);
    
    const motionDiv = screen.getByTestId('motion-div-progress');
    expect(motionDiv).toHaveClass('bg-blue-500', 'shadow-lg');
  });

  it('SkillProgressBar has correct props', () => {
    render(<SkillProgressBar progress={70} />);
    
    const motionDiv = screen.getByTestId('motion-div-progress');
    expect(motionDiv).toHaveClass('bg-green-500', 'bg-striped');
  });

  it('GameProgressBar has correct props', () => {
    render(<GameProgressBar progress={80} />);
    
    const motionDiv = screen.getByTestId('motion-div-progress');
    expect(motionDiv).toHaveClass('bg-yellow-500', 'shadow-lg');
    expect(screen.getByRole('generic')).toHaveClass('h-6'); // lg size
  });

  it('AchievementProgressBar has correct props', () => {
    render(<AchievementProgressBar progress={90} />);
    
    const motionDiv = screen.getByTestId('motion-div-progress');
    expect(motionDiv).toHaveClass('bg-purple-500', 'shadow-lg', 'bg-striped');
  });
});