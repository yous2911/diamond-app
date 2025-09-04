// WahooEngine - Achievement and Feedback Engine
// Provides intelligent feedback and achievement tracking for educational games

export interface WahooFeedback {
  intensity: number; // 0-5 scale (SuperMemo levels)
  message: string;
  achievement?: string;
  xpReward: number;
  nextReview?: Date;
}

export interface AchievementData {
  type: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

class WahooEngine {
  private achievements: Map<string, AchievementData> = new Map();
  private userProgress: Map<string, number> = new Map();
  private lastReview: Map<string, Date> = new Map();

  constructor() {
    this.initializeAchievements();
  }

  private initializeAchievements() {
    // Mystery Word Game Achievements
    this.achievements.set('mystery_word_completed', {
      type: 'mystery_word_completed',
      title: 'Mot Mystère Résolu!',
      description: 'Tu as trouvé le mot mystère!',
      xpReward: 50,
      icon: '🔍',
      unlocked: false
    });

    this.achievements.set('mystery_word_streak', {
      type: 'mystery_word_streak',
      title: 'Série de Victoires!',
      description: 'Tu as résolu plusieurs mots d\'affilée!',
      xpReward: 100,
      icon: '🔥',
      unlocked: false
    });

    this.achievements.set('mystery_word_master', {
      type: 'mystery_word_master',
      title: 'Maître des Mots!',
      description: 'Tu as résolu 10 mots mystères!',
      xpReward: 200,
      icon: '👑',
      unlocked: false
    });

    // Math Game Achievements
    this.achievements.set('math_perfect', {
      type: 'math_perfect',
      title: 'Calcul Parfait!',
      description: 'Tu as réussi tous les exercices de math!',
      xpReward: 75,
      icon: '🧮',
      unlocked: false
    });

    // French Phonics Achievements
    this.achievements.set('phonics_expert', {
      type: 'phonics_expert',
      title: 'Expert en Phonétique!',
      description: 'Tu maîtrises les sons français!',
      xpReward: 80,
      icon: '🔤',
      unlocked: false
    });
  }

  // Evaluate user response and provide feedback
  evaluateResponse(isCorrect: boolean, difficulty: number): WahooFeedback {
    const skillKey = 'mystery_word';
    const currentProgress = this.userProgress.get(skillKey) || 0;
    
    if (isCorrect) {
      // Correct response - increase progress
      const newProgress = Math.min(100, currentProgress + (difficulty * 10));
      this.userProgress.set(skillKey, newProgress);
      
      // Calculate intensity based on SuperMemo algorithm
      const intensity = this.calculateIntensity(newProgress, difficulty);
      
      // Check for achievements
      const achievement = this.checkAchievements(skillKey, newProgress);
      
      return {
        intensity,
        message: this.getFeedbackMessage(intensity, true),
        achievement: achievement?.title,
        xpReward: achievement?.xpReward || 10,
        nextReview: this.calculateNextReview(intensity)
      };
    } else {
      // Incorrect response - decrease progress slightly
      const newProgress = Math.max(0, currentProgress - 5);
      this.userProgress.set(skillKey, newProgress);
      
      const intensity = this.calculateIntensity(newProgress, difficulty);
      
      return {
        intensity,
        message: this.getFeedbackMessage(intensity, false),
        xpReward: 0,
        nextReview: this.calculateNextReview(intensity)
      };
    }
  }

  // Calculate SuperMemo intensity level (0-5)
  private calculateIntensity(progress: number, difficulty: number): number {
    if (progress >= 90) return 5; // PERFECT
    if (progress >= 75) return 4; // EASY
    if (progress >= 60) return 3; // GOOD
    if (progress >= 40) return 2; // DIFFICULT
    if (progress >= 20) return 1; // HARD
    return 0; // BLACKOUT
  }

  // Get appropriate feedback message
  private getFeedbackMessage(intensity: number, isCorrect: boolean): string {
    if (isCorrect) {
      const messages = [
        'Continue comme ça!', // BLACKOUT
        'Bien joué!', // HARD
        'Excellent travail!', // DIFFICULT
        'Fantastique!', // GOOD
        'Incroyable!', // EASY
        'Parfait! Tu es un génie!' // PERFECT
      ];
      return messages[intensity];
    } else {
      const messages = [
        'Pas de panique, on va y arriver!', // BLACKOUT
        'C\'est difficile, mais tu peux le faire!', // HARD
        'Continue d\'essayer!', // DIFFICULT
        'Tu y es presque!', // GOOD
        'Presque parfait!', // EASY
        'Tu es excellent!' // PERFECT
      ];
      return messages[intensity];
    }
  }

  // Check for unlocked achievements
  private checkAchievements(skillKey: string, progress: number): AchievementData | undefined {
    if (skillKey === 'mystery_word') {
      if (progress >= 100) {
        const achievement = this.achievements.get('mystery_word_master');
        if (achievement && !achievement.unlocked) {
          achievement.unlocked = true;
          achievement.unlockedAt = new Date();
          return achievement;
        }
      }
    }
    return undefined;
  }

  // Calculate next review time based on SuperMemo algorithm
  private calculateNextReview(intensity: number): Date {
    const now = new Date();
    const intervals = [1, 6, 15, 30, 90, 180]; // Days for each intensity level
    const days = intervals[intensity] || 1;
    
    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + days);
    return nextReview;
  }

  // Get user progress for a specific skill
  getProgress(skillKey: string): number {
    return this.userProgress.get(skillKey) || 0;
  }

  // Get all achievements
  getAchievements(): AchievementData[] {
    return Array.from(this.achievements.values());
  }

  // Get unlocked achievements
  getUnlockedAchievements(): AchievementData[] {
    return Array.from(this.achievements.values()).filter(a => a.unlocked);
  }

  // Reset progress for testing
  resetProgress(): void {
    this.userProgress.clear();
    this.lastReview.clear();
    this.achievements.forEach(achievement => {
      achievement.unlocked = false;
      achievement.unlockedAt = undefined;
    });
  }
}

export const wahooEngine = new WahooEngine();
