// =============================================================================
// 🌐 GLOBAL TYPE DECLARATIONS - WINDOW EXTENSIONS
// =============================================================================

declare global {
  interface Window {
    triggerCorrectAnswer: (isPerfect: boolean, hasStreakBonus: boolean) => void;
    triggerLevelUp: (newLevel: number) => void;
  }
}

export {};
