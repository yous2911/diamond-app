// Export all UI components
export { MagicalButton } from './MagicalButton';
export { default as XPCrystal } from './XPCrystal';
export { ProgressPortal } from './ProgressPortal';
export { Toast, useToast, ToastContainer } from './Toast';
export { AnimatedCard } from './AnimatedCard';
export { SparkleElements, MagicElements, CelebrationElements } from './FloatingElements';
export { ProgressBar } from './ProgressBar';

// UI component mapping
export const UI_COMPONENTS = {
  MAGICAL_BUTTON: 'MagicalButton',
  XP_CRYSTAL: 'XPCrystal',
  PROGRESS_PORTAL: 'ProgressPortal',
  TOAST: 'Toast',
  ANIMATED_CARD: 'AnimatedCard',
  FLOATING_ELEMENTS: 'FloatingElements',
  PROGRESS_BAR: 'ProgressBar'
} as const;

export type UIComponentType = keyof typeof UI_COMPONENTS;
