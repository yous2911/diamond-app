// Export all game components
export { default as MysteryWordGame } from './MysteryWordGame';
export { FrenchPhonicsGame } from './FrenchPhonicsGame';
export { EnhancedMathGame } from './EnhancedMathGame';

// Game type mapping
export const GAME_COMPONENTS = {
  MYSTERY_WORD: 'MysteryWordGame',
  FRENCH_PHONICS: 'FrenchPhonicsGame',
  ENHANCED_MATH: 'EnhancedMathGame'
} as const;

export type GameType = keyof typeof GAME_COMPONENTS;
