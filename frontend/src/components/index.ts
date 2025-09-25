// Export all components
export * from './exercises';
// export * from './games'; // Directory doesn't exist
export * from './ui';

// Core components
export { default as NextLevelXPSystem } from './NextLevelXPSystem';
export { default as LoginScreen } from './LoginScreen';
export { default as MascotSystem } from './MascotSystem';
export { default as AdvancedParticleEngine } from './AdvancedParticleEngine';

// Component categories
export const COMPONENT_CATEGORIES = {
  EXERCISES: 'exercises',
  GAMES: 'games',
  UI: 'ui',
  CORE: 'core'
} as const;

export type ComponentCategory = keyof typeof COMPONENT_CATEGORIES;
