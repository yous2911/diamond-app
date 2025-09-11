export interface Student {
  id: number;
  prenom: string;
  nom: string;
  identifiant: string;
  classe: string;
  niveau: string;
  ageGroup: '6-8' | '9-11';
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  heartsRemaining: number;
  dateInscription: string;
  lastLogin: string;
  token?: string;
}

export interface Competence {
  id: number;
  code: string;
  nom: string;
  matiere: 'FR' | 'MA';
  domaine: string;
  niveauComp: number;
  sousCompetence: number;
  description: string;
  seuilMaitrise: number;
  xpReward: number;
}

export interface Exercise {
  id: number;
  competenceId: number;
  type: 'CALCUL' | 'MENTAL_MATH' | 'DRAG_DROP' | 'QCM' | 'LECTURE' | 'ECRITURE' | 'COMPREHENSION';
  question: string;
  correctAnswer: string;
  options?: any;
  difficultyLevel: number;
  xpReward: number;
  timeLimit: number;
  hintsAvailable: number;
  hintsText?: any;
  metadata?: any;
}

export interface StudentProgress {
  id: number;
  studentId: number;
  competenceId: number;
  status: 'not_started' | 'learning' | 'mastered' | 'failed';
  currentLevel: number;
  successRate: number;
  attemptsCount: number;
  correctAttempts: number;
  lastPracticeDate?: string;
  nextReviewDate?: string;
  repetitionNumber: number;
  easinessFactor: number;
  totalTimeSpent: number;
}

export interface Mascot {
  id: number;
  studentId: number;
  type: 'dragon' | 'fairy' | 'robot' | 'cat' | 'owl';
  currentEmotion: 'idle' | 'happy' | 'thinking' | 'celebrating' | 'oops';
  xpLevel: number;
  equippedItems: number[];
  aiState: any;
  lastInteraction?: string;
}

export interface WardrobeItem {
  id: number;
  name: string;
  type: 'hat' | 'clothing' | 'accessory' | 'shoes' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockRequirementType: 'xp' | 'streak' | 'exercises' | 'achievement';
  unlockRequirementValue: number;
  description: string;
  icon: string;
  isUnlocked?: boolean;
  isEquipped?: boolean;
  canUnlock?: boolean;
  progressToUnlock?: number;
}

export interface LearningSession {
  id: number;
  studentId: number;
  startedAt: string;
  endedAt?: string;
  exercisesCompleted: number;
  totalXpGained: number;
  performanceScore?: number;
  sessionDuration: number;
  competencesWorked: string[];
}

export interface Achievement {
  id: number;
  achievementCode: string;
  title: string;
  description: string;
  category: 'academic' | 'engagement' | 'progress' | 'social' | 'special';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  xpReward: number;
  badgeIconUrl: string;
  currentProgress: number;
  maxProgress: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface StudentStats {
    totalTime: number;
    totalExercises: number;
    successRate: number;
    currentStreak: number;
    longestStreak: number;
    achievements: number;
    level: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    token: string;
}
