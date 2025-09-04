// Export all components
export * from './exercises';
export * from './games';
export * from './ui';

// Core components
export { default as NextLevelXPSystem } from './NextLevelXPSystem';
export { default as LoginScreen } from './LoginScreen';
export { default as AdvancedMascotSystem } from './AdvancedMascotSystem';
export { default as AdvancedParticleEngine } from './AdvancedParticleEngine';

// Component categories
export const COMPONENT_CATEGORIES = {
  EXERCISES: 'exercises',
  GAMES: 'games',
  UI: 'ui',
  CORE: 'core'
} as const;

export type ComponentCategory = keyof typeof COMPONENT_CATEGORIES;
